'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import type { Element, Page, Action } from '@/lib/types';

// ─────────────────────────────────────────────
// Inline element renderer (preview-mode)
// ─────────────────────────────────────────────
function PreviewElementContent({ element }: { element: Element }) {
  const s = element.style;

  switch (element.type) {
    case 'text':
      return (
        <div
          className="w-full h-full flex items-center overflow-hidden"
          style={{
            color: s.color ?? '#1f2937',
            fontSize: s.fontSize ?? 16,
            fontWeight: s.fontWeight ?? 'normal',
            textAlign: s.textAlign ?? 'left',
            padding: s.padding ?? '0 4px',
          }}
        >
          {element.content ?? 'テキスト'}
        </div>
      );

    case 'button':
      return (
        <div
          className="w-full h-full flex items-center justify-center cursor-pointer select-none"
          style={{
            backgroundColor: s.backgroundColor ?? '#1ec8a5',
            color: s.color ?? '#ffffff',
            fontSize: s.fontSize ?? 14,
            fontWeight: s.fontWeight ?? '500',
            borderRadius: s.borderRadius ?? 8,
          }}
        >
          {element.content ?? 'ボタン'}
        </div>
      );

    case 'button2':
      return (
        <div
          className="w-full h-full flex items-center justify-center cursor-pointer select-none border"
          style={{
            backgroundColor: 'transparent',
            color: s.color ?? '#1ec8a5',
            borderColor: s.color ?? '#1ec8a5',
            fontSize: s.fontSize ?? 14,
            fontWeight: s.fontWeight ?? '500',
            borderRadius: s.borderRadius ?? 8,
          }}
        >
          {element.content ?? 'ボタン2'}
        </div>
      );

    case 'input':
      return (
        <input
          type="text"
          placeholder={element.placeholder ?? 'テキストを入力'}
          className="w-full h-full px-3 border outline-none focus:border-brand"
          style={{
            backgroundColor: s.backgroundColor ?? '#ffffff',
            borderColor: '#d1d5db',
            borderRadius: s.borderRadius ?? 8,
            fontSize: s.fontSize ?? 14,
            color: s.color ?? '#1f2937',
          }}
        />
      );

    case 'password-input':
      return (
        <input
          type="password"
          placeholder={element.placeholder ?? 'パスワードを入力'}
          className="w-full h-full px-3 border outline-none focus:border-brand"
          style={{
            backgroundColor: s.backgroundColor ?? '#ffffff',
            borderColor: '#d1d5db',
            borderRadius: s.borderRadius ?? 8,
            fontSize: s.fontSize ?? 14,
          }}
        />
      );

    case 'date-input':
      return (
        <input
          type="date"
          className="w-full h-full px-3 border outline-none focus:border-brand"
          style={{
            backgroundColor: s.backgroundColor ?? '#ffffff',
            borderColor: '#d1d5db',
            borderRadius: s.borderRadius ?? 8,
            fontSize: s.fontSize ?? 14,
          }}
        />
      );

    case 'shape':
      return (
        <div
          className="w-full h-full"
          style={{
            backgroundColor: s.backgroundColor ?? '#e5e7eb',
            borderRadius: s.borderRadius ?? 8,
            border: s.border,
            opacity: s.opacity !== undefined ? s.opacity / 100 : 1,
          }}
        />
      );

    case 'image':
    case 'image-input':
      return element.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={element.src}
          alt={element.label ?? ''}
          className="w-full h-full object-cover"
          style={{ borderRadius: s.borderRadius ?? 0 }}
        />
      ) : (
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-1"
          style={{ backgroundColor: s.backgroundColor ?? '#f3f4f6', borderRadius: s.borderRadius ?? 0 }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <polyline points="21 15 16 10 5 21" />
          </svg>
          <span className="text-xs text-gray-400">{element.type === 'image-input' ? '画像を選択' : '画像'}</span>
        </div>
      );

    case 'video':
      return (
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
        <div className="w-full h-full flex items-center justify-center">
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
          <span className="font-semibold text-gray-800 text-base">{element.content ?? 'ヘッダー'}</span>
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
          className="w-full h-full overflow-hidden"
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
          className="w-full h-full flex items-center gap-3 px-3 overflow-hidden"
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
                className="text-[9px] text-center rounded py-0.5 cursor-pointer hover:bg-gray-100"
                style={i + 1 === 15 ? { backgroundColor: '#1ec8a5', color: '#fff' } : { color: '#4b5563' }}
              >
                {i + 1}
              </div>
            ))}
          </div>
        </div>
      );

    case 'form':
      return (
        <div
          className="w-full h-full overflow-hidden p-3 space-y-2"
          style={{ backgroundColor: s.backgroundColor ?? '#ffffff', borderRadius: s.borderRadius ?? 8 }}
        >
          {['名前', 'メール'].map(label => (
            <div key={label}>
              <div className="text-[10px] text-gray-500 mb-0.5">{label}</div>
              <input
                type="text"
                placeholder="入力してください"
                className="w-full h-8 border border-gray-200 rounded px-2 text-xs text-gray-600 outline-none focus:border-brand"
              />
            </div>
          ))}
          <button
            className="w-full h-8 rounded text-xs text-white font-medium"
            style={{ backgroundColor: '#1ec8a5' }}
          >
            送信
          </button>
        </div>
      );

    case 'db-table':
      return (
        <div
          className="w-full h-full overflow-hidden"
          style={{ backgroundColor: s.backgroundColor ?? '#ffffff', borderRadius: s.borderRadius ?? 0 }}
        >
          <div className="flex border-b border-gray-200 bg-gray-50">
            {['ID', '名前', '値'].map(h => (
              <div key={h} className="flex-1 text-[10px] font-semibold text-gray-500 px-2 py-1.5 truncate">{h}</div>
            ))}
          </div>
          {[1, 2, 3].map(i => (
            <div key={i} className="flex border-b border-gray-100">
              {[String(i), `レコード${i}`, `値${i}`].map((v, j) => (
                <div key={j} className="flex-1 text-[10px] text-gray-600 px-2 py-1.5 truncate">{v}</div>
              ))}
            </div>
          ))}
        </div>
      );

    case 'dropdown':
      return (
        <div
          className="w-full h-full flex items-center justify-between px-3 border cursor-pointer"
          style={{
            backgroundColor: s.backgroundColor ?? '#ffffff',
            borderColor: '#d1d5db',
            borderRadius: s.borderRadius ?? 8,
          }}
        >
          <span className="text-sm text-gray-400">{element.placeholder ?? '選択してください'}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      );

    case 'search-element':
      return (
        <div
          className="w-full h-full flex items-center gap-2 px-3 border"
          style={{
            backgroundColor: s.backgroundColor ?? '#f9fafb',
            borderColor: '#e5e7eb',
            borderRadius: s.borderRadius ?? 20,
          }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder={element.placeholder ?? '検索...'}
            className="flex-1 bg-transparent outline-none text-sm text-gray-600 placeholder-gray-400"
          />
        </div>
      );

    case 'switch-element':
      return (
        <div className="w-full h-full flex items-center justify-between px-2">
          <span className="text-sm text-gray-700">{element.label ?? 'スイッチ'}</span>
          <div className="w-10 h-6 rounded-full flex items-center px-0.5 cursor-pointer" style={{ backgroundColor: '#1ec8a5' }}>
            <div className="w-5 h-5 bg-white rounded-full shadow ml-auto" />
          </div>
        </div>
      );

    case 'toggle-element':
      return (
        <div className="w-full h-full flex items-center justify-between px-2">
          <span className="text-sm text-gray-700">{element.label ?? 'トグル'}</span>
          <div className="w-8 h-8 border-2 rounded flex items-center justify-center cursor-pointer" style={{ borderColor: '#1ec8a5' }}>
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#1ec8a5' }} />
          </div>
        </div>
      );

    case 'file-input':
      return (
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-1 border-2 border-dashed cursor-pointer"
          style={{
            borderColor: '#d1d5db',
            borderRadius: s.borderRadius ?? 8,
            backgroundColor: s.backgroundColor ?? '#f9fafb',
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          <span className="text-xs text-gray-400">ファイルを選択</span>
        </div>
      );

    default:
      return (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ backgroundColor: s.backgroundColor ?? '#f3f4f6' }}
        >
          <span className="text-xs text-gray-400">{element.type}</span>
        </div>
      );
  }
}

// ─────────────────────────────────────────────
// Device sizes
// ─────────────────────────────────────────────
const deviceSizes = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
} as const;

type DevicePreview = 'mobile' | 'tablet' | 'desktop';

// ─────────────────────────────────────────────
// Main Preview Page
// ─────────────────────────────────────────────
export default function PreviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { currentUser, apps, getPagesForApp, getTablesForApp, updateApp } = useStore();

  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [devicePreview, setDevicePreview] = useState<DevicePreview>('mobile');
  const [pageHistory, setPageHistory] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const app = apps.find(a => a.id === params.id) ?? null;
  const pages = app ? getPagesForApp(params.id) : [];
  const tables = app ? getTablesForApp(params.id) : [];

  // Auth & app guard
  useEffect(() => {
    if (!currentUser) { router.replace('/login'); return; }
    if (!app) { router.replace('/workspace'); return; }
  }, [currentUser, app, router]);

  // Set initial page
  useEffect(() => {
    if (pages.length === 0) return;
    if (currentPageId) return;
    const startPage =
      pages.find(p => p.isStartPageLoggedOut) ??
      pages[0];
    setCurrentPageId(startPage.id);
  }, [pages, currentPageId]);

  const currentPage = pages.find(p => p.id === currentPageId) ?? pages[0] ?? null;

  // Action handler
  const handleAction = useCallback((action: Action) => {
    switch (action.type) {
      case 'navigate':
        if (action.targetPageId) {
          setPageHistory(h => [...h, currentPageId!]);
          setCurrentPageId(action.targetPageId);
        }
        break;
      case 'back': {
        setPageHistory(h => {
          const prev = h[h.length - 1];
          if (prev) {
            setCurrentPageId(prev);
            return h.slice(0, -1);
          }
          return h;
        });
        break;
      }
      case 'external-link':
        if (action.targetUrl) {
          window.open(action.targetUrl, action.openInNewTab ? '_blank' : '_self');
        }
        break;
    }
  }, [currentPageId]);

  // Publish
  const handlePublish = () => {
    if (!app) return;
    updateApp(params.id, { published: true, publishedUrl: `/p/${params.id}` });
  };

  // Copy URL
  const handleCopyUrl = () => {
    if (!app?.publishedUrl) return;
    const url = `${window.location.origin}${app.publishedUrl}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Previous / Next page navigation
  const currentPageIndex = pages.findIndex(p => p.id === currentPageId);
  const prevPage = currentPageIndex > 0 ? pages[currentPageIndex - 1] : null;
  const nextPage = currentPageIndex < pages.length - 1 ? pages[currentPageIndex + 1] : null;

  const goToPrevPage = () => {
    if (prevPage) {
      setPageHistory(h => [...h, currentPageId!]);
      setCurrentPageId(prevPage.id);
    }
  };
  const goToNextPage = () => {
    if (nextPage) {
      setPageHistory(h => [...h, currentPageId!]);
      setCurrentPageId(nextPage.id);
    }
  };

  // Device frame class
  const deviceFrameClass: Record<DevicePreview, string> = {
    mobile: 'border-8 border-gray-900 rounded-[3rem] shadow-2xl',
    tablet: 'border-8 border-gray-700 rounded-2xl shadow-2xl',
    desktop: 'border-8 border-gray-700 rounded-lg shadow-2xl',
  };

  if (!currentUser || !app) return null;

  const { width: frameWidth, height: frameHeight } = deviceSizes[devicePreview];

  return (
    <div className="flex flex-col min-h-screen bg-gray-800">
      {/* ── Top Bar ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 h-12 bg-gray-900 border-b border-gray-700 flex-shrink-0">
        {/* Left: Back + Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => router.push(`/builder/${params.id}`)}
            className="flex items-center gap-1.5 text-gray-300 hover:text-white text-sm transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            閉じる
          </button>
          <span className="text-gray-600 select-none">|</span>
          <span className="text-white text-sm font-medium truncate">プレビュー: {app.name}</span>
        </div>

        {/* Center: Device toggle */}
        <div className="flex items-center gap-1 bg-gray-800 rounded-lg p-1">
          {(
            [
              { key: 'mobile', label: '📱', title: 'モバイル' },
              { key: 'tablet', label: '📲', title: 'タブレット' },
              { key: 'desktop', label: '💻', title: 'PC' },
            ] as const
          ).map(({ key, label, title }) => (
            <button
              key={key}
              onClick={() => setDevicePreview(key)}
              title={title}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                devicePreview === key
                  ? 'bg-brand text-white'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Right: Status badge + actions */}
        <div className="flex items-center gap-2">
          {/* Published status badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              app.published
                ? 'bg-brand/20 text-brand border border-brand/40'
                : 'bg-gray-700 text-gray-400 border border-gray-600'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${app.published ? 'bg-brand' : 'bg-gray-500'}`}
            />
            {app.published ? '公開中' : '未公開'}
          </span>

          {/* Copy URL */}
          {app.published && app.publishedUrl && (
            <button
              onClick={handleCopyUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg text-xs transition-colors"
            >
              {copied ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  コピー済み
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  このURLをコピー
                </>
              )}
            </button>
          )}

          {/* Publish button */}
          {!app.published && (
            <button
              onClick={handlePublish}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-colors"
              style={{ backgroundColor: '#1ec8a5' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22 11 13 2 9l20-7z" />
              </svg>
              公開する
            </button>
          )}
        </div>
      </div>

      {/* ── Main Content: Device Frame ────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center py-8 overflow-auto">
        <div
          className={deviceFrameClass[devicePreview]}
          style={{ width: frameWidth, height: frameHeight, flexShrink: 0 }}
        >
          {/* App content inside frame */}
          <div
            className="w-full h-full overflow-auto relative"
            style={{
              backgroundColor: currentPage?.backgroundColor ?? '#ffffff',
              width: '100%',
              height: '100%',
            }}
          >
            {currentPage ? (
              currentPage.elements.length > 0 ? (
                currentPage.elements.map(el => (
                  <ElementWrapper
                    key={el.id}
                    element={el}
                    onAction={handleAction}
                  />
                ))
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center gap-2">
                  <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <path d="M3 9h18M9 21V9" />
                  </svg>
                  <p className="text-gray-400 text-sm">このページには要素がありません</p>
                </div>
              )
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-gray-400 text-sm">ページが見つかりません</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Bottom Bar: Page Navigation ──────────────── */}
      <div className="flex-shrink-0 bg-gray-900 border-t border-gray-700 px-4 py-3">
        {/* Page list tabs */}
        {pages.length > 0 && (
          <div className="flex items-center justify-center gap-1 mb-3 overflow-x-auto">
            {pages.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  if (p.id !== currentPageId) {
                    setPageHistory(h => [...h, currentPageId!]);
                    setCurrentPageId(p.id);
                  }
                }}
                className={`px-3 py-1 rounded-md text-xs whitespace-nowrap transition-colors ${
                  p.id === currentPageId
                    ? 'text-white font-medium'
                    : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                }`}
                style={p.id === currentPageId ? { backgroundColor: '#1ec8a5' } : {}}
              >
                {p.name}
                {p.isStartPageLoggedOut && (
                  <span className="ml-1 text-[10px] opacity-70">▶</span>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Prev / Page name / Next */}
        <div className="flex items-center justify-between max-w-sm mx-auto">
          <button
            onClick={goToPrevPage}
            disabled={!prevPage}
            className={`flex items-center gap-1 text-xs transition-colors ${
              prevPage ? 'text-gray-300 hover:text-white' : 'text-gray-600 cursor-not-allowed'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {prevPage ? prevPage.name : '前のページ'}
          </button>

          <div className="flex flex-col items-center gap-0.5">
            <span className="text-white text-sm font-medium">
              {currentPage?.name ?? '-'}
            </span>
            <span className="text-gray-500 text-[11px]">
              {currentPageIndex + 1} / {pages.length}
            </span>
          </div>

          <button
            onClick={goToNextPage}
            disabled={!nextPage}
            className={`flex items-center gap-1 text-xs transition-colors ${
              nextPage ? 'text-gray-300 hover:text-white' : 'text-gray-600 cursor-not-allowed'
            }`}
          >
            {nextPage ? nextPage.name : '次のページ'}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Element wrapper that handles click → action
// ─────────────────────────────────────────────
function ElementWrapper({
  element,
  onAction,
}: {
  element: Element;
  onAction: (action: Action) => void;
}) {
  const s = element.style;

  const handleClick = (e: React.MouseEvent) => {
    if (!element.actions || element.actions.length === 0) return;
    e.stopPropagation();
    // Execute first action (primary)
    onAction(element.actions[0]);
  };

  const isInteractive =
    element.type === 'button' ||
    element.type === 'button2' ||
    (element.actions && element.actions.length > 0);

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'absolute',
        left: s.x ?? 0,
        top: s.y ?? 0,
        width: typeof s.width === 'number' ? s.width : (s.width ?? 'auto'),
        height: typeof s.height === 'number' ? s.height : (s.height ?? 'auto'),
        opacity: s.opacity !== undefined ? s.opacity / 100 : 1,
        zIndex: s.zIndex ?? 1,
        cursor: isInteractive ? 'pointer' : 'default',
      }}
    >
      <PreviewElementContent element={element} />
    </div>
  );
}
