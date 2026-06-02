'use client';

import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useState, useMemo } from 'react';
import { ElementType } from '@/lib/types';
import { cn } from '@/lib/utils';

/* ─── Item definition ─── */
interface PaletteItemDef {
  type: ElementType;
  label: string;
  icon: React.ReactNode;
}

/* ─── SVG icons ─── */
const I = {
  text:       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h16M4 18h7" /></svg>,
  heading:    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 12h10M3 18h4m2 0h4" /><text x="15" y="19" fontSize="7" fontWeight="bold" fill="currentColor" stroke="none">H</text></svg>,
  image:      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>,
  video:      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M15 10l4.553-2.069A1 1 0 0121 8.87v6.26a1 1 0 01-1.447.894L15 14M4 8h11a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V9a1 1 0 011-1z" /></svg>,
  divider:    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" /></svg>,
  spacer:     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 6h8M8 18h8M12 6v12" /></svg>,
  shape:      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="3" strokeWidth={1.8} /></svg>,
  button:     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="8" width="18" height="8" rx="4" strokeWidth={1.8} /></svg>,
  toggle:     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="10" rx="5" strokeWidth={1.8} /><circle cx="15" cy="12" r="3.5" fill="currentColor" stroke="none" /></svg>,
  iconbutton: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="9" strokeWidth={1.8} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v8m-4-4h8" /></svg>,
  input:      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="10" rx="2" strokeWidth={1.8} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 12h2" /></svg>,
  textarea:   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="2" strokeWidth={1.8} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 9h12M6 13h8" /></svg>,
  password:   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="5" y="11" width="14" height="10" rx="2" strokeWidth={1.8} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M8 11V7a4 4 0 018 0v4" /></svg>,
  date:       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="4" width="18" height="18" rx="2" strokeWidth={1.8} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M16 2v4M8 2v4M3 10h18" /></svg>,
  dropdown:   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="7" width="20" height="10" rx="2" strokeWidth={1.8} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12l-3 3-3-3" /></svg>,
  check:      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="3" y="6" width="14" height="14" rx="2" strokeWidth={1.8} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 13l3 3 6-6" /></svg>,
  radio:      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="12" r="9" strokeWidth={1.8} /><circle cx="12" cy="12" r="4" fill="currentColor" stroke="none" /></svg>,
  fileupload: <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M16 12l-4-4m0 0L8 12m4-4v12" /></svg>,
  stepper:    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="8" width="20" height="8" rx="2" strokeWidth={1.8} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01" /></svg>,
  rating:     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
  card:       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="4" width="20" height="16" rx="3" strokeWidth={1.8} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 9h12M6 13h8" /></svg>,
  list:       <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
  table:      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="3" width="20" height="18" rx="2" strokeWidth={1.8} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M2 9h20M2 15h20M8 3v18M15 3v18" /></svg>,
  badge:      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="4" y="9" width="16" height="8" rx="4" strokeWidth={1.8} /></svg>,
  avatar:     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><circle cx="12" cy="8" r="4" strokeWidth={1.8} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>,
  progress:   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="10" width="20" height="4" rx="2" strokeWidth={1.8} /><rect x="2" y="10" width="14" height="4" rx="2" fill="currentColor" stroke="none" opacity="0.4" /></svg>,
  tag:        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M7 7h.01M3 3h8l9.707 9.707a1 1 0 010 1.414l-4.586 4.586a1 1 0 01-1.414 0L5 9V3z" /></svg>,
  nav:        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="16" width="20" height="6" rx="2" strokeWidth={1.8} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 19h.01M12 19h.01M18 19h.01" /></svg>,
  carousel:   <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="4" y="4" width="16" height="16" rx="2" strokeWidth={1.8} /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M1 8h2m18 0h2M1 16h2m18 0h2" /></svg>,
  qrcode:     <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 3h6v6H3V3zm12 0h6v6h-6V3zM3 15h6v6H3v-6zm10 2h2v2h-2v-2zm2-4h2v2h-2v-2zm2 4h2v2h-2v-2zm0-4h2v2h-2v-2z" /></svg>,
  container:  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><rect x="2" y="2" width="20" height="20" rx="3" strokeWidth={1.8} strokeDasharray="4 2" /></svg>,
};

/* ─── Sections ─── */
const SECTIONS = [
  {
    label: 'ベーシック',
    items: [
      { type: 'text' as ElementType,    label: 'テキスト',  icon: I.text },
      { type: 'heading' as ElementType, label: '見出し',    icon: I.heading },
      { type: 'image' as ElementType,   label: '画像',      icon: I.image },
      { type: 'video' as ElementType,   label: '動画',      icon: I.video },
      { type: 'shape' as ElementType,   label: 'シェイプ',  icon: I.shape },
      { type: 'divider' as ElementType, label: '区切り線',  icon: I.divider },
      { type: 'spacer' as ElementType,  label: 'スペース',  icon: I.spacer },
    ],
  },
  {
    label: 'アクション',
    items: [
      { type: 'button' as ElementType,     label: 'ボタン',       icon: I.button },
      { type: 'toggle' as ElementType,     label: 'トグル',       icon: I.toggle },
      { type: 'iconbutton' as ElementType, label: 'アイコンBtn', icon: I.iconbutton },
    ],
  },
  {
    label: 'フォーム',
    items: [
      { type: 'input' as ElementType,      label: '入力欄',       icon: I.input },
      { type: 'textarea' as ElementType,   label: 'テキストエリア', icon: I.textarea },
      { type: 'password' as ElementType,   label: 'パスワード',   icon: I.password },
      { type: 'date' as ElementType,       label: '日付',         icon: I.date },
      { type: 'dropdown' as ElementType,   label: 'ドロップダウン', icon: I.dropdown },
      { type: 'check' as ElementType,      label: 'チェック',     icon: I.check },
      { type: 'radio' as ElementType,      label: 'ラジオ',       icon: I.radio },
      { type: 'fileupload' as ElementType, label: 'ファイル',     icon: I.fileupload },
      { type: 'stepper' as ElementType,    label: '数量変更',     icon: I.stepper },
      { type: 'rating' as ElementType,     label: '評価（星）',   icon: I.rating },
    ],
  },
  {
    label: 'データ',
    items: [
      { type: 'card' as ElementType,     label: 'カード',      icon: I.card },
      { type: 'list' as ElementType,     label: 'リスト',      icon: I.list },
      { type: 'table' as ElementType,    label: 'テーブル',    icon: I.table },
      { type: 'badge' as ElementType,    label: 'バッジ',      icon: I.badge },
      { type: 'avatar' as ElementType,   label: 'アバター',    icon: I.avatar },
      { type: 'progress' as ElementType, label: 'プログレス',  icon: I.progress },
      { type: 'tag' as ElementType,      label: 'タグ',        icon: I.tag },
      { type: 'carousel' as ElementType, label: 'カルーセル',  icon: I.carousel },
      { type: 'qrcode' as ElementType,   label: 'QRコード',    icon: I.qrcode },
    ],
  },
  {
    label: 'レイアウト',
    items: [
      { type: 'nav' as ElementType,       label: 'ナビバー',   icon: I.nav },
      { type: 'container' as ElementType, label: 'コンテナ',   icon: I.container },
    ],
  },
] as const;

/* ─── Draggable item ─── */
function DraggableItem({ item }: { item: PaletteItemDef }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `palette-${item.type}`,
    data: { type: item.type, isPalette: true },
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), opacity: isDragging ? 0.4 : 1 }}
      {...listeners}
      {...attributes}
      className={cn(
        'flex flex-col items-center gap-1.5 p-2.5 rounded-xl cursor-grab select-none transition-all duration-150 border border-transparent group',
        'hover:bg-slate-700 hover:border-slate-600',
        isDragging && 'shadow-xl scale-105',
      )}
      title={item.label}
    >
      <div className="w-10 h-10 rounded-xl bg-slate-700 group-hover:bg-slate-600 flex items-center justify-center text-slate-300 group-hover:text-[#1ec8a5] transition-colors">
        {item.icon}
      </div>
      <span className="text-slate-400 text-[10px] font-medium leading-tight text-center line-clamp-2">
        {item.label}
      </span>
    </div>
  );
}

/* ─── Component tab ─── */
function ComponentsTab({ query }: { query: string }) {
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return SECTIONS as unknown as typeof SECTIONS;
    return SECTIONS.map((s) => ({
      ...s,
      items: s.items.filter((item) => item.label.toLowerCase().includes(q)),
    })).filter((s) => s.items.length > 0);
  }, [query]);

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-10 text-slate-500">
        <svg className="w-8 h-8 mb-2 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <p className="text-xs">「{query}」に一致する項目がありません</p>
      </div>
    );
  }

  return (
    <div className="py-2 px-2 space-y-4">
      {filtered.map((section) => (
        <div key={section.label}>
          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-1.5">
            {section.label}
          </p>
          <div className="grid grid-cols-3 gap-0.5">
            {section.items.map((item) => (
              <DraggableItem key={item.type} item={item} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ─── Main export ─── */
export default function ElementPalette() {
  const [query, setQuery] = useState('');

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="px-3 py-2.5 border-b border-slate-700">
        <div className="relative">
          <svg className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="検索..."
            className="w-full bg-slate-800 border border-slate-700 rounded-lg pl-7 pr-3 py-1.5 text-xs text-slate-300 placeholder-slate-600 outline-none focus:border-[#1ec8a5] transition-colors"
          />
          {query && (
            <button onClick={() => setQuery('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>

      {/* Items */}
      <div className="flex-1 overflow-y-auto">
        <ComponentsTab query={query} />
      </div>
    </div>
  );
}
