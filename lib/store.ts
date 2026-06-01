'use client';

import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { AppProject, AppPage, AppElement } from './types';

const STORAGE_KEY = 'click_builder_project';

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

  setProject: (project: AppProject) => void;
  addElement: (element: AppElement, pageId?: string) => void;
  updateElement: (elementId: string, props: Partial<AppElement['props']>) => void;
  removeElement: (elementId: string, pageId?: string) => void;
  selectElement: (elementId: string | null) => void;
  addPage: (name?: string) => void;
  selectPage: (pageId: string) => void;
  setPreviewMode: (preview: boolean) => void;
  reorderElements: (pageId: string, fromIndex: number, toIndex: number) => void;
  initProject: () => void;
  updateProjectName: (name: string) => void;
}

export const useBuilderStore = create<BuilderStore>((set, get) => ({
  project: null,
  selectedElementId: null,
  selectedPageId: null,
  isPreviewMode: false,

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

  addElement: (element, pageId) => {
    const { project, selectedPageId } = get();
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
    set({ project: updated, selectedElementId: element.id });
  },

  updateElement: (elementId, props) => {
    const { project, selectedPageId } = get();
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
    set({ project: updated });
  },

  removeElement: (elementId, pageId) => {
    const { project, selectedPageId, selectedElementId } = get();
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
    });
  },

  selectElement: (elementId) => {
    set({ selectedElementId: elementId });
  },

  addPage: (name) => {
    const { project } = get();
    if (!project) return;
    const newPage: AppPage = {
      id: uuidv4(),
      name: name ?? `ページ ${project.pages.length + 1}`,
      elements: [],
      backgroundColor: '#ffffff',
    };
    const updated: AppProject = {
      ...project,
      pages: [...project.pages, newPage],
      updatedAt: new Date().toISOString(),
    };
    saveToLocalStorage(updated);
    set({ project: updated, selectedPageId: newPage.id });
  },

  selectPage: (pageId) => {
    set({ selectedPageId: pageId, selectedElementId: null });
  },

  setPreviewMode: (preview) => {
    set({ isPreviewMode: preview });
  },

  reorderElements: (pageId, fromIndex, toIndex) => {
    const { project } = get();
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
    set({ project: updated });
  },

  updateProjectName: (name) => {
    const { project } = get();
    if (!project) return;
    const updated = { ...project, name, updatedAt: new Date().toISOString() };
    saveToLocalStorage(updated);
    set({ project: updated });
  },
}));
