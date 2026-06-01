'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  DndContext,
  DragEndEvent,
  DragOverEvent,
  DragStartEvent,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  closestCenter,
} from '@dnd-kit/core';
import { v4 as uuidv4 } from 'uuid';
import { useBuilderStore } from '@/lib/store';
import { AppElement, ElementType } from '@/lib/types';
import { publishApp } from '@/lib/api';
import ElementPalette from '@/components/builder/ElementPalette';
import Canvas from '@/components/builder/Canvas';
import PropertiesPanel from '@/components/builder/PropertiesPanel';
import ElementRenderer from '@/components/builder/ElementRenderer';

type ViewMode = 'desktop' | 'tablet' | 'mobile';

function createDefaultElement(type: ElementType): AppElement {
  const id = uuidv4();
  switch (type) {
    case 'text':
      return { id, type, props: { text: 'テキストを入力してください', align: 'left' } };
    case 'heading':
      return { id, type, props: { text: '見出しを入力してください', align: 'left' } };
    case 'button':
      return { id, type, props: { text: 'ボタン', variant: 'primary', size: 'md' } };
    case 'image':
      return { id, type, props: { src: '', alt: '画像' } };
    case 'divider':
      return { id, type, props: {} };
    case 'input':
      return { id, type, props: { placeholder: 'テキストを入力...' } };
    case 'card':
      return { id, type, props: { text: 'カードタイトル' } };
    case 'container':
      return { id, type, props: { children: [] } };
    default:
      return { id, type, props: {} };
  }
}

export default function BuilderPage() {
  const router = useRouter();
  const {
    project,
    selectedPageId,
    isPreviewMode,
    initProject,
    addElement,
    reorderElements,
    addPage,
    selectPage,
    setPreviewMode,
    updateProjectName,
  } = useBuilderStore();

  const [viewMode, setViewMode] = useState<ViewMode>('desktop');
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeDragType, setActiveDragType] = useState<ElementType | null>(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    initProject();
  }, [initProject]);

  useEffect(() => {
    if (project?.name) {
      setNameInput(project.name);
    }
  }, [project?.name]);

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
  );

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);
    if (active.data.current?.isPalette) {
      setActiveDragType(active.data.current.type as ElementType);
    }
  }, []);

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Could handle cross-container drag here in the future
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveId(null);
      setActiveDragType(null);

      if (!over) return;

      const isFromPalette = active.data.current?.isPalette;
      const isCanvasDrop =
        over.id === 'canvas-drop-zone' || over.data.current?.isCanvas;

      if (isFromPalette && isCanvasDrop) {
        const elementType = active.data.current?.type as ElementType;
        if (!elementType) return;
        const newElement = createDefaultElement(elementType);
        addElement(newElement);
        return;
      }

      // Reordering existing canvas elements
      if (!isFromPalette && active.id !== over.id) {
        const currentPage = project?.pages.find((p) => p.id === selectedPageId);
        if (!currentPage) return;
        const elements = currentPage.elements;
        const fromIndex = elements.findIndex((el) => el.id === active.id);
        const toIndex = elements.findIndex((el) => el.id === over.id);
        if (fromIndex !== -1 && toIndex !== -1) {
          reorderElements(currentPage.id, fromIndex, toIndex);
        }
      }
    },
    [project, selectedPageId, addElement, reorderElements],
  );

  const handlePublish = async () => {
    if (!project) return;
    setIsPublishing(true);
    try {
      const data = await publishApp(project);
      window.open(`/published/${data.publishedId}`, '_blank');
    } catch (error) {
      console.error('Publish failed:', error);
      alert('公開に失敗しました。もう一度お試しください。');
    } finally {
      setIsPublishing(false);
    }
  };

  const handlePreview = () => {
    if (project) {
      window.open(`/preview/${project.id}`, '_blank');
    }
  };

  const handleNameSubmit = () => {
    if (nameInput.trim()) {
      updateProjectName(nameInput.trim());
    }
    setEditingName(false);
  };

  const activeDragElement = activeDragType ? createDefaultElement(activeDragType) : null;

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-900">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-slate-400 text-sm">読み込み中...</p>
        </div>
      </div>
    );
  }

  const currentPage = project.pages.find((p) => p.id === selectedPageId);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="builder-layout bg-slate-900">
        {/* Toolbar */}
        <header className="h-14 bg-slate-900 border-b border-slate-700 flex items-center px-4 gap-4 flex-shrink-0 z-10">
          {/* Left: Back + App name */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <button
              onClick={() => router.push('/')}
              className="flex items-center gap-1.5 text-slate-400 hover:text-slate-200 transition-colors text-sm shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              戻る
            </button>

            <div className="h-4 w-px bg-slate-700" />

            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shrink-0">
                <span className="text-white text-xs font-bold">C</span>
              </div>
              {editingName ? (
                <input
                  type="text"
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  onBlur={handleNameSubmit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleNameSubmit();
                    if (e.key === 'Escape') setEditingName(false);
                  }}
                  className="bg-slate-700 text-slate-200 text-sm font-semibold px-2 py-0.5 rounded border border-slate-500 outline-none focus:border-blue-500 min-w-0 w-48"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => setEditingName(true)}
                  className="text-slate-200 text-sm font-semibold hover:text-white transition-colors truncate"
                  title="クリックして名前を編集"
                >
                  {project.name}
                </button>
              )}
            </div>
          </div>

          {/* Center: View mode toggle */}
          <div className="flex items-center bg-slate-800 rounded-lg p-1 gap-0.5">
            {([
              { mode: 'desktop' as ViewMode, icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
                </svg>
              ), label: 'デスクトップ' },
              { mode: 'tablet' as ViewMode, icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              ), label: 'タブレット' },
              { mode: 'mobile' as ViewMode, icon: (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                </svg>
              ), label: 'モバイル' },
            ] as const).map(({ mode, icon, label }) => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                title={label}
                className={`p-1.5 rounded-md transition-colors ${
                  viewMode === mode
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2 flex-1 justify-end">
            <button
              onClick={handlePreview}
              className="flex items-center gap-1.5 text-sm font-medium text-slate-300 hover:text-white bg-slate-700 hover:bg-slate-600 px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              プレビュー
            </button>
            <button
              onClick={handlePublish}
              disabled={isPublishing}
              className="flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-wait px-4 py-1.5 rounded-lg transition-colors"
            >
              {isPublishing ? (
                <>
                  <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
                  公開中...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  公開する
                </>
              )}
            </button>
          </div>
        </header>

        {/* Main builder area */}
        <div className="builder-main">
          {/* Page tabs + Palette sidebar */}
          <div className="flex flex-col builder-sidebar">
            {/* Page tabs */}
            <div className="border-b border-slate-700 p-2">
              <div className="text-slate-500 text-xs font-semibold uppercase tracking-wider mb-2 px-1">
                ページ
              </div>
              <div className="space-y-0.5">
                {project.pages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => selectPage(page.id)}
                    className={`w-full text-left px-3 py-1.5 rounded-md text-sm transition-colors ${
                      selectedPageId === page.id
                        ? 'bg-blue-600/20 text-blue-300 border border-blue-500/30'
                        : 'text-slate-400 hover:bg-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span className="truncate">{page.name}</span>
                    </div>
                  </button>
                ))}
                <button
                  onClick={() => addPage()}
                  className="w-full text-left px-3 py-1.5 rounded-md text-sm text-slate-500 hover:text-slate-300 hover:bg-slate-700 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    ページを追加
                  </div>
                </button>
              </div>
            </div>

            {/* Component palette */}
            <div className="flex-1 overflow-y-auto">
              <ElementPalette />
            </div>
          </div>

          {/* Canvas */}
          <Canvas viewMode={viewMode} />

          {/* Properties panel */}
          <PropertiesPanel />
        </div>
      </div>

      {/* Drag overlay */}
      <DragOverlay>
        {activeDragElement ? (
          <div className="drag-overlay bg-white rounded-lg p-3 shadow-xl border border-blue-300 max-w-xs">
            <ElementRenderer element={activeDragElement} />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
