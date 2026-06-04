'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';

export default function RootPage() {
  const router = useRouter();
  const currentUser = useStore(s => s.currentUser);
  useEffect(() => {
    if (currentUser) {
      router.replace('/workspace');
    } else {
      router.replace('/login');
    }
  }, [currentUser, router]);
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-4 border-brand border-t-transparent rounded-full animate-spin" />
    </div>
  );
}
