'use client';

import { useState } from 'react';

const FAQ_ITEMS = [
  {
    q: 'プログラミングの知識は必要ですか？',
    a: 'まったく必要ありません。ドラッグ＆ドロップとプロパティ設定だけでアプリが完成します。デザインの知識がなくてもプロ品質のアプリを作れます。',
  },
  {
    q: '作ったアプリはどこで公開できますか？',
    a: '「公開する」ボタンを押すだけで、専用URLが発行されます。Freeプランでは click.dev のサブドメインで公開できます。StandardプランからはカスタムドメインもOKです。',
  },
  {
    q: 'データはどこに保存されますか？',
    a: '現在はブラウザのローカルストレージに保存されます。公開機能を使うとサーバーにも保存されます。機密データは保存しないようご注意ください。',
  },
  {
    q: '無料プランでできることを教えてください。',
    a: 'アプリ作成3件、月間アクティブユーザー1,000人まで、基本コンポーネント全て使用可能です。期間制限なしで永久に無料でご利用いただけます。',
  },
];

export default function FaqAccordion() {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <div className="space-y-3">
      {FAQ_ITEMS.map((item, i) => (
        <div
          key={i}
          className="border border-[var(--line)] rounded-2xl overflow-hidden bg-white"
        >
          <button
            onClick={() => setOpenIndex(openIndex === i ? null : i)}
            className="w-full flex items-center justify-between px-6 py-4 text-left group"
            aria-expanded={openIndex === i}
          >
            <span className="font-semibold text-[var(--ink)] text-sm leading-relaxed pr-4">
              {item.q}
            </span>
            <span
              className={`w-6 h-6 rounded-full bg-[var(--green-l)] text-[var(--green)] flex items-center justify-center shrink-0 transition-transform duration-300 ${
                openIndex === i ? 'rotate-45' : ''
              }`}
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
              </svg>
            </span>
          </button>

          <div
            className={`faq-answer ${openIndex === i ? 'open' : ''}`}
            style={openIndex === i ? { maxHeight: '200px', paddingBottom: '16px' } : {}}
          >
            <p className="px-6 text-sm text-[var(--gray)] leading-relaxed">{item.a}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
