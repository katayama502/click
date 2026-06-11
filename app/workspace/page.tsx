'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import { useHydrated } from '@/lib/useHydrated';
import type { App } from '@/lib/types';
import {
  Plus,
  Smartphone,
  Monitor,
  MoreHorizontal,
  Grid,
  Database,
  Home,
  BookOpen,
  Settings,
  Users,
  X,
  LogOut,
  ChevronRight,
  Play,
  Copy,
  Trash2,
  Pencil,
} from 'lucide-react';

// ────────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────────

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'たった今';
  if (mins < 60) return `${mins}分前`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}時間前`;
  const days = Math.floor(hours / 24);
  return days < 30 ? `${days}日前` : new Date(dateStr).toLocaleDateString('ja-JP');
}

const GRADIENT_CLASSES = [
  'from-teal-400 to-teal-600',
  'from-purple-400 to-purple-600',
  'from-blue-400 to-blue-600',
  'from-orange-400 to-orange-500',
  'from-pink-400 to-pink-600',
  'from-emerald-400 to-emerald-600',
  'from-indigo-400 to-indigo-600',
  'from-rose-400 to-rose-600',
];

function getGradient(name: string): string {
  return GRADIENT_CLASSES[name.charCodeAt(0) % GRADIENT_CLASSES.length];
}

// ────────────────────────────────────────────────────────────────
// App Settings Modal
// ────────────────────────────────────────────────────────────────

interface AppSettingsModalProps {
  app: App;
  onClose: () => void;
  onSave: (updates: { name: string; description: string }) => void;
  onDelete: () => void;
}

function AppSettingsModal({ app, onClose, onSave, onDelete }: AppSettingsModalProps) {
  const [name, setName] = useState(app.name);
  const [description, setDescription] = useState(app.description ?? '');
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">アプリ設定</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* App Name */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">アプリ名</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value.slice(0, 30))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all"
              placeholder="アプリ名を入力"
              maxLength={30}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{name.length}/30</p>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">説明</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value.slice(0, 100))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent transition-all resize-none"
              placeholder="アプリの説明（任意）"
              rows={3}
              maxLength={100}
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/100</p>
          </div>

          {/* Danger Zone */}
          <div className="border border-red-100 rounded-xl p-4 bg-red-50">
            <p className="text-xs font-medium text-red-700 mb-2">危険なゾーン</p>
            {!confirmDelete ? (
              <button
                onClick={() => setConfirmDelete(true)}
                className="text-sm text-red-500 hover:text-red-700 font-medium transition-colors"
              >
                このアプリを削除する
              </button>
            ) : (
              <div className="space-y-2">
                <p className="text-xs text-red-600">本当に削除しますか？この操作は元に戻せません。</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setConfirmDelete(false)}
                    className="text-xs px-3 py-1.5 border border-gray-200 text-gray-600 rounded-lg hover:bg-white transition-colors"
                  >
                    キャンセル
                  </button>
                  <button
                    onClick={onDelete}
                    className="text-xs px-3 py-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                  >
                    削除する
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-2.5 px-6 py-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="flex-1 border border-gray-200 text-gray-700 rounded-xl py-2.5 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            キャンセル
          </button>
          <button
            onClick={() => onSave({ name: name.trim() || app.name, description })}
            className="flex-1 bg-brand hover:bg-brand-600 text-white rounded-xl py-2.5 text-sm font-medium transition-colors"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// App Card (matches Click.dev card style)
// ────────────────────────────────────────────────────────────────

interface AppCardProps {
  app: App;
  menuAppId: string | null;
  onMenuToggle: (id: string | null) => void;
  onOpenCanvas: () => void;
  onOpenData: () => void;
  onDuplicate: () => void;
  onSettings: () => void;
  onDelete: () => void;
}

function AppCard({
  app,
  menuAppId,
  onMenuToggle,
  onOpenCanvas,
  onOpenData,
  onDuplicate,
  onSettings,
  onDelete,
}: AppCardProps) {
  const menuOpen = menuAppId === app.id;
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!menuOpen) return;
    function handleOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onMenuToggle(null);
      }
    }
    document.addEventListener('mousedown', handleOutside);
    return () => document.removeEventListener('mousedown', handleOutside);
  }, [menuOpen, onMenuToggle]);

  return (
    <div
      className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md cursor-pointer overflow-hidden transition-shadow group relative"
      onClick={onOpenCanvas}
    >
      {/* Thumbnail */}
      <div
        className={`h-40 flex items-center justify-center bg-gradient-to-br ${getGradient(app.name)} relative`}
      >
        {/* "Click" watermark text */}
        <div className="text-white/40 text-4xl font-black tracking-tighter select-none">Click</div>

        {/* v4 badge */}
        {app.version === 'v4' && (
          <div className="absolute top-2 left-2 bg-white/90 text-brand-700 text-xs font-bold px-1.5 py-0.5 rounded shadow-sm">
            v4
          </div>
        )}

        {/* Published badge — only when no menu open */}
        {app.published && !menuOpen && (
          <div className="absolute top-2 right-2 bg-green-500 text-white text-xs font-medium px-1.5 py-0.5 rounded">
            公開中
          </div>
        )}

        {/* 3-dot menu button — visible on hover */}
        <div
          ref={menuRef}
          className="absolute top-2 right-2"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={e => {
              e.stopPropagation();
              onMenuToggle(menuOpen ? null : app.id);
            }}
            className={`w-7 h-7 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center shadow transition-opacity ${
              menuOpen ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}
          >
            <MoreHorizontal size={14} className="text-gray-600" />
          </button>

          {/* Dropdown */}
          {menuOpen && (
            <div className="absolute right-0 top-8 z-50 bg-white rounded-xl shadow-xl border border-gray-100 w-44 py-1 text-sm">
              <button
                onClick={() => { onMenuToggle(null); onOpenCanvas(); }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Grid size={13} className="text-gray-400" />
                キャンバスを開く
              </button>
              <button
                onClick={() => { onMenuToggle(null); onOpenData(); }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Database size={13} className="text-gray-400" />
                データを見る
              </button>
              <button
                onClick={() => { onMenuToggle(null); onDuplicate(); }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Copy size={13} className="text-gray-400" />
                複製する
              </button>
              <button
                onClick={() => { onMenuToggle(null); onSettings(); }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <Settings size={13} className="text-gray-400" />
                設定
              </button>
              <div className="my-1 h-px bg-gray-100" />
              <button
                onClick={() => { onMenuToggle(null); onDelete(); }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-red-500 hover:bg-red-50 transition-colors"
              >
                <Trash2 size={13} />
                削除する
              </button>
            </div>
          )}
        </div>

        {/* Hover overlay — キャンバス / データベース buttons */}
        <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity pointer-events-none group-hover:pointer-events-auto">
          <button
            onClick={e => { e.stopPropagation(); onOpenCanvas(); }}
            className="bg-white rounded-xl px-3 py-2.5 text-sm font-medium shadow-lg flex flex-col items-center gap-1 hover:bg-gray-50 transition-colors"
          >
            <Grid size={18} className="text-gray-600" />
            <span className="text-xs text-gray-700">キャンバス</span>
          </button>
          <button
            onClick={e => { e.stopPropagation(); onOpenData(); }}
            className="bg-white rounded-xl px-3 py-2.5 text-sm font-medium shadow-lg flex flex-col items-center gap-1 hover:bg-gray-50 transition-colors"
          >
            <Database size={18} className="text-gray-600" />
            <span className="text-xs text-gray-700">データベース</span>
          </button>
        </div>
      </div>

      {/* Card body */}
      <div className="p-3">
        <div className="flex items-center gap-1.5 mb-0.5">
          {app.primaryDevice === 'mobile'
            ? <Smartphone size={11} className="text-gray-400 shrink-0" />
            : <Monitor size={11} className="text-gray-400 shrink-0" />
          }
          <span className="font-medium text-gray-900 text-sm truncate">{app.name}</span>
        </div>
        <span className="text-xs text-gray-400">{relativeTime(app.updatedAt)}</span>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Circular Progress Ring
// ────────────────────────────────────────────────────────────────

function CircularProgress({ value, max }: { value: number; max: number }) {
  const pct = Math.min(100, (value / max) * 100);
  const circumference = 2 * Math.PI * 15.9;
  const offset = circumference - (pct / 100) * circumference;

  return (
    <svg viewBox="0 0 36 36" className="w-10 h-10 -rotate-90">
      <circle
        cx="18" cy="18" r="15.9"
        fill="none"
        stroke="#e5e7eb"
        strokeWidth="3"
      />
      <circle
        cx="18" cy="18" r="15.9"
        fill="none"
        stroke="#1ec8a5"
        strokeWidth="3"
        strokeDasharray={`${circumference}`}
        strokeDashoffset={offset}
        strokeLinecap="round"
        style={{ transition: 'stroke-dashoffset 0.4s ease' }}
      />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────────────────────

type NavItem = 'home' | 'products' | 'tutorial' | 'settings';

export default function WorkspacePage() {
  const router = useRouter();
  const { currentUser, apps, workspace, createApp, updateApp, deleteApp, duplicateApp, logout } = useStore();

  const [activeNav, setActiveNav] = useState<NavItem>('home');
  const [menuAppId, setMenuAppId] = useState<string | null>(null);
  const [settingsApp, setSettingsApp] = useState<App | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Auth guard (ハイドレーション完了まで判定しない)
  const hydrated = useHydrated();
  useEffect(() => {
    if (!hydrated) return;
    if (!currentUser) router.replace('/login');
  }, [hydrated, currentUser, router]);

  // Close user menu on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!hydrated || !currentUser) return null;

  const wsName = workspace?.name ?? `${currentUser.name}のワークスペース`;
  const MAX_APPS = 10;

  const handleDelete = (app: App) => {
    if (confirm(`「${app.name}」を削除しますか？この操作は元に戻せません。`)) {
      deleteApp(app.id);
      if (settingsApp?.id === app.id) setSettingsApp(null);
    }
  };

  const handleSaveSettings = (app: App, updates: { name: string; description: string }) => {
    updateApp(app.id, { name: updates.name, description: updates.description || undefined });
    setSettingsApp(null);
  };

  // Sort apps by most recently updated
  const recentApps = [...apps].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">

      {/* ── HEADER ─────────────────────────────────────────────── */}
      <header className="h-14 bg-white border-b border-gray-200 flex items-center px-4 gap-3 shrink-0 z-30 shadow-sm">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0 mr-1">
          <div className="w-7 h-7 bg-brand rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-black text-xs tracking-tight">C</span>
          </div>
          <span className="font-bold text-gray-900 text-sm">Click</span>
        </div>

        {/* Workspace breadcrumb */}
        <div className="flex items-center gap-1 text-sm text-gray-500 min-w-0">
          <ChevronRight size={14} className="text-gray-300 shrink-0" />
          <span className="truncate max-w-[180px] text-gray-700 font-medium">{wsName}</span>
          <span className="ml-1.5 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-500">
            Release
          </span>
        </div>

        <div className="flex-1" />

        {/* New product button */}
        <button
          onClick={() => router.push('/workspace/new')}
          className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={15} />
          <span>新規プロダクト</span>
        </button>

        {/* User avatar */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setShowUserMenu(v => !v)}
            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-bold hover:bg-gray-300 transition-colors"
          >
            {currentUser.name.charAt(0).toUpperCase()}
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-10 z-50 bg-white rounded-xl shadow-xl border border-gray-100 w-48 py-1.5">
              <div className="px-3.5 py-2.5 border-b border-gray-100">
                <p className="text-xs font-semibold text-gray-900 truncate">{currentUser.name}</p>
                <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
              </div>
              <button
                onClick={() => { setShowUserMenu(false); logout(); router.replace('/login'); }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={14} />
                ログアウト
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── BODY ────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* ── LEFT SIDEBAR ─────────────────────────────────────── */}
        <aside className="w-56 shrink-0 bg-white border-r border-gray-200 flex flex-col py-3 z-20">

          {/* Workspace identity */}
          <div className="flex items-center gap-2.5 px-3 py-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 text-sm font-bold shrink-0">
              {currentUser.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-sm font-medium text-gray-800 truncate">{wsName}</span>
          </div>

          {/* Primary nav */}
          <nav className="px-2 space-y-0.5">
            {(
              [
                { key: 'home',     label: 'ホーム',        Icon: Home },
                { key: 'products', label: 'プロダクト一覧', Icon: Grid },
                { key: 'tutorial', label: 'チュートリアル', Icon: BookOpen },
                { key: 'settings', label: '設定',          Icon: Settings },
              ] as { key: NavItem; label: string; Icon: typeof Home }[]
            ).map(({ key, label, Icon }) => (
              <button
                key={key}
                onClick={() => setActiveNav(key)}
                className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                  activeNav === key
                    ? 'bg-brand text-white font-medium shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
                }`}
              >
                <Icon size={15} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          {/* Separator */}
          <div className="mx-3 my-3 h-px bg-gray-100" />

          {/* Secondary nav */}
          <nav className="px-2 space-y-0.5">
            <button className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors">
              <BookOpen size={15} />
              マニュアル
            </button>
            <button className="flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm text-gray-600 hover:bg-gray-100 hover:text-gray-800 transition-colors">
              <Users size={15} />
              コミュニティ
            </button>
          </nav>

          {/* Promo banner */}
          <div className="mx-2 mt-3 rounded-xl overflow-hidden bg-gradient-to-br from-brand to-teal-600 p-3 text-white">
            <p className="text-xs font-bold mb-0.5">紹介キャンペーン</p>
            <p className="text-xs text-white/80 leading-snug">友達を紹介して特典をゲット！</p>
            <button className="mt-2 text-xs font-semibold bg-white/20 hover:bg-white/30 transition-colors px-2.5 py-1 rounded-md">
              詳しく見る
            </button>
          </div>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Plan info */}
          <div className="mx-2 mt-3 p-3 border border-gray-100 rounded-xl bg-gray-50">
            <p className="text-xs font-bold text-gray-800 mb-2">Standard</p>
            <div className="flex items-center gap-2.5 mb-1">
              <CircularProgress value={apps.length} max={MAX_APPS} />
              <div>
                <p className="text-xs text-gray-500 leading-tight">アプリ数</p>
                <p className="text-sm font-semibold text-gray-800">{apps.length}/{MAX_APPS}</p>
              </div>
            </div>
            <button className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 rounded-lg transition-colors">
              アップグレード
            </button>
          </div>
        </aside>

        {/* ── MAIN CONTENT ─────────────────────────────────────── */}
        <main className="flex-1 min-w-0 overflow-y-auto">
          <div className="max-w-5xl mx-auto px-8 py-8">

            {/* Section header row */}
            <div className="flex items-center gap-3 mb-5">
              <h1 className="text-base font-semibold text-gray-900">最近のプロダクト</h1>

              {/* "How to create" video link */}
              <button className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-brand transition-colors ml-1">
                <span className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center">
                  <Play size={9} className="text-gray-500 ml-0.5" />
                </span>
                新規プロダクト作成方法
              </button>

              <div className="flex-1" />

              <button className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-0.5 transition-colors">
                すべて見る
                <ChevronRight size={13} />
              </button>
            </div>

            {/* App Grid */}
            {apps.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                  <Plus size={28} className="text-gray-400" />
                </div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">最初のアプリを作りましょう</h2>
                <p className="text-sm text-gray-500 mb-6 max-w-xs">
                  新規プロダクトを作成するをクリックして開始
                </p>
                <button
                  onClick={() => router.push('/workspace/new')}
                  className="flex items-center gap-2 bg-brand hover:bg-brand-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold transition-colors shadow-md shadow-brand/30"
                >
                  <Plus size={16} />
                  新規プロダクトを作成する
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* New product card — always first */}
                <div
                  onClick={() => router.push('/workspace/new')}
                  className="bg-white border-2 border-dashed border-gray-200 rounded-xl cursor-pointer hover:border-brand hover:bg-brand-50 flex flex-col items-center justify-center transition-colors"
                  style={{ minHeight: 204 }}
                >
                  <Plus size={30} className="text-gray-300 mb-2" />
                  <span className="text-xs text-gray-400 text-center px-3">新規プロダクトを作成する</span>
                </div>

                {/* App cards */}
                {recentApps.map(app => (
                  <AppCard
                    key={app.id}
                    app={app}
                    menuAppId={menuAppId}
                    onMenuToggle={setMenuAppId}
                    onOpenCanvas={() => router.push(`/builder/${app.id}`)}
                    onOpenData={() => router.push(`/builder/${app.id}/data`)}
                    onDuplicate={() => duplicateApp(app.id)}
                    onSettings={() => setSettingsApp(app)}
                    onDelete={() => handleDelete(app)}
                  />
                ))}
              </div>
            )}
          </div>
        </main>
      </div>

      {/* ── App Settings Modal ──────────────────────────────────── */}
      {settingsApp && (
        <AppSettingsModal
          app={settingsApp}
          onClose={() => setSettingsApp(null)}
          onSave={updates => handleSaveSettings(settingsApp, updates)}
          onDelete={() => handleDelete(settingsApp)}
        />
      )}
    </div>
  );
}
