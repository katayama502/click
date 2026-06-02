'use client';

import { useBuilderStore } from '@/lib/store';
import { AppElement, ListItem, NavItem } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';

function PropLabel({ children }: { children: React.ReactNode }) {
  return <label className="prop-label">{children}</label>;
}

function PropInput({
  value,
  onChange,
  placeholder,
  type = 'text',
  maxLength,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  maxLength?: number;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      className="prop-input"
    />
  );
}

function PropSelect({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="prop-input appearance-none"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-3">
      <PropLabel>{label}</PropLabel>
      {children}
    </div>
  );
}

function PropColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="mb-3">
      <PropLabel>{label}</PropLabel>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={value || '#000000'}
          onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent"
        />
        <input
          type="text"
          value={value || ''}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#000000"
          className="prop-input flex-1 font-mono text-xs"
        />
      </div>
    </div>
  );
}

/** Validate https?:// URLs only */
function isSafeUrl(url: string): boolean {
  return url === '' || /^https?:\/\//i.test(url);
}

interface ElementPropertiesProps {
  element: AppElement;
}

function ElementProperties({ element }: ElementPropertiesProps) {
  const { updateElement } = useBuilderStore();
  const { type, props } = element;

  const update = (newProps: Partial<AppElement['props']>) => {
    updateElement(element.id, newProps);
  };

  return (
    <div className="p-4">
      {/* Element type badge */}
      <div className="mb-4 pb-3 border-b border-slate-700">
        <div className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">
          要素タイプ
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-[#1ec8a5]" />
          <span className="text-slate-200 font-semibold text-sm capitalize">{type}</span>
        </div>
      </div>

      {/* ── Text content ── */}
      {(type === 'text' || type === 'heading' || type === 'button' || type === 'card') && (
        <PropRow label="テキスト">
          <textarea
            value={props.text || ''}
            onChange={(e) => update({ text: e.target.value })}
            rows={type === 'text' || type === 'card' ? 3 : 1}
            maxLength={type === 'heading' ? 200 : 5000}
            className="prop-input resize-none"
            placeholder="テキストを入力..."
          />
        </PropRow>
      )}

      {/* ── Label (input / textarea / check) ── */}
      {(type === 'input' || type === 'textarea' || type === 'check') && (
        <PropRow label="ラベル">
          <PropInput
            value={props.label || ''}
            onChange={(v) => update({ label: v })}
            placeholder="ラベルテキスト..."
            maxLength={100}
          />
        </PropRow>
      )}

      {/* ── Placeholder ── */}
      {(type === 'input' || type === 'textarea') && (
        <PropRow label="プレースホルダー">
          <PropInput
            value={props.placeholder || ''}
            onChange={(v) => update({ placeholder: v })}
            placeholder="プレースホルダーテキスト..."
            maxLength={200}
          />
        </PropRow>
      )}

      {/* ── Textarea rows ── */}
      {type === 'textarea' && (
        <PropRow label="行数">
          <PropSelect
            value={String(props.rows ?? 3)}
            onChange={(v) => update({ rows: Number(v) })}
            options={[2, 3, 4, 5, 6, 8, 10].map((n) => ({ label: `${n}行`, value: String(n) }))}
          />
        </PropRow>
      )}

      {/* ── Image src (https:// validated) ── */}
      {type === 'image' && (
        <>
          <PropRow label="画像URL (https:// のみ)">
            <PropInput
              value={props.src || ''}
              onChange={(v) => {
                // Accept empty or valid URL; silently strip invalid prefixes
                if (v === '' || isSafeUrl(v)) {
                  update({ src: v });
                }
              }}
              placeholder="https://example.com/image.jpg"
              maxLength={2048}
            />
            {props.src && !isSafeUrl(props.src) && (
              <p className="text-red-400 text-xs mt-1">
                ⚠ URLは https:// または http:// で始めてください
              </p>
            )}
          </PropRow>
          <PropRow label="代替テキスト">
            <PropInput
              value={props.alt || ''}
              onChange={(v) => update({ alt: v })}
              placeholder="画像の説明..."
              maxLength={200}
            />
          </PropRow>
        </>
      )}

      {/* ── Button props ── */}
      {type === 'button' && (
        <>
          <PropRow label="スタイル">
            <PropSelect
              value={props.variant || 'primary'}
              onChange={(v) => update({ variant: v as AppElement['props']['variant'] })}
              options={[
                { label: 'プライマリ', value: 'primary' },
                { label: 'セカンダリ', value: 'secondary' },
                { label: 'アウトライン', value: 'outline' },
              ]}
            />
          </PropRow>
          <PropRow label="サイズ">
            <PropSelect
              value={props.size || 'md'}
              onChange={(v) => update({ size: v as AppElement['props']['size'] })}
              options={[
                { label: '小', value: 'sm' },
                { label: '中', value: 'md' },
                { label: '大', value: 'lg' },
              ]}
            />
          </PropRow>
          <PropRow label="リンクURL (https:// のみ)">
            <PropInput
              value={props.href || ''}
              onChange={(v) => {
                if (v === '' || isSafeUrl(v)) update({ href: v });
              }}
              placeholder="https://example.com"
              maxLength={2048}
            />
            {props.href && !isSafeUrl(props.href) && (
              <p className="text-red-400 text-xs mt-1">
                ⚠ URLは https:// または http:// で始めてください
              </p>
            )}
          </PropRow>
        </>
      )}

      {/* ── Spacer height ── */}
      {type === 'spacer' && (
        <PropRow label="高さ (px)">
          <PropSelect
            value={String(props.spacerHeight ?? 24)}
            onChange={(v) => update({ spacerHeight: Number(v) })}
            options={[8, 16, 24, 32, 48, 64, 80, 96].map((n) => ({
              label: `${n}px`,
              value: String(n),
            }))}
          />
        </PropRow>
      )}

      {/* ── Text alignment ── */}
      {(type === 'text' || type === 'heading') && (
        <PropRow label="配置">
          <div className="flex gap-1">
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                onClick={() => update({ align })}
                className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
                  (props.align || 'left') === align
                    ? 'bg-[#1ec8a5] text-white'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                {align === 'left' ? '左' : align === 'center' ? '中央' : '右'}
              </button>
            ))}
          </div>
        </PropRow>
      )}

      {/* ── Colors ── */}
      {type !== 'image' && type !== 'divider' && type !== 'spacer' && type !== 'nav' && (
        <PropColorRow
          label="文字色"
          value={props.color || ''}
          onChange={(v) => update({ color: v })}
        />
      )}
      {(type === 'card' || type === 'container' || type === 'button') && (
        <PropColorRow
          label="背景色"
          value={props.bgColor || ''}
          onChange={(v) => update({ bgColor: v })}
        />
      )}

      {/* ── Typography ── */}
      {(type === 'text' || type === 'heading') && (
        <>
          <PropRow label="フォントサイズ">
            <PropInput
              value={props.fontSize || ''}
              onChange={(v) => update({ fontSize: v })}
              placeholder="例: 16px, 1.5rem"
              maxLength={20}
            />
          </PropRow>
          <PropRow label="フォントウェイト">
            <PropSelect
              value={props.fontWeight || ''}
              onChange={(v) => update({ fontWeight: v })}
              options={[
                { label: 'デフォルト', value: '' },
                { label: '細い (300)', value: '300' },
                { label: '通常 (400)', value: '400' },
                { label: '中太 (500)', value: '500' },
                { label: 'セミボールド (600)', value: '600' },
                { label: 'ボールド (700)', value: '700' },
                { label: '極太 (900)', value: '900' },
              ]}
            />
          </PropRow>
        </>
      )}

      {/* ── List items editor ── */}
      {type === 'list' && (
        <ListItemsEditor
          items={props.items ?? []}
          onChange={(items) => update({ items })}
        />
      )}

      {/* ── Nav items editor ── */}
      {type === 'nav' && (
        <NavItemsEditor
          items={props.navItems ?? []}
          onChange={(navItems) => update({ navItems })}
        />
      )}

      {/* ── Dimensions ── */}
      {type !== 'divider' && type !== 'spacer' && (
        <PropRow label="幅">
          <PropInput
            value={props.width || ''}
            onChange={(v) => update({ width: v })}
            placeholder="例: 100%, 200px, auto"
            maxLength={20}
          />
        </PropRow>
      )}
      {type !== 'divider' && (
        <PropRow label="パディング">
          <PropInput
            value={props.padding || ''}
            onChange={(v) => update({ padding: v })}
            placeholder="例: 16px, 8px 16px"
            maxLength={40}
          />
        </PropRow>
      )}
      {type !== 'divider' && type !== 'spacer' && (
        <PropRow label="角丸">
          <PropInput
            value={props.borderRadius || ''}
            onChange={(v) => update({ borderRadius: v })}
            placeholder="例: 8px, 50%"
            maxLength={20}
          />
        </PropRow>
      )}

      {/* ── Delete ── */}
      <div className="mt-6 pt-4 border-t border-slate-700">
        <button
          onClick={() => {
            const { removeElement, selectElement } = useBuilderStore.getState();
            removeElement(element.id);
            selectElement(null);
          }}
          className="w-full py-2 rounded-lg text-sm font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20"
        >
          要素を削除
        </button>
      </div>
    </div>
  );
}

/* ── List items sub-editor ── */
function ListItemsEditor({
  items,
  onChange,
}: {
  items: ListItem[];
  onChange: (items: ListItem[]) => void;
}) {
  const update = (idx: number, field: keyof ListItem, value: string) => {
    const next = items.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    onChange(next);
  };

  const add = () =>
    onChange([...items, { id: uuidv4(), title: '新しい項目', icon: '•' }]);

  const remove = (idx: number) =>
    onChange(items.filter((_, i) => i !== idx));

  return (
    <div className="mb-3">
      <PropLabel>リスト項目</PropLabel>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {items.map((item, i) => (
          <div key={item.id} className="bg-slate-800 rounded-lg p-2 space-y-1.5">
            <div className="flex gap-1.5">
              <input
                type="text"
                value={item.icon || ''}
                onChange={(e) => update(i, 'icon', e.target.value)}
                placeholder="絵文字"
                maxLength={4}
                className="prop-input w-12 text-center text-sm"
              />
              <input
                type="text"
                value={item.title}
                onChange={(e) => update(i, 'title', e.target.value)}
                placeholder="タイトル"
                maxLength={100}
                className="prop-input flex-1 text-xs"
              />
              <button
                onClick={() => remove(i)}
                className="text-red-400 hover:text-red-300 text-xs px-1 shrink-0"
              >
                ×
              </button>
            </div>
            <input
              type="text"
              value={item.subtitle || ''}
              onChange={(e) => update(i, 'subtitle', e.target.value)}
              placeholder="サブテキスト（省略可）"
              maxLength={200}
              className="prop-input w-full text-xs"
            />
          </div>
        ))}
      </div>
      <button
        onClick={add}
        className="mt-2 w-full py-1.5 rounded-md text-xs font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors border border-slate-600"
      >
        ＋ 項目を追加
      </button>
    </div>
  );
}

/* ── Nav items sub-editor ── */
function NavItemsEditor({
  items,
  onChange,
}: {
  items: NavItem[];
  onChange: (items: NavItem[]) => void;
}) {
  const update = (idx: number, field: keyof NavItem, value: string) => {
    const next = items.map((item, i) =>
      i === idx ? { ...item, [field]: value } : item
    );
    onChange(next);
  };

  const add = () =>
    onChange([...items, { id: uuidv4(), label: 'タブ', icon: '○' }]);

  const remove = (idx: number) =>
    onChange(items.filter((_, i) => i !== idx));

  return (
    <div className="mb-3">
      <PropLabel>ナビ項目</PropLabel>
      <div className="space-y-1.5 max-h-40 overflow-y-auto">
        {items.map((item, i) => (
          <div key={item.id} className="flex gap-1.5 bg-slate-800 rounded-lg p-1.5">
            <input
              type="text"
              value={item.icon || ''}
              onChange={(e) => update(i, 'icon', e.target.value)}
              placeholder="絵文字"
              maxLength={4}
              className="prop-input w-12 text-center text-sm"
            />
            <input
              type="text"
              value={item.label}
              onChange={(e) => update(i, 'label', e.target.value)}
              placeholder="ラベル"
              maxLength={20}
              className="prop-input flex-1 text-xs"
            />
            <button
              onClick={() => remove(i)}
              disabled={items.length <= 1}
              className="text-red-400 hover:text-red-300 disabled:opacity-30 text-xs px-1 shrink-0"
            >
              ×
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={add}
        className="mt-2 w-full py-1.5 rounded-md text-xs font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors border border-slate-600"
      >
        ＋ 項目を追加
      </button>
    </div>
  );
}

export default function PropertiesPanel() {
  const { project, selectedElementId, selectedPageId } = useBuilderStore();

  const currentPage = project?.pages.find((p) => p.id === selectedPageId);
  const selectedElement = currentPage?.elements.find((el) => el.id === selectedElementId);

  return (
    <aside className="builder-properties flex flex-col">
      <div className="p-4 border-b border-slate-700">
        <h2 className="text-slate-200 font-semibold text-sm">プロパティ</h2>
        <p className="text-slate-500 text-xs mt-0.5">要素のスタイルを編集</p>
      </div>

      <div className="flex-1 overflow-y-auto">
        {selectedElement ? (
          <ElementProperties element={selectedElement} />
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-center px-6">
            <svg
              className="w-10 h-10 text-slate-600 mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            <p className="text-slate-500 text-sm font-medium">要素を選択してください</p>
            <p className="text-slate-600 text-xs mt-1">
              キャンバス上の要素をクリックするとプロパティが表示されます
            </p>
          </div>
        )}
      </div>
    </aside>
  );
}
