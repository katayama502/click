'use client';

import { useState, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  Search, Plus, Type, Square, Minus, Smile, Image, Video,
  MousePointerClick, PlusCircle, ToggleLeft, CheckSquare,
  PanelTop, PanelBottom, LayoutList, TextCursor, Lock,
  CalendarDays, Paperclip, Camera, ScanBarcode, ClipboardList,
  PlusSquare, FileText, CreditCard, Sliders, Rows3, Tags,
  UserCircle, GalleryHorizontal, Layers, Calendar, ChevronDown,
  Barcode, QrCode, Table2, Youtube, X,
} from 'lucide-react';
import { ElementType } from '@/lib/types';
import { cn } from '@/lib/utils';

/* ─── Item definition ─── */
interface PaletteItemDef {
  id: string;
  type: ElementType;
  label: string;
  icon: React.ReactNode;
}

/* ─── Section definition ─── */
interface SectionDef {
  label: string;
  items: PaletteItemDef[];
  empty?: boolean;
  emptyNote?: string;
}

/* ─── Sections and items ─── */
const SECTIONS: SectionDef[] = [
  {
    label: 'ベーシック',
    items: [
      { id: 'text',        type: 'text',        label: 'テキスト',  icon: <Type className="w-6 h-6 text-gray-700" /> },
      { id: 'shape',       type: 'shape',       label: 'シェイプ',  icon: <Square className="w-6 h-6 text-gray-700" /> },
      { id: 'divider',     type: 'divider',     label: '線',        icon: <Minus className="w-6 h-6 text-gray-700" /> },
      { id: 'iconbutton',  type: 'iconbutton',  label: 'アイコン',  icon: <Smile className="w-6 h-6 text-gray-700" /> },
      { id: 'image',       type: 'image',       label: '画像',      icon: <Image className="w-6 h-6 text-gray-700" /> },
      { id: 'video',       type: 'video',       label: '動画',      icon: <Video className="w-6 h-6 text-gray-700" /> },
    ],
  },
  {
    label: 'アクション',
    items: [
      { id: 'button-primary', type: 'button',     label: 'ボタン',      icon: <MousePointerClick className="w-6 h-6 text-gray-700" /> },
      { id: 'iconbutton-2',   type: 'iconbutton', label: 'アイコンBtn', icon: <PlusCircle className="w-6 h-6 text-gray-700" /> },
      { id: 'toggle',         type: 'toggle',     label: 'スイッチ',    icon: <ToggleLeft className="w-6 h-6 text-gray-700" /> },
      { id: 'check',          type: 'check',      label: 'トグル',      icon: <CheckSquare className="w-6 h-6 text-gray-700" /> },
    ],
  },
  {
    label: 'ナビゲーション',
    items: [
      { id: 'nav-top',    type: 'nav', label: 'トップナビ',   icon: <PanelTop className="w-6 h-6 text-gray-700" /> },
      { id: 'nav-bottom', type: 'nav', label: 'ボトムナビ',   icon: <PanelBottom className="w-6 h-6 text-gray-700" /> },
    ],
  },
  {
    label: 'データベース',
    items: [],
    empty: true,
    emptyNote: '近日公開',
  },
  {
    label: 'インプット',
    items: [
      { id: 'form-input',  type: 'input',      label: 'フォーム',       icon: <LayoutList className="w-6 h-6 text-gray-700" /> },
      { id: 'text-input',  type: 'textarea',   label: 'インプット',     icon: <TextCursor className="w-6 h-6 text-gray-700" /> },
      { id: 'password',    type: 'password',   label: 'パスワード',     icon: <Lock className="w-6 h-6 text-gray-700" /> },
      { id: 'date',        type: 'date',        label: '日付インプット', icon: <CalendarDays className="w-6 h-6 text-gray-700" /> },
      { id: 'file-input',  type: 'fileupload', label: 'ファイルインプット', icon: <Paperclip className="w-6 h-6 text-gray-700" /> },
      { id: 'image-input', type: 'image',      label: '画像インプット', icon: <Camera className="w-6 h-6 text-gray-700" /> },
      { id: 'qr-reader',   type: 'qrcode',     label: 'コード読取',     icon: <ScanBarcode className="w-6 h-6 text-gray-700" /> },
      { id: 'survey',      type: 'radio',       label: 'アンケート',     icon: <ClipboardList className="w-6 h-6 text-gray-700" /> },
      { id: 'stepper',     type: 'stepper',    label: '数量変更',       icon: <PlusSquare className="w-6 h-6 text-gray-700" /> },
    ],
  },
  {
    label: 'アウトプット',
    items: [
      { id: 'basic-card',       type: 'card',      label: 'ベーシック',       icon: <FileText className="w-6 h-6 text-gray-700" /> },
      { id: 'card-output',      type: 'card',      label: 'カード',           icon: <CreditCard className="w-6 h-6 text-gray-700" /> },
      { id: 'custom-container', type: 'container', label: 'カスタム',         icon: <Sliders className="w-6 h-6 text-gray-700" /> },
      { id: 'h-list',           type: 'list',      label: '水平リスト',       icon: <Rows3 className="w-6 h-6 text-gray-700" /> },
      { id: 'tag-list',         type: 'tag',       label: 'タグリスト',       icon: <Tags className="w-6 h-6 text-gray-700" /> },
      { id: 'avatar',           type: 'avatar',    label: 'アバター',         icon: <UserCircle className="w-6 h-6 text-gray-700" /> },
      { id: 'carousel-output',  type: 'carousel',  label: 'カルーセル',       icon: <GalleryHorizontal className="w-6 h-6 text-gray-700" /> },
      { id: 'stack-carousel',   type: 'carousel',  label: 'スタックカルーセル', icon: <Layers className="w-6 h-6 text-gray-700" /> },
      { id: 'calendar-output',  type: 'date',      label: 'カレンダー',       icon: <Calendar className="w-6 h-6 text-gray-700" /> },
      { id: 'dropdown',         type: 'dropdown',  label: 'ドロップダウン',   icon: <ChevronDown className="w-6 h-6 text-gray-700" /> },
      { id: 'barcode-gen',      type: 'qrcode',    label: 'バーコード生成',   icon: <Barcode className="w-6 h-6 text-gray-700" /> },
      { id: 'qr-gen',           type: 'qrcode',    label: 'QRコード生成',     icon: <QrCode className="w-6 h-6 text-gray-700" /> },
      { id: 'table',            type: 'table',     label: 'テーブル',         icon: <Table2 className="w-6 h-6 text-gray-700" /> },
    ],
  },
  {
    label: '外部連携',
    items: [
      { id: 'youtube', type: 'video', label: 'Youtube', icon: <Youtube className="w-6 h-6 text-gray-700" /> },
    ],
  },
];

/* ─── Draggable item ─── */
function DraggableItem({ item }: { item: PaletteItemDef }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${item.id}`,
    data: { type: item.type, isPalette: true },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      {...listeners}
      {...attributes}
      className={cn(
        'aspect-square border border-gray-200 rounded-xl bg-white flex flex-col items-center justify-center p-2 cursor-grab select-none transition-all active:scale-95',
        'hover:border-blue-500 hover:shadow-sm',
        isDragging && 'opacity-40',
      )}
      title={item.label}
    >
      {item.icon}
      <span className="text-[11px] text-gray-500 mt-2 text-center leading-tight line-clamp-2">
        {item.label}
      </span>
    </div>
  );
}

/* ─── Main export ─── */
export default function ElementPalette() {
  const [query, setQuery] = useState('');

  const filteredSections = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return SECTIONS;
    return SECTIONS.map((section) => {
      if (section.empty) {
        // データベース section: always show when no query, hide when querying
        return null;
      }
      const matchedItems = section.items.filter((item) =>
        item.label.toLowerCase().includes(q)
      );
      if (matchedItems.length === 0) return null;
      return { ...section, items: matchedItems };
    }).filter(Boolean) as SectionDef[];
  }, [query]);

  const hasResults = filteredSections.length > 0;

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Search bar */}
      <div className="p-4">
        <div className="relative flex items-center">
          <Search className="absolute left-3 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="検索"
            className="w-full py-2 px-4 pl-9 bg-gray-100 rounded-full text-sm placeholder:text-gray-400 outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Add page button */}
      <div className="px-4 pb-4">
        <button
          onClick={() => {}}
          className="w-full py-2 bg-gray-100 rounded-full flex items-center justify-center gap-2 text-sm font-medium text-blue-600 hover:bg-gray-200 transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          ページを追加する
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        {!hasResults ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <Search className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs">「{query}」に一致する項目がありません</p>
          </div>
        ) : (
          filteredSections.map((section) => (
            <div key={section.label}>
              <p className="text-sm font-bold text-gray-800 px-4 py-2">
                {section.label}
              </p>
              {section.empty ? (
                <p className="text-xs text-gray-400 px-4 pb-6">{section.emptyNote}</p>
              ) : (
                <div className="grid grid-cols-3 gap-2 px-4 pb-6">
                  {section.items.map((item) => (
                    <DraggableItem key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
