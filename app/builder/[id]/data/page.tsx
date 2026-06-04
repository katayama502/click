'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Database, Lock, MoreHorizontal, Plus, Search,
  Trash2, Download, Upload, ChevronLeft, ChevronRight,
  Type, Hash, ToggleLeft, Calendar, Clock, Image, File, Link2,
  Pencil, Check, X,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { downloadCSV, cn } from '@/lib/utils';
import type { DBTable, DBField, FieldType } from '@/lib/types';
import AddFieldModal from '@/components/database/AddFieldModal';
import AddRecordModal from '@/components/database/AddRecordModal';
import EditRecordModal from '@/components/database/EditRecordModal';
import ImportCSVModal from '@/components/database/ImportCSVModal';

// ─────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────
const PAGE_SIZE = 100;

const FIELD_TYPE_ICONS: Record<FieldType, React.ReactNode> = {
  text:     <Type size={13} />,
  password: <Lock size={13} />,
  number:   <Hash size={13} />,
  boolean:  <ToggleLeft size={13} />,
  datetime: <Clock size={13} />,
  date:     <Calendar size={13} />,
  image:    <Image size={13} />,
  file:     <File size={13} />,
  relation: <Link2 size={13} />,
};

const FIELD_TYPE_LABELS: Record<FieldType, string> = {
  text: 'テキスト', password: 'パスワード', number: '数値',
  boolean: 'True/False', datetime: '日時', date: '日付',
  image: '画像', file: 'ファイル', relation: 'リレーション',
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function cellDisplay(field: DBField, value: any): React.ReactNode {
  if (value == null || value === '') return <span className="text-gray-300">—</span>;
  switch (field.type) {
    case 'password': return <span className="tracking-widest text-gray-400">••••••••</span>;
    case 'boolean':  return (
      <span className={cn(
        'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium',
        value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
      )}>
        {value ? 'True' : 'False'}
      </span>
    );
    case 'image':    return value ? <span className="text-brand text-xs truncate max-w-[120px]">{value}</span> : null;
    case 'file':     return value ? <span className="text-blue-600 text-xs truncate max-w-[120px]">{value}</span> : null;
    default:         return <span className="truncate">{String(value)}</span>;
  }
}

// ─────────────────────────────────────────────
// Inline cell editor
// ─────────────────────────────────────────────
function InlineCellEditor({
  field,
  value,
  onSave,
  onCancel,
}: {
  field: DBField;
  value: any;
  onSave: (v: any) => void;
  onCancel: () => void;
}) {
  const [draft, setDraft] = useState<any>(value ?? (field.type === 'boolean' ? false : ''));
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  if (field.type === 'password') {
    return <span className="text-xs text-gray-400 italic px-1">モーダルで編集</span>;
  }

  if (field.type === 'boolean') {
    return (
      <label className="flex items-center gap-1.5 cursor-pointer">
        <input
          type="checkbox"
          checked={!!draft}
          onChange={e => { setDraft(e.target.checked); onSave(e.target.checked); }}
          className="w-3.5 h-3.5 accent-brand"
        />
      </label>
    );
  }

  const inputType = field.type === 'number' ? 'number'
    : field.type === 'date' ? 'date'
    : field.type === 'datetime' ? 'datetime-local'
    : 'text';

  return (
    <div className="flex items-center gap-1 w-full">
      <input
        ref={inputRef}
        type={inputType}
        value={draft ?? ''}
        onChange={e => setDraft(field.type === 'number' ? (e.target.value === '' ? '' : Number(e.target.value)) : e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') { e.preventDefault(); onSave(draft); }
          if (e.key === 'Escape') onCancel();
        }}
        className="flex-1 min-w-0 border border-brand rounded px-1.5 py-0.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand"
      />
      <button onClick={() => onSave(draft)} className="text-brand hover:text-brand-600 flex-shrink-0">
        <Check size={12} />
      </button>
      <button onClick={onCancel} className="text-gray-400 hover:text-gray-600 flex-shrink-0">
        <X size={12} />
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function DataPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const {
    currentUser, apps,
    getTablesForApp, createTable, deleteTable,
    addField, updateField, deleteField,
    addRecord, updateRecord, deleteRecord, deleteRecords,
  } = useStore();

  const appId = params.id;

  // ── Guards ───────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) { router.replace('/login'); return; }
    const app = apps.find(a => a.id === appId);
    if (!app) router.replace('/workspace');
  }, [currentUser, apps, appId, router]);

  const app = apps.find(a => a.id === appId);
  const tables = getTablesForApp(appId);

  // ── State ────────────────────────────────────────────────────
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set());
  const [locked, setLocked] = useState(false);

  // Modals
  const [showAddField, setShowAddField] = useState(false);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [showEditRecord, setShowEditRecord] = useState<string | null>(null); // recordId
  const [showImportCSV, setShowImportCSV] = useState(false);

  // Inline editing
  const [editingCell, setEditingCell] = useState<{ recordId: string; fieldId: string } | null>(null);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null); // field header rename
  const [fieldNameDraft, setFieldNameDraft] = useState('');
  const fieldNameInputRef = useRef<HTMLInputElement>(null);

  // Table creation
  const [showAddTable, setShowAddTable] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const newTableInputRef = useRef<HTMLInputElement>(null);

  // Table 3-dot menus
  const [openTableMenu, setOpenTableMenu] = useState<string | null>(null);
  const [openFieldMenu, setOpenFieldMenu] = useState<string | null>(null);

  // ── Auto-select first table ───────────────────────────────────
  useEffect(() => {
    if (tables.length > 0 && !selectedTableId) {
      setSelectedTableId(tables[0].id);
    }
  }, [tables, selectedTableId]);

  // Focus table name input when shown
  useEffect(() => {
    if (showAddTable) setTimeout(() => newTableInputRef.current?.focus(), 50);
  }, [showAddTable]);

  // Focus field rename input
  useEffect(() => {
    if (editingFieldId) setTimeout(() => fieldNameInputRef.current?.focus(), 50);
  }, [editingFieldId]);

  // Close menus on outside click
  useEffect(() => {
    const handler = () => { setOpenTableMenu(null); setOpenFieldMenu(null); };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  if (!currentUser || !app) return null;

  // ── Derived ──────────────────────────────────────────────────
  const selectedTable: DBTable | undefined = tables.find(t => t.id === selectedTableId);
  const nameField = selectedTable?.fields.find(f => f.isSystem && f.name === 'Name');

  const filteredRecords = selectedTable
    ? selectedTable.records.filter(r => {
        if (!searchQuery.trim()) return true;
        if (!nameField) return true;
        const nameVal = String(r.values[nameField.id] ?? '').toLowerCase();
        return nameVal.includes(searchQuery.toLowerCase());
      })
    : [];

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages - 1);
  const pageRecords = filteredRecords.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);

  // ── Handlers ─────────────────────────────────────────────────
  const handleCreateTable = () => {
    if (!newTableName.trim()) return;
    const t = createTable(appId, newTableName.trim());
    setNewTableName('');
    setShowAddTable(false);
    setSelectedTableId(t.id);
  };

  const handleDeleteTable = (tableId: string) => {
    if (!confirm('このテーブルを削除しますか？')) return;
    deleteTable(appId, tableId);
    if (selectedTableId === tableId) setSelectedTableId(tables.find(t => t.id !== tableId)?.id ?? null);
  };

  const handleAddField = (name: string, type: FieldType, opts?: {
    required?: boolean;
    relatedTableId?: string;
    relationType?: '1-N' | 'N-1' | 'N-N';
  }) => {
    if (!selectedTableId) return;
    const field = addField(appId, selectedTableId, name, type);
    if (opts?.required || opts?.relatedTableId || opts?.relationType) {
      updateField(appId, selectedTableId, field.id, {
        required: opts.required,
        relatedTableId: opts.relatedTableId,
        relationType: opts.relationType,
      });
    }
  };

  const handleDeleteField = (fieldId: string) => {
    if (!selectedTableId) return;
    if (!confirm('この項目を削除しますか？すべてのレコードからこの値が削除されます。')) return;
    deleteField(appId, selectedTableId, fieldId);
  };

  const handleRenameFieldCommit = (fieldId: string) => {
    if (!selectedTableId || !fieldNameDraft.trim()) { setEditingFieldId(null); return; }
    updateField(appId, selectedTableId, fieldId, { name: fieldNameDraft.trim() });
    setEditingFieldId(null);
  };

  const handleAddRecord = (values: Record<string, any>) => {
    if (!selectedTableId) return;
    addRecord(appId, selectedTableId, values);
  };

  const handleCellSave = (recordId: string, fieldId: string, value: any) => {
    if (!selectedTableId) return;
    updateRecord(appId, selectedTableId, recordId, { [fieldId]: value });
    setEditingCell(null);
  };

  const handleDeleteSelected = () => {
    if (!selectedTableId || selectedRecordIds.size === 0) return;
    if (!confirm(`${selectedRecordIds.size}件のレコードを削除しますか？`)) return;
    deleteRecords(appId, selectedTableId, Array.from(selectedRecordIds));
    setSelectedRecordIds(new Set());
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) setSelectedRecordIds(new Set(pageRecords.map(r => r.id)));
    else setSelectedRecordIds(new Set());
  };

  const handleSelectRecord = (id: string, checked: boolean) => {
    setSelectedRecordIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id);
      else next.delete(id);
      return next;
    });
  };

  const handleDownloadCSV = () => {
    if (!selectedTable) return;
    const headers = ['id', ...selectedTable.fields.map(f => f.name), 'createdAt', 'updatedAt'];
    const rows = selectedTable.records.map(r => [
      r.id,
      ...selectedTable.fields.map(f => {
        const v = r.values[f.id];
        return v == null ? '' : String(v);
      }),
      r.createdAt,
      r.updatedAt,
    ]);
    downloadCSV(headers, rows, `${selectedTable.name}.csv`);
  };

  const handleImportCSV = (records: Record<string, any>[]) => {
    if (!selectedTableId) return;
    records.forEach(values => addRecord(appId, selectedTableId, values));
  };

  const allPageSelected = pageRecords.length > 0 && pageRecords.every(r => selectedRecordIds.has(r.id));
  const somePageSelected = pageRecords.some(r => selectedRecordIds.has(r.id));

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">
      {/* ── Top Nav ─────────────────────────────────────────────── */}
      <header className="h-12 border-b border-gray-200 flex items-center px-4 gap-3 flex-shrink-0 bg-white z-20">
        {/* Logo + Back */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            onClick={() => router.push('/workspace')}
            className="flex items-center gap-1.5 text-gray-500 hover:text-gray-700 transition-colors"
          >
            <ChevronLeft size={16} />
            <div className="w-6 h-6 bg-brand rounded flex items-center justify-center">
              <span className="text-white font-bold text-[10px]">C</span>
            </div>
          </button>
          <span className="text-sm font-semibold text-gray-800 truncate max-w-[140px]">{app.name}</span>
        </div>

        {/* Tab navigation */}
        <div className="flex items-center gap-0.5 bg-gray-100 rounded-lg p-0.5 ml-2">
          <button
            onClick={() => router.push(`/builder/${appId}`)}
            className="px-3 py-1.5 text-xs font-medium rounded-md text-gray-600 hover:text-gray-800 hover:bg-white transition-colors"
          >
            キャンバス
          </button>
          <button
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-white text-brand shadow-sm"
          >
            データ
          </button>
        </div>
      </header>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left Sidebar ──────────────────────────────────────── */}
        <aside className="w-52 flex-shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden">
          {/* Sidebar header */}
          <div className="px-3 py-2.5 border-b border-gray-200 flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">テーブル</span>
            <span className="text-xs text-gray-400 font-medium">{tables.length}</span>
          </div>

          {/* Table list */}
          <div className="flex-1 overflow-y-auto py-1">
            {tables.map(table => (
              <div
                key={table.id}
                onClick={() => {
                  setSelectedTableId(table.id);
                  setSelectedRecordIds(new Set());
                  setCurrentPage(0);
                  setSearchQuery('');
                }}
                className={cn(
                  'group flex items-center gap-2 px-3 py-2 cursor-pointer text-sm transition-colors relative',
                  selectedTableId === table.id
                    ? 'bg-brand-50 text-brand-700 border-l-2 border-brand'
                    : 'text-gray-700 hover:bg-gray-100 border-l-2 border-transparent'
                )}
              >
                {table.isSystem
                  ? <Lock size={13} className="flex-shrink-0 text-gray-400" />
                  : <Database size={13} className="flex-shrink-0" />
                }
                <span className="flex-1 truncate font-medium text-xs">{table.name}</span>

                {!table.isSystem && (
                  <button
                    onClick={e => { e.stopPropagation(); setOpenTableMenu(openTableMenu === table.id ? null : table.id); }}
                    className="opacity-0 group-hover:opacity-100 p-0.5 rounded hover:bg-gray-200 transition-all"
                  >
                    <MoreHorizontal size={14} />
                  </button>
                )}

                {/* Table menu */}
                {openTableMenu === table.id && (
                  <div
                    className="absolute left-full top-0 ml-1 w-28 bg-white rounded-lg shadow-lg border border-gray-200 z-30 py-1"
                    onClick={e => e.stopPropagation()}
                  >
                    <button
                      onClick={() => { handleDeleteTable(table.id); setOpenTableMenu(null); }}
                      className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-1.5"
                    >
                      <Trash2 size={12} />
                      削除
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Add table */}
          <div className="border-t border-gray-200 p-2">
            {showAddTable ? (
              <div className="flex items-center gap-1">
                <input
                  ref={newTableInputRef}
                  type="text"
                  value={newTableName}
                  onChange={e => setNewTableName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleCreateTable();
                    if (e.key === 'Escape') { setShowAddTable(false); setNewTableName(''); }
                  }}
                  placeholder="テーブル名"
                  className="flex-1 min-w-0 border border-gray-300 rounded px-2 py-1 text-xs focus:outline-none focus:ring-1 focus:ring-brand"
                />
                <button onClick={handleCreateTable} className="text-brand hover:text-brand-600">
                  <Check size={14} />
                </button>
                <button onClick={() => { setShowAddTable(false); setNewTableName(''); }} className="text-gray-400">
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddTable(true)}
                className="w-full flex items-center gap-1.5 px-2 py-1.5 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <Plus size={13} />
                テーブルを追加
              </button>
            )}
          </div>
        </aside>

        {/* ── Main Content ─────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          {!selectedTable ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Database size={40} className="mx-auto mb-3 opacity-40" />
                <p className="text-sm font-medium">テーブルを選択してください</p>
                <p className="text-xs mt-1">左のリストからテーブルを選択するか、新しいテーブルを作成してください</p>
              </div>
            </div>
          ) : (
            <>
              {/* ── Toolbar ────────────────────────────────────── */}
              <div className="h-12 border-b border-gray-200 flex items-center gap-2 px-4 flex-shrink-0">
                {/* Left actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAddRecord(true)}
                    className="flex items-center gap-1.5 bg-brand hover:bg-brand-600 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Plus size={13} />
                    レコードを追加
                  </button>

                  <button
                    onClick={() => setShowImportCSV(true)}
                    className="flex items-center gap-1.5 border border-gray-300 text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Upload size={13} />
                    CSVをアップロード
                  </button>

                  <button
                    onClick={handleDownloadCSV}
                    className="flex items-center gap-1.5 border border-gray-300 text-gray-600 hover:bg-gray-50 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                  >
                    <Download size={13} />
                    CSVをダウンロード
                  </button>

                  {selectedRecordIds.size > 0 && (
                    <button
                      onClick={handleDeleteSelected}
                      className="flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Trash2 size={13} />
                      選択した{selectedRecordIds.size}件を削除
                    </button>
                  )}
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Lock toggle */}
                <label className="flex items-center gap-1.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={locked}
                    onChange={e => setLocked(e.target.checked)}
                    className="w-3.5 h-3.5 rounded accent-brand"
                  />
                  <span className="text-xs text-gray-500">ロック</span>
                </label>

                {/* Record count */}
                <span className="text-xs text-gray-400 font-medium">
                  {filteredRecords.length} 件
                </span>

                {/* Search */}
                <div className="relative">
                  <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setCurrentPage(0); }}
                    placeholder="Nameで検索..."
                    className="pl-7 pr-3 py-1.5 border border-gray-300 rounded-lg text-xs w-44 focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </div>
              </div>

              {/* ── Table ──────────────────────────────────────── */}
              <div className="flex-1 overflow-auto">
                <table className="w-full text-xs border-collapse min-w-max">
                  {/* Header */}
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gray-100 border-b border-gray-200">
                      {/* Checkbox */}
                      <th className="w-9 px-2 py-2.5 text-left border-r border-gray-200">
                        <input
                          type="checkbox"
                          checked={allPageSelected}
                          ref={el => { if (el) el.indeterminate = somePageSelected && !allPageSelected; }}
                          onChange={e => handleSelectAll(e.target.checked)}
                          className="w-3.5 h-3.5 accent-brand"
                        />
                      </th>

                      {/* Field headers */}
                      {selectedTable.fields.map(field => (
                        <th
                          key={field.id}
                          className="px-3 py-2.5 text-left font-medium text-gray-600 border-r border-gray-200 min-w-[120px] max-w-[240px] relative group"
                        >
                          {editingFieldId === field.id && !field.isSystem ? (
                            <div className="flex items-center gap-1">
                              <input
                                ref={fieldNameInputRef}
                                type="text"
                                value={fieldNameDraft}
                                onChange={e => setFieldNameDraft(e.target.value)}
                                onKeyDown={e => {
                                  if (e.key === 'Enter') handleRenameFieldCommit(field.id);
                                  if (e.key === 'Escape') setEditingFieldId(null);
                                }}
                                onBlur={() => handleRenameFieldCommit(field.id)}
                                className="flex-1 min-w-0 border border-brand rounded px-1 py-0.5 text-xs focus:outline-none"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-400 flex-shrink-0">{FIELD_TYPE_ICONS[field.type]}</span>
                              <span
                                className="truncate"
                                onDoubleClick={() => {
                                  if (field.isSystem || locked) return;
                                  setEditingFieldId(field.id);
                                  setFieldNameDraft(field.name);
                                }}
                              >
                                {field.name}
                              </span>
                              {field.isSystem && <Lock size={10} className="text-gray-300 flex-shrink-0" />}

                              {/* Field menu */}
                              {!field.isSystem && !locked && (
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    setOpenFieldMenu(openFieldMenu === field.id ? null : field.id);
                                  }}
                                  className="opacity-0 group-hover:opacity-100 ml-auto p-0.5 rounded hover:bg-gray-200 flex-shrink-0 transition-all"
                                >
                                  <MoreHorizontal size={12} />
                                </button>
                              )}

                              {openFieldMenu === field.id && (
                                <div
                                  className="absolute top-full left-0 mt-1 w-28 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => {
                                      setEditingFieldId(field.id);
                                      setFieldNameDraft(field.name);
                                      setOpenFieldMenu(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-1.5"
                                  >
                                    <Pencil size={11} />
                                    名前を変更
                                  </button>
                                  <button
                                    onClick={() => { handleDeleteField(field.id); setOpenFieldMenu(null); }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-1.5"
                                  >
                                    <Trash2 size={11} />
                                    削除
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                          {/* Type badge tooltip on hover */}
                          <span className="absolute -bottom-0.5 left-0 right-0 h-0.5 bg-transparent group-hover:bg-brand-100 transition-colors" />
                        </th>
                      ))}

                      {/* Add field */}
                      {!locked && (
                        <th className="px-3 py-2.5 text-left w-32">
                          <button
                            onClick={() => setShowAddField(true)}
                            className="flex items-center gap-1 text-gray-400 hover:text-brand transition-colors font-medium"
                          >
                            <Plus size={13} />
                            <span>項目を追加</span>
                          </button>
                        </th>
                      )}
                    </tr>
                  </thead>

                  {/* Body */}
                  <tbody>
                    {pageRecords.length === 0 && (
                      <tr>
                        <td
                          colSpan={selectedTable.fields.length + 2}
                          className="px-4 py-12 text-center text-gray-400"
                        >
                          {searchQuery ? '検索結果がありません' : 'レコードがありません。「レコードを追加」ボタンから追加してください。'}
                        </td>
                      </tr>
                    )}
                    {pageRecords.map((record, ri) => (
                      <tr
                        key={record.id}
                        className={cn(
                          'border-b border-gray-100 group transition-colors',
                          ri % 2 === 1 ? 'bg-gray-50/50' : 'bg-white',
                          selectedRecordIds.has(record.id) ? 'bg-brand-50/60' : 'hover:bg-gray-50'
                        )}
                      >
                        {/* Checkbox */}
                        <td className="w-9 px-2 py-2 border-r border-gray-100">
                          <input
                            type="checkbox"
                            checked={selectedRecordIds.has(record.id)}
                            onChange={e => handleSelectRecord(record.id, e.target.checked)}
                            className="w-3.5 h-3.5 accent-brand"
                          />
                        </td>

                        {/* Data cells */}
                        {selectedTable.fields.map(field => (
                          <td
                            key={field.id}
                            className="px-3 py-2 border-r border-gray-100 min-w-[120px] max-w-[240px]"
                            onDoubleClick={() => {
                              if (locked || field.type === 'password') return;
                              setEditingCell({ recordId: record.id, fieldId: field.id });
                            }}
                          >
                            {editingCell?.recordId === record.id && editingCell?.fieldId === field.id ? (
                              <InlineCellEditor
                                field={field}
                                value={record.values[field.id]}
                                onSave={v => handleCellSave(record.id, field.id, v)}
                                onCancel={() => setEditingCell(null)}
                              />
                            ) : (
                              <div className="flex items-center gap-1.5 text-gray-700">
                                {cellDisplay(field, record.values[field.id])}
                              </div>
                            )}
                          </td>
                        ))}

                        {/* Edit action */}
                        {!locked && (
                          <td className="px-2 py-2">
                            <button
                              onClick={() => setShowEditRecord(record.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-all"
                            >
                              <Pencil size={12} />
                            </button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination ─────────────────────────────────── */}
              {filteredRecords.length > PAGE_SIZE && (
                <div className="h-10 border-t border-gray-200 flex items-center justify-between px-4 flex-shrink-0 bg-white">
                  <span className="text-xs text-gray-500">
                    {safePage * PAGE_SIZE + 1}–{Math.min((safePage + 1) * PAGE_SIZE, filteredRecords.length)} / {filteredRecords.length}件
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(0, p - 1))}
                      disabled={safePage === 0}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronLeft size={14} />
                    </button>
                    <span className="text-xs text-gray-600 px-1">{safePage + 1} / {totalPages}</span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages - 1, p + 1))}
                      disabled={safePage >= totalPages - 1}
                      className="p-1 rounded hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    >
                      <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* ── Modals ──────────────────────────────────────────────── */}
      {showAddField && selectedTable && (
        <AddFieldModal
          tables={tables}
          currentTableId={selectedTable.id}
          onClose={() => setShowAddField(false)}
          onAdd={handleAddField}
        />
      )}

      {showAddRecord && selectedTable && (
        <AddRecordModal
          table={selectedTable}
          allTables={tables}
          onClose={() => setShowAddRecord(false)}
          onAdd={handleAddRecord}
        />
      )}

      {showEditRecord && selectedTable && (() => {
        const record = selectedTable.records.find(r => r.id === showEditRecord);
        if (!record) return null;
        return (
          <EditRecordModal
            table={selectedTable}
            record={record}
            allTables={tables}
            onClose={() => setShowEditRecord(null)}
            onSave={values => updateRecord(appId, selectedTable.id, record.id, values)}
          />
        );
      })()}

      {showImportCSV && selectedTable && (
        <ImportCSVModal
          fields={selectedTable.fields}
          onClose={() => setShowImportCSV(false)}
          onImport={handleImportCSV}
        />
      )}
    </div>
  );
}
