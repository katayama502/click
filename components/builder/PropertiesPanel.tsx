'use client';

import { useBuilderStore } from '@/lib/store';
import { AppElement } from '@/lib/types';

function PropLabel({ children }: { children: React.ReactNode }) {
  return <label className="prop-label">{children}</label>;
}

function PropInput({
  value,
  onChange,
  placeholder,
  type = 'text',
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
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

function PropColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
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
      <div className="mb-4 pb-3 border-b border-slate-700">
        <div className="text-slate-400 text-xs uppercase tracking-wider font-semibold mb-1">
          要素タイプ
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-blue-400" />
          <span className="text-slate-200 font-semibold text-sm capitalize">{type}</span>
        </div>
      </div>

      {/* Text content - for text, heading, button, card */}
      {(type === 'text' || type === 'heading' || type === 'button' || type === 'card') && (
        <PropRow label="テキスト">
          <textarea
            value={props.text || ''}
            onChange={(e) => update({ text: e.target.value })}
            rows={type === 'text' || type === 'card' ? 3 : 1}
            className="prop-input resize-none"
            placeholder="テキストを入力..."
          />
        </PropRow>
      )}

      {/* Placeholder for input */}
      {type === 'input' && (
        <PropRow label="プレースホルダー">
          <PropInput
            value={props.placeholder || ''}
            onChange={(v) => update({ placeholder: v })}
            placeholder="プレースホルダーテキスト..."
          />
        </PropRow>
      )}

      {/* Image source */}
      {type === 'image' && (
        <>
          <PropRow label="画像URL">
            <PropInput
              value={props.src || ''}
              onChange={(v) => update({ src: v })}
              placeholder="https://example.com/image.jpg"
            />
          </PropRow>
          <PropRow label="代替テキスト">
            <PropInput
              value={props.alt || ''}
              onChange={(v) => update({ alt: v })}
              placeholder="画像の説明..."
            />
          </PropRow>
        </>
      )}

      {/* Button variant */}
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
        </>
      )}

      {/* Text alignment */}
      {(type === 'text' || type === 'heading') && (
        <PropRow label="配置">
          <div className="flex gap-1">
            {(['left', 'center', 'right'] as const).map((align) => (
              <button
                key={align}
                onClick={() => update({ align })}
                className={`flex-1 py-1.5 rounded text-xs font-medium transition-colors ${
                  (props.align || 'left') === align
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-700 text-slate-400 hover:bg-slate-600'
                }`}
              >
                {align === 'left' ? '左' : align === 'center' ? '中央' : '右'}
              </button>
            ))}
          </div>
        </PropRow>
      )}

      {/* Color */}
      {type !== 'image' && type !== 'divider' && (
        <PropColorRow
          label="文字色"
          value={props.color || ''}
          onChange={(v) => update({ color: v })}
        />
      )}

      {/* Background color */}
      {(type === 'card' || type === 'container' || type === 'button') && (
        <PropColorRow
          label="背景色"
          value={props.bgColor || ''}
          onChange={(v) => update({ bgColor: v })}
        />
      )}

      {/* Font size */}
      {(type === 'text' || type === 'heading') && (
        <PropRow label="フォントサイズ">
          <PropInput
            value={props.fontSize || ''}
            onChange={(v) => update({ fontSize: v })}
            placeholder="例: 16px, 1.5rem"
          />
        </PropRow>
      )}

      {/* Font weight */}
      {(type === 'text' || type === 'heading') && (
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
      )}

      {/* Width */}
      <PropRow label="幅">
        <PropInput
          value={props.width || ''}
          onChange={(v) => update({ width: v })}
          placeholder="例: 100%, 200px, auto"
        />
      </PropRow>

      {/* Padding */}
      <PropRow label="パディング">
        <PropInput
          value={props.padding || ''}
          onChange={(v) => update({ padding: v })}
          placeholder="例: 16px, 8px 16px"
        />
      </PropRow>

      {/* Border radius */}
      {type !== 'divider' && (
        <PropRow label="角丸">
          <PropInput
            value={props.borderRadius || ''}
            onChange={(v) => update({ borderRadius: v })}
            placeholder="例: 8px, 50%"
          />
        </PropRow>
      )}

      {/* Delete button */}
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

export default function PropertiesPanel() {
  const { project, selectedElementId, selectedPageId } = useBuilderStore();

  const currentPage = project?.pages.find((p) => p.id === selectedPageId);
  const selectedElement = currentPage?.elements.find(
    (el) => el.id === selectedElementId,
  );

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
