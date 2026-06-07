'use client';

import { useState } from 'react';
import {
  Type, Lock, Hash, ToggleLeft, Calendar, Clock,
  Image as ImageIcon, File, Link2, X, ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { FieldType, DBTable } from '@/lib/types';

interface FieldTypeOption {
  value: FieldType;
  label: string;
  icon: React.ReactNode;
}

const FIELD_TYPES: FieldTypeOption[] = [
  { value: 'text',     label: 'テキスト',         icon: <Type size={18} /> },
  { value: 'password', label: 'パスワード',         icon: <Lock size={18} /> },
  { value: 'number',   label: '数値',             icon: <Hash size={18} /> },
  { value: 'boolean',  label: 'True/False',      icon: <ToggleLeft size={18} /> },
  { value: 'datetime', label: '日時',             icon: <Clock size={18} /> },
  { value: 'date',     label: '日付',             icon: <Calendar size={18} /> },
  { value: 'image',    label: '画像',             icon: <ImageIcon size={18} /> },
  { value: 'file',     label: 'ファイル',           icon: <File size={18} /> },
  { value: 'relation', label: 'データの紐付け',     icon: <Link2 size={18} /> },
];

interface Props {
  tables: DBTable[];
  currentTableId: string;
  onClose: () => void;
  onAdd: (name: string, type: FieldType, options?: { required?: boolean; relatedTableId?: string; relationType?: '1-N' | 'N-1' | 'N-N' }) => void;
}

export default function AddFieldModal({ tables, currentTableId, onClose, onAdd }: Props) {
  const [name, setName] = useState('');
  const [selectedType, setSelectedType] = useState<FieldType>('text');
  const [required, setRequired] = useState(false);
  const [relatedTableId, setRelatedTableId] = useState('');
  const [relationType, setRelationType] = useState<'1-N' | 'N-1' | 'N-N'>('1-N');
  const [nameError, setNameError] = useState('');

  const otherTables = tables.filter(t => t.id !== currentTableId);

  const handleAdd = () => {
    if (!name.trim()) {
      setNameError('項目名を入力してください');
      return;
    }
    const opts: { required?: boolean; relatedTableId?: string; relationType?: '1-N' | 'N-1' | 'N-N' } = { required };
    if (selectedType === 'relation') {
      opts.relatedTableId = relatedTableId || otherTables[0]?.id;
      opts.relationType = relationType;
    }
    onAdd(name.trim(), selectedType, opts);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">項目を追加</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-5">
          {/* Field name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              項目名 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={e => { setName(e.target.value); setNameError(''); }}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              placeholder="例: Email, Price, Status"
              className={cn(
                'w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand transition',
                nameError ? 'border-red-400 focus:ring-red-400' : 'border-gray-300'
              )}
              autoFocus
            />
            {nameError && <p className="text-xs text-red-500 mt-1">{nameError}</p>}
          </div>

          {/* Field type grid */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">種類</label>
            <div className="grid grid-cols-3 gap-2">
              {FIELD_TYPES.map(ft => (
                <button
                  key={ft.value}
                  onClick={() => setSelectedType(ft.value)}
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-medium transition-all',
                    selectedType === ft.value
                      ? 'border-brand bg-brand-50 text-brand-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50'
                  )}
                >
                  <span className={selectedType === ft.value ? 'text-brand' : 'text-gray-400'}>
                    {ft.icon}
                  </span>
                  {ft.label}
                </button>
              ))}
            </div>
          </div>

          {/* Relation options */}
          {selectedType === 'relation' && (
            <div className="space-y-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
              <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">リレーション設定</p>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">紐付けるテーブル</label>
                {otherTables.length === 0 ? (
                  <p className="text-sm text-gray-400 italic">他にテーブルがありません</p>
                ) : (
                  <div className="relative">
                    <select
                      value={relatedTableId || otherTables[0]?.id}
                      onChange={e => setRelatedTableId(e.target.value)}
                      className="w-full appearance-none border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand pr-8 bg-white"
                    >
                      {otherTables.map(t => (
                        <option key={t.id} value={t.id}>{t.name}</option>
                      ))}
                    </select>
                    <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">リレーションの種類</label>
                <div className="flex gap-2">
                  {(['1-N', 'N-1', 'N-N'] as const).map(rt => (
                    <button
                      key={rt}
                      onClick={() => setRelationType(rt)}
                      className={cn(
                        'flex-1 py-1.5 rounded-lg border text-sm font-medium transition',
                        relationType === rt
                          ? 'border-brand bg-brand-50 text-brand-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      )}
                    >
                      {rt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Required toggle */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={required}
              onChange={e => setRequired(e.target.checked)}
              className="w-4 h-4 rounded accent-brand"
            />
            <span className="text-sm text-gray-700">この項目を必須にする</span>
          </label>
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
