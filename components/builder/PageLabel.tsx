'use client';
import { cn } from '@/lib/utils';

interface PageLabelProps {
  name: string;
  isSelected: boolean;
  type: 'page' | 'modal';
  isStartPage?: boolean;
  onClick?: () => void;
}

export default function PageLabel({ name, isSelected, type, isStartPage, onClick }: PageLabelProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium cursor-pointer transition-colors select-none',
        isSelected
          ? 'bg-brand text-white shadow-sm'
          : 'bg-white text-gray-500 border border-gray-200 hover:border-brand hover:text-brand'
      )}
    >
      {isStartPage && <span className="text-[10px]">▶</span>}
      {type === 'modal' && <span className="text-[10px]">◱</span>}
      {name}
    </div>
  );
}
