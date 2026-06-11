'use client';

// ============================================================
// PreviewRuntime — プレビュー画面のランタイムレンダラー
// アクション実行(ClickFlow)・データバインディング・入力値管理を担う。
// app/builder/[id]/preview/page.tsx から利用される(lib/* は変更しない)。
// ============================================================

import React, { useRef, useState } from 'react';
import {
  resolveBinding,
  resolveTemplate,
  getRecordValue,
  fileToDataUrl,
} from '@/lib/runtime';
import type {
  AppUserSession,
  DBRecord,
  DBTable,
  Element,
} from '@/lib/types';

// ─────────────────────────────────────────────
// Toast(簡易通知オーバーレイ)
// ─────────────────────────────────────────────
export interface PreviewToast {
  id: number;
  msg: string;
  type: 'success' | 'error';
}

export function ToastOverlay({ toasts }: { toasts: PreviewToast[] }) {
  if (toasts.length === 0) return null;
  return (
    <div
      style={{
        position: 'absolute',
        top: 12,
        left: 0,
        right: 0,
        zIndex: 1000,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {toasts.map(t => (
        <div
          key={t.id}
          style={{
            maxWidth: '85%',
            padding: '8px 16px',
            borderRadius: 20,
            fontSize: 13,
            fontWeight: 500,
            color: '#ffffff',
            backgroundColor: t.type === 'error' ? '#ef4444' : '#1ec8a5',
            boxShadow: '0 4px 12px rgba(0,0,0,0.18)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─────────────────────────────────────────────
// RuntimeEnv — ページ側から注入されるランタイム文脈
// ─────────────────────────────────────────────
export interface RuntimeEnv {
  appId: string;
  tables: DBTable[];
  appUser: AppUserSession | null;
  /** elementId → 入力値 */
  formValues: Record<string, any>;
  setFormValue: (elementId: string, value: any) => void;
  /** navigate で持ち込まれた「現在のレコード」コンテキスト */
  currentRecord: DBRecord | null;
  currentTable: DBTable | null;
  /** element.actions を実行(record/table 指定でリスト項目コンテキスト) */
  runElementActions: (
    element: Element,
    record?: DBRecord | null,
    table?: DBTable | null,
  ) => void;
}

// ─────────────────────────────────────────────
// バインディング解決ヘルパー
// ─────────────────────────────────────────────
function asText(v: any): string {
  return v === undefined || v === null ? '' : String(v);
}

interface BoundItem {
  record: DBRecord;
  title: string;
  subtitle: string;
  caption: string;
  imageUrl?: string;
}

function getBoundList(
  element: Element,
  env: RuntimeEnv,
): { table: DBTable; items: BoundItem[] } | null {
  const b = element.dataBinding;
  if (!b?.tableId) return null;
  const { table, records } = resolveBinding(b, env.tables, { appUser: env.appUser });
  if (!table) return null;
  const fallbackTitleFieldId = table.fields[0]?.id;
  const items: BoundItem[] = records.map(record => {
    const titleRaw = b.titleFieldId
      ? getRecordValue(record, table, b.titleFieldId)
      : getRecordValue(record, table, fallbackTitleFieldId);
    const img = b.imageFieldId ? getRecordValue(record, table, b.imageFieldId) : undefined;
    return {
      record,
      title: asText(titleRaw),
      subtitle: asText(b.subtitleFieldId ? getRecordValue(record, table, b.subtitleFieldId) : undefined),
      caption: asText(b.captionFieldId ? getRecordValue(record, table, b.captionFieldId) : undefined),
      imageUrl: typeof img === 'string' && img ? img : undefined,
    };
  });
  return { table, items };
}

/** text / image 等の単一値バインド: 自テーブルバインド優先、なければカレントレコード */
function resolveSingleValue(element: Element, env: RuntimeEnv): any {
  const b = element.dataBinding;
  if (!b?.fieldId) return undefined;
  if (b.tableId) {
    const { table, records } = resolveBinding(b, env.tables, { appUser: env.appUser });
    if (table && records.length > 0) return getRecordValue(records[0], table, b.fieldId);
    return undefined;
  }
  if (env.currentRecord) return getRecordValue(env.currentRecord, env.currentTable, b.fieldId);
  return undefined;
}

const stop = (e: React.SyntheticEvent) => e.stopPropagation();

// ─────────────────────────────────────────────
// image-input / file-input(hooks が必要なため個別コンポーネント)
// ─────────────────────────────────────────────
function ImageInputElement({ element, env }: { element: Element; env: RuntimeEnv }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const s = element.style;
  const value = env.formValues[element.id];
  const src = typeof value === 'string' && value ? value : element.src;

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      env.setFormValue(element.id, dataUrl);
    } catch (err) {
      console.error('[preview] image-input failed:', err);
    }
  };

  return (
    <div
      className="w-full h-full cursor-pointer overflow-hidden"
      style={{ borderRadius: s.borderRadius ?? 0 }}
      onClick={e => {
        e.stopPropagation();
        inputRef.current?.click();
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onClick={stop}
        onChange={onChange}
      />
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={element.label ?? ''} className="w-full h-full object-cover" />
      ) : (
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-1"
          style={{ backgroundColor: s.backgroundColor ?? '#f3f4f6' }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span className="text-xs text-gray-400">画像を選択</span>
        </div>
      )}
    </div>
  );
}

function FileInputElement({ element, env }: { element: Element; env: RuntimeEnv }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const s = element.style;
  const hasValue = !!env.formValues[element.id];

  const onChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const dataUrl = await fileToDataUrl(file);
      env.setFormValue(element.id, dataUrl);
      setFileName(file.name);
    } catch (err) {
      console.error('[preview] file-input failed:', err);
    }
  };

  return (
    <div
      className="w-full h-full flex flex-col items-center justify-center gap-1 border-2 border-dashed cursor-pointer px-2"
      style={{
        borderColor: hasValue ? '#1ec8a5' : '#d1d5db',
        borderRadius: s.borderRadius ?? 8,
        backgroundColor: s.backgroundColor ?? '#f9fafb',
      }}
      onClick={e => {
        e.stopPropagation();
        inputRef.current?.click();
      }}
    >
      <input ref={inputRef} type="file" className="hidden" onClick={stop} onChange={onChange} />
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke={hasValue ? '#1ec8a5' : '#9ca3af'} strokeWidth="1.5">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="17 8 12 3 7 8" />
        <line x1="12" y1="3" x2="12" y2="15" />
      </svg>
      <span className={`text-xs truncate max-w-full ${hasValue ? 'text-gray-700' : 'text-gray-400'}`}>
        {fileName ?? 'ファイルを選択'}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// 要素コンテンツ(ランタイム版)
// ─────────────────────────────────────────────
function RuntimeElementContent({ element, env }: { element: Element; env: RuntimeEnv }) {
  const s = element.style;

  // リスト項目タップ → 詳細ページ遷移パターン
  const runItem = (e: React.MouseEvent, record: DBRecord, table: DBTable) => {
    e.stopPropagation();
    env.runElementActions(element, record, table);
  };

  switch (element.type) {
    case 'text': {
      const bound = resolveSingleValue(element, env);
      const content =
        bound !== undefined
          ? asText(bound)
          : resolveTemplate(element.content ?? 'テキスト', env.currentRecord, env.currentTable);
      return (
        <div
          className="w-full h-full flex items-center overflow-hidden"
          style={{
            color: s.color ?? '#1f2937',
            fontSize: s.fontSize ?? 16,
            fontWeight: s.fontWeight ?? 'normal',
            textAlign: s.textAlign ?? 'left',
            padding: s.padding ?? '0 4px',
          }}
        >
          {content}
        </div>
      );
    }

    case 'button':
      return (
        <div
          className="w-full h-full flex items-center justify-center cursor-pointer select-none"
          style={{
            backgroundColor: s.backgroundColor ?? '#1ec8a5',
            color: s.color ?? '#ffffff',
            fontSize: s.fontSize ?? 14,
            fontWeight: s.fontWeight ?? '500',
            borderRadius: s.borderRadius ?? 8,
          }}
        >
          {resolveTemplate(element.content ?? 'ボタン', env.currentRecord, env.currentTable)}
        </div>
      );

    case 'button2':
      return (
        <div
          className="w-full h-full flex items-center justify-center cursor-pointer select-none border"
          style={{
            backgroundColor: 'transparent',
            color: s.color ?? '#1ec8a5',
            borderColor: s.color ?? '#1ec8a5',
            fontSize: s.fontSize ?? 14,
            fontWeight: s.fontWeight ?? '500',
            borderRadius: s.borderRadius ?? 8,
          }}
        >
          {resolveTemplate(element.content ?? 'ボタン2', env.currentRecord, env.currentTable)}
        </div>
      );

    case 'input':
      return (
        <input
          type="text"
          placeholder={element.placeholder ?? 'テキストを入力'}
          value={asText(env.formValues[element.id] ?? '')}
          onChange={e => env.setFormValue(element.id, e.target.value)}
          onClick={stop}
          className="w-full h-full px-3 border outline-none focus:border-brand"
          style={{
            backgroundColor: s.backgroundColor ?? '#ffffff',
            borderColor: '#d1d5db',
            borderRadius: s.borderRadius ?? 8,
            fontSize: s.fontSize ?? 14,
            color: s.color ?? '#1f2937',
          }}
        />
      );

    case 'password-input':
      return (
        <input
          type="password"
          placeholder={element.placeholder ?? 'パスワードを入力'}
          value={asText(env.formValues[element.id] ?? '')}
          onChange={e => env.setFormValue(element.id, e.target.value)}
          onClick={stop}
          className="w-full h-full px-3 border outline-none focus:border-brand"
          style={{
            backgroundColor: s.backgroundColor ?? '#ffffff',
            borderColor: '#d1d5db',
            borderRadius: s.borderRadius ?? 8,
            fontSize: s.fontSize ?? 14,
          }}
        />
      );

    case 'date-input':
      return (
        <input
          type="date"
          value={asText(env.formValues[element.id] ?? '')}
          onChange={e => env.setFormValue(element.id, e.target.value)}
          onClick={stop}
          className="w-full h-full px-3 border outline-none focus:border-brand"
          style={{
            backgroundColor: s.backgroundColor ?? '#ffffff',
            borderColor: '#d1d5db',
            borderRadius: s.borderRadius ?? 8,
            fontSize: s.fontSize ?? 14,
          }}
        />
      );

    case 'shape':
      return (
        <div
          className="w-full h-full"
          style={{
            backgroundColor: s.backgroundColor ?? '#e5e7eb',
            borderRadius: s.borderRadius ?? 8,
            border: s.border,
          }}
        />
      );

    case 'image': {
      const bound = resolveSingleValue(element, env);
      const src = typeof bound === 'string' && bound ? bound : element.src;
      return src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={element.label ?? ''}
          className="w-full h-full object-cover"
          style={{ borderRadius: s.borderRadius ?? 0 }}
        />
      ) : (
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-1"
          style={{ backgroundColor: s.backgroundColor ?? '#f3f4f6', borderRadius: s.borderRadius ?? 0 }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span className="text-xs text-gray-400">画像</span>
        </div>
      );
    }

    case 'image-input':
      return <ImageInputElement element={element} env={env} />;

    case 'file-input':
      return <FileInputElement element={element} env={env} />;

    case 'video':
      return (
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-1"
          style={{ backgroundColor: s.backgroundColor ?? '#1f2937', borderRadius: s.borderRadius ?? 0 }}
        >
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          <span className="text-xs text-gray-400">ビデオ</span>
        </div>
      );

    case 'icon':
      return (
        <div className="w-full h-full flex items-center justify-center">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke={s.color ?? '#1ec8a5'} strokeWidth="1.5">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        </div>
      );

    case 'line':
      return (
        <div
          className="w-full"
          style={{
            borderTop: `${s.borderWidth ?? 1}px solid ${s.borderColor ?? '#d1d5db'}`,
            marginTop: '50%',
          }}
        />
      );

    case 'header':
      return (
        <div
          className="w-full h-full flex items-center px-4 border-b"
          style={{
            backgroundColor: s.backgroundColor ?? '#ffffff',
            borderColor: '#e5e7eb',
          }}
        >
          <span className="font-semibold text-gray-800 text-base">
            {resolveTemplate(element.content ?? 'ヘッダー', env.currentRecord, env.currentTable)}
          </span>
        </div>
      );

    case 'tabbar':
      return (
        <div
          className="w-full h-full flex items-center border-t"
          style={{
            backgroundColor: s.backgroundColor ?? '#ffffff',
            borderColor: '#e5e7eb',
          }}
        >
          {['ホーム', '検索', '設定'].map((label, i) => (
            <div key={i} className="flex-1 flex flex-col items-center justify-center gap-0.5 py-1">
              <div className="w-5 h-5 rounded bg-gray-200" />
              <span className="text-[10px] text-gray-500">{label}</span>
            </div>
          ))}
        </div>
      );

    case 'list': {
      const bound = getBoundList(element, env);
      if (bound) {
        return (
          <div
            className="w-full h-full overflow-y-auto"
            style={{ backgroundColor: s.backgroundColor ?? '#ffffff', borderRadius: s.borderRadius ?? 0 }}
          >
            {bound.items.map(it => (
              <div
                key={it.record.id}
                onClick={e => runItem(e, it.record, bound.table)}
                className="flex items-center gap-3 px-4 py-3 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
              >
                {it.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.imageUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-800 truncate">{it.title || '(無題)'}</div>
                  {it.subtitle && <div className="text-xs text-gray-500 truncate">{it.subtitle}</div>}
                </div>
                {it.caption && <div className="text-[11px] text-gray-400 flex-shrink-0">{it.caption}</div>}
              </div>
            ))}
            {bound.items.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-gray-400">データがありません</div>
            )}
          </div>
        );
      }
      return (
        <div
          className="w-full h-full overflow-hidden"
          style={{ backgroundColor: s.backgroundColor ?? '#ffffff', borderRadius: s.borderRadius ?? 0 }}
        >
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
              <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-gray-200 rounded w-3/4" />
                <div className="h-2 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    case 'card-list': {
      const bound = getBoundList(element, env);
      if (bound) {
        return (
          <div
            className="w-full h-full overflow-y-auto space-y-2 p-2"
            style={{ backgroundColor: s.backgroundColor ?? '#f9fafb', borderRadius: s.borderRadius ?? 8 }}
          >
            {bound.items.map(it => (
              <div
                key={it.record.id}
                onClick={e => runItem(e, it.record, bound.table)}
                className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 shadow-sm cursor-pointer hover:shadow"
              >
                {it.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gray-200 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-800 truncate">{it.title || '(無題)'}</div>
                  {it.subtitle && <div className="text-xs text-gray-500 truncate">{it.subtitle}</div>}
                </div>
                {it.caption && <div className="text-[11px] text-gray-400 flex-shrink-0">{it.caption}</div>}
              </div>
            ))}
            {bound.items.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-gray-400">データがありません</div>
            )}
          </div>
        );
      }
      return (
        <div className="w-full h-full overflow-hidden space-y-2 p-2" style={{ backgroundColor: s.backgroundColor ?? '#f9fafb', borderRadius: s.borderRadius ?? 8 }}>
          {[1, 2].map(i => (
            <div key={i} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-gray-200 rounded w-2/3" />
                <div className="h-2 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      );
    }

    case 'custom-list': {
      const bound = getBoundList(element, env);
      if (bound) {
        return (
          <div
            className="w-full h-full overflow-y-auto"
            style={{ backgroundColor: s.backgroundColor ?? '#ffffff', borderRadius: s.borderRadius ?? 0 }}
          >
            {bound.items.map(it => (
              <div
                key={it.record.id}
                onClick={e => runItem(e, it.record, bound.table)}
                className="flex items-center gap-2 px-3 py-2 border-b border-gray-100 cursor-pointer hover:bg-gray-50"
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#1ec8a5' }} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-800 truncate">{it.title || '(無題)'}</div>
                  {it.subtitle && <div className="text-xs text-gray-500 truncate">{it.subtitle}</div>}
                </div>
                {it.caption && <div className="text-[11px] text-gray-400 flex-shrink-0">{it.caption}</div>}
              </div>
            ))}
            {bound.items.length === 0 && (
              <div className="px-4 py-6 text-center text-xs text-gray-400">データがありません</div>
            )}
          </div>
        );
      }
      return (
        <div className="w-full h-full overflow-hidden" style={{ backgroundColor: s.backgroundColor ?? '#ffffff', borderRadius: s.borderRadius ?? 0 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#1ec8a5' }} />
              <div className="h-3 bg-gray-200 rounded flex-1" />
            </div>
          ))}
        </div>
      );
    }

    case 'horizontal-list': {
      const bound = getBoundList(element, env);
      if (bound) {
        return (
          <div
            className="w-full h-full flex items-start gap-3 px-3 py-2 overflow-x-auto"
            style={{ backgroundColor: s.backgroundColor ?? '#ffffff', borderRadius: s.borderRadius ?? 0 }}
          >
            {bound.items.map(it => (
              <div
                key={it.record.id}
                onClick={e => runItem(e, it.record, bound.table)}
                className="flex-shrink-0 w-20 cursor-pointer"
              >
                {it.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.imageUrl} alt="" className="w-20 h-20 rounded-lg object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                    <span className="text-xs text-gray-500 px-1 truncate">{it.title.slice(0, 4)}</span>
                  </div>
                )}
                <div className="text-[10px] text-gray-600 truncate mt-1 text-center">{it.title}</div>
              </div>
            ))}
            {bound.items.length === 0 && (
              <div className="w-full text-center text-xs text-gray-400 py-6">データがありません</div>
            )}
          </div>
        );
      }
      return (
        <div
          className="w-full h-full flex items-center gap-3 px-3 overflow-hidden"
          style={{ backgroundColor: s.backgroundColor ?? '#ffffff', borderRadius: s.borderRadius ?? 0 }}
        >
          {[1, 2, 3].map(i => (
            <div key={i} className="flex-shrink-0 w-20 h-20 rounded-lg bg-gray-200" />
          ))}
        </div>
      );
    }

    case 'tag-list': {
      const bound = getBoundList(element, env);
      if (bound) {
        return (
          <div className="w-full h-full flex flex-wrap gap-1.5 items-start content-start p-2 overflow-y-auto" style={{ backgroundColor: s.backgroundColor ?? 'transparent' }}>
            {bound.items.map(it => (
              <div
                key={it.record.id}
                onClick={e => runItem(e, it.record, bound.table)}
                className="px-2 py-0.5 rounded-full text-[11px] font-medium cursor-pointer"
                style={{ backgroundColor: '#1ec8a522', color: '#1ec8a5' }}
              >
                {it.title || '(無題)'}
              </div>
            ))}
            {bound.items.length === 0 && (
              <div className="w-full text-center text-xs text-gray-400 py-4">データがありません</div>
            )}
          </div>
        );
      }
      return (
        <div className="w-full h-full flex flex-wrap gap-1.5 items-start content-start p-2" style={{ backgroundColor: s.backgroundColor ?? 'transparent' }}>
          {['タグ1', 'タグ2', 'タグ3', 'タグ4'].map(tag => (
            <div key={tag} className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ backgroundColor: '#1ec8a522', color: '#1ec8a5' }}>{tag}</div>
          ))}
        </div>
      );
    }

    case 'avatar-list': {
      const bound = getBoundList(element, env);
      if (bound) {
        const shown = bound.items.slice(0, 6);
        const rest = bound.items.length - shown.length;
        return (
          <div className="w-full h-full flex items-center px-2">
            {shown.map((it, i) => (
              <div
                key={it.record.id}
                onClick={e => runItem(e, it.record, bound.table)}
                className="w-8 h-8 rounded-full border-2 border-white bg-gray-300 flex-shrink-0 flex items-center justify-center text-xs font-semibold text-gray-600 overflow-hidden cursor-pointer"
                style={{ marginLeft: i > 0 ? -8 : 0, zIndex: 10 - i }}
                title={it.title}
              >
                {it.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  (it.title || '?').slice(0, 1)
                )}
              </div>
            ))}
            {rest > 0 && <span className="ml-3 text-xs text-gray-500">+{rest}</span>}
            {bound.items.length === 0 && <span className="text-xs text-gray-400">データがありません</span>}
          </div>
        );
      }
      return (
        <div className="w-full h-full flex items-center px-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-300 flex-shrink-0 flex items-center justify-center text-xs font-semibold text-gray-600" style={{ marginLeft: i > 1 ? -8 : 0, zIndex: 10 - i }}>
              {i}
            </div>
          ))}
          <span className="ml-3 text-xs text-gray-500">+12</span>
        </div>
      );
    }

    case 'carousel': {
      const bound = getBoundList(element, env);
      if (bound && bound.items.length > 0) {
        return (
          <div
            className="w-full h-full flex overflow-x-auto snap-x snap-mandatory"
            style={{ backgroundColor: s.backgroundColor ?? '#f3f4f6', borderRadius: s.borderRadius ?? 8 }}
          >
            {bound.items.map(it => (
              <div
                key={it.record.id}
                onClick={e => runItem(e, it.record, bound.table)}
                className="flex-shrink-0 w-full h-full snap-center relative cursor-pointer"
              >
                {it.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200">
                    <span className="text-sm text-gray-500">{it.title || '(無題)'}</span>
                  </div>
                )}
                {it.title && it.imageUrl && (
                  <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5 text-xs text-white truncate" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.55))' }}>
                    {it.title}
                  </div>
                )}
              </div>
            ))}
          </div>
        );
      }
      return (
        <div
          className="w-full h-full flex items-center justify-center relative overflow-hidden"
          style={{ backgroundColor: s.backgroundColor ?? '#f3f4f6', borderRadius: s.borderRadius ?? 8 }}
        >
          <div className="text-xs text-gray-400">カルーセル</div>
          <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-1">
            {[0, 1, 2].map(i => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: i === 0 ? '#1ec8a5' : '#d1d5db' }}
              />
            ))}
          </div>
        </div>
      );
    }

    case 'db-table': {
      const bound = getBoundList(element, env);
      if (bound) {
        const fields = bound.table.fields.slice(0, 4);
        return (
          <div
            className="w-full h-full overflow-auto"
            style={{ backgroundColor: s.backgroundColor ?? '#ffffff', borderRadius: s.borderRadius ?? 0 }}
          >
            <div className="flex border-b border-gray-200 bg-gray-50 sticky top-0">
              {fields.map(f => (
                <div key={f.id} className="flex-1 text-[10px] font-semibold text-gray-500 px-2 py-1.5 truncate">{f.name}</div>
              ))}
            </div>
            {bound.items.map(it => (
              <div
                key={it.record.id}
                onClick={e => runItem(e, it.record, bound.table)}
                className="flex border-b border-gray-100 cursor-pointer hover:bg-gray-50"
              >
                {fields.map(f => (
                  <div key={f.id} className="flex-1 text-[10px] text-gray-600 px-2 py-1.5 truncate">
                    {asText(it.record.values[f.id])}
                  </div>
                ))}
              </div>
            ))}
            {bound.items.length === 0 && (
              <div className="px-4 py-4 text-center text-xs text-gray-400">データがありません</div>
            )}
          </div>
        );
      }
      return (
        <div
          className="w-full h-full overflow-hidden"
          style={{ backgroundColor: s.backgroundColor ?? '#ffffff', borderRadius: s.borderRadius ?? 0 }}
        >
          <div className="flex border-b border-gray-200 bg-gray-50">
            {['ID', '名前', '値'].map(h => (
              <div key={h} className="flex-1 text-[10px] font-semibold text-gray-500 px-2 py-1.5 truncate">{h}</div>
            ))}
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="flex border-b border-gray-100">
              {[String(i), `レコード${i}`, `値${i}`].map((v, j) => (
                <div key={j} className="flex-1 text-[10px] text-gray-600 px-2 py-1.5 truncate">{v}</div>
              ))}
            </div>
          ))}
        </div>
      );
    }

    case 'dropdown': {
      const bound = getBoundList(element, env);
      if (bound) {
        const b = element.dataBinding!;
        const valueFieldId = b.fieldId ?? b.titleFieldId ?? bound.table.fields[0]?.id;
        const value = asText(env.formValues[element.id] ?? '');
        return (
          <select
            value={value}
            onChange={e => env.setFormValue(element.id, e.target.value)}
            onClick={stop}
            className="w-full h-full px-3 border outline-none focus:border-brand cursor-pointer"
            style={{
              backgroundColor: s.backgroundColor ?? '#ffffff',
              borderColor: '#d1d5db',
              borderRadius: s.borderRadius ?? 8,
              fontSize: s.fontSize ?? 14,
              color: value ? (s.color ?? '#1f2937') : '#9ca3af',
            }}
          >
            <option value="">{element.placeholder ?? '選択してください'}</option>
            {bound.items.map(it => {
              const opt = asText(getRecordValue(it.record, bound.table, valueFieldId));
              return (
                <option key={it.record.id} value={opt}>
                  {opt || '(空)'}
                </option>
              );
            })}
          </select>
        );
      }
      return (
        <div
          className="w-full h-full flex items-center justify-between px-3 border cursor-pointer"
          style={{
            backgroundColor: s.backgroundColor ?? '#ffffff',
            borderColor: '#d1d5db',
            borderRadius: s.borderRadius ?? 8,
          }}
        >
          <span className="text-sm text-gray-400">{element.placeholder ?? '選択してください'}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      );
    }

    case 'calendar':
      return (
        <div
          className="w-full h-full overflow-hidden p-2"
          style={{ backgroundColor: s.backgroundColor ?? '#ffffff', borderRadius: s.borderRadius ?? 8 }}
        >
          <div className="text-xs font-semibold text-gray-700 mb-2 text-center">2024年1月</div>
          <div className="grid grid-cols-7 gap-0.5">
            {['日', '月', '火', '水', '木', '金', '土'].map(d => (
              <div key={d} className="text-[9px] text-gray-400 text-center">{d}</div>
            ))}
            {Array.from({ length: 31 }, (_, i) => (
              <div
                key={i}
                className="text-[9px] text-center rounded py-0.5 cursor-pointer hover:bg-gray-100"
                style={i + 1 === 15 ? { backgroundColor: '#1ec8a5', color: '#fff' } : { color: '#4b5563' }}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      );

    case 'form':
      return (
        <div
          className="w-full h-full overflow-hidden p-3 space-y-2"
          style={{ backgroundColor: s.backgroundColor ?? '#ffffff', borderRadius: s.borderRadius ?? 8 }}
        >
          <div>
            <div className="text-[10px] text-gray-500 mb-0.5">名前</div>
            <input
              type="text"
              placeholder="入力してください"
              value={asText(env.formValues[`${element.id}:name`] ?? '')}
              onChange={e => env.setFormValue(`${element.id}:name`, e.target.value)}
              onClick={stop}
              className="w-full h-8 border border-gray-200 rounded px-2 text-xs text-gray-600 outline-none focus:border-brand"
            />
          </div>
          <div>
            <div className="text-[10px] text-gray-500 mb-0.5">メール</div>
            <input
              type="text"
              placeholder="入力してください"
              value={asText(env.formValues[element.id] ?? '')}
              onChange={e => env.setFormValue(element.id, e.target.value)}
              onClick={stop}
              className="w-full h-8 border border-gray-200 rounded px-2 text-xs text-gray-600 outline-none focus:border-brand"
            />
          </div>
          <button
            className="w-full h-8 rounded text-xs text-white font-medium"
            style={{ backgroundColor: '#1ec8a5' }}
            onClick={e => {
              e.stopPropagation();
              env.runElementActions(element);
            }}
          >
            送信
          </button>
        </div>
      );

    case 'search-element':
      return (
        <div
          className="w-full h-full flex items-center gap-2 px-3 border"
          style={{
            backgroundColor: s.backgroundColor ?? '#f9fafb',
            borderColor: '#e5e7eb',
            borderRadius: s.borderRadius ?? 20,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder={element.placeholder ?? '検索...'}
            value={asText(env.formValues[element.id] ?? '')}
            onChange={e => env.setFormValue(element.id, e.target.value)}
            onClick={stop}
            className="flex-1 bg-transparent outline-none text-sm text-gray-600 placeholder-gray-400"
          />
        </div>
      );

    case 'switch-element': {
      const on = !!env.formValues[element.id];
      return (
        <div
          className="w-full h-full flex items-center justify-between px-2 cursor-pointer"
          onClick={e => {
            e.stopPropagation();
            env.setFormValue(element.id, !on);
          }}
        >
          <span className="text-sm text-gray-700">{element.label ?? 'スイッチ'}</span>
          <div
            className="w-10 h-6 rounded-full flex items-center px-0.5 transition-colors"
            style={{ backgroundColor: on ? '#1ec8a5' : '#d1d5db' }}
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow transition-all ${on ? 'ml-auto' : ''}`} />
          </div>
        </div>
      );
    }

    case 'toggle-element': {
      const on = !!env.formValues[element.id];
      return (
        <div
          className="w-full h-full flex items-center justify-between px-2 cursor-pointer"
          onClick={e => {
            e.stopPropagation();
            env.setFormValue(element.id, !on);
          }}
        >
          <span className="text-sm text-gray-700">{element.label ?? 'トグル'}</span>
          <div className="w-8 h-8 border-2 rounded flex items-center justify-center" style={{ borderColor: '#1ec8a5' }}>
            {on && <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#1ec8a5' }} />}
          </div>
        </div>
      );
    }

    case 'check': {
      const checked = !!env.formValues[element.id];
      return (
        <div
          className="w-full h-full flex items-center gap-2 px-2 cursor-pointer"
          onClick={e => {
            e.stopPropagation();
            env.setFormValue(element.id, !checked);
          }}
        >
          <div
            className="w-5 h-5 flex-shrink-0 rounded flex items-center justify-center border"
            style={
              checked
                ? { backgroundColor: '#1ec8a5', borderColor: '#1ec8a5' }
                : { backgroundColor: '#ffffff', borderColor: '#d1d5db' }
            }
          >
            {checked && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
          </div>
          <span className="text-sm" style={{ color: s.color ?? '#374151' }}>{element.label ?? 'チェック項目'}</span>
        </div>
      );
    }

    case 'star-rating': {
      const rating = Number(env.formValues[element.id] ?? 0);
      return (
        <div className="w-full h-full flex items-center justify-center gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <svg
              key={i}
              width="20"
              height="20"
              viewBox="0 0 24 24"
              className="cursor-pointer"
              fill={i <= rating ? (s.color ?? '#f59e0b') : 'none'}
              stroke={s.color ?? '#f59e0b'}
              strokeWidth="1.5"
              onClick={e => {
                e.stopPropagation();
                env.setFormValue(element.id, i);
              }}
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          ))}
        </div>
      );
    }

    case 'stack-carousel':
      return (
        <div className="w-full h-full relative flex items-center justify-center overflow-hidden" style={{ backgroundColor: s.backgroundColor ?? '#f3f4f6', borderRadius: s.borderRadius ?? 12 }}>
          <div className="absolute inset-4 rounded-lg bg-gray-300 opacity-50" style={{ transform: 'rotate(3deg)' }} />
          <div className="absolute inset-3 rounded-lg bg-gray-200 opacity-70" style={{ transform: 'rotate(-2deg)' }} />
          <div className="absolute inset-2 rounded-lg bg-white shadow flex items-center justify-center">
            <span className="text-xs text-gray-400">スタック</span>
          </div>
        </div>
      );

    case 'barcode':
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2" style={{ backgroundColor: s.backgroundColor ?? '#ffffff', borderRadius: s.borderRadius ?? 0 }}>
          <div className="flex items-end gap-px h-10">
            {Array.from({ length: 28 }, (_, i) => (
              <div key={i} className="bg-gray-800" style={{ width: i % 3 === 0 ? 3 : 2, height: i % 5 === 0 ? '100%' : i % 2 === 0 ? '80%' : '90%' }} />
            ))}
          </div>
          <span className="text-[10px] tracking-widest text-gray-600">123456789</span>
        </div>
      );

    case 'qr-code':
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1" style={{ backgroundColor: s.backgroundColor ?? '#ffffff', borderRadius: s.borderRadius ?? 0 }}>
          <div className="grid grid-cols-5 gap-px p-1 bg-white">
            {Array.from({ length: 25 }, (_, i) => (
              <div key={i} className="w-3 h-3" style={{ backgroundColor: [0, 1, 2, 5, 6, 7, 10, 12, 17, 18, 19, 20, 21, 23, 24].includes(i) ? '#1f2937' : '#ffffff' }} />
            ))}
          </div>
          <span className="text-[9px] text-gray-400">QRコード</span>
        </div>
      );

    case 'line-social':
      return (
        <div className="w-full h-full flex items-center justify-center rounded" style={{ backgroundColor: s.backgroundColor ?? '#06C755', borderRadius: s.borderRadius ?? 8 }}>
          <span className="text-white font-bold text-sm">LINE でログイン</span>
        </div>
      );

    case 'map-element':
      return (
        <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: '#e5e7eb', borderRadius: s.borderRadius ?? 0 }}>
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(#9ca3af 1px, transparent 1px), linear-gradient(90deg, #9ca3af 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#ef4444" stroke="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
              </svg>
              <span className="text-[10px] text-gray-600 font-medium bg-white px-1 rounded">地図</span>
            </div>
          </div>
        </div>
      );

    case 'web-view':
      return (
        <div className="w-full h-full overflow-hidden" style={{ backgroundColor: '#ffffff', borderRadius: s.borderRadius ?? 0 }}>
          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-100 border-b border-gray-200">
            <div className="flex gap-1">
              {['#ef4444', '#f59e0b', '#22c55e'].map(c => (
                <div key={c} className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
              ))}
            </div>
            <div className="flex-1 h-4 bg-white rounded-sm border border-gray-200 flex items-center px-1">
              <span className="text-[9px] text-gray-400 truncate">{element.href ?? 'https://example.com'}</span>
            </div>
          </div>
          <div className="p-2 space-y-1.5">
            <div className="h-3 bg-gray-200 rounded w-3/4" />
            <div className="h-2 bg-gray-100 rounded w-full" />
          </div>
        </div>
      );

    case 'youtube-element':
      return (
        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#000', borderRadius: s.borderRadius ?? 0 }}>
          <div className="w-12 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3" /></svg>
          </div>
        </div>
      );

    case 'vimeo-element':
      return (
        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#1ab7ea', borderRadius: s.borderRadius ?? 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M22 7.42c-.09 2.01-1.49 4.76-4.2 8.24C15.02 19.2 12.65 21 10.6 21c-1.26 0-2.33-1.16-3.2-3.49l-1.74-6.38C5.03 8.8 4.34 7.64 3.6 7.64c-.16 0-.71.33-1.66.99L1 7.51c1.04-.92 2.07-1.83 3.08-2.76C5.5 3.52 6.55 2.88 7.24 2.8c1.66-.16 2.68.97 3.07 3.4.41 2.62.7 4.25.86 4.9.48 2.16 1 3.24 1.55 3.24.44 0 1.1-.69 1.98-2.08.88-1.39 1.35-2.44 1.41-3.17.12-1.2-.34-1.8-1.41-1.8-.5 0-1.02.11-1.55.34.97-3.15 2.8-4.68 5.53-4.6C20.6 3.11 22.12 4.56 22 7.42z" />
          </svg>
        </div>
      );

    case 'stamp-element':
      return (
        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: s.backgroundColor ?? 'transparent' }}>
          <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center" style={{ borderColor: s.color ?? '#1ec8a5' }}>
            <span className="text-[11px] font-bold" style={{ color: s.color ?? '#1ec8a5' }}>STAMP</span>
          </div>
        </div>
      );

    case 'stamp-card':
      return (
        <div className="w-full h-full overflow-hidden p-2" style={{ backgroundColor: s.backgroundColor ?? '#fff8e6', borderRadius: s.borderRadius ?? 12 }}>
          <div className="text-[10px] font-semibold text-gray-600 mb-1.5">スタンプカード</div>
          <div className="grid grid-cols-5 gap-1">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="aspect-square rounded-full flex items-center justify-center border-2" style={{ borderColor: i < 4 ? '#1ec8a5' : '#e5e7eb', backgroundColor: i < 4 ? '#1ec8a5' : 'transparent' }}>
                {i < 4 && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
              </div>
            ))}
          </div>
        </div>
      );

    case 'lottie-element':
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1" style={{ backgroundColor: s.backgroundColor ?? 'transparent' }}>
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 opacity-30" style={{ borderColor: '#1ec8a5', animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite' }} />
            <div className="absolute inset-2 rounded-full" style={{ backgroundColor: '#1ec8a5', opacity: 0.6 }} />
          </div>
          <span className="text-[10px] text-gray-400">Lottie</span>
        </div>
      );

    case 'chat-element':
      return (
        <div className="w-full h-full overflow-hidden p-2 space-y-2" style={{ backgroundColor: s.backgroundColor ?? '#f9fafb', borderRadius: s.borderRadius ?? 8 }}>
          <div className="flex items-end gap-1.5">
            <div className="w-6 h-6 rounded-full bg-gray-300 flex-shrink-0" />
            <div className="max-w-[70%] bg-white rounded-2xl rounded-bl-sm px-2.5 py-1.5 shadow-sm">
              <div className="h-2 bg-gray-200 rounded w-20" />
            </div>
          </div>
          <div className="flex items-end gap-1.5 justify-end">
            <div className="max-w-[70%] rounded-2xl rounded-br-sm px-2.5 py-1.5" style={{ backgroundColor: '#1ec8a5' }}>
              <div className="h-2 rounded w-16" style={{ backgroundColor: 'rgba(255,255,255,0.5)' }} />
            </div>
          </div>
        </div>
      );

    default:
      return (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ backgroundColor: s.backgroundColor ?? '#f3f4f6' }}
        >
          <span className="text-xs text-gray-400">{element.type}</span>
        </div>
      );
  }
}

// ─────────────────────────────────────────────
// RuntimeElement — 絶対配置ラッパー + クリック→アクション
// ─────────────────────────────────────────────

/** リスト系(項目単位でアクションを実行するためコンテナクリックは無効) */
const LIST_TYPES = new Set<Element['type']>([
  'list', 'card-list', 'custom-list', 'horizontal-list', 'tag-list',
  'avatar-list', 'carousel', 'stack-carousel', 'db-table',
]);

/** 入力系(クリックは入力操作なのでコンテナクリックでアクションを発火しない) */
const INPUT_TYPES = new Set<Element['type']>([
  'input', 'password-input', 'date-input', 'file-input', 'image-input',
  'dropdown', 'switch-element', 'toggle-element', 'check', 'form',
  'search-element', 'star-rating',
]);

export function RuntimeElement({ element, env }: { element: Element; env: RuntimeEnv }) {
  if (element.visible === false) return null;

  const s = element.style;
  const hasActions = !!element.actions && element.actions.length > 0;
  const clickable = hasActions && !LIST_TYPES.has(element.type) && !INPUT_TYPES.has(element.type);

  const handleClick = clickable
    ? (e: React.MouseEvent) => {
        e.stopPropagation();
        env.runElementActions(element);
      }
    : undefined;

  const isInteractive =
    element.type === 'button' || element.type === 'button2' || clickable;

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'absolute',
        left: s.x ?? 0,
        top: s.y ?? 0,
        width: typeof s.width === 'number' ? s.width : (s.width ?? 'auto'),
        height: typeof s.height === 'number' ? s.height : (s.height ?? 'auto'),
        opacity: s.opacity !== undefined ? s.opacity / 100 : 1,
        zIndex: s.zIndex ?? 1,
        cursor: isInteractive ? 'pointer' : 'default',
      }}
    >
      <RuntimeElementContent element={element} env={env} />
    </div>
  );
}
