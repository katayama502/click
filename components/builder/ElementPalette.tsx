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
      <rect x="3" y="8" width="18" height="8" rx="4" strokeWidth={2} />
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

function SpacerIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h8M8 18h8M12 6v12" />
    </svg>
  );
}

function InputIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="7" width="18" height="10" rx="2" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 12h2" />
    </svg>
  );
}

function TextareaIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="4" width="18" height="16" rx="2" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 9h10M7 13h7" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="3" y="6" width="14" height="14" rx="2" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 13l3 3 6-6" />
    </svg>
  );
}

function CardIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="2" y="4" width="20" height="16" rx="3" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 9h12M6 13h8" />
    </svg>
  );
}

function ListIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
    </svg>
  );
}

function NavIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="2" y="16" width="20" height="5" rx="2" strokeWidth={2} />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 19h2M11 19h2M16 19h2" />
    </svg>
  );
}

function ContainerIcon() {
  return (
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <rect x="2" y="4" width="20" height="16" rx="2" strokeWidth={2} strokeDasharray="4 2" />
    </svg>
  );
}

const BASIC_ELEMENTS: PaletteItemDef[] = [
  { type: 'heading', label: '見出し', icon: <HeadingIcon /> },
  { type: 'text', label: 'テキスト', icon: <TextIcon /> },
  { type: 'button', label: 'ボタン', icon: <ButtonIcon /> },
  { type: 'image', label: '画像', icon: <ImageIcon /> },
  { type: 'divider', label: '区切り線', icon: <DividerIcon /> },
  { type: 'spacer', label: 'スペース', icon: <SpacerIcon /> },
];

const FORM_ELEMENTS: PaletteItemDef[] = [
  { type: 'input', label: 'テキスト入力', icon: <InputIcon /> },
  { type: 'textarea', label: 'テキストエリア', icon: <TextareaIcon /> },
  { type: 'check', label: 'チェック', icon: <CheckIcon /> },
];

const LAYOUT_ELEMENTS: PaletteItemDef[] = [
  { type: 'card', label: 'カード', icon: <CardIcon /> },
  { type: 'list', label: 'リスト', icon: <ListIcon /> },
  { type: 'nav', label: 'ナビバー', icon: <NavIcon /> },
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
      <div className="w-8 h-8 rounded-md bg-slate-700 flex items-center justify-center text-green-300 flex-shrink-0">
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
    <div className="flex flex-col h-full">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-slate-200 font-semibold text-sm">コンポーネント</h2>
        <p className="text-slate-500 text-xs mt-0.5">ドラッグしてキャンバスに追加</p>
      </div>

      <div className="flex-1 overflow-y-auto py-2">
        <PaletteSection title="基本要素" items={BASIC_ELEMENTS} />
        <PaletteSection title="フォーム" items={FORM_ELEMENTS} />
        <PaletteSection title="レイアウト" items={LAYOUT_ELEMENTS} />
      </div>
    </div>
  );
}
