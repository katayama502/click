'use client';

import { AppElement } from '@/lib/types';
import { cn } from '@/lib/utils';

interface ElementRendererProps {
  element: AppElement;
  isPreview?: boolean;
}

/** Validate https?:// URLs only (XSS prevention) */
function isSafeUrl(url: string): boolean {
  return /^https?:\/\//i.test(url);
}

/** Star rating display */
function Stars({ value, max = 5, interactive = false, onChange }: {
  value: number; max?: number; interactive?: boolean; onChange?: (v: number) => void;
}) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: max }, (_, i) => (
        <svg
          key={i}
          onClick={() => interactive && onChange?.(i + 1)}
          className={cn('w-6 h-6 transition-colors', interactive && 'cursor-pointer')}
          fill={i < value ? '#ffd54a' : 'none'}
          stroke={i < value ? '#ffd54a' : '#d1d5db'}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5}
            d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
        </svg>
      ))}
    </div>
  );
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

  const inputBase = 'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-700 outline-none focus:border-[#1ec8a5] focus:ring-2 focus:ring-[#e6faf5] bg-white';

  switch (type) {
    /* ─────────────── ベーシック ─────────────── */
    case 'text':
      return (
        <p style={baseStyle} className={cn('text-gray-700 text-sm leading-relaxed', !props.padding && 'py-1')}>
          {props.text || 'テキストを入力してください'}
        </p>
      );

    case 'heading':
      return (
        <h2 style={baseStyle} className={cn('text-gray-900 font-bold text-2xl', !props.padding && 'py-1')}>
          {props.text || '見出しを入力してください'}
        </h2>
      );

    case 'image': {
      const safeSrc = props.src && isSafeUrl(props.src) ? props.src : null;
      return safeSrc ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={safeSrc} alt={props.alt || ''} style={baseStyle} className="max-w-full h-auto rounded-lg" />
      ) : (
        <div style={baseStyle} className="bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center py-8 px-4">
          <svg className="w-8 h-8 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <span className="text-gray-400 text-xs">{props.alt || '画像URLを設定してください'}</span>
        </div>
      );
    }

    case 'video': {
      const safeVideo = props.videoUrl && isSafeUrl(props.videoUrl) ? props.videoUrl : null;
      return (
        <div style={baseStyle} className="rounded-xl overflow-hidden bg-gray-900 relative aspect-video flex items-center justify-center">
          {safeVideo ? (
            <iframe src={safeVideo} className="w-full h-full" allow="autoplay; encrypted-media" allowFullScreen />
          ) : (
            <div className="text-center">
              <svg className="w-12 h-12 text-gray-500 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-gray-500 text-xs">動画URLを設定してください</span>
            </div>
          )}
        </div>
      );
    }

    case 'divider':
      return <hr style={{ borderColor: props.color || undefined }} className="border-gray-200 my-2" />;

    case 'spacer':
      return (
        <div style={{ height: `${props.spacerHeight ?? 24}px` }} className="relative">
          {!isPreview && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="border border-dashed border-gray-300 w-full h-full flex items-center justify-center opacity-40">
                <span className="text-gray-400 text-xs">スペース ({props.spacerHeight ?? 24}px)</span>
              </div>
            </div>
          )}
        </div>
      );

    case 'shape': {
      const shapeStyle: React.CSSProperties = {
        ...baseStyle,
        backgroundColor: props.bgColor || '#1ec8a5',
        borderRadius: props.shapeType === 'circle' ? '50%' : props.shapeType === 'rounded' ? '16px' : '4px',
        width: props.width || '100%',
        height: props.height || '60px',
      };
      return <div style={shapeStyle} />;
    }

    /* ─────────────── アクション ─────────────── */
    case 'button': {
      const variant = props.variant || 'primary';
      const size = props.size || 'md';
      const variantClasses = {
        primary: 'bg-[#1ec8a5] text-white hover:bg-[#13a98a]',
        secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300',
        outline: 'border-2 border-[#1ec8a5] text-[#1ec8a5] hover:bg-[#e6faf5]',
        ghost: 'text-[#1ec8a5] hover:bg-[#e6faf5]',
      };
      const sizeClasses = { sm: 'text-xs px-3 py-1.5 rounded-md', md: 'text-sm px-5 py-2.5 rounded-lg', lg: 'text-base px-7 py-3 rounded-xl' };
      const safeHref = props.href && isSafeUrl(props.href) ? props.href : undefined;

      if (isPreview && safeHref) {
        return (
          <a href={safeHref} target="_blank" rel="noopener noreferrer" style={baseStyle}
            className={cn('inline-block font-semibold transition-colors duration-150 text-center', variantClasses[variant], sizeClasses[size])}>
            {props.text || 'ボタン'}
          </a>
        );
      }
      return (
        <button style={baseStyle} className={cn('font-semibold transition-colors duration-150 cursor-pointer', variantClasses[variant], sizeClasses[size])}
          onClick={(e) => e.preventDefault()}>
          {props.text || 'ボタン'}
        </button>
      );
    }

    case 'toggle': {
      const on = props.toggleValue ?? false;
      return (
        <label style={baseStyle} className="flex items-center gap-3 cursor-pointer">
          <div className={cn('relative w-11 h-6 rounded-full transition-colors duration-200', on ? 'bg-[#1ec8a5]' : 'bg-gray-300')}>
            <div className={cn('absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200', on && 'translate-x-5')} />
          </div>
          {props.label && <span className="text-sm text-gray-700">{props.label}</span>}
        </label>
      );
    }

    case 'iconbutton': {
      const size = props.size || 'md';
      const sizeMap = { sm: 'w-8 h-8 text-sm', md: 'w-10 h-10 text-base', lg: 'w-12 h-12 text-lg' };
      return (
        <button style={baseStyle}
          className={cn('rounded-xl bg-[#e6faf5] text-[#1ec8a5] hover:bg-[#1ec8a5] hover:text-white transition-colors flex items-center justify-center font-semibold', sizeMap[size])}
          onClick={(e) => e.preventDefault()}>
          {props.iconName || '✦'}
        </button>
      );
    }

    /* ─────────────── フォーム ─────────────── */
    case 'input':
      return (
        <div style={baseStyle} className="space-y-1">
          {props.label && <label className="block text-sm font-medium text-gray-700">{props.label}</label>}
          <input type="text" placeholder={props.placeholder || 'テキストを入力...'} className={inputBase} readOnly={!isPreview} />
        </div>
      );

    case 'textarea':
      return (
        <div style={baseStyle} className="space-y-1">
          {props.label && <label className="block text-sm font-medium text-gray-700">{props.label}</label>}
          <textarea placeholder={props.placeholder || 'テキストを入力...'} rows={props.rows ?? 3}
            className={cn(inputBase, 'resize-none')} readOnly={!isPreview} />
        </div>
      );

    case 'password':
      return (
        <div style={baseStyle} className="space-y-1">
          {props.label && <label className="block text-sm font-medium text-gray-700">{props.label}</label>}
          <div className="relative">
            <input type="password" placeholder={props.placeholder || 'パスワード'} className={cn(inputBase, 'pr-10')} readOnly={!isPreview} />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            </svg>
          </div>
        </div>
      );

    case 'date':
      return (
        <div style={baseStyle} className="space-y-1">
          {props.label && <label className="block text-sm font-medium text-gray-700">{props.label}</label>}
          <div className="relative">
            <input type="date" className={cn(inputBase, 'pr-10')} readOnly={!isPreview} />
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        </div>
      );

    case 'dropdown': {
      const options = props.dropdownOptions ?? [
        { id: '1', label: '選択肢 1', value: '1' },
        { id: '2', label: '選択肢 2', value: '2' },
        { id: '3', label: '選択肢 3', value: '3' },
      ];
      return (
        <div style={baseStyle} className="space-y-1">
          {props.label && <label className="block text-sm font-medium text-gray-700">{props.label}</label>}
          <div className="relative">
            <select className={cn(inputBase, 'appearance-none pr-10')} disabled={!isPreview}>
              <option value="">{props.placeholder || '選択してください'}</option>
              {options.map((o) => <option key={o.id} value={o.value}>{o.label}</option>)}
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>
      );
    }

    case 'check':
      return (
        <label style={baseStyle} className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" defaultChecked={props.checked} readOnly={!isPreview}
            className="w-4 h-4 rounded border-gray-300 text-[#1ec8a5] focus:ring-[#1ec8a5]" />
          <span className="text-sm text-gray-700">{props.label || 'チェックボックス'}</span>
        </label>
      );

    case 'radio': {
      const opts = props.radioOptions ?? [
        { id: '1', label: '選択肢 A', value: 'a' },
        { id: '2', label: '選択肢 B', value: 'b' },
        { id: '3', label: '選択肢 C', value: 'c' },
      ];
      const gName = `radio-${element.id}`;
      return (
        <div style={baseStyle} className="space-y-2">
          {props.label && <p className="text-sm font-medium text-gray-700">{props.label}</p>}
          {opts.map((o) => (
            <label key={o.id} className="flex items-center gap-2 cursor-pointer">
              <input type="radio" name={gName} value={o.value} readOnly={!isPreview}
                className="w-4 h-4 border-gray-300 text-[#1ec8a5] focus:ring-[#1ec8a5]" />
              <span className="text-sm text-gray-700">{o.label}</span>
            </label>
          ))}
        </div>
      );
    }

    case 'fileupload':
      return (
        <div style={baseStyle} className="space-y-1">
          {props.label && <label className="block text-sm font-medium text-gray-700">{props.label}</label>}
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-[#1ec8a5] transition-colors cursor-pointer">
            <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <p className="text-sm text-gray-500">クリックまたはドラッグしてアップロード</p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG, PDF まで 10MB</p>
          </div>
        </div>
      );

    case 'stepper': {
      const val = props.stepperValue ?? 1;
      const min = props.stepperMin ?? 0;
      const max = props.stepperMax ?? 99;
      return (
        <div style={baseStyle} className="space-y-1">
          {props.label && <label className="block text-sm font-medium text-gray-700">{props.label}</label>}
          <div className="flex items-center gap-0 border border-gray-300 rounded-lg overflow-hidden w-fit">
            <button className="w-10 h-10 flex items-center justify-center text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors text-lg font-medium border-r border-gray-300"
              onClick={(e) => e.preventDefault()}>−</button>
            <span className="w-14 text-center text-sm font-semibold text-gray-800 py-2">{val}</span>
            <button className="w-10 h-10 flex items-center justify-center text-gray-600 bg-gray-50 hover:bg-gray-100 transition-colors text-lg font-medium border-l border-gray-300"
              onClick={(e) => e.preventDefault()}>+</button>
          </div>
          <p className="text-xs text-gray-400">{min} 〜 {max}</p>
        </div>
      );
    }

    case 'rating':
      return (
        <div style={baseStyle} className="space-y-1">
          {props.label && <p className="text-sm font-medium text-gray-700">{props.label}</p>}
          <Stars value={props.ratingValue ?? 3} max={props.ratingMax ?? 5} interactive={isPreview} />
        </div>
      );

    /* ─────────────── データ表示 ─────────────── */
    case 'card':
      return (
        <div style={baseStyle} className={cn('bg-white border border-gray-200 rounded-xl shadow-sm', !props.padding && 'p-4')}>
          <div className="font-semibold text-gray-900 text-sm mb-1">{props.text || 'カードタイトル'}</div>
          <p className="text-gray-500 text-xs leading-relaxed">プロパティパネルでテキストを変更できます。</p>
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
                {item.subtitle && <div className="text-xs text-gray-500 truncate">{item.subtitle}</div>}
              </div>
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </li>
          ))}
        </ul>
      );
    }

    case 'table': {
      const cols = props.tableColumns ?? [
        { id: 'c1', label: '名前' }, { id: 'c2', label: 'ステータス' }, { id: 'c3', label: '日付' },
      ];
      const rows = props.tableRows ?? [
        { id: 'r1', cells: ['田中 太郎', '完了', '2024/01/01'] },
        { id: 'r2', cells: ['鈴木 花子', '進行中', '2024/01/02'] },
        { id: 'r3', cells: ['佐藤 次郎', '未着手', '2024/01/03'] },
      ];
      return (
        <div style={baseStyle} className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                {cols.map((col) => (
                  <th key={col.id} className="text-left px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase tracking-wide">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row) => (
                <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                  {row.cells.map((cell, i) => (
                    <td key={i} className="px-4 py-2.5 text-gray-700">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    case 'badge': {
      const variant = props.badgeVariant || 'subtle';
      const color = props.badgeColor || '#1ec8a5';
      const variantStyle: React.CSSProperties = variant === 'solid'
        ? { backgroundColor: color, color: '#fff' }
        : variant === 'outline'
        ? { border: `1.5px solid ${color}`, color }
        : { backgroundColor: `${color}20`, color };
      return (
        <span style={{ ...variantStyle, ...baseStyle }}
          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold">
          {props.text || 'バッジ'}
        </span>
      );
    }

    case 'avatar': {
      const sz = props.avatarSize || 'md';
      const sizeMap = { sm: 'w-8 h-8 text-sm', md: 'w-12 h-12 text-lg', lg: 'w-16 h-16 text-2xl' };
      const safeSrc = props.avatarSrc && isSafeUrl(props.avatarSrc) ? props.avatarSrc : null;
      const initials = props.avatarName
        ? props.avatarName.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
        : 'U';
      return (
        <div style={baseStyle} className="flex items-center gap-3">
          <div className={cn('rounded-full flex items-center justify-center overflow-hidden shrink-0 bg-[#1ec8a5] text-white font-bold', sizeMap[sz])}>
            {safeSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={safeSrc} alt={props.avatarName || ''} className="w-full h-full object-cover" />
            ) : initials}
          </div>
          {props.avatarName && (
            <div>
              <p className="text-sm font-semibold text-gray-900">{props.avatarName}</p>
              {props.label && <p className="text-xs text-gray-500">{props.label}</p>}
            </div>
          )}
        </div>
      );
    }

    case 'progress': {
      const val = Math.min(100, Math.max(0, props.progressValue ?? 60));
      const color = props.progressColor || '#1ec8a5';
      return (
        <div style={baseStyle} className="space-y-1.5">
          {props.label && (
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">{props.label}</span>
              <span className="text-sm font-semibold" style={{ color }}>{val}%</span>
            </div>
          )}
          <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${val}%`, backgroundColor: color }} />
          </div>
        </div>
      );
    }

    case 'tag': {
      const tags = props.tags ?? ['タグ1', 'タグ2', 'タグ3'];
      return (
        <div style={baseStyle} className="flex flex-wrap gap-2">
          {tags.map((tag, i) => (
            <span key={i} className="inline-flex items-center gap-1 px-3 py-1 bg-[#e6faf5] text-[#1ec8a5] rounded-full text-xs font-medium">
              {tag}
              {isPreview && (
                <button className="text-[#1ec8a5] hover:text-[#13a98a]">
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </span>
          ))}
        </div>
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
        <nav style={baseStyle} className="flex items-center justify-around border-t border-gray-200 bg-white py-2 rounded-b-xl shadow-sm">
          {navItems.map((item) => (
            <button key={item.id} className="flex flex-col items-center gap-0.5 px-3 text-gray-500 hover:text-[#1ec8a5] transition-colors"
              onClick={(e) => e.preventDefault()}>
              <span className="text-xl leading-none">{item.icon || '○'}</span>
              <span className="text-xs font-medium">{item.label}</span>
            </button>
          ))}
        </nav>
      );
    }

    case 'carousel': {
      const items = props.carouselItems ?? [
        { id: '1', caption: 'スライド 1' },
        { id: '2', caption: 'スライド 2' },
        { id: '3', caption: 'スライド 3' },
      ];
      return (
        <div style={baseStyle} className="relative rounded-xl overflow-hidden bg-gray-100">
          <div className="aspect-video bg-gradient-to-br from-[#1ec8a5]/20 to-[#13a98a]/20 flex items-center justify-center">
            {items[0]?.caption ? (
              <span className="text-gray-600 font-medium">{items[0].caption}</span>
            ) : (
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            )}
          </div>
          {/* Dots */}
          <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
            {items.map((_, i) => (
              <div key={i} className={cn('w-2 h-2 rounded-full transition-colors', i === 0 ? 'bg-[#1ec8a5]' : 'bg-white/60')} />
            ))}
          </div>
          {/* Arrows */}
          <button className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow"
            onClick={(e) => e.preventDefault()}>
            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-white/80 rounded-full flex items-center justify-center shadow"
            onClick={(e) => e.preventDefault()}>
            <svg className="w-4 h-4 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      );
    }

    case 'qrcode':
      return (
        <div style={baseStyle} className="flex flex-col items-center gap-2">
          {props.label && <p className="text-sm font-medium text-gray-700">{props.label}</p>}
          <div className="w-32 h-32 bg-white border-2 border-gray-200 rounded-xl flex items-center justify-center p-2">
            {/* QR pattern mock */}
            <svg viewBox="0 0 21 21" className="w-full h-full text-gray-900" fill="currentColor">
              <rect x="0" y="0" width="7" height="7" rx="1" />
              <rect x="14" y="0" width="7" height="7" rx="1" />
              <rect x="0" y="14" width="7" height="7" rx="1" />
              <rect x="2" y="2" width="3" height="3" fill="white" />
              <rect x="16" y="2" width="3" height="3" fill="white" />
              <rect x="2" y="16" width="3" height="3" fill="white" />
              <rect x="9" y="0" width="2" height="2" /><rect x="11" y="2" width="2" height="2" />
              <rect x="9" y="4" width="3" height="2" /><rect x="8" y="8" width="2" height="2" />
              <rect x="10" y="9" width="3" height="2" /><rect x="14" y="8" width="7" height="2" />
              <rect x="8" y="11" width="2" height="2" /><rect x="11" y="12" width="3" height="2" />
              <rect x="14" y="11" width="3" height="2" /><rect x="19" y="11" width="2" height="2" />
              <rect x="8" y="14" width="2" height="3" /><rect x="12" y="14" width="2" height="2" />
              <rect x="16" y="14" width="2" height="3" /><rect x="19" y="15" width="2" height="2" />
              <rect x="8" y="19" width="3" height="2" /><rect x="12" y="18" width="3" height="3" />
              <rect x="17" y="19" width="4" height="2" />
            </svg>
          </div>
          <p className="text-xs text-gray-400">{props.qrValue || 'QRコードのURLを設定'}</p>
        </div>
      );

    /* ─────────────── レイアウト ─────────────── */
    case 'container':
      return (
        <div style={baseStyle} className={cn('border-2 border-dashed border-gray-200 rounded-xl', !props.padding && 'p-4', 'flex flex-wrap gap-3')}>
          {props.children && props.children.length > 0 ? (
            props.children.map((child) => <ElementRenderer key={child.id} element={child} isPreview={isPreview} />)
          ) : (
            <div className="w-full text-center text-gray-400 text-xs py-6">コンテナ（子要素をドロップ）</div>
          )}
        </div>
      );

    default:
      return <div className="bg-gray-100 rounded p-3 text-sm text-gray-500">未知の要素タイプ: {type}</div>;
  }
}
