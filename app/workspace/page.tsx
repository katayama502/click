'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import type { App } from '@/lib/types';
import {
  LayoutGrid,
  List,
  LayoutTemplate,
  Trash2,
  Bell,
  ChevronDown,
  MoreHorizontal,
  Plus,
  Smartphone,
  Monitor,
  Tablet,
  Search,
  Settings,
  Database,
  Copy,
  Pencil,
  LogOut,
  User,
  ArrowUpRight,
  Sparkles,
  X,
  Check,
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
  if (days < 30) return `${days}日前`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}ヶ月前`;
  return new Date(dateStr).toLocaleDateString('ja-JP', { year: 'numeric', month: 'short', day: 'numeric' });
}

const GRADIENT_PAIRS = [
  ['#ccfbef', '#99f6e0'],   // brand teal
  ['#ede9fe', '#ddd6fe'],   // purple
  ['#dbeafe', '#bfdbfe'],   // blue
  ['#ffedd5', '#fed7aa'],   // orange
  ['#fce7f3', '#fbcfe8'],   // pink
  ['#fef9c3', '#fef08a'],   // yellow
  ['#dcfce7', '#bbf7d0'],   // green
  ['#e0f2fe', '#bae6fd'],   // sky
];

function getAppGradient(name: string): { from: string; to: string } {
  const idx = (name.charCodeAt(0) + name.charCodeAt(name.length - 1)) % GRADIENT_PAIRS.length;
  const [from, to] = GRADIENT_PAIRS[idx];
  return { from, to };
}

function getAppEmoji(name: string): string {
  const emojis = ['📱', '🚀', '✨', '🎯', '💡', '🌟', '🔥', '⚡'];
  return emojis[name.charCodeAt(0) % emojis.length];
}

type SortKey = 'updatedAt' | 'createdAt' | 'name';
type ViewMode = 'grid' | 'list';
type SidebarTab = 'apps' | 'templates' | 'trash';

// ────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────

interface AppCardMenuProps {
  app: App;
  onEdit: () => void;
  onDuplicate: () => void;
  onSettings: () => void;
  onDelete: () => void;
}

function AppCardMenu({ app, onEdit, onDuplicate, onSettings, onDelete }: AppCardMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={e => { e.stopPropagation(); setOpen(v => !v); }}
        className="w-7 h-7 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
      >
        <MoreHorizontal size={15} />
      </button>
      {open && (
        <div
          className="absolute right-0 top-8 z-50 bg-white rounded-xl shadow-xl border border-gray-100 w-48 py-1 text-sm"
          onClick={e => e.stopPropagation()}
        >
          <button
            onClick={() => { setOpen(false); onEdit(); }}
            className="flex items-center gap-2.5 w-full px-3.5 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Pencil size={14} className="text-gray-400" />
            キャンバスを開く
          </button>
          <button
            onClick={() => { setOpen(false); router.push(`/builder/${app.id}/data`); }}
            className="flex items-center gap-2.5 w-full px-3.5 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Database size={14} className="text-gray-400" />
            データを見る
          </button>
          <button
            onClick={() => { setOpen(false); onDuplicate(); }}
            className="flex items-center gap-2.5 w-full px-3.5 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Copy size={14} className="text-gray-400" />
            複製する
          </button>
          <button
            onClick={() => { setOpen(false); onSettings(); }}
            className="flex items-center gap-2.5 w-full px-3.5 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Settings size={14} className="text-gray-400" />
            設定
          </button>
          <div className="my-1 h-px bg-gray-100" />
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            className="flex items-center gap-2.5 w-full px-3.5 py-2 text-red-500 hover:bg-red-50 transition-colors"
          >
            <Trash2 size={14} />
            削除する
          </button>
        </div>
      )}
    </div>
  );
}

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

  const deviceLabel: Record<string, string> = { mobile: 'モバイル', tablet: 'タブレット', desktop: 'デスクトップ' };

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

          {/* Read-only info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">バージョン</label>
              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-200">
                {app.version.toUpperCase()}
              </span>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">デバイス</label>
              <div className="flex flex-wrap gap-1">
                {app.devices.map(d => (
                  <span key={d} className="inline-flex items-center px-2 py-0.5 rounded-md text-xs bg-gray-100 text-gray-600">
                    {deviceLabel[d] ?? d}
                  </span>
                ))}
              </div>
            </div>
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

interface AppGridCardProps {
  app: App;
  onEdit: () => void;
  onDuplicate: () => void;
  onSettings: () => void;
  onDelete: () => void;
}

function AppGridCard({ app, onEdit, onDuplicate, onSettings, onDelete }: AppGridCardProps) {
  const gradient = getAppGradient(app.name);
  const emoji = getAppEmoji(app.name);

  const DeviceIcon = app.primaryDevice === 'desktop' ? Monitor
    : app.primaryDevice === 'tablet' ? Tablet
    : Smartphone;

  return (
    <div
      className="bg-white rounded-xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-200 cursor-pointer group relative"
      onClick={onEdit}
    >
      {/* Thumbnail */}
      <div
        className="h-40 relative flex items-center justify-center"
        style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
      >
        <span className="text-5xl select-none">{emoji}</span>

        {/* Badges top-right */}
        <div className="absolute top-2.5 right-2.5 flex gap-1.5">
          {app.version === 'v4' && (
            <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-white/90 text-brand-700 shadow-sm">
              v4
            </span>
          )}
          {app.published && (
            <span className="px-1.5 py-0.5 rounded text-xs font-bold bg-brand text-white shadow-sm">
              公開中
            </span>
          )}
        </div>

        {/* Device icon bottom-left */}
        <div className="absolute bottom-2.5 left-2.5 w-6 h-6 flex items-center justify-center rounded-md bg-white/80 backdrop-blur-sm shadow-sm">
          <DeviceIcon size={13} className="text-gray-500" />
        </div>

        {/* Hover edit overlay */}
        <div className="absolute inset-0 bg-brand/10 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="bg-white rounded-lg px-3 py-1.5 text-xs font-medium text-gray-700 shadow-md opacity-0 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0">
            開く →
          </div>
        </div>
      </div>

      {/* Card body */}
      <div className="px-3.5 py-3">
        <div className="flex items-start justify-between gap-1">
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-gray-900 text-sm truncate leading-tight">{app.name}</p>
            {app.description && (
              <p className="text-xs text-gray-400 truncate mt-0.5">{app.description}</p>
            )}
            <p className="text-xs text-gray-400 mt-1">{relativeTime(app.updatedAt)}更新</p>
          </div>

          {/* 3-dot menu — always visible, just subtle */}
          <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <AppCardMenu
              app={app}
              onEdit={onEdit}
              onDuplicate={onDuplicate}
              onSettings={onSettings}
              onDelete={onDelete}
            />
          </div>
        </div>

        {/* Quick action row on hover */}
        <div className="mt-2 pt-2 border-t border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={e => { e.stopPropagation(); onEdit(); }}
            className="text-xs text-brand font-medium hover:text-brand-600 transition-colors"
          >
            編集する
          </button>
        </div>
      </div>
    </div>
  );
}

interface AppListRowProps {
  app: App;
  onEdit: () => void;
  onDuplicate: () => void;
  onSettings: () => void;
  onDelete: () => void;
}

function AppListRow({ app, onEdit, onDuplicate, onSettings, onDelete }: AppListRowProps) {
  const gradient = getAppGradient(app.name);
  const emoji = getAppEmoji(app.name);
  const DeviceIcon = app.primaryDevice === 'desktop' ? Monitor
    : app.primaryDevice === 'tablet' ? Tablet
    : Smartphone;
  const deviceLabel: Record<string, string> = { mobile: 'モバイル', tablet: 'タブレット', desktop: 'デスクトップ' };

  return (
    <div
      className="flex items-center gap-4 px-4 py-3 bg-white rounded-xl border border-gray-200 hover:shadow-md hover:border-gray-300 transition-all duration-150 cursor-pointer group"
      onClick={onEdit}
    >
      {/* Thumbnail mini */}
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 text-lg"
        style={{ background: `linear-gradient(135deg, ${gradient.from}, ${gradient.to})` }}
      >
        {emoji}
      </div>

      {/* Name & description */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900 text-sm truncate">{app.name}</p>
        {app.description && (
          <p className="text-xs text-gray-400 truncate">{app.description}</p>
        )}
      </div>

      {/* Device */}
      <div className="hidden sm:flex items-center gap-1 text-xs text-gray-500 w-24 shrink-0">
        <DeviceIcon size={12} className="text-gray-400" />
        {deviceLabel[app.primaryDevice]}
      </div>

      {/* Version */}
      <div className="hidden md:block w-12 shrink-0">
        <span className="px-1.5 py-0.5 rounded text-xs font-semibold bg-brand-50 text-brand-700 border border-brand-100">
          {app.version.toUpperCase()}
        </span>
      </div>

      {/* Published */}
      <div className="hidden md:block w-16 shrink-0">
        {app.published ? (
          <span className="flex items-center gap-1 text-xs text-brand font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-brand inline-block" />
            公開中
          </span>
        ) : (
          <span className="text-xs text-gray-400">非公開</span>
        )}
      </div>

      {/* Updated */}
      <div className="hidden lg:block text-xs text-gray-400 w-24 shrink-0 text-right">
        {relativeTime(app.updatedAt)}
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0" onClick={e => e.stopPropagation()}>
        <button
          onClick={e => { e.stopPropagation(); onEdit(); }}
          className="text-xs px-2.5 py-1.5 text-brand font-medium hover:bg-brand-50 rounded-lg transition-colors"
        >
          編集
        </button>
        <AppCardMenu
          app={app}
          onEdit={onEdit}
          onDuplicate={onDuplicate}
          onSettings={onSettings}
          onDelete={onDelete}
        />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────────
// Main Page
// ────────────────────────────────────────────────────────────────

export default function WorkspacePage() {
  const router = useRouter();
  const { currentUser, workspace, apps, deleteApp, duplicateApp, updateApp, logout } = useStore();

  const [sidebarTab, setSidebarTab] = useState<SidebarTab>('apps');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [settingsApp, setSettingsApp] = useState<App | null>(null);

  const sortMenuRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Auth guard
  useEffect(() => {
    if (!currentUser) router.replace('/login');
  }, [currentUser, router]);

  // Close menus on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (sortMenuRef.current && !sortMenuRef.current.contains(e.target as Node)) setShowSortMenu(false);
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!currentUser) return null;

  const wsName = workspace?.name ?? `${currentUser.name}のワークスペース`;

  // Filter & sort
  const filtered = apps
    .filter(a => a.name.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortKey === 'name') return a.name.localeCompare(b.name, 'ja');
      if (sortKey === 'createdAt') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

  const sortLabels: Record<SortKey, string> = {
    updatedAt: '更新日',
    createdAt: '作成日',
    name: '名前',
  };

  const handleEdit = (app: App) => router.push(`/builder/${app.id}`);
  const handleDuplicate = (app: App) => { duplicateApp(app.id); };
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

  return (
    <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">

      {/* ── Header ────────────────────────────────────────────── */}
      <header className="h-14 bg-white border-b border-gray-200 px-5 flex items-center gap-4 shrink-0 z-30">
        {/* Logo */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-7 h-7 bg-brand rounded-lg flex items-center justify-center shadow-sm">
            <span className="text-white font-black text-xs tracking-tight">C</span>
          </div>
          <span className="font-bold text-gray-900 text-sm">Click</span>
        </div>

        {/* Workspace name */}
        <div className="hidden sm:flex items-center gap-1.5 text-sm text-gray-500 min-w-0">
          <span className="text-gray-300">/</span>
          <span className="truncate max-w-[200px] font-medium text-gray-700">{wsName}</span>
        </div>

        <div className="flex-1" />

        {/* Search */}
        {apps.length > 0 && (
          <div className="hidden md:flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg px-3 py-1.5 w-56 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 transition-all">
            <Search size={13} className="text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="アプリを検索..."
              className="bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none w-full"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery('')} className="text-gray-400 hover:text-gray-600">
                <X size={13} />
              </button>
            )}
          </div>
        )}

        {/* Notification */}
        <button className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors relative">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-red-400" />
        </button>

        {/* User avatar & dropdown */}
        <div ref={userMenuRef} className="relative">
          <button
            onClick={() => setShowUserMenu(v => !v)}
            className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-100 transition-colors"
          >
            <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center text-white text-xs font-bold shrink-0">
              {currentUser.name.charAt(0)}
            </div>
            <span className="hidden sm:block text-sm font-medium text-gray-700 max-w-[100px] truncate">
              {currentUser.name}
            </span>
            <ChevronDown size={13} className="text-gray-400 hidden sm:block" />
          </button>

          {showUserMenu && (
            <div className="absolute right-0 top-11 z-50 bg-white rounded-xl shadow-xl border border-gray-100 w-48 py-1.5">
              <div className="px-3.5 py-2 border-b border-gray-100 mb-1">
                <p className="text-xs font-semibold text-gray-900 truncate">{currentUser.name}</p>
                <p className="text-xs text-gray-400 truncate">{currentUser.email}</p>
              </div>
              <button className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <User size={14} className="text-gray-400" />
                プロフィール
              </button>
              <button className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors">
                <Settings size={14} className="text-gray-400" />
                設定
              </button>
              <div className="my-1 h-px bg-gray-100" />
              <button
                onClick={() => { logout(); router.replace('/login'); }}
                className="flex items-center gap-2.5 w-full px-3.5 py-2 text-sm text-red-500 hover:bg-red-50 transition-colors"
              >
                <LogOut size={14} />
                ログアウト
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Body (sidebar + main) ──────────────────────────────── */}
      <div className="flex flex-1 min-h-0">

        {/* ── Sidebar ─────────────────────────────────────────── */}
        <aside className="w-56 shrink-0 bg-gray-50 border-r border-gray-200 flex flex-col py-3 z-20">
          <nav className="flex-1 px-2 space-y-0.5">
            {(
              [
                { key: 'apps', label: 'マイアプリ', icon: LayoutGrid, count: apps.length },
                { key: 'templates', label: 'テンプレート', icon: LayoutTemplate, count: null },
                { key: 'trash', label: 'ゴミ箱', icon: Trash2, count: null },
              ] as const
            ).map(({ key, label, icon: Icon, count }) => (
              <button
                key={key}
                onClick={() => setSidebarTab(key)}
                className={`flex items-center gap-2.5 w-full px-3 py-2 rounded-lg text-sm transition-colors ${
                  sidebarTab === key
                    ? 'bg-brand text-white font-medium shadow-sm'
                    : 'text-gray-600 hover:bg-gray-200/70 hover:text-gray-800'
                }`}
              >
                <Icon size={15} />
                <span className="flex-1 text-left">{label}</span>
                {count !== null && count > 0 && (
                  <span
                    className={`text-xs rounded-full px-1.5 py-0.5 font-medium min-w-[20px] text-center ${
                      sidebarTab === key ? 'bg-white/20 text-white' : 'bg-gray-200 text-gray-500'
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            ))}
          </nav>

          {/* Plan badge */}
          <div className="mx-2 mt-2 p-3 bg-white rounded-xl border border-gray-200 shadow-sm">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Sparkles size={13} className="text-amber-400" />
              <span className="text-xs font-semibold text-gray-700">Free プラン</span>
            </div>
            <p className="text-xs text-gray-400 mb-2.5">
              アプリ: <span className="font-medium text-gray-600">{apps.length}</span> / 無制限
            </p>
            <button className="flex items-center justify-between w-full text-xs font-medium text-brand hover:text-brand-600 transition-colors group">
              アップグレード
              <ArrowUpRight size={12} className="group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </button>
          </div>
        </aside>

        {/* ── Main content ────────────────────────────────────── */}
        <main className="flex-1 min-w-0 flex flex-col">

          {sidebarTab === 'apps' && (
            <>
              {/* Sub-header */}
              <div className="px-6 py-4 bg-white border-b border-gray-100 flex items-center gap-3 shrink-0">
                <h1 className="font-semibold text-gray-900 text-base">マイアプリ</h1>
                {apps.length > 0 && (
                  <span className="text-xs font-medium px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded-full">
                    {apps.length}
                  </span>
                )}

                <div className="flex-1" />

                {/* Sort */}
                {apps.length > 0 && (
                  <div ref={sortMenuRef} className="relative">
                    <button
                      onClick={() => setShowSortMenu(v => !v)}
                      className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 px-2.5 py-1.5 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                    >
                      {sortLabels[sortKey]}
                      <ChevronDown size={13} />
                    </button>
                    {showSortMenu && (
                      <div className="absolute right-0 top-10 z-40 bg-white rounded-xl shadow-xl border border-gray-100 w-36 py-1">
                        {(Object.entries(sortLabels) as [SortKey, string][]).map(([key, label]) => (
                          <button
                            key={key}
                            onClick={() => { setSortKey(key); setShowSortMenu(false); }}
                            className="flex items-center justify-between w-full px-3.5 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            {label}
                            {sortKey === key && <Check size={13} className="text-brand" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* View toggle */}
                {apps.length > 0 && (
                  <div className="flex items-center bg-gray-100 rounded-lg p-0.5">
                    <button
                      onClick={() => setViewMode('grid')}
                      className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
                        viewMode === 'grid' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <LayoutGrid size={14} />
                    </button>
                    <button
                      onClick={() => setViewMode('list')}
                      className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors ${
                        viewMode === 'list' ? 'bg-white text-gray-700 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <List size={14} />
                    </button>
                  </div>
                )}

                {/* New app button */}
                <button
                  onClick={() => router.push('/workspace/new')}
                  className="flex items-center gap-1.5 bg-brand hover:bg-brand-600 text-white px-3.5 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm"
                >
                  <Plus size={15} />
                  新しいアプリ
                </button>
              </div>

              {/* Content area */}
              <div className="flex-1 overflow-y-auto">
                {/* Mobile search */}
                {apps.length > 0 && (
                  <div className="md:hidden px-6 pt-4">
                    <div className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/20 transition-all">
                      <Search size={14} className="text-gray-400 shrink-0" />
                      <input
                        type="text"
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        placeholder="アプリを検索..."
                        className="bg-transparent text-sm text-gray-700 placeholder-gray-400 focus:outline-none w-full"
                      />
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {apps.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full min-h-[60vh] px-6 text-center">
                    <div className="w-20 h-20 bg-brand-50 rounded-2xl flex items-center justify-center mb-5 shadow-sm">
                      <span className="text-4xl">🎉</span>
                    </div>
                    <h2 className="text-xl font-bold text-gray-900 mb-2">最初のアプリを作成しましょう</h2>
                    <p className="text-sm text-gray-500 mb-7 max-w-xs leading-relaxed">
                      ドラッグ＆ドロップでノーコードアプリを<br />素早く作成できます
                    </p>
                    <button
                      onClick={() => router.push('/workspace/new')}
                      className="flex items-center gap-2 bg-brand hover:bg-brand-600 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-colors shadow-md shadow-brand/30"
                    >
                      <Plus size={16} />
                      新しいアプリを作る
                    </button>

                    {/* Template hints */}
                    <div className="mt-10 grid grid-cols-3 gap-3 max-w-sm">
                      {[
                        { emoji: '🛒', label: 'ECサイト' },
                        { emoji: '📋', label: 'タスク管理' },
                        { emoji: '📊', label: 'ダッシュボード' },
                      ].map(t => (
                        <div
                          key={t.label}
                          className="bg-white border border-gray-200 rounded-xl p-3 text-center cursor-pointer hover:shadow-md hover:border-brand/40 transition-all group"
                          onClick={() => router.push('/workspace/new')}
                        >
                          <span className="text-2xl block mb-1">{t.emoji}</span>
                          <p className="text-xs text-gray-500 font-medium group-hover:text-brand transition-colors">{t.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* No search results */}
                {apps.length > 0 && filtered.length === 0 && searchQuery && (
                  <div className="flex flex-col items-center justify-center min-h-[40vh] text-center px-6">
                    <Search size={32} className="text-gray-300 mb-3" />
                    <p className="text-sm font-medium text-gray-500">該当するアプリが見つかりません</p>
                    <p className="text-xs text-gray-400 mt-1">「{searchQuery}」に一致するアプリはありません</p>
                    <button
                      onClick={() => setSearchQuery('')}
                      className="mt-4 text-xs text-brand hover:text-brand-600 font-medium"
                    >
                      検索をクリア
                    </button>
                  </div>
                )}

                {/* Grid view */}
                {filtered.length > 0 && viewMode === 'grid' && (
                  <div className="p-6 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                    {filtered.map(app => (
                      <AppGridCard
                        key={app.id}
                        app={app}
                        onEdit={() => handleEdit(app)}
                        onDuplicate={() => handleDuplicate(app)}
                        onSettings={() => setSettingsApp(app)}
                        onDelete={() => handleDelete(app)}
                      />
                    ))}
                  </div>
                )}

                {/* List view */}
                {filtered.length > 0 && viewMode === 'list' && (
                  <div className="p-6 space-y-2">
                    {/* List header */}
                    <div className="hidden lg:grid grid-cols-[1fr_120px_80px_80px_100px_80px] gap-4 px-4 pb-1">
                      {['アプリ名', 'デバイス', 'バージョン', 'ステータス', '更新日', ''].map((h, i) => (
                        <p key={i} className="text-xs font-medium text-gray-400 uppercase tracking-wide">{h}</p>
                      ))}
                    </div>
                    {filtered.map(app => (
                      <AppListRow
                        key={app.id}
                        app={app}
                        onEdit={() => handleEdit(app)}
                        onDuplicate={() => handleDuplicate(app)}
                        onSettings={() => setSettingsApp(app)}
                        onDelete={() => handleDelete(app)}
                      />
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          {/* Templates tab */}
          {sidebarTab === 'templates' && (
            <div className="flex flex-col items-center justify-center flex-1 text-center px-6">
              <div className="w-16 h-16 bg-purple-50 rounded-2xl flex items-center justify-center mb-4">
                <LayoutTemplate size={28} className="text-purple-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">テンプレート</h2>
              <p className="text-sm text-gray-400 max-w-xs">すぐに使えるテンプレートが近日公開予定です</p>
            </div>
          )}

          {/* Trash tab */}
          {sidebarTab === 'trash' && (
            <div className="flex flex-col items-center justify-center flex-1 text-center px-6">
              <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mb-4">
                <Trash2 size={28} className="text-gray-400" />
              </div>
              <h2 className="text-lg font-bold text-gray-900 mb-2">ゴミ箱</h2>
              <p className="text-sm text-gray-400 max-w-xs">削除されたアプリは30日間保存されます</p>
            </div>
          )}
        </main>
      </div>

      {/* ── App Settings Modal ─────────────────────────────────── */}
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
