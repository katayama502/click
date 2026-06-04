'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { generateId } from './utils';
import type {
  User, Workspace, App, AppVersion, DeviceType,
  DBTable, DBField, DBRecord, FieldType,
  Page, Element, PageType, CanvasSnapshot,
  RightPanelTab, LeftPanelTab, DevicePreview,
} from './types';

interface AppBuilderState {
  // ── Auth ──────────────────────────────────────────────────
  currentUser: User | null;
  login: (email: string, password: string) => boolean;
  register: (email: string, name: string, password: string) => User;
  logout: () => void;

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
  setCurrentApp: (id: string | null) => void;
  getCurrentApp: () => App | null;

  // ── Database ──────────────────────────────────────────────
  tables: Record<string, DBTable[]>; // keyed by appId
  getTablesForApp: (appId: string) => DBTable[];
  createTable: (appId: string, name: string) => DBTable;
  deleteTable: (appId: string, tableId: string) => void;
  addField: (appId: string, tableId: string, name: string, type: FieldType) => DBField;
  updateField: (appId: string, tableId: string, fieldId: string, updates: Partial<DBField>) => void;
  deleteField: (appId: string, tableId: string, fieldId: string) => void;
  addRecord: (appId: string, tableId: string, values?: Record<string, any>) => DBRecord;
  updateRecord: (appId: string, tableId: string, recordId: string, values: Record<string, any>) => void;
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
}

const MAX_HISTORY = 50;

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
      login: (email, password) => {
        // Simple local auth: check if user exists in a "users" store
        const stored = localStorage.getItem('click_clone_users');
        const users: Array<User & { password: string }> = stored ? JSON.parse(stored) : [];
        const found = users.find(u => u.email === email && (u as any).password === password);
        if (found) {
          const { password: _pw, ...user } = found;
          set({ currentUser: user });
          return true;
        }
        return false;
      },
      register: (email, name, password) => {
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
        // Create default workspace
        const ws: Workspace = {
          id: generateId(),
          name: `${name}のワークスペース`,
          ownerId: user.id,
          createdAt: new Date().toISOString(),
        };
        set({ currentUser: user, workspace: ws });
        return user;
      },
      logout: () => set({ currentUser: null, currentAppId: null }),

      // ── Workspace ────────────────────────────────────────
      workspace: null,
      apps: [],
      createApp: (params) => {
        const { workspace } = get();
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
        // Initialize Users table for new app
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
        set(state => ({
          apps: [...state.apps, app],
          tables: { ...state.tables, [app.id]: [usersTable] },
          pages: { ...state.pages, [app.id]: [firstPage] },
        }));
        return app;
      },
      updateApp: (id, updates) => {
        set(state => ({
          apps: state.apps.map(a => a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a),
        }));
      },
      deleteApp: (id) => {
        set(state => {
          const { [id]: _t, ...tables } = state.tables;
          const { [id]: _p, ...pages } = state.pages;
          return {
            apps: state.apps.filter(a => a.id !== id),
            tables,
            pages,
            currentAppId: state.currentAppId === id ? null : state.currentAppId,
          };
        });
      },
      duplicateApp: (id) => {
        const state = get();
        const src = state.apps.find(a => a.id === id);
        if (!src) throw new Error('App not found');
        const now = new Date().toISOString();
        const newApp: App = { ...src, id: generateId(), name: `${src.name} のコピー`, createdAt: now, updatedAt: now, published: false, publishedUrl: undefined };
        const srcTables = state.tables[id] ?? [];
        const srcPages = state.pages[id] ?? [];
        set(s => ({
          apps: [...s.apps, newApp],
          tables: { ...s.tables, [newApp.id]: srcTables.map(t => ({ ...t, id: generateId(), appId: newApp.id })) },
          pages: { ...s.pages, [newApp.id]: srcPages.map(p => ({ ...p, id: generateId(), appId: newApp.id })) },
        }));
        return newApp;
      },

      // ── Current App ──────────────────────────────────────
      currentAppId: null,
      setCurrentApp: (id) => set({ currentAppId: id, selectedPageId: null, selectedElementId: null }),
      getCurrentApp: () => {
        const { apps, currentAppId } = get();
        return apps.find(a => a.id === currentAppId) ?? null;
      },

      // ── Database ─────────────────────────────────────────
      tables: {},
      getTablesForApp: (appId) => get().tables[appId] ?? [],
      createTable: (appId, name) => {
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
        set(state => ({ tables: { ...state.tables, [appId]: [...(state.tables[appId] ?? []), table] } }));
        return table;
      },
      deleteTable: (appId, tableId) => {
        set(state => ({
          tables: {
            ...state.tables,
            [appId]: (state.tables[appId] ?? []).filter(t => t.id !== tableId || t.isSystem),
          },
        }));
      },
      addField: (appId, tableId, name, type) => {
        const field: DBField = { id: generateId(), tableId, name, type, isSystem: false };
        set(state => ({
          tables: {
            ...state.tables,
            [appId]: (state.tables[appId] ?? []).map(t =>
              t.id === tableId ? { ...t, fields: [...t.fields, field] } : t
            ),
          },
        }));
        return field;
      },
      updateField: (appId, tableId, fieldId, updates) => {
        set(state => ({
          tables: {
            ...state.tables,
            [appId]: (state.tables[appId] ?? []).map(t =>
              t.id === tableId
                ? { ...t, fields: t.fields.map(f => f.id === fieldId ? { ...f, ...updates } : f) }
                : t
            ),
          },
        }));
      },
      deleteField: (appId, tableId, fieldId) => {
        set(state => ({
          tables: {
            ...state.tables,
            [appId]: (state.tables[appId] ?? []).map(t =>
              t.id === tableId
                ? { ...t, fields: t.fields.filter(f => f.id !== fieldId || f.isSystem) }
                : t
            ),
          },
        }));
      },
      addRecord: (appId, tableId, values = {}) => {
        const now = new Date().toISOString();
        const record: DBRecord = { id: generateId(), tableId, values, createdAt: now, updatedAt: now };
        set(state => ({
          tables: {
            ...state.tables,
            [appId]: (state.tables[appId] ?? []).map(t =>
              t.id === tableId ? { ...t, records: [...t.records, record] } : t
            ),
          },
        }));
        return record;
      },
      updateRecord: (appId, tableId, recordId, values) => {
        set(state => ({
          tables: {
            ...state.tables,
            [appId]: (state.tables[appId] ?? []).map(t =>
              t.id === tableId
                ? { ...t, records: t.records.map(r => r.id === recordId ? { ...r, values: { ...r.values, ...values }, updatedAt: new Date().toISOString() } : r) }
                : t
            ),
          },
        }));
      },
      deleteRecord: (appId, tableId, recordId) => {
        set(state => ({
          tables: {
            ...state.tables,
            [appId]: (state.tables[appId] ?? []).map(t =>
              t.id === tableId ? { ...t, records: t.records.filter(r => r.id !== recordId) } : t
            ),
          },
        }));
      },
      deleteRecords: (appId, tableId, recordIds) => {
        set(state => ({
          tables: {
            ...state.tables,
            [appId]: (state.tables[appId] ?? []).map(t =>
              t.id === tableId ? { ...t, records: t.records.filter(r => !recordIds.includes(r.id)) } : t
            ),
          },
        }));
      },

      // ── Canvas / Pages ────────────────────────────────────
      pages: {},
      getPagesForApp: (appId) => (get().pages[appId] ?? []).sort((a, b) => (a.order ?? 0) - (b.order ?? 0)),
      createPage: (appId, name, type = 'page') => {
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
        set(state => ({ pages: { ...state.pages, [appId]: [...(state.pages[appId] ?? []), page] } }));
        return page;
      },
      updatePage: (appId, pageId, updates) => {
        set(state => ({
          pages: {
            ...state.pages,
            [appId]: (state.pages[appId] ?? []).map(p => p.id === pageId ? { ...p, ...updates } : p),
          },
        }));
      },
      deletePage: (appId, pageId) => {
        set(state => ({
          pages: {
            ...state.pages,
            [appId]: (state.pages[appId] ?? []).filter(p => p.id !== pageId),
          },
          selectedPageId: state.selectedPageId === pageId ? null : state.selectedPageId,
        }));
      },
      reorderPages: (appId, pageIds) => {
        set(state => ({
          pages: {
            ...state.pages,
            [appId]: (state.pages[appId] ?? []).map(p => ({ ...p, order: pageIds.indexOf(p.id) })),
          },
        }));
      },
      addElement: (appId, pageId, element) => {
        get().pushHistory(appId);
        set(state => ({
          pages: {
            ...state.pages,
            [appId]: (state.pages[appId] ?? []).map(p =>
              p.id === pageId ? { ...p, elements: [...p.elements, element] } : p
            ),
          },
        }));
      },
      updateElement: (appId, pageId, elementId, updates) => {
        set(state => ({
          pages: {
            ...state.pages,
            [appId]: (state.pages[appId] ?? []).map(p =>
              p.id === pageId
                ? { ...p, elements: p.elements.map(e => e.id === elementId ? { ...e, ...updates } : e) }
                : p
            ),
          },
        }));
      },
      deleteElement: (appId, pageId, elementId) => {
        get().pushHistory(appId);
        set(state => ({
          pages: {
            ...state.pages,
            [appId]: (state.pages[appId] ?? []).map(p =>
              p.id === pageId
                ? { ...p, elements: p.elements.filter(e => e.id !== elementId) }
                : p
            ),
          },
          selectedElementId: state.selectedElementId === elementId ? null : state.selectedElementId,
        }));
      },
      reorderElements: (appId, pageId, elementIds) => {
        set(state => ({
          pages: {
            ...state.pages,
            [appId]: (state.pages[appId] ?? []).map(p =>
              p.id === pageId
                ? { ...p, elements: elementIds.map(id => p.elements.find(e => e.id === id)!).filter(Boolean) }
                : p
            ),
          },
        }));
      },

      // ── Editor UI ─────────────────────────────────────────
      selectedPageId: null,
      selectedElementId: null,
      rightPanelTab: 'properties',
      leftPanelTab: 'elements',
      devicePreview: 'mobile',
      zoom: 1,
      setSelectedPage: (id) => set({ selectedPageId: id, selectedElementId: null }),
      setSelectedElement: (id) => set({ selectedElementId: id, rightPanelTab: id ? 'properties' : 'app-settings' }),
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
        set(state => ({
          history: { ...state.history, [appId]: newHist },
          historyIndex: { ...state.historyIndex, [appId]: newHist.length - 1 },
        }));
      },
      undo: (appId) => {
        const { history, historyIndex } = get();
        const idx = historyIndex[appId] ?? -1;
        if (idx <= 0) return;
        const snap = history[appId][idx - 1];
        set(state => ({
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
        set(state => ({
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
    }),
    {
      name: 'click-clone-store',
      partialize: (state) => ({
        currentUser: state.currentUser,
        workspace: state.workspace,
        apps: state.apps,
        tables: state.tables,
        pages: state.pages,
        devicePreview: state.devicePreview,
      }),
    }
  )
);
