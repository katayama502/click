'use client';

/* eslint-disable @next/next/no-img-element */

import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '@/lib/store';
import type {
  Action,
  AppUserSession,
  DataBinding,
  DBRecord,
  DBTable,
  Element,
  Page,
} from '@/lib/types';
import {
  runActions,
  type ActionContext,
  getAppUserSession,
  resolveBinding,
  resolveTemplate,
  getRecordValue,
  getFieldByName,
  resolveStartPage,
  fileToDataUrl,
} from '@/lib/runtime';

// ─── Runtime bundle passed down to element renderers ────────────────────────

interface PublicRuntime {
  tables: DBTable[];
  appUser: AppUserSession | null;
  formValues: Record<string, any>;
  setFormValue: (elementId: string, value: any) => void;
  fileNames: Record<string, string>;
  setFileName: (elementId: string, name: string) => void;
  /** アクション実行。item はリスト項目タップ時のレコードコンテキスト */
  run: (
    actions: Action[] | undefined,
    item?: { record: DBRecord; table: DBTable | null },
  ) => void;
  /** 詳細ページコンテキスト(navigate 時に引き継いだレコード) */
  pageRecord: DBRecord | null;
  pageTable: DBTable | null;
}

// ─── Binding display helpers ─────────────────────────────────────────────────

function bindingValue(
  record: DBRecord,
  table: DBTable | null,
  fieldId: string | undefined,
): string {
  const v = getRecordValue(record, table, fieldId);
  return v === undefined || v === null ? '' : String(v);
}

/** titleFieldId 未設定時は Name フィールド → 先頭 text フィールドにフォールバック */
function bindingTitle(
  record: DBRecord,
  table: DBTable | null,
  b: DataBinding | undefined,
): string {
  let v = getRecordValue(record, table, b?.titleFieldId);
  if (v === undefined || v === null || v === '') {
    const fallbackField =
      getFieldByName(table, 'Name') ??
      table?.fields.find(f => f.type === 'text') ??
      table?.fields?.[0];
    v = fallbackField ? record.values[fallbackField.id] : undefined;
  }
  return v === undefined || v === null ? '' : String(v);
}

function EmptyHint() {
  return (
    <div className="w-full px-4 py-6 text-center text-[11px] text-gray-400">
      データがありません
    </div>
  );
}

// ─── Inline element renderer (no builder chrome) ───────────────────────────

function ElementContent({ element, rt }: { element: Element; rt: PublicRuntime }) {
  const s = element.style;
  const hasActions = !!(element.actions && element.actions.length > 0);

  const handleClick = () => {
    if (hasActions) rt.run(element.actions);
  };

  const clickProps = hasActions
    ? { onClick: handleClick, style: { cursor: 'pointer' } }
    : {};

  switch (element.type) {
    case 'text': {
      // dataBinding.fieldId 単一バインド → カレントレコードの値、なければテンプレート解決
      let content = element.content ?? '';
      const fieldId = element.dataBinding?.fieldId;
      if (fieldId && rt.pageRecord) {
        const v = getRecordValue(rt.pageRecord, rt.pageTable, fieldId);
        content =
          v !== undefined && v !== null
            ? String(v)
            : resolveTemplate(content, rt.pageRecord, rt.pageTable);
      } else {
        content = resolveTemplate(content, rt.pageRecord, rt.pageTable);
      }
      return (
        <div
          onClick={hasActions ? handleClick : undefined}
          className="w-full h-full flex items-center overflow-hidden"
          style={{
            color: s.color ?? '#1f2937',
            fontSize: s.fontSize ?? 16,
            fontWeight: s.fontWeight ?? 'normal',
            textAlign: s.textAlign ?? 'left',
            padding: s.padding ?? '0 4px',
            cursor: hasActions ? 'pointer' : 'default',
          }}
        >
          {content}
        </div>
      );
    }

    case 'button':
      return (
        <button
          onClick={handleClick}
          className="w-full h-full flex items-center justify-center cursor-pointer select-none active:opacity-80 transition-opacity"
          style={{
            backgroundColor: s.backgroundColor ?? '#1ec8a5',
            color: s.color ?? '#ffffff',
            fontSize: s.fontSize ?? 14,
            fontWeight: s.fontWeight ?? '500',
            borderRadius: s.borderRadius ?? 8,
            border: 'none',
          }}
        >
          {element.content ?? 'ボタン'}
        </button>
      );

    case 'button2':
      return (
        <button
          onClick={handleClick}
          className="w-full h-full flex items-center justify-center cursor-pointer select-none border active:opacity-80 transition-opacity"
          style={{
            backgroundColor: 'transparent',
            color: s.color ?? '#1ec8a5',
            borderColor: s.color ?? '#1ec8a5',
            fontSize: s.fontSize ?? 14,
            fontWeight: s.fontWeight ?? '500',
            borderRadius: s.borderRadius ?? 8,
          }}
        >
          {element.content ?? 'ボタン'}
        </button>
      );

    case 'input':
      return (
        <input
          type="text"
          value={String(rt.formValues[element.id] ?? '')}
          onChange={e => rt.setFormValue(element.id, e.target.value)}
          placeholder={element.placeholder ?? 'テキストを入力'}
          className="w-full h-full px-3 border outline-none focus:border-brand transition-colors"
          style={{
            backgroundColor: s.backgroundColor ?? '#ffffff',
            borderColor: '#d1d5db',
            borderRadius: s.borderRadius ?? 8,
            fontSize: s.fontSize ?? 14,
            color: '#1f2937',
          }}
        />
      );

    case 'password-input':
      return (
        <input
          type="password"
          value={String(rt.formValues[element.id] ?? '')}
          onChange={e => rt.setFormValue(element.id, e.target.value)}
          placeholder={element.placeholder ?? 'パスワードを入力'}
          className="w-full h-full px-3 border outline-none focus:border-brand transition-colors"
          style={{
            backgroundColor: s.backgroundColor ?? '#ffffff',
            borderColor: '#d1d5db',
            borderRadius: s.borderRadius ?? 8,
            fontSize: s.fontSize ?? 14,
            color: '#1f2937',
          }}
        />
      );

    case 'date-input':
      return (
        <input
          type="date"
          value={String(rt.formValues[element.id] ?? '')}
          onChange={e => rt.setFormValue(element.id, e.target.value)}
          className="w-full h-full px-3 border outline-none focus:border-brand transition-colors"
          style={{
            backgroundColor: s.backgroundColor ?? '#ffffff',
            borderColor: '#d1d5db',
            borderRadius: s.borderRadius ?? 8,
            fontSize: s.fontSize ?? 14,
            color: '#1f2937',
          }}
        />
      );

    case 'file-input': {
      const fileValue = rt.formValues[element.id];
      const fileName = rt.fileNames[element.id];
      return (
        <label
          className="w-full h-full flex flex-col items-center justify-center gap-1 border-2 border-dashed cursor-pointer overflow-hidden"
          style={{
            backgroundColor: s.backgroundColor ?? '#f9fafb',
            borderColor: fileValue ? '#1ec8a5' : '#d1d5db',
            borderRadius: s.borderRadius ?? 8,
          }}
        >
          {fileValue ? (
            <>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#1ec8a5" strokeWidth="2">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              <span className="text-xs text-gray-600 px-2 truncate max-w-full">
                {fileName ?? 'ファイル選択済み'}
              </span>
            </>
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
              <span className="text-xs text-gray-400">ファイルを選択</span>
            </>
          )}
          <input
            type="file"
            className="hidden"
            onChange={async e => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                const dataUrl = await fileToDataUrl(f);
                rt.setFormValue(element.id, dataUrl);
                rt.setFileName(element.id, f.name);
              } catch {
                /* 読み込み失敗は無視 */
              }
              e.target.value = '';
            }}
          />
        </label>
      );
    }

    case 'image-input': {
      const imageValue = rt.formValues[element.id];
      return (
        <label
          className="relative w-full h-full flex flex-col items-center justify-center gap-1 border-2 border-dashed cursor-pointer overflow-hidden"
          style={{
            backgroundColor: s.backgroundColor ?? '#f9fafb',
            borderColor: imageValue ? '#1ec8a5' : '#d1d5db',
            borderRadius: s.borderRadius ?? 8,
          }}
        >
          {imageValue ? (
            <img
              src={String(imageValue)}
              alt="選択された画像"
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <span className="text-xs text-gray-400">画像を選択</span>
            </>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async e => {
              const f = e.target.files?.[0];
              if (!f) return;
              try {
                const dataUrl = await fileToDataUrl(f);
                rt.setFormValue(element.id, dataUrl);
                rt.setFileName(element.id, f.name);
              } catch {
                /* 読み込み失敗は無視 */
              }
              e.target.value = '';
            }}
          />
        </label>
      );
    }

    case 'shape':
      return (
        <div
          {...clickProps}
          className="w-full h-full"
          style={{
            backgroundColor: s.backgroundColor ?? '#e5e7eb',
            borderRadius: s.borderRadius ?? 8,
            cursor: hasActions ? 'pointer' : 'default',
          }}
        />
      );

    case 'image': {
      // image の dataBinding.fieldId 単一バインド(詳細ページ)も解決
      let src = element.src;
      const imgFieldId = element.dataBinding?.fieldId;
      if (imgFieldId && rt.pageRecord) {
        const v = getRecordValue(rt.pageRecord, rt.pageTable, imgFieldId);
        if (v) src = String(v);
      }
      return src ? (
        <img
          {...clickProps}
          src={src}
          alt={element.label ?? ''}
          className="w-full h-full object-cover"
          style={{ borderRadius: s.borderRadius ?? 0, cursor: hasActions ? 'pointer' : 'default' }}
        />
      ) : (
        <div
          {...clickProps}
          className="w-full h-full flex flex-col items-center justify-center gap-1"
          style={{
            backgroundColor: s.backgroundColor ?? '#f3f4f6',
            borderRadius: s.borderRadius ?? 0,
            cursor: hasActions ? 'pointer' : 'default',
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
      );
    }

    case 'video':
      return element.src ? (
        <video
          src={element.src}
          controls
          className="w-full h-full object-cover"
          style={{ borderRadius: s.borderRadius ?? 0 }}
        />
      ) : (
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
        <div
          {...clickProps}
          className="w-full h-full flex items-center justify-center"
          style={{ cursor: hasActions ? 'pointer' : 'default' }}
        >
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
            {resolveTemplate(element.content ?? 'ヘッダー', rt.pageRecord, rt.pageTable)}
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
      const b = element.dataBinding;
      const { table, records } = resolveBinding(b, rt.tables, { appUser: rt.appUser });
      if (!table) {
        // バインド未設定 → ダミー表示(フォールバック)
        return (
          <div
            className="w-full h-full overflow-auto"
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
      return (
        <div
          className="w-full h-full overflow-auto"
          style={{ backgroundColor: s.backgroundColor ?? '#ffffff', borderRadius: s.borderRadius ?? 0 }}
        >
          {records.length === 0 && <EmptyHint />}
          {records.map(record => {
            const title = bindingTitle(record, table, b);
            const subtitle = bindingValue(record, table, b?.subtitleFieldId);
            const imageUrl = bindingValue(record, table, b?.imageFieldId);
            const caption = bindingValue(record, table, b?.captionFieldId);
            return (
              <div
                key={record.id}
                onClick={() => rt.run(element.actions, { record, table })}
                className="flex items-center gap-3 px-4 py-3 border-b border-gray-100"
                style={{ cursor: hasActions ? 'pointer' : 'default' }}
              >
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="w-8 h-8 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-xs font-semibold text-gray-500">
                    {title.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-800 truncate">{title}</div>
                  {subtitle && <div className="text-xs text-gray-500 truncate">{subtitle}</div>}
                </div>
                {caption && <span className="text-xs text-gray-400 flex-shrink-0">{caption}</span>}
              </div>
            );
          })}
        </div>
      );
    }

    case 'horizontal-list': {
      const b = element.dataBinding;
      const { table, records } = resolveBinding(b, rt.tables, { appUser: rt.appUser });
      if (!table) {
        return (
          <div
            className="w-full h-full flex items-center gap-3 px-3 overflow-x-auto"
            style={{ backgroundColor: s.backgroundColor ?? '#ffffff', borderRadius: s.borderRadius ?? 0 }}
          >
            {[1, 2, 3].map(i => (
              <div key={i} className="flex-shrink-0 w-20 h-20 rounded-lg bg-gray-200" />
            ))}
          </div>
        );
      }
      return (
        <div
          className="w-full h-full flex items-center gap-3 px-3 overflow-x-auto"
          style={{ backgroundColor: s.backgroundColor ?? '#ffffff', borderRadius: s.borderRadius ?? 0 }}
        >
          {records.length === 0 && <EmptyHint />}
          {records.map(record => {
            const title = bindingTitle(record, table, b);
            const imageUrl = bindingValue(record, table, b?.imageFieldId);
            return (
              <div
                key={record.id}
                onClick={() => rt.run(element.actions, { record, table })}
                className="flex-shrink-0 w-20 flex flex-col items-center gap-1"
                style={{ cursor: hasActions ? 'pointer' : 'default' }}
              >
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="w-20 h-20 rounded-lg object-cover" />
                ) : (
                  <div className="w-20 h-20 rounded-lg bg-gray-200 flex items-center justify-center text-lg font-semibold text-gray-500">
                    {title.charAt(0)}
                  </div>
                )}
                {title && <span className="text-[10px] text-gray-600 truncate w-full text-center">{title}</span>}
              </div>
            );
          })}
        </div>
      );
    }

    case 'carousel': {
      const b = element.dataBinding;
      const { table, records } = resolveBinding(b, rt.tables, { appUser: rt.appUser });
      if (!table) {
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
      return (
        <div
          className="w-full h-full flex overflow-x-auto snap-x snap-mandatory"
          style={{ backgroundColor: s.backgroundColor ?? '#f3f4f6', borderRadius: s.borderRadius ?? 8 }}
        >
          {records.length === 0 && (
            <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">
              データがありません
            </div>
          )}
          {records.map(record => {
            const title = bindingTitle(record, table, b);
            const imageUrl = bindingValue(record, table, b?.imageFieldId);
            return (
              <div
                key={record.id}
                onClick={() => rt.run(element.actions, { record, table })}
                className="relative flex-shrink-0 w-full h-full snap-center"
                style={{ cursor: hasActions ? 'pointer' : 'default' }}
              >
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-200 text-sm text-gray-500 px-4 text-center">
                    {title}
                  </div>
                )}
                {title && imageUrl && (
                  <div className="absolute bottom-0 left-0 right-0 px-3 py-1.5 text-white text-xs bg-gradient-to-t from-black/60 to-transparent">
                    {title}
                  </div>
                )}
              </div>
            );
          })}
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
                className="text-[9px] text-center rounded py-0.5"
                style={{
                  backgroundColor: i + 1 === 15 ? '#1ec8a5' : 'transparent',
                  color: i + 1 === 15 ? '#ffffff' : '#4b5563',
                }}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      );

    case 'form':
      return (
        <form
          onSubmit={e => {
            e.preventDefault();
            rt.run(element.actions);
          }}
          className="w-full h-full overflow-hidden p-3 space-y-2"
          style={{ backgroundColor: s.backgroundColor ?? '#ffffff', borderRadius: s.borderRadius ?? 8 }}
        >
          <div>
            <div className="text-[10px] text-gray-500 mb-0.5">名前</div>
            <input
              type="text"
              value={String(rt.formValues[`${element.id}_name`] ?? '')}
              onChange={e => rt.setFormValue(`${element.id}_name`, e.target.value)}
              placeholder="入力してください"
              className="w-full h-8 border border-gray-200 rounded px-2 text-xs text-gray-700 outline-none focus:border-brand"
            />
          </div>
          <div>
            <div className="text-[10px] text-gray-500 mb-0.5">メール</div>
            <input
              type="email"
              value={String(rt.formValues[element.id] ?? '')}
              onChange={e => rt.setFormValue(element.id, e.target.value)}
              placeholder="入力してください"
              className="w-full h-8 border border-gray-200 rounded px-2 text-xs text-gray-700 outline-none focus:border-brand"
            />
          </div>
          <button
            type="submit"
            className="w-full h-8 rounded flex items-center justify-center text-xs text-white font-medium"
            style={{ backgroundColor: '#1ec8a5' }}
          >
            送信
          </button>
        </form>
      );

    case 'dropdown': {
      const b = element.dataBinding;
      const { table, records } = resolveBinding(b, rt.tables, { appUser: rt.appUser });
      return (
        <select
          value={String(rt.formValues[element.id] ?? '')}
          onChange={e => rt.setFormValue(element.id, e.target.value)}
          className="w-full h-full px-3 border outline-none focus:border-brand appearance-none"
          style={{
            backgroundColor: s.backgroundColor ?? '#ffffff',
            borderColor: '#d1d5db',
            borderRadius: s.borderRadius ?? 8,
            fontSize: s.fontSize ?? 14,
            color: '#1f2937',
          }}
        >
          <option value="">{element.placeholder ?? '選択してください'}</option>
          {table &&
            records.map(record => {
              const label = bindingTitle(record, table, b);
              return (
                <option key={record.id} value={label}>
                  {label}
                </option>
              );
            })}
        </select>
      );
    }

    case 'switch-element':
    case 'toggle-element': {
      const on = !!rt.formValues[element.id];
      return (
        <div
          onClick={() => {
            rt.setFormValue(element.id, !on);
            if (hasActions) rt.run(element.actions);
          }}
          className="w-full h-full flex items-center gap-3 cursor-pointer"
          style={{ padding: s.padding ?? '0 4px' }}
        >
          <span className="text-sm text-gray-700">{element.content ?? 'トグル'}</span>
          <div
            className="relative w-10 h-5 rounded-full transition-colors"
            style={{ backgroundColor: on ? '#1ec8a5' : '#e5e7eb' }}
          >
            <div
              className="absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform"
              style={{ left: 2, transform: on ? 'translateX(20px)' : 'translateX(0)' }}
            />
          </div>
        </div>
      );
    }

    case 'search-element':
      return (
        <div
          className="w-full h-full flex items-center px-3 gap-2 border"
          style={{
            backgroundColor: s.backgroundColor ?? '#ffffff',
            borderColor: '#d1d5db',
            borderRadius: s.borderRadius ?? 8,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="search"
            value={String(rt.formValues[element.id] ?? '')}
            onChange={e => rt.setFormValue(element.id, e.target.value)}
            placeholder={element.placeholder ?? '検索...'}
            className="flex-1 text-sm text-gray-700 outline-none bg-transparent"
          />
        </div>
      );

    case 'db-table': {
      const b = element.dataBinding;
      const { table, records } = resolveBinding(b, rt.tables, { appUser: rt.appUser });
      if (!table) {
        return (
          <div
            className="w-full h-full overflow-auto"
            style={{ backgroundColor: s.backgroundColor ?? '#ffffff', borderRadius: s.borderRadius ?? 0 }}
          >
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50">
                  {['ID', '名前', '値'].map(col => (
                    <th key={col} className="text-left px-3 py-2 border-b border-gray-200 font-medium text-gray-600">{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3].map(i => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="px-3 py-2 text-gray-400">{i}</td>
                    <td className="px-3 py-2 text-gray-600">データ {i}</td>
                    <td className="px-3 py-2 text-gray-600">値 {i}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }
      return (
        <div
          className="w-full h-full overflow-auto"
          style={{ backgroundColor: s.backgroundColor ?? '#ffffff', borderRadius: s.borderRadius ?? 0 }}
        >
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50">
                {table.fields.map(f => (
                  <th key={f.id} className="text-left px-3 py-2 border-b border-gray-200 font-medium text-gray-600 whitespace-nowrap">
                    {f.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {records.length === 0 && (
                <tr>
                  <td colSpan={Math.max(table.fields.length, 1)} className="px-3 py-6 text-center text-gray-400">
                    データがありません
                  </td>
                </tr>
              )}
              {records.map(record => (
                <tr
                  key={record.id}
                  onClick={() => rt.run(element.actions, { record, table })}
                  className="border-b border-gray-100 hover:bg-gray-50"
                  style={{ cursor: hasActions ? 'pointer' : 'default' }}
                >
                  {table.fields.map(f => {
                    const v = record.values[f.id];
                    return (
                      <td key={f.id} className="px-3 py-2 text-gray-600 max-w-[160px] truncate">
                        {f.type === 'image' && v ? (
                          <img src={String(v)} alt="" className="w-8 h-8 rounded object-cover" />
                        ) : typeof v === 'boolean' ? (
                          v ? '✓' : '—'
                        ) : v === undefined || v === null ? (
                          ''
                        ) : (
                          String(v)
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case 'check': {
      const checked = !!rt.formValues[element.id];
      return (
        <div
          onClick={() => {
            rt.setFormValue(element.id, !checked);
            if (hasActions) rt.run(element.actions);
          }}
          className="w-full h-full flex items-center gap-2 px-2 cursor-pointer"
        >
          <div
            className="w-5 h-5 flex-shrink-0 rounded flex items-center justify-center border transition-colors"
            style={{
              backgroundColor: checked ? '#1ec8a5' : 'transparent',
              borderColor: checked ? '#1ec8a5' : '#d1d5db',
            }}
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

    case 'card-list': {
      const b = element.dataBinding;
      const { table, records } = resolveBinding(b, rt.tables, { appUser: rt.appUser });
      if (!table) {
        return (
          <div
            className="w-full h-full overflow-auto space-y-2 p-2"
            style={{ backgroundColor: s.backgroundColor ?? '#f9fafb', borderRadius: s.borderRadius ?? 8 }}
          >
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
      return (
        <div
          className="w-full h-full overflow-auto space-y-2 p-2"
          style={{ backgroundColor: s.backgroundColor ?? '#f9fafb', borderRadius: s.borderRadius ?? 8 }}
        >
          {records.length === 0 && <EmptyHint />}
          {records.map(record => {
            const title = bindingTitle(record, table, b);
            const subtitle = bindingValue(record, table, b?.subtitleFieldId);
            const imageUrl = bindingValue(record, table, b?.imageFieldId);
            const caption = bindingValue(record, table, b?.captionFieldId);
            return (
              <div
                key={record.id}
                onClick={() => rt.run(element.actions, { record, table })}
                className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 shadow-sm"
                style={{ cursor: hasActions ? 'pointer' : 'default' }}
              >
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="w-10 h-10 rounded-lg object-cover flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-lg bg-gray-200 flex-shrink-0 flex items-center justify-center text-sm font-semibold text-gray-500">
                    {title.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-800 truncate">{title}</div>
                  {subtitle && <div className="text-xs text-gray-500 truncate">{subtitle}</div>}
                </div>
                {caption && <span className="text-xs text-gray-400 flex-shrink-0">{caption}</span>}
              </div>
            );
          })}
        </div>
      );
    }

    case 'custom-list': {
      const b = element.dataBinding;
      const { table, records } = resolveBinding(b, rt.tables, { appUser: rt.appUser });
      if (!table) {
        return (
          <div
            className="w-full h-full overflow-auto"
            style={{ backgroundColor: s.backgroundColor ?? '#ffffff', borderRadius: s.borderRadius ?? 0 }}
          >
            {[1, 2, 3].map(i => (
              <div key={i} className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#1ec8a5' }} />
                <div className="h-3 bg-gray-200 rounded flex-1" />
              </div>
            ))}
          </div>
        );
      }
      return (
        <div
          className="w-full h-full overflow-auto"
          style={{ backgroundColor: s.backgroundColor ?? '#ffffff', borderRadius: s.borderRadius ?? 0 }}
        >
          {records.length === 0 && <EmptyHint />}
          {records.map(record => {
            const title = bindingTitle(record, table, b);
            const caption = bindingValue(record, table, b?.captionFieldId);
            return (
              <div
                key={record.id}
                onClick={() => rt.run(element.actions, { record, table })}
                className="flex items-center gap-2 px-3 py-2 border-b border-gray-100"
                style={{ cursor: hasActions ? 'pointer' : 'default' }}
              >
                <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#1ec8a5' }} />
                <span className="flex-1 text-sm text-gray-700 truncate">{title}</span>
                {caption && <span className="text-xs text-gray-400 flex-shrink-0">{caption}</span>}
              </div>
            );
          })}
        </div>
      );
    }

    case 'tag-list': {
      const b = element.dataBinding;
      const { table, records } = resolveBinding(b, rt.tables, { appUser: rt.appUser });
      if (!table) {
        return (
          <div
            className="w-full h-full flex flex-wrap gap-1.5 items-start content-start p-2"
            style={{ backgroundColor: s.backgroundColor ?? 'transparent' }}
          >
            {['タグ1', 'タグ2', 'タグ3', 'タグ4'].map(tag => (
              <div key={tag} className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ backgroundColor: '#1ec8a522', color: '#1ec8a5' }}>{tag}</div>
            ))}
          </div>
        );
      }
      return (
        <div
          className="w-full h-full flex flex-wrap gap-1.5 items-start content-start p-2 overflow-auto"
          style={{ backgroundColor: s.backgroundColor ?? 'transparent' }}
        >
          {records.length === 0 && <EmptyHint />}
          {records.map(record => (
            <div
              key={record.id}
              onClick={() => rt.run(element.actions, { record, table })}
              className="px-2 py-0.5 rounded-full text-[11px] font-medium"
              style={{ backgroundColor: '#1ec8a522', color: '#1ec8a5', cursor: hasActions ? 'pointer' : 'default' }}
            >
              {bindingTitle(record, table, b)}
            </div>
          ))}
        </div>
      );
    }

    case 'avatar-list': {
      const b = element.dataBinding;
      const { table, records } = resolveBinding(b, rt.tables, { appUser: rt.appUser });
      if (!table) {
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
      const visible = records.slice(0, 6);
      const rest = records.length - visible.length;
      return (
        <div className="w-full h-full flex items-center px-2">
          {visible.length === 0 && <EmptyHint />}
          {visible.map((record, i) => {
            const title = bindingTitle(record, table, b);
            const imageUrl = bindingValue(record, table, b?.imageFieldId);
            return (
              <div
                key={record.id}
                onClick={() => rt.run(element.actions, { record, table })}
                className="w-8 h-8 rounded-full border-2 border-white bg-gray-300 flex-shrink-0 flex items-center justify-center text-xs font-semibold text-gray-600 overflow-hidden"
                style={{ marginLeft: i > 0 ? -8 : 0, zIndex: 10 - i, cursor: hasActions ? 'pointer' : 'default' }}
                title={title}
              >
                {imageUrl ? (
                  <img src={imageUrl} alt="" className="w-full h-full object-cover" />
                ) : (
                  title.charAt(0)
                )}
              </div>
            );
          })}
          {rest > 0 && <span className="ml-3 text-xs text-gray-500">+{rest}</span>}
        </div>
      );
    }

    case 'stack-carousel':
      return (
        <div {...clickProps} className="w-full h-full relative flex items-center justify-center overflow-hidden" style={{ backgroundColor: s.backgroundColor ?? '#f3f4f6', borderRadius: s.borderRadius ?? 12, cursor: hasActions ? 'pointer' : 'default' }}>
          <div className="absolute inset-4 rounded-lg bg-gray-300 opacity-50" style={{ transform: 'rotate(3deg)' }} />
          <div className="absolute inset-3 rounded-lg bg-gray-200 opacity-70" style={{ transform: 'rotate(-2deg)' }} />
          <div className="absolute inset-2 rounded-lg bg-white shadow flex items-center justify-center">
            <span className="text-xs text-gray-400">スタック</span>
          </div>
        </div>
      );

    case 'barcode':
      return (
        <div {...clickProps} className="w-full h-full flex flex-col items-center justify-center gap-1 p-2" style={{ backgroundColor: s.backgroundColor ?? '#ffffff', borderRadius: s.borderRadius ?? 0, cursor: hasActions ? 'pointer' : 'default' }}>
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
        <div {...clickProps} className="w-full h-full flex flex-col items-center justify-center gap-1" style={{ backgroundColor: s.backgroundColor ?? '#ffffff', borderRadius: s.borderRadius ?? 0, cursor: hasActions ? 'pointer' : 'default' }}>
          <div className="grid grid-cols-5 gap-px p-1 bg-white">
            {Array.from({ length: 25 }, (_, i) => (
              <div key={i} className="w-3 h-3" style={{ backgroundColor: [0,1,2,5,6,7,10,12,17,18,19,20,21,23,24].includes(i) ? '#1f2937' : '#ffffff' }} />
            ))}
          </div>
          <span className="text-[9px] text-gray-400">QRコード</span>
        </div>
      );

    case 'line-social':
      return (
        <div {...clickProps} className="w-full h-full flex items-center justify-center rounded cursor-pointer" style={{ backgroundColor: s.backgroundColor ?? '#06C755', borderRadius: s.borderRadius ?? 8 }}>
          <span className="text-white font-bold text-sm">LINE でログイン</span>
        </div>
      );

    case 'map-element':
      return (
        <div {...clickProps} className="w-full h-full relative overflow-hidden" style={{ backgroundColor: '#e5e7eb', borderRadius: s.borderRadius ?? 0, cursor: hasActions ? 'pointer' : 'default' }}>
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(#9ca3af 1px, transparent 1px), linear-gradient(90deg, #9ca3af 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#ef4444" stroke="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span className="text-[10px] text-gray-600 font-medium bg-white px-1 rounded">地図</span>
            </div>
          </div>
        </div>
      );

    case 'web-view':
      return (
        <div {...clickProps} className="w-full h-full overflow-hidden" style={{ backgroundColor: '#ffffff', borderRadius: s.borderRadius ?? 0, cursor: hasActions ? 'pointer' : 'default' }}>
          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-100 border-b border-gray-200">
            <div className="flex gap-1">
              {['#ef4444', '#f59e0b', '#22c55e'].map(c => (
                <div key={c} className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
              ))}
            </div>
            <div className="flex-1 h-4 bg-white rounded-sm border border-gray-200 flex items-center px-1">
              <span className="text-[9px] text-gray-400 truncate">{element.src ?? 'https://example.com'}</span>
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
        <div {...clickProps} className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#000', borderRadius: s.borderRadius ?? 0, cursor: hasActions ? 'pointer' : 'default' }}>
          <div className="w-12 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3" /></svg>
          </div>
        </div>
      );

    case 'vimeo-element':
      return (
        <div {...clickProps} className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#1ab7ea', borderRadius: s.borderRadius ?? 0, cursor: hasActions ? 'pointer' : 'default' }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M22 7.42c-.09 2.01-1.49 4.76-4.2 8.24C15.02 19.2 12.65 21 10.6 21c-1.26 0-2.33-1.16-3.2-3.49l-1.74-6.38C5.03 8.8 4.34 7.64 3.6 7.64c-.16 0-.71.33-1.66.99L1 7.51c1.04-.92 2.07-1.83 3.08-2.76C5.5 3.52 6.55 2.88 7.24 2.8c1.66-.16 2.68.97 3.07 3.4.41 2.62.7 4.25.86 4.9.48 2.16 1 3.24 1.55 3.24.44 0 1.1-.69 1.98-2.08.88-1.39 1.35-2.44 1.41-3.17.12-1.2-.34-1.8-1.41-1.8-.5 0-1.02.11-1.55.34.97-3.15 2.8-4.68 5.53-4.6C20.6 3.11 22.12 4.56 22 7.42z"/>
          </svg>
        </div>
      );

    case 'stamp-element':
      return (
        <div {...clickProps} className="w-full h-full flex items-center justify-center" style={{ backgroundColor: s.backgroundColor ?? 'transparent', cursor: hasActions ? 'pointer' : 'default' }}>
          <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center" style={{ borderColor: s.color ?? '#1ec8a5' }}>
            <span className="text-[11px] font-bold" style={{ color: s.color ?? '#1ec8a5' }}>STAMP</span>
          </div>
        </div>
      );

    case 'stamp-card':
      return (
        <div {...clickProps} className="w-full h-full overflow-hidden p-2" style={{ backgroundColor: s.backgroundColor ?? '#fff8e6', borderRadius: s.borderRadius ?? 12, cursor: hasActions ? 'pointer' : 'default' }}>
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
        <div {...clickProps} className="w-full h-full flex flex-col items-center justify-center gap-1" style={{ backgroundColor: s.backgroundColor ?? 'transparent', cursor: hasActions ? 'pointer' : 'default' }}>
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 opacity-30 animate-ping" style={{ borderColor: '#1ec8a5' }} />
            <div className="absolute inset-2 rounded-full opacity-60" style={{ backgroundColor: '#1ec8a5' }} />
          </div>
          <span className="text-[10px] text-gray-400">Lottie</span>
        </div>
      );

    case 'chat-element':
      return (
        <div {...clickProps} className="w-full h-full overflow-hidden p-2 space-y-2" style={{ backgroundColor: s.backgroundColor ?? '#f9fafb', borderRadius: s.borderRadius ?? 8, cursor: hasActions ? 'pointer' : 'default' }}>
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

    case 'star-rating': {
      const rating = Number(rt.formValues[element.id] ?? 0);
      return (
        <div className="w-full h-full flex items-center justify-center gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <svg
              key={i}
              onClick={() => {
                rt.setFormValue(element.id, i);
                if (hasActions) rt.run(element.actions);
              }}
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={i <= rating ? (s.color ?? '#f59e0b') : 'none'}
              stroke={s.color ?? '#f59e0b'}
              strokeWidth="1.5"
              style={{ cursor: 'pointer' }}
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          ))}
        </div>
      );
    }

    default:
      return (
        <div
          {...clickProps}
          className="w-full h-full flex items-center justify-center"
          style={{
            backgroundColor: s.backgroundColor ?? 'transparent',
            borderRadius: s.borderRadius ?? 0,
            cursor: hasActions ? 'pointer' : 'default',
          }}
        >
          <span className="text-xs text-gray-400">{element.type}</span>
        </div>
      );
  }
}

// ─── Single element positioned absolutely ──────────────────────────────────

function PublicElement({ element, rt }: { element: Element; rt: PublicRuntime }) {
  const s = element.style;

  if (element.visible === false) return null;

  return (
    <div
      style={{
        position: 'absolute',
        left: s.x ?? 0,
        top: s.y ?? 0,
        width: s.width ?? 100,
        height: s.height ?? 40,
        zIndex: s.zIndex ?? 0,
        opacity: s.opacity !== undefined ? s.opacity / 100 : 1,
        overflow: 'hidden',
      }}
    >
      <ElementContent element={element} rt={rt} />
    </div>
  );
}

// ─── Not Found UI ───────────────────────────────────────────────────────────

function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <p className="text-4xl mb-4">🔍</p>
        <h1 className="text-xl font-bold text-gray-900 mb-2">アプリが見つかりません</h1>
        <p className="text-gray-500">このURLは無効か、アプリが非公開になっています</p>
      </div>
    </div>
  );
}

// ─── Watermark ──────────────────────────────────────────────────────────────

function Watermark() {
  return (
    <div className="fixed bottom-4 right-4 flex items-center gap-1.5 bg-white/80 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm border border-gray-100 z-50">
      <div
        className="w-4 h-4 rounded-sm flex items-center justify-center"
        style={{ backgroundColor: '#1ec8a5' }}
      >
        <span className="text-white text-xs font-bold">C</span>
      </div>
      <span className="text-xs text-gray-500 font-medium">Click で作成</span>
    </div>
  );
}

// ─── Toasts ─────────────────────────────────────────────────────────────────

interface Toast {
  id: number;
  msg: string;
  type: 'success' | 'error';
}

function ToastStack({ toasts }: { toasts: Toast[] }) {
  if (toasts.length === 0) return null;
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-2 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className="px-4 py-2 rounded-full shadow-lg text-white text-sm font-medium"
          style={{ backgroundColor: t.type === 'error' ? '#ef4444' : '#1ec8a5' }}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}

// ─── Navigation frame (履歴スタック) ─────────────────────────────────────────

interface Frame {
  pageId: string;
  /** navigate 時に引き継いだレコードコンテキスト(詳細ページ用)。常に store から live 解決する */
  recordId?: string;
  tableId?: string;
}

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function PublicAppPage({ params }: { params: { id: string } }) {
  const {
    apps,
    getPagesForApp,
    getTablesForApp,
    addRecord,
    updateRecord,
    deleteRecord,
  } = useStore();

  const [loading, setLoading] = useState(true);
  const [stack, setStack] = useState<Frame[]>([]);
  const [appUser, setAppUserState] = useState<AppUserSession | null>(null);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [fileNames, setFileNames] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastSeq = useRef(0);

  const app = apps.find(a => a.id === params.id);
  const pages = app ? getPagesForApp(params.id) : [];
  // store の tables を直接参照(useStore 購読により create/update/delete 後に再レンダリング)
  const tables = app ? getTablesForApp(params.id) : [];

  // ── 初期化: セッション復元 + ログイン状態に応じたスタートページ ──
  useEffect(() => {
    if (!app || !app.published) {
      setLoading(false);
      return;
    }
    const session = getAppUserSession(app.id);
    setAppUserState(session);
    const startPage = resolveStartPage(pages, !!session);
    setStack(startPage ? [{ pageId: startPage.id }] : []);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── トースト ──
  const notify = (msg: string, type: 'success' | 'error' = 'success') => {
    const id = ++toastSeq.current;
    setToasts(t => [...t, { id, msg, type }]);
    setTimeout(() => {
      setToasts(t => t.filter(x => x.id !== id));
    }, 3000);
  };

  // ── フォーム値 ──
  const setFormValue = (elementId: string, value: any) => {
    setFormValues(v => ({ ...v, [elementId]: value }));
  };
  const setFileName = (elementId: string, name: string) => {
    setFileNames(v => ({ ...v, [elementId]: name }));
  };

  // ── アプリ利用者セッション反映(login/logout/register から呼ばれる) ──
  const applyAppUser = (s: AppUserSession | null) => {
    setAppUserState(s);
    // ログイン状態が変わったら対応するスタートページへ(履歴リセット)。
    // navigateAfterPageId がある場合は runtime が後から navigate するためそちらが優先される。
    const startPage = resolveStartPage(pages, !!s);
    if (startPage) setStack([{ pageId: startPage.id }]);
    if (s) {
      // ログイン/登録成功 → 認証フォームをクリア
      setFormValues({});
      setFileNames({});
    }
  };

  // ── 現在ページ / レコードコンテキストの解決(常に store から live 解決) ──
  const frame = stack.length > 0 ? stack[stack.length - 1] : undefined;
  const currentPage: Page | undefined =
    pages.find(p => p.id === frame?.pageId) ??
    resolveStartPage(pages, !!appUser) ??
    pages[0];
  const pageTable: DBTable | null = frame?.tableId
    ? tables.find(t => t.id === frame.tableId) ?? null
    : null;
  const pageRecord: DBRecord | null = frame?.recordId
    ? pageTable?.records.find(r => r.id === frame.recordId) ??
      tables.flatMap(t => t.records).find(r => r.id === frame.recordId) ??
      null
    : null;

  // ── アクション実行(ClickFlow) ──
  const run = async (
    actions: Action[] | undefined,
    item?: { record: DBRecord; table: DBTable | null },
  ) => {
    if (!app || !actions || actions.length === 0) return;

    // リスト項目タップ時はそのレコード、詳細ページ上ではページのレコードを使う
    const carriedRecord = item?.record ?? pageRecord ?? null;
    const carriedTable = item?.table ?? pageTable ?? null;

    let didWrite = false;

    const ctx: ActionContext = {
      appId: app.id,
      tables: getTablesForApp(app.id),
      formValues,
      currentRecord: carriedRecord,
      currentTable: carriedTable,
      appUser,
      elements: currentPage?.elements ?? [],
      navigate: pageId =>
        setStack(s => [
          ...s,
          {
            pageId,
            recordId: carriedRecord?.id,
            tableId: carriedTable?.id,
          },
        ]),
      back: () => setStack(s => (s.length > 1 ? s.slice(0, -1) : s)),
      openUrl: (url, newTab) => {
        if (newTab) window.open(url, '_blank', 'noopener,noreferrer');
        else window.location.href = url;
      },
      addRecord: (tableId, values) => {
        const created = addRecord(app.id, tableId, values);
        didWrite = true;
        return created;
      },
      updateRecord: (tableId, recordId, values) =>
        updateRecord(app.id, tableId, recordId, values),
      deleteRecord: (tableId, recordId) =>
        deleteRecord(app.id, tableId, recordId),
      setAppUser: applyAppUser,
      notify,
    };

    await runActions(actions, ctx);

    // create-record / register が実際に書き込みに成功した場合はフォームをクリア
    if (didWrite) {
      setFormValues({});
      setFileNames({});
    }
  };

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#1ec8a5', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  // ── Not published / not found ─────────────────────────────────────────────

  if (!app || !app.published) {
    return <NotFound />;
  }

  if (!currentPage) {
    return <NotFound />;
  }

  // ── Runtime bundle ────────────────────────────────────────────────────────

  const rt: PublicRuntime = {
    tables,
    appUser,
    formValues,
    setFormValue,
    fileNames,
    setFileName,
    run,
    pageRecord,
    pageTable,
  };

  // ── Determine layout ──────────────────────────────────────────────────────

  const isMobile = app.primaryDevice === 'mobile';
  const canvasWidth = isMobile ? 390 : undefined;

  return (
    <div
      className="min-h-screen w-full"
      style={{ backgroundColor: currentPage.backgroundColor ?? '#f9fafb' }}
    >
      {/* Canvas area */}
      <div
        className={isMobile ? 'mx-auto' : 'w-full'}
        style={{
          width: canvasWidth,
          minHeight: '100vh',
          position: 'relative',
          backgroundColor: currentPage.backgroundColor ?? '#ffffff',
          overflow: 'hidden',
        }}
      >
        {/* Page elements */}
        {currentPage.elements.map(element => (
          <PublicElement key={element.id} element={element} rt={rt} />
        ))}
      </div>

      {/* Toast notifications */}
      <ToastStack toasts={toasts} />

      {/* Powered by Click watermark */}
      <Watermark />
    </div>
  );
}
