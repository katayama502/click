'use client';

import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { AppElement } from '@/lib/types';
import { useBuilderStore } from '@/lib/store';
import ElementRenderer from './ElementRenderer';
import { cn } from '@/lib/utils';

interface SortableElementProps {
  element: AppElement;
  isSelected: boolean;
  onSelect: (id: string) => void;
}

function SortableElement({ element, isSelected, onSelect }: SortableElementProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: element.id,
    data: { type: element.type, isCanvas: true },
  });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={cn('canvas-element group', isSelected && 'selected')}
      onClick={(e) => {
        e.stopPropagation();
        onSelect(element.id);
      }}
    >
      {/* Drag handle - visible on hover */}
      <div
        {...attributes}
        {...listeners}
        className="absolute left-0 top-0 bottom-0 w-4 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-grab z-10"
        onClick={(e) => e.stopPropagation()}
      >
        <svg className="w-3 h-3 text-blue-400" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 6a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4zM8 12a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4zM8 18a2 2 0 100-4 2 2 0 000 4zm8 0a2 2 0 100-4 2 2 0 000 4z" />
        </svg>
      </div>

      {/* Element type badge - visible when selected */}
      {isSelected && (
        <div className="absolute -top-5 left-0 bg-blue-600 text-white text-xs px-2 py-0.5 rounded-t-md z-20 font-medium">
          {element.type}
        </div>
      )}

      <div className="pl-4">
        <ElementRenderer element={element} />
      </div>
    </div>
  );
}

interface CanvasProps {
  viewMode: 'desktop' | 'tablet' | 'mobile';
}

const VIEW_WIDTHS = {
  desktop: '100%',
  tablet: '768px',
  mobile: '390px',
};

export default function Canvas({ viewMode }: CanvasProps) {
  const { project, selectedPageId, selectedElementId, selectElement, removeElement } =
    useBuilderStore();

  const currentPage = project?.pages.find((p) => p.id === selectedPageId);
  const elements = currentPage?.elements ?? [];
  const elementIds = elements.map((el) => el.id);

  const { setNodeRef, isOver } = useDroppable({
    id: 'canvas-drop-zone',
    data: { isCanvas: true },
  });

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Delete' || e.key === 'Backspace') && selectedElementId) {
      removeElement(selectedElementId);
    }
    if (e.key === 'Escape') {
      selectElement(null);
    }
  };

  const canvasWidth = VIEW_WIDTHS[viewMode];

  return (
    <div className="builder-canvas-area" tabIndex={0} onKeyDown={handleKeyDown}>
      <div
        style={{
          width: canvasWidth,
          maxWidth: canvasWidth,
          minHeight: '600px',
          transition: 'width 0.3s ease',
        }}
        className="bg-white rounded-lg shadow-md overflow-hidden"
        onClick={() => selectElement(null)}
      >
        {/* Page header bar */}
        <div className="h-8 bg-gray-50 border-b border-gray-200 flex items-center px-4 gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
          <div className="flex-1 ml-2 bg-gray-200 rounded-sm h-4 text-gray-500 text-xs flex items-center px-2">
            {currentPage?.name || 'ページ'}
          </div>
        </div>

        {/* Drop zone */}
        <SortableContext items={elementIds} strategy={verticalListSortingStrategy}>
          <div
            ref={setNodeRef}
            className={cn(
              'min-h-[560px] p-4 space-y-2',
              isOver && 'drop-zone-active',
            )}
            style={{ backgroundColor: currentPage?.backgroundColor || '#ffffff' }}
          >
            {elements.length === 0 ? (
              isOver ? (
                <div className="flex flex-col items-center justify-center h-96 border-2 border-dashed border-blue-500 bg-blue-50 rounded-xl transition-colors">
                  <svg className="w-12 h-12 mb-3 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v16m8-8H4" />
                  </svg>
                  <p className="text-sm font-medium text-blue-600">ここにドロップ</p>
                </div>
              ) : (
                /* Empty state: login form mockup */
                <div className="h-full bg-white flex flex-col">
                  {/* Status bar */}
                  <div className="flex justify-between items-center px-4 pt-3 pb-2">
                    <span className="text-[11px] font-semibold text-gray-900">9:41</span>
                    <div className="flex gap-1 items-center">
                      <div className="w-4 h-2.5 rounded-sm border border-gray-900 relative">
                        <div className="absolute inset-[1px] right-[2px] bg-gray-900 rounded-[1px]" />
                        <div className="absolute right-[-3px] top-1/2 -translate-y-1/2 w-[2px] h-1.5 bg-gray-900 rounded-r-full" />
                      </div>
                    </div>
                  </div>
                  {/* Content */}
                  <div className="flex-1 px-6 pt-8 pb-6 flex flex-col">
                    <div className="mb-8">
                      <h1 className="text-2xl font-bold text-gray-900 mb-1">ログイン</h1>
                      <p className="text-sm text-gray-500">アカウントにサインインしてください</p>
                    </div>
                    <div className="space-y-4 flex-1">
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1.5 block">メールアドレス</label>
                        <div className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-3 flex items-center">
                          <span className="text-sm text-gray-400">example@email.com</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-xs font-medium text-gray-700 mb-1.5 block">パスワード</label>
                        <div className="w-full h-11 bg-gray-50 border border-gray-200 rounded-xl px-3 flex items-center justify-between">
                          <span className="text-sm text-gray-400">••••••••</span>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0zM2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex justify-end">
                        <span className="text-xs text-blue-600 font-medium">パスワードを忘れた？</span>
                      </div>
                    </div>
                    <div className="space-y-3 mt-4">
                      <button className="w-full h-12 bg-blue-600 rounded-xl text-white text-sm font-semibold">
                        ログイン
                      </button>
                      <p className="text-center text-xs text-gray-500">
                        アカウントをお持ちでない方は <span className="text-blue-600 font-medium">新規登録</span>
                      </p>
                    </div>
                  </div>
                </div>
              )
            ) : (
              elements.map((element) => (
                <SortableElement
                  key={element.id}
                  element={element}
                  isSelected={selectedElementId === element.id}
                  onSelect={selectElement}
                />
              ))
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}
