'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import type { Element, Page, Action } from '@/lib/types';

// ─────────────────────────────────────────────
// Inline element renderer (preview-mode)
// ─────────────────────────────────────────────
function PreviewElementContent({ element }: { element: Element }) {
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
          className="w-full h-full flex items-center justify-center cursor-pointer select-none"
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
          className="w-full h-full flex items-center justify-center cursor-pointer select-none border"
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
      return (
        <input
          type="text"
          placeholder={element.placeholder ?? 'テキストを入力'}
          className="w-full h-full px-3 border outline-none focus:border-brand"
          style={{
            backgroundColor: s.backgroundColor ?? '#ffffff',
            borderColor: '#d1d5db',
            borderRadius: s.borderRadius ?? 8,
            fontSize: s.fontSize ?? 14,
            color: s.color ?? '#1f2937',
          }}
        />
      );

    case 'password-input':
      return (
        <input
          type="password"
          placeholder={element.placeholder ?? 'パスワードを入力'}
          className="w-full h-full px-3 border outline-none focus:border-brand"
          style={{
            backgroundColor: s.backgroundColor ?? '#ffffff',
            borderColor: '#d1d5db',
            borderRadius: s.borderRadius ?? 8,
            fontSize: s.fontSize ?? 14,
          }}
        />
      );

    case 'date-input':
      return (
        <input
          type="date"
          className="w-full h-full px-3 border outline-none focus:border-brand"
          style={{
            backgroundColor: s.backgroundColor ?? '#ffffff',
            borderColor: '#d1d5db',
            borderRadius: s.borderRadius ?? 8,
            fontSize: s.fontSize ?? 14,
          }}
        />
      );

    case 'shape':
      return (
        <div
          className="w-full h-full"
          style={{
            backgroundColor: s.backgroundColor ?? '#e5e7eb',
            borderRadius: s.borderRadius ?? 8,
            border: s.border,
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
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{ backgroundColor: i === 0 ? '#1ec8a5' : '#d1d5db' }}
              />
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
              <div
                key={i}
                className="text-[9px] text-center rounded py-0.5 cursor-pointer hover:bg-gray-100"
                style={i + 1 === 15 ? { backgroundColor: '#1ec8a5', color: '#fff' } : { color: '#4b5563' }}
              >
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
              <input
                type="text"
                placeholder="入力してください"
                className="w-full h-8 border border-gray-200 rounded px-2 text-xs text-gray-600 outline-none focus:border-brand"
              />
            </div>
          ))}
          <button
            className="w-full h-8 rounded text-xs text-white font-medium"
            style={{ backgroundColor: '#1ec8a5' }}
          >
            送信
          </button>
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
          className="w-full h-full flex items-center justify-between px-3 border cursor-pointer"
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
          <input
            type="text"
            placeholder={element.placeholder ?? '検索...'}
            className="flex-1 bg-transparent outline-none text-sm text-gray-600 placeholder-gray-400"
          />
        </div>
      );

    case 'switch-element':
      return (
        <div className="w-full h-full flex items-center justify-between px-2">
          <span className="text-sm text-gray-700">{element.label ?? 'スイッチ'}</span>
          <div className="w-10 h-6 rounded-full flex items-center px-0.5 cursor-pointer" style={{ backgroundColor: '#1ec8a5' }}>
            <div className="w-5 h-5 bg-white rounded-full shadow ml-auto" />
          </div>
        </div>
      );

    case 'toggle-element':
      return (
        <div className="w-full h-full flex items-center justify-between px-2">
          <span className="text-sm text-gray-700">{element.label ?? 'トグル'}</span>
          <div className="w-8 h-8 border-2 rounded flex items-center justify-center cursor-pointer" style={{ borderColor: '#1ec8a5' }}>
            <div className="w-4 h-4 rounded-sm" style={{ backgroundColor: '#1ec8a5' }} />
          </div>
        </div>
      );

    case 'file-input':
      return (
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-1 border-2 border-dashed cursor-pointer"
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

    case 'check':
      return (
        <div className="w-full h-full flex items-center gap-2 px-2">
          <div className="w-5 h-5 flex-shrink-0 rounded flex items-center justify-center" style={{ backgroundColor: '#1ec8a5' }}>
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span className="text-sm" style={{ color: s.color ?? '#374151' }}>{element.label ?? 'チェック項目'}</span>
        </div>
      );

    case 'card-list':
      return (
        <div className="w-full h-full overflow-hidden space-y-2 p-2" style={{ backgroundColor: s.backgroundColor ?? '#f9fafb', borderRadius: s.borderRadius ?? 8 }}>
          {[1, 2].map(i => (
            <div key={i} className="flex items-center gap-3 bg-white rounded-lg px-3 py-2 shadow-sm">
              <div className="w-10 h-10 rounded-lg bg-gray-200 flex-shrink-0" />
              <div className="flex-1 space-y-1">
                <div className="h-3 bg-gray-200 rounded w-2/3" />
                <div className="h-2 bg-gray-100 rounded w-1/2" />
              </div>
            </div>
          ))}
        </div>
      );

    case 'custom-list':
      return (
        <div className="w-full h-full overflow-hidden" style={{ backgroundColor: s.backgroundColor ?? '#ffffff', borderRadius: s.borderRadius ?? 0 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="flex items-center gap-2 px-3 py-2 border-b border-gray-100">
              <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: '#1ec8a5' }} />
              <div className="h-3 bg-gray-200 rounded flex-1" />
            </div>
          ))}
        </div>
      );

    case 'tag-list':
      return (
        <div className="w-full h-full flex flex-wrap gap-1.5 items-start content-start p-2" style={{ backgroundColor: s.backgroundColor ?? 'transparent' }}>
          {['タグ1', 'タグ2', 'タグ3', 'タグ4'].map(tag => (
            <div key={tag} className="px-2 py-0.5 rounded-full text-[11px] font-medium" style={{ backgroundColor: '#1ec8a522', color: '#1ec8a5' }}>{tag}</div>
          ))}
        </div>
      );

    case 'avatar-list':
      return (
        <div className="w-full h-full flex items-center px-2">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="w-8 h-8 rounded-full border-2 border-white bg-gray-300 flex-shrink-0 flex items-center justify-center text-xs font-semibold text-gray-600" style={{ marginLeft: i > 1 ? -8 : 0, zIndex: 10 - i }}>
              {i}
            </div>
          ))}
          <span className="ml-3 text-xs text-gray-500">+12</span>
        </div>
      );

    case 'stack-carousel':
      return (
        <div className="w-full h-full relative flex items-center justify-center overflow-hidden" style={{ backgroundColor: s.backgroundColor ?? '#f3f4f6', borderRadius: s.borderRadius ?? 12 }}>
          <div className="absolute inset-4 rounded-lg bg-gray-300 opacity-50" style={{ transform: 'rotate(3deg)' }} />
          <div className="absolute inset-3 rounded-lg bg-gray-200 opacity-70" style={{ transform: 'rotate(-2deg)' }} />
          <div className="absolute inset-2 rounded-lg bg-white shadow flex items-center justify-center">
            <span className="text-xs text-gray-400">スタック</span>
          </div>
        </div>
      );

    case 'barcode':
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1 p-2" style={{ backgroundColor: s.backgroundColor ?? '#ffffff', borderRadius: s.borderRadius ?? 0 }}>
          <div className="flex items-end gap-px h-10">
            {Array.from({ length: 28 }, (_, i) => (
              <div key={i} className="bg-gray-800" style={{ width: i % 3 === 0 ? 3 : 2, height: i % 5 === 0 ? '100%' : i % 2 === 0 ? '80%' : '90%' }} />
            ))}
          </div>
          <span className="text-[10px] tracking-widest text-gray-600">123456789</span>
        </div>
      );

    case 'qr-code':
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1" style={{ backgroundColor: s.backgroundColor ?? '#ffffff', borderRadius: s.borderRadius ?? 0 }}>
          <div className="grid grid-cols-5 gap-px p-1 bg-white">
            {Array.from({ length: 25 }, (_, i) => (
              <div key={i} className="w-3 h-3" style={{ backgroundColor: [0,1,2,5,6,7,10,12,17,18,19,20,21,23,24].includes(i) ? '#1f2937' : '#ffffff' }} />
            ))}
          </div>
          <span className="text-[9px] text-gray-400">QRコード</span>
        </div>
      );

    case 'line-social':
      return (
        <div className="w-full h-full flex items-center justify-center rounded" style={{ backgroundColor: s.backgroundColor ?? '#06C755', borderRadius: s.borderRadius ?? 8 }}>
          <span className="text-white font-bold text-sm">LINE でログイン</span>
        </div>
      );

    case 'map-element':
      return (
        <div className="w-full h-full relative overflow-hidden" style={{ backgroundColor: '#e5e7eb', borderRadius: s.borderRadius ?? 0 }}>
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: 'linear-gradient(#9ca3af 1px, transparent 1px), linear-gradient(90deg, #9ca3af 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex flex-col items-center gap-1">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="#ef4444" stroke="none">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span className="text-[10px] text-gray-600 font-medium bg-white px-1 rounded">地図</span>
            </div>
          </div>
        </div>
      );

    case 'web-view':
      return (
        <div className="w-full h-full overflow-hidden" style={{ backgroundColor: '#ffffff', borderRadius: s.borderRadius ?? 0 }}>
          <div className="flex items-center gap-1.5 px-2 py-1.5 bg-gray-100 border-b border-gray-200">
            <div className="flex gap-1">
              {['#ef4444', '#f59e0b', '#22c55e'].map(c => (
                <div key={c} className="w-2 h-2 rounded-full" style={{ backgroundColor: c }} />
              ))}
            </div>
            <div className="flex-1 h-4 bg-white rounded-sm border border-gray-200 flex items-center px-1">
              <span className="text-[9px] text-gray-400 truncate">https://example.com</span>
            </div>
          </div>
          <div className="p-2 space-y-1.5">
            <div className="h-3 bg-gray-200 rounded w-3/4" />
            <div className="h-2 bg-gray-100 rounded w-full" />
          </div>
        </div>
      );

    case 'youtube-element':
      return (
        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#000', borderRadius: s.borderRadius ?? 0 }}>
          <div className="w-12 h-8 bg-red-600 rounded-lg flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="white"><polygon points="5 3 19 12 5 21 5 3" /></svg>
          </div>
        </div>
      );

    case 'vimeo-element':
      return (
        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#1ab7ea', borderRadius: s.borderRadius ?? 0 }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
            <path d="M22 7.42c-.09 2.01-1.49 4.76-4.2 8.24C15.02 19.2 12.65 21 10.6 21c-1.26 0-2.33-1.16-3.2-3.49l-1.74-6.38C5.03 8.8 4.34 7.64 3.6 7.64c-.16 0-.71.33-1.66.99L1 7.51c1.04-.92 2.07-1.83 3.08-2.76C5.5 3.52 6.55 2.88 7.24 2.8c1.66-.16 2.68.97 3.07 3.4.41 2.62.7 4.25.86 4.9.48 2.16 1 3.24 1.55 3.24.44 0 1.1-.69 1.98-2.08.88-1.39 1.35-2.44 1.41-3.17.12-1.2-.34-1.8-1.41-1.8-.5 0-1.02.11-1.55.34.97-3.15 2.8-4.68 5.53-4.6C20.6 3.11 22.12 4.56 22 7.42z"/>
          </svg>
        </div>
      );

    case 'stamp-element':
      return (
        <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: s.backgroundColor ?? 'transparent' }}>
          <div className="w-16 h-16 rounded-full border-4 flex items-center justify-center" style={{ borderColor: s.color ?? '#1ec8a5' }}>
            <span className="text-[11px] font-bold" style={{ color: s.color ?? '#1ec8a5' }}>STAMP</span>
          </div>
        </div>
      );

    case 'stamp-card':
      return (
        <div className="w-full h-full overflow-hidden p-2" style={{ backgroundColor: s.backgroundColor ?? '#fff8e6', borderRadius: s.borderRadius ?? 12 }}>
          <div className="text-[10px] font-semibold text-gray-600 mb-1.5">スタンプカード</div>
          <div className="grid grid-cols-5 gap-1">
            {Array.from({ length: 10 }, (_, i) => (
              <div key={i} className="aspect-square rounded-full flex items-center justify-center border-2" style={{ borderColor: i < 4 ? '#1ec8a5' : '#e5e7eb', backgroundColor: i < 4 ? '#1ec8a5' : 'transparent' }}>
                {i < 4 && <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
              </div>
            ))}
          </div>
        </div>
      );

    case 'lottie-element':
      return (
        <div className="w-full h-full flex flex-col items-center justify-center gap-1" style={{ backgroundColor: s.backgroundColor ?? 'transparent' }}>
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 opacity-30" style={{ borderColor: '#1ec8a5', animation: 'ping 1s cubic-bezier(0,0,0.2,1) infinite' }} />
            <div className="absolute inset-2 rounded-full" style={{ backgroundColor: '#1ec8a5', opacity: 0.6 }} />
          </div>
          <span className="text-[10px] text-gray-400">Lottie</span>
        </div>
      );

    case 'chat-element':
      return (
        <div className="w-full h-full overflow-hidden p-2 space-y-2" style={{ backgroundColor: s.backgroundColor ?? '#f9fafb', borderRadius: s.borderRadius ?? 8 }}>
          <div className="flex items-end gap-1.5">
            <div className="w-6 h-6 rounded-full bg-gray-300 flex-shrink-0" />
            <div className="max-w-[70%] bg-white rounded-2xl rounded-bl-sm px-2.5 py-1.5 shadow-sm">
              <div className="h-2 bg-gray-200 rounded w-20" />
            </div>
          </div>
          <div className="flex items-end gap-1.5 justify-end">
            <div className="max-w-[70%] rounded-2xl rounded-br-sm px-2.5 py-1.5" style={{ backgroundColor: '#1ec8a5' }}>
              <div className="h-2 rounded w-16" style={{ backgroundColor: 'rgba(255,255,255,0.5)' }} />
            </div>
          </div>
        </div>
      );

    case 'star-rating':
      return (
        <div className="w-full h-full flex items-center justify-center gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <svg key={i} width="20" height="20" viewBox="0 0 24 24" fill={i <= 4 ? (s.color ?? '#f59e0b') : 'none'} stroke={s.color ?? '#f59e0b'} strokeWidth="1.5">
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          ))}
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

// ─────────────────────────────────────────────
// Device sizes
// ─────────────────────────────────────────────
const deviceSizes = {
  mobile: { width: 390, height: 844 },
  tablet: { width: 768, height: 1024 },
  desktop: { width: 1280, height: 800 },
} as const;

type DevicePreview = 'mobile' | 'tablet' | 'desktop';

// ─────────────────────────────────────────────
// Scale calculation
// ─────────────────────────────────────────────
function getScale(device: DevicePreview): number {
  if (typeof window === 'undefined') return 1;
  const sizes: Record<DevicePreview, number> = { mobile: 390, tablet: 768, desktop: 1280 };
  const availableWidth = window.innerWidth - 120;
  const deviceWidth = sizes[device];
  return Math.min(1, availableWidth / deviceWidth);
}

// ─────────────────────────────────────────────
// Device Frame Components
// ─────────────────────────────────────────────
function MobileFrame({
  page,
  children,
}: {
  page: { backgroundColor?: string } | null;
  children: React.ReactNode;
}) {
  const bg = page?.backgroundColor ?? '#ffffff';
  return (
    <div
      style={{
        padding: '12px 10px 16px 10px',
        backgroundColor: '#1a1a1a',
        borderRadius: 52,
        boxShadow: '0 0 0 2px #333, 0 20px 60px rgba(0,0,0,0.5)',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {/* Volume down button */}
      <div style={{ position: 'absolute', left: -3, top: 80, width: 3, height: 32, backgroundColor: '#333', borderRadius: '3px 0 0 3px' }} />
      {/* Volume up button */}
      <div style={{ position: 'absolute', left: -3, top: 124, width: 3, height: 60, backgroundColor: '#333', borderRadius: '3px 0 0 3px' }} />
      {/* Power button */}
      <div style={{ position: 'absolute', right: -3, top: 100, width: 3, height: 70, backgroundColor: '#333', borderRadius: '0 3px 3px 0' }} />

      {/* Screen */}
      <div
        style={{
          width: 390,
          height: 844,
          backgroundColor: bg,
          borderRadius: 44,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {/* Status bar */}
        <div
          style={{
            height: 44,
            backgroundColor: bg,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            fontSize: 12,
            fontWeight: '600',
            color: '#000',
            flexShrink: 0,
            position: 'relative',
            zIndex: 10,
          }}
        >
          <span>9:41</span>
          {/* Dynamic Island */}
          <div
            style={{
              width: 120,
              height: 28,
              backgroundColor: '#000',
              borderRadius: 14,
              position: 'absolute',
              left: '50%',
              transform: 'translateX(-50%)',
              top: 8,
            }}
          />
          <div style={{ display: 'flex', gap: 4, alignItems: 'center', fontSize: 11 }}>
            <svg width="16" height="12" viewBox="0 0 16 12" fill="currentColor">
              <rect x="0" y="3" width="3" height="9" rx="1" opacity="0.4" />
              <rect x="4.5" y="2" width="3" height="10" rx="1" opacity="0.6" />
              <rect x="9" y="0.5" width="3" height="11.5" rx="1" />
              <rect x="14" y="2" width="2" height="7" rx="1" opacity="0.4" />
            </svg>
            <svg width="15" height="11" viewBox="0 0 15 11" fill="none" stroke="currentColor" strokeWidth="1.3">
              <path d="M7.5 2.5C5.5 2.5 3.8 3.3 2.6 4.5M12.4 4.5C11.2 3.3 9.5 2.5 7.5 2.5" />
              <path d="M7.5 5.5C6.4 5.5 5.4 5.9 4.7 6.6M10.3 6.6C9.6 5.9 8.6 5.5 7.5 5.5" />
              <circle cx="7.5" cy="9" r="1" fill="currentColor" stroke="none" />
            </svg>
            <svg width="25" height="12" viewBox="0 0 25 12" fill="none">
              <rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="currentColor" strokeOpacity="0.35" />
              <rect x="2" y="2" width="18" height="8" rx="2" fill="currentColor" />
              <path d="M23 4.5V7.5C23.8 7.2 24.5 6.5 24.5 6C24.5 5.5 23.8 4.8 23 4.5Z" fill="currentColor" fillOpacity="0.4" />
            </svg>
          </div>
        </div>

        {/* Page content */}
        <div
          style={{
            width: '100%',
            height: 'calc(100% - 44px)',
            overflow: 'auto',
            position: 'relative',
            backgroundColor: bg,
          }}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

function TabletFrame({
  page,
  children,
}: {
  page: { backgroundColor?: string } | null;
  children: React.ReactNode;
}) {
  const bg = page?.backgroundColor ?? '#ffffff';
  return (
    <div
      style={{
        padding: '20px 14px',
        backgroundColor: '#2a2a2a',
        borderRadius: 32,
        boxShadow: '0 0 0 2px #444, 0 20px 60px rgba(0,0,0,0.5)',
        position: 'relative',
        flexShrink: 0,
      }}
    >
      {/* Home indicator */}
      <div
        style={{
          position: 'absolute',
          bottom: 8,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 36,
          height: 4,
          backgroundColor: '#444',
          borderRadius: 2,
        }}
      />
      {/* Camera dot */}
      <div
        style={{
          position: 'absolute',
          top: 10,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 8,
          height: 8,
          backgroundColor: '#3a3a3a',
          borderRadius: '50%',
          border: '1.5px solid #555',
        }}
      />
      <div
        style={{
          width: 768,
          height: 1024,
          backgroundColor: bg,
          borderRadius: 20,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        {children}
      </div>
    </div>
  );
}

function DesktopFrame({
  page,
  children,
}: {
  page: { backgroundColor?: string } | null;
  children: React.ReactNode;
}) {
  const bg = page?.backgroundColor ?? '#ffffff';
  return (
    <div style={{ flexShrink: 0 }}>
      {/* Screen bezel */}
      <div
        style={{
          padding: 16,
          paddingBottom: 12,
          backgroundColor: '#2a2a2a',
          borderRadius: '16px 16px 0 0',
          boxShadow: '0 0 0 2px #444',
        }}
      >
        {/* Camera dot */}
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: '#555',
            margin: '0 auto 10px',
          }}
        />
        {/* Screen */}
        <div
          style={{
            width: 1280,
            height: 800,
            backgroundColor: bg,
            borderRadius: 4,
            overflow: 'hidden',
            position: 'relative',
          }}
        >
          {children}
        </div>
      </div>
      {/* Chin/hinge */}
      <div
        style={{
          height: 14,
          backgroundColor: '#333',
          borderRadius: '0 0 2px 2px',
          boxShadow: '0 0 0 1px #444',
        }}
      />
      {/* Stand neck */}
      <div
        style={{
          width: 120,
          height: 20,
          backgroundColor: '#3a3a3a',
          margin: '0 auto',
          borderRadius: '0 0 6px 6px',
        }}
      />
      {/* Stand base */}
      <div
        style={{
          width: 220,
          height: 8,
          backgroundColor: '#444',
          margin: '0 auto',
          borderRadius: 4,
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        }}
      />
    </div>
  );
}

// ─────────────────────────────────────────────
// Main Preview Page
// ─────────────────────────────────────────────
export default function PreviewPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { currentUser, apps, getPagesForApp, getTablesForApp, updateApp } = useStore();

  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [devicePreview, setDevicePreview] = useState<DevicePreview>('mobile');
  const [pageHistory, setPageHistory] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);
  const [frameScale, setFrameScale] = useState(1);

  const app = apps.find(a => a.id === params.id) ?? null;
  const pages = app ? getPagesForApp(params.id) : [];
  const tables = app ? getTablesForApp(params.id) : [];

  // Auth & app guard
  useEffect(() => {
    if (!currentUser) { router.replace('/login'); return; }
    if (!app) { router.replace('/workspace'); return; }
  }, [currentUser, app, router]);

  // Set initial page
  useEffect(() => {
    if (pages.length === 0) return;
    if (currentPageId) return;
    const startPage =
      pages.find(p => p.isStartPageLoggedOut) ??
      pages[0];
    setCurrentPageId(startPage.id);
  }, [pages, currentPageId]);

  // Scale to fit viewport
  useEffect(() => {
    const updateScale = () => setFrameScale(getScale(devicePreview));
    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, [devicePreview]);

  const currentPage = pages.find(p => p.id === currentPageId) ?? pages[0] ?? null;

  // Action handler
  const handleAction = useCallback((action: Action) => {
    switch (action.type) {
      case 'navigate':
        if (action.targetPageId) {
          setPageHistory(h => [...h, currentPageId!]);
          setCurrentPageId(action.targetPageId);
        }
        break;
      case 'back': {
        setPageHistory(h => {
          const prev = h[h.length - 1];
          if (prev) {
            setCurrentPageId(prev);
            return h.slice(0, -1);
          }
          return h;
        });
        break;
      }
      case 'external-link':
        if (action.targetUrl) {
          window.open(action.targetUrl, action.openInNewTab ? '_blank' : '_self');
        }
        break;
    }
  }, [currentPageId]);

  // Publish
  const handlePublish = () => {
    if (!app) return;
    updateApp(params.id, { published: true, publishedUrl: `/p/${params.id}` });
  };

  // Copy URL
  const handleCopyUrl = () => {
    if (!app?.publishedUrl) return;
    const url = `${window.location.origin}${app.publishedUrl}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  // Previous / Next page navigation
  const currentPageIndex = pages.findIndex(p => p.id === currentPageId);
  const prevPage = currentPageIndex > 0 ? pages[currentPageIndex - 1] : null;
  const nextPage = currentPageIndex < pages.length - 1 ? pages[currentPageIndex + 1] : null;

  const goToPrevPage = () => {
    if (prevPage) {
      setPageHistory(h => [...h, currentPageId!]);
      setCurrentPageId(prevPage.id);
    }
  };
  const goToNextPage = () => {
    if (nextPage) {
      setPageHistory(h => [...h, currentPageId!]);
      setCurrentPageId(nextPage.id);
    }
  };

  // Device icons (SVG, no emoji)
  const deviceIcons: Record<DevicePreview, React.ReactNode> = {
    mobile: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="5" y="2" width="14" height="20" rx="2" />
        <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
    tablet: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="4" y="2" width="16" height="20" rx="2" />
        <circle cx="12" cy="18" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
    desktop: (
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <path d="M8 21h8M12 17v4" />
      </svg>
    ),
  };

  const deviceLabels: Record<DevicePreview, string> = {
    mobile: 'モバイル',
    tablet: 'タブレット',
    desktop: 'PC',
  };

  // Page content renderer (shared across frames)
  const pageContent = currentPage ? (
    currentPage.elements.length > 0 ? (
      currentPage.elements.map(el => (
        <ElementWrapper
          key={el.id}
          element={el}
          onAction={handleAction}
        />
      ))
    ) : (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <path d="M3 9h18M9 21V9" />
        </svg>
        <p style={{ color: '#9ca3af', fontSize: 13 }}>このページには要素がありません</p>
      </div>
    )
  ) : (
    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <p style={{ color: '#9ca3af', fontSize: 13 }}>ページが見つかりません</p>
    </div>
  );

  if (!currentUser || !app) return null;

  return (
    <div className="flex flex-col min-h-screen bg-gray-800">
      {/* ── Top Bar ─────────────────────────────────────── */}
      <div className="flex items-center justify-between px-4 h-14 bg-gray-900 border-b border-gray-700 flex-shrink-0">
        {/* Left: Back button + app name + badge */}
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <button
            onClick={() => router.push(`/builder/${params.id}`)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-gray-800 text-sm transition-colors flex-shrink-0"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            閉じる
          </button>

          <div className="w-px h-5 bg-gray-700 flex-shrink-0" />

          <div className="flex items-center gap-2 min-w-0">
            <span className="text-white text-sm font-semibold truncate">{app.name}</span>
            <span
              className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-medium flex-shrink-0"
              style={{ backgroundColor: 'rgba(30,200,165,0.15)', color: '#1ec8a5', border: '1px solid rgba(30,200,165,0.3)' }}
            >
              プレビュー
            </span>
          </div>
        </div>

        {/* Center: Device toggle */}
        <div className="flex items-center gap-1 bg-gray-800 rounded-xl p-1 flex-shrink-0">
          {(['mobile', 'tablet', 'desktop'] as const).map(key => (
            <button
              key={key}
              onClick={() => setDevicePreview(key)}
              title={deviceLabels[key]}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                devicePreview === key
                  ? 'text-white shadow-sm'
                  : 'text-gray-400 hover:text-white hover:bg-gray-700'
              }`}
              style={devicePreview === key ? { backgroundColor: '#1ec8a5' } : {}}
            >
              {deviceIcons[key]}
              <span className="hidden sm:inline">{deviceLabels[key]}</span>
            </button>
          ))}
        </div>

        {/* Right: Status + publish controls */}
        <div className="flex items-center gap-2 flex-1 justify-end">
          {/* Published status badge */}
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
              app.published
                ? 'bg-brand/20 text-brand border border-brand/40'
                : 'bg-gray-700 text-gray-400 border border-gray-600'
            }`}
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${app.published ? 'bg-brand animate-pulse' : 'bg-gray-500'}`}
            />
            {app.published ? '公開中' : '未公開'}
          </span>

          {/* Copy URL */}
          {app.published && app.publishedUrl && (
            <button
              onClick={handleCopyUrl}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-700 hover:bg-gray-600 text-gray-300 hover:text-white rounded-lg text-xs transition-colors"
            >
              {copied ? (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  コピー済み
                </>
              ) : (
                <>
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  このURLをコピー
                </>
              )}
            </button>
          )}

          {/* Publish button */}
          {!app.published && (
            <button
              onClick={handlePublish}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-colors"
              style={{ backgroundColor: '#1ec8a5' }}
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 2L11 13" />
                <path d="M22 2L15 22 11 13 2 9l20-7z" />
              </svg>
              公開する
            </button>
          )}
        </div>
      </div>

      {/* ── Main Content: Device Frame ────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-start py-10 overflow-auto bg-gray-800">
        <div
          style={{
            transform: `scale(${frameScale})`,
            transformOrigin: 'top center',
          }}
        >
          {devicePreview === 'mobile' && (
            <MobileFrame page={currentPage}>
              {pageContent}
            </MobileFrame>
          )}
          {devicePreview === 'tablet' && (
            <TabletFrame page={currentPage}>
              {pageContent}
            </TabletFrame>
          )}
          {devicePreview === 'desktop' && (
            <DesktopFrame page={currentPage}>
              {pageContent}
            </DesktopFrame>
          )}
        </div>
      </div>

      {/* ── Bottom Bar: Page Navigation ──────────────── */}
      <div className="flex-shrink-0 bg-gray-900 border-t border-gray-700">
        {/* Page list tabs */}
        {pages.length > 0 && (
          <div className="flex items-center justify-center gap-2 py-3 px-4 overflow-x-auto">
            {pages.map(p => (
              <button
                key={p.id}
                onClick={() => {
                  if (p.id !== currentPageId) {
                    setPageHistory(h => [...h, currentPageId!]);
                    setCurrentPageId(p.id);
                  }
                }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all ${
                  p.id === currentPageId
                    ? 'text-white shadow-sm'
                    : 'text-white/60 hover:text-white/90 hover:bg-white/20'
                }`}
                style={
                  p.id === currentPageId
                    ? { backgroundColor: '#1ec8a5' }
                    : { backgroundColor: 'rgba(255,255,255,0.08)' }
                }
              >
                {p.isStartPageLoggedOut && '▶ '}{p.name}
              </button>
            ))}
          </div>
        )}

        {/* Prev / Page name / Next */}
        <div className="flex items-center justify-between max-w-sm mx-auto px-4 pb-3">
          <button
            onClick={goToPrevPage}
            disabled={!prevPage}
            className={`flex items-center gap-1 text-xs transition-colors ${
              prevPage ? 'text-gray-300 hover:text-white' : 'text-gray-600 cursor-not-allowed'
            }`}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="15 18 9 12 15 6" />
            </svg>
            {prevPage ? prevPage.name : '前のページ'}
          </button>

          <div className="flex flex-col items-center gap-0.5">
            <span className="text-white text-sm font-medium">
              {currentPage?.name ?? '-'}
            </span>
            <span className="text-gray-500 text-[11px]">
              {currentPageIndex + 1} / {pages.length}
            </span>
          </div>

          <button
            onClick={goToNextPage}
            disabled={!nextPage}
            className={`flex items-center gap-1 text-xs transition-colors ${
              nextPage ? 'text-gray-300 hover:text-white' : 'text-gray-600 cursor-not-allowed'
            }`}
          >
            {nextPage ? nextPage.name : '次のページ'}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Element wrapper that handles click → action
// ─────────────────────────────────────────────
function ElementWrapper({
  element,
  onAction,
}: {
  element: Element;
  onAction: (action: Action) => void;
}) {
  const s = element.style;

  const handleClick = (e: React.MouseEvent) => {
    if (!element.actions || element.actions.length === 0) return;
    e.stopPropagation();
    // Execute first action (primary)
    onAction(element.actions[0]);
  };

  const isInteractive =
    element.type === 'button' ||
    element.type === 'button2' ||
    (element.actions && element.actions.length > 0);

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'absolute',
        left: s.x ?? 0,
        top: s.y ?? 0,
        width: typeof s.width === 'number' ? s.width : (s.width ?? 'auto'),
        height: typeof s.height === 'number' ? s.height : (s.height ?? 'auto'),
        opacity: s.opacity !== undefined ? s.opacity / 100 : 1,
        zIndex: s.zIndex ?? 1,
        cursor: isInteractive ? 'pointer' : 'default',
      }}
    >
      <PreviewElementContent element={element} />
    </div>
  );
}
