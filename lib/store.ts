'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from './utils';
import { firebaseEnabled } from './firebase';
import {
  fbSignIn,
  fbSignUp,
  fbSignOut,
  fbOnAuthChange,
} from './firebase/auth';
import {
  fsCreateApp,
  fsUpdateApp,
  fsDeleteApp,
  fsSubscribeApps,
  fsGetPages,
  fsCreatePage,
  fsUpdatePage,
  fsDeletePage,
  fsUpdateElements,
  fsGetTables,
  fsCreateTable,
  fsUpdateTable,
  fsDeleteTable,
} from './firebase/firestore';
import type {
  User, Workspace, App, AppVersion, DeviceType,
  DBTable, DBField, DBRecord, FieldType,
  Page, Element, PageType, CanvasSnapshot,
  RightPanelTab, LeftPanelTab, DevicePreview,
} from './types';

interface AppBuilderState {
  // ── Auth ──────────────────────────────────────────────────
  currentUser: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (email: string, name: string, password: string) => Promise<User>;
  logout: () => Promise<void>;

  // ── Workspace ──────────────────────────────────────────────
  workspace: Workspace | null;
  apps: App[];
  createApp: (params: {
    name: string;
    version: AppVersion;
    primaryDevice: DeviceType;
    devices: DeviceType[];
    description?: string;
  }) => App;
  updateApp: (id: string, updates: Partial<App>) => void;
  deleteApp: (id: string) => void;
  duplicateApp: (id: string) => App;

  // ── Current App ───────────────────────────────────────────
  currentAppId: string | null;
  setCurrentApp: (id: string | null) => Promise<void>;
  getCurrentApp: () => App | null;

  // ── Database ──────────────────────────────────────────────
  tables: Record<string, DBTable[]>; // keyed by appId
  getTablesForApp: (appId: string) => DBTable[];
  createTable: (appId: string, name: string) => DBTable;
  deleteTable: (appId: string, tableId: string) => void;
  addField: (appId: string, tableId: string, name: string, type: FieldType) => DBField;
  updateField: (appId: string, tableId: string, fieldId: string, updates: Partial<DBField>) => void;
  deleteField: (appId: string, tableId: string, fieldId: string) => void;
  addRecord: (appId: string, tableId: string, values?: Record<string, unknown>) => DBRecord;
  updateRecord: (appId: string, tableId: string, recordId: string, values: Record<string, unknown>) => void;
  deleteRecord: (appId: string, tableId: string, recordId: string) => void;
  deleteRecords: (appId: string, tableId: string, recordIds: string[]) => void;

  // ── Canvas ────────────────────────────────────────────────
  pages: Record<string, Page[]>; // keyed by appId
  getPagesForApp: (appId: string) => Page[];
  createPage: (appId: string, name: string, type?: PageType) => Page;
  updatePage: (appId: string, pageId: string, updates: Partial<Page>) => void;
  deletePage: (appId: string, pageId: string) => void;
  reorderPages: (appId: string, pageIds: string[]) => void;
  addElement: (appId: string, pageId: string, element: Element) => void;
  updateElement: (appId: string, pageId: string, elementId: string, updates: Partial<Element>) => void;
  deleteElement: (appId: string, pageId: string, elementId: string) => void;
  reorderElements: (appId: string, pageId: string, elementIds: string[]) => void;

  // ── Editor UI State ───────────────────────────────────────
  selectedPageId: string | null;
  selectedElementId: string | null;
  rightPanelTab: RightPanelTab;
  leftPanelTab: LeftPanelTab;
  devicePreview: DevicePreview;
  zoom: number;
  setSelectedPage: (id: string | null) => void;
  setSelectedElement: (id: string | null) => void;
  setRightPanelTab: (tab: RightPanelTab) => void;
  setLeftPanelTab: (tab: LeftPanelTab) => void;
  setDevicePreview: (device: DevicePreview) => void;
  setZoom: (zoom: number) => void;

  // ── History (Undo/Redo) ───────────────────────────────────
  history: Record<string, CanvasSnapshot[]>; // keyed by appId
  historyIndex: Record<string, number>;
  pushHistory: (appId: string) => void;
  undo: (appId: string) => void;
  redo: (appId: string) => void;
  canUndo: (appId: string) => boolean;
  canRedo: (appId: string) => boolean;

  // ── Firebase ──────────────────────────────────────────────
  initFirebase: () => () => void;
}

const MAX_HISTORY = 50;

// ── Keyed debounce (per appId+pageId) ────────────────────────────────────────
const _debounceTimers: Map<string, ReturnType<typeof setTimeout>> = new Map();
function debounced(key: string, fn: () => void, ms = 300): void {
  const existing = _debounceTimers.get(key);
  if (existing) clearTimeout(existing);
  _debounceTimers.set(
    key,
    setTimeout(() => {
      _debounceTimers.delete(key);
      fn();
    }, ms),
  );
}

function createUsersTable(appId: string): DBTable {
  const tableId = generateId();
  return {
    id: tableId,
    appId,
    name: 'Users',
    isSystem: true,
    fields: [
      { id: generateId(), tableId, name: 'Name', type: 'text', isSystem: true, required: true },
      { id: generateId(), tableId, name: 'Email', type: 'text', isSystem: false, required: true },
      { id: generateId(), tableId, name: 'Password', type: 'password', isSystem: false, required: true },
    ],
    records: [],
  };
}

export const useStore = create<AppBuilderState>()(
  persist(
    (set, get) => ({
      // ── Auth ────────────────────────────────────────────
      currentUser: null,

      login: async (email, password) => {
        if (firebaseEnabled) {
          try {
            const user = await fbSignIn(email, password);
            if (!user) return false;
            set({
              currentUser: {
                id: user.uid,
                email: user.email,
                name: user.displayName ?? email,
                createdAt: new Date().toISOString(),
              },
            });
            return true;
          } catch {
            return false;
          }
        }
        // ── Local fallback ──────────────────────────────────
        const stored = localStorage.getItem('click_clone_users');
        const users: Array<User & { password: string }> = stored ? JSON.parse(stored) : [];
        const found = users.find(
          (u) => u.email === email && (u as User & { password: string }).password === password,
        );
        if (found) {
          const { password: _pw, ...user } = found;
          set({ currentUser: user });
          return true;
        }
        return false;
      },

      register: async (email, name, password) => {
        if (firebaseEnabled) {
          const user = await fbSignUp(email, password, name);
          if (!user) throw new Error('Sign-up failed');
          const newUser: User = {
            id: user.uid,
            email: user.email,
            name,
            createdAt: new Date().toISOString(),
          };
          const ws: Workspace = {
            id: generateId(),
            name: `${name}のワークスペース`,
            ownerId: newUser.id,
            createdAt: new Date().toISOString(),
          };
          set({ currentUser: newUser, workspace: ws });
          return newUser;
        }
        // ── Local fallback ──────────────────────────────────
        const stored = localStorage.getItem('click_clone_users');
        const users: Array<User & { password: string }> = stored ? JSON.parse(stored) : [];
        const newUser: User & { password: string } = {
          id: generateId(),
          email,
          name,
          password,
          createdAt: new Date().toISOString(),
        };
        users.push(newUser);
        localStorage.setItem('click_clone_users', JSON.stringify(users));
        const { password: _pw, ...user } = newUser;
        const ws: Workspace = {
          id: generateId(),
          name: `${name}のワークスペース`,
          ownerId: user.id,
          createdAt: new Date().toISOString(),
        };
        set({ currentUser: user, workspace: ws });
        return user;
      },

      logout: async () => {
        if (firebaseEnabled) {
          try {
            await fbSignOut();
          } catch {
            /* ignore */
          }
        }
        set({ currentUser: null, apps: [], pages: {}, tables: {}, currentAppId: null });
      },

      // ── Workspace ────────────────────────────────────────
      workspace: null,
      apps: [],

      createApp: (params) => {
        const { workspace, currentUser } = get();
        const now = new Date().toISOString();
        const app: App = {
          id: generateId(),
          workspaceId: workspace?.id ?? 'default',
          name: params.name,
          description: params.description,
          version: params.version,
          primaryDevice: params.primaryDevice,
          devices: params.devices,
          createdAt: now,
          updatedAt: now,
          published: false,
        };
        const usersTable = createUsersTable(app.id);
        const firstPage: Page = {
          id: generateId(),
          appId: app.id,
          name: 'ホーム',
          type: 'page',
          elements: [],
          isStartPageLoggedOut: true,
          isStartPageLoggedIn: true,
          backgroundColor: '#ffffff',
          order: 0,
        };
        set((state) => ({
          apps: [...state.apps, app],
          tables: { ...state.tables, [app.id]: [usersTable] },
          pages: { ...state.pages, [app.id]: [firstPage] },
        }));
        if (firebaseEnabled && currentUser) {
          const uid = currentUser.id;
          fsCreateApp(uid, app).catch(console.error);
          fsCreateTable(uid, app.id, usersTable).catch(console.error);
          fsCreatePage(uid, app.id, firstPage).catch(console.error);
        }
        return app;
      },

      updateApp: (id, updates) => {
        const { currentUser } = get();
        set((state) => ({
          apps: state.apps.map((a) =>
            a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a,
          ),
        }));
        if (firebaseEnabled && currentUser) {
          fsUpdateApp(currentUser.id, id, {
            ...updates,
            updatedAt: new Date().toISOString(),
          }).catch(console.error);
        }
      },

      deleteApp: (id) => {
        const { currentUser } = get();
        set((state) => {
          const { [id]: _t, ...tables } = state.tables;
          const { [id]: _p, ...pages } = state.pages;
          return {
            apps: state.apps.filter((a) => a.id !== id),
            tables,
            pages,
            currentAppId: state.currentAppId === id ? null : state.currentAppId,
          };
        });
        if (firebaseEnabled && currentUser) {
          fsDeleteApp(currentUser.id, id).catch(console.error);
        }
      },

      duplicateApp: (id) => {
        const state = get();
        const src = state.apps.find((a) => a.id === id);
        if (!src) throw new Error('App not found');
        const now = new Date().toISOString();
        const newApp: App = {
          ...src,
          id: generateId(),
          name: `${src.name} のコピー`,
          createdAt: now,
          updatedAt: now,
          published: false,
          publishedUrl: undefined,
        };
        const srcTables = state.tables[id] ?? [];
        const srcPages = state.pages[id] ?? [];
        const newTables = srcTables.map((t) => ({ ...t, id: generateId(), appId: newApp.id }));
        const newPages = srcPages.map((p) => ({ ...p, id: generateId(), appId: newApp.id }));
        set((s) => ({
          apps: [...s.apps, newApp],
          tables: { ...s.tables, [newApp.id]: newTables },
          pages: { ...s.pages, [newApp.id]: newPages },
        }));
        if (firebaseEnabled && state.currentUser) {
          const uid = state.currentUser.id;
          fsCreateApp(uid, newApp).catch(console.error);
          newTables.forEach((t) => fsCreateTable(uid, newApp.id, t).catch(console.error));
          newPages.forEach((p) => fsCreatePage(uid, newApp.id, p).catch(console.error));
        }
        return newApp;
      },

      // ── Current App ──────────────────────────────────────
      currentAppId: null,

      setCurrentApp: async (id) => {
        set({ currentAppId: id, selectedPageId: null, selectedElementId: null });
        if (!id || !firebaseEnabled) return;
        const { currentUser } = get();
        if (!currentUser) return;
        try {
          const [pages, tables] = await Promise.all([
            fsGetPages(currentUser.id, id),
            fsGetTables(currentUser.id, id),
          ]);
          if (pages.length > 0 || tables.length > 0) {
            set((state) => ({
              pages: { ...state.pages, [id]: pages },
              tables: { ...state.tables, [id]: tables },
            }));
          }
        } catch (err) {
          console.error('[Firebase] setCurrentApp fetch failed:', err);
        }
      },

      getCurrentApp: () => {
        const { apps, currentAppId } = get();
        return apps.find((a) => a.id === currentAppId) ?? null;
      },

      // ── Database ─────────────────────────────────────────
      tables: {},
      getTablesForApp: (appId) => get().tables[appId] ?? [],

      createTable: (appId, name) => {
        const { currentUser } = get();
        const tableId = generateId();
        const table: DBTable = {
          id: tableId,
          appId,
          name,
          isSystem: false,
          fields: [
            { id: generateId(), tableId, name: 'Name', type: 'text', isSystem: true, required: true },
          ],
          records: [],
        };
        set((state) => ({
          tables: { ...state.tables, [appId]: [...(state.tables[appId] ?? []), table] },
        }));
        if (firebaseEnabled && currentUser) {
          fsCreateTable(currentUser.id, appId, table).catch(console.error);
        }
        return table;
      },

      deleteTable: (appId, tableId) => {
        const { currentUser } = get();
        set((state) => ({
          tables: {
            ...state.tables,
            [appId]: (state.tables[appId] ?? []).filter((t) => t.id !== tableId || t.isSystem),
          },
        }));
        if (firebaseEnabled && currentUser) {
          fsDeleteTable(currentUser.id, appId, tableId).catch(console.error);
        }
      },

      addField: (appId, tableId, name, type) => {
        const { currentUser } = get();
        const field: DBField = { id: generateId(), tableId, name, type, isSystem: false };
        set((state) => ({
          tables: {
            ...state.tables,
            [appId]: (state.tables[appId] ?? []).map((t) =>
              t.id === tableId ? { ...t, fields: [...t.fields, field] } : t,
            ),
          },
        }));
        if (firebaseEnabled && currentUser) {
          const updated = get().tables[appId]?.find((t) => t.id === tableId);
          if (updated) fsUpdateTable(currentUser.id, appId, tableId, { fields: updated.fields }).catch(console.error);
        }
        return field;
      },

      updateField: (appId, tableId, fieldId, updates) => {
        const { currentUser } = get();
        set((state) => ({
          tables: {
            ...state.tables,
            [appId]: (state.tables[appId] ?? []).map((t) =>
              t.id === tableId
                ? { ...t, fields: t.fields.map((f) => (f.id === fieldId ? { ...f, ...updates } : f)) }
                : t,
            ),
          },
        }));
        if (firebaseEnabled && currentUser) {
          const updated = get().tables[appId]?.find((t) => t.id === tableId);
          if (updated) fsUpdateTable(currentUser.id, appId, tableId, { fields: updated.fields }).catch(console.error);
        }
      },

      deleteField: (appId, tableId, fieldId) => {
        const { currentUser } = get();
        set((state) => ({
          tables: {
            ...state.tables,
            [appId]: (state.tables[appId] ?? []).map((t) =>
              t.id === tableId
                ? { ...t, fields: t.fields.filter((f) => f.id !== fieldId || f.isSystem) }
                : t,
            ),
          },
        }));
        if (firebaseEnabled && currentUser) {
          const updated = get().tables[appId]?.find((t) => t.id === tableId);
          if (updated) fsUpdateTable(currentUser.id, appId, tableId, { fields: updated.fields }).catch(console.error);
        }
      },

      addRecord: (appId, tableId, values = {}) => {
        const { currentUser } = get();
        const now = new Date().toISOString();
        const record: DBRecord = { id: generateId(), tableId, values, createdAt: now, updatedAt: now };
        set((state) => ({
          tables: {
            ...state.tables,
            [appId]: (state.tables[appId] ?? []).map((t) =>
              t.id === tableId ? { ...t, records: [...t.records, record] } : t,
            ),
          },
        }));
        if (firebaseEnabled && currentUser) {
          const updated = get().tables[appId]?.find((t) => t.id === tableId);
          if (updated) fsUpdateTable(currentUser.id, appId, tableId, { records: updated.records }).catch(console.error);
        }
        return record;
      },

      updateRecord: (appId, tableId, recordId, values) => {
        const { currentUser } = get();
        set((state) => ({
          tables: {
            ...state.tables,
            [appId]: (state.tables[appId] ?? []).map((t) =>
              t.id === tableId
                ? {
                    ...t,
                    records: t.records.map((r) =>
                      r.id === recordId
                        ? { ...r, values: { ...r.values, ...values }, updatedAt: new Date().toISOString() }
                        : r,
                    ),
                  }
                : t,
            ),
          },
        }));
        if (firebaseEnabled && currentUser) {
          const updated = get().tables[appId]?.find((t) => t.id === tableId);
          if (updated) fsUpdateTable(currentUser.id, appId, tableId, { records: updated.records }).catch(console.error);
        }
      },

      deleteRecord: (appId, tableId, recordId) => {
        const { currentUser } = get();
        set((state) => ({
          tables: {
            ...state.tables,
            [appId]: (state.tables[appId] ?? []).map((t) =>
              t.id === tableId ? { ...t, records: t.records.filter((r) => r.id !== recordId) } : t,
            ),
          },
        }));
        if (firebaseEnabled && currentUser) {
          const updated = get().tables[appId]?.find((t) => t.id === tableId);
          if (updated) fsUpdateTable(currentUser.id, appId, tableId, { records: updated.records }).catch(console.error);
        }
      },

      deleteRecords: (appId, tableId, recordIds) => {
        const { currentUser } = get();
        set((state) => ({
          tables: {
            ...state.tables,
            [appId]: (state.tables[appId] ?? []).map((t) =>
              t.id === tableId
                ? { ...t, records: t.records.filter((r) => !recordIds.includes(r.id)) }
                : t,
            ),
          },
        }));
        if (firebaseEnabled && currentUser) {
          const updated = get().tables[appId]?.find((t) => t.id === tableId);
          if (updated) fsUpdateTable(currentUser.id, appId, tableId, { records: updated.records }).catch(console.error);
        }
      },

      // ── Canvas / Pages ────────────────────────────────────
      pages: {},
      getPagesForApp: (appId) =>
        (get().pages[appId] ?? []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),

      createPage: (appId, name, type = 'page') => {
        const { currentUser } = get();
        const pages = get().pages[appId] ?? [];
        const page: Page = {
          id: generateId(),
          appId,
          name,
          type,
          elements: [],
          backgroundColor: '#ffffff',
          order: pages.length,
        };
        set((state) => ({
          pages: { ...state.pages, [appId]: [...(state.pages[appId] ?? []), page] },
        }));
        if (firebaseEnabled && currentUser) {
          fsCreatePage(currentUser.id, appId, page).catch(console.error);
        }
        return page;
      },

      updatePage: (appId, pageId, updates) => {
        const { currentUser } = get();
        set((state) => ({
          pages: {
            ...state.pages,
            [appId]: (state.pages[appId] ?? []).map((p) => (p.id === pageId ? { ...p, ...updates } : p)),
          },
        }));
        if (firebaseEnabled && currentUser) {
          fsUpdatePage(currentUser.id, appId, pageId, updates).catch(console.error);
        }
      },

      deletePage: (appId, pageId) => {
        const { currentUser } = get();
        set((state) => ({
          pages: {
            ...state.pages,
            [appId]: (state.pages[appId] ?? []).filter((p) => p.id !== pageId),
          },
          selectedPageId: state.selectedPageId === pageId ? null : state.selectedPageId,
        }));
        if (firebaseEnabled && currentUser) {
          fsDeletePage(currentUser.id, appId, pageId).catch(console.error);
        }
      },

      reorderPages: (appId, pageIds) => {
        const { currentUser } = get();
        set((state) => ({
          pages: {
            ...state.pages,
            [appId]: (state.pages[appId] ?? []).map((p) => ({ ...p, order: pageIds.indexOf(p.id) })),
          },
        }));
        if (firebaseEnabled && currentUser) {
          const uid = currentUser.id;
          (get().pages[appId] ?? []).forEach((p) =>
            fsUpdatePage(uid, appId, p.id, { order: p.order }).catch(console.error),
          );
        }
      },

      addElement: (appId, pageId, element) => {
        const { currentUser } = get();
        get().pushHistory(appId);
        set((state) => ({
          pages: {
            ...state.pages,
            [appId]: (state.pages[appId] ?? []).map((p) =>
              p.id === pageId ? { ...p, elements: [...p.elements, element] } : p,
            ),
          },
        }));
        if (firebaseEnabled && currentUser) {
          const uid = currentUser.id;
          debounced(`elements:${appId}:${pageId}`, () => {
            const elements = get().pages[appId]?.find((p) => p.id === pageId)?.elements ?? [];
            fsUpdateElements(uid, appId, pageId, elements).catch(console.error);
          });
        }
      },

      updateElement: (appId, pageId, elementId, updates) => {
        const { currentUser } = get();
        set((state) => ({
          pages: {
            ...state.pages,
            [appId]: (state.pages[appId] ?? []).map((p) =>
              p.id === pageId
                ? { ...p, elements: p.elements.map((e) => (e.id === elementId ? { ...e, ...updates } : e)) }
                : p,
            ),
          },
        }));
        if (firebaseEnabled && currentUser) {
          const uid = currentUser.id;
          debounced(`elements:${appId}:${pageId}`, () => {
            const elements = get().pages[appId]?.find((p) => p.id === pageId)?.elements ?? [];
            fsUpdateElements(uid, appId, pageId, elements).catch(console.error);
          });
        }
      },

      deleteElement: (appId, pageId, elementId) => {
        const { currentUser } = get();
        get().pushHistory(appId);
        set((state) => ({
          pages: {
            ...state.pages,
            [appId]: (state.pages[appId] ?? []).map((p) =>
              p.id === pageId
                ? { ...p, elements: p.elements.filter((e) => e.id !== elementId) }
                : p,
            ),
          },
          selectedElementId: state.selectedElementId === elementId ? null : state.selectedElementId,
        }));
        if (firebaseEnabled && currentUser) {
          const uid = currentUser.id;
          debounced(`elements:${appId}:${pageId}`, () => {
            const elements = get().pages[appId]?.find((p) => p.id === pageId)?.elements ?? [];
            fsUpdateElements(uid, appId, pageId, elements).catch(console.error);
          });
        }
      },

      reorderElements: (appId, pageId, elementIds) => {
        const { currentUser } = get();
        set((state) => ({
          pages: {
            ...state.pages,
            [appId]: (state.pages[appId] ?? []).map((p) =>
              p.id === pageId
                ? {
                    ...p,
                    elements: elementIds
                      .map((id) => p.elements.find((e) => e.id === id)!)
                      .filter(Boolean),
                  }
                : p,
            ),
          },
        }));
        if (firebaseEnabled && currentUser) {
          const uid = currentUser.id;
          debounced(`elements:${appId}:${pageId}`, () => {
            const elements = get().pages[appId]?.find((p) => p.id === pageId)?.elements ?? [];
            fsUpdateElements(uid, appId, pageId, elements).catch(console.error);
          });
        }
      },

      // ── Editor UI ─────────────────────────────────────────
      selectedPageId: null,
      selectedElementId: null,
      rightPanelTab: 'element',
      leftPanelTab: 'elements',
      devicePreview: 'mobile',
      zoom: 1,
      setSelectedPage: (id) => set({ selectedPageId: id, selectedElementId: null }),
      setSelectedElement: (id) =>
        set({ selectedElementId: id, rightPanelTab: id ? 'element' : 'app-settings' }),
      setRightPanelTab: (tab) => set({ rightPanelTab: tab }),
      setLeftPanelTab: (tab) => set({ leftPanelTab: tab }),
      setDevicePreview: (device) => set({ devicePreview: device }),
      setZoom: (zoom) => set({ zoom: Math.min(3, Math.max(0.25, zoom)) }),

      // ── History ───────────────────────────────────────────
      history: {},
      historyIndex: {},
      pushHistory: (appId) => {
        const { pages, history, historyIndex } = get();
        const snap: CanvasSnapshot = {
          pages: JSON.parse(JSON.stringify(pages[appId] ?? [])),
          selectedPageId: get().selectedPageId,
          timestamp: Date.now(),
        };
        const idx = historyIndex[appId] ?? -1;
        const hist = (history[appId] ?? []).slice(0, idx + 1);
        const newHist = [...hist, snap].slice(-MAX_HISTORY);
        set((state) => ({
          history: { ...state.history, [appId]: newHist },
          historyIndex: { ...state.historyIndex, [appId]: newHist.length - 1 },
        }));
      },
      undo: (appId) => {
        const { history, historyIndex } = get();
        const idx = historyIndex[appId] ?? -1;
        if (idx <= 0) return;
        const snap = history[appId][idx - 1];
        set((state) => ({
          pages: { ...state.pages, [appId]: snap.pages },
          historyIndex: { ...state.historyIndex, [appId]: idx - 1 },
          selectedPageId: snap.selectedPageId,
        }));
      },
      redo: (appId) => {
        const { history, historyIndex } = get();
        const hist = history[appId] ?? [];
        const idx = historyIndex[appId] ?? -1;
        if (idx >= hist.length - 1) return;
        const snap = hist[idx + 1];
        set((state) => ({
          pages: { ...state.pages, [appId]: snap.pages },
          historyIndex: { ...state.historyIndex, [appId]: idx + 1 },
          selectedPageId: snap.selectedPageId,
        }));
      },
      canUndo: (appId) => (get().historyIndex[appId] ?? -1) > 0,
      canRedo: (appId) => {
        const { history, historyIndex } = get();
        const idx = historyIndex[appId] ?? -1;
        return idx < (history[appId] ?? []).length - 1;
      },

      // ── Firebase init ─────────────────────────────────────
      initFirebase: () => {
        if (!firebaseEnabled) return () => {};

        const unsubscribers: Array<() => void> = [];

        const unsubAuth = fbOnAuthChange((fbUser) => {
          if (!fbUser) {
            set({ currentUser: null, apps: [], pages: {}, tables: {} });
            return;
          }
          const user: User = {
            id: fbUser.uid,
            email: fbUser.email,
            name: fbUser.displayName ?? fbUser.email,
            createdAt: new Date().toISOString(),
          };
          const existing = get().currentUser;
          if (!existing || existing.id !== fbUser.uid) {
            set({ currentUser: user });
          }
          const unsubApps = fsSubscribeApps(fbUser.uid, (apps) => {
            set({ apps });
          });
          unsubscribers.push(unsubApps);
        });

        unsubscribers.push(unsubAuth);
        return () => unsubscribers.forEach((fn) => fn());
      },
    }),
    {
      name: 'click-clone-store',
      partialize: (state) => ({
        currentUser: state.currentUser,
        workspace: state.workspace,
        // When Firebase is enabled, app data lives in Firestore — don't persist locally
        apps: firebaseEnabled ? [] : state.apps,
        tables: firebaseEnabled ? {} : state.tables,
        pages: firebaseEnabled ? {} : state.pages,
        devicePreview: state.devicePreview,
      }),
    },
  ),
);
