'use client';

import { useState } from 'react';
import { useBuilderStore } from '@/lib/store';
import { AppElement, ListItem, NavItem, RadioOption, DropdownOption } from '@/lib/types';
import { v4 as uuidv4 } from 'uuid';
import { cn } from '@/lib/utils';

/* ─── Primitive inputs ─── */
function PLabel({ children }: { children: React.ReactNode }) {
  return <label className="prop-label">{children}</label>;
}
function PInput({ value, onChange, placeholder, type = 'text', maxLength }: {
  value: string; onChange: (v: string) => void; placeholder?: string; type?: string; maxLength?: number;
}) {
  return <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} maxLength={maxLength} className="prop-input" />;
}
function PSelect({ value, onChange, options }: {
  value: string; onChange: (v: string) => void; options: { label: string; value: string }[];
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} className="prop-input appearance-none">
      {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  );
}
function PRow({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="mb-3"><PLabel>{label}</PLabel>{children}</div>;
}
function PColorRow({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div className="mb-3">
      <PLabel>{label}</PLabel>
      <div className="flex items-center gap-2">
        <input type="color" value={value || '#000000'} onChange={(e) => onChange(e.target.value)}
          className="w-8 h-8 rounded cursor-pointer border-0 bg-transparent" />
        <input type="text" value={value || ''} onChange={(e) => onChange(e.target.value)} placeholder="#000000"
          className="prop-input flex-1 font-mono text-xs" />
      </div>
    </div>
  );
}
function PSection({ title }: { title: string }) {
  return <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest mt-4 mb-2 pt-3 border-t border-slate-800">{title}</p>;
}

function isSafeUrl(url: string) { return url === '' || /^https?:\/\//i.test(url); }

/* ─── Main element properties ─── */
function ElementProperties({ element }: { element: AppElement }) {
  const { updateElement } = useBuilderStore();
  const { type, props } = element;
  const up = (p: Partial<AppElement['props']>) => updateElement(element.id, p);

  return (
    <div className="p-3">
      {/* Type badge */}
      <div className="mb-3 pb-3 border-b border-slate-800 flex items-center gap-2">
        <div className="w-2 h-2 rounded-full bg-[#1ec8a5]" />
        <span className="text-slate-200 font-bold text-xs uppercase tracking-wide">{type}</span>
      </div>

      {/* ─ Text content ─ */}
      {(type === 'text' || type === 'heading' || type === 'button' || type === 'card' || type === 'badge') && (
        <PRow label="テキスト">
          <textarea value={props.text || ''} onChange={(e) => up({ text: e.target.value })}
            rows={type === 'text' || type === 'card' ? 3 : 1}
            maxLength={type === 'heading' ? 200 : 5000}
            className="prop-input resize-none" placeholder="テキストを入力..." />
        </PRow>
      )}

      {/* ─ Label ─ */}
      {(['input','textarea','password','date','dropdown','check','radio','fileupload','stepper','rating','toggle','avatar','progress'].includes(type)) && (
        <PRow label="ラベル">
          <PInput value={props.label || ''} onChange={(v) => up({ label: v })} placeholder="ラベルテキスト..." maxLength={100} />
        </PRow>
      )}

      {/* ─ Placeholder ─ */}
      {(['input','textarea','password','dropdown'].includes(type)) && (
        <PRow label="プレースホルダー">
          <PInput value={props.placeholder || ''} onChange={(v) => up({ placeholder: v })} placeholder="プレースホルダー..." maxLength={200} />
        </PRow>
      )}

      {/* ─ Textarea rows ─ */}
      {type === 'textarea' && (
        <PRow label="行数">
          <PSelect value={String(props.rows ?? 3)} onChange={(v) => up({ rows: Number(v) })}
            options={[2,3,4,5,6,8,10].map((n) => ({ label: `${n}行`, value: String(n) }))} />
        </PRow>
      )}

      {/* ─ Image ─ */}
      {type === 'image' && (
        <>
          <PRow label="画像URL (https://)">
            <PInput value={props.src || ''} onChange={(v) => { if (isSafeUrl(v)) up({ src: v }); }} placeholder="https://example.com/img.jpg" maxLength={2048} />
            {props.src && !isSafeUrl(props.src) && <p className="text-red-400 text-xs mt-1">⚠ https:// で始めてください</p>}
          </PRow>
          <PRow label="代替テキスト"><PInput value={props.alt || ''} onChange={(v) => up({ alt: v })} placeholder="画像の説明" maxLength={200} /></PRow>
        </>
      )}

      {/* ─ Video ─ */}
      {type === 'video' && (
        <PRow label="動画URL (YouTube埋め込み)">
          <PInput value={props.videoUrl || ''} onChange={(v) => { if (isSafeUrl(v)) up({ videoUrl: v }); }} placeholder="https://www.youtube.com/embed/..." maxLength={2048} />
        </PRow>
      )}

      {/* ─ Button ─ */}
      {type === 'button' && (
        <>
          <PRow label="スタイル">
            <PSelect value={props.variant || 'primary'} onChange={(v) => up({ variant: v as AppElement['props']['variant'] })}
              options={[{ label: 'プライマリ', value: 'primary' },{ label: 'セカンダリ', value: 'secondary' },{ label: 'アウトライン', value: 'outline' },{ label: 'ゴースト', value: 'ghost' }]} />
          </PRow>
          <PRow label="サイズ">
            <PSelect value={props.size || 'md'} onChange={(v) => up({ size: v as AppElement['props']['size'] })}
              options={[{ label: '小', value: 'sm' },{ label: '中', value: 'md' },{ label: '大', value: 'lg' }]} />
          </PRow>
          <PRow label="リンクURL (https://)">
            <PInput value={props.href || ''} onChange={(v) => { if (isSafeUrl(v)) up({ href: v }); }} placeholder="https://example.com" maxLength={2048} />
            {props.href && !isSafeUrl(props.href) && <p className="text-red-400 text-xs mt-1">⚠ https:// で始めてください</p>}
          </PRow>
        </>
      )}

      {/* ─ Toggle ─ */}
      {type === 'toggle' && (
        <PRow label="初期値">
          <button onClick={() => up({ toggleValue: !props.toggleValue })}
            className={cn('relative w-10 h-5 rounded-full transition-colors', props.toggleValue ? 'bg-[#1ec8a5]' : 'bg-slate-600')}>
            <div className={cn('absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform', props.toggleValue && 'translate-x-5')} />
          </button>
        </PRow>
      )}

      {/* ─ Icon button ─ */}
      {type === 'iconbutton' && (
        <>
          <PRow label="アイコン (絵文字)"><PInput value={props.iconName || ''} onChange={(v) => up({ iconName: v })} placeholder="✦ 🔔 ✏️" maxLength={4} /></PRow>
          <PRow label="サイズ">
            <PSelect value={props.size || 'md'} onChange={(v) => up({ size: v as AppElement['props']['size'] })}
              options={[{ label: '小', value: 'sm' },{ label: '中', value: 'md' },{ label: '大', value: 'lg' }]} />
          </PRow>
        </>
      )}

      {/* ─ Shape ─ */}
      {type === 'shape' && (
        <>
          <PRow label="形状">
            <PSelect value={props.shapeType || 'rect'} onChange={(v) => up({ shapeType: v as AppElement['props']['shapeType'] })}
              options={[{ label: '四角形', value: 'rect' },{ label: '角丸', value: 'rounded' },{ label: '円形', value: 'circle' }]} />
          </PRow>
          <PColorRow label="色" value={props.bgColor || '#1ec8a5'} onChange={(v) => up({ bgColor: v })} />
          <PRow label="高さ"><PInput value={props.height || ''} onChange={(v) => up({ height: v })} placeholder="60px" maxLength={20} /></PRow>
        </>
      )}

      {/* ─ Spacer ─ */}
      {type === 'spacer' && (
        <PRow label="高さ (px)">
          <PSelect value={String(props.spacerHeight ?? 24)} onChange={(v) => up({ spacerHeight: Number(v) })}
            options={[8,16,24,32,48,64,80,96].map((n) => ({ label: `${n}px`, value: String(n) }))} />
        </PRow>
      )}

      {/* ─ Stepper ─ */}
      {type === 'stepper' && (
        <>
          <PRow label="初期値"><PInput value={String(props.stepperValue ?? 1)} onChange={(v) => up({ stepperValue: Number(v) })} type="number" /></PRow>
          <PRow label="最小値"><PInput value={String(props.stepperMin ?? 0)} onChange={(v) => up({ stepperMin: Number(v) })} type="number" /></PRow>
          <PRow label="最大値"><PInput value={String(props.stepperMax ?? 99)} onChange={(v) => up({ stepperMax: Number(v) })} type="number" /></PRow>
        </>
      )}

      {/* ─ Rating ─ */}
      {type === 'rating' && (
        <>
          <PRow label="初期評価 (1〜max)"><PInput value={String(props.ratingValue ?? 3)} onChange={(v) => up({ ratingValue: Number(v) })} type="number" /></PRow>
          <PRow label="最大値"><PSelect value={String(props.ratingMax ?? 5)} onChange={(v) => up({ ratingMax: Number(v) })} options={[3,4,5,6,7,10].map((n) => ({ label: `${n}`, value: String(n) }))} /></PRow>
        </>
      )}

      {/* ─ Badge ─ */}
      {type === 'badge' && (
        <>
          <PRow label="バリアント">
            <PSelect value={props.badgeVariant || 'subtle'} onChange={(v) => up({ badgeVariant: v as AppElement['props']['badgeVariant'] })}
              options={[{ label: 'サブトル', value: 'subtle' },{ label: 'ソリッド', value: 'solid' },{ label: 'アウトライン', value: 'outline' }]} />
          </PRow>
          <PColorRow label="カラー" value={props.badgeColor || '#1ec8a5'} onChange={(v) => up({ badgeColor: v })} />
        </>
      )}

      {/* ─ Avatar ─ */}
      {type === 'avatar' && (
        <>
          <PRow label="名前"><PInput value={props.avatarName || ''} onChange={(v) => up({ avatarName: v })} placeholder="山田 太郎" maxLength={50} /></PRow>
          <PRow label="サブテキスト"><PInput value={props.label || ''} onChange={(v) => up({ label: v })} placeholder="役職・説明" maxLength={100} /></PRow>
          <PRow label="画像URL (https://)"><PInput value={props.avatarSrc || ''} onChange={(v) => { if (isSafeUrl(v)) up({ avatarSrc: v }); }} placeholder="https://..." maxLength={2048} /></PRow>
          <PRow label="サイズ">
            <PSelect value={props.avatarSize || 'md'} onChange={(v) => up({ avatarSize: v as AppElement['props']['avatarSize'] })}
              options={[{ label: '小', value: 'sm' },{ label: '中', value: 'md' },{ label: '大', value: 'lg' }]} />
          </PRow>
        </>
      )}

      {/* ─ Progress ─ */}
      {type === 'progress' && (
        <>
          <PRow label="値 (0〜100)">
            <div className="flex items-center gap-2">
              <input type="range" min="0" max="100" value={props.progressValue ?? 60} onChange={(e) => up({ progressValue: Number(e.target.value) })}
                className="flex-1 accent-[#1ec8a5]" />
              <span className="text-slate-300 text-xs w-8 text-right">{props.progressValue ?? 60}%</span>
            </div>
          </PRow>
          <PColorRow label="カラー" value={props.progressColor || '#1ec8a5'} onChange={(v) => up({ progressColor: v })} />
        </>
      )}

      {/* ─ Tags ─ */}
      {type === 'tag' && (
        <TagsEditor tags={props.tags ?? []} onChange={(tags) => up({ tags })} />
      )}

      {/* ─ Dropdown options ─ */}
      {type === 'dropdown' && (
        <OptionsEditor<DropdownOption>
          label="選択肢"
          items={props.dropdownOptions ?? []}
          onChange={(items) => up({ dropdownOptions: items })}
          renderItem={(item, i, update, remove) => (
            <div key={item.id} className="flex gap-1.5 bg-slate-800 rounded-lg p-1.5">
              <input type="text" value={item.label} onChange={(e) => update({ label: e.target.value })} placeholder="ラベル" maxLength={50}
                className="prop-input flex-1 text-xs" />
              <button onClick={remove} className="text-red-400 hover:text-red-300 text-xs px-1">×</button>
            </div>
          )}
          newItem={() => ({ id: uuidv4(), label: '選択肢', value: uuidv4() })}
        />
      )}

      {/* ─ Radio options ─ */}
      {type === 'radio' && (
        <OptionsEditor<RadioOption>
          label="選択肢"
          items={props.radioOptions ?? []}
          onChange={(items) => up({ radioOptions: items })}
          renderItem={(item, i, update, remove) => (
            <div key={item.id} className="flex gap-1.5 bg-slate-800 rounded-lg p-1.5">
              <input type="text" value={item.label} onChange={(e) => update({ label: e.target.value })} placeholder="ラベル" maxLength={50}
                className="prop-input flex-1 text-xs" />
              <button onClick={remove} className="text-red-400 hover:text-red-300 text-xs px-1">×</button>
            </div>
          )}
          newItem={() => ({ id: uuidv4(), label: '選択肢', value: uuidv4() })}
        />
      )}

      {/* ─ List items ─ */}
      {type === 'list' && (
        <ListItemsEditor items={props.items ?? []} onChange={(items) => up({ items })} />
      )}

      {/* ─ Nav items ─ */}
      {type === 'nav' && (
        <NavItemsEditor items={props.navItems ?? []} onChange={(navItems) => up({ navItems })} />
      )}

      {/* ─ QR code ─ */}
      {type === 'qrcode' && (
        <PRow label="QR URL">
          <PInput value={props.qrValue || ''} onChange={(v) => { if (isSafeUrl(v)) up({ qrValue: v }); }} placeholder="https://example.com" maxLength={2048} />
        </PRow>
      )}

      {/* ─ Text alignment ─ */}
      {(type === 'text' || type === 'heading') && (
        <PRow label="配置">
          <div className="flex gap-1">
            {(['left','center','right'] as const).map((a) => (
              <button key={a} onClick={() => up({ align: a })}
                className={cn('flex-1 py-1.5 rounded text-xs font-medium transition-colors',
                  (props.align || 'left') === a ? 'bg-[#1ec8a5] text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600')}>
                {a === 'left' ? '左' : a === 'center' ? '中央' : '右'}
              </button>
            ))}
          </div>
        </PRow>
      )}

      {/* ─ Style ─ */}
      <PSection title="スタイル" />

      {!['image','divider','spacer','nav','shape'].includes(type) && (
        <PColorRow label="文字色" value={props.color || ''} onChange={(v) => up({ color: v })} />
      )}
      {['card','container','button'].includes(type) && (
        <PColorRow label="背景色" value={props.bgColor || ''} onChange={(v) => up({ bgColor: v })} />
      )}
      {(type === 'text' || type === 'heading') && (
        <>
          <PRow label="フォントサイズ"><PInput value={props.fontSize || ''} onChange={(v) => up({ fontSize: v })} placeholder="16px" maxLength={20} /></PRow>
          <PRow label="フォントウェイト">
            <PSelect value={props.fontWeight || ''}  onChange={(v) => up({ fontWeight: v })}
              options={[{ label: 'デフォルト', value: '' },{ label: '300', value: '300' },{ label: '400', value: '400' },{ label: '500', value: '500' },{ label: '600', value: '600' },{ label: '700', value: '700' },{ label: '900', value: '900' }]} />
          </PRow>
        </>
      )}
      {!['divider','spacer'].includes(type) && (
        <>
          <PRow label="幅"><PInput value={props.width || ''} onChange={(v) => up({ width: v })} placeholder="100%, 200px, auto" maxLength={20} /></PRow>
          <PRow label="パディング"><PInput value={props.padding || ''} onChange={(v) => up({ padding: v })} placeholder="16px" maxLength={40} /></PRow>
          <PRow label="角丸"><PInput value={props.borderRadius || ''} onChange={(v) => up({ borderRadius: v })} placeholder="8px, 50%" maxLength={20} /></PRow>
        </>
      )}

      {/* ─ Delete ─ */}
      <div className="mt-5 pt-4 border-t border-slate-800">
        <button onClick={() => { const s = useBuilderStore.getState(); s.removeElement(element.id); s.selectElement(null); }}
          className="w-full py-2 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20">
          要素を削除
        </button>
      </div>
    </div>
  );
}

/* ─── Generic options editor ─── */
function OptionsEditor<T extends { id: string }>({ label, items, onChange, renderItem, newItem }: {
  label: string;
  items: T[];
  onChange: (items: T[]) => void;
  renderItem: (item: T, i: number, update: (patch: Partial<T>) => void, remove: () => void) => React.ReactNode;
  newItem: () => T;
}) {
  return (
    <div className="mb-3">
      <PLabel>{label}</PLabel>
      <div className="space-y-1.5 max-h-40 overflow-y-auto">
        {items.map((item, i) => renderItem(item, i,
          (patch) => onChange(items.map((it, j) => j === i ? { ...it, ...patch } : it)),
          () => onChange(items.filter((_, j) => j !== i)),
        ))}
      </div>
      <button onClick={() => onChange([...items, newItem()])}
        className="mt-2 w-full py-1.5 rounded-md text-xs font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors border border-slate-600">
        ＋ 追加
      </button>
    </div>
  );
}

/* ─── List items editor ─── */
function ListItemsEditor({ items, onChange }: { items: ListItem[]; onChange: (items: ListItem[]) => void }) {
  const update = (i: number, field: keyof ListItem, v: string) =>
    onChange(items.map((it, j) => j === i ? { ...it, [field]: v } : it));
  return (
    <div className="mb-3">
      <PLabel>リスト項目</PLabel>
      <div className="space-y-1.5 max-h-48 overflow-y-auto">
        {items.map((item, i) => (
          <div key={item.id} className="bg-slate-800 rounded-lg p-2 space-y-1.5">
            <div className="flex gap-1.5">
              <input type="text" value={item.icon || ''} onChange={(e) => update(i, 'icon', e.target.value)} placeholder="絵文字" maxLength={4}
                className="prop-input w-10 text-center" />
              <input type="text" value={item.title} onChange={(e) => update(i, 'title', e.target.value)} placeholder="タイトル" maxLength={100}
                className="prop-input flex-1 text-xs" />
              <button onClick={() => onChange(items.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-300 text-xs px-1">×</button>
            </div>
            <input type="text" value={item.subtitle || ''} onChange={(e) => update(i, 'subtitle', e.target.value)} placeholder="サブテキスト" maxLength={200}
              className="prop-input w-full text-xs" />
          </div>
        ))}
      </div>
      <button onClick={() => onChange([...items, { id: uuidv4(), title: '新しい項目', icon: '•' }])}
        className="mt-2 w-full py-1.5 rounded-md text-xs font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors border border-slate-600">
        ＋ 項目を追加
      </button>
    </div>
  );
}

/* ─── Nav items editor ─── */
function NavItemsEditor({ items, onChange }: { items: NavItem[]; onChange: (items: NavItem[]) => void }) {
  const update = (i: number, field: keyof NavItem, v: string) =>
    onChange(items.map((it, j) => j === i ? { ...it, [field]: v } : it));
  return (
    <div className="mb-3">
      <PLabel>ナビ項目</PLabel>
      <div className="space-y-1.5 max-h-40 overflow-y-auto">
        {items.map((item, i) => (
          <div key={item.id} className="flex gap-1.5 bg-slate-800 rounded-lg p-1.5">
            <input type="text" value={item.icon || ''} onChange={(e) => update(i, 'icon', e.target.value)} placeholder="絵文字" maxLength={4}
              className="prop-input w-10 text-center" />
            <input type="text" value={item.label} onChange={(e) => update(i, 'label', e.target.value)} placeholder="ラベル" maxLength={20}
              className="prop-input flex-1 text-xs" />
            <button onClick={() => onChange(items.filter((_, j) => j !== i))} disabled={items.length <= 1}
              className="text-red-400 hover:text-red-300 disabled:opacity-30 text-xs px-1">×</button>
          </div>
        ))}
      </div>
      <button onClick={() => onChange([...items, { id: uuidv4(), label: 'タブ', icon: '○' }])}
        className="mt-2 w-full py-1.5 rounded-md text-xs font-medium bg-slate-700 text-slate-300 hover:bg-slate-600 transition-colors border border-slate-600">
        ＋ 追加
      </button>
    </div>
  );
}

/* ─── Tags editor ─── */
function TagsEditor({ tags, onChange }: { tags: string[]; onChange: (t: string[]) => void }) {
  const [input, setInput] = useState('');
  const add = () => { if (input.trim() && !tags.includes(input.trim())) { onChange([...tags, input.trim()]); setInput(''); } };
  return (
    <div className="mb-3">
      <PLabel>タグ</PLabel>
      <div className="flex flex-wrap gap-1.5 mb-2 min-h-6">
        {tags.map((t, i) => (
          <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 bg-[#e6faf5] text-[#1ec8a5] rounded-full text-xs">
            {t}
            <button onClick={() => onChange(tags.filter((_, j) => j !== i))} className="text-[#1ec8a5] hover:text-[#13a98a]">×</button>
          </span>
        ))}
      </div>
      <div className="flex gap-1.5">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} placeholder="新しいタグ" maxLength={30}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); add(); } }}
          className="prop-input flex-1 text-xs" />
        <button onClick={add} className="px-3 py-1.5 bg-slate-700 text-slate-300 hover:bg-slate-600 text-xs rounded-md border border-slate-600">追加</button>
      </div>
    </div>
  );
}

/* ─── Panel wrapper ─── */
export default function PropertiesPanel() {
  const { project, selectedElementId, selectedPageId } = useBuilderStore();
  const currentPage = project?.pages.find((p) => p.id === selectedPageId);
  const selectedElement = currentPage?.elements.find((el) => el.id === selectedElementId);

  return (
    <aside className="builder-properties flex flex-col">
      <div className="p-3 border-b border-slate-700 flex items-center gap-2">
        <svg className="w-3.5 h-3.5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
        </svg>
        <h2 className="text-slate-200 font-semibold text-xs uppercase tracking-widest">プロパティ</h2>
      </div>
      <div className="flex-1 overflow-y-auto">
        {selectedElement ? (
          <ElementProperties element={selectedElement} />
        ) : (
          <div className="flex flex-col items-center justify-center h-52 text-center px-4">
            <svg className="w-8 h-8 text-slate-700 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
            <p className="text-slate-500 text-xs font-medium">要素を選択してください</p>
            <p className="text-slate-700 text-xs mt-1">キャンバスの要素をクリック</p>
          </div>
        )}
      </div>
    </aside>
  );
}
