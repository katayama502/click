'use client';

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { AppProject, AppPage, AppElement, DbTable, DbColumn, DbRow, AppDatabase, PageType } from './types';

const STORAGE_KEY = 'click_builder_v1';
const MAX_HISTORY = 50;

export function createDefaultProject(): AppProject {
  const pageId = uuidv4();
  return {
    id: uuidv4(),
    name: '新しいアプリ',
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
      tables: [{
        id: uuidv4(),
        name: 'Users',
        columns: [
          { id: uuidv4(), name: 'Name', type: 'text' as const },
          { id: uuidv4(), name: 'パスワード', type: 'password' as const },
        ],
        rows: [],
        createdAt: new Date().toISOString(),
      }],
    },
  };
}

function saveToLocalStorage(project: AppProject | null) {
  if (typeof window === 'undefined') return;
  if (project) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
  } else {
    localStorage.removeItem(STORAGE_KEY);
  }
}

function loadFromLocalStorage(): AppProject | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AppProject;
  } catch {
    return null;
  }
}

interface BuilderStore {
  project: AppProject | null;
  selectedElementId: string | null;
  selectedPageId: string | null;
  isPreviewMode: boolean;
  history: AppProject[];
  future: AppProject[];

  // Computed
  canUndo: () => boolean;
  canRedo: () => boolean;

  // Project
  setProject: (project: AppProject) => void;
  initProject: () => void;
  updateProjectName: (name: string) => void;

  // History
  undo: () => void;
  redo: () => void;

  // Elements
  addElement: (element: AppElement, pageId?: string) => void;
  updateElement: (elementId: string, props: Partial<AppElement['props']>) => void;
  updateElementRoot: (elementId: string, patch: Partial<Pick<AppElement, 'clickActions' | 'visibilityMode' | 'visibilityConditions'>>) => void;
  removeElement: (elementId: string, pageId?: string) => void;
  selectElement: (elementId: string | null) => void;
  reorderElements: (pageId: string, fromIndex: number, toIndex: number) => void;

  // Pages
  addPage: (name?: string, pageType?: PageType) => void;
  selectPage: (pageId: string) => void;
  renamePage: (pageId: string, name: string) => void;
  deletePage: (pageId: string) => void;
  updatePageSettings: (pageId: string, settings: Partial<Pick<AppPage, 'pageType' | 'autoRefresh' | 'backgroundColor'>>) => void;

  // Preview
  setPreviewMode: (preview: boolean) => void;

  // Database
  addDbTable: (name: string) => void;
  deleteDbTable: (tableId: string) => void;
  renameDbTable: (tableId: string, name: string) => void;
  addDbColumn: (tableId: string, column: Omit<DbColumn, 'id'>) => void;
  deleteDbColumn: (tableId: string, columnId: string) => void;
  addDbRow: (tableId: string) => void;
  updateDbRow: (tableId: string, rowId: string, columnId: string, value: string) => void;
  deleteDbRow: (tableId: string, rowId: string) => void;
}

function pushHistory(state: BuilderStore, project: AppProject): Partial<BuilderStore> {
  const history = [...state.history, project].slice(-MAX_HISTORY);
  return { history, future: [] };
}

export const useBuilderStore = create<BuilderStore>((set, get) => ({
  project: null,
  selectedElementId: null,
  selectedPageId: null,
  isPreviewMode: false,
  history: [],
  future: [],

  canUndo: () => get().history.length > 0,
  canRedo: () => get().future.length > 0,

  initProject: () => {
    const existing = loadFromLocalStorage();
    if (existing) {
      set({
        project: existing,
        selectedPageId: existing.pages[0]?.id ?? null,
      });
    } else {
      const newProject = createDefaultProject();
      saveToLocalStorage(newProject);
      set({
        project: newProject,
        selectedPageId: newProject.pages[0]?.id ?? null,
      });
    }
  },

  setProject: (project) => {
    saveToLocalStorage(project);
    set({ project });
  },

  updateProjectName: (name) => {
    const state = get();
    if (!state.project) return;
    const updated = { ...state.project, name, updatedAt: new Date().toISOString() };
    saveToLocalStorage(updated);
    set({ project: updated, ...pushHistory(state, state.project) });
  },

  undo: () => {
    const { history, future, project } = get();
    if (history.length === 0 || !project) return;
    const prev = history[history.length - 1];
    const newHistory = history.slice(0, -1);
    const newFuture = [project, ...future].slice(0, MAX_HISTORY);
    saveToLocalStorage(prev);
    set({
      project: prev,
      history: newHistory,
      future: newFuture,
      selectedElementId: null,
    });
  },

  redo: () => {
    const { history, future, project } = get();
    if (future.length === 0 || !project) return;
    const next = future[0];
    const newFuture = future.slice(1);
    const newHistory = [...history, project].slice(-MAX_HISTORY);
    saveToLocalStorage(next);
    set({
      project: next,
      history: newHistory,
      future: newFuture,
      selectedElementId: null,
    });
  },

  addElement: (element, pageId) => {
    const state = get();
    const { project, selectedPageId } = state;
    if (!project) return;
    const targetPageId = pageId ?? selectedPageId ?? project.pages[0]?.id;
    if (!targetPageId) return;

    const updatedPages = project.pages.map((page) => {
      if (page.id !== targetPageId) return page;
      return { ...page, elements: [...page.elements, element] };
    });

    const updated: AppProject = {
      ...project,
      pages: updatedPages,
      updatedAt: new Date().toISOString(),
    };
    saveToLocalStorage(updated);
    set({ project: updated, selectedElementId: element.id, ...pushHistory(state, project) });
  },

  updateElement: (elementId, props) => {
    const state = get();
    const { project } = state;
    if (!project) return;

    const updatedPages = project.pages.map((page) => {
      const updatedElements = page.elements.map((el) => {
        if (el.id !== elementId) return el;
        return { ...el, props: { ...el.props, ...props } };
      });
      return { ...page, elements: updatedElements };
    });

    const updated: AppProject = {
      ...project,
      pages: updatedPages,
      updatedAt: new Date().toISOString(),
    };
    saveToLocalStorage(updated);
    // Don't push to history on every keystroke — only the snapshot before editing matters.
    // History is pushed when selection changes or element is added/removed.
    set({ project: updated });
  },

  updateElementRoot: (elementId, patch) => {
    const state = get();
    const { project } = state;
    if (!project) return;

    const updatedPages = project.pages.map((page) => {
      const updatedElements = page.elements.map((el) => {
        if (el.id !== elementId) return el;
        return { ...el, ...patch };
      });
      return { ...page, elements: updatedElements };
    });

    const updated: AppProject = {
      ...project,
      pages: updatedPages,
      updatedAt: new Date().toISOString(),
    };
    saveToLocalStorage(updated);
    set({ project: updated });
  },

  removeElement: (elementId, pageId) => {
    const state = get();
    const { project, selectedPageId, selectedElementId } = state;
    if (!project) return;
    const targetPageId = pageId ?? selectedPageId ?? project.pages[0]?.id;

    const updatedPages = project.pages.map((page) => {
      if (page.id !== targetPageId) return page;
      return {
        ...page,
        elements: page.elements.filter((el) => el.id !== elementId),
      };
    });

    const updated: AppProject = {
      ...project,
      pages: updatedPages,
      updatedAt: new Date().toISOString(),
    };
    saveToLocalStorage(updated);
    set({
      project: updated,
      selectedElementId: selectedElementId === elementId ? null : selectedElementId,
      ...pushHistory(state, project),
    });
  },

  selectElement: (elementId) => {
    set({ selectedElementId: elementId });
  },

  updatePageSettings: (pageId, settings) => {
    const state = get();
    const { project } = state;
    if (!project) return;
    const updatedPages = project.pages.map((p) =>
      p.id === pageId ? { ...p, ...settings } : p
    );
    const updated: AppProject = { ...project, pages: updatedPages, updatedAt: new Date().toISOString() };
    saveToLocalStorage(updated);
    set({ project: updated, ...pushHistory(state, project) });
  },

  addPage: (name, pageType) => {
    const state = get();
    const { project } = state;
    if (!project) return;
    const newPage: AppPage = {
      id: uuidv4(),
      name: name ?? `ページ ${project.pages.length + 1}`,
      elements: [],
      backgroundColor: '#ffffff',
      pageType: pageType ?? 'normal',
    };
    const updated: AppProject = {
      ...project,
      pages: [...project.pages, newPage],
      updatedAt: new Date().toISOString(),
    };
    saveToLocalStorage(updated);
    set({ project: updated, selectedPageId: newPage.id, ...pushHistory(state, project) });
  },

  selectPage: (pageId) => {
    set({ selectedPageId: pageId, selectedElementId: null });
  },

  renamePage: (pageId, name) => {
    const state = get();
    const { project } = state;
    if (!project) return;
    const updatedPages = project.pages.map((p) =>
      p.id === pageId ? { ...p, name } : p
    );
    const updated: AppProject = {
      ...project,
      pages: updatedPages,
      updatedAt: new Date().toISOString(),
    };
    saveToLocalStorage(updated);
    set({ project: updated, ...pushHistory(state, project) });
  },

  deletePage: (pageId) => {
    const state = get();
    const { project, selectedPageId } = state;
    if (!project || project.pages.length <= 1) return; // keep at least 1 page
    const updatedPages = project.pages.filter((p) => p.id !== pageId);
    const newSelectedPageId =
      selectedPageId === pageId
        ? (updatedPages[0]?.id ?? null)
        : selectedPageId;
    const updated: AppProject = {
      ...project,
      pages: updatedPages,
      updatedAt: new Date().toISOString(),
    };
    saveToLocalStorage(updated);
    set({
      project: updated,
      selectedPageId: newSelectedPageId,
      selectedElementId: null,
      ...pushHistory(state, project),
    });
  },

  setPreviewMode: (preview) => {
    set({ isPreviewMode: preview });
  },

  addDbTable: (name) => {
    const state = get();
    if (!state.project) return;
    const newTable: DbTable = {
      id: uuidv4(),
      name,
      columns: [{ id: uuidv4(), name: 'Name', type: 'text' as const }],
      rows: [],
      createdAt: new Date().toISOString(),
    };
    const updated = {
      ...state.project,
      database: { tables: [...(state.project.database?.tables ?? []), newTable] },
      updatedAt: new Date().toISOString(),
    };
    saveToLocalStorage(updated);
    set({ project: updated });
  },

  deleteDbTable: (tableId) => {
    const state = get();
    if (!state.project) return;
    // Users table cannot be deleted
    const tableToDelete = (state.project.database?.tables ?? []).find(t => t.id === tableId);
    if (!tableToDelete || tableToDelete.name === 'Users') return;
    const updated = {
      ...state.project,
      database: { tables: (state.project.database?.tables ?? []).filter(t => t.id !== tableId) },
      updatedAt: new Date().toISOString(),
    };
    saveToLocalStorage(updated);
    set({ project: updated });
  },

  renameDbTable: (tableId, name) => {
    const state = get();
    if (!state.project) return;
    const updated = {
      ...state.project,
      database: {
        tables: (state.project.database?.tables ?? []).map(t =>
          t.id === tableId ? { ...t, name } : t
        ),
      },
      updatedAt: new Date().toISOString(),
    };
    saveToLocalStorage(updated);
    set({ project: updated });
  },

  addDbColumn: (tableId, column) => {
    const state = get();
    if (!state.project) return;
    const newCol: DbColumn = { id: uuidv4(), ...column };
    const updated = {
      ...state.project,
      database: {
        tables: (state.project.database?.tables ?? []).map(t =>
          t.id === tableId ? { ...t, columns: [...t.columns, newCol] } : t
        ),
      },
      updatedAt: new Date().toISOString(),
    };
    saveToLocalStorage(updated);
    set({ project: updated });
  },

  deleteDbColumn: (tableId, columnId) => {
    const state = get();
    if (!state.project) return;
    // Name column cannot be deleted
    const table = (state.project.database?.tables ?? []).find(t => t.id === tableId);
    const colToDelete = table?.columns.find(c => c.id === columnId);
    if (colToDelete?.name === 'Name') return;
    const updated = {
      ...state.project,
      database: {
        tables: (state.project.database?.tables ?? []).map(t => {
          if (t.id !== tableId) return t;
          return {
            ...t,
            columns: t.columns.filter(c => c.id !== columnId),
            rows: t.rows.map(r => {
              const cells = { ...r.cells };
              delete cells[columnId];
              return { ...r, cells };
            }),
          };
        }),
      },
      updatedAt: new Date().toISOString(),
    };
    saveToLocalStorage(updated);
    set({ project: updated });
  },

  addDbRow: (tableId) => {
    const state = get();
    if (!state.project) return;
    const table = (state.project.database?.tables ?? []).find(t => t.id === tableId);
    if (!table) return;
    const newRow: DbRow = {
      id: uuidv4(),
      cells: Object.fromEntries(table.columns.map(c => [c.id, ''])),
    };
    const updated = {
      ...state.project,
      database: {
        tables: (state.project.database?.tables ?? []).map(t =>
          t.id === tableId ? { ...t, rows: [...t.rows, newRow] } : t
        ),
      },
      updatedAt: new Date().toISOString(),
    };
    saveToLocalStorage(updated);
    set({ project: updated });
  },

  updateDbRow: (tableId, rowId, columnId, value) => {
    const state = get();
    if (!state.project) return;
    const updated = {
      ...state.project,
      database: {
        tables: (state.project.database?.tables ?? []).map(t => {
          if (t.id !== tableId) return t;
          return {
            ...t,
            rows: t.rows.map(r =>
              r.id === rowId ? { ...r, cells: { ...r.cells, [columnId]: value } } : r
            ),
          };
        }),
      },
      updatedAt: new Date().toISOString(),
    };
    saveToLocalStorage(updated);
    set({ project: updated });
  },

  deleteDbRow: (tableId, rowId) => {
    const state = get();
    if (!state.project) return;
    const updated = {
      ...state.project,
      database: {
        tables: (state.project.database?.tables ?? []).map(t =>
          t.id === tableId ? { ...t, rows: t.rows.filter(r => r.id !== rowId) } : t
        ),
      },
      updatedAt: new Date().toISOString(),
    };
    saveToLocalStorage(updated);
    set({ project: updated });
  },

  reorderElements: (pageId, fromIndex, toIndex) => {
    const state = get();
    const { project } = state;
    if (!project) return;

    const updatedPages = project.pages.map((page) => {
      if (page.id !== pageId) return page;
      const elements = [...page.elements];
      const [moved] = elements.splice(fromIndex, 1);
      elements.splice(toIndex, 0, moved);
      return { ...page, elements };
    });

    const updated: AppProject = {
      ...project,
      pages: updatedPages,
      updatedAt: new Date().toISOString(),
    };
    saveToLocalStorage(updated);
    set({ project: updated, ...pushHistory(state, project) });
  },
}));
