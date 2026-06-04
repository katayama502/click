// localStorage helpers with namespace isolation

const PREFIX = 'click_clone_v1';

export function storageGet<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const item = localStorage.getItem(`${PREFIX}:${key}`);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

export function storageSet<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(`${PREFIX}:${key}`, JSON.stringify(value));
  } catch (e) {
    console.error('Storage write failed', e);
  }
}

export function storageRemove(key: string): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(`${PREFIX}:${key}`);
}

export function storageClear(): void {
  if (typeof window === 'undefined') return;
  const keys = Object.keys(localStorage).filter(k => k.startsWith(PREFIX));
  keys.forEach(k => localStorage.removeItem(k));
}
