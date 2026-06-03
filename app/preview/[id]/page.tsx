'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppProject, AppPage } from '@/lib/types';
import { publishApp } from '@/lib/api';
import ElementRenderer from '@/components/builder/ElementRenderer';

const STORAGE_KEY = 'click_builder_v1';

function cn(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function PreviewPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<AppProject | null>(null);
  const [currentPageId, setCurrentPageId] = useState<string | null>(null);
  const [modalPageId, setModalPageId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishUrl, setPublishUrl] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppProject;
        setProject(parsed);
        setCurrentPageId(parsed.pages[0]?.id ?? null);
      }
    } catch {
      // ignore
    }
  }, []);

  // Auto-refresh when current page has autoRefresh enabled
  const currentPage: AppPage | undefined = project?.pages.find(p => p.id === currentPageId);

  useEffect(() => {
    if (!currentPage?.autoRefresh) return;
    const interval = setInterval(() => {
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setProject(JSON.parse(raw));
      } catch {}
    }, 30000);
    return () => clearInterval(interval);
  }, [currentPage?.autoRefresh, currentPage?.id]);

  const handlePublish = async () => {
    if (!project) return;
    setIsPublishing(true);
    try {
      const data = await publishApp(project);
      setPublishUrl(`${window.location.origin}/published/${data.publishedId}`);
    } catch (err) {
      console.error('Publish failed:', err);
      alert('公開に失敗しました。');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleCopyUrl = () => {
    if (publishUrl) {
      navigator.clipboard.writeText(publishUrl).then(() => {
        alert('URLをコピーしました！');
      });
    }
  };

  if (!project) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-500 text-sm">プレビューを読み込んでいます...</p>
        </div>
      </div>
    );
  }

  // Only show non-modal pages in the tab bar
  const normalPages = project.pages.filter(p => !p.pageType || p.pageType === 'normal');

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Preview toolbar */}
      <div className="h-12 bg-white border-b border-gray-200 flex items-center px-4 gap-4 shadow-sm flex-shrink-0">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          戻る
        </button>

        <div className="h-4 w-px bg-gray-200" />

        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
            <span className="text-white text-xs font-bold">C</span>
          </div>
          <span className="text-sm font-semibold text-gray-800">{project.name}</span>
          <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-medium border border-blue-100">
            プレビュー
          </span>
        </div>

        <div className="flex-1" />

        {/* View mode toggle */}
        <div className="flex items-center bg-gray-100 rounded-lg p-0.5 gap-0.5">
          <button
            onClick={() => setViewMode('desktop')}
            className={`p-1.5 rounded-md transition-colors text-xs font-medium flex items-center gap-1 ${
              viewMode === 'desktop' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17H3a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v10a2 2 0 01-2 2h-2" />
            </svg>
          </button>
          <button
            onClick={() => setViewMode('mobile')}
            className={`p-1.5 rounded-md transition-colors text-xs font-medium flex items-center gap-1 ${
              viewMode === 'mobile' ? 'bg-white text-gray-800 shadow-sm' : 'text-gray-500'
            }`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </button>
        </div>

        {publishUrl ? (
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg truncate max-w-48">
              {publishUrl}
            </span>
            <button
              onClick={handleCopyUrl}
              className="flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100 transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              コピー
            </button>
          </div>
        ) : (
          <button
            onClick={handlePublish}
            disabled={isPublishing}
            className="flex items-center gap-1.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-70 px-4 py-1.5 rounded-lg transition-colors"
          >
            {isPublishing ? (
              <>
                <div className="w-3.5 h-3.5 border border-white border-t-transparent rounded-full animate-spin" />
                公開中...
              </>
            ) : '公開する'}
          </button>
        )}
      </div>

      {/* Page tabs — only non-modal pages */}
      {normalPages.length > 1 && (
        <div className="bg-white border-b border-gray-200 flex items-center px-4 gap-2 overflow-x-auto">
          {normalPages.map((page) => (
            <button
              key={page.id}
              onClick={() => setCurrentPageId(page.id)}
              className={`text-sm py-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
                page.id === currentPageId
                  ? 'border-blue-600 text-blue-600 font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {page.name}
            </button>
          ))}
        </div>
      )}

      {/* Back to first page button */}
      {currentPageId !== project?.pages[0]?.id && (
        <div className="bg-white border-b border-gray-100 flex items-center px-4 py-1.5">
          <button
            onClick={() => project && setCurrentPageId(project.pages[0].id)}
            className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1 transition-colors"
          >
            ← 最初のページへ
          </button>
        </div>
      )}

      {/* Preview area */}
      <div className="flex-1 overflow-auto flex items-start justify-center py-8 px-4">
        <div
          className={cn(
            "bg-white shadow-xl overflow-hidden transition-all duration-300",
            viewMode === 'mobile' ? "rounded-[2.5rem] border-8 border-gray-800" : "rounded-lg"
          )}
          style={{
            width: viewMode === 'mobile' ? '390px' : '100%',
            maxWidth: viewMode === 'mobile' ? '390px' : '960px',
            minHeight: '500px',
          }}
        >
          {currentPage ? (
            <div
              className="min-h-96 p-4 space-y-3"
              style={{ backgroundColor: currentPage.backgroundColor || '#ffffff' }}
            >
              {currentPage.elements.length > 0 ? (
                currentPage.elements.map((element) => (
                  <ElementRenderer
                    key={element.id}
                    element={element}
                    isPreview={true}
                    onNavigate={(pageId) => {
                      const targetPage = project?.pages.find(p => p.id === pageId);
                      if (targetPage?.pageType === 'modal') {
                        setModalPageId(pageId);
                      } else {
                        setCurrentPageId(pageId);
                      }
                    }}
                  />
                ))
              ) : (
                <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
                  このページにはまだ要素がありません
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-400 text-sm">
              ページが見つかりません
            </div>
          )}
        </div>
      </div>

      {/* Modal overlay */}
      {modalPageId && (() => {
        const modalPage = project?.pages.find(p => p.id === modalPageId);
        if (!modalPage) return null;
        return (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden w-full max-w-sm">
              {/* Modal header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800">{modalPage.name}</h3>
                <button
                  onClick={() => setModalPageId(null)}
                  className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              {/* Modal content */}
              <div
                className="p-4 space-y-3 max-h-[70vh] overflow-y-auto"
                style={{ backgroundColor: modalPage.backgroundColor || '#fff' }}
              >
                {modalPage.elements.map(el => (
                  <ElementRenderer
                    key={el.id}
                    element={el}
                    isPreview={true}
                    onNavigate={(pageId) => {
                      const target = project?.pages.find(p => p.id === pageId);
                      if (target?.pageType === 'modal') {
                        setModalPageId(pageId);
                      } else {
                        setModalPageId(null);
                        setCurrentPageId(pageId);
                      }
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
