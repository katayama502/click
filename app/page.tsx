'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { v4 as uuidv4 } from 'uuid';
import FaqAccordion from '@/components/FaqAccordion';
import ContactForm from '@/components/ContactForm';
import { AppProject } from '@/lib/types';

// ─── Constants ────────────────────────────────────────────────────
const STORAGE_KEY = 'click_builder_v1';

const APP_TYPES = [
  { emoji: '🎯', title: '診断アプリ', desc: 'パーソナリティ診断・相性診断など' },
  { emoji: '🛒', title: 'ECサイト', desc: '商品販売・予約・決済機能付き' },
  { emoji: '💑', title: 'マッチングアプリ', desc: 'ユーザー登録・マッチング機能' },
  { emoji: '📋', title: 'アンケート/LP', desc: 'フォーム収集・リード獲得' },
  { emoji: '🏢', title: '社内業務ツール', desc: '申請・承認フロー・管理画面' },
  { emoji: '🤝', title: 'コミュニティ', desc: '会員サービス・掲示板・SNS' },
];

const VOICES = [
  {
    company: 'アジケ株式会社',
    role: 'デザイン部門責任者',
    quote: 'プロトタイプ作成が週1日から半日に短縮。クライアントへのプレゼンが格段にスムーズになりました。',
    avatar: 'A',
    color: 'bg-purple-500',
  },
  {
    company: '東武トップツアーズ株式会社',
    role: 'DX推進室',
    quote: 'エンジニアなしで社内申請フローをデジタル化。展開まで2週間で完了し、コストも大幅削減できました。',
    avatar: 'T',
    color: 'bg-blue-500',
  },
  {
    company: '日本農業新聞',
    role: 'デジタル事業部',
    quote: '読者向けアンケートアプリを内製化。回答率が紙の3倍になり、データ収集の質が大きく向上しました。',
    avatar: 'N',
    color: 'bg-green-500',
  },
];

const FEATURES_12 = [
  { icon: '💬', title: 'LINEログイン' },
  { icon: '💳', title: '決済機能' },
  { icon: '🔗', title: 'API連携' },
  { icon: '🤖', title: 'AI機能' },
  { icon: '💬', title: 'チャット' },
  { icon: '🗺️', title: '地図表示' },
  { icon: '📣', title: 'Push通知' },
  { icon: '📷', title: 'バーコード' },
  { icon: '🖥️', title: '管理画面自動生成' },
  { icon: '⭐', title: 'スタンプ' },
  { icon: '📊', title: 'Google Analytics' },
  { icon: '🌐', title: '独自ドメイン' },
];

const PRICING_PLANS = [
  {
    name: 'Free',
    price: '¥0',
    period: '永久無料',
    description: '個人利用・小規模プロジェクトに',
    badge: null,
    featured: false,
    features: [
      'アプリ作成 3件まで',
      '月間アクティブユーザー 1,000人',
      '基本コンポーネント',
      'Click サブドメインで公開',
      'コミュニティサポート',
    ],
    cta: '無料で始める',
  },
  {
    name: 'Standard',
    price: '¥4,400',
    period: '/月（年一括・税抜）',
    description: '成長中のチーム・スタートアップに',
    badge: 'おすすめ',
    featured: true,
    features: [
      'アプリ作成 無制限',
      '月間アクティブユーザー 10,000人',
      '全コンポーネント使用可能',
      'カスタムドメイン対応',
      'メールサポート',
      'チームコラボ（5名）',
      'API連携',
    ],
    cta: 'Standardを始める',
  },
  {
    name: 'Pro',
    price: '¥19,600',
    period: '/月（年一括・税抜）',
    description: '大規模チーム・エンタープライズに',
    badge: null,
    featured: false,
    features: [
      'アプリ作成 無制限',
      '月間アクティブユーザー 無制限',
      '全コンポーネント使用可能',
      'カスタムドメイン対応',
      '優先サポート（24時間）',
      'チームコラボ 無制限',
      'SSO/SAML対応',
      'SLA保証',
    ],
    cta: 'Proを始める',
  },
  {
    name: 'Enterprise',
    price: '要問合せ',
    period: '',
    description: '大企業・官公庁・グループ企業向け',
    badge: null,
    featured: false,
    features: [
      'Proの全機能',
      'IPアドレス制限',
      '専任カスタマーサクセス',
      'オンプレミス対応',
      'カスタム契約・SLA',
      'セキュリティ監査対応',
    ],
    cta: 'お問い合わせ',
  },
];

// ─── Device option types ───────────────────────────────────────────
type DeviceType = 'mobile' | 'pc' | 'responsive';
type PrimaryDevice = 'mobile' | 'tablet' | 'pc';

// ─── Inline project factory (mirrors lib/store createDefaultProject) ─
function createProjectInline(name: string): AppProject {
  const pageId = uuidv4();
  return {
    id: uuidv4(),
    name: name || '新しいアプリ',
    description: '',
    pages: [
      {
        id: pageId,
        name: 'ホーム',
        elements: [],
        backgroundColor: '#ffffff',
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    database: {
      tables: [
        {
          id: uuidv4(),
          name: 'Users',
          columns: [
            { id: uuidv4(), name: 'Name', type: 'text' as const },
            { id: uuidv4(), name: 'パスワード', type: 'password' as const },
          ],
          rows: [],
          createdAt: new Date().toISOString(),
        },
      ],
    },
  };
}

// ─── Relative time helper ─────────────────────────────────────────
function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'たった今';
  if (min < 60) return `${min}分前`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}時間前`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}日前`;
  return `${Math.floor(day / 30)}ヶ月前`;
}

// ─── Step indicator ───────────────────────────────────────────────
function StepDots({ total, current }: { total: number; current: number }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="rounded-full transition-all duration-200"
          style={{
            width: i === current ? 24 : 8,
            height: 8,
            background: i === current ? '#1ec8a5' : '#e5e7eb',
          }}
        />
      ))}
    </div>
  );
}

// ─── New Project Wizard Modal ─────────────────────────────────────
function NewProjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [device, setDevice] = useState<DeviceType>('mobile');
  const [primaryDevice, setPrimaryDevice] = useState<PrimaryDevice>('mobile');
  const [projectName, setProjectName] = useState('');

  // Determine effective steps: if responsive (v4), show step 1 (primary device)
  const steps = device === 'responsive' ? 3 : 2;
  // Map logical step index:
  //   step 0 = device selection
  //   step 1 = primary device (only if responsive)
  //   last   = name input

  const handleNext = () => {
    if (step === 0) {
      if (device === 'responsive') {
        setStep(1);
      } else {
        setStep(2);
      }
    } else if (step === 1) {
      setStep(2);
    }
  };

  const handleCreate = () => {
    const name = projectName.trim() || '新しいアプリ';
    const project = createProjectInline(name);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    onCreated();
    router.push('/builder');
  };

  // Visual step index for dots
  const dotIndex = step === 2 ? steps - 1 : step;

  const deviceOptions: { id: DeviceType; icon: string; label: string; sub?: string; badge?: string }[] = [
    { id: 'mobile', icon: '📱', label: 'モバイルのみ', sub: 'v3' },
    { id: 'pc', icon: '🖥️', label: 'PCのみ', sub: 'v3' },
    { id: 'responsive', icon: '📱🖥️', label: 'PC / タブレット / モバイル', sub: 'v4 レスポンシブ', badge: 'Pro' },
  ];

  const primaryOptions: { id: PrimaryDevice; icon: string; label: string }[] = [
    { id: 'mobile', icon: '📱', label: 'モバイル' },
    { id: 'tablet', icon: '📟', label: 'タブレット' },
    { id: 'pc', icon: '🖥️', label: 'PC' },
  ];

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8 relative"
        style={{ maxHeight: '90vh', overflowY: 'auto' }}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>

        <StepDots total={steps} current={dotIndex} />

        {/* Step 0: Device selection */}
        {step === 0 && (
          <>
            <h2 className="text-xl font-black text-center mb-1" style={{ color: 'var(--ink)' }}>
              アクセスするデバイスを選択
            </h2>
            <p className="text-sm text-center mb-6" style={{ color: 'var(--gray)' }}>
              このアプリを利用するユーザーのデバイスを選んでください
            </p>
            <div className="space-y-3">
              {deviceOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setDevice(opt.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150"
                  style={{
                    borderColor: device === opt.id ? '#1ec8a5' : '#e5e7eb',
                    background: device === opt.id ? '#f0fdfb' : '#fff',
                  }}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <div className="flex-1">
                    <div className="font-semibold text-sm" style={{ color: 'var(--ink)' }}>
                      {opt.label}
                    </div>
                    {opt.sub && (
                      <div className="text-xs mt-0.5" style={{ color: 'var(--gray)' }}>{opt.sub}</div>
                    )}
                  </div>
                  {opt.badge && (
                    <span
                      className="text-xs font-bold px-2 py-0.5 rounded-full"
                      style={{ background: '#1ec8a5', color: '#fff' }}
                    >
                      {opt.badge}
                    </span>
                  )}
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                    style={{ borderColor: device === opt.id ? '#1ec8a5' : '#d1d5db' }}
                  >
                    {device === opt.id && (
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#1ec8a5' }} />
                    )}
                  </div>
                </button>
              ))}
            </div>
            <button
              onClick={handleNext}
              className="mt-6 w-full py-3 rounded-xl font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: '#1ec8a5' }}
            >
              次へ
            </button>
          </>
        )}

        {/* Step 1: Primary device (only for responsive) */}
        {step === 1 && (
          <>
            <h2 className="text-xl font-black text-center mb-1" style={{ color: 'var(--ink)' }}>
              プライマリーに設定するデバイスを選択
            </h2>
            <p className="text-sm text-center mb-6" style={{ color: 'var(--gray)' }}>
              編集画面の基準デバイスを選択します
            </p>
            <div className="space-y-3">
              {primaryOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setPrimaryDevice(opt.id)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl border-2 text-left transition-all duration-150"
                  style={{
                    borderColor: primaryDevice === opt.id ? '#1ec8a5' : '#e5e7eb',
                    background: primaryDevice === opt.id ? '#f0fdfb' : '#fff',
                  }}
                >
                  <span className="text-2xl">{opt.icon}</span>
                  <div className="flex-1 font-semibold text-sm" style={{ color: 'var(--ink)' }}>
                    {opt.label}
                  </div>
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
                    style={{ borderColor: primaryDevice === opt.id ? '#1ec8a5' : '#d1d5db' }}
                  >
                    {primaryDevice === opt.id && (
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: '#1ec8a5' }} />
                    )}
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep(0)}
                className="flex-1 py-3 rounded-xl font-semibold border transition-colors"
                style={{ borderColor: '#e5e7eb', color: 'var(--gray)' }}
              >
                戻る
              </button>
              <button
                onClick={handleNext}
                className="flex-1 py-3 rounded-xl font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: '#1ec8a5' }}
              >
                次へ
              </button>
            </div>
          </>
        )}

        {/* Step 2: Project name */}
        {step === 2 && (
          <>
            <h2 className="text-xl font-black text-center mb-1" style={{ color: 'var(--ink)' }}>
              プロダクト名を入力
            </h2>
            <p className="text-sm text-center mb-6" style={{ color: 'var(--gray)' }}>
              後から変更できます
            </p>
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
              placeholder="例：ECサイト"
              autoFocus
              className="w-full px-4 py-3 rounded-xl border-2 text-sm outline-none transition-colors"
              style={{
                borderColor: '#e5e7eb',
                color: 'var(--ink)',
              }}
              onFocus={(e) => { e.currentTarget.style.borderColor = '#1ec8a5'; }}
              onBlur={(e) => { e.currentTarget.style.borderColor = '#e5e7eb'; }}
            />
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setStep(device === 'responsive' ? 1 : 0)}
                className="flex-1 py-3 rounded-xl font-semibold border transition-colors"
                style={{ borderColor: '#e5e7eb', color: 'var(--gray)' }}
              >
                戻る
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 py-3 rounded-xl font-bold text-white transition-opacity hover:opacity-90"
                style={{ background: '#1ec8a5' }}
              >
                作成する
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Project Card ─────────────────────────────────────────────────
function ProjectCard({ project }: { project: AppProject }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      className="bg-white rounded-xl border overflow-hidden cursor-pointer transition-all duration-200"
      style={{
        borderColor: '#e5e7eb',
        boxShadow: hovered ? '0 8px 24px rgba(0,0,0,0.12)' : '0 1px 4px rgba(0,0,0,0.06)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Thumbnail area */}
      <div
        className="relative h-36 flex items-center justify-center"
        style={{ background: 'linear-gradient(135deg, #f0fdfb, #e0f9f4)' }}
      >
        <span className="text-5xl select-none">📱</span>

        {/* Hover actions */}
        {hovered && (
          <div className="absolute inset-0 flex items-center justify-center gap-3 bg-black/30 transition-all">
            <Link
              href="/builder"
              className="px-4 py-2 rounded-lg font-semibold text-sm text-white transition-opacity hover:opacity-90"
              style={{ background: '#1ec8a5' }}
              onClick={(e) => e.stopPropagation()}
            >
              編集
            </Link>
            <Link
              href={`/preview/${project.id}`}
              target="_blank"
              className="px-4 py-2 rounded-lg font-semibold text-sm bg-white transition-opacity hover:opacity-90"
              style={{ color: 'var(--ink)' }}
              onClick={(e) => e.stopPropagation()}
            >
              プレビュー
            </Link>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="font-bold text-sm truncate" style={{ color: 'var(--ink)' }}>
          {project.name}
        </div>
        <div className="text-xs mt-1" style={{ color: 'var(--gray)' }}>
          更新: {relativeTime(project.updatedAt)}
        </div>
      </div>
    </div>
  );
}

// ─── Workspace Section ────────────────────────────────────────────
function WorkspaceSection() {
  const [project, setProject] = useState<AppProject | null>(null);
  const [loaded, setLoaded] = useState(false);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setProject(JSON.parse(raw) as AppProject);
    } catch {
      // ignore
    }
    setLoaded(true);
  }, []);

  const handleCreated = () => {
    // Reload project from localStorage after creation
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setProject(JSON.parse(raw) as AppProject);
    } catch {
      // ignore
    }
  };

  if (!loaded) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#1ec8a5', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  return (
    <section className="max-w-7xl mx-auto px-6 py-12">
      {/* Section header */}
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-black" style={{ color: 'var(--ink)' }}>
          マイプロダクト
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-white text-sm transition-opacity hover:opacity-90 shadow-sm"
          style={{ background: '#1ec8a5' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          新規プロダクト作成
        </button>
      </div>

      {/* No projects: centered empty state */}
      {!project ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div
            className="w-20 h-20 rounded-2xl flex items-center justify-center text-4xl mb-6"
            style={{ background: '#f0fdfb' }}
          >
            🚀
          </div>
          <h3 className="text-2xl font-black mb-2" style={{ color: 'var(--ink)' }}>
            最初のアプリを作ろう
          </h3>
          <p className="text-sm mb-8 max-w-xs" style={{ color: 'var(--gray)' }}>
            ドラッグ&amp;ドロップだけでプロ品質のアプリが作れます。まずはプロダクトを作成してみましょう。
          </p>
          <button
            onClick={() => setShowModal(true)}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white text-base transition-all hover:scale-105 shadow-lg"
            style={{ background: '#1ec8a5' }}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            新規プロダクト作成
          </button>
        </div>
      ) : (
        /* Project grid */
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          <ProjectCard project={project} />

          {/* Add new card */}
          <button
            onClick={() => setShowModal(true)}
            className="bg-white rounded-xl border-2 border-dashed h-full min-h-[168px] flex flex-col items-center justify-center gap-2 transition-all hover:border-[#1ec8a5] hover:bg-[#f0fdfb] group"
            style={{ borderColor: '#e5e7eb' }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-xl transition-colors"
              style={{ background: '#f3f4f6' }}
            >
              <svg className="w-5 h-5 text-gray-400 group-hover:text-[#1ec8a5] transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </div>
            <span className="text-xs font-semibold text-gray-400 group-hover:text-[#1ec8a5] transition-colors">
              新規作成
            </span>
          </button>
        </div>
      )}

      {showModal && (
        <NewProjectModal
          onClose={() => setShowModal(false)}
          onCreated={() => {
            handleCreated();
            setShowModal(false);
          }}
        />
      )}
    </section>
  );
}

// ─── Main Page ────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--ink)' }}>

      {/* ── Workspace Navbar ── */}
      <header
        className="sticky top-0 z-40 bg-white"
        style={{ borderBottom: '1px solid var(--line)' }}
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div
              className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #1ec8a5, #16a085)' }}
            >
              <span className="text-white font-black text-sm">C</span>
            </div>
            <span className="text-xl font-black" style={{ color: 'var(--ink)' }}>Click</span>
          </div>

          {/* Right: avatar + logout */}
          <div className="flex items-center gap-3">
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold"
              style={{ background: '#1ec8a5' }}
            >
              U
            </div>
            <button
              className="text-sm font-medium px-3 py-1.5 rounded-lg border transition-colors hover:bg-gray-50"
              style={{ color: 'var(--gray)', borderColor: 'var(--line)' }}
              onClick={() => {/* no-op */}}
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* ── Workspace ── */}
      <WorkspaceSection />

      {/* ── Divider ── */}
      <div className="max-w-7xl mx-auto px-6">
        <hr style={{ borderColor: 'var(--line)' }} />
      </div>

      {/* ── LP: Hero ── */}
      <section className="relative pt-24 pb-28 overflow-hidden text-center">
        <div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(160deg, var(--green) 0%, #0ea5e9 60%, var(--bg2) 100%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{ background: 'linear-gradient(to bottom, transparent 40%, var(--bg))', top: '30%' }}
        />

        <div className="relative max-w-5xl mx-auto px-6">
          <div
            className="inline-flex items-center gap-2 text-white/90 text-sm font-medium px-4 py-1.5 rounded-full mb-8 border border-white/20"
            style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)' }}
          >
            <span className="w-2 h-2 rounded-full bg-[var(--yellow)] animate-pulse" />
            70,000+ アプリが作成済み
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-white leading-tight mb-6">
            ドラッグ&amp;ドロップで
            <br />
            <span
              style={{
                background: 'linear-gradient(90deg, var(--yellow), #fff)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              アイデアがそのまま形に
            </span>
          </h1>

          <p className="text-xl text-white/80 max-w-2xl mx-auto mb-10 leading-relaxed">
            コーディング不要。プロ品質のアプリを誰でも数日でリリース。
            <br className="hidden md:block" />
            2,500万人のユーザーに選ばれた日本製ノーコードツール。
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-14">
            <Link
              href="/builder"
              className="inline-flex items-center gap-2 text-lg font-bold px-8 py-4 rounded-2xl shadow-xl transition-all hover:scale-105"
              style={{ background: 'var(--bg)', color: 'var(--green)' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              無料でアプリを作る
            </Link>
            <a
              href="#apps"
              className="inline-flex items-center gap-2 text-lg font-semibold px-8 py-4 rounded-2xl border border-white/30 text-white transition-all hover:bg-white/10"
            >
              作れるアプリを見る
            </a>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-6 md:gap-12">
            {[
              ['70,000+', 'アプリ作成数'],
              ['2,500万', '累計ユーザー'],
              ['26,000+', '組織導入'],
            ].map(([num, label]) => (
              <div key={label} className="text-center text-white">
                <div className="text-3xl font-black mb-0.5">{num}</div>
                <div className="text-sm text-white/70">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Apps ── */}
      <section id="apps" className="py-24" style={{ background: 'var(--bg2)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span
              className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4"
              style={{ background: 'var(--green-l)', color: 'var(--green)' }}
            >
              作れるアプリ
            </span>
            <h2 className="text-4xl md:text-5xl font-black" style={{ color: 'var(--ink)' }}>
              どんなアプリも
              <span className="gradient-text"> Click ひとつで</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {APP_TYPES.map((app) => (
              <div
                key={app.title}
                className="bg-white rounded-2xl p-6 border hover:shadow-lg transition-all duration-300 group cursor-pointer"
                style={{ borderColor: 'var(--line)', boxShadow: 'var(--shadow)' }}
              >
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mb-4 transition-transform group-hover:scale-110"
                  style={{ background: 'var(--green-l)' }}
                >
                  {app.emoji}
                </div>
                <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--ink)' }}>
                  {app.title}
                </h3>
                <p className="text-sm" style={{ color: 'var(--gray)' }}>{app.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Voices ── */}
      <section id="voices" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span
              className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4"
              style={{ background: 'var(--green-l)', color: 'var(--green)' }}
            >
              導入事例
            </span>
            <h2 className="text-4xl md:text-5xl font-black" style={{ color: 'var(--ink)' }}>
              各業界のリーダーが選ぶ理由
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {VOICES.map((v) => (
              <div
                key={v.company}
                className="rounded-2xl p-6 border"
                style={{ borderColor: 'var(--line)', boxShadow: 'var(--shadow)' }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className={`w-10 h-10 rounded-xl ${v.color} flex items-center justify-center text-white font-bold text-lg shrink-0`}
                  >
                    {v.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-sm" style={{ color: 'var(--ink)' }}>
                      {v.company}
                    </div>
                    <div className="text-xs" style={{ color: 'var(--gray)' }}>{v.role}</div>
                  </div>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--gray)' }}>
                  &ldquo;{v.quote}&rdquo;
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 3つの強み ── */}
      <section className="py-24" style={{ background: 'var(--bg2)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span
              className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4"
              style={{ background: 'var(--green-l)', color: 'var(--green)' }}
            >
              3つの強み
            </span>
            <h2 className="text-4xl md:text-5xl font-black" style={{ color: 'var(--ink)' }}>
              Click が選ばれる理由
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: '🖱️',
                title: 'ドラッグ&ドロップ',
                desc: '要素を並べるだけでUIが完成。直感的な操作で誰でもすぐに使いこなせます。',
              },
              {
                icon: '⚡',
                title: '数日でリリース',
                desc: 'テンプレートと豊富なコンポーネントで、企画から公開まで最短1日。',
              },
              {
                icon: '🇯🇵',
                title: '日本製',
                desc: '日本語サポート・国内データセンター・日本の法規制に対応。安心してご利用いただけます。',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white rounded-2xl p-8 text-center border"
                style={{ borderColor: 'var(--line)', boxShadow: 'var(--shadow)' }}
              >
                <div className="text-5xl mb-5">{item.icon}</div>
                <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--ink)' }}>
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--gray)' }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Function / 12機能 ── */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span
              className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4"
              style={{ background: 'var(--green-l)', color: 'var(--green)' }}
            >
              機能
            </span>
            <h2 className="text-4xl md:text-5xl font-black" style={{ color: 'var(--ink)' }}>
              充実した12の機能
            </h2>
            <p className="text-lg mt-4" style={{ color: 'var(--gray)' }}>
              外部ツール連携から決済・AI連携まで、あらゆるアプリに対応
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {FEATURES_12.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl p-5 text-center border group hover:border-[var(--green)] transition-colors"
                style={{ borderColor: 'var(--line)', background: 'var(--bg2)' }}
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <div className="text-sm font-semibold" style={{ color: 'var(--ink)' }}>
                  {f.title}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA Band ── */}
      <section className="py-16" style={{ background: 'var(--green-l)' }}>
        <div className="max-w-4xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-black mb-4" style={{ color: 'var(--ink)' }}>
            まずは無料プランで試してみよう
          </h2>
          <p className="mb-8" style={{ color: 'var(--gray)' }}>
            クレジットカード不要・アカウント登録なしでもお試しいただけます。
          </p>
          <Link
            href="/builder"
            className="inline-flex items-center gap-2 text-white font-bold text-lg px-8 py-4 rounded-2xl shadow-lg hover:shadow-xl hover:scale-105 transition-all duration-200"
            style={{ background: 'var(--green)' }}
          >
            無料でアプリを作る
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </section>

      {/* ── Pricing ── */}
      <section id="pricing" className="py-24" style={{ background: 'var(--bg2)' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <span
              className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4"
              style={{ background: 'var(--green-l)', color: 'var(--green)' }}
            >
              料金プラン
            </span>
            <h2 className="text-4xl md:text-5xl font-black" style={{ color: 'var(--ink)' }}>
              シンプルな料金体系
            </h2>
            <p className="mt-4" style={{ color: 'var(--gray)' }}>
              用途に合わせて選べる4つのプラン
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {PRICING_PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`bg-white rounded-2xl border-2 overflow-hidden flex flex-col transition-transform ${
                  plan.featured ? 'scale-105 shadow-2xl' : 'shadow-md'
                }`}
                style={{
                  borderColor: plan.featured ? 'var(--green)' : 'var(--line)',
                }}
              >
                {/* Header */}
                <div
                  className="p-6"
                  style={{
                    background: plan.featured
                      ? 'linear-gradient(135deg, var(--green), var(--green-d))'
                      : 'var(--bg2)',
                    color: plan.featured ? '#fff' : 'var(--ink)',
                  }}
                >
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-lg">{plan.name}</span>
                    {plan.badge && (
                      <span
                        className="text-xs font-bold px-2.5 py-1 rounded-full"
                        style={{
                          background: 'rgba(255,255,255,0.2)',
                          color: '#fff',
                          border: '1px solid rgba(255,255,255,0.3)',
                        }}
                      >
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <div className="text-3xl font-black mb-0.5">{plan.price}</div>
                  {plan.period && (
                    <div
                      className="text-xs"
                      style={{ color: plan.featured ? 'rgba(255,255,255,0.8)' : 'var(--gray)' }}
                    >
                      {plan.period}
                    </div>
                  )}
                  <div
                    className="text-xs mt-2"
                    style={{ color: plan.featured ? 'rgba(255,255,255,0.75)' : 'var(--gray)' }}
                  >
                    {plan.description}
                  </div>
                </div>

                {/* Features */}
                <div className="p-6 flex-1 flex flex-col">
                  <ul className="space-y-2.5 flex-1 mb-6">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-sm" style={{ color: 'var(--gray)' }}>
                        <svg
                          className="w-4 h-4 shrink-0 mt-0.5"
                          style={{ color: 'var(--green)' }}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plan.name === 'Enterprise' ? '#contact' : '/builder'}
                    className="block w-full text-center font-semibold py-3 px-4 rounded-xl transition-colors duration-200"
                    style={{
                      background: plan.featured ? 'var(--green)' : 'var(--green-l)',
                      color: plan.featured ? '#fff' : 'var(--green)',
                    }}
                  >
                    {plan.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security ── */}
      <section className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-6">
          <div className="text-center mb-12">
            <span
              className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4"
              style={{ background: 'var(--green-l)', color: 'var(--green)' }}
            >
              セキュリティ
            </span>
            <h2 className="text-4xl font-black" style={{ color: 'var(--ink)' }}>
              エンタープライズ水準の安全性
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { icon: '☁️', title: 'AWS 採用', desc: '国内リージョンのAWSで運用。冗長化構成で高い可用性を確保。' },
              { icon: '🔐', title: '2段階認証', desc: 'アカウントへの不正アクセスをSMS/認証アプリで防止。' },
              { icon: '🛡️', title: 'IPアドレス制限', desc: 'Enterpriseプランで特定IPからのみアクセス可能に制限。' },
            ].map((s) => (
              <div
                key={s.title}
                className="rounded-2xl p-6 border text-center"
                style={{ borderColor: 'var(--line)', background: 'var(--bg2)' }}
              >
                <div className="text-4xl mb-3">{s.icon}</div>
                <h3 className="font-bold mb-2" style={{ color: 'var(--ink)' }}>{s.title}</h3>
                <p className="text-sm" style={{ color: 'var(--gray)' }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ── */}
      <section id="faq" className="py-24" style={{ background: 'var(--bg2)' }}>
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-12">
            <span
              className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4"
              style={{ background: 'var(--green-l)', color: 'var(--green)' }}
            >
              FAQ
            </span>
            <h2 className="text-4xl font-black" style={{ color: 'var(--ink)' }}>
              よくある質問
            </h2>
          </div>
          <FaqAccordion />
        </div>
      </section>

      {/* ── Contact ── */}
      <section id="contact" className="py-24 bg-white">
        <div className="max-w-2xl mx-auto px-6">
          <div className="text-center mb-12">
            <span
              className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4"
              style={{ background: 'var(--green-l)', color: 'var(--green)' }}
            >
              お問い合わせ
            </span>
            <h2 className="text-4xl font-black" style={{ color: 'var(--ink)' }}>
              ご質問・ご相談はこちら
            </h2>
            <p className="mt-3 text-sm" style={{ color: 'var(--gray)' }}>
              2営業日以内に担当者よりご連絡いたします。
            </p>
          </div>
          <ContactForm />
        </div>
      </section>

      {/* ── Footer ── */}
      <footer style={{ background: 'var(--ink)', color: 'var(--line)' }} className="py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
            <div className="col-span-2">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, var(--green), var(--green-d))' }}
                >
                  <span className="text-white font-black text-sm">C</span>
                </div>
                <span className="text-xl font-black text-white">Click</span>
              </div>
              <p className="text-sm leading-relaxed max-w-xs opacity-70">
                誰でも簡単にアプリを作れるノーコードプラットフォーム。
                アステリアキャンバス株式会社（クローン版）
              </p>
            </div>
            {[
              { title: '製品', links: ['機能', 'テンプレート', '料金', 'ロードマップ'] },
              { title: 'リソース', links: ['ドキュメント', 'チュートリアル', 'ブログ', 'コミュニティ'] },
              { title: '会社', links: ['会社概要', '採用情報', 'プレス', 'お問い合わせ'] },
            ].map((col) => (
              <div key={col.title}>
                <div className="text-white font-semibold text-sm mb-4">{col.title}</div>
                <ul className="space-y-2">
                  {col.links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-sm opacity-60 hover:opacity-100 transition-opacity">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-white/10">
            <p className="text-sm opacity-50">© 2024 アステリアキャンバス株式会社（クローン版）. All rights reserved.</p>
            <div className="flex items-center gap-6">
              {['プライバシーポリシー', '利用規約', '特定商取引法'].map((label) => (
                <a key={label} href="#" className="text-sm opacity-50 hover:opacity-100 transition-opacity">
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
