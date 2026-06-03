'use client';

import { useState } from 'react';
import { useBuilderStore } from '@/lib/store';
import { DbColumn, DbColumnType, DbTable } from '@/lib/types';
import { cn } from '@/lib/utils';

const COLUMN_TYPES: { label: string; value: DbColumnType }[] = [
  { label: 'テキスト', value: 'text' },
  { label: '数値', value: 'number' },
  { label: '真偽値', value: 'boolean' },
  { label: '日付', value: 'date' },
  { label: 'メール', value: 'email' },
  { label: 'URL', value: 'url' },
];

const TYPE_ICON: Record<DbColumnType, string> = {
  text: 'T',
  number: '#',
  boolean: '✓',
  date: '📅',
  email: '@',
  url: '🔗',
};

function ColumnRow({ tableId, column }: { tableId: string; column: DbColumn }) {
  const { deleteDbColumn } = useBuilderStore();

  return (
    <div className="flex items-center gap-2 py-1.5 px-3 hover:bg-gray-50 group rounded">
      <span className="w-6 h-6 rounded bg-gray-100 flex items-center justify-center text-xs font-mono text-gray-500 flex-shrink-0">
        {TYPE_ICON[column.type]}
      </span>
      <span className="flex-1 text-sm text-gray-800 truncate">{column.name}</span>
      <span className="text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
        {COLUMN_TYPES.find(t => t.value === column.type)?.label}
      </span>
      {column.name !== 'ID' && (
        <button
          onClick={() => deleteDbColumn(tableId, column.id)}
          className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  );
}

function AddColumnForm({ tableId, onDone }: { tableId: string; onDone: () => void }) {
  const { addDbColumn } = useBuilderStore();
  const [name, setName] = useState('');
  const [type, setType] = useState<DbColumnType>('text');

  const handleAdd = () => {
    if (!name.trim()) return;
    addDbColumn(tableId, { name: name.trim(), type });
    setName('');
    setType('text');
    onDone();
  };

  return (
    <div className="flex items-center gap-2 p-3 bg-gray-50 border border-gray-200 rounded-lg mx-3 mb-3">
      <input
        autoFocus
        value={name}
        onChange={e => setName(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') handleAdd(); if (e.key === 'Escape') onDone(); }}
        placeholder="列名"
        maxLength={50}
        className="flex-1 text-sm px-2 py-1 border border-gray-200 rounded outline-none focus:border-blue-400"
      />
      <select
        value={type}
        onChange={e => setType(e.target.value as DbColumnType)}
        className="text-xs px-2 py-1 border border-gray-200 rounded outline-none bg-white"
      >
        {COLUMN_TYPES.map(t => (
          <option key={t.value} value={t.value}>{t.label}</option>
        ))}
      </select>
      <button onClick={handleAdd} className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 font-medium">
        追加
      </button>
      <button onClick={onDone} className="text-gray-400 hover:text-gray-600 text-xs">✕</button>
    </div>
  );
}

function TableEditor({ table }: { table: DbTable }) {
  const { addDbRow, updateDbRow, deleteDbRow, deleteDbTable, renameDbTable } = useBuilderStore();
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState(table.name);

  const dataCols = table.columns.filter(c => c.name !== 'ID');
  const allCols = table.columns;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Table name + delete */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
        {editingName ? (
          <input
            autoFocus
            value={nameInput}
            onChange={e => setNameInput(e.target.value)}
            onBlur={() => { renameDbTable(table.id, nameInput.trim() || table.name); setEditingName(false); }}
            onKeyDown={e => { if (e.key === 'Enter') { renameDbTable(table.id, nameInput.trim() || table.name); setEditingName(false); } }}
            className="flex-1 text-sm font-semibold px-2 py-1 border border-blue-400 rounded outline-none"
          />
        ) : (
          <button onClick={() => { setEditingName(true); setNameInput(table.name); }}
            className="flex-1 text-sm font-semibold text-gray-800 text-left hover:text-blue-600 transition-colors">
            {table.name}
          </button>
        )}
        <button
          onClick={() => { if (confirm(`「${table.name}」を削除しますか？`)) deleteDbTable(table.id); }}
          className="text-gray-400 hover:text-red-500 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Columns section */}
        <div className="pt-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-3 mb-1">フィールド</p>
          {table.columns.map(col => (
            <ColumnRow key={col.id} tableId={table.id} column={col} />
          ))}
          {showAddColumn ? (
            <AddColumnForm tableId={table.id} onDone={() => setShowAddColumn(false)} />
          ) : (
            <button
              onClick={() => setShowAddColumn(true)}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 px-3 py-2 w-full text-left"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              フィールドを追加
            </button>
          )}
        </div>

        {/* Data section */}
        <div className="mt-4 pb-4">
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">データ ({table.rows.length}件)</p>
            <button
              onClick={() => addDbRow(table.id)}
              className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              行を追加
            </button>
          </div>

          {table.columns.length <= 1 && dataCols.length === 0 ? (
            <p className="text-xs text-gray-400 px-3">フィールドを追加してデータを入力してください</p>
          ) : (
            <div className="overflow-x-auto px-3">
              <table className="w-full text-xs border border-gray-200 rounded-lg overflow-hidden">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    {allCols.map(col => (
                      <th key={col.id} className="px-2 py-1.5 text-left text-gray-600 font-medium whitespace-nowrap">
                        <span className="flex items-center gap-1">
                          <span className="text-gray-400">{TYPE_ICON[col.type]}</span>
                          {col.name}
                        </span>
                      </th>
                    ))}
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {table.rows.length === 0 ? (
                    <tr>
                      <td colSpan={allCols.length + 1} className="px-3 py-4 text-center text-gray-400">
                        まだデータがありません
                      </td>
                    </tr>
                  ) : (
                    table.rows.map(row => (
                      <tr key={row.id} className="hover:bg-gray-50 group">
                        {allCols.map(col => (
                          <td key={col.id} className="px-1 py-1">
                            {col.name === 'ID' ? (
                              <span className="text-gray-400 font-mono text-[10px] px-1">{row.id.slice(0, 8)}</span>
                            ) : (
                              <input
                                type={col.type === 'number' ? 'number' : col.type === 'date' ? 'date' : col.type === 'boolean' ? 'checkbox' : 'text'}
                                value={row.cells[col.id] ?? ''}
                                onChange={e => updateDbRow(table.id, row.id, col.id, e.target.value)}
                                className="w-full px-1.5 py-0.5 border-0 bg-transparent hover:bg-white hover:border hover:border-gray-200 rounded outline-none focus:bg-white focus:border-blue-400 focus:border text-gray-800 min-w-0"
                                style={{ minWidth: '60px' }}
                              />
                            )}
                          </td>
                        ))}
                        <td className="px-1 py-1">
                          <button
                            onClick={() => deleteDbRow(table.id, row.id)}
                            className="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-all"
                          >
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DatabasePanel() {
  const { project, addDbTable } = useBuilderStore();
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
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="h-12 flex items-center justify-between px-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center gap-2">
          <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582 4 8 4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
          </svg>
          <h2 className="text-sm font-semibold text-gray-800">データベース</h2>
        </div>
        <button
          onClick={() => setShowAddTable(true)}
          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium bg-blue-50 hover:bg-blue-100 px-2.5 py-1.5 rounded-lg transition-colors"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          テーブル作成
        </button>
      </div>

      {/* Table tabs */}
      {tables.length > 0 && (
        <div className="flex items-center border-b border-gray-100 overflow-x-auto flex-shrink-0 px-2 pt-1">
          {tables.map(table => (
            <button
              key={table.id}
              onClick={() => setSelectedTableId(table.id)}
              className={cn(
                'py-1.5 px-3 text-xs font-medium rounded-t-lg mr-1 whitespace-nowrap transition-colors border-b-2',
                (selectedTable?.id === table.id)
                  ? 'border-blue-600 text-blue-600 bg-blue-50'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              )}
            >
              {table.name}
            </button>
          ))}
        </div>
      )}

      {/* Add table form */}
      {showAddTable && (
        <div className="flex items-center gap-2 p-3 border-b border-gray-100 bg-gray-50 flex-shrink-0">
          <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4" />
          </svg>
          <input
            autoFocus
            value={newTableName}
            onChange={e => setNewTableName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleAddTable(); if (e.key === 'Escape') setShowAddTable(false); }}
            placeholder="テーブル名を入力..."
            maxLength={50}
            className="flex-1 text-sm px-2 py-1 border border-gray-200 rounded outline-none focus:border-blue-400"
          />
          <button onClick={handleAddTable} className="px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 font-medium">作成</button>
          <button onClick={() => setShowAddTable(false)} className="text-gray-400 hover:text-gray-600 text-sm">✕</button>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-h-0 flex flex-col">
        {tables.length === 0 ? (
          <div className="flex flex-col items-center justify-center flex-1 text-center px-6">
            <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582 4 8 4s8 1.79 8 4" />
              </svg>
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">データベースが空です</p>
            <p className="text-xs text-gray-400 mb-4">テーブルを作成してデータを管理しましょう</p>
            <button
              onClick={() => setShowAddTable(true)}
              className="flex items-center gap-2 text-sm font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 px-4 py-2 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              テーブルを作成する
            </button>
          </div>
        ) : selectedTable ? (
          <TableEditor key={selectedTable.id} table={selectedTable} />
        ) : null}
      </div>
    </div>
  );
}
