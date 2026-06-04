'use client';
import { Plus } from 'lucide-react';

interface EmptyCanvasProps {
  onAddElement?: () => void;
}

export default function EmptyCanvas({ onAddElement }: EmptyCanvasProps) {
  return (
    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none select-none">
      <div className="flex flex-col items-center gap-3 opacity-40">
        <div className="w-16 h-16 border-2 border-dashed border-gray-300 rounded-2xl flex items-center justify-center">
          <Plus size={24} className="text-gray-300" />
        </div>
        <p className="text-xs text-gray-400 text-center leading-relaxed">
          左パネルからエレメントを<br />追加してください
        </p>
      </div>
    </div>
  );
}
