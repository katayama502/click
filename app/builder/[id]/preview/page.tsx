'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useHydrated } from '@/lib/useHydrated';
import {
  runActions,
  getAppUserSession,
  resolveStartPage,
  type ActionContext,
} from '@/lib/runtime';
import type { AppUserSession, DBRecord, DBTable, Element } from '@/lib/types';
import {
  RuntimeElement,
  ToastOverlay,
  type PreviewToast,
  type RuntimeEnv,
} from '@/components/builder/PreviewRuntime';

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
// Scale calculation
// ─────────────────────────────────────────────
function getScale(device: DevicePreview): number {
  if (typeof window === 'undefined') return 1;
  const sizes: Record<DevicePreview, number> = { mobile: 390, tablet: 768, desktop: 1280 };
  const availableWidth = window.innerWidth - 120;
  const deviceWidth = sizes[device];
  return Math.min(1, availableWidth / deviceWidth);
}

// ─────────────────────────────────────────────
// Device Frame Components
// ─────────────────────────────────────────────
function MobileFrame({
  page,
  children,
}: {
  page: { backgroundColor?: string } | null;
  children: React.ReactNode;
}) {
  const bg = page?.backgroundColor ?? '#ffffff';
  return (
    <div
      style={{
        padding: '12px 10px 16px 10px',
        backgroundColor: '#1a1a1a',
        borderRadius: 52,
        boxShadow: '0 0 0 2px #333, 0 20px 60px rgba(0,0,0,0.5)',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {/* Volume down button */}
      <div style={{ position: 'absolute', left: -3, top: 80, width: 3, height: 32, backgroundColor: '#333', borderRadius: '3px 0 0 3px' }} />
      {/* Volume up button */}
      <div style={{ position: 'absolute', left: -3, top: 124, width: 3, height: 60, backgroundColor: '#333', borderRadius: '3px 0 0 3px' }} />
      {/* Power button */}
      <div style={{ position: 'absolute', right: -3, top: 100, width: 3, height: 70, backgroundColor: '#333', borderRadius: '0 3px 3px 0' }} />

      {/* Screen */}
      <div
        style={{
          width: 390,
          height: 844,
          backgroundColor: bg,
          borderRadius: 44,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Status bar */}
        <div
          style={{
            height: 44,
            backgroundColor: bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            fontSize: 12,
            fontWeight: '600',
            color: '#000',
            flexShrink: 0,
            position: 'relative',
            zIndex: 10,
          }}
        >
          <span>9:41</span>
          {/* Dynamic Island */}
          <div
            style={{
              width: 120,
              height: 28,
              backgroundColor: '#000',
              borderRadius: 14,
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              top: 8,
            }}
          />
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 11 }}>
            <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
              <rect x="0" y="3" width="3" height="9" rx="1" opacity="0.4" />
              <rect x="4.5" y="2" width="3" height="10" rx="1" opacity="0.6" />
              <rect x="9" y="0.5" width="3" height="11.5" rx="1" />
              <rect x="14" y="2" width="2" height="7" rx="1" opacity="0.4" />
            </svg>
            <svg width="15" height="11" viewBox="0 0 15 11" fill="none" stroke="currentColor" strokeWidth="1.3">
              <path d="M7.5 2.5C5.5 2.5 3.8 3.3 2.6 4.5M12.4 4.5C11.2 3.3 9.5 2.5 7.5 2.5" />
              <path d="M7.5 5.5C6.4 5.5 5.4 5.9 4.7 6.6M10.3 6.6C9.6 5.9 8.6 5.5 7.5 5.5" />
              <circle cx="7.5" cy="9" r="1" fill="currentColor" stroke="none" />
            </svg>
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
              <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" strokeOpacity="0.35" />
              <rect x="2" y="2" width="18" height="8" rx="2" fill="currentColor" />
              <path d="M23 4.5V7.5C23.8 7.2 24.5 6.5 24.5 6C24.5 5.5 23.8 4.8 23 4.5Z" fill="currentColor" fillOpacity="0.4" />
            </svg>
          </div>
        </div>

        {/* Page content */}
        <div
          style={{
            width: '100%',
            height: 'calc(100% - 44px)',
            overflow: 'auto',
            position: 'relative',
            backgroundColor: bg,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function TabletFrame({
  page,
  children,
}: {
  page: { backgroundColor?: string } | null;
  children: React.ReactNode;
}) {
  const bg = page?.backgroundColor ?? '#ffffff';
  return (
    <div
      style={{
        padding: '20px 14px',
        backgroundColor: '#2a2a2a',
        borderRadius: 32,
        boxShadow: '0 0 0 2px #444, 0 20px 60px rgba(0,0,0,0.5)',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {/* Home indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 36,
          height: 4,
          backgroundColor: '#444',
          borderRadius: 2,
        }}
      />
      {/* Camera dot */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 8,
          height: 8,
          backgroundColor: '#3a3a3a',
          borderRadius: '50%',
          border: '1.5px solid #555',
        }}
      />
      <div
        style={{
          width: 768,
          height: 1024,
          backgroundColor: bg,
          borderRadius: 20,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function DesktopFrame({
  page,
  children,
}: {
  page: { backgroundColor?: string } | null;
  children: React.ReactNode;
}) {
  const bg = page?.backgroundColor ?? '#ffffff';
  return (
    <div style={{ flexShrink: 0 }}>
      {/* Screen bezel */}
      <div
        style={{
          padding: 16,
          paddingBottom: 12,
          backgroundColor: '#2a2a2a',
          borderRadius: '16px 16px 0 0',
          boxShadow: '0 0 0 2px #444',
        }}
      >
        {/* Camera dot */}
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: '#555',
            margin: '0 auto 10px',
          }}
        />
        {/* Screen */}
        <div
          style={{
            width: 1280,
            height: 800,
            backgroundColor: bg,
            borderRadius: 4,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {children}
        </div>
      </div>
      {/* Chin/hinge */}
      <div
        style={{
          height: 14,
          backgroundColor: '#333',
          borderRadius: '0 0 2px 2px',
          boxShadow: '0 0 0 1px #444',
        }}
      />
      {/* Stand neck */}
      <div
        style={{
          width: 120,
          height: 20,
          backgroundColor: '#3a3a3a',
          margin: '0 auto',
          borderRadius: '0 0 6px 6px',
        }}
      />
      {/* Stand base */}
      <div
        style={{
          width: 220,
          height: 8,
          backgroundColor: '#444',
          margin: '0 auto',
          borderRadius: 4,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// Page navigation history entry(レコードコンテキストも保持)
// ─────────────────────────────────────────────
interface HistoryEntry {
  pageId: string;
  record: DBRecord | null;
  table: DBTable | null;
}

// ─────────────────────────────────────────────
// Main Preview Page
// ─────────────────────────────────────────────
export default function PreviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { currentUser, apps, getPagesForApp, getTablesForApp, updateApp } = useStore();

  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [devicePreview, setDevicePreview] = useState<DevicePreview>('mobile');
  const [pageHistory, setPageHistory] = useState<HistoryEntry[]>([]);
  const [copied, setCopied] = useState(false);
  const [frameScale, setFrameScale] = useState(1);

  // ── Runtime state ──────────────────────────
  const [appUser, setAppUser] = useState<AppUserSession | null>(null);
  const [sessionLoaded, setSessionLoaded] = useState(false);
  const [formValues, setFormValues] = useState<Record<string, any>>({});
  const [recordCtx, setRecordCtx] = useState<{ record: DBRecord; table: DBTable | null } | null>(null);
  const [toasts, setToasts] = useState<PreviewToast[]>([]);
  const toastIdRef = useRef(0);

  const app = apps.find(a => a.id === params.id) ?? null;
  const pages = app ? getPagesForApp(params.id) : [];
  const tables = app ? getTablesForApp(params.id) : [];

  // Auth & app guard (ハイドレーション完了まで判定しない)
  const hydrated = useHydrated();
  useEffect(() => {
    if (!hydrated) return;
    if (!currentUser) { router.replace('/login'); return; }
    if (!app) { router.replace('/workspace'); return; }
  }, [hydrated, currentUser, app, router]);

  // Restore app user session (アプリ利用者 = エンドユーザー)
  useEffect(() => {
    setAppUser(getAppUserSession(params.id));
    setSessionLoaded(true);
  }, [params.id]);

  // Set initial page (ログイン状態に応じたスタートページ)
  useEffect(() => {
    if (!sessionLoaded || pages.length === 0 || currentPageId) return;
    const startPage = resolveStartPage(pages, appUser !== null) ?? pages[0];
    setCurrentPageId(startPage.id);
  }, [sessionLoaded, pages, currentPageId, appUser]);

  // Clear form values on page transition
  useEffect(() => {
    setFormValues({});
  }, [currentPageId]);

  // Scale to fit viewport
  useEffect(() => {
    const updateScale = () => setFrameScale(getScale(devicePreview));
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [devicePreview]);

  const currentPage = pages.find(p => p.id === currentPageId) ?? pages[0] ?? null;

  // 現在のレコードコンテキストを store の最新値で解決(update-record 後の再描画用)
  const activeRecord = useMemo<DBRecord | null>(() => {
    const rec = recordCtx?.record;
    if (!rec) return null;
    for (const t of tables) {
      const found = t.records.find(r => r.id === rec.id);
      if (found) return found;
    }
    return rec;
  }, [recordCtx, tables]);

  const activeTable = useMemo<DBTable | null>(() => {
    if (!recordCtx) return null;
    const tid = recordCtx.table?.id ?? recordCtx.record.tableId;
    return tables.find(t => t.id === tid) ?? recordCtx.table ?? null;
  }, [recordCtx, tables]);

  // ── Toast(簡易通知) ───────────────────────
  const notify = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    const id = ++toastIdRef.current;
    setToasts(t => [...t, { id, msg, type }]);
    window.setTimeout(() => {
      setToasts(t => t.filter(x => x.id !== id));
    }, 2600);
  }, []);

  // ── Navigation helpers ─────────────────────
  const jumpToPage = useCallback(
    (pageId: string) => {
      if (pageId === currentPageId) return;
      setPageHistory(h =>
        currentPageId
          ? [...h, { pageId: currentPageId, record: recordCtx?.record ?? null, table: recordCtx?.table ?? null }]
          : h,
      );
      setCurrentPageId(pageId);
      setRecordCtx(null);
    },
    [currentPageId, recordCtx],
  );

  const goBack = useCallback(() => {
    setPageHistory(h => {
      const prev = h[h.length - 1];
      if (!prev) return h;
      setCurrentPageId(prev.pageId);
      setRecordCtx(prev.record ? { record: prev.record, table: prev.table } : null);
      return h.slice(0, -1);
    });
  }, []);

  // ── App user setter(logout 時は未ログインスタートページへ) ──
  const handleSetAppUser = useCallback(
    (s: AppUserSession | null) => {
      setAppUser(s);
      if (!s) {
        const pgs = useStore.getState().getPagesForApp(params.id);
        const start = resolveStartPage(pgs, false);
        if (start) {
          setCurrentPageId(start.id);
          setPageHistory([]);
          setRecordCtx(null);
          setFormValues({});
        }
      }
    },
    [params.id],
  );

  // ── アクション実行(ClickFlow) ─────────────
  const runElementActions = useCallback(
    async (element: Element, record?: DBRecord | null, recTable?: DBTable | null) => {
      if (!element.actions || element.actions.length === 0) return;
      const store = useStore.getState();
      // リスト項目タップ時は引数の record、それ以外は現在のレコードコンテキスト
      const effRecord = record !== undefined ? record : activeRecord;
      const effTable = record !== undefined ? (recTable ?? null) : activeTable;

      const ctx: ActionContext = {
        appId: params.id,
        tables: store.getTablesForApp(params.id),
        formValues,
        currentRecord: effRecord,
        currentTable: effTable,
        appUser,
        elements: currentPage?.elements,
        navigate: (pageId: string) => {
          setPageHistory(h =>
            currentPageId
              ? [...h, { pageId: currentPageId, record: recordCtx?.record ?? null, table: recordCtx?.table ?? null }]
              : h,
          );
          setCurrentPageId(pageId);
          // currentRecord 付き遷移 → 遷移先で {{フィールド名}} を解決できるようにする
          setRecordCtx(effRecord ? { record: effRecord, table: effTable } : null);
        },
        back: goBack,
        openUrl: (url: string, newTab?: boolean) => {
          window.open(url, newTab ? '_blank' : '_self');
        },
        addRecord: (tableId, values) => store.addRecord(params.id, tableId, values),
        updateRecord: (tableId, recordId, values) => store.updateRecord(params.id, tableId, recordId, values),
        deleteRecord: (tableId, recordId) => store.deleteRecord(params.id, tableId, recordId),
        setAppUser: handleSetAppUser,
        notify,
      };

      await runActions(element.actions, ctx);
    },
    [
      params.id,
      formValues,
      appUser,
      currentPage,
      currentPageId,
      recordCtx,
      activeRecord,
      activeTable,
      goBack,
      handleSetAppUser,
      notify,
    ],
  );

  const setFormValue = useCallback((elementId: string, value: any) => {
    setFormValues(prev => ({ ...prev, [elementId]: value }));
  }, []);

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
    if (prevPage) jumpToPage(prevPage.id);
  };
  const goToNextPage = () => {
    if (nextPage) jumpToPage(nextPage.id);
  };

  // Device icons (SVG, no emoji)
  const deviceIcons: Record<DevicePreview, React.ReactNode> = {
    mobile: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
    tablet: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
    desktop: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  };

  const deviceLabels: Record<DevicePreview, string> = {
    mobile: 'モバイル',
    tablet: 'タブレット',
    desktop: 'PC',
  };

  // ── Runtime env(エレメントレンダラーへ注入) ──
  const env: RuntimeEnv = {
    appId: params.id,
    tables,
    appUser,
    formValues,
    setFormValue,
    currentRecord: activeRecord,
    currentTable: activeTable,
    runElementActions,
  };

  // Page content renderer (shared across frames)
  const pageContent = (
    <>
      {currentPage ? (
        currentPage.elements.length > 0 ? (
          currentPage.elements.map(el => (
            <RuntimeElement key={el.id} element={el} env={env} />
          ))
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <path d="M3 9h18M9 21V9" />
            </svg>
            <p style={{ color: '#9ca3af', fontSize: 13 }}>このページには要素がありません</p>
          </div>
        )
      ) : (
        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <p style={{ color: '#9ca3af', fontSize: 13 }}>ページが見つかりません</p>
        </div>
      )}
      <ToastOverlay toasts={toasts} />
    </>
  );

  if (!hydrated || !currentUser || !app) return null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-800">
      {/* ── Top Bar ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 h-14 bg-gray-900 border-b border-gray-700 flex-shrink-0">
        {/* Left: Back button + app name + badge */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={() => router.push(`/builder/${params.id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 text-sm transition-colors flex-shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            閉じる
          </button>

          <div className="w-px h-5 bg-gray-700 flex-shrink-0" />

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-white text-sm font-semibold truncate">{app.name}</span>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium flex-shrink-0"
              style={{ backgroundColor: 'rgba(30,200,165,0.15)', color: '#1ec8a5', border: '1px solid rgba(30,200,165,0.3)' }}
            >
              プレビュー
            </span>
            {appUser && (
              <span
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium flex-shrink-0 bg-gray-800 text-gray-300 border border-gray-600"
                title={`アプリ利用者としてログイン中: ${appUser.email}`}
              >
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                {appUser.name || appUser.email}
              </span>
            )}
          </div>
        </div>

        {/* Center: Device toggle */}
        <div className="flex items-center gap-1 bg-gray-800 rounded-xl p-1 flex-shrink-0">
          {(['mobile', 'tablet', 'desktop'] as const).map(key => (
            <button
              key={key}
              onClick={() => setDevicePreview(key)}
              title={deviceLabels[key]}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                devicePreview === key
                  ? 'text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              style={devicePreview === key ? { backgroundColor: '#1ec8a5' } : {}}
            >
              {deviceIcons[key]}
              <span className="hidden sm:inline">{deviceLabels[key]}</span>
            </button>
          ))}
        </div>

        {/* Right: Status + publish controls */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          {/* Published status badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              app.published
                ? 'bg-brand/20 text-brand border border-brand/40'
                : 'bg-gray-700 text-gray-400 border border-gray-600'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${app.published ? 'bg-brand animate-pulse' : 'bg-gray-500'}`}
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
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
      <div className="flex-1 flex flex-col items-center justify-start py-10 overflow-auto bg-gray-800">
        <div
          style={{
            transform: `scale(${frameScale})`,
            transformOrigin: 'top center',
          }}
        >
          {devicePreview === 'mobile' && (
            <MobileFrame page={currentPage}>
              {pageContent}
            </MobileFrame>
          )}
          {devicePreview === 'tablet' && (
            <TabletFrame page={currentPage}>
              {pageContent}
            </TabletFrame>
          )}
          {devicePreview === 'desktop' && (
            <DesktopFrame page={currentPage}>
              {pageContent}
            </DesktopFrame>
          )}
        </div>
      </div>

      {/* ── Bottom Bar: Page Navigation ──────────────── */}
      <div className="flex-shrink-0 bg-gray-900 border-t border-gray-700">
        {/* Page list tabs */}
        {pages.length > 0 && (
          <div className="flex items-center justify-center gap-2 py-3 px-4 overflow-x-auto">
            {pages.map(p => (
              <button
                key={p.id}
                onClick={() => jumpToPage(p.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  p.id === currentPageId
                    ? 'text-white shadow-sm'
                    : 'text-white/60 hover:text-white/90 hover:bg-white/20'
                }`}
                style={
                  p.id === currentPageId
                    ? { backgroundColor: '#1ec8a5' }
                    : { backgroundColor: 'rgba(255,255,255,0.08)' }
                }
              >
                {p.isStartPageLoggedOut && '▶ '}{p.name}
              </button>
            ))}
          </div>
        )}

        {/* Prev / Page name / Next */}
        <div className="flex items-center justify-between max-w-sm mx-auto px-4 pb-3">
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
