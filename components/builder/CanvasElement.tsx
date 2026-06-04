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

    // --- NEW ELEMENT TYPES ---

    case 'check':
      return (
        <div className="w-full h-full flex items-center gap-2 px-2">
          <div
            className="w-5 h-5 flex-shrink-0 rounded flex items-center justify-center"
            style={{ backgroundColor: s.backgroundColor ?? '#1ec8a5' }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <span className="text-sm text-gray-700">{element.label ?? 'チェック項目'}</span>
        </div>
      );

    case 'card-list':
      return (
        <div
          className="w-full h-full overflow-hidden space-y-2 p-2"
          style={{ backgroundColor: s.backgroundColor ?? '#f9fafb', borderRadius: s.borderRadius ?? 8 }}
        >
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
        <div
          className="w-full h-full overflow-hidden"
          style={{ backgroundColor: s.backgroundColor ?? '#ffffff', borderRadius: s.borderRadius ?? 0 }}
        >
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
        <div
          className="w-full h-full flex flex-wrap gap-1.5 items-start content-start p-2"
          style={{ backgroundColor: s.backgroundColor ?? 'transparent' }}
        >
          {['タグ1', 'タグ2', 'タグ3', 'タグ4'].map(tag => (
            <div
              key={tag}
              className="px-2 py-0.5 rounded-full text-[11px] font-medium"
              style={{ backgroundColor: s.color ? `${s.color}22` : '#1ec8a522', color: s.color ?? '#1ec8a5' }}
            >
              {tag}
            </div>
          ))}
        </div>
      );

    case 'avatar-list':
      return (
        <div className="w-full h-full flex items-center px-2">
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className="w-8 h-8 rounded-full border-2 border-white bg-gray-300 flex-shrink-0 -ml-2 first:ml-0 flex items-center justify-center text-xs font-semibold text-gray-600"
              style={{ zIndex: 10 - i }}
            >
              {i}
            </div>
          ))}
          <span className="ml-3 text-xs text-gray-500">+12</span>
        </div>
      );

    case 'stack-carousel':
      return (
        <div
          className="w-full h-full relative flex items-center justify-center overflow-hidden"
          style={{ backgroundColor: s.backgroundColor ?? '#f3f4f6', borderRadius: s.borderRadius ?? 12 }}
        >
          <div className="absolute inset-4 rounded-lg bg-gray-300 transform rotate-3 opacity-50" />
          <div className="absolute inset-3 rounded-lg bg-gray-200 transform -rotate-2 opacity-70" />
          <div className="absolute inset-2 rounded-lg bg-white shadow flex items-center justify-center">
            <span className="text-xs text-gray-400">スタック</span>
          </div>
        </div>
      );

    case 'barcode':
      return (
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-1 p-2"
          style={{ backgroundColor: s.backgroundColor ?? '#ffffff', borderRadius: s.borderRadius ?? 0 }}
        >
          <div className="flex items-end gap-px h-10">
            {Array.from({ length: 28 }, (_, i) => (
              <div
                key={i}
                className="bg-gray-800"
                style={{
                  width: i % 3 === 0 ? 3 : 2,
                  height: i % 5 === 0 ? '100%' : i % 2 === 0 ? '80%' : '90%',
                }}
              />
            ))}
          </div>
          <span className="text-[10px] tracking-widest text-gray-600">123456789</span>
        </div>
      );

    case 'qr-code':
      return (
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-1"
          style={{ backgroundColor: s.backgroundColor ?? '#ffffff', borderRadius: s.borderRadius ?? 0 }}
        >
          <div className="grid grid-cols-5 gap-px p-1 bg-white">
            {Array.from({ length: 25 }, (_, i) => (
              <div
                key={i}
                className="w-3 h-3"
                style={{ backgroundColor: [0,1,2,5,6,7,10,12,17,18,19,20,21,23,24].includes(i) ? '#1f2937' : '#ffffff' }}
              />
            ))}
          </div>
          <span className="text-[9px] text-gray-400">QRコード</span>
        </div>
      );

    case 'line-social':
      return (
        <div
          className="w-full h-full flex items-center justify-center rounded"
          style={{
            backgroundColor: s.backgroundColor ?? '#06C755',
            borderRadius: s.borderRadius ?? 8,
          }}
        >
          <svg width="28" height="28" viewBox="0 0 48 48" fill="white">
            <path d="M24 4C12.95 4 4 11.82 4 21.5c0 6.26 4.07 11.76 10.2 14.88-.45 1.67-1.63 6.07-1.87 7.02-.29 1.18.43 1.16 0.91.85l8.52-5.63c.7.1 1.42.15 2.24.15 11.05 0 20-7.82 20-17.5S35.05 4 24 4z"/>
          </svg>
        </div>
      );

    case 'map-element':
      return (
        <div
          className="w-full h-full relative overflow-hidden"
          style={{ backgroundColor: '#e5e7eb', borderRadius: s.borderRadius ?? 0 }}
        >
          {/* Simple map placeholder grid */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute inset-0" style={{
              backgroundImage: 'linear-gradient(#9ca3af 1px, transparent 1px), linear-gradient(90deg, #9ca3af 1px, transparent 1px)',
              backgroundSize: '20px 20px',
            }} />
          </div>
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
        <div
          className="w-full h-full overflow-hidden"
          style={{ backgroundColor: '#ffffff', borderRadius: s.borderRadius ?? 0 }}
        >
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
            <div className="h-2 bg-gray-100 rounded w-2/3" />
          </div>
        </div>
      );

    case 'youtube-element':
      return (
        <div
          className="w-full h-full flex items-center justify-center relative overflow-hidden"
          style={{ backgroundColor: '#000000', borderRadius: s.borderRadius ?? 0 }}
        >
          <div className="absolute inset-0 bg-gray-900 opacity-80" />
          <div className="relative flex flex-col items-center gap-2">
            <div className="w-12 h-8 bg-red-600 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            </div>
            <span className="text-[10px] text-white opacity-70">YouTube</span>
          </div>
        </div>
      );

    case 'vimeo-element':
      return (
        <div
          className="w-full h-full flex items-center justify-center relative overflow-hidden"
          style={{ backgroundColor: '#1ab7ea', borderRadius: s.borderRadius ?? 0 }}
        >
          <div className="flex flex-col items-center gap-1">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
              <path d="M22 7.42c-.09 2.01-1.49 4.76-4.2 8.24C15.02 19.2 12.65 21 10.6 21c-1.26 0-2.33-1.16-3.2-3.49l-1.74-6.38C5.03 8.8 4.34 7.64 3.6 7.64c-.16 0-.71.33-1.66.99L1 7.51c1.04-.92 2.07-1.83 3.08-2.76C5.5 3.52 6.55 2.88 7.24 2.8c1.66-.16 2.68.97 3.07 3.4.41 2.62.7 4.25.86 4.9.48 2.16 1 3.24 1.55 3.24.44 0 1.1-.69 1.98-2.08.88-1.39 1.35-2.44 1.41-3.17.12-1.2-.34-1.8-1.41-1.8-.5 0-1.02.11-1.55.34.97-3.15 2.8-4.68 5.53-4.6C20.6 3.11 22.12 4.56 22 7.42z"/>
            </svg>
            <span className="text-[10px] text-white opacity-90">Vimeo</span>
          </div>
        </div>
      );

    case 'stamp-element':
      return (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ backgroundColor: s.backgroundColor ?? 'transparent' }}
        >
          <div
            className="w-16 h-16 rounded-full border-4 flex items-center justify-center"
            style={{ borderColor: s.color ?? '#1ec8a5', opacity: 0.85 }}
          >
            <span className="text-[11px] font-bold tracking-tight" style={{ color: s.color ?? '#1ec8a5' }}>
              STAMP
            </span>
          </div>
        </div>
      );

    case 'stamp-card':
      return (
        <div
          className="w-full h-full overflow-hidden p-2"
          style={{ backgroundColor: s.backgroundColor ?? '#fff8e6', borderRadius: s.borderRadius ?? 12 }}
        >
          <div className="text-[10px] font-semibold text-gray-600 mb-1.5">スタンプカード</div>
          <div className="grid grid-cols-5 gap-1">
            {Array.from({ length: 10 }, (_, i) => (
              <div
                key={i}
                className="aspect-square rounded-full flex items-center justify-center border-2"
                style={{
                  borderColor: i < 4 ? '#1ec8a5' : '#e5e7eb',
                  backgroundColor: i < 4 ? '#1ec8a5' : 'transparent',
                }}
              >
                {i < 4 && (
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      );

    case 'lottie-element':
      return (
        <div
          className="w-full h-full flex flex-col items-center justify-center gap-1"
          style={{ backgroundColor: s.backgroundColor ?? 'transparent' }}
        >
          <div className="relative w-12 h-12">
            <div className="absolute inset-0 rounded-full border-4 border-brand opacity-30 animate-ping" />
            <div className="absolute inset-2 rounded-full bg-brand opacity-60" />
          </div>
          <span className="text-[10px] text-gray-400">Lottie</span>
        </div>
      );

    case 'chat-element':
      return (
        <div
          className="w-full h-full overflow-hidden p-2 space-y-2"
          style={{ backgroundColor: s.backgroundColor ?? '#f9fafb', borderRadius: s.borderRadius ?? 8 }}
        >
          <div className="flex items-end gap-1.5">
            <div className="w-6 h-6 rounded-full bg-gray-300 flex-shrink-0" />
            <div className="max-w-[70%] bg-white rounded-2xl rounded-bl-sm px-2.5 py-1.5 shadow-sm">
              <div className="h-2 bg-gray-200 rounded w-20" />
            </div>
          </div>
          <div className="flex items-end gap-1.5 justify-end">
            <div className="max-w-[70%] rounded-2xl rounded-br-sm px-2.5 py-1.5" style={{ backgroundColor: '#1ec8a5' }}>
              <div className="h-2 bg-white bg-opacity-50 rounded w-16" />
            </div>
          </div>
          <div className="flex items-end gap-1.5">
            <div className="w-6 h-6 rounded-full bg-gray-300 flex-shrink-0" />
            <div className="max-w-[70%] bg-white rounded-2xl rounded-bl-sm px-2.5 py-1.5 shadow-sm">
              <div className="h-2 bg-gray-200 rounded w-24" />
            </div>
          </div>
        </div>
      );

    case 'star-rating':
      return (
        <div className="w-full h-full flex items-center justify-center gap-1">
          {[1, 2, 3, 4, 5].map(i => (
            <svg
              key={i}
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={i <= 4 ? (s.color ?? '#f59e0b') : 'none'}
              stroke={s.color ?? '#f59e0b'}
              strokeWidth="1.5"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          ))}
        </div>
      );

    default:
      return (
        <div
          className="w-full h-full flex items-center justify-center"
          style={{ backgroundColor: s.backgroundColor ?? '#f3f4f6', borderRadius: s.borderRadius ?? 4 }}
        >
          <span className="text-xs text-gray-300">{/* placeholder */}</span>
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

  // Improved drag state using a single ref — no closure staleness issues
  const dragState = useRef<{
    startX: number;
    startY: number;
    origX: number;
    origY: number;
  } | null>(null);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();

      if (!isSelected) {
        onSelect();
        return;
      }

      if (element.locked) return;

      e.preventDefault();

      dragState.current = {
        startX: e.clientX,
        startY: e.clientY,
        origX: s.x ?? 0,
        origY: s.y ?? 0,
      };

      const onMove = (me: MouseEvent) => {
        if (!dragState.current) return;
        const dx = (me.clientX - dragState.current.startX) / scale;
        const dy = (me.clientY - dragState.current.startY) / scale;
        onUpdate({
          style: {
            ...element.style,
            x: Math.round(dragState.current.origX + dx),
            y: Math.round(dragState.current.origY + dy),
          },
        });
      };

      const onUp = () => {
        dragState.current = null;
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mouseup', onUp);
      };

      window.addEventListener('mousemove', onMove);
      window.addEventListener('mouseup', onUp);
    },
    [element, isSelected, onSelect, onUpdate, s.x, s.y, scale],
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
      onClick={e => e.stopPropagation()}
      data-element="true"
      className={cn(
        'group select-none',
        isSelected ? 'cursor-move' : 'cursor-pointer',
        element.locked && 'cursor-not-allowed',
      )}
    >
      {/* Element content */}
      <ElementContent element={element} />

      {/* Selection overlay — clean blue outline + handles */}
      {isSelected && (
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            outline: '2px solid #3b82f6',
            outlineOffset: 1,
            borderRadius: typeof s.borderRadius === 'number' ? s.borderRadius : 0,
          }}
        >
          {/* Corner + edge-midpoint handles (pointer-events re-enabled per handle) */}
          {(['nw', 'n', 'ne', 'e', 'se', 's', 'sw', 'w'] as const).map(pos => (
            <ResizeHandle key={pos} pos={pos} element={element} onUpdate={onUpdate} scale={scale} />
          ))}
        </div>
      )}

      {/* Delete button — outside the pointer-events:none overlay */}
      {isSelected && (
        <button
          onMouseDown={e => {
            e.stopPropagation();
            onDelete();
          }}
          className="absolute -top-3 -right-3 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center z-50 hover:bg-red-600 shadow-md pointer-events-auto"
          style={{ fontSize: 14, lineHeight: 1 }}
        >
          ×
        </button>
      )}
    </div>
  );
}

// --- Resize handle sub-component ---
type HandlePos = 'nw' | 'n' | 'ne' | 'e' | 'se' | 's' | 'sw' | 'w';

const HANDLE_STYLE: Record<HandlePos, React.CSSProperties> = {
  nw: { top: -4, left: -4, cursor: 'nw-resize' },
  n:  { top: -4, left: 'calc(50% - 3px)', cursor: 'n-resize' },
  ne: { top: -4, right: -4, cursor: 'ne-resize' },
  e:  { top: 'calc(50% - 3px)', right: -4, cursor: 'e-resize' },
  se: { bottom: -4, right: -4, cursor: 'se-resize' },
  s:  { bottom: -4, left: 'calc(50% - 3px)', cursor: 's-resize' },
  sw: { bottom: -4, left: -4, cursor: 'sw-resize' },
  w:  { top: 'calc(50% - 3px)', left: -4, cursor: 'w-resize' },
};

function ResizeHandle({
  pos,
  element,
  onUpdate,
  scale,
}: {
  pos: HandlePos;
  element: Element;
  onUpdate: (u: Partial<Element>) => void;
  scale: number;
}) {
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

      // Horizontal
      if (pos === 'e' || pos === 'ne' || pos === 'se') newW = Math.max(20, startW + dx);
      if (pos === 'w' || pos === 'nw' || pos === 'sw') { newW = Math.max(20, startW - dx); newX = startElemX + (startW - newW); }

      // Vertical
      if (pos === 's' || pos === 'se' || pos === 'sw') newH = Math.max(20, startH + dy);
      if (pos === 'n' || pos === 'ne' || pos === 'nw') { newH = Math.max(20, startH - dy); newY = startElemY + (startH - newH); }

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
      style={{
        position: 'absolute',
        width: 7,
        height: 7,
        backgroundColor: '#ffffff',
        border: '1.5px solid #3b82f6',
        borderRadius: 1,
        pointerEvents: 'auto',
        zIndex: 60,
        ...HANDLE_STYLE[pos],
      }}
    />
  );
}
