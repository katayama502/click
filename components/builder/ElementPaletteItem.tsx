'use client';

import React from 'react';
import { cn } from '@/lib/utils';
import type { ElementType } from '@/lib/types';

interface ElementPaletteItemProps {
  type: ElementType;
  label: string;
  icon: React.ReactNode;
  onClick: () => void;
}

export default function ElementPaletteItem({ label, icon, onClick }: ElementPaletteItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex items-center gap-2 w-full px-3 py-2 rounded-md text-left text-sm text-gray-700',
        'hover:bg-brand/10 hover:text-brand-700 transition-colors duration-100',
        'focus:outline-none focus:ring-2 focus:ring-brand/30',
      )}
    >
      <span className="flex-shrink-0 w-5 h-5 flex items-center justify-center text-gray-500">
        {icon}
      </span>
      <span className="truncate font-medium">{label}</span>
    </button>
  );
}
