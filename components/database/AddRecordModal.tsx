'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DBField, DBTable } from '@/lib/types';

interface Props {
  table: DBTable;
  allTables: DBTable[];
  onClose: () => void;
  onAdd: (values: Record<string, any>) => void;
}

function FieldInput({
  field,
  value,
  onChange,
  allTables,
}: {
  field: DBField;
  value: any;
  onChange: (v: any) => void;
  allTables: DBTable[];
}) {
  const base = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand transition';

  switch (field.type) {
    case 'boolean':
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={!!value}
            onChange={e => onChange(e.target.checked)}
            className="w-4 h-4 rounded accent-brand"
          />
          <span className="text-sm text-gray-600">{value ? 'True' : 'False'}</span>
        </label>
      );
    case 'number':
      return (
        <input
          type="number"
          value={value ?? ''}
          onChange={e => onChange(e.target.value === '' ? '' : Number(e.target.value))}
          className={base}
        />
      );
    case 'date':
      return (
        <input
          type="date"
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          className={base}
        />
      );
    case 'datetime':
      return (
        <input
          type="datetime-local"
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          className={base}
        />
      );
    case 'password':
      return (
        <input
          type="password"
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          placeholder="パスワード"
          className={base}
        />
      );
    case 'image':
    case 'file':
      return (
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={value ?? ''}
            onChange={e => onChange(e.target.value)}
            placeholder="URLまたはファイル名"
            className={cn(base, 'flex-1')}
          />
        </div>
      );
    case 'relation': {
      const relatedTable = allTables.find(t => t.id === field.relatedTableId);
      if (!relatedTable) {
        return <p className="text-sm text-gray-400 italic">関連テーブルが見つかりません</p>;
      }
      const nameField = relatedTable.fields.find(f => f.name === 'Name' || f.isSystem);
      return (
        <select
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          className={base}
        >
          <option value="">選択してください</option>
          {relatedTable.records.map(r => (
            <option key={r.id} value={r.id}>
              {nameField ? (r.values[nameField.id] ?? r.id) : r.id}
            </option>
          ))}
        </select>
      );
    }
    default:
      return (
        <input
          type="text"
          value={value ?? ''}
          onChange={e => onChange(e.target.value)}
          className={base}
        />
      );
  }
}

export default function AddRecordModal({ table, allTables, onClose, onAdd }: Props) {
  const editableFields = table.fields.filter(f => !f.isSystem || f.name !== 'id');

  const [values, setValues] = useState<Record<string, any>>(() => {
    const init: Record<string, any> = {};
    editableFields.forEach(f => {
      if (f.type === 'boolean') init[f.id] = false;
      else init[f.id] = '';
    });
    return init;
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleAdd = () => {
    const newErrors: Record<string, string> = {};
    editableFields.forEach(f => {
      if (f.required && (values[f.id] === '' || values[f.id] == null)) {
        newErrors[f.id] = 'この項目は必須です';
      }
    });
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }
    onAdd(values);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">レコードを追加</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {editableFields.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-4">入力項目がありません</p>
          )}
          {editableFields.map(field => (
            <div key={field.id}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {field.name}
                {field.required && <span className="text-red-500 ml-1">*</span>}
                <span className="ml-1.5 text-xs text-gray-400 font-normal">{field.type}</span>
              </label>
              <FieldInput
                field={field}
                value={values[field.id]}
                onChange={v => {
                  setValues(prev => ({ ...prev, [field.id]: v }));
                  setErrors(prev => { const e = { ...prev }; delete e[field.id]; return e; });
                }}
                allTables={allTables}
              />
              {errors[field.id] && (
                <p className="text-xs text-red-500 mt-1">{errors[field.id]}</p>
              )}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-6 py-4 border-t border-gray-200">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-300 text-gray-700 rounded-lg py-2 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={handleAdd}
            className="flex-1 bg-brand hover:bg-brand-600 text-white rounded-lg py-2 text-sm font-medium transition-colors"
          >
            追加
          </button>
        </div>
      </div>
    </div>
  );
}
