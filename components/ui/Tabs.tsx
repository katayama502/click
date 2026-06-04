'use client';

import React from 'react';
import { cn } from '@/lib/utils';

interface Tab {
  id: string;
  label: string;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  variant?: 'line' | 'pill' | 'box';
}

export default function Tabs({ tabs, activeTab, onChange, variant = 'line' }: TabsProps) {
  if (variant === 'line') {
    return (
      <div className="border-b border-gray-200">
        <nav className="flex gap-0" role="tablist" aria-label="Tabs">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                role="tab"
                aria-selected={isActive}
                onClick={() => onChange(tab.id)}
                className={cn(
                  'inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors focus:outline-none',
                  isActive
                    ? 'border-brand text-brand'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                )}
              >
                {tab.icon && <span className="shrink-0">{tab.icon}</span>}
                {tab.label}
              </button>
            );
          })}
        </nav>
      </div>
    );
  }

  if (variant === 'pill') {
    return (
      <div
        className="inline-flex items-center bg-gray-100 rounded-full p-1 gap-1"
        role="tablist"
        aria-label="Tabs"
      >
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab;
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onChange(tab.id)}
              className={cn(
                'inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-sm font-medium transition-colors focus:outline-none',
                isActive
                  ? 'bg-brand text-white shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              )}
            >
              {tab.icon && <span className="shrink-0">{tab.icon}</span>}
              {tab.label}
            </button>
          );
        })}
      </div>
    );
  }

  // box variant — for builder panels
  return (
    <div
      className="flex border border-gray-200 rounded-lg overflow-hidden"
      role="tablist"
      aria-label="Tabs"
    >
      {tabs.map((tab, idx) => {
        const isActive = tab.id === activeTab;
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(tab.id)}
            className={cn(
              'flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors focus:outline-none',
              isActive
                ? 'bg-brand text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50',
              idx > 0 && 'border-l border-gray-200'
            )}
          >
            {tab.icon && <span className="shrink-0">{tab.icon}</span>}
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
