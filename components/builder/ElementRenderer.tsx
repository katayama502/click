'use client';

import React from 'react';
import {
  ChevronDown,
  Search,
  Upload,
  Bell,
  User,
  Home,
  List,
  Heart,
  Settings,
  Play,
} from 'lucide-react';
import type { Element, ElementType, ElementStyle, DBTable } from '@/lib/types';

// ============================================================
// Props
// ============================================================
interface ElementRendererProps {
  element: Element;
  tables?: DBTable[];
  /** interactive mode: preview / published app */
  interactive?: boolean;
  /** edit mode: canvas editor (pointer events disabled on inputs etc.) */
  editMode?: boolean;
  onAction?: (action: { type: string; targetPageId?: string; targetUrl?: string }) => void;
}

// ============================================================
// Style helpers
// ============================================================
function resolveStyle(style: ElementStyle): React.CSSProperties {
  return {
    width: style.width,
    height: style.height,
    backgroundColor: style.backgroundColor,
    color: style.color,
    fontSize: style.fontSize,
    fontWeight: style.fontWeight as React.CSSProperties['fontWeight'],
    fontFamily: style.fontFamily,
    borderRadius: style.borderRadius,
    padding: style.padding,
    border: style.border,
    opacity: style.opacity !== undefined ? style.opacity / 100 : undefined,
    zIndex: style.zIndex,
    textAlign: style.textAlign,
    boxShadow: style.boxShadow,
  };
}

// ============================================================
// Default styles per type
// ============================================================
export function getDefaultStyle(type: ElementType): ElementStyle {
  const base: ElementStyle = { x: 0, y: 0, opacity: 100, zIndex: 0 };

  switch (type) {
    case 'text':
      return { ...base, width: 200, height: 40, fontSize: 16, color: '#111827', textAlign: 'left' };
    case 'shape':
      return { ...base, width: 120, height: 120, backgroundColor: '#1ec8a5', borderRadius: 8 };
    case 'line':
      return { ...base, width: 200, height: 2, color: '#e5e7eb' };
    case 'icon':
      return { ...base, width: 48, height: 48, color: '#374151', fontSize: 24 };
    case 'image':
      return { ...base, width: 200, height: 150, borderRadius: 8 };
    case 'video':
      return { ...base, width: 280, height: 160, borderRadius: 8 };
    case 'button':
    case 'button2':
      return { ...base, width: 160, height: 44, backgroundColor: '#1ec8a5', color: '#ffffff', borderRadius: 8, fontSize: 14 };
    case 'switch-element':
      return { ...base, width: 160, height: 32, color: '#374151', fontSize: 14 };
    case 'toggle-element':
      return { ...base, width: 240, height: 48, color: '#374151', fontSize: 14 };
    case 'header':
      return { ...base, width: '100%', height: 56, backgroundColor: '#ffffff' };
    case 'tabbar':
      return { ...base, width: '100%', height: 56, backgroundColor: '#ffffff' };
    case 'form':
      return { ...base, width: 320, height: 'auto', backgroundColor: '#ffffff', borderRadius: 12 };
    case 'input':
      return { ...base, width: 240, height: 44, borderRadius: 8, fontSize: 14 };
    case 'password-input':
      return { ...base, width: 240, height: 44, borderRadius: 8, fontSize: 14 };
    case 'date-input':
      return { ...base, width: 240, height: 44, borderRadius: 8, fontSize: 14 };
    case 'file-input':
      return { ...base, width: 240, height: 96, borderRadius: 8 };
    case 'image-input':
      return { ...base, width: 240, height: 96, borderRadius: 8 };
    case 'list':
      return { ...base, width: 320, height: 240, borderRadius: 12 };
    case 'horizontal-list':
      return { ...base, width: 320, height: 100, borderRadius: 12 };
    case 'db-table':
      return { ...base, width: 360, height: 200, borderRadius: 12 };
    case 'carousel':
      return { ...base, width: 320, height: 200, borderRadius: 12 };
    case 'calendar':
      return { ...base, width: 320, height: 'auto', backgroundColor: '#ffffff', borderRadius: 12 };
    case 'dropdown':
      return { ...base, width: 240, height: 44, borderRadius: 8, fontSize: 14 };
    case 'search-element':
      return { ...base, width: 240, height: 44, borderRadius: 22, fontSize: 14 };
    default:
      return { ...base, width: 120, height: 40 };
  }
}

// ============================================================
// Main component
// ============================================================
export default function ElementRenderer({
  element,
  tables,
  interactive = false,
  editMode = false,
  onAction,
}: ElementRendererProps) {
  const { type, style, content, label, placeholder, src } = element;

  const s = style;

  function handleButtonClick() {
    if (!interactive || !onAction) return;
    const firstAction = element.actions?.[0];
    if (firstAction) {
      onAction({
        type: firstAction.type,
        targetPageId: firstAction.targetPageId,
        targetUrl: firstAction.targetUrl,
      });
    }
  }

  // ── text ─────────────────────────────────────────────────
  if (type === 'text') {
    return (
      <div
        style={{
          width: s.width,
          height: s.height,
          color: s.color || '#111827',
          fontSize: s.fontSize || 16,
          fontWeight: s.fontWeight as React.CSSProperties['fontWeight'],
          fontFamily: s.fontFamily,
          textAlign: s.textAlign || 'left',
          opacity: s.opacity !== undefined ? s.opacity / 100 : 1,
          padding: s.padding || '0',
          whiteSpace: 'pre-wrap',
          wordBreak: 'break-word',
          lineHeight: 1.5,
        }}
      >
        {content || 'テキスト'}
      </div>
    );
  }

  // ── shape ────────────────────────────────────────────────
  if (type === 'shape') {
    return (
      <div
        style={{
          width: s.width,
          height: s.height,
          backgroundColor: s.backgroundColor || '#1ec8a5',
          borderRadius: s.borderRadius,
          border: s.border,
          opacity: s.opacity !== undefined ? s.opacity / 100 : 1,
          boxShadow: s.boxShadow,
        }}
      />
    );
  }

  // ── line ─────────────────────────────────────────────────
  if (type === 'line') {
    return (
      <hr
        style={{
          width: s.width || '100%',
          border: 'none',
          borderTop: `${s.borderWidth || 1}px solid ${s.color || '#e5e7eb'}`,
          opacity: s.opacity !== undefined ? s.opacity / 100 : 1,
          margin: 0,
        }}
      />
    );
  }

  // ── icon ─────────────────────────────────────────────────
  if (type === 'icon') {
    return (
      <div
        style={{
          width: s.width,
          height: s.height,
          color: s.color || '#374151',
          fontSize: s.fontSize || 24,
          opacity: s.opacity !== undefined ? s.opacity / 100 : 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        ★
      </div>
    );
  }

  // ── image ────────────────────────────────────────────────
  if (type === 'image') {
    return (
      <div
        style={{
          width: s.width,
          height: s.height,
          overflow: 'hidden',
          borderRadius: s.borderRadius,
          backgroundColor: '#f3f4f6',
          flexShrink: 0,
          opacity: s.opacity !== undefined ? s.opacity / 100 : 1,
        }}
      >
        {src ? (
          <img src={src} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 4,
              color: '#9ca3af',
            }}
          >
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <path d="M21 15l-5-5L5 21" />
            </svg>
            <span style={{ fontSize: 12 }}>画像</span>
          </div>
        )}
      </div>
    );
  }

  // ── video ────────────────────────────────────────────────
  if (type === 'video') {
    return (
      <div
        style={{
          width: s.width,
          height: s.height || 160,
          backgroundColor: '#000',
          borderRadius: s.borderRadius,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: s.opacity !== undefined ? s.opacity / 100 : 1,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Play size={24} color="#ffffff" fill="#ffffff" />
        </div>
      </div>
    );
  }

  // ── button / button2 ─────────────────────────────────────
  if (type === 'button' || type === 'button2') {
    return (
      <button
        onClick={interactive ? handleButtonClick : undefined}
        style={{
          width: s.width,
          height: s.height || 44,
          backgroundColor: s.backgroundColor || '#1ec8a5',
          color: s.color || '#ffffff',
          borderRadius: s.borderRadius ?? 8,
          fontSize: s.fontSize || 14,
          fontWeight: 500,
          border: s.border || 'none',
          opacity: s.opacity !== undefined ? s.opacity / 100 : 1,
          cursor: interactive ? 'pointer' : 'default',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: s.boxShadow,
          whiteSpace: 'nowrap',
          pointerEvents: editMode ? 'none' : undefined,
        }}
      >
        {content || 'ボタン'}
      </button>
    );
  }

  // ── switch-element ───────────────────────────────────────
  if (type === 'switch-element') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          width: s.width,
          height: s.height,
          opacity: s.opacity !== undefined ? s.opacity / 100 : 1,
        }}
      >
        <span style={{ color: s.color || '#374151', fontSize: s.fontSize || 14 }}>
          {label || 'スイッチ'}
        </span>
        <div
          style={{
            width: 44,
            height: 24,
            borderRadius: 12,
            backgroundColor: '#1ec8a5',
            position: 'relative',
            flexShrink: 0,
          }}
        >
          <div
            style={{
              position: 'absolute',
              right: 2,
              top: 2,
              width: 20,
              height: 20,
              borderRadius: '50%',
              backgroundColor: '#fff',
              boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }}
          />
        </div>
      </div>
    );
  }

  // ── toggle-element ───────────────────────────────────────
  if (type === 'toggle-element') {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '8px 12px',
          border: s.border || '1px solid #e5e7eb',
          borderRadius: s.borderRadius ?? 8,
          backgroundColor: s.backgroundColor || '#ffffff',
          width: s.width,
          height: s.height,
          opacity: s.opacity !== undefined ? s.opacity / 100 : 1,
          cursor: interactive ? 'pointer' : 'default',
        }}
      >
        <span style={{ fontSize: s.fontSize || 14, color: s.color || '#374151' }}>
          {label || 'トグル'}
        </span>
        <ChevronDown size={16} color="#9ca3af" />
      </div>
    );
  }

  // ── header ───────────────────────────────────────────────
  if (type === 'header') {
    return (
      <div
        style={{
          width: s.width ?? '100%',
          height: s.height || 56,
          backgroundColor: s.backgroundColor || '#ffffff',
          display: 'flex',
          alignItems: 'center',
          padding: '0 16px',
          borderBottom: '1px solid #e5e7eb',
          opacity: s.opacity !== undefined ? s.opacity / 100 : 1,
          flexShrink: 0,
          boxShadow: s.boxShadow,
        }}
      >
        <span style={{ fontWeight: 'bold', fontSize: 18, color: s.color || '#111827' }}>
          {content || 'ヘッダー'}
        </span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          <Bell size={20} color="#6b7280" />
          <User size={20} color="#6b7280" />
        </div>
      </div>
    );
  }

  // ── tabbar ───────────────────────────────────────────────
  if (type === 'tabbar') {
    const tabs = [
      { label: 'ホーム', Icon: Home },
      { label: 'リスト', Icon: List },
      { label: 'お気に入り', Icon: Heart },
      { label: '設定', Icon: Settings },
    ];
    return (
      <div
        style={{
          width: s.width ?? '100%',
          height: s.height || 56,
          backgroundColor: s.backgroundColor || '#ffffff',
          display: 'flex',
          borderTop: '1px solid #e5e7eb',
          opacity: s.opacity !== undefined ? s.opacity / 100 : 1,
          flexShrink: 0,
        }}
      >
        {tabs.map(({ label: tabLabel, Icon }, idx) => (
          <div
            key={tabLabel}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
            }}
          >
            <Icon size={20} color={idx === 0 ? '#1ec8a5' : '#9ca3af'} />
            <span style={{ fontSize: 10, color: idx === 0 ? '#1ec8a5' : '#9ca3af' }}>
              {tabLabel}
            </span>
          </div>
        ))}
      </div>
    );
  }

  // ── input ────────────────────────────────────────────────
  if (type === 'input') {
    return (
      <input
        type="text"
        placeholder={placeholder || 'テキストを入力'}
        style={{
          width: s.width,
          height: s.height || 44,
          border: s.border || '1px solid #d1d5db',
          borderRadius: s.borderRadius ?? 8,
          padding: '0 12px',
          fontSize: s.fontSize || 14,
          backgroundColor: s.backgroundColor || '#ffffff',
          color: s.color || '#374151',
          outline: 'none',
          opacity: s.opacity !== undefined ? s.opacity / 100 : 1,
          pointerEvents: editMode ? 'none' : undefined,
        }}
        disabled={!interactive}
        readOnly={editMode}
      />
    );
  }

  // ── password-input ───────────────────────────────────────
  if (type === 'password-input') {
    return (
      <input
        type="password"
        placeholder={placeholder || 'パスワードを入力'}
        style={{
          width: s.width,
          height: s.height || 44,
          border: s.border || '1px solid #d1d5db',
          borderRadius: s.borderRadius ?? 8,
          padding: '0 12px',
          fontSize: s.fontSize || 14,
          backgroundColor: s.backgroundColor || '#ffffff',
          color: s.color || '#374151',
          outline: 'none',
          opacity: s.opacity !== undefined ? s.opacity / 100 : 1,
          pointerEvents: editMode ? 'none' : undefined,
        }}
        disabled={!interactive}
        readOnly={editMode}
      />
    );
  }

  // ── date-input ───────────────────────────────────────────
  if (type === 'date-input') {
    return (
      <input
        type="date"
        placeholder={placeholder || '日付を選択'}
        style={{
          width: s.width,
          height: s.height || 44,
          border: s.border || '1px solid #d1d5db',
          borderRadius: s.borderRadius ?? 8,
          padding: '0 12px',
          fontSize: s.fontSize || 14,
          backgroundColor: s.backgroundColor || '#ffffff',
          color: s.color || '#374151',
          outline: 'none',
          opacity: s.opacity !== undefined ? s.opacity / 100 : 1,
          pointerEvents: editMode ? 'none' : undefined,
        }}
        disabled={!interactive}
        readOnly={editMode}
      />
    );
  }

  // ── file-input ───────────────────────────────────────────
  if (type === 'file-input') {
    return (
      <div
        style={{
          width: s.width,
          height: s.height || 96,
          border: '2px dashed #d1d5db',
          borderRadius: s.borderRadius ?? 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: '#fafafa',
          cursor: interactive ? 'pointer' : 'default',
          opacity: s.opacity !== undefined ? s.opacity / 100 : 1,
        }}
      >
        <Upload size={24} color="#9ca3af" />
        <span style={{ color: '#9ca3af', fontSize: 14 }}>ファイルをアップロード</span>
      </div>
    );
  }

  // ── image-input ──────────────────────────────────────────
  if (type === 'image-input') {
    return (
      <div
        style={{
          width: s.width,
          height: s.height || 96,
          border: '2px dashed #d1d5db',
          borderRadius: s.borderRadius ?? 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          backgroundColor: '#fafafa',
          cursor: interactive ? 'pointer' : 'default',
          opacity: s.opacity !== undefined ? s.opacity / 100 : 1,
        }}
      >
        <Upload size={24} color="#9ca3af" />
        <span style={{ color: '#9ca3af', fontSize: 14 }}>画像をアップロード</span>
      </div>
    );
  }

  // ── form ─────────────────────────────────────────────────
  if (type === 'form') {
    return (
      <div
        style={{
          width: s.width,
          backgroundColor: s.backgroundColor || '#ffffff',
          borderRadius: s.borderRadius ?? 12,
          padding: 16,
          border: s.border || '1px solid #e5e7eb',
          opacity: s.opacity !== undefined ? s.opacity / 100 : 1,
          boxShadow: s.boxShadow,
        }}
      >
        <div style={{ marginBottom: 12, fontWeight: 'bold', fontSize: s.fontSize || 15, color: s.color || '#111827' }}>
          {label || 'フォーム'}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ marginBottom: 12 }}>
            <div
              style={{
                height: 12,
                width: '40%',
                backgroundColor: '#e5e7eb',
                borderRadius: 4,
                marginBottom: 6,
              }}
            />
            <div
              style={{
                height: 40,
                backgroundColor: '#f9fafb',
                border: '1px solid #e5e7eb',
                borderRadius: 8,
              }}
            />
          </div>
        ))}
        <button
          style={{
            width: '100%',
            height: 44,
            backgroundColor: '#1ec8a5',
            color: '#fff',
            borderRadius: 8,
            border: 'none',
            fontWeight: 600,
            fontSize: 14,
            cursor: interactive ? 'pointer' : 'default',
            pointerEvents: editMode ? 'none' : undefined,
          }}
        >
          送信
        </button>
      </div>
    );
  }

  // ── list ─────────────────────────────────────────────────
  if (type === 'list') {
    return (
      <div
        style={{
          width: s.width,
          height: s.height,
          backgroundColor: s.backgroundColor || '#ffffff',
          borderRadius: s.borderRadius ?? 12,
          overflow: 'hidden',
          border: s.border || '1px solid #e5e7eb',
          opacity: s.opacity !== undefined ? s.opacity / 100 : 1,
        }}
      >
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '12px 16px',
              borderBottom: '1px solid #f3f4f6',
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                backgroundColor: '#e5e7eb',
                marginRight: 12,
                flexShrink: 0,
              }}
            />
            <div>
              <div
                style={{
                  height: 12,
                  width: 120,
                  backgroundColor: '#e5e7eb',
                  borderRadius: 4,
                  marginBottom: 6,
                }}
              />
              <div
                style={{
                  height: 10,
                  width: 80,
                  backgroundColor: '#f3f4f6',
                  borderRadius: 4,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // ── horizontal-list ──────────────────────────────────────
  if (type === 'horizontal-list') {
    return (
      <div
        style={{
          width: s.width,
          height: s.height || 100,
          backgroundColor: s.backgroundColor || '#ffffff',
          borderRadius: s.borderRadius ?? 12,
          overflow: 'hidden',
          border: s.border || '1px solid #e5e7eb',
          opacity: s.opacity !== undefined ? s.opacity / 100 : 1,
          display: 'flex',
          gap: 12,
          padding: '12px 16px',
          alignItems: 'center',
        }}
      >
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 6,
              flexShrink: 0,
            }}
          >
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: 12,
                backgroundColor: '#e5e7eb',
              }}
            />
            <div
              style={{
                height: 8,
                width: 40,
                backgroundColor: '#f3f4f6',
                borderRadius: 4,
              }}
            />
          </div>
        ))}
      </div>
    );
  }

  // ── db-table ─────────────────────────────────────────────
  if (type === 'db-table') {
    const headers = ['名前', '値', '日付'];
    return (
      <div
        style={{
          width: s.width,
          height: s.height,
          backgroundColor: s.backgroundColor || '#ffffff',
          borderRadius: s.borderRadius ?? 12,
          overflow: 'hidden',
          border: s.border || '1px solid #e5e7eb',
          opacity: s.opacity !== undefined ? s.opacity / 100 : 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            backgroundColor: '#f9fafb',
            borderBottom: '1px solid #e5e7eb',
          }}
        >
          {headers.map((h) => (
            <div
              key={h}
              style={{
                flex: 1,
                padding: '8px 12px',
                fontSize: 12,
                fontWeight: 'bold',
                color: '#374151',
              }}
            >
              {h}
            </div>
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ display: 'flex', borderBottom: '1px solid #f3f4f6' }}>
            {[1, 2, 3].map((j) => (
              <div key={j} style={{ flex: 1, padding: '8px 12px' }}>
                <div style={{ height: 10, backgroundColor: '#e5e7eb', borderRadius: 4 }} />
              </div>
            ))}
          </div>
        ))}
      </div>
    );
  }

  // ── carousel ─────────────────────────────────────────────
  if (type === 'carousel') {
    return (
      <div
        style={{
          width: s.width,
          height: s.height || 200,
          borderRadius: s.borderRadius ?? 12,
          overflow: 'hidden',
          position: 'relative',
          backgroundColor: '#f3f4f6',
          opacity: s.opacity !== undefined ? s.opacity / 100 : 1,
          flexShrink: 0,
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            backgroundColor: '#e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <span style={{ color: '#9ca3af', fontSize: 14 }}>カルーセル</span>
        </div>
        {/* Dots */}
        <div
          style={{
            position: 'absolute',
            bottom: 8,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 4,
          }}
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: i === 0 ? '#1ec8a5' : '#d1d5db',
              }}
            />
          ))}
        </div>
        {/* Arrow buttons */}
        <button
          style={{
            position: 'absolute',
            left: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 28,
            height: 28,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.8)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 16,
            color: '#374151',
          }}
        >
          ‹
        </button>
        <button
          style={{
            position: 'absolute',
            right: 8,
            top: '50%',
            transform: 'translateY(-50%)',
            width: 28,
            height: 28,
            borderRadius: '50%',
            backgroundColor: 'rgba(255,255,255,0.8)',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            fontSize: 16,
            color: '#374151',
          }}
        >
          ›
        </button>
      </div>
    );
  }

  // ── calendar ─────────────────────────────────────────────
  if (type === 'calendar') {
    const days = ['日', '月', '火', '水', '木', '金', '土'];
    return (
      <div
        style={{
          width: s.width,
          backgroundColor: s.backgroundColor || '#ffffff',
          borderRadius: s.borderRadius ?? 12,
          border: s.border || '1px solid #e5e7eb',
          padding: 12,
          opacity: s.opacity !== undefined ? s.opacity / 100 : 1,
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 8,
          }}
        >
          <button
            style={{
              background: 'none',
              border: 'none',
              fontSize: 18,
              cursor: 'pointer',
              color: '#6b7280',
              padding: '0 4px',
            }}
          >
            ‹
          </button>
          <span style={{ fontWeight: 'bold', fontSize: 14, color: '#111827' }}>2026年6月</span>
          <button
            style={{
              background: 'none',
              border: 'none',
              fontSize: 18,
              cursor: 'pointer',
              color: '#6b7280',
              padding: '0 4px',
            }}
          >
            ›
          </button>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 2,
            fontSize: 11,
          }}
        >
          {days.map((d) => (
            <div
              key={d}
              style={{
                textAlign: 'center',
                color: '#9ca3af',
                padding: '2px 0',
                fontWeight: 600,
              }}
            >
              {d}
            </div>
          ))}
          {Array.from({ length: 30 }, (_, i) => (
            <div
              key={i}
              style={{
                textAlign: 'center',
                padding: '3px 0',
                borderRadius: 4,
                backgroundColor: i === 4 ? '#1ec8a5' : 'transparent',
                color: i === 4 ? '#fff' : '#374151',
                fontSize: 11,
              }}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── dropdown ─────────────────────────────────────────────
  if (type === 'dropdown') {
    return (
      <div
        style={{
          width: s.width,
          height: s.height || 44,
          border: s.border || '1px solid #d1d5db',
          borderRadius: s.borderRadius ?? 8,
          padding: '0 12px',
          backgroundColor: s.backgroundColor || '#ffffff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: interactive ? 'pointer' : 'default',
          opacity: s.opacity !== undefined ? s.opacity / 100 : 1,
        }}
      >
        <span style={{ color: s.color || '#374151', fontSize: s.fontSize || 14 }}>
          {content || '選択してください'}
        </span>
        <ChevronDown size={16} color="#9ca3af" />
      </div>
    );
  }

  // ── search-element ───────────────────────────────────────
  if (type === 'search-element') {
    return (
      <div
        style={{
          width: s.width,
          height: s.height || 44,
          position: 'relative',
          opacity: s.opacity !== undefined ? s.opacity / 100 : 1,
          flexShrink: 0,
        }}
      >
        <Search
          size={16}
          style={{
            position: 'absolute',
            left: 12,
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#9ca3af',
            pointerEvents: 'none',
          }}
        />
        <input
          placeholder={placeholder || '検索...'}
          style={{
            width: '100%',
            height: '100%',
            paddingLeft: 36,
            paddingRight: 12,
            border: s.border || '1px solid #d1d5db',
            borderRadius: s.borderRadius ?? 22,
            backgroundColor: s.backgroundColor || '#ffffff',
            fontSize: s.fontSize || 14,
            outline: 'none',
            color: s.color || '#374151',
            pointerEvents: editMode ? 'none' : undefined,
          }}
          disabled={!interactive}
          readOnly={editMode}
        />
      </div>
    );
  }

  // ── fallback ─────────────────────────────────────────────
  return (
    <div
      style={{
        width: s.width || 120,
        height: s.height || 40,
        backgroundColor: s.backgroundColor || '#f3f4f6',
        borderRadius: s.borderRadius ?? 4,
        border: '1px solid #e5e7eb',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        opacity: s.opacity !== undefined ? s.opacity / 100 : 1,
      }}
    >
      <span style={{ fontSize: 12, color: '#9ca3af' }}>{type}</span>
    </div>
  );
}
