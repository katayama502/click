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
              <div
                className={cn(
                  'flex flex-col items-center justify-center h-96 border-2 border-dashed rounded-xl transition-colors',
                  isOver
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 text-gray-400',
                )}
              >
                <svg
                  className={cn('w-12 h-12 mb-3', isOver ? 'text-blue-400' : 'text-gray-300')}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                <p className={cn('text-sm font-medium', isOver ? 'text-blue-600' : 'text-gray-400')}>
                  {isOver ? 'ここにドロップ' : 'ここにコンポーネントをドロップ'}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  左のパネルから要素をドラッグしてください
                </p>
              </div>
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
