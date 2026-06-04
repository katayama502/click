'use client';

import React, { useRef, useCallback } from 'react';
import { cn } from '@/lib/utils';
import type { Element } from '@/lib/types';

interface CanvasElementProps {
  element: Element;
  isSelected: boolean;
  onSelect: () => void;
  onUpdate: (updates: Partial<Element>) => void;
  onDelete: () => void;
  scale: number;
}

function ElementContent({ element }: { element: Element }) {
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
          className="w-full h-full flex items-center justify-center rounded cursor-pointer select-none"
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
          className="w-full h-full flex items-center justify-center rounded cursor-pointer select-none border"
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
    case 'password-input':
    case 'date-input':
      return (
        <div
          className="w-full h-full flex items-center px-3 border"
          style={{
            backgroundColor: s.backgroundColor ?? '#ffffff',
            borderColor: '#d1d5db',
            borderRadius: s.borderRadius ?? 8,
            fontSize: s.fontSize ?? 14,
            color: '#9ca3af',
          }}
        >
          {element.placeholder ?? (element.type === 'date-input' ? '日付を選択' : 'テキストを入力')}
        </div>
      );

    case 'shape':
      return (
        <div
          className="w-full h-full"
          style={{
            backgroundColor: s.backgroundColor ?? '#e5e7eb',
            borderRadius: s.borderRadius ?? 8,
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
              <div key={i} className={cn('w-1.5 h-1.5 rounded-full', i === 0 ? 'bg-brand' : 'bg-gray-300')} />
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
              <div key={i} className={cn(
                'text-[9px] text-center rounded py-0.5',
                i + 1 === 15 ? 'bg-brand text-white' : 'text-gray-600 hover:bg-gray-100',
              )}>
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
              <div className="h-8 border border-gray-200 rounded px-2 flex items-center text-xs text-gray-400 bg-white">
                入力してください
              </div>
            </div>
          ))}
          <div className="h-8 bg-brand rounded flex items-center justify-center text-xs text-white font-medium">
            送信
          </div>
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
          className="w-full h-full flex items-center justify-between px-3 border"
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
          <span className="text-sm text-gray-400">{element.placeholder ?? '検索...'}</span>
        </div>
      );

    case 'switch-element':
      return (
        <div className="w-full h-full flex items-center justify-between px-2">
          <span className="text-sm text-gray-700">{element.label ?? 'スイッチ'}</span>
          <div className="w-10 h-6 bg-brand rounded-full flex items-center px-0.5">
            <div className="w-5 h-5 bg-white rounded-full shadow ml-auto" />
          </div>
        </div>
      );

    case 'toggle-element':
      return (
        <div className="w-full h-full flex items-center justify-between px-2">
          <span className="text-sm text-gray-700">{element.label ?? 'トグル'}</span>
          <div className="w-8 h-8 border-2 border-brand rounded flex items-center justify-center">
            <div className="w-4 h-4 bg-brand rounded-sm" />
          </div>
        </div>
      );

    case 'file-input':
      return (
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-1 border-2 border-dashed"
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

export default function CanvasElement({
  element,
  isSelected,
  onSelect,
  onUpdate,
  onDelete,
  scale,
}: CanvasElementProps) {
  const s = element.style;
  const isDragging = useRef(false);
  const dragStart = useRef<{ mouseX: number; mouseY: number; elemX: number; elemY: number } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onSelect();

      if (element.locked) return;

      isDragging.current = false;
      dragStart.current = {
        mouseX: e.clientX,
        mouseY: e.clientY,
        elemX: s.x ?? 0,
        elemY: s.y ?? 0,
      };

      const handleMouseMove = (ev: MouseEvent) => {
        if (!dragStart.current) return;
        const dx = (ev.clientX - dragStart.current.mouseX) / scale;
        const dy = (ev.clientY - dragStart.current.mouseY) / scale;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) isDragging.current = true;
        if (isDragging.current) {
          onUpdate({
            style: {
              ...element.style,
              x: Math.round(dragStart.current.elemX + dx),
              y: Math.round(dragStart.current.elemY + dy),
            },
          });
        }
      };

      const handleMouseUp = () => {
        dragStart.current = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
      };

      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    },
    [element, onSelect, onUpdate, s.x, s.y, scale],
  );

  const width = typeof s.width === 'number' ? s.width : s.width ?? 'auto';
  const height = typeof s.height === 'number' ? s.height : s.height ?? 'auto';

  const posStyle: React.CSSProperties = {
    position: 'absolute',
    left: s.x ?? 0,
    top: s.y ?? 0,
    width: width,
    height: height,
    opacity: s.opacity !== undefined ? s.opacity / 100 : 1,
    zIndex: s.zIndex ?? 1,
  };

  return (
    <div
      style={posStyle}
      onMouseDown={handleMouseDown}
      className={cn(
        'group cursor-move select-none',
        isSelected && 'ring-2 ring-blue-500 ring-offset-0',
        element.locked && 'cursor-not-allowed',
      )}
    >
      {/* Element content */}
      <ElementContent element={element} />

      {/* Selection handles */}
      {isSelected && (
        <>
          {/* Resize handles — corners */}
          {(['nw', 'ne', 'sw', 'se'] as const).map(corner => (
            <ResizeHandle key={corner} corner={corner} element={element} onUpdate={onUpdate} scale={scale} />
          ))}

          {/* Delete button */}
          <button
            onMouseDown={e => {
              e.stopPropagation();
              onDelete();
            }}
            className="absolute -top-2.5 -right-2.5 w-5 h-5 bg-red-500 text-white rounded-full flex items-center justify-center z-50 hover:bg-red-600 shadow"
            style={{ fontSize: 12, lineHeight: 1 }}
          >
            ×
          </button>
        </>
      )}
    </div>
  );
}

// Resize handle sub-component
type Corner = 'nw' | 'ne' | 'sw' | 'se';

function ResizeHandle({
  corner,
  element,
  onUpdate,
  scale,
}: {
  corner: Corner;
  element: Element;
  onUpdate: (u: Partial<Element>) => void;
  scale: number;
}) {
  const posClass: Record<Corner, string> = {
    nw: '-top-1.5 -left-1.5',
    ne: '-top-1.5 -right-1.5',
    sw: '-bottom-1.5 -left-1.5',
    se: '-bottom-1.5 -right-1.5',
  };
  const cursorClass: Record<Corner, string> = {
    nw: 'cursor-nw-resize',
    ne: 'cursor-ne-resize',
    sw: 'cursor-sw-resize',
    se: 'cursor-se-resize',
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = typeof element.style.width === 'number' ? element.style.width : 100;
    const startH = typeof element.style.height === 'number' ? element.style.height : 40;
    const startElemX = element.style.x ?? 0;
    const startElemY = element.style.y ?? 0;

    const handleMove = (ev: MouseEvent) => {
      const dx = (ev.clientX - startX) / scale;
      const dy = (ev.clientY - startY) / scale;

      let newW = startW;
      let newH = startH;
      let newX = startElemX;
      let newY = startElemY;

      if (corner === 'se') { newW = Math.max(20, startW + dx); newH = Math.max(20, startH + dy); }
      if (corner === 'sw') { newW = Math.max(20, startW - dx); newH = Math.max(20, startH + dy); newX = startElemX + (startW - newW); }
      if (corner === 'ne') { newW = Math.max(20, startW + dx); newH = Math.max(20, startH - dy); newY = startElemY + (startH - newH); }
      if (corner === 'nw') { newW = Math.max(20, startW - dx); newH = Math.max(20, startH - dy); newX = startElemX + (startW - newW); newY = startElemY + (startH - newH); }

      onUpdate({ style: { ...element.style, width: Math.round(newW), height: Math.round(newH), x: Math.round(newX), y: Math.round(newY) } });
    };

    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
  };

  return (
    <div
      onMouseDown={handleMouseDown}
      className={cn(
        'absolute w-3 h-3 bg-white border-2 border-blue-500 rounded-sm z-50',
        posClass[corner],
        cursorClass[corner],
      )}
    />
  );
}
