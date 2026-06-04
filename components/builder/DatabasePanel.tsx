'use client';

import { useState, useMemo } from 'react';
import { useBuilderStore } from '@/lib/store';
import { DbColumn, DbColumnType, DbTable } from '@/lib/types';
import { cn } from '@/lib/utils';

// ─── Column type definitions (spec §3.2 — 9 types) ──────────────────────────

const COLUMN_TYPES: { label: string; value: DbColumnType }[] = [
  { label: 'テキスト', value: 'text' },
  { label: 'パスワード', value: 'password' },
  { label: '数値', value: 'number' },
  { label: 'True/False', value: 'boolean' },
  { label: '日時', value: 'datetime' },
  { label: '日付', value: 'date' },
  { label: '画像', value: 'image' },
  { label: 'ファイル', value: 'file' },
  { label: 'データの紐付け', value: 'relational' },
];

const TYPE_ICON: Record<DbColumnType, string> = {
  text: 'T',
  password: '🔒',
  number: '#',
  boolean: '✓',
  datetime: '🕐',
  date: '📅',
  image: '📷',
  file: '📎',
  relational: '🔗',
  // legacy (kept for backward compat with stored data)
  email: '@',
  url: '🔗',
};

function typeLabel(type: DbColumnType): string {
  return COLUMN_TYPES.find(t => t.value === type)?.label ?? type;
}

function cellInputType(type: DbColumnType): string {
  if (type === 'number') return 'number';
  if (type === 'date') return 'date';
  if (type === 'datetime') return 'datetime-local';
  if (type === 'password') return 'password';
  return 'text';
}

// ─── Add column modal ────────────────────────────────────────────────────────

function AddColumnModal({
  tableId,
  tables,
  onDone,
}: {
  tableId: string;
  tables: DbTable[];
  onDone: () => void;
}) {
  const { addDbColumn } = useBuilderStore();
  const [name, setName] = useState('');
  const [type, setType] = useState<DbColumnType>('text');
  const [relTableId, setRelTableId] = useState('');

  const handleAdd = () => {
    if (!name.trim()) return;
    const col: Omit<DbColumn, 'id'> = { name: name.trim(), type };
    if (type === 'relational' && relTableId) col.relationalTableId = relTableId;
    addDbColumn(tableId, col);
    onDone();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
      <div className="bg-white rounded-xl shadow-xl w-80 p-5">
        <h3 className="text-sm font-semibold text-gray-800 mb-4">項目を追加</h3>
        <div className="flex flex-col gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">項目名</label>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter') handleAdd();
                if (e.key === 'Escape') onDone();
              }}
              placeholder="項目名を入力"
              maxLength={50}
              className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg outline-none focus:border-[#1ec8a5]"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">データ型</label>
            <select
              value={type}
              onChange={e => setType(e.target.value as DbColumnType)}
              className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg outline-none bg-white focus:border-[#1ec8a5]"
            >
              {COLUMN_TYPES.map(t => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </select>
          </div>
          {type === 'relational' && (
            <div>
              <label className="text-xs text-gray-500 mb-1 block">紐付けるテーブル</label>
              <select
                value={relTableId}
                onChange={e => setRelTableId(e.target.value)}
                className="w-full text-sm px-3 py-1.5 border border-gray-200 rounded-lg outline-none bg-white focus:border-[#1ec8a5]"
              >
                <option value="">テーブルを選択...</option>
                {tables.filter(t => t.id !== tableId).map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={onDone}
            className="px-3 py-1.5 text-xs text-gray-500 hover:text-gray-700 border border-gray-200 rounded-lg"
          >
            キャンセル
          </button>
          <button
            onClick={handleAdd}
            disabled={!name.trim()}
            className="px-4 py-1.5 text-xs font-medium text-white rounded-lg disabled:opacity-40"
            style={{ backgroundColor: '#1ec8a5' }}
          >
            追加
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Table grid (main content area) ─────────────────────────────────────────

function TableGrid({ table, allTables }: { table: DbTable; allTables: DbTable[] }) {
  const {
    addDbRow, updateDbRow, deleteDbRow,
    deleteDbColumn, renameDbTable, setProject,
  } = useBuilderStore();

  // toolbar state
  const [searchQuery, setSearchQuery] = useState('');
  const [locked, setLocked] = useState(false);
  const [pageSize, setPageSize] = useState(100);
  const [currentPage, setCurrentPage] = useState(1);

  // row selection
  const [selectedRows, setSelectedRows] = useState<Set<string>>(new Set());

  // column rename
  const [renamingColId, setRenamingColId] = useState<string | null>(null);
  const [renameColValue, setRenameColValue] = useState('');

  // add column modal
  const [showAddCol, setShowAddCol] = useState(false);

  // table name editing
  const isUsers = table.name === 'Users';
  const [editingTableName, setEditingTableName] = useState(false);
  const [tableNameInput, setTableNameInput] = useState(table.name);

  // filtered rows (search by first column)
  const firstCol = table.columns[0];
  const filteredRows = useMemo(() => {
    if (!searchQuery.trim() || !firstCol) return table.rows;
    const q = searchQuery.toLowerCase();
    return table.rows.filter(r =>
      String(r.cells[firstCol.id] ?? '').toLowerCase().includes(q)
    );
  }, [table.rows, searchQuery, firstCol]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const pagedRows = filteredRows.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const allSelected = pagedRows.length > 0 && pagedRows.every(r => selectedRows.has(r.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedRows(prev => {
        const next = new Set(prev);
        pagedRows.forEach(r => next.delete(r.id));
        return next;
      });
    } else {
      setSelectedRows(prev => {
        const next = new Set(prev);
        pagedRows.forEach(r => next.add(r.id));
        return next;
      });
    }
  };

  const toggleRow = (rowId: string) => {
    setSelectedRows(prev => {
      const next = new Set(prev);
      if (next.has(rowId)) next.delete(rowId);
      else next.add(rowId);
      return next;
    });
  };

  const deleteSelected = () => {
    selectedRows.forEach(rowId => deleteDbRow(table.id, rowId));
    setSelectedRows(new Set());
  };

  const handleExportCSV = () => {
    const header = table.columns.map(c => `"${c.name}"`).join(',');
    const body = table.rows.map(r =>
      table.columns.map(c => {
        const val = r.cells[c.id] ?? '';
        return `"${String(val).replace(/"/g, '""')}"`;
      }).join(',')
    ).join('\n');
    const csv = [header, body].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${table.name}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const commitColRename = () => {
    if (!renamingColId) return;
    const col = table.columns.find(c => c.id === renamingColId);
    if (!col) { setRenamingColId(null); return; }
    const newName = renameColValue.trim() || col.name;
    // store has no renameDbColumn action, so patch via setProject
    const project = useBuilderStore.getState().project;
    if (!project) { setRenamingColId(null); return; }
    const updated = {
      ...project,
      database: {
        tables: (project.database?.tables ?? []).map((t: DbTable) => {
          if (t.id !== table.id) return t;
          return {
            ...t,
            columns: t.columns.map((c: DbColumn) =>
              c.id === renamingColId ? { ...c, name: newName } : c
            ),
          };
        }),
      },
      updatedAt: new Date().toISOString(),
    };
    setProject(updated);
    setRenamingColId(null);
  };

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Top toolbar */}
      <div className="flex items-center gap-2 px-4 py-2 border-b border-gray-200 bg-white flex-shrink-0 flex-wrap">
        {/* Table name */}
        <div className="flex items-center gap-1 mr-2 flex-shrink-0">
          {editingTableName && !isUsers ? (
            <input
              autoFocus
              value={tableNameInput}
              onChange={e => setTableNameInput(e.target.value)}
              onBlur={() => {
                renameDbTable(table.id, tableNameInput.trim() || table.name);
                setEditingTableName(false);
              }}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  renameDbTable(table.id, tableNameInput.trim() || table.name);
                  setEditingTableName(false);
                }
                if (e.key === 'Escape') setEditingTableName(false);
              }}
              className="text-sm font-semibold px-2 py-0.5 border border-[#1ec8a5] rounded outline-none w-32"
            />
          ) : (
            <button
              className={cn(
                'text-sm font-semibold text-gray-800',
                !isUsers && 'hover:text-[#1ec8a5] cursor-pointer'
              )}
              onClick={() => {
                if (!isUsers) {
                  setEditingTableName(true);
                  setTableNameInput(table.name);
                }
              }}
            >
              {table.name}
            </button>
          )}
          {isUsers && (
            <span className="text-[10px] text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded ml-1">固定</span>
          )}
        </div>

        <div className="flex items-center gap-1.5 flex-1 flex-wrap">
          {/* レコードを追加 / レコードを削除 */}
          {selectedRows.size > 0 ? (
            <button
              onClick={deleteSelected}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
              レコードを削除 ({selectedRows.size})
            </button>
          ) : (
            <button
              onClick={() => { if (!locked) addDbRow(table.id); }}
              disabled={locked}
              className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-white rounded-lg transition-colors disabled:opacity-40"
              style={{ backgroundColor: '#1ec8a5' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              レコードを追加
            </button>
          )}

          {/* アップロード */}
          <button
            onClick={() => alert('CSV取り込み（近日対応）')}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            アップロード
          </button>

          {/* ダウンロード */}
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-600 hover:text-gray-800 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            ダウンロード
          </button>

          {/* 検索 */}
          <div className="flex items-center gap-1.5 border border-gray-200 rounded-lg px-2 py-1 bg-white ml-auto">
            <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setCurrentPage(1); }}
              placeholder="検索"
              className="text-xs outline-none w-28 text-gray-700 placeholder-gray-400"
            />
          </div>

          {/* ロック toggle */}
          <button
            onClick={() => setLocked(l => !l)}
            className={cn(
              'flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-lg border transition-colors',
              locked
                ? 'bg-amber-50 border-amber-300 text-amber-700'
                : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            )}
            title={locked ? 'ロック中（クリックで解除）' : 'ロック'}
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {locked ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              )}
            </svg>
            ロック
          </button>
        </div>
      </div>

      {/* Spreadsheet grid */}
      <div className="flex-1 overflow-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-100 border-b border-gray-200 sticky top-0 z-10">
              {/* Checkbox header */}
              <th className="w-8 px-2 py-2 border-r border-gray-200">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </th>

              {table.columns.map(col => (
                <th
                  key={col.id}
                  className="px-2 py-2 text-left text-gray-600 font-medium whitespace-nowrap border-r border-gray-200 min-w-[120px]"
                >
                  <div className="flex items-center gap-1 group/col">
                    <span className="text-gray-400 text-[10px]">{TYPE_ICON[col.type]}</span>
                    {renamingColId === col.id ? (
                      <input
                        autoFocus
                        value={renameColValue}
                        onChange={e => setRenameColValue(e.target.value)}
                        onBlur={commitColRename}
                        onKeyDown={e => {
                          if (e.key === 'Enter') commitColRename();
                          if (e.key === 'Escape') setRenamingColId(null);
                        }}
                        className="text-xs px-1 py-0.5 border border-[#1ec8a5] rounded outline-none w-24"
                      />
                    ) : (
                      <button
                        className={cn(
                          'text-left flex-1 truncate',
                          col.name !== 'Name' && !locked && 'hover:text-[#1ec8a5] cursor-pointer'
                        )}
                        onClick={() => {
                          if (col.name === 'Name' || locked) return;
                          setRenamingColId(col.id);
                          setRenameColValue(col.name);
                        }}
                        title={col.name !== 'Name' && !locked ? 'クリックして列名を変更' : col.name}
                      >
                        {col.name}
                      </button>
                    )}
                    {/* ⋮ delete column — not shown for Name col */}
                    {col.name !== 'Name' && !locked && (
                      <button
                        onClick={() => {
                          if (confirm(`「${col.name}」列を削除しますか？`)) {
                            deleteDbColumn(table.id, col.id);
                          }
                        }}
                        className="opacity-0 group-hover/col:opacity-100 text-gray-400 hover:text-red-500 transition-all ml-auto flex-shrink-0 px-0.5"
                        title="列を削除"
                      >
                        ⋮
                      </button>
                    )}
                  </div>
                  <div className="text-[9px] text-gray-400 font-normal mt-0.5">{typeLabel(col.type)}</div>
                </th>
              ))}

              {/* + 項目を追加 */}
              <th className="px-3 py-2 whitespace-nowrap">
                <button
                  onClick={() => { if (!locked) setShowAddCol(true); }}
                  disabled={locked}
                  className="flex items-center gap-1 text-xs text-gray-400 hover:text-[#1ec8a5] disabled:opacity-40 transition-colors"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  項目を追加
                </button>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {pagedRows.length === 0 ? (
              <tr>
                <td colSpan={table.columns.length + 2} className="px-4 py-8 text-center text-gray-400">
                  {searchQuery ? '検索結果がありません' : 'まだレコードがありません'}
                </td>
              </tr>
            ) : (
              pagedRows.map(row => (
                <tr
                  key={row.id}
                  className={cn(
                    'hover:bg-gray-50 group',
                    selectedRows.has(row.id) && 'bg-green-50 hover:bg-green-50'
                  )}
                >
                  <td className="w-8 px-2 py-1.5 border-r border-gray-100">
                    <input
                      type="checkbox"
                      checked={selectedRows.has(row.id)}
                      onChange={() => toggleRow(row.id)}
                      className="rounded"
                    />
                  </td>
                  {table.columns.map(col => (
                    <td key={col.id} className="px-1 py-1 border-r border-gray-100 min-w-[120px]">
                      {col.type === 'boolean' ? (
                        <div className="flex items-center px-1">
                          <input
                            type="checkbox"
                            checked={row.cells[col.id] === 'true'}
                            onChange={e => {
                              if (!locked) updateDbRow(table.id, row.id, col.id, String(e.target.checked));
                            }}
                            disabled={locked}
                            className="rounded"
                          />
                        </div>
                      ) : col.type === 'image' ? (
                        <div className="flex items-center gap-1">
                          {row.cells[col.id] && (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={row.cells[col.id]}
                              alt=""
                              className="w-6 h-6 object-cover rounded flex-shrink-0"
                            />
                          )}
                          <input
                            type="text"
                            value={row.cells[col.id] ?? ''}
                            onChange={e => { if (!locked) updateDbRow(table.id, row.id, col.id, e.target.value); }}
                            readOnly={locked}
                            placeholder="画像URL"
                            className="flex-1 px-1.5 py-0.5 border-0 bg-transparent hover:bg-white hover:border hover:border-gray-200 rounded outline-none focus:bg-white focus:border-[#1ec8a5] focus:border text-gray-800 min-w-0"
                          />
                        </div>
                      ) : (
                        <input
                          type={cellInputType(col.type)}
                          value={row.cells[col.id] ?? ''}
                          onChange={e => { if (!locked) updateDbRow(table.id, row.id, col.id, e.target.value); }}
                          readOnly={locked}
                          className="w-full px-1.5 py-0.5 border-0 bg-transparent hover:bg-white hover:border hover:border-gray-200 rounded outline-none focus:bg-white focus:border-[#1ec8a5] focus:border text-gray-800 min-w-0"
                          style={{ minWidth: '80px' }}
                        />
                      )}
                    </td>
                  ))}
                  <td className="px-1 py-1" />
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination footer */}
      <div className="flex items-center justify-between px-4 py-2 border-t border-gray-200 bg-white flex-shrink-0">
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <span>{filteredRows.length}件</span>
          <select
            value={pageSize}
            onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
            className="border border-gray-200 rounded px-1 py-0.5 text-xs bg-white outline-none focus:border-[#1ec8a5]"
          >
            {[10, 50, 100, 500, 1000].map(n => (
              <option key={n} value={n}>{n}件/ページ</option>
            ))}
          </select>
        </div>
        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-2 py-0.5 text-xs border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50"
            >
              ‹
            </button>
            <span className="text-xs text-gray-500">{currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-2 py-0.5 text-xs border border-gray-200 rounded disabled:opacity-40 hover:bg-gray-50"
            >
              ›
            </button>
          </div>
        )}
      </div>

      {/* Add column modal */}
      {showAddCol && (
        <AddColumnModal
          tableId={table.id}
          tables={allTables}
          onDone={() => setShowAddCol(false)}
        />
      )}
    </div>
  );
}

// ─── Main DatabasePanel ──────────────────────────────────────────────────────

export default function DatabasePanel() {
  const { project, addDbTable, deleteDbTable } = useBuilderStore();
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [showAddTable, setShowAddTable] = useState(false);
  const [newTableName, setNewTableName] = useState('');

  const tables = project?.database?.tables ?? [];
  const selectedTable = tables.find(t => t.id === selectedTableId) ?? tables[0] ?? null;

  const handleAddTable = () => {
    if (!newTableName.trim()) return;
    addDbTable(newTableName.trim());
    setNewTableName('');
    setShowAddTable(false);
    // select the newly added table
    setTimeout(() => {
      const updated = useBuilderStore.getState().project?.database?.tables ?? [];
      const last = updated[updated.length - 1];
      if (last) setSelectedTableId(last.id);
    }, 50);
  };

  return (
    <div className="flex h-full bg-white overflow-hidden">
      {/* Left sidebar — table list */}
      <div className="w-48 flex-shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col">
        <div className="px-3 py-2.5 border-b border-gray-200">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">テーブル</p>
        </div>

        <div className="flex-1 overflow-y-auto py-1">
          {tables.map(table => (
            <div
              key={table.id}
              className={cn(
                'group flex items-center gap-1.5 px-3 py-2 cursor-pointer transition-colors',
                selectedTable?.id === table.id
                  ? 'bg-white text-gray-900 font-medium border-r-2 shadow-sm'
                  : 'text-gray-600 hover:bg-white hover:text-gray-900'
              )}
              style={selectedTable?.id === table.id ? { borderRightColor: '#1ec8a5' } : {}}
              onClick={() => setSelectedTableId(table.id)}
            >
              <svg className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 6h18M3 14h18M3 18h18" />
              </svg>
              <span className="flex-1 truncate text-xs">{table.name}</span>
              {/* ⋮ delete — not shown for Users */}
              {table.name !== 'Users' && (
                <button
                  onClick={e => {
                    e.stopPropagation();
                    if (confirm(`「${table.name}」を削除しますか？`)) {
                      deleteDbTable(table.id);
                      if (selectedTable?.id === table.id) setSelectedTableId(null);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all flex-shrink-0 text-base leading-none"
                  title="テーブルを削除"
                >
                  ⋮
                </button>
              )}
            </div>
          ))}
        </div>

        {/* + テーブルを追加 */}
        <div className="border-t border-gray-200 p-2">
          {showAddTable ? (
            <div className="flex flex-col gap-1.5">
              <input
                autoFocus
                value={newTableName}
                onChange={e => setNewTableName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleAddTable();
                  if (e.key === 'Escape') setShowAddTable(false);
                }}
                placeholder="テーブル名"
                maxLength={50}
                className="w-full text-xs px-2 py-1 border border-gray-200 rounded outline-none focus:border-[#1ec8a5]"
              />
              <div className="flex gap-1">
                <button
                  onClick={handleAddTable}
                  className="flex-1 text-xs py-1 text-white rounded font-medium"
                  style={{ backgroundColor: '#1ec8a5' }}
                >
                  作成
                </button>
                <button
                  onClick={() => { setShowAddTable(false); setNewTableName(''); }}
                  className="px-2 text-xs text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddTable(true)}
              className="w-full flex items-center gap-1.5 text-xs text-gray-500 hover:text-[#1ec8a5] py-1 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              テーブルを追加
            </button>
          )}
        </div>
      </div>

      {/* Main content area */}
      <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
        {tables.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center px-6">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">データベースが空です</p>
            <p className="text-xs text-gray-400 mb-4">テーブルを作成してデータを管理しましょう</p>
          </div>
        ) : selectedTable ? (
          <TableGrid key={selectedTable.id} table={selectedTable} allTables={tables} />
        ) : (
          <div className="flex items-center justify-center flex-1 text-xs text-gray-400">
            テーブルを選択してください
          </div>
        )}
      </div>
    </div>
  );
}
