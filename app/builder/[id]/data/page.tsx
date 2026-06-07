'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  Database, Lock, MoreHorizontal, Plus, Search,
  Trash2, Download, Upload, ChevronLeft, ChevronRight,
  Type, Hash, ToggleLeft, Calendar, Clock, Image as ImageIcon, File, Link2,
  Pencil, Check, X, ChevronDown, Smartphone, Tablet, Monitor,
  Undo2, Redo2, Eye, Settings, ExternalLink,
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
const RECORD_LIMIT = 1000;

const FIELD_TYPE_ICONS: Record<FieldType, React.ReactNode> = {
  text:     <Type size={12} />,
  password: <Lock size={12} />,
  number:   <Hash size={12} />,
  boolean:  <ToggleLeft size={12} />,
  datetime: <Clock size={12} />,
  date:     <Calendar size={12} />,
  image:    <ImageIcon size={12} />,
  file:     <File size={12} />,
  relation: <Link2 size={12} />,
};

// ─────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────
function cellDisplay(field: DBField, value: any): React.ReactNode {
  if (value == null || value === '') return <span className="text-gray-300">—</span>;
  switch (field.type) {
    case 'password':
      return <span className="tracking-widest text-gray-400 text-xs">••••••••</span>;
    case 'boolean':
      return (
        <span className={cn(
          'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
          value ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        )}>
          {value ? 'True' : 'False'}
        </span>
      );
    case 'image':
      return value ? <span className="text-brand text-xs truncate max-w-[140px]">{value}</span> : null;
    case 'file':
      return value ? <span className="text-blue-600 text-xs truncate max-w-[140px]">{value}</span> : null;
    default:
      return <span className="truncate text-gray-700">{String(value)}</span>;
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

  const inputType =
    field.type === 'number' ? 'number' :
    field.type === 'date' ? 'date' :
    field.type === 'datetime' ? 'datetime-local' : 'text';

  return (
    <div className="flex items-center gap-1 w-full">
      <input
        ref={inputRef}
        type={inputType}
        value={draft ?? ''}
        onChange={e => setDraft(
          field.type === 'number'
            ? (e.target.value === '' ? '' : Number(e.target.value))
            : e.target.value
        )}
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
// Top Navigation (mirrors builder page)
// ─────────────────────────────────────────────
function TopNav({
  appName,
  workspaceName,
  appId,
  appVersion,
  appPublished,
  onPublish,
  router,
}: {
  appName: string;
  workspaceName: string;
  appId: string;
  appVersion: string;
  appPublished: boolean;
  onPublish: () => void;
  router: ReturnType<typeof useRouter>;
}) {
  return (
    <header className="h-12 flex items-center px-3 gap-3 border-b border-gray-200 bg-white flex-shrink-0 z-40">
      {/* Logo + workspace/app name */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <button
          onClick={() => router.push('/workspace')}
          className="w-7 h-7 bg-brand rounded-md flex items-center justify-center text-white font-bold text-sm hover:bg-brand-600 transition-colors flex-shrink-0"
          title="ワークスペースへ"
        >
          C
        </button>
        <div className="flex flex-col leading-none min-w-0">
          <span className="text-[10px] text-gray-400 truncate max-w-[120px]">{workspaceName}</span>
          <span className="text-sm font-semibold text-gray-800 truncate max-w-[120px]">{appName}</span>
        </div>
        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500 rounded flex-shrink-0">
          {appVersion}
        </span>
      </div>

      {/* Divider */}
      <div className="w-px h-5 bg-gray-200 flex-shrink-0" />

      {/* Settings / Admin links */}
      <div className="flex items-center gap-1">
        <button className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
          <Settings size={13} />
          設定
        </button>
        <button className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-md transition-colors">
          <ExternalLink size={13} />
          管理画面
        </button>
      </div>

      {/* Center tabs */}
      <div className="flex-1 flex items-center justify-center gap-1">
        <button
          onClick={() => router.push(`/builder/${appId}`)}
          className="px-3 py-1.5 text-sm rounded-md transition-colors text-gray-500 hover:text-gray-700 hover:bg-gray-100"
        >
          キャンバス
        </button>
        <button
          className="px-3 py-1.5 text-sm rounded-md transition-colors bg-brand/10 text-brand font-medium"
        >
          データベース
        </button>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <button
          onClick={() => router.push(`/builder/${appId}/preview`)}
          className="flex items-center gap-1.5 px-3 h-7 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors"
        >
          <Eye size={14} />
          プレビュー
        </button>
        <button
          onClick={onPublish}
          className={cn(
            'flex items-center gap-1.5 px-3 h-7 text-sm rounded-md font-medium transition-colors',
            appPublished
              ? 'bg-brand/10 text-brand hover:bg-brand/20'
              : 'bg-brand text-white hover:bg-brand-600'
          )}
        >
          {appPublished ? '公開済み' : '公開'}
        </button>
      </div>
    </header>
  );
}

// ─────────────────────────────────────────────
// Main Page
// ─────────────────────────────────────────────
export default function DataPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const {
    currentUser, apps, workspace,
    getTablesForApp, createTable, deleteTable,
    addField, updateField, deleteField,
    addRecord, updateRecord, deleteRecord, deleteRecords,
    updateApp,
  } = useStore();

  const appId = params.id;

  // ── Guards ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) { router.replace('/login'); return; }
    const app = apps.find(a => a.id === appId);
    if (!app) router.replace('/workspace');
  }, [currentUser, apps, appId, router]);

  const app = apps.find(a => a.id === appId);
  const tables = getTablesForApp(appId);

  // ── State ───────────────────────────────────────────────────────────────
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(0);
  const [selectedRecordIds, setSelectedRecordIds] = useState<Set<string>>(new Set());

  // Modals
  const [showAddField, setShowAddField] = useState(false);
  const [showAddRecord, setShowAddRecord] = useState(false);
  const [showEditRecord, setShowEditRecord] = useState<string | null>(null);
  const [showImportCSV, setShowImportCSV] = useState(false);

  // Inline editing
  const [editingCell, setEditingCell] = useState<{ recordId: string; fieldId: string } | null>(null);
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [fieldNameDraft, setFieldNameDraft] = useState('');
  const fieldNameInputRef = useRef<HTMLInputElement>(null);

  // Table creation
  const [showAddTable, setShowAddTable] = useState(false);
  const [newTableName, setNewTableName] = useState('');
  const newTableInputRef = useRef<HTMLInputElement>(null);

  // Menus
  const [openTableMenu, setOpenTableMenu] = useState<string | null>(null);
  const [openFieldMenu, setOpenFieldMenu] = useState<string | null>(null);

  // Filter dropdown
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);

  // ── Auto-select first table ──────────────────────────────────────────────
  useEffect(() => {
    if (tables.length > 0 && !selectedTableId) {
      setSelectedTableId(tables[0].id);
    }
  }, [tables, selectedTableId]);

  useEffect(() => {
    if (showAddTable) setTimeout(() => newTableInputRef.current?.focus(), 50);
  }, [showAddTable]);

  useEffect(() => {
    if (editingFieldId) setTimeout(() => fieldNameInputRef.current?.focus(), 50);
  }, [editingFieldId]);

  // Close menus on outside click
  useEffect(() => {
    const handler = () => {
      setOpenTableMenu(null);
      setOpenFieldMenu(null);
      setShowFilterDropdown(false);
    };
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  if (!currentUser || !app) return null;

  // ── Derived ─────────────────────────────────────────────────────────────
  const selectedTable: DBTable | undefined = tables.find(t => t.id === selectedTableId);
  const nameField = selectedTable?.fields.find(f => f.isSystem && f.name === 'Name');

  const filteredRecords = selectedTable
    ? selectedTable.records.filter(r => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        // Search all text fields
        return selectedTable.fields.some(f => {
          const v = r.values[f.id];
          return v != null && String(v).toLowerCase().includes(q);
        });
      })
    : [];

  const totalPages = Math.max(1, Math.ceil(filteredRecords.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages - 1);
  const pageRecords = filteredRecords.slice(safePage * PAGE_SIZE, (safePage + 1) * PAGE_SIZE);
  const allPageSelected = pageRecords.length > 0 && pageRecords.every(r => selectedRecordIds.has(r.id));
  const somePageSelected = pageRecords.some(r => selectedRecordIds.has(r.id));

  // Total records across all tables for record count display
  const totalRecordCount = selectedTable ? selectedTable.records.length : 0;

  // ── Handlers ────────────────────────────────────────────────────────────
  const handleCreateTable = () => {
    if (!newTableName.trim()) return;
    const t = createTable(appId, newTableName.trim());
    setNewTableName('');
    setShowAddTable(false);
    setSelectedTableId(t.id);
  };

  const handleDeleteTable = (tableId: string) => {
    if (!confirm('このテーブルを削除しますか？すべてのレコードも削除されます。')) return;
    deleteTable(appId, tableId);
    if (selectedTableId === tableId) {
      setSelectedTableId(tables.find(t => t.id !== tableId)?.id ?? null);
    }
    setOpenTableMenu(null);
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
    setOpenFieldMenu(null);
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
      if (checked) next.add(id); else next.delete(id);
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

  const handlePublish = () => {
    updateApp(appId, { published: true, publishedUrl: `https://click-app.example.com/${appId}` });
  };

  const workspaceName = workspace?.name ?? 'ワークスペース';

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen bg-white overflow-hidden">

      {/* ── Top Navigation ─────────────────────────────────────────────── */}
      <TopNav
        appName={app.name}
        workspaceName={workspaceName}
        appId={appId}
        appVersion={app.version}
        appPublished={app.published}
        onPublish={handlePublish}
        router={router}
      />

      {/* ── Body ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── Left Sidebar (210px) ──────────────────────────────────────── */}
        <aside className="w-[210px] flex-shrink-0 bg-white border-r border-gray-200 flex flex-col overflow-hidden">

          {/* Section label */}
          <div className="px-4 pt-4 pb-2 flex-shrink-0">
            <span className="text-base font-bold text-gray-800">データベース</span>
          </div>

          {/* Add table button */}
          <div className="px-3 pb-2 flex-shrink-0">
            {showAddTable ? (
              <div className="flex items-center gap-1 px-1">
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
                  className="flex-1 min-w-0 border border-gray-300 rounded-md px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-brand"
                />
                <button onClick={handleCreateTable} className="text-brand hover:text-brand-600 flex-shrink-0">
                  <Check size={14} />
                </button>
                <button
                  onClick={() => { setShowAddTable(false); setNewTableName(''); }}
                  className="text-gray-400 hover:text-gray-600 flex-shrink-0"
                >
                  <X size={14} />
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddTable(true)}
                className="w-full flex items-center justify-center gap-2 bg-brand text-white rounded-lg px-3 py-2 text-sm font-medium hover:bg-brand-600 transition-colors"
              >
                <Plus size={14} />
                テーブル追加
              </button>
            )}
          </div>

          {/* Table list */}
          <div className="flex-1 overflow-y-auto">
            {tables.map(table => (
              <div
                key={table.id}
                onClick={() => {
                  setSelectedTableId(table.id);
                  setSelectedRecordIds(new Set());
                  setCurrentPage(0);
                  setSearchQuery('');
                  setEditingCell(null);
                }}
                className={cn(
                  'group relative flex items-center gap-2 px-4 py-2.5 cursor-pointer text-sm transition-colors border-l-2',
                  selectedTableId === table.id
                    ? 'border-brand bg-brand/5 text-brand'
                    : 'border-transparent text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                )}
              >
                {table.isSystem
                  ? <Lock size={13} className={cn('flex-shrink-0', selectedTableId === table.id ? 'text-brand' : 'text-gray-400')} />
                  : <Database size={13} className={cn('flex-shrink-0', selectedTableId === table.id ? 'text-brand' : 'text-gray-400')} />
                }
                <span className="flex-1 truncate font-medium text-xs">{table.name}</span>

                <button
                  onClick={e => {
                    e.stopPropagation();
                    setOpenTableMenu(openTableMenu === table.id ? null : table.id);
                  }}
                  className={cn(
                    'p-0.5 rounded hover:bg-gray-200 transition-all flex-shrink-0',
                    openTableMenu === table.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  )}
                >
                  <MoreHorizontal size={13} className="text-gray-500" />
                </button>

                {/* Table context menu */}
                {openTableMenu === table.id && (
                  <div
                    className="absolute left-full top-0 ml-1 w-32 bg-white rounded-lg shadow-lg border border-gray-200 z-30 py-1"
                    onClick={e => e.stopPropagation()}
                  >
                    {table.isSystem ? (
                      <div className="px-3 py-1.5 text-xs text-gray-400 flex items-center gap-1.5">
                        <Lock size={11} />
                        システムテーブル
                      </div>
                    ) : (
                      <button
                        onClick={() => handleDeleteTable(table.id)}
                        className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-1.5 transition-colors"
                      >
                        <Trash2 size={12} />
                        削除
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* External API section */}
          <div className="border-t border-gray-200 flex-shrink-0">
            <div className="px-4 pt-3 pb-1.5">
              <span className="text-xs text-gray-400 font-medium">外部API接続</span>
            </div>
            <div className="px-3 pb-3">
              <button className="w-full flex items-center justify-center gap-1.5 border border-brand text-brand rounded-lg px-3 py-1.5 text-xs font-medium hover:bg-brand/5 transition-colors">
                <Plus size={12} />
                外部APIを追加
              </button>
            </div>
          </div>

          {/* Record count footer */}
          <div className="border-t border-gray-100 px-4 py-2.5 flex-shrink-0">
            <div className="text-xs text-gray-400">
              <div className="font-medium text-gray-500">レコード数</div>
              <div className="mt-0.5">
                <span className="font-semibold text-gray-700">{totalRecordCount}</span>
                <span className="text-gray-400">/{RECORD_LIMIT}</span>
              </div>
              {/* Progress bar */}
              <div className="mt-1.5 h-1 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-brand rounded-full transition-all"
                  style={{ width: `${Math.min(100, (totalRecordCount / RECORD_LIMIT) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main Content ────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col overflow-hidden bg-white">
          {!selectedTable ? (
            /* Empty state — no table selected */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-gray-400">
                <Database size={48} className="mx-auto mb-4 opacity-25" />
                <p className="text-sm font-medium text-gray-500">テーブルを選択してください</p>
                <p className="text-xs mt-1.5 text-gray-400">左のリストからテーブルを選択するか、新しいテーブルを作成してください</p>
              </div>
            </div>
          ) : (
            <>
              {/* ── Table title + count ─────────────────────────────────── */}
              <div className="px-6 pt-5 pb-0 flex-shrink-0">
                <div className="flex items-center gap-3">
                  <h1 className="text-2xl font-bold text-gray-900">{selectedTable.name}</h1>
                  <span className="bg-gray-100 text-gray-500 text-sm font-medium rounded-full px-2.5 py-0.5">
                    {filteredRecords.length}
                  </span>
                  {selectedRecordIds.size > 0 && (
                    <button
                      onClick={handleDeleteSelected}
                      className="ml-2 flex items-center gap-1.5 bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 px-3 py-1 rounded-lg text-xs font-medium transition-colors"
                    >
                      <Trash2 size={12} />
                      {selectedRecordIds.size}件を削除
                    </button>
                  )}
                </div>
              </div>

              {/* ── Toolbar ────────────────────────────────────────────────── */}
              <div className="px-6 mt-4 mb-0 flex items-center gap-2 flex-shrink-0 flex-wrap">
                {/* Filter dropdown */}
                <div className="relative">
                  <button
                    onClick={e => { e.stopPropagation(); setShowFilterDropdown(!showFilterDropdown); }}
                    className="flex items-center gap-1.5 border border-gray-300 text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm transition-colors"
                  >
                    すべての項目
                    <ChevronDown size={13} className="text-gray-400" />
                  </button>
                  {showFilterDropdown && (
                    <div
                      className="absolute top-full left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1"
                      onClick={e => e.stopPropagation()}
                    >
                      <div className="px-3 py-1.5 text-xs text-gray-400 font-medium uppercase tracking-wide">表示項目</div>
                      {selectedTable.fields.map(f => (
                        <label key={f.id} className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 cursor-pointer">
                          <input type="checkbox" defaultChecked className="accent-brand w-3.5 h-3.5" />
                          <span className="text-gray-400 flex-shrink-0">{FIELD_TYPE_ICONS[f.type]}</span>
                          {f.name}
                        </label>
                      ))}
                    </div>
                  )}
                </div>

                {/* Search */}
                <div className="relative">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={e => { setSearchQuery(e.target.value); setCurrentPage(0); }}
                    placeholder="検索..."
                    className="pl-8 pr-3 py-2 border border-gray-300 rounded-lg text-sm w-48 focus:outline-none focus:ring-1 focus:ring-brand focus:border-brand transition-colors"
                  />
                </div>

                {/* Advanced search */}
                <button className="text-sm text-gray-500 hover:text-gray-800 transition-colors px-1">
                  高度な検索
                </button>

                {/* Decorative integration icons */}
                <div className="flex items-center gap-1 ml-0.5">
                  <div className="w-5 h-5 rounded-full bg-green-500 opacity-80 flex-shrink-0" title="Googleスプレッドシート連携" />
                  <div className="w-5 h-5 rounded-full bg-amber-400 opacity-80 flex-shrink-0" title="外部API連携" />
                </div>

                {/* Spacer */}
                <div className="flex-1" />

                {/* Upload */}
                <button
                  onClick={() => setShowImportCSV(true)}
                  className="flex items-center gap-1.5 border border-gray-300 text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm transition-colors"
                >
                  <Upload size={14} />
                  アップロード
                </button>

                {/* Download */}
                <button
                  onClick={handleDownloadCSV}
                  className="flex items-center gap-1.5 border border-gray-300 text-gray-600 hover:bg-gray-50 px-3 py-2 rounded-lg text-sm transition-colors"
                >
                  <Download size={14} />
                  ダウンロード
                </button>

                {/* Add record */}
                <button
                  onClick={() => setShowAddRecord(true)}
                  className="flex items-center gap-1.5 bg-brand hover:bg-brand-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  <Plus size={14} />
                  レコード追加
                </button>
              </div>

              {/* ── Table ─────────────────────────────────────────────────── */}
              <div className="flex-1 overflow-auto mt-3">
                <table className="w-full text-xs border-collapse min-w-max">
                  {/* Header */}
                  <thead className="sticky top-0 z-10">
                    <tr className="bg-gray-50 border-y border-gray-200">
                      {/* Checkbox col */}
                      <th className="w-10 px-3 py-2.5 text-left border-r border-gray-200">
                        <input
                          type="checkbox"
                          checked={allPageSelected}
                          ref={el => { if (el) el.indeterminate = somePageSelected && !allPageSelected; }}
                          onChange={e => handleSelectAll(e.target.checked)}
                          className="w-3.5 h-3.5 accent-brand rounded"
                        />
                      </th>

                      {/* Edit icon col */}
                      <th className="w-8 px-1 py-2.5 border-r border-gray-200" />

                      {/* Field headers */}
                      {selectedTable.fields.map(field => (
                        <th
                          key={field.id}
                          className="px-3 py-2.5 text-left font-medium text-gray-600 border-r border-gray-200 min-w-[130px] max-w-[260px] relative group"
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
                                className="flex-1 min-w-0 border border-brand rounded px-1.5 py-0.5 text-xs focus:outline-none"
                              />
                            </div>
                          ) : (
                            <div className="flex items-center gap-1.5">
                              <span className="text-gray-400 flex-shrink-0">{FIELD_TYPE_ICONS[field.type]}</span>
                              <span
                                className={cn(
                                  'truncate text-xs',
                                  field.isSystem ? 'font-semibold text-gray-700' : 'font-medium text-gray-600'
                                )}
                                onDoubleClick={() => {
                                  if (field.isSystem) return;
                                  setEditingFieldId(field.id);
                                  setFieldNameDraft(field.name);
                                }}
                              >
                                {field.name}
                              </span>
                              {field.isSystem && (
                                <Lock size={10} className="text-gray-300 flex-shrink-0" />
                              )}

                              {/* Field menu button */}
                              {!field.isSystem && (
                                <button
                                  onClick={e => {
                                    e.stopPropagation();
                                    setOpenFieldMenu(openFieldMenu === field.id ? null : field.id);
                                  }}
                                  className={cn(
                                    'ml-auto p-0.5 rounded hover:bg-gray-200 flex-shrink-0 transition-all',
                                    openFieldMenu === field.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                                  )}
                                >
                                  <MoreHorizontal size={12} />
                                </button>
                              )}

                              {openFieldMenu === field.id && (
                                <div
                                  className="absolute top-full left-0 mt-1 w-36 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <button
                                    onClick={() => {
                                      setEditingFieldId(field.id);
                                      setFieldNameDraft(field.name);
                                      setOpenFieldMenu(null);
                                    }}
                                    className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-50 flex items-center gap-1.5 transition-colors"
                                  >
                                    <Pencil size={11} />
                                    名前を変更
                                  </button>
                                  <button
                                    onClick={() => handleDeleteField(field.id)}
                                    className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-1.5 transition-colors"
                                  >
                                    <Trash2 size={11} />
                                    削除
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </th>
                      ))}

                      {/* Add field col */}
                      <th className="px-3 py-2.5 text-left w-36">
                        <button
                          onClick={() => setShowAddField(true)}
                          className="flex items-center gap-1 text-gray-400 hover:text-brand transition-colors font-medium text-xs"
                        >
                          <Plus size={13} />
                          項目を追加
                        </button>
                      </th>
                    </tr>
                  </thead>

                  {/* Body */}
                  <tbody>
                    {pageRecords.length === 0 ? (
                      <tr>
                        <td
                          colSpan={selectedTable.fields.length + 3}
                          className="px-4 py-16 text-center"
                        >
                          <div className="flex flex-col items-center gap-2 text-gray-400">
                            <Database size={32} className="opacity-30" />
                            <p className="text-sm font-medium text-gray-500">
                              {searchQuery ? '検索結果がありません' : 'レコードがありません'}
                            </p>
                            {!searchQuery && (
                              <p className="text-xs text-gray-400">
                                「レコード追加」ボタンから追加してください
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ) : (
                      pageRecords.map((record, ri) => (
                        <tr
                          key={record.id}
                          className={cn(
                            'border-b border-gray-100 group transition-colors',
                            selectedRecordIds.has(record.id)
                              ? 'bg-brand/5'
                              : ri % 2 === 1
                              ? 'bg-gray-50/40 hover:bg-blue-50/40'
                              : 'bg-white hover:bg-blue-50/40'
                          )}
                        >
                          {/* Checkbox */}
                          <td className="w-10 px-3 py-2.5 border-r border-gray-100">
                            <input
                              type="checkbox"
                              checked={selectedRecordIds.has(record.id)}
                              onChange={e => handleSelectRecord(record.id, e.target.checked)}
                              className="w-3.5 h-3.5 accent-brand rounded"
                            />
                          </td>

                          {/* Edit button col */}
                          <td className="w-8 px-1 py-2.5 border-r border-gray-100">
                            <button
                              onClick={() => setShowEditRecord(record.id)}
                              className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-all flex items-center justify-center"
                              title="レコードを編集"
                            >
                              <Pencil size={11} />
                            </button>
                          </td>

                          {/* Data cells */}
                          {selectedTable.fields.map(field => (
                            <td
                              key={field.id}
                              className="px-3 py-2.5 border-r border-gray-100 min-w-[130px] max-w-[260px] cursor-default"
                              onDoubleClick={() => {
                                if (field.type === 'password') return;
                                setEditingCell({ recordId: record.id, fieldId: field.id });
                              }}
                              title="ダブルクリックで編集"
                            >
                              {editingCell?.recordId === record.id && editingCell?.fieldId === field.id ? (
                                <InlineCellEditor
                                  field={field}
                                  value={record.values[field.id]}
                                  onSave={v => handleCellSave(record.id, field.id, v)}
                                  onCancel={() => setEditingCell(null)}
                                />
                              ) : (
                                <div className="flex items-center gap-1.5 text-xs overflow-hidden">
                                  {cellDisplay(field, record.values[field.id])}
                                </div>
                              )}
                            </td>
                          ))}

                          {/* Trailing empty cell for add-field column */}
                          <td className="px-3 py-2.5" />
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* ── Pagination ──────────────────────────────────────────── */}
              {filteredRecords.length > PAGE_SIZE && (
                <div className="h-10 border-t border-gray-200 flex items-center justify-between px-6 flex-shrink-0 bg-white">
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
                    <span className="text-xs text-gray-600 px-2">
                      {safePage + 1} / {totalPages}
                    </span>
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

      {/* ── Modals ──────────────────────────────────────────────────────────── */}
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
