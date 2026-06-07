import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, firebaseEnabled } from '../firebase';
import type { App, Page, Element, DBTable } from '../types';

// ── Helpers ────────────────────────────────────────────────────────────────

function appsCol(userId: string) {
  return collection(db!, `users/${userId}/apps`);
}
function appDoc(userId: string, appId: string) {
  return doc(db!, `users/${userId}/apps/${appId}`);
}
function pagesCol(userId: string, appId: string) {
  return collection(db!, `users/${userId}/apps/${appId}/pages`);
}
function pageDoc(userId: string, appId: string, pageId: string) {
  return doc(db!, `users/${userId}/apps/${appId}/pages/${pageId}`);
}
function tablesCol(userId: string, appId: string) {
  return collection(db!, `users/${userId}/apps/${appId}/tables`);
}
function tableDoc(userId: string, appId: string, tableId: string) {
  return doc(db!, `users/${userId}/apps/${appId}/tables/${tableId}`);
}

/** Convert a Firestore document data object to an App, normalising Timestamps. */
function toApp(data: Record<string, unknown>): App {
  return {
    ...data,
    createdAt:
      data.createdAt && typeof (data.createdAt as any).toDate === 'function'
        ? (data.createdAt as any).toDate().toISOString()
        : (data.createdAt as string) ?? new Date().toISOString(),
    updatedAt:
      data.updatedAt && typeof (data.updatedAt as any).toDate === 'function'
        ? (data.updatedAt as any).toDate().toISOString()
        : (data.updatedAt as string) ?? new Date().toISOString(),
  } as App;
}

function toPage(data: Record<string, unknown>): Page {
  return { ...data } as unknown as Page;
}

function toTable(data: Record<string, unknown>): DBTable {
  return { ...data } as unknown as DBTable;
}

// ── Apps CRUD ──────────────────────────────────────────────────────────────

export async function fsCreateApp(userId: string, app: App): Promise<void> {
  if (!firebaseEnabled || !db) return;
  await setDoc(appDoc(userId, app.id), { ...app });
}

export async function fsUpdateApp(
  userId: string,
  appId: string,
  updates: Partial<App>
): Promise<void> {
  if (!firebaseEnabled || !db) return;
  await updateDoc(appDoc(userId, appId), { ...updates });
}

export async function fsDeleteApp(userId: string, appId: string): Promise<void> {
  if (!firebaseEnabled || !db) return;

  // Delete sub-collections first
  const [pageSnap, tableSnap] = await Promise.all([
    getDocs(pagesCol(userId, appId)),
    getDocs(tablesCol(userId, appId)),
  ]);
  await Promise.all([
    ...pageSnap.docs.map((d) => deleteDoc(d.ref)),
    ...tableSnap.docs.map((d) => deleteDoc(d.ref)),
  ]);

  await deleteDoc(appDoc(userId, appId));
}

export function fsSubscribeApps(
  userId: string,
  callback: (apps: App[]) => void
): () => void {
  if (!firebaseEnabled || !db) {
    callback([]);
    return () => {};
  }
  const q = query(appsCol(userId));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => toApp(d.data() as Record<string, unknown>)));
  });
}

export async function fsGetApp(userId: string, appId: string): Promise<App | null> {
  if (!firebaseEnabled || !db) return null;
  const snap = await getDoc(appDoc(userId, appId));
  if (!snap.exists()) return null;
  return toApp(snap.data() as Record<string, unknown>);
}

// ── Pages CRUD ─────────────────────────────────────────────────────────────

export async function fsGetPages(userId: string, appId: string): Promise<Page[]> {
  if (!firebaseEnabled || !db) return [];
  const q = query(pagesCol(userId, appId), orderBy('order'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => toPage(d.data() as Record<string, unknown>));
}

export async function fsCreatePage(
  userId: string,
  appId: string,
  page: Page
): Promise<void> {
  if (!firebaseEnabled || !db) return;
  await setDoc(pageDoc(userId, appId, page.id), { ...page });
}

export async function fsUpdatePage(
  userId: string,
  appId: string,
  pageId: string,
  updates: Partial<Page>
): Promise<void> {
  if (!firebaseEnabled || !db) return;
  await updateDoc(pageDoc(userId, appId, pageId), { ...updates });
}

export async function fsDeletePage(
  userId: string,
  appId: string,
  pageId: string
): Promise<void> {
  if (!firebaseEnabled || !db) return;
  await deleteDoc(pageDoc(userId, appId, pageId));
}

/** Overwrite the entire `elements` array on a page document. */
export async function fsUpdateElements(
  userId: string,
  appId: string,
  pageId: string,
  elements: Element[]
): Promise<void> {
  if (!firebaseEnabled || !db) return;
  await updateDoc(pageDoc(userId, appId, pageId), { elements });
}

export function fsSubscribePages(
  userId: string,
  appId: string,
  callback: (pages: Page[]) => void
): () => void {
  if (!firebaseEnabled || !db) {
    callback([]);
    return () => {};
  }
  const q = query(pagesCol(userId, appId), orderBy('order'));
  return onSnapshot(q, (snap) => {
    callback(snap.docs.map((d) => toPage(d.data() as Record<string, unknown>)));
  });
}

// ── Tables CRUD ────────────────────────────────────────────────────────────

export async function fsGetTables(userId: string, appId: string): Promise<DBTable[]> {
  if (!firebaseEnabled || !db) return [];
  const snap = await getDocs(tablesCol(userId, appId));
  return snap.docs.map((d) => toTable(d.data() as Record<string, unknown>));
}

export async function fsCreateTable(
  userId: string,
  appId: string,
  table: DBTable
): Promise<void> {
  if (!firebaseEnabled || !db) return;
  await setDoc(tableDoc(userId, appId, table.id), { ...table });
}

export async function fsUpdateTable(
  userId: string,
  appId: string,
  tableId: string,
  updates: Partial<DBTable>
): Promise<void> {
  if (!firebaseEnabled || !db) return;
  await updateDoc(tableDoc(userId, appId, tableId), { ...updates });
}

export async function fsDeleteTable(
  userId: string,
  appId: string,
  tableId: string
): Promise<void> {
  if (!firebaseEnabled || !db) return;
  await deleteDoc(tableDoc(userId, appId, tableId));
}

export function fsSubscribeTables(
  userId: string,
  appId: string,
  callback: (tables: DBTable[]) => void
): () => void {
  if (!firebaseEnabled || !db) {
    callback([]);
    return () => {};
  }
  return onSnapshot(tablesCol(userId, appId), (snap) => {
    callback(snap.docs.map((d) => toTable(d.data() as Record<string, unknown>)));
  });
}
