'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AppProject, AppPage } from '@/lib/types';
import { publishApp } from '@/lib/api';
import ElementRenderer from '@/components/builder/ElementRenderer';

const STORAGE_KEY = 'click_builder_project';

export default function PreviewPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<AppProject | null>(null);
  const [currentPageIndex, setCurrentPageIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'desktop' | 'mobile'>('desktop');
  const [isPublishing, setIsPublishing] = useState(false);
  const [publishUrl, setPublishUrl] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as AppProject;
        setProject(parsed);
      }
    } catch {
      // ignore
    }
  }, []);

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

  const currentPage: AppPage | undefined = project.pages[currentPageIndex];

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

      {/* Page tabs */}
      {project.pages.length > 1 && (
        <div className="bg-white border-b border-gray-200 flex items-center px-4 gap-2 overflow-x-auto">
          {project.pages.map((page, i) => (
            <button
              key={page.id}
              onClick={() => setCurrentPageIndex(i)}
              className={`text-sm py-2 px-3 border-b-2 transition-colors whitespace-nowrap ${
                i === currentPageIndex
                  ? 'border-blue-600 text-blue-600 font-medium'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {page.name}
            </button>
          ))}
        </div>
      )}

      {/* Preview area */}
      <div className="flex-1 overflow-auto flex items-start justify-center py-8 px-4">
        <div
          className="bg-white shadow-xl rounded-lg overflow-hidden transition-all duration-300"
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
                  <ElementRenderer key={element.id} element={element} isPreview={true} />
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
    </div>
  );
}
