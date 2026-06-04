'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useStore } from '@/lib/store';
import type { Action, Element, Page } from '@/lib/types';

// ─── Inline element renderer (no builder chrome) ───────────────────────────

function ElementContent({ element, onAction }: { element: Element; onAction: (action: Action) => void }) {
  const s = element.style;

  const handleClick = () => {
    if (element.actions && element.actions.length > 0) {
      element.actions.forEach(action => onAction(action));
    }
  };

  const clickProps = (element.actions && element.actions.length > 0)
    ? { onClick: handleClick, style: { cursor: 'pointer' } }
    : {};

  switch (element.type) {
    case 'text':
      return (
        <div
          {...clickProps}
          className="w-full h-full flex items-center overflow-hidden"
          style={{
            color: s.color ?? '#1f2937',
            fontSize: s.fontSize ?? 16,
            fontWeight: s.fontWeight ?? 'normal',
            textAlign: s.textAlign ?? 'left',
            padding: s.padding ?? '0 4px',
            cursor: element.actions?.length ? 'pointer' : 'default',
          }}
        >
          {element.content ?? ''}
        </div>
      );

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

    case 'file-input':
      return (
        <label
          className="w-full h-full flex flex-col items-center justify-center gap-1 border-2 border-dashed cursor-pointer"
          style={{
            backgroundColor: s.backgroundColor ?? '#f9fafb',
            borderColor: '#d1d5db',
            borderRadius: s.borderRadius ?? 8,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span className="text-xs text-gray-400">ファイルを選択</span>
          <input type="file" className="hidden" />
        </label>
      );

    case 'image-input':
      return (
        <label
          className="w-full h-full flex flex-col items-center justify-center gap-1 border-2 border-dashed cursor-pointer"
          style={{
            backgroundColor: s.backgroundColor ?? '#f9fafb',
            borderColor: '#d1d5db',
            borderRadius: s.borderRadius ?? 8,
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span className="text-xs text-gray-400">画像を選択</span>
          <input type="file" accept="image/*" className="hidden" />
        </label>
      );

    case 'shape':
      return (
        <div
          {...clickProps}
          className="w-full h-full"
          style={{
            backgroundColor: s.backgroundColor ?? '#e5e7eb',
            borderRadius: s.borderRadius ?? 8,
            opacity: s.opacity ?? 1,
          }}
        />
      );

    case 'image':
      return element.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          {...clickProps}
          src={element.src}
          alt={element.label ?? ''}
          className="w-full h-full object-cover"
          style={{ borderRadius: s.borderRadius ?? 0 }}
        />
      ) : (
        <div
          {...clickProps}
          className="w-full h-full flex flex-col items-center justify-center gap-1"
          style={{ backgroundColor: s.backgroundColor ?? '#f3f4f6', borderRadius: s.borderRadius ?? 0 }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
        </div>
      );

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
            {element.content ?? 'ヘッダー'}
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

    case 'list':
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

    case 'horizontal-list':
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

    case 'carousel':
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
            element.actions?.forEach(action => {
              if (action.type === 'create-record' || action.type === 'navigate') {
                onAction(action);
              }
            });
          }}
          className="w-full h-full overflow-hidden p-3 space-y-2"
          style={{ backgroundColor: s.backgroundColor ?? '#ffffff', borderRadius: s.borderRadius ?? 8 }}
        >
          {['名前', 'メール'].map(label => (
            <div key={label}>
              <div className="text-[10px] text-gray-500 mb-0.5">{label}</div>
              <input
                type={label === 'メール' ? 'email' : 'text'}
                placeholder="入力してください"
                className="w-full h-8 border border-gray-200 rounded px-2 text-xs text-gray-700 outline-none focus:border-brand"
              />
            </div>
          ))}
          <button
            type="submit"
            className="w-full h-8 rounded flex items-center justify-center text-xs text-white font-medium"
            style={{ backgroundColor: '#1ec8a5' }}
          >
            送信
          </button>
        </form>
      );

    case 'dropdown':
      return (
        <select
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
        </select>
      );

    case 'switch-element':
    case 'toggle-element':
      return (
        <div
          {...clickProps}
          className="w-full h-full flex items-center gap-3"
          style={{ padding: s.padding ?? '0 4px' }}
        >
          <span className="text-sm text-gray-700">{element.content ?? 'トグル'}</span>
          <div className="relative w-10 h-5 bg-gray-200 rounded-full transition-colors">
            <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform" />
          </div>
        </div>
      );

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
            placeholder={element.placeholder ?? '検索...'}
            className="flex-1 text-sm text-gray-700 outline-none bg-transparent"
          />
        </div>
      );

    case 'db-table':
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

    default:
      return (
        <div
          {...clickProps}
          className="w-full h-full flex items-center justify-center"
          style={{
            backgroundColor: s.backgroundColor ?? 'transparent',
            borderRadius: s.borderRadius ?? 0,
          }}
        >
          <span className="text-xs text-gray-400">{element.type}</span>
        </div>
      );
  }
}

// ─── Single element positioned absolutely ──────────────────────────────────

function PublicElement({
  element,
  onAction,
}: {
  element: Element;
  onAction: (action: Action) => void;
}) {
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
        opacity: s.opacity ?? 1,
        overflow: 'hidden',
      }}
    >
      <ElementContent element={element} onAction={onAction} />
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

// ─── Main Page ──────────────────────────────────────────────────────────────

export default function PublicAppPage({ params }: { params: { id: string } }) {
  const { apps, getPagesForApp, addRecord, updateRecord, deleteRecord } = useStore();

  const [loading, setLoading] = useState(true);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [pageHistory, setPageHistory] = useState<string[]>([]);

  const app = apps.find(a => a.id === params.id);
  const pages = app ? getPagesForApp(params.id) : [];

  useEffect(() => {
    if (!app || !app.published) {
      setLoading(false);
      return;
    }

    const startPage =
      pages.find(p => p.isStartPageLoggedOut === true) ?? pages[0] ?? null;

    setCurrentPageId(startPage?.id ?? null);
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleAction = useCallback(
    (action: Action) => {
      switch (action.type) {
        case 'navigate':
          if (action.targetPageId) {
            setPageHistory(h => [...h, currentPageId ?? '']);
            setCurrentPageId(action.targetPageId);
          }
          break;

        case 'back': {
          const prev = pageHistory[pageHistory.length - 1];
          setPageHistory(h => h.slice(0, -1));
          setCurrentPageId(prev ?? null);
          break;
        }

        case 'external-link':
          if (action.targetUrl) {
            window.open(action.targetUrl, '_blank', 'noopener,noreferrer');
          }
          break;

        case 'create-record':
          if (action.tableId && app) {
            addRecord(app.id, action.tableId, {});
          }
          break;

        case 'update-record':
          // No-op in public view without a bound record context
          break;

        case 'delete-record':
          // No-op in public view without a bound record context
          break;

        default:
          break;
      }
    },
    [currentPageId, pageHistory, app, addRecord],
  );

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

  // ── Resolve current page ──────────────────────────────────────────────────

  const currentPage: Page | undefined =
    pages.find(p => p.id === currentPageId) ?? pages[0];

  if (!currentPage) {
    return <NotFound />;
  }

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
          <PublicElement
            key={element.id}
            element={element}
            onAction={handleAction}
          />
        ))}
      </div>

      {/* Powered by Click watermark */}
      <Watermark />
    </div>
  );
}
