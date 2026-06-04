'use client';

import { useState, useRef } from 'react';
import { X, Upload, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DBField } from '@/lib/types';

interface Props {
  fields: DBField[];
  onClose: () => void;
  onImport: (rows: Record<string, any>[]) => void;
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter(l => l.trim() !== '');
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseRow = (line: string): string[] => {
    const cells: string[] = [];
    let current = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        cells.push(current);
        current = '';
      } else {
        current += ch;
      }
    }
    cells.push(current);
    return cells;
  };

  const headers = parseRow(lines[0]);
  const rows = lines.slice(1).map(l => parseRow(l));
  return { headers, rows };
}

export default function ImportCSVModal({ fields, onClose, onImport }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedHeaders, setParsedHeaders] = useState<string[]>([]);
  const [parsedRows, setParsedRows] = useState<string[][]>([]);
  const [fileName, setFileName] = useState('');
  const [error, setError] = useState('');
  const [isDragging, setIsDragging] = useState(false);

  const editableFields = fields.filter(f => !f.isSystem || f.name !== 'id');

  const handleFile = (file: File) => {
    if (!file.name.endsWith('.csv')) {
      setError('CSVファイルを選択してください');
      return;
    }
    setError('');
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = e => {
      const text = e.target?.result as string;
      const { headers, rows } = parseCSV(text);
      if (headers.length === 0) {
        setError('ファイルが空です');
        return;
      }
      setParsedHeaders(headers);
      setParsedRows(rows);
    };
    reader.onerror = () => setError('ファイルの読み込みに失敗しました');
    reader.readAsText(file, 'UTF-8');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  // Map CSV headers to field IDs
  const buildFieldMapping = (): Record<string, string> => {
    // Try exact name match (case-insensitive)
    const mapping: Record<string, string> = {};
    parsedHeaders.forEach(header => {
      const match = editableFields.find(
        f => f.name.toLowerCase() === header.toLowerCase()
      );
      if (match) mapping[header] = match.id;
    });
    return mapping;
  };

  const handleImport = () => {
    if (parsedRows.length === 0) {
      setError('インポートするデータがありません');
      return;
    }
    const mapping = buildFieldMapping();
    const records = parsedRows.map(row => {
      const values: Record<string, any> = {};
      parsedHeaders.forEach((header, i) => {
        const fieldId = mapping[header];
        if (fieldId) {
          const field = editableFields.find(f => f.id === fieldId);
          let val: any = row[i] ?? '';
          if (field?.type === 'number') val = val === '' ? '' : Number(val);
          else if (field?.type === 'boolean') val = val === 'true' || val === '1' || val === 'TRUE';
          values[fieldId] = val;
        }
      });
      return values;
    });
    onImport(records);
    onClose();
  };

  const matchedCount = Object.keys(buildFieldMapping()).length;
  const previewRows = parsedRows.slice(0, 5);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <h2 className="text-base font-semibold text-gray-900">CSVをインポート</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-4">
          {/* Instructions */}
          <div className="text-sm text-gray-500 bg-blue-50 text-blue-700 rounded-lg px-4 py-3 flex gap-2">
            <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
            <p>1行目をカラムヘッダーとして使用します。ヘッダー名がテーブルの項目名と一致する列がインポートされます。</p>
          </div>

          {/* Drop zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            className={cn(
              'border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors',
              isDragging
                ? 'border-brand bg-brand-50'
                : 'border-gray-300 hover:border-brand hover:bg-gray-50'
            )}
          >
            <Upload size={24} className="mx-auto mb-2 text-gray-400" />
            {fileName ? (
              <p className="text-sm font-medium text-gray-700">{fileName}</p>
            ) : (
              <>
                <p className="text-sm font-medium text-gray-600">CSVファイルをドロップ</p>
                <p className="text-xs text-gray-400 mt-1">またはクリックして選択</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleInputChange}
              className="hidden"
            />
          </div>

          {error && (
            <p className="text-sm text-red-500 flex items-center gap-1.5">
              <AlertCircle size={14} />
              {error}
            </p>
          )}

          {/* Preview */}
          {parsedHeaders.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-gray-700">プレビュー（最初の5行）</p>
                <p className="text-xs text-gray-400">
                  {parsedRows.length}行 / {matchedCount}/{parsedHeaders.length}列がマッチ
                </p>
              </div>

              {/* Field mapping status */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                {parsedHeaders.map(h => {
                  const mapping = buildFieldMapping();
                  const matched = !!mapping[h];
                  return (
                    <span
                      key={h}
                      className={cn(
                        'text-xs px-2 py-0.5 rounded-full border font-medium',
                        matched
                          ? 'bg-brand-50 border-brand-200 text-brand-700'
                          : 'bg-gray-100 border-gray-200 text-gray-400'
                      )}
                    >
                      {h} {matched ? '✓' : '—'}
                    </span>
                  );
                })}
              </div>

              {/* Preview table */}
              <div className="overflow-x-auto rounded-lg border border-gray-200">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-100">
                      {parsedHeaders.map(h => (
                        <th key={h} className="px-3 py-2 text-left font-medium text-gray-600 whitespace-nowrap">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, ri) => (
                      <tr key={ri} className={ri % 2 === 1 ? 'bg-gray-50' : 'bg-white'}>
                        {parsedHeaders.map((_, ci) => (
                          <td key={ci} className="px-3 py-2 text-gray-700 whitespace-nowrap max-w-[160px] truncate">
                            {row[ci] ?? ''}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {parsedRows.length > 5 && (
                <p className="text-xs text-gray-400 mt-1.5 text-center">
                  他 {parsedRows.length - 5} 行...
                </p>
              )}
            </div>
          )}
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
            onClick={handleImport}
            disabled={parsedRows.length === 0}
            className={cn(
              'flex-1 rounded-lg py-2 text-sm font-medium transition-colors',
              parsedRows.length > 0
                ? 'bg-brand hover:bg-brand-600 text-white'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            )}
          >
            {parsedRows.length > 0 ? `${parsedRows.length}件をインポート` : 'インポート'}
          </button>
        </div>
      </div>
    </div>
  );
}
