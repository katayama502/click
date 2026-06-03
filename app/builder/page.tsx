'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext, DragEndEvent, DragOverEvent, DragStartEvent, DragOverlay,
  MouseSensor, TouchSensor, useSensor, useSensors, closestCenter,
} from '@dnd-kit/core';
import { v4 as uuidv4 } from 'uuid';
import { useBuilderStore } from '@/lib/store';
import { AppElement, ElementType } from '@/lib/types';
import { publishApp } from '@/lib/api';
import ElementPalette from '@/components/builder/ElementPalette';
import Canvas from '@/components/builder/Canvas';
import PropertiesPanel from '@/components/builder/PropertiesPanel';
import ElementRenderer from '@/components/builder/ElementRenderer';
import DatabasePanel from '@/components/builder/DatabasePanel';
import { cn } from '@/lib/utils';

type ViewMode = 'desktop' | 'tablet' | 'mobile';
type SidebarTab = 'components' | 'pages' | 'theme';
type MainMode = 'canvas' | 'database';

/* ─── Default element factory ─── */
function createDefaultElement(type: ElementType): AppElement {
  const id = uuidv4();
  const uid = () => uuidv4();
  switch (type) {
    case 'text':       return { id, type, props: { text: 'テキストを入力してください', align: 'left' } };
    case 'heading':    return { id, type, props: { text: '見出しを入力してください', align: 'left' } };
    case 'image':      return { id, type, props: { src: '', alt: '画像' } };
    case 'video':      return { id, type, props: { videoUrl: '' } };
    case 'divider':    return { id, type, props: {} };
    case 'spacer':     return { id, type, props: { spacerHeight: 24 } };
    case 'shape':      return { id, type, props: { bgColor: '#1ec8a5', shapeType: 'rect', height: '60px', width: '100%' } };
    case 'button':     return { id, type, props: { text: 'ボタン', variant: 'primary', size: 'md' } };
    case 'toggle':     return { id, type, props: { label: 'トグル', toggleValue: false } };
    case 'iconbutton': return { id, type, props: { iconName: '✦', size: 'md' } };
    case 'input':      return { id, type, props: { label: '', placeholder: 'テキストを入力...' } };
    case 'textarea':   return { id, type, props: { label: '', placeholder: 'テキストを入力...', rows: 3 } };
    case 'password':   return { id, type, props: { label: 'パスワード', placeholder: '••••••••' } };
    case 'date':       return { id, type, props: { label: '日付' } };
    case 'dropdown':   return { id, type, props: {
        label: 'ドロップダウン',
        placeholder: '選択してください',
        dropdownOptions: [
          { id: uid(), label: '選択肢 1', value: '1' },
          { id: uid(), label: '選択肢 2', value: '2' },
          { id: uid(), label: '選択肢 3', value: '3' },
        ],
      }};
    case 'check':      return { id, type, props: { label: 'チェックボックス', checked: false } };
    case 'radio':      return { id, type, props: {
        label: 'ラジオボタン',
        radioOptions: [
          { id: uid(), label: '選択肢 A', value: 'a' },
          { id: uid(), label: '選択肢 B', value: 'b' },
          { id: uid(), label: '選択肢 C', value: 'c' },
        ],
      }};
    case 'fileupload': return { id, type, props: { label: 'ファイルアップロード' } };
    case 'stepper':    return { id, type, props: { label: '数量', stepperValue: 1, stepperMin: 0, stepperMax: 99 } };
    case 'rating':     return { id, type, props: { label: '評価', ratingValue: 3, ratingMax: 5 } };
    case 'card':       return { id, type, props: { text: 'カードタイトル' } };
    case 'list':       return { id, type, props: {
        items: [
          { id: uid(), icon: '✅', title: 'リスト項目 1', subtitle: 'サブテキスト' },
          { id: uid(), icon: '⭐', title: 'リスト項目 2' },
          { id: uid(), icon: '🎯', title: 'リスト項目 3', subtitle: 'サブテキスト' },
        ],
      }};
    case 'table':      return { id, type, props: {
        tableColumns: [{ id: uid(), label: '名前' }, { id: uid(), label: 'ステータス' }, { id: uid(), label: '日付' }],
        tableRows: [
          { id: uid(), cells: ['田中 太郎', '完了', '2024/01/01'] },
          { id: uid(), cells: ['鈴木 花子', '進行中', '2024/01/02'] },
          { id: uid(), cells: ['佐藤 次郎', '未着手', '2024/01/03'] },
        ],
      }};
    case 'badge':      return { id, type, props: { text: 'バッジ', badgeVariant: 'subtle', badgeColor: '#1ec8a5' } };
    case 'avatar':     return { id, type, props: { avatarName: '山田 太郎', label: 'エンジニア', avatarSize: 'md' } };
    case 'progress':   return { id, type, props: { label: 'プログレス', progressValue: 60, progressColor: '#1ec8a5' } };
    case 'tag':        return { id, type, props: { tags: ['タグ1', 'タグ2', 'タグ3'] } };
    case 'nav':        return { id, type, props: {
        navItems: [
          { id: uid(), icon: '🏠', label: 'ホーム' },
          { id: uid(), icon: '🔍', label: '検索' },
          { id: uid(), icon: '❤️', label: 'お気に入り' },
          { id: uid(), icon: '👤', label: 'プロフィール' },
        ],
      }};
    case 'carousel':   return { id, type, props: {
        carouselItems: [
          { id: uid(), caption: 'スライド 1' },
          { id: uid(), caption: 'スライド 2' },
          { id: uid(), caption: 'スライド 3' },
        ],
      }};
    case 'qrcode':     return { id, type, props: { label: 'QRコード', qrValue: 'https://example.com' } };
    case 'container':  return { id, type, props: { children: [] } };
    case 'form':       return { id, type, props: { formTitle: '登録フォーム', formSubmitLabel: '送信する', formFields: [] } };
    default:           return { id, type, props: {} };
  }
}

/* ─── Sidebar tab icons ─── */
function TabIcon({ active, children }: { active: boolean; children: React.ReactNode }) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center gap-1 py-3 cursor-pointer transition-colors',
      active ? 'text-[#1ec8a5]' : 'text-slate-500 hover:text-slate-300',
    )}>
      {children}
    </div>
  );
}

/* ─── Main page ─── */
export default function BuilderPage() {
  const router = useRouter();
  const {
    project, selectedPageId, selectedElementId, initProject,
    addElement, reorderElements, addPage, selectPage,
    renamePage, deletePage, undo, redo, canUndo, canRedo, updateProjectName,
  } = useBuilderStore();

  const [viewMode, setViewMode] = useState<ViewMode>('mobile');
  const [mainMode, setMainMode] = useState<MainMode>('canvas');
  const [activeDragType, setActiveDragType] = useState<ElementType | null>(null);
  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('components');
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [pageNameInput, setPageNameInput] = useState('');
  const [hoveredPageId, setHoveredPageId] = useState<string | null>(null);
  const [themeColor, setThemeColor] = useState('#1ec8a5');

  useEffect(() => { initProject(); }, [initProject]);
  useEffect(() => { if (project?.name) setNameInput(project.name); }, [project?.name]);

  /* Global keyboard shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const isMac = navigator.platform.toUpperCase().includes('MAC');
      const mod = isMac ? e.metaKey : e.ctrlKey;
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;
      if (mod && e.key === 'z' && !e.shiftKey) { e.preventDefault(); undo(); }
      else if (mod && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) { e.preventDefault(); redo(); }
      else if (mod && e.key === 'd' && selectedElementId && project) {
        e.preventDefault();
        const page = project.pages.find(p => p.id === selectedPageId);
        const el = page?.elements.find(el => el.id === selectedElementId);
        if (el) {
          const cloned = { ...el, id: uuidv4(), props: { ...el.props } };
          addElement(cloned, selectedPageId ?? undefined);
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, selectedElementId, selectedPageId, project, addElement]);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    if (event.active.data.current?.isPalette)
      setActiveDragType(event.active.data.current.type as ElementType);
  }, []);

  const handleDragOver = useCallback((_: DragOverEvent) => {}, []);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveDragType(null);
    if (!over) return;
    const isFromPalette = active.data.current?.isPalette;
    const isCanvas = over.id === 'canvas-drop-zone' || over.data.current?.isCanvas;
    if (isFromPalette && isCanvas) {
      const el = createDefaultElement(active.data.current?.type as ElementType);
      addElement(el);
      return;
    }
    if (!isFromPalette && active.id !== over.id) {
      const page = project?.pages.find((p) => p.id === selectedPageId);
      if (!page) return;
      const from = page.elements.findIndex((el) => el.id === active.id);
      const to = page.elements.findIndex((el) => el.id === over.id);
      if (from !== -1 && to !== -1) reorderElements(page.id, from, to);
    }
  }, [project, selectedPageId, addElement, reorderElements]);

  const handleNameSubmit = () => {
    if (nameInput.trim()) updateProjectName(nameInput.trim());
    setEditingName(false);
  };
  const handlePageRenameSubmit = () => {
    if (editingPageId && pageNameInput.trim()) renamePage(editingPageId, pageNameInput.trim());
    setEditingPageId(null);
    setPageNameInput('');
  };

  const handlePublish = async () => {
    if (!project) return;
    setIsPublishing(true);
    try {
      const data = await publishApp(project);
      window.open(`/published/${data.publishedId}`, '_blank');
    } catch { alert('公開に失敗しました。もう一度お試しください。'); }
    finally { setIsPublishing(false); }
  };

  const activeDragElement = activeDragType ? createDefaultElement(activeDragType) : null;
  const undoable = canUndo();
  const redoable = canRedo();

  if (!project) return (
    <div className="flex items-center justify-center h-screen bg-slate-900">
      <div className="text-center">
        <div className="w-8 h-8 border-2 border-[#1ec8a5] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-slate-400 text-sm">読み込み中...</p>
      </div>
    </div>
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="builder-layout bg-slate-900">

        {/* ── Toolbar ── */}
        <header className="h-12 bg-[#0f172a] border-b border-slate-800 flex items-center px-3 gap-3 flex-shrink-0 z-10">
          {/* Back + Logo */}
          <button onClick={() => router.push('/')}
            className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors text-sm shrink-0 pr-2 border-r border-slate-700">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          <div className="w-5 h-5 rounded-md bg-gradient-to-br from-[#1ec8a5] to-[#13a98a] flex items-center justify-center shrink-0">
            <span className="text-white text-[9px] font-black">C</span>
          </div>

          {/* App name */}
          {editingName ? (
            <input type="text" value={nameInput} onChange={(e) => setNameInput(e.target.value)}
              onBlur={handleNameSubmit} autoFocus maxLength={100}
              onKeyDown={(e) => { if (e.key === 'Enter') handleNameSubmit(); if (e.key === 'Escape') setEditingName(false); }}
              className="bg-slate-800 text-slate-200 text-sm font-semibold px-2 py-0.5 rounded border border-[#1ec8a5] outline-none w-40" />
          ) : (
            <button onClick={() => setEditingName(true)}
              className="text-slate-200 text-sm font-semibold hover:text-white transition-colors truncate max-w-32" title="クリックして編集">
              {project.name}
            </button>
          )}

          <div className="flex items-center gap-1 border-l border-slate-700 pl-2 ml-1">
            <button className="text-xs text-slate-400 hover:text-slate-200 border border-slate-600 hover:border-slate-400 px-2 py-1 rounded transition-colors">
              設定
            </button>
            <button className="text-xs text-slate-400 hover:text-slate-200 border border-slate-600 hover:border-slate-400 px-2 py-1 rounded transition-colors">
              管理画面
            </button>
          </div>

          {/* Undo / Redo */}
          <div className="flex items-center gap-1 border-l border-slate-700 pl-2">
            {[
              { fn: undo, disabled: !undoable, title: 'Undo (Cmd+Z)', path: 'M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6', label: '↩' },
              { fn: redo, disabled: !redoable, title: 'Redo (Cmd+Y)', path: 'M21 10H11a8 8 0 00-8 8v2m18-10l-6 6m6-6l-6-6', label: '↪' },
            ].map(({ fn, disabled, title, path, label }) => (
              <button key={title} onClick={fn} disabled={disabled} title={title}
                className={cn(
                  'flex items-center gap-1 px-2 py-1 rounded-md text-xs font-medium transition-all',
                  disabled
                    ? 'text-slate-700 cursor-not-allowed'
                    : 'text-slate-300 hover:text-white hover:bg-slate-700 border border-transparent hover:border-slate-600 active:scale-95'
                )}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
                </svg>
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* Center: Canvas/Database mode switch */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 mx-auto">
            <button
              onClick={() => setMainMode('canvas')}
              className={cn(
                'px-4 py-1.5 rounded-md text-xs font-semibold transition-colors',
                mainMode === 'canvas'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              キャンバス
            </button>
            <button
              onClick={() => setMainMode('database')}
              className={cn(
                'px-4 py-1.5 rounded-md text-xs font-semibold transition-colors',
                mainMode === 'database'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              )}
            >
              データベース
            </button>
          </div>

          {/* View mode */}
          <div className="flex items-center bg-slate-800 rounded-lg p-0.5 gap-0.5">
            {([
              { mode: 'mobile'  as ViewMode, w: '375', label: 'モバイル',   path: 'M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z' },
              { mode: 'tablet'  as ViewMode, w: '768', label: 'タブレット', path: 'M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z' },
              { mode: 'desktop' as ViewMode, w: '100%',label: 'デスクトップ',path: 'M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2' },
            ] as const).map(({ mode, label, path }) => (
              <button key={mode} onClick={() => setViewMode(mode)} title={label}
                className={cn('p-1.5 rounded-md transition-colors', viewMode === mode ? 'bg-[#1ec8a5] text-white' : 'text-slate-500 hover:text-slate-300')}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={path} />
                </svg>
              </button>
            ))}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            <button onClick={() => project && window.open(`/preview/${project.id}`, '_blank')}
              className="flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 border border-slate-600 hover:border-slate-500 px-3 py-1.5 rounded-lg transition-all active:scale-95">
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              プレビュー
            </button>
            <button onClick={handlePublish} disabled={isPublishing}
              className="flex items-center gap-1.5 text-xs font-bold text-white disabled:opacity-70 px-4 py-1.5 rounded-lg transition-all active:scale-95 shadow-md hover:shadow-lg"
              style={{ background: isPublishing ? '#13a98a' : 'linear-gradient(135deg, #1ec8a5 0%, #13a98a 50%, #0e8a72 100%)', boxShadow: '0 2px 8px rgba(30,200,165,0.4)' }}>
              {isPublishing ? (
                <><div className="w-3 h-3 border border-white border-t-transparent rounded-full animate-spin" />公開中...</>
              ) : (
                <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>公開する</>
              )}
            </button>
          </div>
        </header>

        {/* ── Main area ── */}
        <div className="builder-main">

          {/* ── Left sidebar ── */}
          <div className="flex overflow-hidden flex-shrink-0" style={{ width: '336px' }}>
            {/* Icon tab strip */}
            <div className="w-16 flex flex-col items-center border-r border-slate-700 bg-[#0f172a] flex-shrink-0">
              {([
                { id: 'components' as SidebarTab, title: 'コンポーネント',
                  icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zm10 0a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg>,
                },
                { id: 'pages' as SidebarTab, title: 'ページ',
                  icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>,
                },
                { id: 'theme' as SidebarTab, title: 'テーマ',
                  icon: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" /></svg>,
                },
              ]).map(({ id, title, icon }) => (
                <button key={id} onClick={() => setSidebarTab(id)} title={title}
                  className={cn('w-full flex items-center justify-center py-3 transition-colors border-l-2',
                    sidebarTab === id ? 'text-[#1ec8a5] border-[#1ec8a5] bg-slate-800' : 'text-slate-600 border-transparent hover:text-slate-400')}>
                  {icon}
                </button>
              ))}
            </div>

            {/* Panel content */}
            <div className={cn('flex-1 flex flex-col min-w-0 overflow-hidden', sidebarTab === 'components' ? 'bg-white' : 'bg-[#1e293b]')}>
              {sidebarTab === 'components' && <ElementPalette />}

              {sidebarTab === 'pages' && (
                <div className="flex flex-col h-full">
                  <div className="p-3 border-b border-slate-700">
                    <p className="text-slate-200 font-semibold text-xs uppercase tracking-widest">ページ一覧</p>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-0.5">
                    {project.pages.map((page) => (
                      <div key={page.id} className="relative"
                        onMouseEnter={() => setHoveredPageId(page.id)}
                        onMouseLeave={() => setHoveredPageId(null)}>
                        {editingPageId === page.id ? (
                          <input type="text" value={pageNameInput} autoFocus maxLength={50}
                            onChange={(e) => setPageNameInput(e.target.value)}
                            onBlur={handlePageRenameSubmit}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handlePageRenameSubmit();
                              if (e.key === 'Escape') { setEditingPageId(null); setPageNameInput(''); }
                            }}
                            className="w-full bg-slate-700 text-slate-200 text-xs px-3 py-2 rounded-lg border border-[#1ec8a5] outline-none" />
                        ) : (
                          <div className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-colors group/page',
                            selectedPageId === page.id
                              ? 'bg-[#1ec8a5]/15 text-[#1ec8a5] border border-[#1ec8a5]/20'
                              : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200')}>
                            <button onClick={() => selectPage(page.id)}
                              onDoubleClick={() => { setEditingPageId(page.id); setPageNameInput(page.name); }}
                              title="ダブルクリックでリネーム"
                              className="flex-1 text-left flex items-center gap-2 min-w-0">
                              <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="flex-1 truncate">{page.name}</span>
                              {page.pageType === 'modal' && (
                                <span className="text-[9px] font-bold bg-purple-500/20 text-purple-400 px-1 py-0.5 rounded leading-none shrink-0">M</span>
                              )}
                            </button>
                            {/* Settings gear icon — shows on hover */}
                            <button
                              onClick={(e) => { e.stopPropagation(); selectPage(page.id); setSidebarTab('theme'); }}
                              title="ページ設定"
                              className="opacity-0 group-hover/page:opacity-100 transition-opacity text-slate-500 hover:text-slate-300 shrink-0">
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                            </button>
                            {hoveredPageId === page.id && project.pages.length > 1 && (
                              <button onClick={(e) => { e.stopPropagation(); if (confirm(`「${page.name}」を削除しますか？`)) deletePage(page.id); }}
                                className="text-slate-600 hover:text-red-400 transition-colors shrink-0">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    <button onClick={() => addPage()}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors flex items-center gap-2">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      ページを追加
                    </button>
                    <button onClick={() => addPage(undefined, 'modal')}
                      className="w-full text-left px-3 py-2 rounded-lg text-xs text-purple-400 hover:text-purple-300 hover:bg-slate-700 transition-colors flex items-center gap-2">
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h8m-8 4h6M15 13v8m0 0l-3-3m3 3l3-3" />
                      </svg>
                      モーダルを追加
                    </button>
                  </div>
                </div>
              )}

              {sidebarTab === 'theme' && (
                <div className="flex flex-col h-full">
                  <div className="p-3 border-b border-slate-700">
                    <p className="text-slate-200 font-semibold text-xs uppercase tracking-widest">テーマカラー</p>
                  </div>
                  <div className="p-4 space-y-4">
                    <div>
                      <label className="prop-label mb-2">プライマリカラー</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={themeColor} onChange={(e) => setThemeColor(e.target.value)}
                          className="w-10 h-10 rounded-lg cursor-pointer border-0 bg-transparent" />
                        <input type="text" value={themeColor} onChange={(e) => setThemeColor(e.target.value)}
                          className="prop-input flex-1 font-mono text-xs" placeholder="#1ec8a5" />
                      </div>
                    </div>
                    <div>
                      <label className="prop-label mb-2">プリセット</label>
                      <div className="grid grid-cols-5 gap-1.5">
                        {['#1ec8a5','#2563eb','#7c3aed','#e11d48','#f59e0b','#0ea5e9','#10b981','#6366f1','#f97316','#0f172a'].map((c) => (
                          <button key={c} onClick={() => setThemeColor(c)}
                            className={cn('w-8 h-8 rounded-lg border-2 transition-transform hover:scale-110',
                              themeColor === c ? 'border-white' : 'border-transparent')}
                            style={{ backgroundColor: c }} title={c} />
                        ))}
                      </div>
                    </div>
                    <div>
                      <label className="prop-label mb-2">背景色</label>
                      <div className="grid grid-cols-4 gap-1.5">
                        {['#ffffff','#f8fafc','#f1f5f9','#0f172a','#111827','#fafafa'].map((c) => (
                          <button key={c} title={c}
                            className="h-8 rounded-lg border border-slate-600 hover:border-slate-400 transition-colors text-[9px] text-slate-400"
                            style={{ backgroundColor: c }}>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {mainMode === 'canvas' ? (
            <>
              {/* ── Canvas ── */}
              <Canvas viewMode={viewMode} />

              {/* ── Properties ── */}
              <PropertiesPanel />
            </>
          ) : (
            <div className="flex-1 overflow-hidden">
              <DatabasePanel />
            </div>
          )}
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeDragElement ? (
          <div className="bg-white rounded-xl p-3 shadow-2xl border-2 border-[#1ec8a5] max-w-xs opacity-90 pointer-events-none">
            <ElementRenderer element={activeDragElement} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
