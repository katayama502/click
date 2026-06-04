'use client';

import { useState, useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import {
  Search, Type, Square, Minus, Smile, Image, Video,
  MousePointerClick, ToggleLeft, CheckSquare,
  PanelTop, PanelBottom, ClipboardList, TextCursor, Lock,
  CalendarDays, Paperclip, Camera, ListChecks, ScanBarcode,
  List, Rows3, Tags, Users, GalleryHorizontal, Layers,
  Calendar, Table2, ChevronDown, Barcode,
  CreditCard, DollarSign, BarChart2, Youtube, Star,
  Clock, X,
} from 'lucide-react';
import { ElementType } from '@/lib/types';
import { cn } from '@/lib/utils';
import { useBuilderStore } from '@/lib/store';

/* ─── Item definition ─── */
interface PaletteItemDef {
  id: string;
  type: ElementType;
  label: string;
  icon: React.ReactNode;
  /** overrides the label passed to the drag data */
  dragLabel?: string;
}

interface ComingSoonItemDef {
  id: string;
  label: string;
  icon: React.ReactNode;
  comingSoon: true;
}

type AnyItemDef = PaletteItemDef | ComingSoonItemDef;

function isComingSoon(item: AnyItemDef): item is ComingSoonItemDef {
  return (item as ComingSoonItemDef).comingSoon === true;
}

/* ─── Section definition ─── */
interface SectionDef {
  label: string;
  items: AnyItemDef[];
}

const IC = 'w-6 h-6 text-gray-700';

/* ─── Sections and items ─── */
const SECTIONS: SectionDef[] = [
  {
    label: 'ベーシック',
    items: [
      { id: 'text',       type: 'text',       label: 'テキスト',        icon: <Type className={IC} /> },
      { id: 'shape',      type: 'shape',      label: 'シェイプ',        icon: <Square className={IC} /> },
      { id: 'divider',    type: 'divider',    label: '線',              icon: <Minus className={IC} /> },
      { id: 'iconbutton', type: 'iconbutton', label: 'アイコン',        icon: <Smile className={IC} /> },
      { id: 'image',      type: 'image',      label: '画像',            icon: <Image className={IC} /> },
      { id: 'video',      type: 'video',      label: '動画（ショート動画）', icon: <Video className={IC} /> },
    ],
  },
  {
    label: 'アクション',
    items: [
      { id: 'button-1', type: 'button', label: 'ボタン1', dragLabel: 'ボタン1', icon: <MousePointerClick className={IC} /> },
      { id: 'button-2', type: 'button', label: 'ボタン2', dragLabel: 'ボタン2', icon: <MousePointerClick className={IC} /> },
      { id: 'toggle',   type: 'toggle', label: 'スイッチ', icon: <ToggleLeft className={IC} /> },
      { id: 'check',    type: 'check',  label: 'トグル',   icon: <CheckSquare className={IC} /> },
    ],
  },
  {
    label: 'ナビゲーション',
    items: [
      { id: 'nav-top',    type: 'nav', label: 'トップ（ヘッダー）', dragLabel: 'トップナビ',   icon: <PanelTop className={IC} /> },
      { id: 'nav-bottom', type: 'nav', label: 'ボトム（タブバー）', dragLabel: 'ボトムナビ',   icon: <PanelBottom className={IC} /> },
    ],
  },
  {
    label: 'インプット',
    items: [
      { id: 'form',        type: 'form',       label: 'フォーム',          icon: <ClipboardList className={IC} /> },
      { id: 'input',       type: 'input',      label: 'インプット',        icon: <TextCursor className={IC} /> },
      { id: 'password',    type: 'password',   label: 'パスワード',        icon: <Lock className={IC} /> },
      { id: 'date',        type: 'date',       label: '日付インプット',    icon: <CalendarDays className={IC} /> },
      { id: 'fileupload',  type: 'fileupload', label: 'ファイルインプット', icon: <Paperclip className={IC} /> },
      { id: 'image-input', type: 'image',      label: '画像インプット',    icon: <Camera className={IC} />, dragLabel: '画像インプット' },
      { id: 'radio',       type: 'radio',      label: 'アンケート',        icon: <ListChecks className={IC} /> },
      { id: 'qr-reader',   type: 'qrcode',     label: 'コード読み取り',    icon: <ScanBarcode className={IC} />, dragLabel: 'コード読み取り' },
    ],
  },
  {
    label: 'アウトプット',
    items: [
      { id: 'list',           type: 'list',     label: 'リスト',                icon: <List className={IC} /> },
      { id: 'h-list',         type: 'list',     label: '水平リスト',            icon: <Rows3 className={IC} />,              dragLabel: '水平リスト' },
      { id: 'tag',            type: 'tag',      label: 'タグリスト',            icon: <Tags className={IC} /> },
      { id: 'avatar',         type: 'avatar',   label: 'アバターリスト',        icon: <Users className={IC} /> },
      { id: 'carousel',       type: 'carousel', label: 'カルーセル',            icon: <GalleryHorizontal className={IC} /> },
      { id: 'stack-carousel', type: 'carousel', label: 'スタックカルーセル',    icon: <Layers className={IC} />,             dragLabel: 'スタックカルーセル' },
      { id: 'calendar',       type: 'date',     label: 'カレンダー',            icon: <Calendar className={IC} />,          dragLabel: 'カレンダー' },
      { id: 'table',          type: 'table',    label: 'テーブル',              icon: <Table2 className={IC} /> },
      { id: 'dropdown',       type: 'dropdown', label: 'ドロップダウン',        icon: <ChevronDown className={IC} /> },
      { id: 'search-el',      type: 'input',    label: '検索エレメント',        icon: <Search className={IC} />,            dragLabel: '検索エレメント' },
      { id: 'barcode-gen',    type: 'qrcode',   label: 'バーコード生成・コード読み取り', icon: <Barcode className={IC} />,   dragLabel: 'バーコード生成' },
    ],
  },
  {
    label: 'マネタイズ',
    items: [
      { id: 'click-pay',    label: 'Click Pay',    icon: <CreditCard className={IC} />,  comingSoon: true },
      { id: 'jpyc',         label: 'JPYC',         icon: <DollarSign className={IC} />,  comingSoon: true },
      { id: 'google-admob', label: 'GoogleAdMob',  icon: <BarChart2 className={IC} />,   comingSoon: true },
    ],
  },
  {
    label: '外部連携',
    items: [
      { id: 'line',            label: 'LINEアカウント連携',    icon: <Smile className={IC} />,       comingSoon: true },
      { id: 'youtube',         type: 'video',  label: 'YouTube',               icon: <Youtube className={IC} />,     dragLabel: 'YouTube' },
      { id: 'vimeo',           label: 'Vimeo',                 icon: <Video className={IC} />,       comingSoon: true },
      { id: 'timer',           label: 'タイマーエレメント',    icon: <Clock className={IC} />,       comingSoon: true },
      { id: 'chat',            label: 'チャット',              icon: <Square className={IC} />,      comingSoon: true },
      { id: 'map',             label: 'Map',                   icon: <Square className={IC} />,      comingSoon: true },
      { id: 'stamp',           label: 'デジタルスタンプ機能',  icon: <Square className={IC} />,      comingSoon: true },
      { id: 'rating',          type: 'rating', label: '星評価エレメント',      icon: <Star className={IC} /> },
      { id: 'webview',         label: 'ウェブビュー',          icon: <Square className={IC} />,      comingSoon: true },
      { id: 'lottie',          label: 'Lottie',                icon: <Layers className={IC} />,      comingSoon: true },
      { id: 'ai-chatbot',      label: 'AIチャットボットエレメント', icon: <Square className={IC} />, comingSoon: true },
    ],
  },
];

/* ─── Draggable item ─── */
function DraggableItem({ item }: { item: PaletteItemDef }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${item.id}`,
    data: { type: item.type, label: item.dragLabel ?? item.label, isPalette: true },
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
      <span className="text-[10px] text-gray-500 mt-1.5 text-center leading-tight line-clamp-2">
        {item.label}
      </span>
    </div>
  );
}

/* ─── Coming soon item (not draggable) ─── */
function ComingSoonItem({ item }: { item: ComingSoonItemDef }) {
  return (
    <div
      className="aspect-square border border-gray-100 rounded-xl bg-gray-50 flex flex-col items-center justify-center p-2 cursor-not-allowed select-none relative opacity-50"
      title={`${item.label}（近日公開）`}
    >
      {/* dim overlay */}
      <div className="absolute inset-0 rounded-xl" />
      <div className="relative flex flex-col items-center justify-center gap-0">
        <div className="opacity-40">{item.icon}</div>
        <span className="text-[10px] text-gray-400 mt-1.5 text-center leading-tight line-clamp-2">
          {item.label}
        </span>
        {/* lock badge */}
        <span className="absolute -top-1 -right-1 bg-gray-300 text-white text-[8px] font-bold rounded px-0.5 leading-tight">
          近日
        </span>
      </div>
    </div>
  );
}

/* ─── Main export ─── */
export default function ElementPalette() {
  const [query, setQuery] = useState('');
  const { addPage } = useBuilderStore();

  const filteredSections = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return SECTIONS;
    return SECTIONS.map((section) => {
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
      <div className="p-4 flex-shrink-0">
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="検索"
            className="w-full py-2 pl-4 pr-10 bg-gray-100 rounded-full text-sm placeholder:text-gray-400 outline-none focus:bg-gray-200 transition-colors"
          />
          {query ? (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          )}
        </div>
      </div>

      {/* Add page / modal buttons */}
      <div className="px-4 pb-3 flex-shrink-0 flex flex-col gap-2">
        <button
          onClick={() => addPage()}
          className="w-full py-2 rounded-full flex items-center justify-center gap-2 text-sm font-medium text-white transition-all cursor-pointer hover:opacity-90 active:scale-95 shadow-sm"
          style={{ background: 'linear-gradient(135deg, #1ec8a5 0%, #13a98a 100%)' }}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          ページを追加する
        </button>
        <button
          onClick={() => addPage(undefined, 'modal')}
          className="w-full py-2 rounded-full flex items-center justify-center gap-2 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 transition-all cursor-pointer active:scale-95 border border-purple-200"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h8m-8 4h6M15 13v8m0 0l-3-3m3 3l3-3" />
          </svg>
          モーダルを追加
        </button>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {!hasResults ? (
          <div className="flex flex-col items-center justify-center py-10 text-gray-400">
            <Search className="w-8 h-8 mb-2 opacity-40" />
            <p className="text-xs">「{query}」に一致する項目がありません</p>
          </div>
        ) : (
          filteredSections.map((section) => (
            <div key={section.label}>
              <div className="flex items-center gap-2 px-4 pt-4 pb-2">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-widest whitespace-nowrap">
                  {section.label}
                </p>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <div className="grid grid-cols-3 gap-2 px-4 pb-6">
                {section.items.map((item) =>
                  isComingSoon(item) ? (
                    <ComingSoonItem key={item.id} item={item} />
                  ) : (
                    <DraggableItem key={item.id} item={item} />
                  )
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Bottom: Tutorial + Manual */}
      {!query && (
        <div className="mt-auto border-t border-gray-100 flex-shrink-0">
          {/* YouTube tutorial thumbnail */}
          <a
            href="https://www.youtube.com/results?search_query=Click+ノーコード+アプリ"
            target="_blank"
            rel="noopener noreferrer"
            className="block mx-3 mt-3 mb-2 rounded-xl overflow-hidden relative group cursor-pointer"
          >
            <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative">
              <div className="absolute inset-0 bg-black opacity-20" />
              <div className="relative z-10 text-center px-3">
                <div className="w-12 h-12 bg-red-600 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:bg-red-500 transition-colors shadow-lg">
                  <svg className="w-5 h-5 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
                <p className="text-white text-xs font-semibold leading-tight drop-shadow">
                  【最新版】超基礎！<br />
                  ノーコードアプリ開発C...
                </p>
              </div>
              <div className="absolute top-2 left-2 bg-white rounded px-1.5 py-0.5 text-xs font-bold text-[#1ec8a5]">
                Click
              </div>
            </div>
          </a>

          {/* Manual link */}
          <a
            href="https://click.dev"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2.5 hover:bg-gray-50 transition-colors group"
          >
            <svg className="w-4 h-4 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <span className="text-xs font-medium text-gray-600 group-hover:text-gray-900 transition-colors">
              マニュアルはこちら
            </span>
          </a>
        </div>
      )}
    </div>
  );
}
