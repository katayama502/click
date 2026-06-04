'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Smartphone, Monitor, Tablet, Undo2, Redo2, Eye, ChevronDown,
  Plus, MoreHorizontal, Home, FileText, Layers, Grid3X3,
  Type, Square, Minus, Image, Play, MousePointerClick, ToggleLeft,
  AlignLeft, List, Table2, Calendar, Search, ChevronRight,
  Lock, EyeOff, Trash2, Settings, Database,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { generateId, cn } from '@/lib/utils';
import type { Element, ElementType, Page, ActionType } from '@/lib/types';
import CanvasElement from '@/components/builder/CanvasElement';
import ElementPaletteItem from '@/components/builder/ElementPaletteItem';

// ─── Device dimensions ─────────────────────────────────────────────────────
const DEVICE_SIZES = {
  mobile: { width: 390, height: 844, label: 'モバイル' },
  tablet: { width: 768, height: 1024, label: 'タブレット' },
  desktop: { width: 1280, height: 800, label: 'デスクトップ' },
} as const;

// ─── Element palette categories ───────────────────────────────────────────
const PALETTE_CATEGORIES = [
  {
    name: 'ベーシック',
    items: [
      { type: 'text' as ElementType, label: 'テキスト', icon: <Type size={14} /> },
      { type: 'shape' as ElementType, label: 'シェイプ', icon: <Square size={14} /> },
      { type: 'line' as ElementType, label: '線', icon: <Minus size={14} /> },
      { type: 'icon' as ElementType, label: 'アイコン', icon: <Grid3X3 size={14} /> },
      { type: 'image' as ElementType, label: '画像', icon: <Image size={14} /> },
      { type: 'video' as ElementType, label: 'ビデオ', icon: <Play size={14} /> },
    ],
  },
  {
    name: 'アクション',
    items: [
      { type: 'button' as ElementType, label: 'ボタン', icon: <MousePointerClick size={14} /> },
      { type: 'button2' as ElementType, label: 'ボタン2', icon: <MousePointerClick size={14} /> },
      { type: 'switch-element' as ElementType, label: 'スイッチ', icon: <ToggleLeft size={14} /> },
      { type: 'toggle-element' as ElementType, label: 'トグル', icon: <ToggleLeft size={14} /> },
    ],
  },
  {
    name: 'ナビゲーション',
    items: [
      { type: 'header' as ElementType, label: 'ヘッダー', icon: <AlignLeft size={14} /> },
      { type: 'tabbar' as ElementType, label: 'タブバー', icon: <AlignLeft size={14} /> },
    ],
  },
  {
    name: 'インプット',
    items: [
      { type: 'form' as ElementType, label: 'フォーム', icon: <FileText size={14} /> },
      { type: 'input' as ElementType, label: 'インプット', icon: <Square size={14} /> },
      { type: 'password-input' as ElementType, label: 'パスワード', icon: <Lock size={14} /> },
      { type: 'date-input' as ElementType, label: '日付', icon: <Calendar size={14} /> },
      { type: 'file-input' as ElementType, label: 'ファイル', icon: <FileText size={14} /> },
      { type: 'image-input' as ElementType, label: '画像入力', icon: <Image size={14} /> },
    ],
  },
  {
    name: 'アウトプット',
    items: [
      { type: 'list' as ElementType, label: 'リスト', icon: <List size={14} /> },
      { type: 'horizontal-list' as ElementType, label: '横リスト', icon: <List size={14} /> },
      { type: 'db-table' as ElementType, label: 'テーブル', icon: <Table2 size={14} /> },
      { type: 'carousel' as ElementType, label: 'カルーセル', icon: <ChevronRight size={14} /> },
      { type: 'calendar' as ElementType, label: 'カレンダー', icon: <Calendar size={14} /> },
      { type: 'dropdown' as ElementType, label: 'ドロップダウン', icon: <ChevronDown size={14} /> },
      { type: 'search-element' as ElementType, label: '検索', icon: <Search size={14} /> },
    ],
  },
];

// ─── Default element styles ───────────────────────────────────────────────
function getDefaultElement(type: ElementType, pageId: string, deviceWidth: number, deviceHeight: number): Element {
  const cx = Math.round(deviceWidth / 2);
  const cy = Math.round(deviceHeight / 2);

  const defaults: Partial<Record<ElementType, Partial<Element>>> = {
    text: { content: 'テキスト', style: { x: cx - 100, y: cy - 20, width: 200, height: 40, fontSize: 16, color: '#1f2937' } },
    button: { content: 'ボタン', style: { x: cx - 80, y: cy - 22, width: 160, height: 44, backgroundColor: '#1ec8a5', color: '#ffffff', borderRadius: 8, fontSize: 14, fontWeight: '500' } },
    button2: { content: 'ボタン2', style: { x: cx - 80, y: cy - 22, width: 160, height: 44, backgroundColor: 'transparent', color: '#1ec8a5', borderRadius: 8, border: '1px solid #1ec8a5', fontSize: 14 } },
    input: { placeholder: 'テキストを入力', style: { x: cx - 140, y: cy - 22, width: 280, height: 44, backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: 8 } },
    'password-input': { placeholder: 'パスワードを入力', style: { x: cx - 140, y: cy - 22, width: 280, height: 44, backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: 8 } },
    'date-input': { placeholder: '日付を選択', style: { x: cx - 140, y: cy - 22, width: 280, height: 44, backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: 8 } },
    'file-input': { style: { x: cx - 140, y: cy - 50, width: 280, height: 100, border: '1px dashed #d1d5db', borderRadius: 8 } },
    'image-input': { style: { x: cx - 100, y: cy - 75, width: 200, height: 150, backgroundColor: '#f3f4f6', borderRadius: 8 } },
    shape: { style: { x: cx - 50, y: cy - 50, width: 100, height: 100, backgroundColor: '#e5e7eb', borderRadius: 8 } },
    image: { style: { x: cx - 100, y: cy - 75, width: 200, height: 150, backgroundColor: '#f3f4f6' } },
    video: { style: { x: cx - 100, y: cy - 60, width: 200, height: 120, backgroundColor: '#1f2937' } },
    icon: { style: { x: cx - 20, y: cy - 20, width: 40, height: 40, color: '#1ec8a5' } },
    line: { style: { x: cx - 100, y: cy, width: 200, height: 2, borderColor: '#d1d5db', borderWidth: 1 } },
    header: { content: 'ヘッダー', style: { x: 0, y: 0, width: deviceWidth, height: 56, backgroundColor: '#ffffff' } },
    tabbar: { style: { x: 0, y: deviceHeight - 56, width: deviceWidth, height: 56, backgroundColor: '#ffffff' } },
    form: { style: { x: cx - 160, y: cy - 150, width: 320, height: 300, backgroundColor: '#ffffff', borderRadius: 8 } },
    list: { style: { x: cx - 160, y: cy - 100, width: 320, height: 200, backgroundColor: '#ffffff' } },
    'horizontal-list': { style: { x: cx - 160, y: cy - 50, width: 320, height: 100, backgroundColor: '#ffffff' } },
    'db-table': { style: { x: cx - 160, y: cy - 100, width: 320, height: 200, backgroundColor: '#ffffff' } },
    carousel: { style: { x: cx - 140, y: cy - 80, width: 280, height: 160, backgroundColor: '#f3f4f6', borderRadius: 8 } },
    calendar: { style: { x: cx - 140, y: cy - 120, width: 280, height: 240, backgroundColor: '#ffffff', borderRadius: 8 } },
    dropdown: { placeholder: '選択してください', style: { x: cx - 140, y: cy - 22, width: 280, height: 44, backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: 8 } },
    'search-element': { placeholder: '検索...', style: { x: cx - 140, y: cy - 22, width: 280, height: 44, backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 20 } },
    'switch-element': { label: 'スイッチ', style: { x: cx - 80, y: cy - 20, width: 160, height: 40 } },
    'toggle-element': { label: 'トグル', style: { x: cx - 80, y: cy - 20, width: 160, height: 40 } },
  };

  const base = defaults[type] ?? {};
  return {
    id: generateId(),
    pageId,
    type,
    style: base.style ?? { x: cx - 50, y: cy - 25, width: 100, height: 50 },
    content: (base as any).content,
    placeholder: (base as any).placeholder,
    label: (base as any).label,
    actions: [],
    visible: true,
    locked: false,
  };
}

// ─── Main builder page ────────────────────────────────────────────────────
export default function BuilderPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const store = useStore();
  const {
    currentUser, apps,
    setCurrentApp, getCurrentApp, updateApp,
    getPagesForApp, createPage, updatePage, deletePage,
    addElement, updateElement, deleteElement,
    selectedPageId, selectedElementId,
    setSelectedPage, setSelectedElement,
    devicePreview, setDevicePreview,
    zoom, setZoom,
    leftPanelTab, setLeftPanelTab,
    rightPanelTab, setRightPanelTab,
    canUndo, canRedo, undo, redo,
    getTablesForApp,
  } = store;

  // ── Initialization ──────────────────────────────────────────────────────
  useEffect(() => {
    if (!currentUser) { router.replace('/login'); return; }
    const app = apps.find(a => a.id === params.id);
    if (!app) { router.replace('/workspace'); return; }
    setCurrentApp(params.id);
    const pages = getPagesForApp(params.id);
    if (pages.length > 0 && !selectedPageId) {
      setSelectedPage(pages[0].id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, params.id]);

  const app = getCurrentApp();
  const pages = getPagesForApp(params.id);
  const tables = getTablesForApp(params.id);
  const currentPage = pages.find(p => p.id === selectedPageId) ?? pages[0] ?? null;
  const selectedElement = currentPage?.elements.find(e => e.id === selectedElementId) ?? null;
  const device = DEVICE_SIZES[devicePreview];

  // ── Local UI state ──────────────────────────────────────────────────────
  const [editingAppName, setEditingAppName] = useState(false);
  const [appNameVal, setAppNameVal] = useState('');
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingPageName, setEditingPageName] = useState('');
  const [pageMenuId, setPageMenuId] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState<'canvas' | 'data'>('canvas');
  const canvasAreaRef = useRef<HTMLDivElement>(null);

  // ── Keyboard shortcuts ──────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.includes('Mac');
      const ctrl = isMac ? e.metaKey : e.ctrlKey;

      if (ctrl && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(params.id); }
      if (ctrl && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(params.id); }
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId && currentPage) {
        const active = document.activeElement;
        if (!active || (active.tagName !== 'INPUT' && active.tagName !== 'TEXTAREA')) {
          e.preventDefault();
          deleteElement(params.id, currentPage.id, selectedElementId);
        }
      }
      if (e.key === 'Escape') setSelectedElement(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [selectedElementId, currentPage, params.id, deleteElement, setSelectedElement, undo, redo]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const addElementToPage = useCallback((type: ElementType) => {
    if (!currentPage) return;
    const el = getDefaultElement(type, currentPage.id, device.width, device.height);
    addElement(params.id, currentPage.id, el);
    setSelectedElement(el.id);
  }, [currentPage, device, params.id, addElement, setSelectedElement]);

  const handlePublish = () => {
    if (!app) return;
    updateApp(app.id, { published: true, publishedUrl: `https://click-app.example.com/${app.id}` });
  };

  if (!currentUser || !app) return null;

  // ── Main Tab: データ ────────────────────────────────────────────────────
  if (mainTab === 'data') {
    return (
      <div className="flex flex-col h-screen bg-white">
        <TopMenu
          app={app}
          mainTab={mainTab}
          setMainTab={setMainTab}
          devicePreview={devicePreview}
          setDevicePreview={setDevicePreview}
          canUndo={canUndo(params.id)}
          canRedo={canRedo(params.id)}
          onUndo={() => undo(params.id)}
          onRedo={() => redo(params.id)}
          onPreview={() => router.push(`/builder/${params.id}/preview`)}
          onPublish={handlePublish}
          editingAppName={editingAppName}
          setEditingAppName={setEditingAppName}
          appNameVal={appNameVal}
          setAppNameVal={setAppNameVal}
          onAppNameSubmit={(val) => { updateApp(app.id, { name: val }); setEditingAppName(false); }}
          appId={params.id}
          router={router}
        />
        <div className="flex-1 flex items-center justify-center text-gray-400">
          <div className="text-center space-y-2">
            <Database size={48} className="mx-auto opacity-30" />
            <p className="text-sm">データビューは <span className="font-medium text-brand">/builder/{params.id}/data</span> で利用できます</p>
            <button
              className="mt-2 px-4 py-2 bg-brand text-white rounded-lg text-sm hover:bg-brand-600"
              onClick={() => router.push(`/builder/${params.id}/data`)}
            >
              データページへ移動
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Canvas tab ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      {/* Top Menu */}
      <TopMenu
        app={app}
        mainTab={mainTab}
        setMainTab={setMainTab}
        devicePreview={devicePreview}
        setDevicePreview={setDevicePreview}
        canUndo={canUndo(params.id)}
        canRedo={canRedo(params.id)}
        onUndo={() => undo(params.id)}
        onRedo={() => redo(params.id)}
        onPreview={() => router.push(`/builder/${params.id}/preview`)}
        onPublish={handlePublish}
        editingAppName={editingAppName}
        setEditingAppName={setEditingAppName}
        appNameVal={appNameVal}
        setAppNameVal={setAppNameVal}
        onAppNameSubmit={(val) => { updateApp(app.id, { name: val }); setEditingAppName(false); }}
        appId={params.id}
        router={router}
      />

      <div className="flex flex-1 overflow-hidden">
        {/* ─── Left Panel ─────────────────────────────────────────────── */}
        <div className="w-60 border-r border-gray-200 bg-white flex flex-col overflow-hidden flex-shrink-0">
          {/* Tab icons */}
          <div className="flex border-b border-gray-200">
            {[
              { id: 'pages' as const, icon: <FileText size={16} />, label: 'ページ' },
              { id: 'elements' as const, icon: <Plus size={16} />, label: '要素' },
              { id: 'layers' as const, icon: <Layers size={16} />, label: 'レイヤー' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setLeftPanelTab(t.id)}
                title={t.label}
                className={cn(
                  'flex-1 flex items-center justify-center py-2.5 text-xs transition-colors',
                  leftPanelTab === t.id
                    ? 'text-brand border-b-2 border-brand bg-brand/5'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
                )}
              >
                {t.icon}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin">
            {/* Pages tab */}
            {leftPanelTab === 'pages' && (
              <div className="p-2">
                {pages.map(page => (
                  <PageItem
                    key={page.id}
                    page={page}
                    isSelected={page.id === selectedPageId}
                    isEditing={editingPageId === page.id}
                    editName={editingPageName}
                    menuOpen={pageMenuId === page.id}
                    onSelect={() => { setSelectedPage(page.id); setSelectedElement(null); }}
                    onDoubleClick={() => { setEditingPageId(page.id); setEditingPageName(page.name); }}
                    onEditChange={setEditingPageName}
                    onEditSubmit={() => {
                      if (editingPageName.trim()) updatePage(params.id, page.id, { name: editingPageName.trim() });
                      setEditingPageId(null);
                    }}
                    onMenuToggle={() => setPageMenuId(pageMenuId === page.id ? null : page.id)}
                    onMenuAction={(action) => {
                      setPageMenuId(null);
                      if (action === 'start-in') updatePage(params.id, page.id, { isStartPageLoggedIn: true });
                      if (action === 'start-out') updatePage(params.id, page.id, { isStartPageLoggedOut: true });
                      if (action === 'modal') updatePage(params.id, page.id, { type: page.type === 'modal' ? 'page' : 'modal' });
                      if (action === 'delete' && pages.length > 1) deletePage(params.id, page.id);
                    }}
                  />
                ))}
                <button
                  onClick={() => {
                    const p = createPage(params.id, `ページ${pages.length + 1}`);
                    setSelectedPage(p.id);
                  }}
                  className="mt-2 w-full flex items-center gap-1.5 px-3 py-2 text-xs text-gray-500 hover:text-brand hover:bg-brand/5 rounded-md border border-dashed border-gray-200 hover:border-brand transition-colors"
                >
                  <Plus size={12} />
                  ページ追加
                </button>
              </div>
            )}

            {/* Elements tab */}
            {leftPanelTab === 'elements' && (
              <div className="p-2">
                {PALETTE_CATEGORIES.map(cat => (
                  <div key={cat.name} className="mb-3">
                    <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider px-2 py-1">
                      {cat.name}
                    </div>
                    {cat.items.map(item => (
                      <ElementPaletteItem
                        key={item.type}
                        type={item.type}
                        label={item.label}
                        icon={item.icon}
                        onClick={() => addElementToPage(item.type)}
                      />
                    ))}
                  </div>
                ))}
              </div>
            )}

            {/* Layers tab */}
            {leftPanelTab === 'layers' && (
              <div className="p-2">
                {!currentPage || currentPage.elements.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-8">要素がありません</p>
                ) : (
                  [...currentPage.elements].reverse().map(el => (
                    <LayerItem
                      key={el.id}
                      element={el}
                      isSelected={el.id === selectedElementId}
                      onSelect={() => { setSelectedElement(el.id); setLeftPanelTab('layers'); }}
                      onToggleVisibility={() => updateElement(params.id, currentPage.id, el.id, { visible: !el.visible })}
                      onToggleLock={() => updateElement(params.id, currentPage.id, el.id, { locked: !el.locked })}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── Center Canvas ───────────────────────────────────────────── */}
        <div
          ref={canvasAreaRef}
          className="flex-1 canvas-grid overflow-auto relative"
          onClick={() => { setSelectedElement(null); setPageMenuId(null); }}
        >
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{ minHeight: device.height * zoom + 80, minWidth: device.width * zoom + 80 }}
          >
            <div
              className="relative flex-shrink-0"
              style={{
                width: device.width * zoom,
                height: device.height * zoom,
                transform: `scale(${zoom})`,
                transformOrigin: 'center center',
              }}
            >
              {/* Device frame */}
              <div
                className={cn(
                  'absolute inset-0 overflow-hidden shadow-2xl',
                  devicePreview === 'mobile' && 'rounded-[40px] border-[10px] border-gray-800',
                  devicePreview === 'tablet' && 'rounded-[24px] border-[8px] border-gray-800',
                  devicePreview === 'desktop' && 'rounded-lg border-[3px] border-gray-300 shadow-xl',
                )}
                style={{ backgroundColor: currentPage?.backgroundColor ?? '#ffffff' }}
                onClick={e => e.stopPropagation()}
              >
                {/* Notch (mobile only) */}
                {devicePreview === 'mobile' && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-gray-800 rounded-b-3xl z-50" />
                )}

                {/* Page canvas */}
                <div
                  className="absolute inset-0 overflow-hidden"
                  style={{ cursor: 'default' }}
                  onClick={e => { e.stopPropagation(); setSelectedElement(null); }}
                >
                  {currentPage?.elements.map(el => (
                    el.visible !== false && (
                      <CanvasElement
                        key={el.id}
                        element={el}
                        isSelected={el.id === selectedElementId}
                        onSelect={() => setSelectedElement(el.id)}
                        onUpdate={(updates) => updateElement(params.id, currentPage.id, el.id, updates)}
                        onDelete={() => deleteElement(params.id, currentPage.id, el.id)}
                        scale={zoom}
                      />
                    )
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Zoom controls */}
          <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-white rounded-lg shadow border border-gray-200 px-1 py-1 z-50">
            <button onClick={() => setZoom(zoom - 0.1)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded text-sm">−</button>
            <span className="text-xs text-gray-600 min-w-[44px] text-center">{Math.round(zoom * 100)}%</span>
            <button onClick={() => setZoom(zoom + 0.1)} className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded text-sm">+</button>
            <button onClick={() => setZoom(1)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded text-xs" title="リセット">⟲</button>
          </div>

          {/* Device label */}
          <div className="absolute bottom-4 right-4 text-xs text-gray-400 bg-white/80 px-2 py-1 rounded border border-gray-200">
            {device.label} {device.width}×{device.height}
          </div>
        </div>

        {/* ─── Right Panel ─────────────────────────────────────────────── */}
        <div className="w-72 border-l border-gray-200 bg-white flex flex-col overflow-hidden flex-shrink-0">
          {selectedElement ? (
            <ElementInspector
              element={selectedElement}
              appId={params.id}
              pageId={currentPage?.id ?? ''}
              pages={pages}
              tables={tables}
              rightPanelTab={rightPanelTab}
              setRightPanelTab={setRightPanelTab}
              onUpdate={(updates) => {
                if (!currentPage) return;
                updateElement(params.id, currentPage.id, selectedElement.id, updates);
              }}
            />
          ) : (
            <AppSettings app={app} currentPage={currentPage} onUpdateApp={(u) => updateApp(app.id, u)} onUpdatePage={(u) => { if (currentPage) updatePage(params.id, currentPage.id, u); }} />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Top Menu ─────────────────────────────────────────────────────────────
interface TopMenuProps {
  app: { id: string; name: string; version: string; published: boolean };
  mainTab: 'canvas' | 'data';
  setMainTab: (t: 'canvas' | 'data') => void;
  devicePreview: string;
  setDevicePreview: (d: any) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onPreview: () => void;
  onPublish: () => void;
  editingAppName: boolean;
  setEditingAppName: (v: boolean) => void;
  appNameVal: string;
  setAppNameVal: (v: string) => void;
  onAppNameSubmit: (v: string) => void;
  appId: string;
  router: ReturnType<typeof useRouter>;
}

function TopMenu({
  app, mainTab, setMainTab, devicePreview, setDevicePreview,
  canUndo, canRedo, onUndo, onRedo, onPreview, onPublish,
  editingAppName, setEditingAppName, appNameVal, setAppNameVal, onAppNameSubmit,
}: TopMenuProps) {
  return (
    <div className="h-12 flex items-center px-3 gap-3 border-b border-gray-200 bg-white flex-shrink-0 z-40">
      {/* Logo */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <div className="w-7 h-7 bg-brand rounded-md flex items-center justify-center text-white font-bold text-sm">C</div>
        {editingAppName ? (
          <input
            autoFocus
            value={appNameVal}
            onChange={e => setAppNameVal(e.target.value)}
            onBlur={() => onAppNameSubmit(appNameVal)}
            onKeyDown={e => { if (e.key === 'Enter') onAppNameSubmit(appNameVal); if (e.key === 'Escape') setEditingAppName(false); }}
            className="text-sm font-semibold border-b border-brand outline-none bg-transparent min-w-0 w-32"
          />
        ) : (
          <span
            className="text-sm font-semibold text-gray-800 cursor-pointer hover:text-brand transition-colors truncate max-w-[140px]"
            onDoubleClick={() => { setEditingAppName(true); setAppNameVal(app.name); }}
            title="ダブルクリックで編集"
          >
            {app.name}
          </span>
        )}
        <span className="px-1.5 py-0.5 text-[10px] font-medium bg-gray-100 text-gray-500 rounded">{app.version}</span>
      </div>

      {/* Center tabs */}
      <div className="flex-1 flex items-center justify-center gap-1">
        {[
          { id: 'canvas' as const, label: 'キャンバス' },
          { id: 'data' as const, label: 'データ' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setMainTab(t.id)}
            className={cn(
              'px-3 py-1.5 text-sm rounded-md transition-colors',
              mainTab === t.id ? 'bg-brand/10 text-brand font-medium' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        {/* Device selector */}
        <div className="flex rounded-md border border-gray-200 overflow-hidden">
          {[
            { id: 'mobile', icon: <Smartphone size={14} /> },
            { id: 'tablet', icon: <Tablet size={14} /> },
            { id: 'desktop', icon: <Monitor size={14} /> },
          ].map(d => (
            <button
              key={d.id}
              onClick={() => setDevicePreview(d.id)}
              className={cn(
                'w-8 h-7 flex items-center justify-center transition-colors',
                devicePreview === d.id ? 'bg-brand text-white' : 'text-gray-500 hover:bg-gray-50',
              )}
            >
              {d.icon}
            </button>
          ))}
        </div>

        {/* Undo/Redo */}
        <button onClick={onUndo} disabled={!canUndo} title="元に戻す (Ctrl+Z)" className={cn('w-8 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors', !canUndo && 'opacity-30 cursor-not-allowed')}>
          <Undo2 size={14} />
        </button>
        <button onClick={onRedo} disabled={!canRedo} title="やり直し (Ctrl+Y)" className={cn('w-8 h-7 flex items-center justify-center rounded hover:bg-gray-100 transition-colors', !canRedo && 'opacity-30 cursor-not-allowed')}>
          <Redo2 size={14} />
        </button>

        {/* Preview */}
        <button onClick={onPreview} className="flex items-center gap-1.5 px-3 h-7 text-sm text-gray-600 border border-gray-200 rounded-md hover:bg-gray-50 transition-colors">
          <Eye size={14} />
          プレビュー
        </button>

        {/* Publish */}
        <button
          onClick={onPublish}
          className={cn(
            'flex items-center gap-1.5 px-3 h-7 text-sm rounded-md font-medium transition-colors',
            app.published
              ? 'bg-brand/10 text-brand hover:bg-brand/20'
              : 'bg-brand text-white hover:bg-brand-600',
          )}
        >
          {app.published ? '公開済み' : '公開'}
        </button>
      </div>
    </div>
  );
}

// ─── Page item ────────────────────────────────────────────────────────────
function PageItem({
  page, isSelected, isEditing, editName, menuOpen,
  onSelect, onDoubleClick, onEditChange, onEditSubmit, onMenuToggle, onMenuAction,
}: {
  page: Page;
  isSelected: boolean;
  isEditing: boolean;
  editName: string;
  menuOpen: boolean;
  onSelect: () => void;
  onDoubleClick: () => void;
  onEditChange: (v: string) => void;
  onEditSubmit: () => void;
  onMenuToggle: () => void;
  onMenuAction: (action: string) => void;
}) {
  return (
    <div className="relative">
      <div
        onClick={onSelect}
        onDoubleClick={onDoubleClick}
        className={cn(
          'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer group',
          isSelected ? 'bg-brand/10 text-brand' : 'hover:bg-gray-100 text-gray-700',
        )}
      >
        {page.type === 'modal' ? (
          <Settings size={13} className={cn(isSelected ? 'text-brand' : 'text-gray-400')} />
        ) : (
          <FileText size={13} className={cn(isSelected ? 'text-brand' : 'text-gray-400')} />
        )}

        {isEditing ? (
          <input
            autoFocus
            value={editName}
            onChange={e => onEditChange(e.target.value)}
            onBlur={onEditSubmit}
            onKeyDown={e => { if (e.key === 'Enter') onEditSubmit(); if (e.key === 'Escape') onEditSubmit(); }}
            className="flex-1 text-xs bg-transparent border-b border-brand outline-none min-w-0"
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 text-xs truncate">{page.name}</span>
        )}

        {(page.isStartPageLoggedIn || page.isStartPageLoggedOut) && (
          <Home size={11} className="text-brand flex-shrink-0" />
        )}

        <button
          onClick={e => { e.stopPropagation(); onMenuToggle(); }}
          className="w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200 opacity-0 group-hover:opacity-100 flex-shrink-0"
        >
          <MoreHorizontal size={12} />
        </button>
      </div>

      {menuOpen && (
        <div className="absolute right-0 top-full mt-1 w-44 bg-white border border-gray-200 rounded-lg shadow-lg z-50 py-1">
          {[
            { id: 'start-in', label: 'ログイン後の開始ページ' },
            { id: 'start-out', label: 'ログアウト時の開始ページ' },
            { id: 'modal', label: page.type === 'modal' ? 'ページに変更' : 'モーダルに変更' },
            { id: 'delete', label: '削除', danger: true },
          ].map(item => (
            <button
              key={item.id}
              onClick={() => onMenuAction(item.id)}
              className={cn(
                'w-full text-left px-3 py-1.5 text-xs hover:bg-gray-50',
                (item as any).danger ? 'text-red-500 hover:bg-red-50' : 'text-gray-700',
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Layer item ───────────────────────────────────────────────────────────
function LayerItem({
  element, isSelected, onSelect, onToggleVisibility, onToggleLock,
}: {
  element: Element;
  isSelected: boolean;
  onSelect: () => void;
  onToggleVisibility: () => void;
  onToggleLock: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer group text-xs',
        isSelected ? 'bg-brand/10 text-brand' : 'hover:bg-gray-100 text-gray-600',
      )}
    >
      <span className="flex-1 truncate">{element.label ?? element.content ?? element.type}</span>
      <button
        onClick={e => { e.stopPropagation(); onToggleVisibility(); }}
        className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200"
        title={element.visible !== false ? '非表示' : '表示'}
      >
        <EyeOff size={11} className={element.visible === false ? 'text-gray-400' : 'text-gray-600'} />
      </button>
      <button
        onClick={e => { e.stopPropagation(); onToggleLock(); }}
        className="opacity-0 group-hover:opacity-100 w-5 h-5 flex items-center justify-center rounded hover:bg-gray-200"
        title={element.locked ? 'ロック解除' : 'ロック'}
      >
        <Lock size={11} className={element.locked ? 'text-brand' : 'text-gray-400'} />
      </button>
    </div>
  );
}

// ─── App settings (right panel when nothing selected) ─────────────────────
function AppSettings({
  app, currentPage, onUpdateApp, onUpdatePage,
}: {
  app: { name: string; description?: string };
  currentPage: Page | null;
  onUpdateApp: (u: any) => void;
  onUpdatePage: (u: Partial<Page>) => void;
}) {
  return (
    <div className="p-4 overflow-y-auto scrollbar-thin space-y-5">
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">アプリ設定</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 block mb-1">アプリ名</label>
            <input
              defaultValue={app.name}
              onBlur={e => onUpdateApp({ name: e.target.value })}
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-brand"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">説明</label>
            <textarea
              defaultValue={app.description ?? ''}
              onBlur={e => onUpdateApp({ description: e.target.value })}
              rows={3}
              className="w-full border border-gray-200 rounded px-2 py-1.5 text-sm resize-none focus:outline-none focus:border-brand"
            />
          </div>
        </div>
      </div>

      {currentPage && (
        <div>
          <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">ページ設定</h3>
          <div>
            <label className="text-xs text-gray-500 block mb-1">背景色</label>
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={currentPage.backgroundColor ?? '#ffffff'}
                onChange={e => onUpdatePage({ backgroundColor: e.target.value })}
                className="w-8 h-8 rounded border border-gray-200 cursor-pointer p-0.5"
              />
              <input
                value={currentPage.backgroundColor ?? '#ffffff'}
                onChange={e => onUpdatePage({ backgroundColor: e.target.value })}
                className="flex-1 border border-gray-200 rounded px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-brand"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Element inspector (right panel when element selected) ────────────────
function ElementInspector({
  element, appId, pageId, pages, tables, rightPanelTab, setRightPanelTab, onUpdate,
}: {
  element: Element;
  appId: string;
  pageId: string;
  pages: Page[];
  tables: any[];
  rightPanelTab: string;
  setRightPanelTab: (t: any) => void;
  onUpdate: (u: Partial<Element>) => void;
}) {
  const s = element.style;
  const selectedTable = tables.find(t => t.id === element.dataBinding?.tableId);

  return (
    <div className="flex flex-col h-full">
      {/* Tabs */}
      <div className="flex border-b border-gray-200 flex-shrink-0">
        {[
          { id: 'properties', label: 'プロパティ' },
          { id: 'style', label: 'スタイル' },
          { id: 'data', label: 'データ' },
          { id: 'actions', label: 'アクション' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setRightPanelTab(t.id)}
            className={cn(
              'flex-1 py-2 text-[11px] font-medium transition-colors border-b-2',
              rightPanelTab === t.id
                ? 'text-brand border-brand'
                : 'text-gray-500 border-transparent hover:text-gray-700',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin">
        {/* Properties tab */}
        {rightPanelTab === 'properties' && (
          <div className="p-3 space-y-3">
            <PropField label="タイプ">
              <span className="text-xs text-gray-500 font-mono">{element.type}</span>
            </PropField>

            {['text', 'button', 'button2', 'header', 'switch-element', 'toggle-element'].includes(element.type) && (
              <PropField label="テキスト">
                <input
                  value={element.content ?? ''}
                  onChange={e => onUpdate({ content: e.target.value })}
                  className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-brand"
                />
              </PropField>
            )}

            {['input', 'password-input', 'date-input', 'file-input', 'dropdown', 'search-element'].includes(element.type) && (
              <PropField label="プレースホルダー">
                <input
                  value={element.placeholder ?? ''}
                  onChange={e => onUpdate({ placeholder: e.target.value })}
                  className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-brand"
                />
              </PropField>
            )}

            {['image', 'video'].includes(element.type) && (
              <PropField label="URL">
                <input
                  value={element.src ?? ''}
                  onChange={e => onUpdate({ src: e.target.value })}
                  placeholder="https://..."
                  className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-brand"
                />
              </PropField>
            )}

            <PropField label="ラベル">
              <input
                value={element.label ?? ''}
                onChange={e => onUpdate({ label: e.target.value })}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-brand"
              />
            </PropField>
          </div>
        )}

        {/* Style tab */}
        {rightPanelTab === 'style' && (
          <div className="p-3 space-y-4">
            {/* Size */}
            <StyleSection label="サイズ">
              <div className="grid grid-cols-2 gap-2">
                <NumInput label="W" value={typeof s.width === 'number' ? s.width : undefined} onChange={v => onUpdate({ style: { ...s, width: v } })} />
                <NumInput label="H" value={typeof s.height === 'number' ? s.height : undefined} onChange={v => onUpdate({ style: { ...s, height: v } })} />
              </div>
            </StyleSection>

            {/* Position */}
            <StyleSection label="位置">
              <div className="grid grid-cols-2 gap-2">
                <NumInput label="X" value={s.x} onChange={v => onUpdate({ style: { ...s, x: v } })} />
                <NumInput label="Y" value={s.y} onChange={v => onUpdate({ style: { ...s, y: v } })} />
              </div>
            </StyleSection>

            {/* Colors */}
            <StyleSection label="色">
              <ColorField label="背景色" value={s.backgroundColor ?? '#ffffff'} onChange={v => onUpdate({ style: { ...s, backgroundColor: v } })} />
              <ColorField label="テキスト色" value={s.color ?? '#1f2937'} onChange={v => onUpdate({ style: { ...s, color: v } })} />
            </StyleSection>

            {/* Typography */}
            <StyleSection label="タイポグラフィ">
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-[10px] text-gray-500">フォントサイズ</label>
                  <span className="text-[10px] text-gray-700 font-mono">{s.fontSize ?? 16}px</span>
                </div>
                <input
                  type="range" min={8} max={72} value={s.fontSize ?? 16}
                  onChange={e => onUpdate({ style: { ...s, fontSize: Number(e.target.value) } })}
                  className="w-full accent-brand"
                />
              </div>

              <div className="mt-2">
                <label className="text-[10px] text-gray-500 block mb-1">フォントウェイト</label>
                <div className="flex gap-1">
                  {['normal', '500', 'bold'].map(fw => (
                    <button
                      key={fw}
                      onClick={() => onUpdate({ style: { ...s, fontWeight: fw } })}
                      className={cn(
                        'flex-1 py-1 text-xs rounded border transition-colors',
                        s.fontWeight === fw || (!s.fontWeight && fw === 'normal')
                          ? 'bg-brand/10 border-brand text-brand'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300',
                      )}
                    >
                      {fw === 'normal' ? '標準' : fw === '500' ? '中' : '太字'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-2">
                <label className="text-[10px] text-gray-500 block mb-1">テキスト揃え</label>
                <div className="flex gap-1">
                  {(['left', 'center', 'right'] as const).map(align => (
                    <button
                      key={align}
                      onClick={() => onUpdate({ style: { ...s, textAlign: align } })}
                      className={cn(
                        'flex-1 py-1 text-xs rounded border transition-colors',
                        s.textAlign === align
                          ? 'bg-brand/10 border-brand text-brand'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300',
                      )}
                    >
                      {align === 'left' ? '左' : align === 'center' ? '中央' : '右'}
                    </button>
                  ))}
                </div>
              </div>
            </StyleSection>

            {/* Border */}
            <StyleSection label="ボーダー">
              <div className="flex justify-between mb-1">
                <label className="text-[10px] text-gray-500">角丸</label>
                <span className="text-[10px] text-gray-700 font-mono">{s.borderRadius ?? 0}px</span>
              </div>
              <input
                type="range" min={0} max={50} value={s.borderRadius ?? 0}
                onChange={e => onUpdate({ style: { ...s, borderRadius: Number(e.target.value) } })}
                className="w-full accent-brand"
              />
            </StyleSection>

            {/* Opacity */}
            <StyleSection label="その他">
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-[10px] text-gray-500">透明度</label>
                  <span className="text-[10px] text-gray-700 font-mono">{s.opacity ?? 100}%</span>
                </div>
                <input
                  type="range" min={0} max={100} value={s.opacity ?? 100}
                  onChange={e => onUpdate({ style: { ...s, opacity: Number(e.target.value) } })}
                  className="w-full accent-brand"
                />
              </div>
              <NumInput label="Z-index" value={s.zIndex} onChange={v => onUpdate({ style: { ...s, zIndex: v } })} />
            </StyleSection>
          </div>
        )}

        {/* Data tab */}
        {rightPanelTab === 'data' && (
          <div className="p-3 space-y-3">
            <PropField label="テーブル">
              <select
                value={element.dataBinding?.tableId ?? ''}
                onChange={e => onUpdate({ dataBinding: { ...element.dataBinding, tableId: e.target.value, fieldId: undefined } })}
                className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-brand"
              >
                <option value="">テーブルを選択</option>
                {tables.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </PropField>

            {selectedTable && (
              <PropField label="フィールド">
                <select
                  value={element.dataBinding?.fieldId ?? ''}
                  onChange={e => onUpdate({ dataBinding: { ...element.dataBinding, fieldId: e.target.value } })}
                  className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:border-brand"
                >
                  <option value="">フィールドを選択</option>
                  {selectedTable.fields.map((f: any) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </PropField>
            )}
          </div>
        )}

        {/* Actions tab */}
        {rightPanelTab === 'actions' && (
          <ActionsPanel element={element} pages={pages} onUpdate={onUpdate} />
        )}
      </div>
    </div>
  );
}

// ─── Actions panel ────────────────────────────────────────────────────────
function ActionsPanel({ element, pages, onUpdate }: { element: Element; pages: Page[]; onUpdate: (u: Partial<Element>) => void }) {
  const actions = element.actions ?? [];

  const addAction = () => {
    const newAction = { id: generateId(), type: 'navigate' as ActionType };
    onUpdate({ actions: [...actions, newAction] });
  };

  const updateAction = (id: string, updates: any) => {
    onUpdate({ actions: actions.map(a => a.id === id ? { ...a, ...updates } : a) });
  };

  const removeAction = (id: string) => {
    onUpdate({ actions: actions.filter(a => a.id !== id) });
  };

  const ACTION_LABELS: Record<string, string> = {
    navigate: 'ページ移動', back: '←戻る', 'external-link': '外部リンク',
    'create-record': 'レコード作成', 'update-record': 'レコード更新', 'delete-record': 'レコード削除',
    login: 'ログイン', logout: 'ログアウト', register: '登録', custom: 'カスタム',
  };

  return (
    <div className="p-3 space-y-3">
      {actions.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-4">アクションがありません</p>
      )}

      {actions.map(action => (
        <div key={action.id} className="border border-gray-200 rounded-lg p-3 space-y-2">
          <div className="flex items-center gap-2">
            <select
              value={action.type}
              onChange={e => updateAction(action.id, { type: e.target.value })}
              className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-brand"
            >
              {Object.entries(ACTION_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <button onClick={() => removeAction(action.id)} className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 rounded hover:bg-red-50">
              <Trash2 size={12} />
            </button>
          </div>

          {action.type === 'navigate' && (
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">移動先ページ</label>
              <select
                value={action.targetPageId ?? ''}
                onChange={e => updateAction(action.id, { targetPageId: e.target.value })}
                className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-brand"
              >
                <option value="">ページを選択</option>
                {pages.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}

          {action.type === 'external-link' && (
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">URL</label>
              <input
                value={action.targetUrl ?? ''}
                onChange={e => updateAction(action.id, { targetUrl: e.target.value })}
                placeholder="https://..."
                className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:outline-none focus:border-brand"
              />
            </div>
          )}
        </div>
      ))}

      <button
        onClick={addAction}
        className="w-full flex items-center justify-center gap-1.5 py-2 text-xs text-brand border border-dashed border-brand/40 rounded-lg hover:bg-brand/5 transition-colors"
      >
        <Plus size={12} />
        アクションを追加
      </button>
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────
function PropField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-[10px] text-gray-500 block mb-1 font-medium uppercase tracking-wide">{label}</label>
      {children}
    </div>
  );
}

function StyleSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-2">{label}</div>
      <div className="space-y-2">{children}</div>
    </div>
  );
}

function NumInput({ label, value, onChange }: { label: string; value?: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <label className="text-[10px] text-gray-400 w-4 flex-shrink-0">{label}</label>
      <input
        type="number"
        value={value ?? ''}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 border border-gray-200 rounded px-2 py-1 text-xs font-mono focus:outline-none focus:border-brand min-w-0"
      />
    </div>
  );
}

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="flex items-center gap-2">
      <input
        type="color"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-7 h-7 rounded border border-gray-200 cursor-pointer p-0.5 flex-shrink-0"
      />
      <div className="flex-1">
        <label className="text-[10px] text-gray-500 block">{label}</label>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          className="w-full border-0 text-[11px] font-mono text-gray-700 focus:outline-none bg-transparent"
        />
      </div>
    </div>
  );
}
