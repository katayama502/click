'use client';

import React, { useRef, useState } from 'react';
import { cn } from '@/lib/utils';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
}

const PRESET_COLORS = [
  // Brand
  '#1ec8a5', '#0d9488', '#5eead4',
  // Neutrals
  '#ffffff', '#f9fafb', '#e5e7eb', '#9ca3af', '#4b5563', '#1f2937', '#000000',
  // Reds / Pinks
  '#ef4444', '#f87171', '#ec4899',
  // Oranges / Yellows
  '#f97316', '#fbbf24', '#fde68a',
  // Blues / Purples
  '#3b82f6', '#60a5fa', '#8b5cf6', '#a78bfa',
  // Greens
  '#22c55e', '#4ade80', '#bbf7d0',
];

export default function ColorPicker({ value, onChange, label }: ColorPickerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isOpen, setIsOpen] = useState(false);

  const handleSwatchClick = () => {
    setIsOpen((prev) => !prev);
  };

  const handleNativeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(e.target.value);
  };

  const handlePresetClick = (color: string) => {
    onChange(color);
  };

  const handleHexInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (/^#[0-9a-fA-F]{0,6}$/.test(val)) {
      if (val.length === 7) onChange(val);
    }
  };

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-sm font-medium text-gray-700">{label}</label>
      )}
      <div className="relative">
        {/* Swatch + Hex display */}
        <button
          type="button"
          onClick={handleSwatchClick}
          className="flex items-center gap-2 border border-gray-300 rounded-lg px-2 py-1.5 hover:bg-gray-50 transition-colors w-full focus:outline-none focus:ring-2 focus:ring-brand/30"
          aria-label={`Selected color: ${value}`}
        >
          <span
            className="w-6 h-6 rounded border border-gray-200 shrink-0 shadow-sm"
            style={{ backgroundColor: value }}
          />
          <span className="text-sm text-gray-700 font-mono tracking-wider">{value.toUpperCase()}</span>
        </button>

        {/* Hidden native color input */}
        <input
          ref={inputRef}
          type="color"
          value={value}
          onChange={handleNativeChange}
          className="sr-only"
          aria-hidden="true"
        />

        {/* Popover palette */}
        {isOpen && (
          <>
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
              aria-hidden="true"
            />
            <div className="absolute z-20 top-full mt-2 left-0 bg-white border border-gray-200 rounded-xl shadow-xl p-3 w-56">
              {/* Preset grid */}
              <div className="grid grid-cols-7 gap-1 mb-3">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    type="button"
                    title={color}
                    onClick={() => handlePresetClick(color)}
                    className={cn(
                      'w-6 h-6 rounded border transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-brand/40',
                      value.toLowerCase() === color.toLowerCase()
                        ? 'border-brand ring-2 ring-brand/40 scale-110'
                        : 'border-gray-200'
                    )}
                    style={{ backgroundColor: color }}
                    aria-label={color}
                  />
                ))}
              </div>

              {/* Hex input + native picker */}
              <div className="flex items-center gap-2 border-t border-gray-100 pt-2">
                <button
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  className="w-8 h-8 rounded-lg border border-gray-300 shrink-0 cursor-pointer hover:scale-105 transition-transform shadow-sm"
                  style={{ backgroundColor: value }}
                  title="Open color picker"
                  aria-label="Open native color picker"
                />
                <input
                  type="text"
                  defaultValue={value.toUpperCase()}
                  onChange={handleHexInput}
                  onBlur={(e) => {
                    let v = e.target.value.trim();
                    if (!v.startsWith('#')) v = '#' + v;
                    if (/^#[0-9a-fA-F]{6}$/.test(v)) onChange(v);
                  }}
                  placeholder="#000000"
                  className="flex-1 border border-gray-300 rounded-lg px-2 py-1 text-xs font-mono uppercase focus:outline-none focus:ring-2 focus:ring-brand/30 focus:border-brand"
                  maxLength={7}
                  aria-label="Hex color value"
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
