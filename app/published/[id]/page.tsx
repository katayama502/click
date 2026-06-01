'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { AppProject, AppPage } from '@/lib/types';
import { getPublishedApp } from '@/lib/api';
import ElementRenderer from '@/components/builder/ElementRenderer';

export default function PublishedPage() {
  const params = useParams();
  const id = params.id as string;
  const [project, setProject] = useState<AppProject | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    const fetchProject = async () => {
      try {
        const data = await getPublishedApp(id);
        if (!data) {
          setError('このアプリは存在しないか、公開が取り消されました。');
          return;
        }
        setProject(data);
      } catch {
        setError('ネットワークエラーが発生しました。');
      } finally {
        setLoading(false);
      }
    };
    fetchProject();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-500 text-sm">アプリを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-50">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">アプリが見つかりません</h1>
          <p className="text-gray-500 text-sm mb-6">{error || 'アプリが見つかりませんでした。'}</p>
          <a
            href="/"
            className="inline-flex items-center gap-2 bg-blue-600 text-white font-medium px-5 py-2.5 rounded-lg hover:bg-blue-700 transition-colors text-sm"
          >
            Click のトップへ
          </a>
        </div>
      </div>
    );
  }

  const currentPage: AppPage | undefined = project.pages[currentPageIndex];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Published app header */}
      <header className="bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 h-12 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold">C</span>
            </div>
            <span className="font-semibold text-gray-800 text-sm">{project.name}</span>
          </div>

          {/* Page navigation */}
          {project.pages.length > 1 && (
            <nav className="flex items-center gap-1">
              {project.pages.map((page, i) => (
                <button
                  key={page.id}
                  onClick={() => setCurrentPageIndex(i)}
                  className={`text-sm px-3 py-1 rounded-md transition-colors ${
                    i === currentPageIndex
                      ? 'bg-blue-600 text-white font-medium'
                      : 'text-gray-500 hover:bg-gray-100'
                  }`}
                >
                  {page.name}
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      {/* App content */}
      <main className="flex-1">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {currentPage ? (
            <div
              className="min-h-64 space-y-3"
              style={{ backgroundColor: currentPage.backgroundColor || 'transparent' }}
            >
              {currentPage.elements.length > 0 ? (
                currentPage.elements.map((element) => (
                  <ElementRenderer key={element.id} element={element} isPreview={true} />
                ))
              ) : (
                <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
                  このページにはまだ要素がありません
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              ページが見つかりません
            </div>
          )}
        </div>
      </main>

      {/* Powered by Click footer */}
      <footer className="py-4 border-t border-gray-100 bg-white">
        <div className="max-w-4xl mx-auto px-4 flex items-center justify-center gap-2">
          <span className="text-xs text-gray-400">Powered by</span>
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
          >
            <div className="w-4 h-4 rounded bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
              <span className="text-white text-xs font-bold" style={{ fontSize: '8px' }}>C</span>
            </div>
            Click
          </a>
        </div>
      </footer>
    </div>
  );
}
