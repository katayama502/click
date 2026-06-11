'use client';

// ============================================================
// ActionsPanel — ClickFlow(アクション)編集パネル
// 右パネルの「ClickFlow」タブから利用。
// 変更はすべて onUpdate(= store.updateElement) 経由で element.actions に保存する。
// ============================================================

import React, { useState } from 'react';
import {
  Plus, Trash2, ChevronUp, ChevronDown, ChevronRight,
  ArrowRight, Undo2, ExternalLink, FilePlus, Pencil,
  LogIn, LogOut, UserPlus, X, Info,
} from 'lucide-react';
import { generateId, cn } from '@/lib/utils';
import type { Action, ActionType, DBTable, Element, Page } from '@/lib/types';

// ─── 共通スタイル ──────────────────────────────────────────────────────────
const SELECT_CLS = 'w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-brand bg-white';
const INPUT_CLS = 'w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-brand';
const LABEL_CLS = 'text-[10px] text-gray-500 block mb-1';

// ─── アクションタイプ定義 ──────────────────────────────────────────────────
const ACTION_DEFS: Array<{
  type: ActionType;
  label: string;
  icon: React.ReactNode;
  description: string;
}> = [
  { type: 'navigate', label: 'ページ移動', icon: <ArrowRight size={13} />, description: 'アプリ内の別ページへ移動' },
  { type: 'back', label: '戻る', icon: <Undo2 size={13} />, description: '前のページに戻る' },
  { type: 'external-link', label: '外部リンク', icon: <ExternalLink size={13} />, description: '外部URLを開く' },
  { type: 'create-record', label: 'データ作成', icon: <FilePlus size={13} />, description: 'テーブルにレコードを追加' },
  { type: 'update-record', label: 'データ更新', icon: <Pencil size={13} />, description: '現在のレコードを更新' },
  { type: 'delete-record', label: 'データ削除', icon: <Trash2 size={13} />, description: '現在のレコードを削除' },
  { type: 'login', label: 'ログイン', icon: <LogIn size={13} />, description: 'アプリ利用者としてログイン' },
  { type: 'register', label: '新規登録', icon: <UserPlus size={13} />, description: 'アプリ利用者を新規登録' },
  { type: 'logout', label: 'ログアウト', icon: <LogOut size={13} />, description: 'ログアウトする' },
];

const ACTION_DEF_MAP = new Map(ACTION_DEFS.map(d => [d.type, d]));

// ─── フォーム入力として選択できるエレメントタイプ ──────────────────────────
const FORM_INPUT_TYPES = new Set<string>([
  'input', 'password-input', 'date-input', 'file-input', 'image-input',
  'form', 'dropdown', 'check', 'switch-element', 'star-rating', 'search-element',
]);

const INPUT_TYPE_LABELS: Record<string, string> = {
  input: 'インプット',
  'password-input': 'パスワード',
  'date-input': '日付',
  'file-input': 'ファイル',
  'image-input': '画像',
  form: 'フォーム',
  dropdown: 'ドロップダウン',
  check: 'チェック',
  'switch-element': 'スイッチ',
  'star-rating': '星評価',
  'search-element': '検索',
};

/** アクションのフォーム入力選択UIに表示する名前: label(なければ type+id短縮) */
export function elementDisplayName(el: Element): string {
  if (el.label && el.label.trim()) return el.label.trim();
  const t = INPUT_TYPE_LABELS[el.type] ?? el.type;
  return `${t} (${el.id.slice(-4)})`;
}

// ─── ValueSource 式のパース/構築 ───────────────────────────────────────────
type SourceKind = '' | 'form' | 'static' | 'user' | 'now';

function parseSource(v: string | undefined): { kind: SourceKind; rest: string } {
  if (!v) return { kind: '', rest: '' };
  if (v === 'now') return { kind: 'now', rest: '' };
  if (v.startsWith('form:')) return { kind: 'form', rest: v.slice('form:'.length) };
  if (v.startsWith('static:')) return { kind: 'static', rest: v.slice('static:'.length) };
  if (v.startsWith('user:')) return { kind: 'user', rest: v.slice('user:'.length) };
  // 後方互換: 未知の形式は固定値として扱う
  return { kind: 'static', rest: v };
}

/** 値ソースエディタ: フォーム入力 / 固定値 / ログインユーザー / 現在日時 */
function ValueSourceEditor({
  value, onChange, formElements,
}: {
  value?: string;
  onChange: (v: string | undefined) => void;
  formElements: Element[];
}) {
  const { kind, rest } = parseSource(value);

  const changeKind = (k: SourceKind) => {
    if (k === '') onChange(undefined);
    else if (k === 'now') onChange('now');
    else if (k === 'form') onChange(`form:${formElements[0]?.id ?? ''}`);
    else if (k === 'static') onChange('static:');
    else if (k === 'user') onChange('user:email');
  };

  return (
    <div className="flex flex-col gap-1">
      <select value={kind} onChange={e => changeKind(e.target.value as SourceKind)} className={SELECT_CLS}>
        <option value="">未設定</option>
        <option value="form">フォーム入力</option>
        <option value="static">固定値</option>
        <option value="user">ログインユーザー</option>
        <option value="now">現在日時</option>
      </select>

      {kind === 'form' && (
        <select
          value={rest}
          onChange={e => onChange(`form:${e.target.value}`)}
          className={SELECT_CLS}
        >
          <option value="">入力エレメントを選択</option>
          {formElements.map(el => (
            <option key={el.id} value={el.id}>{elementDisplayName(el)}</option>
          ))}
        </select>
      )}

      {kind === 'static' && (
        <input
          value={rest}
          onChange={e => onChange(`static:${e.target.value}`)}
          placeholder="固定値を入力"
          className={INPUT_CLS}
        />
      )}

      {kind === 'user' && (
        <select
          value={rest}
          onChange={e => onChange(`user:${e.target.value}`)}
          className={SELECT_CLS}
        >
          <option value="email">メールアドレス</option>
          <option value="name">名前</option>
          <option value="id">ユーザーID</option>
        </select>
      )}
    </div>
  );
}

// ─── フィールドマッピングUI(create/update-record用) ───────────────────────
const FIELD_TYPE_LABELS: Record<string, string> = {
  text: 'テキスト', password: 'パスワード', number: '数値', boolean: '真偽',
  datetime: '日時', date: '日付', image: '画像', file: 'ファイル', relation: 'リレーション',
};

function FieldMappingEditor({
  table, mappings, onChange, formElements,
}: {
  table: DBTable;
  mappings: Record<string, string>;
  onChange: (m: Record<string, string>) => void;
  formElements: Element[];
}) {
  const setMapping = (fieldId: string, src: string | undefined) => {
    const next = { ...mappings };
    if (src === undefined || src === '') delete next[fieldId];
    else next[fieldId] = src;
    onChange(next);
  };

  return (
    <div className="space-y-2.5">
      <label className={LABEL_CLS}>フィールドマッピング</label>
      {table.fields.map(f => (
        <div key={f.id} className="bg-white border border-gray-100 rounded-lg p-2 space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-medium text-gray-700">{f.name}</span>
            <span className="text-[9px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
              {FIELD_TYPE_LABELS[f.type] ?? f.type}
            </span>
          </div>
          <ValueSourceEditor
            value={mappings[f.id]}
            onChange={v => setMapping(f.id, v)}
            formElements={formElements}
          />
        </div>
      ))}
      {table.fields.length === 0 && (
        <p className="text-[10px] text-gray-400">このテーブルにはフィールドがありません</p>
      )}
    </div>
  );
}

// ─── login/register 用の入力エレメント選択 ─────────────────────────────────
function CredentialPicker({
  label, value, onChange, candidates,
}: {
  label: string;
  value?: string; // "form:{elementId}" 形式
  onChange: (v: string | undefined) => void;
  candidates: Element[];
}) {
  const current = value?.startsWith('form:') ? value.slice('form:'.length) : '';
  return (
    <div>
      <label className={LABEL_CLS}>{label}</label>
      <select
        value={current}
        onChange={e => onChange(e.target.value ? `form:${e.target.value}` : undefined)}
        className={SELECT_CLS}
      >
        <option value="">入力エレメントを選択</option>
        {candidates.map(el => (
          <option key={el.id} value={el.id}>{elementDisplayName(el)}</option>
        ))}
      </select>
    </div>
  );
}

// ─── アクションの概要文 ────────────────────────────────────────────────────
function actionSummary(action: Action, pages: Page[], tables: DBTable[]): string {
  const tableName = tables.find(t => t.id === action.tableId)?.name;
  switch (action.type) {
    case 'navigate':
      return pages.find(p => p.id === action.targetPageId)?.name ?? '遷移先未設定';
    case 'back':
      return '前のページへ';
    case 'external-link':
      return action.targetUrl || 'URL未設定';
    case 'create-record':
    case 'update-record':
    case 'delete-record':
      return tableName ?? (action.type === 'create-record' ? 'テーブル未設定' : 'リストのテーブル');
    case 'login':
      return 'アプリ利用者ログイン';
    case 'register':
      return 'アプリ利用者登録';
    case 'logout':
      return 'セッションを終了';
    default:
      return '';
  }
}

// ─── メインパネル ──────────────────────────────────────────────────────────
export default function ActionsPanel({
  element, pages, tables, pageElements, onUpdate,
}: {
  element: Element;
  pages: Page[];
  tables: DBTable[];
  pageElements: Element[];
  onUpdate: (u: Partial<Element>) => void;
}) {
  const actions = element.actions ?? [];
  const [showPicker, setShowPicker] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // 同一ページ内のフォーム入力エレメント(自分自身は除外)
  const formElements = pageElements.filter(
    el => FORM_INPUT_TYPES.has(el.type) && el.id !== element.id,
  );

  const commit = (next: Action[]) => onUpdate({ actions: next });

  const addAction = (type: ActionType) => {
    const action: Action = { id: generateId(), type };
    commit([...actions, action]);
    setExpandedId(action.id);
    setShowPicker(false);
  };

  const updateAction = (id: string, updates: Partial<Action>) => {
    commit(actions.map(a => (a.id === id ? { ...a, ...updates } : a)));
  };

  const removeAction = (id: string) => {
    commit(actions.filter(a => a.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const moveAction = (index: number, dir: -1 | 1) => {
    const to = index + dir;
    if (to < 0 || to >= actions.length) return;
    const next = [...actions];
    [next[index], next[to]] = [next[to], next[index]];
    commit(next);
  };

  return (
    <div className="p-3 space-y-3">
      {/* 追加ボタン */}
      <button
        onClick={() => setShowPicker(!showPicker)}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-brand text-white rounded-full text-sm font-medium hover:bg-brand-600 transition-colors"
      >
        {showPicker ? <X size={15} /> : <Plus size={15} />}
        {showPicker ? 'キャンセル' : 'ClickFlowを追加'}
      </button>

      {/* アクションタイプ選択 */}
      {showPicker && (
        <div className="border border-gray-200 rounded-xl overflow-hidden divide-y divide-gray-100">
          {ACTION_DEFS.map(def => (
            <button
              key={def.type}
              onClick={() => addAction(def.type)}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left hover:bg-brand/5 transition-colors group"
            >
              <span className="w-6 h-6 flex items-center justify-center rounded-md bg-gray-100 text-gray-500 group-hover:bg-brand/10 group-hover:text-brand transition-colors flex-shrink-0">
                {def.icon}
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-xs font-medium text-gray-700">{def.label}</span>
                <span className="block text-[9.5px] text-gray-400 truncate">{def.description}</span>
              </span>
            </button>
          ))}
        </div>
      )}

      {actions.length === 0 && !showPicker && (
        <p className="text-xs text-gray-400 text-center py-6">
          ClickFlowがありません。<br />エレメントタップ時の動作を追加できます。
        </p>
      )}

      {/* アクション一覧 */}
      {actions.map((action, index) => {
        const def = ACTION_DEF_MAP.get(action.type);
        const expanded = expandedId === action.id;
        return (
          <div key={action.id} className="border border-gray-200 rounded-xl bg-white overflow-hidden">
            {/* ヘッダー行: アイコン + 概要 + 並び替え + 削除 */}
            <div
              className={cn(
                'flex items-center gap-2 px-2.5 py-2 cursor-pointer transition-colors',
                expanded ? 'bg-brand/5' : 'hover:bg-gray-50',
              )}
              onClick={() => setExpandedId(expanded ? null : action.id)}
            >
              <span className="w-6 h-6 flex items-center justify-center rounded-md bg-brand/10 text-brand flex-shrink-0">
                {def?.icon ?? <ChevronRight size={13} />}
              </span>
              <div className="flex-1 min-w-0">
                <div className="text-[11px] font-medium text-gray-800 leading-tight">
                  {index + 1}. {def?.label ?? action.type}
                </div>
                <div className="text-[9.5px] text-gray-400 truncate">
                  {actionSummary(action, pages, tables)}
                </div>
              </div>
              {/* 並び替え */}
              <div className="flex flex-col flex-shrink-0">
                <button
                  onClick={e => { e.stopPropagation(); moveAction(index, -1); }}
                  disabled={index === 0}
                  className={cn('w-5 h-3.5 flex items-center justify-center text-gray-400 hover:text-brand', index === 0 && 'opacity-20 cursor-not-allowed')}
                  title="上へ"
                >
                  <ChevronUp size={11} />
                </button>
                <button
                  onClick={e => { e.stopPropagation(); moveAction(index, 1); }}
                  disabled={index === actions.length - 1}
                  className={cn('w-5 h-3.5 flex items-center justify-center text-gray-400 hover:text-brand', index === actions.length - 1 && 'opacity-20 cursor-not-allowed')}
                  title="下へ"
                >
                  <ChevronDown size={11} />
                </button>
              </div>
              <button
                onClick={e => { e.stopPropagation(); removeAction(action.id); }}
                className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 rounded-md hover:bg-red-50 transition-colors flex-shrink-0"
                title="削除"
              >
                <Trash2 size={12} />
              </button>
            </div>

            {/* 設定フォーム */}
            {expanded && (
              <div className="border-t border-gray-100 p-3 space-y-3 bg-gray-50/50">
                <ActionConfigForm
                  action={action}
                  pages={pages}
                  tables={tables}
                  formElements={formElements}
                  onChange={u => updateAction(action.id, u)}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── タイプ別設定フォーム ──────────────────────────────────────────────────
function ActionConfigForm({
  action, pages, tables, formElements, onChange,
}: {
  action: Action;
  pages: Page[];
  tables: DBTable[];
  formElements: Element[];
  onChange: (u: Partial<Action>) => void;
}) {
  const selectedTable = tables.find(t => t.id === action.tableId);
  const mappings = action.fieldMappings ?? {};

  const setMappingKey = (key: string, v: string | undefined) => {
    const next = { ...mappings };
    if (v === undefined || v === '') delete next[key];
    else next[key] = v;
    onChange({ fieldMappings: next });
  };

  const passwordCandidates = formElements.filter(el => el.type === 'password-input');

  return (
    <>
      {/* アクションタイプ変更 */}
      <div>
        <label className={LABEL_CLS}>アクションタイプ</label>
        <select
          value={action.type}
          onChange={e => onChange({ type: e.target.value as ActionType })}
          className={SELECT_CLS}
        >
          {ACTION_DEFS.map(d => (
            <option key={d.type} value={d.type}>{d.label}</option>
          ))}
        </select>
      </div>

      {/* navigate */}
      {action.type === 'navigate' && (
        <div>
          <label className={LABEL_CLS}>遷移先ページ</label>
          <select
            value={action.targetPageId ?? ''}
            onChange={e => onChange({ targetPageId: e.target.value || undefined })}
            className={SELECT_CLS}
          >
            <option value="">ページを選択</option>
            {pages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      )}

      {/* external-link */}
      {action.type === 'external-link' && (
        <>
          <div>
            <label className={LABEL_CLS}>URL</label>
            <input
              value={action.targetUrl ?? ''}
              onChange={e => onChange({ targetUrl: e.target.value })}
              placeholder="https://..."
              className={INPUT_CLS}
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={action.openInNewTab ?? false}
              onChange={e => onChange({ openInNewTab: e.target.checked })}
              className="rounded accent-brand"
            />
            <span className="text-xs text-gray-600">新しいタブで開く</span>
          </label>
        </>
      )}

      {/* create-record */}
      {action.type === 'create-record' && (
        <>
          <div>
            <label className={LABEL_CLS}>対象テーブル</label>
            <select
              value={action.tableId ?? ''}
              onChange={e => onChange({ tableId: e.target.value || undefined, fieldMappings: {} })}
              className={SELECT_CLS}
            >
              <option value="">テーブルを選択</option>
              {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          {selectedTable && (
            <FieldMappingEditor
              table={selectedTable}
              mappings={mappings}
              onChange={m => onChange({ fieldMappings: m })}
              formElements={formElements}
            />
          )}
        </>
      )}

      {/* update-record / delete-record */}
      {(action.type === 'update-record' || action.type === 'delete-record') && (
        <>
          <div className="flex items-start gap-1.5 px-2 py-1.5 bg-brand/5 border border-brand/20 rounded-lg">
            <Info size={11} className="text-brand mt-0.5 flex-shrink-0" />
            <p className="text-[10px] text-gray-600 leading-relaxed">
              リスト内の現在のレコードが{action.type === 'update-record' ? '更新' : '削除'}対象になります
            </p>
          </div>
          <div>
            <label className={LABEL_CLS}>対象テーブル</label>
            <select
              value={action.tableId ?? ''}
              onChange={e => onChange({ tableId: e.target.value || undefined })}
              className={SELECT_CLS}
            >
              <option value="">リストのテーブルを自動使用</option>
              {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          {action.type === 'update-record' && selectedTable && (
            <FieldMappingEditor
              table={selectedTable}
              mappings={mappings}
              onChange={m => onChange({ fieldMappings: m })}
              formElements={formElements}
            />
          )}
          {action.type === 'delete-record' && (
            <div>
              <label className={LABEL_CLS}>確認メッセージ</label>
              <input
                value={action.confirmMessage ?? ''}
                onChange={e => onChange({ confirmMessage: e.target.value || undefined })}
                placeholder="本当に削除しますか？"
                className={INPUT_CLS}
              />
            </div>
          )}
        </>
      )}

      {/* login / register */}
      {(action.type === 'login' || action.type === 'register') && (
        <>
          <CredentialPicker
            label="メールアドレスに使う入力"
            value={mappings.email}
            onChange={v => setMappingKey('email', v)}
            candidates={formElements}
          />
          <CredentialPicker
            label="パスワードに使う入力"
            value={mappings.password}
            onChange={v => setMappingKey('password', v)}
            candidates={passwordCandidates.length > 0 ? passwordCandidates : formElements}
          />
          {action.type === 'register' && (
            <CredentialPicker
              label="名前に使う入力(任意)"
              value={mappings.name}
              onChange={v => setMappingKey('name', v)}
              candidates={formElements}
            />
          )}
          {formElements.length === 0 && (
            <p className="text-[10px] text-gray-400">
              同一ページにインプットエレメントを配置すると選択できます
            </p>
          )}
        </>
      )}

      {/* 共通設定 */}
      <div className="pt-2 border-t border-gray-200 space-y-3">
        <div>
          <label className={LABEL_CLS}>完了メッセージ(任意)</label>
          <input
            value={action.successMessage ?? ''}
            onChange={e => onChange({ successMessage: e.target.value || undefined })}
            placeholder="例: 送信しました"
            className={INPUT_CLS}
          />
        </div>
        <div>
          <label className={LABEL_CLS}>完了後の遷移先ページ(任意)</label>
          <select
            value={action.navigateAfterPageId ?? ''}
            onChange={e => onChange({ navigateAfterPageId: e.target.value || undefined })}
            className={SELECT_CLS}
          >
            <option value="">遷移しない</option>
            {pages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>
    </>
  );
}
