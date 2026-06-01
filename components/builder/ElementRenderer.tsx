'use client';

import { AppElement } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ElementRendererProps {
  element: AppElement;
  isPreview?: boolean;
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
          className={cn(
            'text-gray-700 text-sm leading-relaxed',
            !props.padding && 'py-1',
          )}
        >
          {props.text || 'テキストを入力してください'}
        </p>
      );

    case 'heading':
      return (
        <h2
          style={baseStyle}
          className={cn(
            'text-gray-900 font-bold text-2xl',
            !props.padding && 'py-1',
          )}
        >
          {props.text || '見出しを入力してください'}
        </h2>
      );

    case 'button': {
      const variant = props.variant || 'primary';
      const size = props.size || 'md';

      const variantClasses = {
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
        outline: 'border-2 border-blue-600 text-blue-600 hover:bg-blue-50',
      };

      const sizeClasses = {
        sm: 'text-xs px-3 py-1.5 rounded-md',
        md: 'text-sm px-5 py-2.5 rounded-lg',
        lg: 'text-base px-7 py-3 rounded-xl',
      };

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
      if (props.src) {
        return (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={props.src}
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
          <span className="text-gray-400 text-xs">{props.alt || '画像を設定してください'}</span>
        </div>
      );
    }

    case 'divider':
      return (
        <hr
          style={baseStyle}
          className="border-gray-200 my-2"
        />
      );

    case 'input':
      return (
        <input
          type="text"
          placeholder={props.placeholder || 'テキストを入力...'}
          style={baseStyle}
          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 bg-white"
          readOnly={!isPreview}
        />
      );

    case 'card':
      return (
        <div
          style={baseStyle}
          className={cn(
            'bg-white border border-gray-200 rounded-xl shadow-sm',
            !props.padding && 'p-4',
          )}
        >
          <div className="font-semibold text-gray-900 text-sm mb-2">
            {props.text || 'カードタイトル'}
          </div>
          <p className="text-gray-500 text-xs leading-relaxed">
            カードの内容をここに入力できます。プロパティパネルでテキストを変更できます。
          </p>
        </div>
      );

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
