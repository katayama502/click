'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Undo2, Redo2, Eye, ChevronDown, Plus, MoreHorizontal,
  Home, FileText, Layers, Search, ChevronRight, Lock, EyeOff,
  Trash2, Settings, Database, Type, Square, Minus, Smile,
  ImageIcon, Video, PlusCircle, ToggleLeft, CheckSquare,
  AlignLeft, TextCursor, Calendar, Upload, ImagePlus,
  List, LayoutGrid, SlidersHorizontal, ArrowRight, Tag,
  Users, Images, CalendarDays, Barcode, Globe, Youtube,
  Play, Stamp, CreditCard, Sparkles, MessageSquare, Star,
  MapPin, QrCode, X, ChevronUp, Pencil, ZoomIn, ZoomOut,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { generateId, cn } from '@/lib/utils';
import type { Element, ElementType, Page, ActionType } from '@/lib/types';
import CanvasElement from '@/components/builder/CanvasElement';

// ─── Device dimensions ─────────────────────────────────────────────────────
const DEVICE_SIZES = {
  mobile: { width: 390, height: 844, label: 'モバイル' },
  tablet: { width: 768, height: 1024, label: 'タブレット' },
  desktop: { width: 1280, height: 800, label: 'デスクトップ' },
} as const;

// ─── Palette categories (new Click-style) ─────────────────────────────────
type PaletteItem = { type: string; label: string; icon: React.ReactNode };

const PALETTE_CATEGORIES: Array<{
  name: string;
  isDB?: boolean;
  subSections?: Array<{ label: string; items: PaletteItem[] }>;
  items?: PaletteItem[];
}> = [
  {
    name: 'ベーシック',
    items: [
      { type: 'text', label: 'テキスト', icon: <Type size={20} /> },
      { type: 'shape', label: 'シェイプ', icon: <Square size={20} /> },
      { type: 'line', label: '線', icon: <Minus size={20} /> },
      { type: 'icon', label: 'アイコン', icon: <Smile size={20} /> },
      { type: 'image', label: '画像', icon: <ImageIcon size={20} /> },
      { type: 'video', label: '動画', icon: <Video size={20} /> },
    ],
  },
  {
    name: 'アクション',
    items: [
      { type: 'button', label: 'ボタン1', icon: <div className="flex items-center justify-center w-full h-full"><span className="text-[10px] border border-current rounded-full px-2 py-0.5 leading-none">btn</span></div> },
      { type: 'button2', label: 'ボタン2', icon: <PlusCircle size={20} /> },
      { type: 'switch-element', label: 'スイッチ', icon: <ToggleLeft size={20} /> },
      { type: 'check', label: 'チェック', icon: <CheckSquare size={20} /> },
    ],
  },
  {
    name: 'ナビゲーション',
    items: [
      { type: 'header', label: 'トップ', icon: <div className="flex flex-col items-center gap-0.5 w-full"><div className="w-full h-2.5 bg-current rounded-sm opacity-80" /><div className="flex gap-0.5 w-full"><div className="flex-1 h-1 bg-current rounded opacity-40" /><div className="flex-1 h-1 bg-current rounded opacity-40" /></div></div> },
      { type: 'tabbar', label: 'ボトム', icon: <div className="flex flex-col items-center gap-0.5 w-full"><div className="flex gap-0.5 w-full"><div className="flex-1 h-1 bg-current rounded opacity-40" /><div className="flex-1 h-1 bg-current rounded opacity-40" /></div><div className="w-full h-2.5 bg-current rounded-sm opacity-80" /></div> },
    ],
  },
  {
    name: 'データベース',
    isDB: true,
    subSections: [
      {
        label: 'インプット',
        items: [
          { type: 'form', label: 'フォーム', icon: <AlignLeft size={20} /> },
          { type: 'input', label: 'インプット', icon: <TextCursor size={20} /> },
          { type: 'password-input', label: 'パスワード', icon: <Lock size={20} /> },
          { type: 'date-input', label: '日付インプット', icon: <Calendar size={20} /> },
          { type: 'file-input', label: 'ファイルインプット', icon: <Upload size={20} /> },
          { type: 'image-input', label: '画像インプット', icon: <ImagePlus size={20} /> },
        ],
      },
      {
        label: 'アウトプット',
        items: [
          { type: 'list', label: 'ベーシック', icon: <List size={20} /> },
          { type: 'card-list', label: 'カード', icon: <LayoutGrid size={20} /> },
          { type: 'custom-list', label: 'カスタム', icon: <SlidersHorizontal size={20} /> },
          { type: 'horizontal-list', label: '水平リスト', icon: <ArrowRight size={20} /> },
          { type: 'tag-list', label: 'タグリスト', icon: <Tag size={20} /> },
          { type: 'avatar-list', label: 'アバター', icon: <Users size={20} /> },
          { type: 'carousel', label: 'カルーセル', icon: <Images size={20} /> },
          { type: 'stack-carousel', label: 'スタックカルーセル', icon: <Layers size={20} /> },
          { type: 'calendar', label: 'カレンダー', icon: <CalendarDays size={20} /> },
          { type: 'dropdown', label: 'ドロップダウン', icon: <ChevronDown size={20} /> },
          { type: 'barcode', label: 'バーコード', icon: <Barcode size={20} /> },
          { type: 'qr-code', label: 'QRコード', icon: <QrCode size={20} /> },
        ],
      },
    ],
  },
  {
    name: '外部連携',
    items: [
      { type: 'line-social', label: 'LINE', icon: <span className="text-[10px] font-bold bg-green-500 text-white rounded px-1 py-0.5 leading-none">LINE</span> },
      { type: 'map-element', label: 'マップ', icon: <MapPin size={20} /> },
      { type: 'web-view', label: 'ウェブビュー', icon: <Globe size={20} /> },
      { type: 'youtube-element', label: 'Youtube', icon: <Youtube size={20} /> },
      { type: 'vimeo-element', label: 'Vimeo', icon: <Play size={20} /> },
      { type: 'stamp-element', label: 'スタンプ', icon: <Stamp size={20} /> },
      { type: 'stamp-card', label: 'スタンプカード', icon: <CreditCard size={20} /> },
      { type: 'lottie-element', label: 'Lottie', icon: <Sparkles size={20} /> },
      { type: 'chat-element', label: 'チャット', icon: <MessageSquare size={20} /> },
      { type: 'star-rating', label: '星評価', icon: <Star size={20} /> },
    ],
  },
];

// Fallback element type for unknown types
const KNOWN_TYPES = new Set<string>([
  'text', 'shape', 'line', 'icon', 'image', 'video',
  'button', 'button2', 'switch-element', 'toggle-element',
  'header', 'tabbar',
  'form', 'input', 'password-input', 'date-input', 'file-input', 'image-input',
  'list', 'horizontal-list', 'db-table', 'carousel', 'calendar', 'dropdown', 'search-element',
  'check', 'card-list', 'custom-list', 'tag-list', 'avatar-list', 'stack-carousel',
  'barcode', 'qr-code', 'line-social', 'map-element', 'web-view',
  'youtube-element', 'vimeo-element', 'stamp-element', 'stamp-card',
  'lottie-element', 'chat-element', 'star-rating',
]);

// ─── Default element styles ───────────────────────────────────────────────
function getDefaultElement(type: string, pageId: string, deviceWidth: number, deviceHeight: number): Element {
  const cx = Math.round(deviceWidth / 2);
  const cy = Math.round(deviceHeight / 2);
  const realType = KNOWN_TYPES.has(type) ? (type as ElementType) : 'shape' as ElementType;

  const defaults: Partial<Record<string, Partial<Element>>> = {
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
    carousel: { style: { x: cx - 140, y: cy - 80, width: 280, height: 160, backgroundColor: '#f3f4f6', borderRadius: 8 } },
    calendar: { style: { x: cx - 140, y: cy - 120, width: 280, height: 240, backgroundColor: '#ffffff', borderRadius: 8 } },
    dropdown: { placeholder: '選択してください', style: { x: cx - 140, y: cy - 22, width: 280, height: 44, backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: 8 } },
    'switch-element': { label: 'スイッチ', style: { x: cx - 80, y: cy - 20, width: 160, height: 40 } },
    check: { style: { x: cx - 100, y: cy - 20, width: 200, height: 40 } },
    'card-list': { style: { x: cx - 160, y: cy - 100, width: 320, height: 200, backgroundColor: '#f9fafb', borderRadius: 8 } },
    'custom-list': { style: { x: cx - 160, y: cy - 80, width: 320, height: 160, backgroundColor: '#ffffff' } },
    'tag-list': { style: { x: cx - 140, y: cy - 30, width: 280, height: 60, backgroundColor: 'transparent' } },
    'avatar-list': { style: { x: cx - 120, y: cy - 24, width: 240, height: 48, backgroundColor: 'transparent' } },
    'stack-carousel': { style: { x: cx - 140, y: cy - 100, width: 280, height: 200, backgroundColor: '#f3f4f6', borderRadius: 12 } },
    barcode: { style: { x: cx - 100, y: cy - 40, width: 200, height: 80, backgroundColor: '#ffffff' } },
    'qr-code': { style: { x: cx - 60, y: cy - 60, width: 120, height: 120, backgroundColor: '#ffffff' } },
    'line-social': { style: { x: cx - 100, y: cy - 24, width: 200, height: 48, backgroundColor: '#06C755', borderRadius: 8 } },
    'map-element': { style: { x: cx - 160, y: cy - 100, width: 320, height: 200, backgroundColor: '#e5e7eb' } },
    'web-view': { style: { x: cx - 160, y: cy - 120, width: 320, height: 240, backgroundColor: '#ffffff' } },
    'youtube-element': { style: { x: cx - 140, y: cy - 80, width: 280, height: 160, backgroundColor: '#000000' } },
    'vimeo-element': { style: { x: cx - 140, y: cy - 80, width: 280, height: 160, backgroundColor: '#1ab7ea' } },
    'stamp-element': { style: { x: cx - 50, y: cy - 50, width: 100, height: 100, backgroundColor: 'transparent' } },
    'stamp-card': { style: { x: cx - 150, y: cy - 60, width: 300, height: 120, backgroundColor: '#fff8e6', borderRadius: 12 } },
    'lottie-element': { style: { x: cx - 60, y: cy - 60, width: 120, height: 120, backgroundColor: 'transparent' } },
    'chat-element': { style: { x: cx - 160, y: cy - 130, width: 320, height: 260, backgroundColor: '#f9fafb', borderRadius: 8 } },
    'star-rating': { style: { x: cx - 100, y: cy - 20, width: 200, height: 40, backgroundColor: 'transparent' } },
  };

  const base = defaults[type] ?? defaults['shape'] ?? {};
  return {
    id: generateId(),
    pageId,
    type: realType,
    style: (base as any).style ?? { x: cx - 50, y: cy - 25, width: 100, height: 50 },
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
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editingPageName, setEditingPageName] = useState('');
  const [pageMenuId, setPageMenuId] = useState<string | null>(null);
  const [paletteSearch, setPaletteSearch] = useState('');
  const canvasAreaRef = useRef<HTMLDivElement>(null);

  // ── Canvas pan state ────────────────────────────────────────────────────
  const canvasPanRef = useRef<{
    startX: number; startY: number;
    scrollLeft: number; scrollTop: number;
    moved: boolean;
  } | null>(null);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    const canvas = canvasAreaRef.current;
    if (!canvas) return;

    canvasPanRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      scrollLeft: canvas.scrollLeft,
      scrollTop: canvas.scrollTop,
      moved: false,
    };
    canvas.style.cursor = 'grabbing';

    const onMove = (me: MouseEvent) => {
      const pan = canvasPanRef.current;
      if (!pan || !canvasAreaRef.current) return;
      const dx = me.clientX - pan.startX;
      const dy = me.clientY - pan.startY;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) pan.moved = true;
      canvasAreaRef.current.scrollLeft = pan.scrollLeft - dx;
      canvasAreaRef.current.scrollTop = pan.scrollTop - dy;
    };

    const onUp = () => {
      if (canvasPanRef.current && !canvasPanRef.current.moved) {
        setSelectedElement(null);
        setPageMenuId(null);
      }
      canvasPanRef.current = null;
      if (canvasAreaRef.current) canvasAreaRef.current.style.cursor = 'grab';
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  }, [setSelectedElement]);

  // ── Drop element onto page ───────────────────────────────────────────────
  const handleDropOnPage = useCallback((e: React.DragEvent<HTMLDivElement>, page: Page) => {
    e.preventDefault();
    e.stopPropagation();
    const type = e.dataTransfer.getData('elementType');
    if (!type) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round((e.clientX - rect.left) / zoom);
    const y = Math.round((e.clientY - rect.top) / zoom);

    const el = getDefaultElement(type, page.id, device.width, device.height);
    const w = typeof el.style.width === 'number' ? el.style.width : 100;
    const h = typeof el.style.height === 'number' ? el.style.height : 50;
    el.style.x = Math.max(0, Math.min(device.width - w, x - Math.round(w / 2)));
    el.style.y = Math.max(0, Math.min(device.height - h, y - Math.round(h / 2)));

    addElement(params.id, page.id, el);
    setSelectedPage(page.id);
    setSelectedElement(el.id);
  }, [zoom, device, params.id, addElement, setSelectedPage, setSelectedElement]);

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
  const addElementToPage = useCallback((type: string) => {
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

  // ── Canvas view ──────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-white">
      {/* ─── Top Menu ─────────────────────────────────────────────────── */}
      <div className="h-[52px] flex items-center px-3 gap-2 border-b border-gray-200 bg-white flex-shrink-0 z-40">
        {/* Left: Logo + App info + Settings buttons */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Click logo */}
          <div className="w-7 h-7 bg-brand rounded-lg flex items-center justify-center flex-shrink-0">
            <span className="text-white font-bold text-sm leading-none">C</span>
          </div>
          {/* 2-line app info */}
          <div className="flex flex-col leading-none">
            <span className="text-[10px] text-gray-400">初期ワークスペース (Freeプラン)</span>
            <span className="text-sm font-bold text-gray-900 truncate max-w-[120px]">{app.name}</span>
          </div>
          {/* Settings */}
          <button className="ml-1 flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-brand text-brand rounded-md hover:bg-brand/5 transition-colors">
            <Settings size={12} />
            設定
          </button>
          {/* Admin */}
          <button className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium border border-gray-300 text-gray-600 rounded-md hover:bg-gray-50 transition-colors">
            管理画面
          </button>
        </div>

        {/* Center: キャンバス / データベース segmented pill */}
        <div className="flex-1 flex items-center justify-center">
          <div className="bg-gray-100 rounded-full p-1 flex items-center gap-0.5">
            {[
              { id: 'canvas', label: 'キャンバス' },
              { id: 'database', label: 'データベース' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  if (tab.id === 'database') router.push(`/builder/${params.id}/data`);
                }}
                className={cn(
                  'rounded-full px-4 py-1 text-sm font-medium transition-all',
                  tab.id === 'canvas'
                    ? 'bg-white shadow text-gray-900'
                    : 'text-gray-500 hover:text-gray-700',
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Right: App ID + Undo/Redo + Preview + Publish */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* App ID badge */}
          <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-1 rounded font-mono hidden lg:block">
            ID: {params.id.slice(0, 8)}
          </span>

          {/* Undo/Redo (subtle icons) */}
          <button
            onClick={() => undo(params.id)}
            disabled={!canUndo(params.id)}
            title="元に戻す (Ctrl+Z)"
            className={cn('w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 transition-colors', !canUndo(params.id) && 'opacity-30 cursor-not-allowed')}
          >
            <Undo2 size={13} />
          </button>
          <button
            onClick={() => redo(params.id)}
            disabled={!canRedo(params.id)}
            title="やり直し (Ctrl+Y)"
            className={cn('w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 text-gray-400 transition-colors', !canRedo(params.id) && 'opacity-30 cursor-not-allowed')}
          >
            <Redo2 size={13} />
          </button>

          {/* Preview */}
          <button
            onClick={() => router.push(`/builder/${params.id}/preview`)}
            className="flex items-center gap-1.5 px-3 h-8 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
          >
            <Eye size={14} />
            プレビュー
          </button>

          {/* Publish */}
          <button
            onClick={handlePublish}
            className={cn(
              'flex items-center gap-1.5 px-3 h-8 text-sm rounded-md font-medium transition-colors',
              app.published
                ? 'bg-brand/10 text-brand hover:bg-brand/20'
                : 'bg-brand text-white hover:bg-brand-600',
            )}
          >
            {app.published ? '公開済み' : '公開'}
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* ─── Left Panel ─────────────────────────────────────────────── */}
        <div className="w-[220px] border-r border-gray-200 bg-white flex flex-col overflow-hidden flex-shrink-0">
          {/* Search + Add page */}
          <div className="px-3 pt-3 pb-2 space-y-2 border-b border-gray-100">
            {/* Search bar */}
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input
                value={paletteSearch}
                onChange={e => setPaletteSearch(e.target.value)}
                placeholder="検索"
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-gray-100 rounded-lg border-0 outline-none focus:bg-gray-200 transition-colors"
              />
              {paletteSearch && (
                <button onClick={() => setPaletteSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X size={12} />
                </button>
              )}
            </div>
            {/* Add page button */}
            <button
              onClick={() => {
                const p = createPage(params.id, `ページ${pages.length + 1}`);
                setSelectedPage(p.id);
              }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-xs text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-full transition-colors font-medium"
            >
              <Plus size={12} />
              ページを追加する
            </button>
          </div>

          {/* Panel tabs */}
          <div className="flex border-b border-gray-100">
            {[
              { id: 'pages' as const, label: 'ページ' },
              { id: 'elements' as const, label: '要素' },
              { id: 'layers' as const, label: 'レイヤー' },
            ].map(t => (
              <button
                key={t.id}
                onClick={() => setLeftPanelTab(t.id)}
                className={cn(
                  'flex-1 py-2 text-[11px] font-medium transition-colors border-b-2',
                  leftPanelTab === t.id
                    ? 'text-brand border-brand'
                    : 'text-gray-500 border-transparent hover:text-gray-700',
                )}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto">
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
              </div>
            )}

            {/* Elements tab */}
            {leftPanelTab === 'elements' && (
              <div className="px-2 py-2 space-y-4">
                {PALETTE_CATEGORIES.map(cat => {
                  if (cat.isDB && cat.subSections) {
                    return (
                      <div key={cat.name}>
                        {/* DB section header - larger, distinct style */}
                        <div className="text-[11px] font-bold text-gray-700 mb-2 px-1">{cat.name}</div>
                        {cat.subSections.map(sub => {
                          const filteredItems = paletteSearch
                            ? sub.items.filter(i => i.label.toLowerCase().includes(paletteSearch.toLowerCase()))
                            : sub.items;
                          if (filteredItems.length === 0) return null;
                          return (
                            <div key={sub.label} className="mb-3">
                              <div className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider px-1 mb-1.5">{sub.label}</div>
                              <div className="grid grid-cols-3 gap-1.5">
                                {filteredItems.map(item => (
                                  <PaletteCard key={item.type} item={item} onClick={() => addElementToPage(item.type)} />
                                ))}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  }

                  const filteredItems = paletteSearch
                    ? (cat.items ?? []).filter(i => i.label.toLowerCase().includes(paletteSearch.toLowerCase()))
                    : (cat.items ?? []);
                  if (filteredItems.length === 0) return null;

                  return (
                    <div key={cat.name}>
                      <div className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider px-1 mb-1.5">{cat.name}</div>
                      <div className="grid grid-cols-3 gap-1.5">
                        {filteredItems.map(item => (
                          <PaletteCard key={item.type} item={item} onClick={() => addElementToPage(item.type)} />
                        ))}
                      </div>
                    </div>
                  );
                })}
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

        {/* ─── Center Canvas (all pages side by side) ──────────────────── */}
        <div
          ref={canvasAreaRef}
          className="flex-1 overflow-x-auto overflow-y-auto relative select-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #d1d5db 1px, transparent 1px)',
            backgroundSize: '20px 20px',
            backgroundColor: '#f9fafb',
            cursor: 'grab',
          }}
          onMouseDown={handleCanvasMouseDown}
        >
          <div
            className="flex flex-row items-start gap-16 px-16 py-12"
            style={{ minHeight: '100%', minWidth: 'max-content' }}
          >
            {pages.map(page => (
              <div
                key={page.id}
                className="flex flex-col items-center gap-3 flex-shrink-0"
                onClick={e => e.stopPropagation()}
                onMouseDown={e => e.stopPropagation()}
              >
                {/* Page label */}
                <div
                  onClick={() => { setSelectedPage(page.id); setSelectedElement(null); }}
                  className={cn(
                    'text-sm px-3 py-1 rounded-full cursor-pointer font-medium transition-colors',
                    page.id === selectedPageId
                      ? 'bg-brand text-white'
                      : 'text-gray-500 hover:text-gray-700 bg-white/60 hover:bg-white',
                  )}
                >
                  {page.name}
                </div>

                {/* Device frame */}
                <div
                  onClick={() => { setSelectedPage(page.id); setSelectedElement(null); }}
                  className={cn(
                    'relative flex-shrink-0 cursor-pointer transition-all',
                    page.id === selectedPageId
                      ? 'ring-2 ring-brand ring-offset-4 rounded-[44px]'
                      : 'opacity-80 hover:opacity-100',
                  )}
                  style={{
                    width: device.width * zoom + 20,
                    height: device.height * zoom + 20,
                  }}
                >
                  {/* Phone frame border */}
                  <div
                    className={cn(
                      'absolute inset-[10px] overflow-hidden shadow-2xl',
                      devicePreview === 'mobile' && 'rounded-[36px] border-[10px] border-gray-800',
                      devicePreview === 'tablet' && 'rounded-[20px] border-[8px] border-gray-800',
                      devicePreview === 'desktop' && 'rounded-lg border-[3px] border-gray-300',
                    )}
                    style={{
                      backgroundColor: page.backgroundColor ?? '#ffffff',
                      width: device.width * zoom,
                      height: device.height * zoom,
                    }}
                    onClick={e => { e.stopPropagation(); if (page.id !== selectedPageId) { setSelectedPage(page.id); setSelectedElement(null); } }}
                  >
                    {/* Notch (mobile only) */}
                    {devicePreview === 'mobile' && (
                      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-gray-800 rounded-b-2xl z-10 pointer-events-none" />
                    )}

                    {/* Elements — also the drop zone */}
                    <div
                      className="absolute inset-0 overflow-hidden"
                      style={{
                        transform: `scale(${zoom})`,
                        transformOrigin: 'top left',
                        width: device.width,
                        height: device.height,
                      }}
                      onDragOver={e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; }}
                      onDrop={e => handleDropOnPage(e, page)}
                    >
                      {page.elements.map(el => (
                        el.visible !== false && (
                          <CanvasElement
                            key={el.id}
                            element={el}
                            isSelected={el.id === selectedElementId && page.id === selectedPageId}
                            onSelect={() => {
                              setSelectedPage(page.id);
                              setSelectedElement(el.id);
                            }}
                            onUpdate={(updates) => updateElement(params.id, page.id, el.id, updates)}
                            onDelete={() => deleteElement(params.id, page.id, el.id)}
                            scale={zoom}
                          />
                        )
                      ))}
                    </div>
                  </div>
                </div>

                {/* Page type badge */}
                {page.type === 'modal' && (
                  <div className="text-[10px] text-gray-400 bg-white/80 px-2 py-0.5 rounded-full border border-gray-200">
                    モーダル
                  </div>
                )}
                {(page.isStartPageLoggedIn || page.isStartPageLoggedOut) && (
                  <div className="flex items-center gap-1 text-[10px] text-brand bg-brand/10 px-2 py-0.5 rounded-full">
                    <Home size={9} />
                    開始ページ
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Zoom controls */}
          <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-white rounded-lg shadow border border-gray-200 px-1.5 py-1.5 z-50">
            <button
              onClick={() => setZoom(Math.max(0.25, zoom - 0.1))}
              className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded transition-colors"
            >
              <ZoomOut size={13} />
            </button>
            <span className="text-xs text-gray-600 min-w-[44px] text-center">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(Math.min(2, zoom + 0.1))}
              className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-100 rounded transition-colors"
            >
              <ZoomIn size={13} />
            </button>
            <button
              onClick={() => setZoom(1)}
              className="w-6 h-6 flex items-center justify-center text-gray-400 hover:bg-gray-100 rounded text-xs transition-colors"
              title="リセット"
            >
              ⟲
            </button>
          </div>
        </div>

        {/* ─── Right Panel ─────────────────────────────────────────────── */}
        <div className="w-[272px] border-l border-gray-200 bg-white flex flex-col overflow-hidden flex-shrink-0">
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
            <AppSettings
              app={app}
              currentPage={currentPage}
              onUpdateApp={(u) => updateApp(app.id, u)}
              onUpdatePage={(u) => { if (currentPage) updatePage(params.id, currentPage.id, u); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Palette Card ─────────────────────────────────────────────────────────
function PaletteCard({ item, onClick }: { item: PaletteItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      draggable
      onDragStart={e => {
        e.dataTransfer.setData('elementType', item.type);
        e.dataTransfer.effectAllowed = 'copy';
      }}
      className="flex flex-col items-center justify-center gap-1.5 bg-white border border-gray-100 rounded-xl hover:border-brand hover:bg-brand-50 transition-all group cursor-grab active:cursor-grabbing"
      style={{ height: 72, padding: '8px 4px' }}
      title={item.label}
    >
      <div className="text-gray-500 group-hover:text-brand transition-colors flex items-center justify-center" style={{ width: 28, height: 28 }}>
        {item.icon}
      </div>
      <span className="text-[9.5px] text-gray-500 group-hover:text-brand leading-tight text-center px-0.5 line-clamp-1" style={{ fontSize: '9.5px' }}>
        {item.label}
      </span>
    </button>
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
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-gray-100">
        <h3 className="text-xs font-semibold text-gray-700">ページ設定</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        <div>
          <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">アプリ</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-500 block mb-1">アプリ名</label>
              <input
                defaultValue={app.name}
                onBlur={e => onUpdateApp({ name: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-brand transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500 block mb-1">説明</label>
              <textarea
                defaultValue={app.description ?? ''}
                onBlur={e => onUpdateApp({ description: e.target.value })}
                rows={3}
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm resize-none focus:outline-none focus:border-brand transition-colors"
              />
            </div>
          </div>
        </div>

        {currentPage && (
          <div>
            <h3 className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-3">ページ</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 block mb-1">ページ名</label>
                <input
                  defaultValue={currentPage.name}
                  onBlur={e => onUpdatePage({ name: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-sm focus:outline-none focus:border-brand transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 block mb-1">背景色</label>
                <div className="flex items-center gap-2">
                  <input
                    type="color"
                    value={currentPage.backgroundColor ?? '#ffffff'}
                    onChange={e => onUpdatePage({ backgroundColor: e.target.value })}
                    className="w-8 h-8 rounded-lg border border-gray-200 cursor-pointer p-0.5"
                  />
                  <input
                    value={currentPage.backgroundColor ?? '#ffffff'}
                    onChange={e => onUpdatePage({ backgroundColor: e.target.value })}
                    className="flex-1 border border-gray-200 rounded-lg px-2 py-1.5 text-xs font-mono focus:outline-none focus:border-brand"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-xs text-gray-500 block">開始ページ設定</label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentPage.isStartPageLoggedIn ?? false}
                    onChange={e => onUpdatePage({ isStartPageLoggedIn: e.target.checked })}
                    className="rounded accent-brand"
                  />
                  <span className="text-xs text-gray-600">ログイン時の開始ページ</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={currentPage.isStartPageLoggedOut ?? false}
                    onChange={e => onUpdatePage({ isStartPageLoggedOut: e.target.checked })}
                    className="rounded accent-brand"
                  />
                  <span className="text-xs text-gray-600">非ログイン時の開始ページ</span>
                </label>
              </div>
            </div>
          </div>
        )}
      </div>
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
      {/* 3 tabs */}
      <div className="flex border-b border-gray-200 flex-shrink-0">
        {[
          { id: 'element', label: 'エレメント' },
          { id: 'style', label: 'スタイル' },
          { id: 'actions', label: 'アクション' },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setRightPanelTab(t.id)}
            className={cn(
              'flex-1 py-2.5 text-[11px] font-medium transition-colors border-b-2',
              rightPanelTab === t.id
                ? 'text-brand border-brand'
                : 'text-gray-500 border-transparent hover:text-gray-700',
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* エレメント tab */}
        {rightPanelTab === 'element' && (
          <div className="p-3 space-y-4">
            {/* Element name section */}
            <InspectorSection label="エレメント名">
              <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-50 rounded-lg border border-gray-200">
                <div className="w-5 h-5 border border-gray-300 rounded flex-shrink-0" />
                <input
                  value={element.label ?? element.content ?? element.type}
                  onChange={e => onUpdate({ label: e.target.value })}
                  className="flex-1 text-xs bg-transparent outline-none min-w-0"
                />
                <Pencil size={11} className="text-gray-400 flex-shrink-0" />
              </div>
            </InspectorSection>

            {/* 表示設定 */}
            <CollapsibleSection label="表示設定" defaultOpen>
              <select
                value={element.visibilityCondition ?? 'always'}
                onChange={e => onUpdate({ visibilityCondition: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-brand"
              >
                <option value="always">常に表示</option>
                <option value="logged-in">ログイン時のみ</option>
                <option value="logged-out">非ログイン時のみ</option>
              </select>
            </CollapsibleSection>

            {/* Content/placeholder */}
            {['text', 'button', 'button2', 'header', 'switch-element', 'toggle-element'].includes(element.type) && (
              <CollapsibleSection label="テキスト" defaultOpen>
                <input
                  value={element.content ?? ''}
                  onChange={e => onUpdate({ content: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-brand"
                />
              </CollapsibleSection>
            )}

            {['input', 'password-input', 'date-input', 'file-input', 'dropdown', 'search-element', 'image-input'].includes(element.type) && (
              <CollapsibleSection label="プレースホルダー" defaultOpen>
                <input
                  value={element.placeholder ?? ''}
                  onChange={e => onUpdate({ placeholder: e.target.value })}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-brand"
                />
              </CollapsibleSection>
            )}

            {['image', 'video'].includes(element.type) && (
              <CollapsibleSection label="URL" defaultOpen>
                <input
                  value={element.src ?? ''}
                  onChange={e => onUpdate({ src: e.target.value })}
                  placeholder="https://..."
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-brand"
                />
              </CollapsibleSection>
            )}

            {['youtube-element', 'vimeo-element', 'web-view'].includes(element.type) && (
              <CollapsibleSection label={element.type === 'web-view' ? 'URL' : '動画URL'} defaultOpen>
                <input
                  value={element.src ?? ''}
                  onChange={e => onUpdate({ src: e.target.value })}
                  placeholder={element.type === 'youtube-element' ? 'https://www.youtube.com/watch?v=...' : element.type === 'vimeo-element' ? 'https://vimeo.com/...' : 'https://...'}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-brand"
                />
              </CollapsibleSection>
            )}

            {element.type === 'check' && (
              <CollapsibleSection label="ラベルテキスト" defaultOpen>
                <input
                  value={element.label ?? ''}
                  onChange={e => onUpdate({ label: e.target.value })}
                  placeholder="チェック項目"
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-brand"
                />
              </CollapsibleSection>
            )}

            {element.type === 'star-rating' && (
              <CollapsibleSection label="評価テキスト" defaultOpen>
                <input
                  value={element.content ?? ''}
                  onChange={e => onUpdate({ content: e.target.value })}
                  placeholder="評価コメント"
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-brand"
                />
              </CollapsibleSection>
            )}

            {/* データ連携 */}
            <CollapsibleSection label="データ連携" defaultOpen={['list', 'data-list', 'horizontal-list', 'card-list', 'custom-list', 'tag-list', 'avatar-list', 'db-table'].includes(element.type)}>
              <div className="space-y-2">
                <select
                  value={element.dataBinding?.tableId ?? ''}
                  onChange={e => onUpdate({ dataBinding: { ...element.dataBinding, tableId: e.target.value, fieldId: undefined } })}
                  className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-brand"
                >
                  <option value="">テーブルを選択</option>
                  {tables.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
                {selectedTable && (
                  <select
                    value={element.dataBinding?.fieldId ?? ''}
                    onChange={e => onUpdate({ dataBinding: { ...element.dataBinding, fieldId: e.target.value } })}
                    className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-brand"
                  >
                    <option value="">フィールドを選択</option>
                    {selectedTable.fields.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
                  </select>
                )}
              </div>
            </CollapsibleSection>
          </div>
        )}

        {/* スタイル tab */}
        {rightPanelTab === 'style' && (
          <div className="p-3 space-y-1">
            {/* サイズ・位置 */}
            <CollapsibleSection label="サイズ・位置" defaultOpen>
              <div className="grid grid-cols-2 gap-2">
                <NumInput label="W" value={typeof s.width === 'number' ? s.width : undefined} onChange={v => onUpdate({ style: { ...s, width: v } })} />
                <NumInput label="H" value={typeof s.height === 'number' ? s.height : undefined} onChange={v => onUpdate({ style: { ...s, height: v } })} />
                <NumInput label="X" value={s.x} onChange={v => onUpdate({ style: { ...s, x: v } })} />
                <NumInput label="Y" value={s.y} onChange={v => onUpdate({ style: { ...s, y: v } })} />
              </div>
            </CollapsibleSection>

            {/* 背景・色 */}
            <CollapsibleSection label="背景・色" defaultOpen>
              <div className="space-y-2">
                <ColorField label="背景色" value={s.backgroundColor ?? '#ffffff'} onChange={v => onUpdate({ style: { ...s, backgroundColor: v } })} />
                <ColorField label="テキスト色" value={s.color ?? '#1f2937'} onChange={v => onUpdate({ style: { ...s, color: v } })} />
              </div>
            </CollapsibleSection>

            {/* テキスト */}
            <CollapsibleSection label="テキスト" defaultOpen={false}>
              <div className="space-y-2">
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
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">ウェイト</label>
                  <div className="flex gap-1">
                    {['normal', '500', 'bold'].map(fw => (
                      <button key={fw} onClick={() => onUpdate({ style: { ...s, fontWeight: fw } })}
                        className={cn('flex-1 py-1 text-xs rounded-lg border transition-colors',
                          s.fontWeight === fw || (!s.fontWeight && fw === 'normal')
                            ? 'bg-brand/10 border-brand text-brand'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
                        {fw === 'normal' ? '標準' : fw === '500' ? '中' : '太'}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-gray-500 block mb-1">揃え</label>
                  <div className="flex gap-1">
                    {(['left', 'center', 'right'] as const).map(align => (
                      <button key={align} onClick={() => onUpdate({ style: { ...s, textAlign: align } })}
                        className={cn('flex-1 py-1 text-xs rounded-lg border transition-colors',
                          s.textAlign === align
                            ? 'bg-brand/10 border-brand text-brand'
                            : 'border-gray-200 text-gray-600 hover:border-gray-300')}>
                        {align === 'left' ? '左' : align === 'center' ? '中' : '右'}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </CollapsibleSection>

            {/* 境界線 */}
            <CollapsibleSection label="境界線" defaultOpen={false}>
              <div className="space-y-2">
                <div>
                  <div className="flex justify-between mb-1">
                    <label className="text-[10px] text-gray-500">角丸</label>
                    <span className="text-[10px] text-gray-700 font-mono">{s.borderRadius ?? 0}px</span>
                  </div>
                  <input
                    type="range" min={0} max={50} value={s.borderRadius ?? 0}
                    onChange={e => onUpdate({ style: { ...s, borderRadius: Number(e.target.value) } })}
                    className="w-full accent-brand"
                  />
                </div>
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
                <NumInput label="Z" value={s.zIndex} onChange={v => onUpdate({ style: { ...s, zIndex: v } })} />
              </div>
            </CollapsibleSection>
          </div>
        )}

        {/* アクション tab */}
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
      {/* Add action button - prominent brand pill */}
      <button
        onClick={addAction}
        className="w-full flex items-center justify-center gap-2 py-3 bg-brand text-white rounded-full text-sm font-medium hover:bg-brand-600 transition-colors"
      >
        <Plus size={16} />
        アクションを追加する
      </button>

      {actions.length === 0 && (
        <p className="text-xs text-gray-400 text-center py-4">アクションがありません</p>
      )}

      {actions.map(action => (
        <div key={action.id} className="border border-gray-200 rounded-xl p-3 space-y-2 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <select
              value={action.type}
              onChange={e => updateAction(action.id, { type: e.target.value })}
              className="flex-1 border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-brand bg-white"
            >
              {Object.entries(ACTION_LABELS).map(([val, label]) => (
                <option key={val} value={val}>{label}</option>
              ))}
            </select>
            <button
              onClick={() => removeAction(action.id)}
              className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors flex-shrink-0"
            >
              <Trash2 size={13} />
            </button>
          </div>

          {action.type === 'navigate' && (
            <div>
              <label className="text-[10px] text-gray-500 block mb-1">移動先ページ</label>
              <select
                value={(action as any).targetPageId ?? ''}
                onChange={e => updateAction(action.id, { targetPageId: e.target.value })}
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-brand bg-white"
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
                value={(action as any).targetUrl ?? ''}
                onChange={e => updateAction(action.id, { targetUrl: e.target.value })}
                placeholder="https://..."
                className="w-full border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs focus:outline-none focus:border-brand"
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Collapsible section ──────────────────────────────────────────────────
function CollapsibleSection({ label, children, defaultOpen = true }: { label: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="border border-gray-100 rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-[11px] font-semibold text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors"
      >
        {label}
        {open ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
      </button>
      {open && <div className="p-3 space-y-2">{children}</div>}
    </div>
  );
}

// ─── Inspector section header ─────────────────────────────────────────────
function InspectorSection({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider mb-1.5">{label}</div>
      {children}
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────
function NumInput({ label, value, onChange }: { label: string; value?: number; onChange: (v: number) => void }) {
  return (
    <div className="flex items-center gap-1.5">
      <label className="text-[10px] text-gray-400 w-4 flex-shrink-0">{label}</label>
      <input
        type="number"
        value={value ?? ''}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 border border-gray-200 rounded-lg px-2 py-1 text-xs font-mono focus:outline-none focus:border-brand min-w-0"
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
        className="w-7 h-7 rounded-lg border border-gray-200 cursor-pointer p-0.5 flex-shrink-0"
      />
      <div className="flex-1 min-w-0">
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
