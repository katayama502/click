'use client';

import { AppElement } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ElementRendererProps {
  element: AppElement;
  isPreview?: boolean;
}

/** Validate that a URL is http(s) to prevent javascript: XSS */
function isSafeUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

export default function ElementRenderer({ element, isPreview = false }: ElementRendererProps) {
  const { type, props } = element;

  const baseStyle: React.CSSProperties = {
    color: props.color || undefined,
    backgroundColor: props.bgColor || undefined,
    fontSize: props.fontSize || undefined,
    fontWeight: props.fontWeight || undefined,
    padding: props.padding || undefined,
    margin: props.margin || undefined,
    borderRadius: props.borderRadius || undefined,
    width: props.width || undefined,
    height: props.height || undefined,
    textAlign: props.align || undefined,
  };

  switch (type) {
    case 'text':
      return (
        <p
          style={baseStyle}
          className={cn('text-gray-700 text-sm leading-relaxed', !props.padding && 'py-1')}
        >
          {props.text || 'テキストを入力してください'}
        </p>
      );

    case 'heading':
      return (
        <h2
          style={baseStyle}
          className={cn('text-gray-900 font-bold text-2xl', !props.padding && 'py-1')}
        >
          {props.text || '見出しを入力してください'}
        </h2>
      );

    case 'button': {
      const variant = props.variant || 'primary';
      const size = props.size || 'md';

      const variantClasses = {
        primary: 'bg-[#1ec8a5] text-white hover:bg-[#13a98a]',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
        outline: 'border-2 border-[#1ec8a5] text-[#1ec8a5] hover:bg-[#e6faf5]',
      };

      const sizeClasses = {
        sm: 'text-xs px-3 py-1.5 rounded-md',
        md: 'text-sm px-5 py-2.5 rounded-lg',
        lg: 'text-base px-7 py-3 rounded-xl',
      };

      const safeHref = props.href && isSafeUrl(props.href) ? props.href : undefined;

      if (isPreview && safeHref) {
        return (
          <a
            href={safeHref}
            target="_blank"
            rel="noopener noreferrer"
            style={baseStyle}
            className={cn(
              'inline-block font-semibold transition-colors duration-150 text-center',
              variantClasses[variant],
              sizeClasses[size],
            )}
          >
            {props.text || 'ボタン'}
          </a>
        );
      }

      return (
        <button
          style={baseStyle}
          className={cn(
            'font-semibold transition-colors duration-150 cursor-pointer',
            variantClasses[variant],
            sizeClasses[size],
          )}
          onClick={isPreview ? undefined : (e) => e.preventDefault()}
        >
          {props.text || 'ボタン'}
        </button>
      );
    }

    case 'image': {
      const safeSrc = props.src && isSafeUrl(props.src) ? props.src : null;
      if (safeSrc) {
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={safeSrc}
            alt={props.alt || ''}
            style={baseStyle}
            className="max-w-full h-auto rounded-lg"
          />
        );
      }
      return (
        <div
          style={baseStyle}
          className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center py-8 px-4"
        >
          <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-gray-400 text-xs">{props.alt || '画像URLを設定してください'}</span>
        </div>
      );
    }

    case 'divider':
      return (
        <hr
          style={{ borderColor: props.color || undefined }}
          className="border-gray-200 my-2"
        />
      );

    case 'spacer':
      return (
        <div
          style={{ height: `${props.spacerHeight ?? 24}px` }}
          className={cn(!isPreview && 'relative')}
        >
          {!isPreview && (
            <div className="absolute inset-0 flex items-center justify-center opacity-30">
              <div className="text-gray-400 text-xs">スペース ({props.spacerHeight ?? 24}px)</div>
            </div>
          )}
        </div>
      );

    case 'input':
      return (
        <div style={baseStyle} className="space-y-1">
          {props.label && (
            <label className="block text-sm font-medium text-gray-700">{props.label}</label>
          )}
          <input
            type="text"
            placeholder={props.placeholder || 'テキストを入力...'}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#1ec8a5] focus:ring-2 focus:ring-[#e6faf5] bg-white"
            readOnly={!isPreview}
          />
        </div>
      );

    case 'textarea':
      return (
        <div style={baseStyle} className="space-y-1">
          {props.label && (
            <label className="block text-sm font-medium text-gray-700">{props.label}</label>
          )}
          <textarea
            placeholder={props.placeholder || 'テキストを入力...'}
            rows={props.rows ?? 3}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#1ec8a5] focus:ring-2 focus:ring-[#e6faf5] bg-white resize-none"
            readOnly={!isPreview}
          />
        </div>
      );

    case 'check':
      return (
        <label style={baseStyle} className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            defaultChecked={props.checked}
            readOnly={!isPreview}
            className="w-4 h-4 rounded border-gray-300 text-[#1ec8a5] focus:ring-[#1ec8a5]"
          />
          <span className="text-sm text-gray-700">{props.label || 'チェックボックス'}</span>
        </label>
      );

    case 'card':
      return (
        <div
          style={baseStyle}
          className={cn('bg-white border border-gray-200 rounded-xl shadow-sm', !props.padding && 'p-4')}
        >
          <div className="font-semibold text-gray-900 text-sm mb-1">
            {props.text || 'カードタイトル'}
          </div>
          <p className="text-gray-500 text-xs leading-relaxed">
            プロパティパネルでテキストを変更できます。
          </p>
        </div>
      );

    case 'list': {
      const items = props.items ?? [
        { id: '1', icon: '✅', title: 'リスト項目 1', subtitle: 'サブテキスト' },
        { id: '2', icon: '⭐', title: 'リスト項目 2' },
        { id: '3', icon: '🎯', title: 'リスト項目 3', subtitle: 'サブテキスト' },
      ];
      return (
        <ul style={baseStyle} className="divide-y divide-gray-100 border border-gray-200 rounded-xl overflow-hidden bg-white">
          {items.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              {item.icon && <span className="text-lg leading-none">{item.icon}</span>}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-900 truncate">{item.title}</div>
                {item.subtitle && (
                  <div className="text-xs text-gray-500 truncate">{item.subtitle}</div>
                )}
              </div>
            </li>
          ))}
        </ul>
      );
    }

    case 'nav': {
      const navItems = props.navItems ?? [
        { id: '1', icon: '🏠', label: 'ホーム' },
        { id: '2', icon: '🔍', label: '検索' },
        { id: '3', icon: '❤️', label: 'お気に入り' },
        { id: '4', icon: '👤', label: 'プロフィール' },
      ];
      return (
        <nav
          style={baseStyle}
          className="flex items-center justify-around border-t border-gray-200 bg-white py-2 rounded-b-xl"
        >
          {navItems.map((item) => (
            <button
              key={item.id}
              className="flex flex-col items-center gap-0.5 px-3 text-gray-500 hover:text-[#1ec8a5] transition-colors"
              onClick={(e) => e.preventDefault()}
            >
              <span className="text-lg leading-none">{item.icon || '○'}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      );
    }

    case 'container':
      return (
        <div
          style={baseStyle}
          className={cn(
            'border-2 border-dashed border-gray-200 rounded-lg',
            !props.padding && 'p-4',
            'flex flex-wrap gap-3',
          )}
        >
          {props.children && props.children.length > 0 ? (
            props.children.map((child) => (
              <ElementRenderer key={child.id} element={child} isPreview={isPreview} />
            ))
          ) : (
            <div className="w-full text-center text-gray-400 text-xs py-4">
              コンテナ（子要素をドロップ）
            </div>
          )}
        </div>
      );

    default:
      return (
        <div className="bg-gray-100 rounded p-3 text-sm text-gray-500">
          未知の要素タイプ: {type}
        </div>
      );
  }
}
