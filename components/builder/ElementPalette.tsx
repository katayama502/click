'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { ElementType } from '@/lib/types';

interface PaletteItemDef {
  type: ElementType;
  label: string;
  icon: React.ReactNode;
}

function TextIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
    </svg>
  );
}

function HeadingIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
    </svg>
  );
}

function ButtonIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5" />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );
}

function DividerIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
    </svg>
  );
}

function InputIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
    </svg>
  );
}

function ContainerIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
    </svg>
  );
}

const BASIC_ELEMENTS: PaletteItemDef[] = [
  { type: 'text', label: 'テキスト', icon: <TextIcon /> },
  { type: 'heading', label: '見出し', icon: <HeadingIcon /> },
  { type: 'button', label: 'ボタン', icon: <ButtonIcon /> },
  { type: 'image', label: '画像', icon: <ImageIcon /> },
  { type: 'divider', label: '区切り線', icon: <DividerIcon /> },
];

const FORM_ELEMENTS: PaletteItemDef[] = [
  { type: 'input', label: 'テキスト入力', icon: <InputIcon /> },
];

const LAYOUT_ELEMENTS: PaletteItemDef[] = [
  { type: 'card', label: 'カード', icon: <CardIcon /> },
  { type: 'container', label: 'コンテナ', icon: <ContainerIcon /> },
];

interface DraggablePaletteItemProps {
  item: PaletteItemDef;
}

function DraggablePaletteItem({ item }: DraggablePaletteItemProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${item.type}`,
    data: {
      type: item.type,
      isPalette: true,
    },
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 999 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className="palette-item select-none"
    >
      <div className="w-8 h-8 rounded-md bg-slate-700 flex items-center justify-center text-blue-300 flex-shrink-0">
        {item.icon}
      </div>
      <span className="text-slate-300 text-sm font-medium">{item.label}</span>
    </div>
  );
}

interface SectionProps {
  title: string;
  items: PaletteItemDef[];
}

function PaletteSection({ title, items }: SectionProps) {
  return (
    <div className="mb-2">
      <div className="section-label">{title}</div>
      <div className="space-y-0.5 px-2">
        {items.map((item) => (
          <DraggablePaletteItem key={item.type} item={item} />
        ))}
      </div>
    </div>
  );
}

export default function ElementPalette() {
  return (
    <aside className="builder-sidebar flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-slate-200 font-semibold text-sm">コンポーネント</h2>
        <p className="text-slate-500 text-xs mt-0.5">ドラッグしてキャンバスに追加</p>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <PaletteSection title="基本要素" items={BASIC_ELEMENTS} />
        <PaletteSection title="フォーム" items={FORM_ELEMENTS} />
        <PaletteSection title="レイアウト" items={LAYOUT_ELEMENTS} />
      </div>
    </aside>
  );
}
