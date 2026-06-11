'use client';

import { useEffect, useState } from 'react';
import { useStore } from './store';

/**
 * zustand persist のローカルストレージ復元(ハイドレーション)が完了したかを返す。
 * 認証ガードはこれが true になるまでリダイレクト判定をしてはならない
 * (直リンク・リロード時に currentUser がまだ null のため /login へ誤って弾かれる)。
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const p = (useStore as unknown as { persist?: {
      hasHydrated: () => boolean;
      onFinishHydration: (fn: () => void) => () => void;
    } }).persist;
    if (!p) {
      setHydrated(true);
      return;
    }
    if (p.hasHydrated()) {
      setHydrated(true);
      return;
    }
    return p.onFinishHydration(() => setHydrated(true));
  }, []);

  return hydrated;
}
