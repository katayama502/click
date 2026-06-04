'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AppElement, AppPage } from '@/lib/types';
import { useBuilderStore } from '@/lib/store';
import ElementRenderer from './ElementRenderer';
import { cn } from '@/lib/utils';

/* ─── Layout constants ─── */
const CARD_W = 320;
const CARD_H = 580;
const CARD_STATUS_H = 0;
const CARD_CONTENT_H = CARD_H;
const CARD_GAP = 110;
const PAD = 56;
const LABEL_H = 26;

/* ─── Zoom step constants ─── */
const ZOOM_STEPS = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 1.75, 2.0];
const ZOOM_DEFAULT = 1.0;

function snapZoom(z: number, direction: 'in' | 'out'): number {
  if (direction === 'in') {
    const next = ZOOM_STEPS.find((s) => s > z + 0.001);
    return next ?? ZOOM_STEPS[ZOOM_STEPS.length - 1];
  } else {
    const prev = [...ZOOM_STEPS].reverse().find((s) => s < z - 0.001);
    return prev ?? ZOOM_STEPS[0];
  }
}

/* ─── Element height estimator (for arrow y-pos) ─── */
function elHeight(type: string): number {
  switch (type) {
    case 'image': return 150;
    case 'video': return 200;
    case 'textarea': return 80;
    case 'heading': return 50;
    case 'list': return 120;
    case 'table': return 150;
    case 'carousel': return 180;
    case 'divider': return 20;
    case 'spacer': return 30;
    case 'card': return 100;
    default: return 52;
  }
}

/* ─── Collect page link connections ─── */
interface Conn {
  srcIdx: number;
  dstIdx: number;
  srcY: number;
}
function getConnections(pages: AppPage[]): Conn[] {
  const idxMap: Record<string, number> = {};
  pages.forEach((p, i) => { idxMap[p.id] = i; });

  const conns: Conn[] = [];
  pages.forEach((page, pi) => {
    let y = 16;
    page.elements.forEach((el) => {
      const h = elHeight(el.type);
      const lid = (el.props as Record<string, unknown>).pageLinkId as string | undefined;
      if (lid && idxMap[lid] !== undefined) {
        conns.push({ srcIdx: pi, dstIdx: idxMap[lid], srcY: y + h / 2 });
      }
      y += h + 8;
    });
  });
  return conns;
}

/* ─── SVG arrows ─── */
function Arrows({ pages }: { pages: AppPage[] }) {
  const conns = getConnections(pages);
  if (conns.length === 0) return null;
  const W = PAD * 2 + pages.length * (CARD_W + CARD_GAP);
  const H = PAD * 2 + LABEL_H + CARD_H + 60;
  return (
    <svg
      style={{ position: 'absolute', inset: 0, width: W, height: H, pointerEvents: 'none', overflow: 'visible' }}
    >
      <defs>
        <marker id="ah" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
          <path d="M0,0 L0,6 L6,3 z" fill="#94a3b8" />
        </marker>
      </defs>
      {conns.map((c, i) => {
        const sx = PAD + c.srcIdx * (CARD_W + CARD_GAP) + CARD_W;
        const sy = PAD + LABEL_H + c.srcY;
        const dx = PAD + c.dstIdx * (CARD_W + CARD_GAP);
        const dy = PAD + LABEL_H + CARD_H / 2;
        const ctrl = Math.abs(sx - dx) * 0.45 + 30;
        const d = `M${sx},${sy} C${sx + ctrl},${sy} ${dx - ctrl},${dy} ${dx},${dy}`;
        return (
          <path key={i} d={d} fill="none" stroke="#94a3b8" strokeWidth="1.5" markerEnd="url(#ah)" strokeLinecap="round" />
        );
      })}
    </svg>
  );
}

/* ─── Sortable element wrapper ─── */
function SortableEl({
  element, isSelected, onSelect, onDelete, onMoveUp, onMoveDown,
  canMoveUp, canMoveDown,
}: {
  element: AppElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onMoveUp: (id: string) => void;
  onMoveDown: (id: string) => void;
  canMoveUp: boolean;
  canMoveDown: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: element.id,
    data: { type: element.type, isCanvas: true },
  });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
      className={cn(
        'canvas-element group relative',
        isSelected
          ? 'ring-2 ring-[#1ec8a5] ring-offset-1 rounded'
          : '',
      )}
      onClick={(e) => { e.stopPropagation(); onSelect(element.id); }}
    >
      {/* Drag handle */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-0 bottom-0 w-4 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-grab z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 6a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4zM8 12a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4zM8 18a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
      </div>

      {/* Selected: label + layer controls + delete button */}
      {isSelected && (
        <div className="absolute -top-6 left-0 right-0 flex items-center gap-1 z-20 pointer-events-none">
          {/* Element type label */}
          <span className="bg-[#1ec8a5] text-white text-[10px] px-2 py-0.5 rounded-t font-medium pointer-events-none">
            {element.type}
          </span>
          {/* Layer: move up (前面へ) */}
          <button
            className={cn(
              'pointer-events-auto text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors',
              canMoveUp
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed',
            )}
            disabled={!canMoveUp}
            onClick={(e) => { e.stopPropagation(); onMoveUp(element.id); }}
            title="前面へ"
          >
            ↑ 前面へ
          </button>
          {/* Layer: move down (背面へ) */}
          <button
            className={cn(
              'pointer-events-auto text-[10px] px-1.5 py-0.5 rounded font-medium transition-colors',
              canMoveDown
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600'
                : 'bg-slate-800 text-slate-600 cursor-not-allowed',
            )}
            disabled={!canMoveDown}
            onClick={(e) => { e.stopPropagation(); onMoveDown(element.id); }}
            title="背面へ"
          >
            ↓ 背面へ
          </button>
          {/* Spacer */}
          <div className="flex-1" />
          {/* Delete button — top-right */}
          <button
            className="pointer-events-auto w-5 h-5 flex items-center justify-center rounded bg-red-500 hover:bg-red-600 text-white text-[11px] font-bold transition-colors"
            onClick={(e) => { e.stopPropagation(); onDelete(element.id); }}
            title="削除"
          >
            ×
          </button>
        </div>
      )}

      <div className="pl-4">
        <ElementRenderer element={element} />
      </div>
    </div>
  );
}

/* ─── Single page card ─── */
function PageCard({
  page, index, isSelected, selectedElementId, pageCount,
  onSelect, onSelectElement, onClickBg, onDelete, onRename,
  onDeleteElement, onMoveElementUp, onMoveElementDown,
}: {
  page: AppPage; index: number; isSelected: boolean;
  selectedElementId: string | null; pageCount: number;
  onSelect: () => void; onSelectElement: (id: string) => void; onClickBg: () => void;
  onDelete: () => void; onRename: (name: string) => void;
  onDeleteElement: (id: string) => void;
  onMoveElementUp: (id: string) => void;
  onMoveElementDown: (id: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: isSelected ? 'canvas-drop-zone' : `page-prev-${page.id}`,
    data: { isCanvas: true, pageId: page.id },
    disabled: !isSelected,
  });
  const [hovered, setHovered] = useState(false);
  const [editingLabel, setEditingLabel] = useState(false);
  const [labelInput, setLabelInput] = useState(page.name);

  const commitRename = () => {
    setEditingLabel(false);
    const trimmed = labelInput.trim();
    if (trimmed && trimmed !== page.name) onRename(trimmed);
    else setLabelInput(page.name);
  };

  /* Find index of selected element for layer controls */
  const selectedIdx = selectedElementId
    ? page.elements.findIndex((e) => e.id === selectedElementId)
    : -1;

  return (
    <div
      style={{ position: 'absolute', left: PAD + index * (CARD_W + CARD_GAP), top: PAD, width: CARD_W }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Page title bar above phone frame */}
      <div className="flex items-center gap-1.5 mb-2 h-6">
        {editingLabel ? (
          <input
            autoFocus
            value={labelInput}
            onChange={(e) => setLabelInput(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename();
              if (e.key === 'Escape') { setEditingLabel(false); setLabelInput(page.name); }
            }}
            onClick={(e) => e.stopPropagation()}
            className="text-xs font-medium bg-white border border-blue-400 rounded px-1.5 py-0.5 outline-none text-gray-800 w-36"
          />
        ) : (
          <span
            className={cn('text-xs font-medium cursor-default select-none', isSelected ? 'text-gray-800' : 'text-gray-500')}
            title="ダブルクリックでリネーム"
            onDoubleClick={(e) => { e.stopPropagation(); setEditingLabel(true); setLabelInput(page.name); }}
          >
            {page.name}
          </span>
        )}
        {page.pageType === 'modal' && (
          <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 py-0.5 rounded font-medium">モーダル</span>
        )}
        {isSelected && !editingLabel && (
          <span className="text-[10px] bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded font-medium">編集中</span>
        )}
        {hovered && pageCount > 1 && !editingLabel && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (confirm(`「${page.name}」を削除しますか？`)) onDelete();
            }}
            className="ml-auto w-5 h-5 flex items-center justify-center rounded hover:bg-red-100 text-gray-400 hover:text-red-500 transition-colors"
            title="ページを削除"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        )}
      </div>

      {/* Card */}
      <div
        onClick={isSelected ? onClickBg : onSelect}
        className={cn(
          'rounded-xl overflow-hidden transition-all duration-200',
          isSelected
            ? 'border-2 border-blue-500 shadow-[0_4px_24px_rgba(59,130,246,0.18)] shadow-xl'
            : 'border border-gray-200 hover:border-gray-300 hover:shadow-lg cursor-pointer shadow-md',
        )}
        style={{ height: CARD_H, backgroundColor: page.backgroundColor || '#fff' }}
      >
        {isSelected ? (
          <SortableContext items={page.elements.map(e => e.id)} strategy={verticalListSortingStrategy}>
            <div
              ref={setNodeRef}
              className={cn('overflow-y-auto p-3 space-y-2', isOver && 'drop-zone-active')}
              style={{ height: CARD_H, backgroundColor: page.backgroundColor || '#fff' }}
            >
              {page.elements.length === 0 ? (
                /* ── Empty state ── */
                <div className={cn(
                  'flex flex-col items-center justify-center rounded-lg border-2 border-dashed m-4 transition-colors',
                  isOver ? 'border-[#1ec8a5] bg-[#f0fdf9] text-[#1ec8a5]' : 'border-gray-200',
                )} style={{ height: CARD_H - 32 }}>
                  <span style={{ fontSize: '2rem', lineHeight: 1 }} className="mb-3">📱</span>
                  <p className="text-sm font-medium text-gray-400 mb-1">ここにエレメントをドロップ</p>
                  <p className="text-xs text-gray-300">左パネルからエレメントを選択してください</p>
                </div>
              ) : (
                page.elements.map((el, elIdx) => (
                  <SortableEl
                    key={el.id}
                    element={el}
                    isSelected={selectedElementId === el.id}
                    onSelect={onSelectElement}
                    onDelete={onDeleteElement}
                    onMoveUp={onMoveElementUp}
                    onMoveDown={onMoveElementDown}
                    canMoveUp={elIdx > 0}
                    canMoveDown={elIdx < page.elements.length - 1}
                  />
                ))
              )}
            </div>
          </SortableContext>
        ) : (
          /* Static preview for non-selected pages */
          <div className="overflow-hidden pointer-events-none" style={{ height: CARD_H }}>
            <div className="p-3 space-y-2">
              {page.elements.map((el) => (
                <div key={el.id} style={{ transform: 'scale(0.92)', transformOrigin: 'top left' }}>
                  <ElementRenderer element={el} isPreview={false} />
                </div>
              ))}
              {page.elements.length === 0 && (
                <div className="flex flex-col items-center justify-center text-gray-200 text-xs mt-16">
                  <svg className="w-8 h-8 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  空のページ
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Main Canvas ─── */
interface CanvasProps {
  viewMode: 'desktop' | 'tablet' | 'mobile';
}

export default function Canvas({ viewMode: _viewMode }: CanvasProps) {
  const {
    project, selectedPageId, selectedElementId,
    selectElement, removeElement, selectPage, addPage, deletePage, renamePage,
    reorderElements,
  } = useBuilderStore();

  const [zoom, setZoom] = useState(ZOOM_DEFAULT);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panning, setPanning] = useState(false);
  const dragOrigin = useRef({ mx: 0, my: 0, px: 0, py: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const pages = project?.pages ?? [];

  /* Keyboard shortcuts */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    const tgt = e.target as HTMLElement;
    if (tgt.tagName === 'INPUT' || tgt.tagName === 'TEXTAREA') return;
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
      e.preventDefault();
      removeElement(selectedElementId);
    }
    if (e.key === 'Escape') selectElement(null);
  };

  /* Wheel zoom (no page scroll) */
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setZoom((z) => {
      const next = z - e.deltaY * 0.0008;
      return Math.min(ZOOM_STEPS[ZOOM_STEPS.length - 1], Math.max(ZOOM_STEPS[0], next));
    });
  }, []);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  /* Pan on background drag */
  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.canvas-element, button, input, select, textarea')) return;
    setPanning(true);
    dragOrigin.current = { mx: e.clientX, my: e.clientY, px: pan.x, py: pan.y };
  };
  const onMouseMove = (e: React.MouseEvent) => {
    if (!panning) return;
    setPan({
      x: dragOrigin.current.px + (e.clientX - dragOrigin.current.mx),
      y: dragOrigin.current.py + (e.clientY - dragOrigin.current.my),
    });
  };
  const onMouseUp = () => setPanning(false);

  /* Layer reorder helpers */
  const handleMoveElementUp = useCallback((elementId: string) => {
    const page = pages.find((p) => p.id === selectedPageId);
    if (!page) return;
    const idx = page.elements.findIndex((e) => e.id === elementId);
    if (idx > 0) reorderElements(page.id, idx, idx - 1);
  }, [pages, selectedPageId, reorderElements]);

  const handleMoveElementDown = useCallback((elementId: string) => {
    const page = pages.find((p) => p.id === selectedPageId);
    if (!page) return;
    const idx = page.elements.findIndex((e) => e.id === elementId);
    if (idx < page.elements.length - 1) reorderElements(page.id, idx, idx + 1);
  }, [pages, selectedPageId, reorderElements]);

  /* Canvas dimensions */
  const contentW = PAD * 2 + (pages.length + 1) * (CARD_W + CARD_GAP);
  const contentH = PAD * 2 + LABEL_H + CARD_H + 60;

  const zoomPct = Math.round(zoom * 100);
  const canZoomOut = zoom > ZOOM_STEPS[0] + 0.001;
  const canZoomIn = zoom < ZOOM_STEPS[ZOOM_STEPS.length - 1] - 0.001;

  return (
    <div
      ref={containerRef}
      className="flex-1 relative overflow-hidden"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={onMouseUp}
      onMouseLeave={onMouseUp}
      style={{ background: '#f4f5f7', cursor: panning ? 'grabbing' : 'default', userSelect: 'none' }}
    >
      {/* Dot grid background */}
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <defs>
          <pattern id="dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="1" fill="#c9ced6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>

      {/* Zoomable + pannable layer */}
      <div
        style={{
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'top left',
          position: 'absolute',
          top: 0,
          left: 0,
          width: contentW,
          height: contentH,
        }}
      >
        <Arrows pages={pages} />
        {pages.map((page, i) => (
          <PageCard
            key={page.id}
            page={page}
            index={i}
            isSelected={selectedPageId === page.id}
            selectedElementId={selectedElementId}
            pageCount={pages.length}
            onSelect={() => { selectPage(page.id); selectElement(null); }}
            onSelectElement={selectElement}
            onClickBg={() => selectElement(null)}
            onDelete={() => deletePage(page.id)}
            onRename={(name) => renamePage(page.id, name)}
            onDeleteElement={(id) => removeElement(id)}
            onMoveElementUp={handleMoveElementUp}
            onMoveElementDown={handleMoveElementDown}
          />
        ))}

        {/* Add page placeholder card */}
        <div
          style={{
            position: 'absolute',
            left: PAD + pages.length * (CARD_W + CARD_GAP),
            top: PAD,
            width: CARD_W,
          }}
        >
          <div className="h-6 mb-2" />
          <button
            onClick={() => addPage()}
            className="w-full rounded-xl border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 transition-all group flex flex-col items-center justify-center gap-3 cursor-pointer"
            style={{ height: CARD_H }}
          >
            <div className="w-10 h-10 rounded-full border-2 border-dashed border-gray-300 group-hover:border-blue-400 flex items-center justify-center transition-colors">
              <svg className="w-5 h-5 text-gray-300 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-xs font-medium text-gray-400 group-hover:text-blue-500 transition-colors">ページを追加</span>
          </button>
        </div>
      </div>

      {/* ── Zoom controls — bottom-left ── */}
      <div className="absolute bottom-4 left-4 flex items-center gap-1 bg-slate-800 rounded-lg shadow-lg px-2 py-1.5 z-10">
        <button
          onClick={() => setZoom((z) => snapZoom(z, 'out'))}
          disabled={!canZoomOut}
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded text-sm font-bold transition-colors',
            canZoomOut
              ? 'text-slate-300 hover:bg-slate-700 hover:text-white'
              : 'text-slate-600 cursor-not-allowed',
          )}
          title="ズームアウト"
        >
          −
        </button>
        <button
          onClick={() => { setZoom(ZOOM_DEFAULT); setPan({ x: 0, y: 0 }); }}
          className="w-12 h-7 flex items-center justify-center rounded text-[11px] font-mono text-slate-300 hover:bg-slate-700 hover:text-white transition-colors tabular-nums"
          title="ズームリセット (100%)"
        >
          {zoomPct}%
        </button>
        <button
          onClick={() => setZoom((z) => snapZoom(z, 'in'))}
          disabled={!canZoomIn}
          className={cn(
            'w-7 h-7 flex items-center justify-center rounded text-sm font-bold transition-colors',
            canZoomIn
              ? 'text-slate-300 hover:bg-slate-700 hover:text-white'
              : 'text-slate-600 cursor-not-allowed',
          )}
          title="ズームイン"
        >
          +
        </button>
      </div>

      {/* ── Center toolbar (reset / info) ── */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-0.5 bg-white rounded-xl shadow-lg border border-gray-200 px-2 py-1.5 z-10">
        <button
          onClick={() => { setZoom(ZOOM_DEFAULT); setPan({ x: 0, y: 0 }); }}
          className="w-8 h-8 flex items-center justify-center text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
          title="リセット"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>
        <div className="w-px h-5 bg-gray-200 mx-1" />
        <span className="text-[11px] text-gray-500 font-mono w-10 text-center tabular-nums">
          {zoomPct}%
        </span>
      </div>
    </div>
  );
}
