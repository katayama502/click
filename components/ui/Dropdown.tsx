'use client';

import React, { useEffect, useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface DropdownItem {
  label: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'danger';
  divider?: boolean;
  disabled?: boolean;
}

interface DropdownProps {
  trigger: React.ReactNode;
  items: DropdownItem[];
  align?: 'left' | 'right';
}

export default function Dropdown({ trigger, items, align = 'left' }: DropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<'bottom' | 'top'>('bottom');

  const toggle = () => setIsOpen((prev) => !prev);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [isOpen]);

  // Determine if menu should open upward
  useEffect(() => {
    if (!isOpen || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const approxMenuHeight = items.length * 36 + 16;
    setPosition(spaceBelow < approxMenuHeight && rect.top > approxMenuHeight ? 'top' : 'bottom');
  }, [isOpen, items.length]);

  const handleItemClick = (item: DropdownItem) => {
    if (item.disabled) return;
    item.onClick?.();
    setIsOpen(false);
  };

  return (
    <div ref={containerRef} className="relative inline-block">
      <div onClick={toggle}>{trigger}</div>

      {isOpen && (
        <div
          role="menu"
          className={cn(
            'absolute z-50 min-w-[160px] bg-white border border-gray-200 rounded-xl shadow-xl py-1',
            'animate-in fade-in zoom-in-95 duration-100',
            align === 'right' ? 'right-0' : 'left-0',
            position === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          )}
        >
          {items.map((item, idx) => {
            if (item.divider) {
              return (
                <hr key={`divider-${idx}`} className="my-1 border-gray-100" aria-hidden="true" />
              );
            }
            return (
              <button
                key={idx}
                role="menuitem"
                onClick={() => handleItemClick(item)}
                disabled={item.disabled}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors text-left',
                  'focus:outline-none focus:bg-gray-50',
                  item.disabled
                    ? 'text-gray-300 cursor-not-allowed'
                    : item.variant === 'danger'
                    ? 'text-red-600 hover:bg-red-50'
                    : 'text-gray-700 hover:bg-gray-50'
                )}
              >
                {item.icon && (
                  <span className="shrink-0 text-current opacity-70">{item.icon}</span>
                )}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
