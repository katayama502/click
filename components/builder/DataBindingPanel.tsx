'use client';

// ============================================================
// DataBindingPanel — データバインディング編集パネル
// 右パネルの「データ」タブから利用。
// 変更はすべて onUpdate(= store.updateElement) 経由で element.dataBinding に保存する。
// ============================================================

import React from 'react';
import { Plus, Trash2, Database, Info } from 'lucide-react';
import type { DataBinding, DBTable, Element } from '@/lib/types';

// ─── 共通スタイル ──────────────────────────────────────────────────────────
const SELECT_CLS = 'w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-brand bg-white';
const INPUT_CLS = 'w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-brand';
const LABEL_CLS = 'text-[10px] text-gray-500 block mb-1';

// リスト系(複数レコード)バインド対象
const LIST_BIND_TYPES = new Set<string>([
  'list', 'card-list', 'custom-list', 'horizontal-list', 'tag-list',
  'avatar-list', 'carousel', 'stack-carousel', 'db-table', 'dropdown', 'calendar',
]);

// 単一フィールドバインド対象(text / image 等)
const SINGLE_BIND_TYPES = new Set<string>(['text', 'image', 'barcode', 'qr-code']);

const OPERATORS: Array<{ value: string; label: string; needsValue: boolean }> = [
  { value: '=', label: '等しい (=)', needsValue: true },
  { value: '!=', label: '等しくない (≠)', needsValue: true },
  { value: 'contains', label: '含む', needsValue: true },
  { value: '>', label: 'より大きい (>)', needsValue: true },
  { value: '<', label: 'より小さい (<)', needsValue: true },
  { value: 'is-empty', label: '空である', needsValue: false },
  { value: 'is-not-empty', label: '空でない', needsValue: false },
];

// ─── フィールド選択セレクト ────────────────────────────────────────────────
function FieldSelect({
  label, table, value, onChange, imageOnly = false,
}: {
  label: string;
  table: DBTable;
  value?: string;
  onChange: (fieldId: string | undefined) => void;
  imageOnly?: boolean;
}) {
  const fields = imageOnly
    ? table.fields.filter(f => f.type === 'image' || f.type === 'file')
    : table.fields;
  return (
    <div>
      <label className={LABEL_CLS}>{label}</label>
      <select
        value={value ?? ''}
        onChange={e => onChange(e.target.value || undefined)}
        className={SELECT_CLS}
      >
        <option value="">未設定</option>
        {fields.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
      </select>
    </div>
  );
}

// ─── メインパネル ──────────────────────────────────────────────────────────
export default function DataBindingPanel({
  element, tables, onUpdate,
}: {
  element: Element;
  tables: DBTable[];
  onUpdate: (u: Partial<Element>) => void;
}) {
  const binding: DataBinding = element.dataBinding ?? {};
  const table = tables.find(t => t.id === binding.tableId) ?? null;
  const isList = LIST_BIND_TYPES.has(element.type);
  const isSingle = SINGLE_BIND_TYPES.has(element.type);

  const setBinding = (u: Partial<DataBinding>) => {
    onUpdate({ dataBinding: { ...binding, ...u } });
  };

  const changeTable = (tableId: string) => {
    if (!tableId) {
      onUpdate({ dataBinding: undefined });
      return;
    }
    // テーブル変更時はフィールド参照をリセット
    onUpdate({
      dataBinding: {
        tableId,
        fieldId: undefined,
        titleFieldId: undefined,
        subtitleFieldId: undefined,
        imageFieldId: undefined,
        captionFieldId: undefined,
        filter: [],
        sortField: undefined,
        sortOrder: binding.sortOrder,
        limit: binding.limit,
      },
    });
  };

  if (!isList && !isSingle) {
    return (
      <div className="p-3">
        <div className="flex items-start gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl">
          <Info size={13} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-gray-500 leading-relaxed">
            このエレメントはデータバインディングに対応していません。
            リスト系エレメントやテキスト・画像エレメントを選択してください。
          </p>
        </div>
      </div>
    );
  }

  const filters = binding.filter ?? [];

  const updateFilter = (index: number, u: Partial<{ field: string; operator: string; value: any }>) => {
    const next = filters.map((f, i) => (i === index ? { ...f, ...u } : f));
    setBinding({ filter: next });
  };

  const addFilter = () => {
    setBinding({ filter: [...filters, { field: '', operator: '=', value: '' }] });
  };

  const removeFilter = (index: number) => {
    setBinding({ filter: filters.filter((_, i) => i !== index) });
  };

  return (
    <div className="p-3 space-y-4">
      {/* バインド先テーブル */}
      <div>
        <div className="flex items-center gap-1.5 mb-1.5">
          <Database size={12} className="text-brand" />
          <span className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">データベース連携</span>
        </div>
        <label className={LABEL_CLS}>バインド先テーブル</label>
        <select
          value={binding.tableId ?? ''}
          onChange={e => changeTable(e.target.value)}
          className={SELECT_CLS}
        >
          <option value="">テーブルを選択</option>
          {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
      </div>

      {table && isSingle && (
        <div className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50/50">
          <span className="text-[10px] font-semibold text-gray-500">表示フィールド</span>
          <FieldSelect
            label={element.type === 'image' ? '画像フィールド' : 'バインドするフィールド'}
            table={table}
            value={binding.fieldId}
            onChange={v => setBinding({ fieldId: v })}
            imageOnly={element.type === 'image'}
          />
          <p className="text-[9.5px] text-gray-400 leading-relaxed">
            リスト項目のコンテキスト(カレントレコード)から値を表示します
          </p>
        </div>
      )}

      {table && isList && (
        <>
          {/* 表示フィールドマッピング */}
          <div className="border border-gray-100 rounded-xl p-3 space-y-2.5 bg-gray-50/50">
            <span className="text-[10px] font-semibold text-gray-500">表示フィールド</span>
            <FieldSelect label="タイトル" table={table} value={binding.titleFieldId} onChange={v => setBinding({ titleFieldId: v })} />
            <FieldSelect label="サブタイトル" table={table} value={binding.subtitleFieldId} onChange={v => setBinding({ subtitleFieldId: v })} />
            <FieldSelect label="画像" table={table} value={binding.imageFieldId} onChange={v => setBinding({ imageFieldId: v })} imageOnly />
            <FieldSelect label="キャプション" table={table} value={binding.captionFieldId} onChange={v => setBinding({ captionFieldId: v })} />
          </div>

          {/* フィルター */}
          <div className="border border-gray-100 rounded-xl p-3 space-y-2 bg-gray-50/50">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-gray-500">フィルター</span>
              <button
                onClick={addFilter}
                className="flex items-center gap-1 text-[10px] text-brand hover:text-brand-600 font-medium transition-colors"
              >
                <Plus size={10} />
                条件を追加
              </button>
            </div>

            {filters.length === 0 && (
              <p className="text-[10px] text-gray-400">すべてのレコードを表示</p>
            )}

            {filters.map((f, i) => {
              const op = OPERATORS.find(o => o.value === f.operator);
              return (
                <div key={i} className="bg-white border border-gray-100 rounded-lg p-2 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <select
                      value={f.field ?? ''}
                      onChange={e => updateFilter(i, { field: e.target.value })}
                      className={SELECT_CLS}
                    >
                      <option value="">フィールドを選択</option>
                      {table.fields.map(fd => <option key={fd.id} value={fd.id}>{fd.name}</option>)}
                    </select>
                    <button
                      onClick={() => removeFilter(i)}
                      className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 rounded hover:bg-red-50 transition-colors flex-shrink-0"
                      title="条件を削除"
                    >
                      <Trash2 size={11} />
                    </button>
                  </div>
                  <select
                    value={f.operator}
                    onChange={e => updateFilter(i, { operator: e.target.value })}
                    className={SELECT_CLS}
                  >
                    {OPERATORS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  {(op?.needsValue ?? true) && (
                    <input
                      value={typeof f.value === 'string' || typeof f.value === 'number' ? String(f.value) : ''}
                      onChange={e => updateFilter(i, { value: e.target.value })}
                      placeholder='値 ("user:id" 等の式も可)'
                      className={INPUT_CLS}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* ソート・件数 */}
          <div className="border border-gray-100 rounded-xl p-3 space-y-2.5 bg-gray-50/50">
            <span className="text-[10px] font-semibold text-gray-500">ソート・件数</span>
            <FieldSelect
              label="ソートフィールド"
              table={table}
              value={binding.sortField}
              onChange={v => setBinding({ sortField: v })}
            />
            {binding.sortField && (
              <div>
                <label className={LABEL_CLS}>並び順</label>
                <div className="flex gap-1">
                  {([['asc', '昇順 ↑'], ['desc', '降順 ↓']] as const).map(([val, label]) => (
                    <button
                      key={val}
                      onClick={() => setBinding({ sortOrder: val })}
                      className={
                        (binding.sortOrder ?? 'asc') === val
                          ? 'flex-1 py-1 text-xs rounded-lg border bg-brand/10 border-brand text-brand transition-colors'
                          : 'flex-1 py-1 text-xs rounded-lg border border-gray-200 text-gray-600 hover:border-gray-300 transition-colors'
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <label className={LABEL_CLS}>表示件数の上限</label>
              <input
                type="number"
                min={0}
                value={binding.limit ?? ''}
                onChange={e => {
                  const n = Number(e.target.value);
                  setBinding({ limit: e.target.value === '' || n <= 0 ? undefined : n });
                }}
                placeholder="制限なし"
                className={INPUT_CLS}
              />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
