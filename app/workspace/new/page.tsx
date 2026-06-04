'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/lib/store';
import type { DeviceType } from '@/lib/types';

// ────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────
type DeviceSelection = 'mobile' | 'pc' | 'responsive';
type PrimaryDevice = 'mobile' | 'tablet' | 'desktop';
type DBOption = 'create' | 'skip';

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────
function getVisibleSteps(deviceSelection: DeviceSelection): number[] {
  if (deviceSelection === 'responsive') return [1, 2, 3, 4];
  return [1, 3, 4];
}

function getTotalSteps(deviceSelection: DeviceSelection): number {
  return getVisibleSteps(deviceSelection).length;
}

function getStepIndex(step: number, deviceSelection: DeviceSelection): number {
  return getVisibleSteps(deviceSelection).indexOf(step) + 1;
}

// ────────────────────────────────────────────────────────────
// Icons (inline SVG to avoid extra deps)
// ────────────────────────────────────────────────────────────
function CheckIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

function ChevronLeftIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

function ChevronRightIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6" />
    </svg>
  );
}

function ArrowLeftIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 12H5M12 5l-7 7 7 7" />
    </svg>
  );
}

function SparkleIcon({ size = 16 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z" />
    </svg>
  );
}

function DatabaseIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
    </svg>
  );
}

function SkipIcon({ size = 20, className = '' }: { size?: number; className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M10 15l5-3-5-3v6z" />
      <path d="M17 9v6" />
    </svg>
  );
}

// ────────────────────────────────────────────────────────────
// Device Illustrations
// ────────────────────────────────────────────────────────────
function PhoneIllustration({ active }: { active: boolean }) {
  return (
    <div className={[
      'w-14 h-24 rounded-2xl border-4 flex flex-col items-center justify-start pt-2 gap-1 transition-colors duration-200',
      active ? 'border-brand bg-brand-50' : 'border-gray-300 bg-gray-50',
    ].join(' ')}>
      <div className={['w-4 h-1 rounded-full transition-colors duration-200', active ? 'bg-brand' : 'bg-gray-300'].join(' ')} />
      <div className={['w-8 h-11 rounded-md transition-colors duration-200', active ? 'bg-brand/20' : 'bg-gray-200'].join(' ')} />
      <div className={['w-3 h-3 rounded-full border-2 transition-colors duration-200', active ? 'border-brand' : 'border-gray-300'].join(' ')} />
    </div>
  );
}

function LaptopIllustration({ active }: { active: boolean }) {
  return (
    <div className="flex flex-col items-center gap-0">
      <div className={[
        'w-24 h-16 rounded-t-lg border-4 border-b-0 flex items-center justify-center transition-colors duration-200',
        active ? 'border-brand bg-brand-50' : 'border-gray-300 bg-gray-50',
      ].join(' ')}>
        <div className={['w-16 h-9 rounded transition-colors duration-200', active ? 'bg-brand/20' : 'bg-gray-200'].join(' ')} />
      </div>
      <div className={[
        'w-28 h-2 rounded-b-lg border-4 border-t-2 transition-colors duration-200',
        active ? 'border-brand' : 'border-gray-300',
      ].join(' ')} />
    </div>
  );
}

function MultiDeviceIllustration({ active }: { active: boolean }) {
  return (
    <div className="flex items-end gap-1.5">
      {/* Phone */}
      <div className={[
        'w-7 h-12 rounded-lg border-2 flex flex-col items-center justify-start pt-1 gap-0.5 transition-colors duration-200',
        active ? 'border-brand bg-brand-50' : 'border-gray-300 bg-gray-50',
      ].join(' ')}>
        <div className={['w-3 h-4 rounded-sm transition-colors duration-200', active ? 'bg-brand/20' : 'bg-gray-200'].join(' ')} />
      </div>
      {/* Tablet */}
      <div className={[
        'w-10 h-14 rounded-lg border-2 flex items-center justify-center transition-colors duration-200',
        active ? 'border-brand bg-brand-50' : 'border-gray-300 bg-gray-50',
      ].join(' ')}>
        <div className={['w-7 h-9 rounded-sm transition-colors duration-200', active ? 'bg-brand/20' : 'bg-gray-200'].join(' ')} />
      </div>
      {/* Laptop screen */}
      <div className="flex flex-col items-center gap-0">
        <div className={[
          'w-16 h-10 rounded-t-md border-2 border-b-0 flex items-center justify-center transition-colors duration-200',
          active ? 'border-brand bg-brand-50' : 'border-gray-300 bg-gray-50',
        ].join(' ')}>
          <div className={['w-11 h-6 rounded-sm transition-colors duration-200', active ? 'bg-brand/20' : 'bg-gray-200'].join(' ')} />
        </div>
        <div className={['w-18 h-1.5 rounded-b-md border-2 border-t-0 transition-colors duration-200', active ? 'border-brand' : 'border-gray-300'].join(' ')} style={{ width: 72 }} />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Step 1 — Device Selection (large cards)
// ────────────────────────────────────────────────────────────
interface Step1Props {
  value: DeviceSelection;
  onChange: (v: DeviceSelection) => void;
}

function Step1({ value, onChange }: Step1Props) {
  const options: Array<{
    key: DeviceSelection;
    label: string;
    sublabel: string;
    badge?: { text: string; color: string };
    illustration: React.ReactNode;
  }> = [
    {
      key: 'mobile',
      label: 'モバイルのみ',
      sublabel: 'スマートフォン専用',
      badge: { text: 'おすすめ', color: 'bg-brand text-white' },
      illustration: <PhoneIllustration active={value === 'mobile'} />,
    },
    {
      key: 'pc',
      label: 'PCのみ',
      sublabel: 'パソコン専用',
      illustration: <LaptopIllustration active={value === 'pc'} />,
    },
    {
      key: 'responsive',
      label: 'PC / タブレット\n/ モバイル',
      sublabel: '3デバイス対応',
      badge: { text: 'v4', color: 'bg-purple-500 text-white' },
      illustration: <MultiDeviceIllustration active={value === 'responsive'} />,
    },
  ];

  return (
    <div className="flex gap-3">
      {options.map((opt) => {
        const selected = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={[
              'flex-1 flex flex-col items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 relative',
              selected
                ? 'border-brand bg-brand-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm',
            ].join(' ')}
          >
            {/* Selected checkmark */}
            {selected && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand flex items-center justify-center">
                <CheckIcon size={11} className="text-white" />
              </div>
            )}

            {/* Illustration */}
            <div className="h-20 flex items-end justify-center">
              {opt.illustration}
            </div>

            {/* Label */}
            <div className="text-center">
              <div className={['text-sm font-semibold leading-snug whitespace-pre-line', selected ? 'text-brand-800' : 'text-gray-900'].join(' ')}>
                {opt.label}
              </div>
              <div className="text-xs text-gray-500 mt-1">{opt.sublabel}</div>
              {opt.badge && (
                <div className={['mt-2 text-xs px-2.5 py-0.5 rounded-full inline-block font-medium', opt.badge.color].join(' ')}>
                  {opt.badge.text}
                </div>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Step 2 — Primary Device
// ────────────────────────────────────────────────────────────
interface Step2Props {
  value: PrimaryDevice;
  onChange: (v: PrimaryDevice) => void;
}

function Step2({ value, onChange }: Step2Props) {
  const options: Array<{ key: PrimaryDevice; illustration: React.ReactNode; label: string; sublabel: string }> = [
    {
      key: 'mobile',
      illustration: <PhoneIllustration active={value === 'mobile'} />,
      label: 'モバイル',
      sublabel: 'スマートフォン基準',
    },
    {
      key: 'tablet',
      illustration: (
        <div className={[
          'w-20 h-16 rounded-xl border-4 flex items-center justify-center transition-colors duration-200',
          value === 'tablet' ? 'border-brand bg-brand-50' : 'border-gray-300 bg-gray-50',
        ].join(' ')}>
          <div className={['w-14 h-9 rounded transition-colors duration-200', value === 'tablet' ? 'bg-brand/20' : 'bg-gray-200'].join(' ')} />
        </div>
      ),
      label: 'タブレット',
      sublabel: 'iPad基準',
    },
    {
      key: 'desktop',
      illustration: <LaptopIllustration active={value === 'desktop'} />,
      label: 'PC',
      sublabel: 'デスクトップ基準',
    },
  ];

  return (
    <div className="flex gap-3">
      {options.map((opt) => {
        const selected = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={[
              'flex-1 flex flex-col items-center gap-4 p-5 rounded-2xl border-2 cursor-pointer transition-all duration-200 relative',
              selected
                ? 'border-brand bg-brand-50 shadow-md'
                : 'border-gray-200 hover:border-gray-300 bg-white hover:shadow-sm',
            ].join(' ')}
          >
            {selected && (
              <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-brand flex items-center justify-center">
                <CheckIcon size={11} className="text-white" />
              </div>
            )}
            <div className="h-20 flex items-end justify-center">
              {opt.illustration}
            </div>
            <div className="text-center">
              <div className={['text-sm font-semibold', selected ? 'text-brand-800' : 'text-gray-900'].join(' ')}>
                {opt.label}
              </div>
              <div className="text-xs text-gray-500 mt-1">{opt.sublabel}</div>
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Step 3 — Database
// ────────────────────────────────────────────────────────────
interface Step3Props {
  value: DBOption;
  onChange: (v: DBOption) => void;
}

function Step3({ value, onChange }: Step3Props) {
  return (
    <div className="space-y-3">
      {/* Create DB — primary card */}
      <button
        type="button"
        onClick={() => onChange('create')}
        className={[
          'w-full text-left rounded-2xl border-2 p-5 transition-all duration-200 relative',
          value === 'create'
            ? 'border-brand bg-brand-50 shadow-md'
            : 'border-gray-200 bg-white hover:border-gray-300 hover:shadow-sm',
        ].join(' ')}
      >
        {value === 'create' && (
          <div className="absolute top-4 right-4 w-5 h-5 rounded-full bg-brand flex items-center justify-center">
            <CheckIcon size={11} className="text-white" />
          </div>
        )}
        <div className="flex items-start gap-4">
          <div className={[
            'flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center transition-colors duration-200',
            value === 'create' ? 'bg-brand text-white' : 'bg-gray-100 text-gray-500',
          ].join(' ')}>
            <DatabaseIcon size={22} />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <div className={['font-semibold text-base', value === 'create' ? 'text-brand-800' : 'text-gray-900'].join(' ')}>
              新規データベースを作成
            </div>
            <p className="mt-1 text-sm text-gray-500">新しいデータベースでアプリを作成します</p>
            <div className={[
              'mt-3 inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg',
              value === 'create' ? 'bg-brand/10 text-brand' : 'bg-gray-100 text-gray-500',
            ].join(' ')}>
              <CheckIcon size={12} />
              Users テーブルが自動作成されます
            </div>
          </div>
        </div>
      </button>

      {/* Skip — secondary card */}
      <button
        type="button"
        onClick={() => onChange('skip')}
        className={[
          'w-full text-left rounded-2xl border-2 p-4 transition-all duration-200 relative',
          value === 'skip'
            ? 'border-brand bg-brand-50 shadow-sm'
            : 'border-gray-100 bg-gray-50 hover:border-gray-200',
        ].join(' ')}
      >
        {value === 'skip' && (
          <div className="absolute top-3.5 right-4 w-5 h-5 rounded-full bg-brand flex items-center justify-center">
            <CheckIcon size={11} className="text-white" />
          </div>
        )}
        <div className="flex items-center gap-3">
          <div className={[
            'flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors duration-200',
            value === 'skip' ? 'bg-brand text-white' : 'bg-gray-200 text-gray-400',
          ].join(' ')}>
            <SkipIcon size={18} />
          </div>
          <div>
            <div className={['text-sm font-semibold', value === 'skip' ? 'text-brand-800' : 'text-gray-600'].join(' ')}>
              このステップをスキップ
            </div>
            <p className="text-xs text-gray-400 mt-0.5">データベースなしで開始・後から追加できます</p>
          </div>
        </div>
      </button>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// App Card Preview
// ────────────────────────────────────────────────────────────
function AppCardPreview({ name, description }: { name: string; description: string }) {
  const displayName = name.trim() || 'アプリ名';
  const isEmpty = !name.trim();

  return (
    <div className={[
      'rounded-2xl border-2 p-4 transition-all duration-200',
      isEmpty ? 'border-dashed border-gray-200 bg-gray-50' : 'border-brand/30 bg-brand-50 shadow-sm',
    ].join(' ')}>
      <div className="flex items-start gap-3">
        {/* App icon placeholder */}
        <div className={[
          'flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-lg font-bold transition-colors duration-200',
          isEmpty ? 'bg-gray-200 text-gray-400' : 'bg-brand text-white',
        ].join(' ')}>
          {isEmpty ? '?' : displayName.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0 pt-0.5">
          <div className={['text-base font-semibold transition-colors duration-200', isEmpty ? 'text-gray-400' : 'text-gray-900'].join(' ')}>
            {displayName}
          </div>
          <p className={['text-xs mt-0.5 transition-colors duration-200', isEmpty ? 'text-gray-300' : 'text-gray-500'].join(' ')}>
            {description.trim() || (isEmpty ? '説明なし' : '説明なし')}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span className="inline-flex items-center gap-1 text-xs text-gray-400">
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300 inline-block" />
              編集中
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Step 4 — App Name
// ────────────────────────────────────────────────────────────
interface Step4Props {
  name: string;
  description: string;
  onNameChange: (v: string) => void;
  onDescriptionChange: (v: string) => void;
  nameInputRef: React.RefObject<HTMLInputElement>;
}

function Step4({ name, description, onNameChange, onDescriptionChange, nameInputRef }: Step4Props) {
  return (
    <div className="space-y-5">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          アプリ名 <span className="text-red-400">*</span>
        </label>
        <input
          ref={nameInputRef}
          type="text"
          value={name}
          onChange={(e) => onNameChange(e.target.value.slice(0, 30))}
          placeholder="例: タスク管理アプリ"
          className={[
            'w-full rounded-xl border-2 px-4 py-3.5 text-xl font-semibold text-gray-900 outline-none',
            'transition-all duration-150 placeholder:text-gray-300 placeholder:font-normal placeholder:text-base',
            'focus:ring-2 focus:ring-brand/20',
            name.length === 0 ? 'border-gray-200' : 'border-brand',
          ].join(' ')}
          maxLength={30}
          autoComplete="off"
        />
        <div className="mt-1.5 flex justify-end">
          <span className={['text-xs', name.length >= 28 ? 'text-red-400' : 'text-gray-400'].join(' ')}>
            {name.length}/30
          </span>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">
          説明{' '}
          <span className="text-xs font-normal text-gray-400">（任意）</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value.slice(0, 100))}
          placeholder="アプリの説明（任意）"
          rows={2}
          className={[
            'w-full rounded-xl border-2 px-4 py-3 text-sm text-gray-900 outline-none resize-none',
            'transition-all duration-150 placeholder:text-gray-400',
            'focus:ring-2 focus:ring-brand/20',
            description.length === 0 ? 'border-gray-200' : 'border-brand',
          ].join(' ')}
          maxLength={100}
        />
        <div className="mt-1 flex justify-end">
          <span className={['text-xs', description.length >= 95 ? 'text-red-400' : 'text-gray-400'].join(' ')}>
            {description.length}/100
          </span>
        </div>
      </div>

      {/* Live preview */}
      <div>
        <p className="text-xs text-gray-400 mb-2 font-medium uppercase tracking-wide">プレビュー</p>
        <AppCardPreview name={name} description={description} />
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Step Progress Bar
// ────────────────────────────────────────────────────────────
interface StepProgressProps {
  currentStepIndex: number; // 1-based
  totalSteps: number;
}

function StepProgress({ currentStepIndex, totalSteps }: StepProgressProps) {
  return (
    <div className="flex items-center gap-0 mb-8">
      {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s, i) => (
        <React.Fragment key={s}>
          <div className={[
            'w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 flex-shrink-0',
            currentStepIndex > s
              ? 'bg-brand text-white'
              : currentStepIndex === s
              ? 'bg-brand text-white ring-4 ring-brand/20'
              : 'bg-gray-100 text-gray-400',
          ].join(' ')}>
            {currentStepIndex > s ? <CheckIcon size={14} /> : s}
          </div>
          {i < totalSteps - 1 && (
            <div className={[
              'flex-1 h-0.5 mx-1 transition-all duration-300',
              currentStepIndex > s + 1
                ? 'bg-brand'
                : currentStepIndex === s + 1
                ? 'bg-gradient-to-r from-brand to-gray-200'
                : 'bg-gray-200',
            ].join(' ')} />
          )}
        </React.Fragment>
      ))}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Main Wizard Page
// ────────────────────────────────────────────────────────────
export default function NewAppPage() {
  const router = useRouter();
  const { currentUser, createApp } = useStore();

  // Auth guard
  useEffect(() => {
    if (!currentUser) {
      router.replace('/login');
    }
  }, [currentUser, router]);

  // Wizard state
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4>(1);
  const [deviceSelection, setDeviceSelection] = useState<DeviceSelection>('mobile');
  const [primaryDevice, setPrimaryDevice] = useState<PrimaryDevice>('mobile');
  const [dbOption, setDbOption] = useState<DBOption>('create');
  const [appName, setAppName] = useState('');
  const [appDescription, setAppDescription] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  const nameInputRef = useRef<HTMLInputElement>(null);

  // Derived
  const visibleSteps = getVisibleSteps(deviceSelection);
  const totalSteps = getTotalSteps(deviceSelection);
  const stepIndex = getStepIndex(currentStep, deviceSelection);
  const isLastStep = currentStep === 4;
  const isFirstStep = currentStep === 1;

  // Focus name input when step 4 is shown
  useEffect(() => {
    if (currentStep === 4) {
      setTimeout(() => nameInputRef.current?.focus(), 50);
    }
  }, [currentStep]);

  // When device selection changes, reset primaryDevice default
  useEffect(() => {
    if (deviceSelection === 'pc') {
      setPrimaryDevice('desktop');
    } else {
      setPrimaryDevice('mobile');
    }
  }, [deviceSelection]);

  if (!currentUser) return null;

  // ── Navigation ──────────────────────────────────────────
  function handleNext() {
    if (currentStep === 1) {
      if (deviceSelection === 'responsive') {
        setCurrentStep(2);
      } else {
        setCurrentStep(3);
      }
      return;
    }
    if (currentStep === 2) {
      setCurrentStep(3);
      return;
    }
    if (currentStep === 3) {
      setCurrentStep(4);
      return;
    }
    if (currentStep === 4) {
      handleCreate();
    }
  }

  function handleBack() {
    if (currentStep === 1) return;
    if (currentStep === 2) {
      setCurrentStep(1);
      return;
    }
    if (currentStep === 3) {
      if (deviceSelection === 'responsive') {
        setCurrentStep(2);
      } else {
        setCurrentStep(1);
      }
      return;
    }
    if (currentStep === 4) {
      setCurrentStep(3);
    }
  }

  function canProceed(): boolean {
    if (currentStep === 4) return appName.trim().length > 0;
    return true;
  }

  // ── Create App ──────────────────────────────────────────
  async function handleCreate() {
    if (!canProceed() || isCreating) return;
    setIsCreating(true);

    const version = deviceSelection === 'responsive' ? 'v4' : 'v3';

    const devicesMap: Record<DeviceSelection, DeviceType[]> = {
      mobile: ['mobile'],
      pc: ['desktop'],
      responsive: ['mobile', 'tablet', 'desktop'],
    };

    const primaryDeviceMap: Record<DeviceSelection, DeviceType> = {
      mobile: 'mobile',
      pc: 'desktop',
      responsive: primaryDevice,
    };

    const newApp = createApp({
      name: appName.trim(),
      version,
      primaryDevice: primaryDeviceMap[deviceSelection],
      devices: devicesMap[deviceSelection],
      description: appDescription.trim() || undefined,
    });

    router.push(`/builder/${newApp.id}`);
  }

  // ── Step title / subtitle ───────────────────────────────
  const stepMeta: Record<number, { title: string; subtitle: string }> = {
    1: {
      title: 'アクセスするデバイスを選択',
      subtitle: 'アプリにアクセスするデバイスを選択してください',
    },
    2: {
      title: 'プライマリーデバイスを選択',
      subtitle: '設計の基準となるデバイスを選んでください',
    },
    3: {
      title: 'データベースを使用しますか？',
      subtitle: 'アプリのデータ管理方法を選択してください',
    },
    4: {
      title: 'アプリ名を入力',
      subtitle: 'あなたのアプリに名前をつけましょう',
    },
  };

  const { title, subtitle } = stepMeta[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-brand-50/30 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Back to workspace link */}
        <button
          type="button"
          onClick={() => router.push('/workspace')}
          className="mb-4 flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 transition-colors group"
        >
          <ArrowLeftIcon size={15} />
          <span className="group-hover:underline">ワークスペースに戻る</span>
        </button>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-xl shadow-gray-200/80 border border-gray-100 p-8">
          {/* Step progress indicator */}
          <StepProgress currentStepIndex={stepIndex} totalSteps={totalSteps} />

          {/* Title block */}
          <div className="mb-7">
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">{title}</h1>
            <p className="mt-1.5 text-sm text-gray-500">{subtitle}</p>
          </div>

          {/* Step content — animated on step change */}
          <div
            key={currentStep}
            style={{ animation: 'fadeSlideIn 0.22s ease-out' }}
          >
            {currentStep === 1 && (
              <Step1 value={deviceSelection} onChange={setDeviceSelection} />
            )}
            {currentStep === 2 && (
              <Step2 value={primaryDevice} onChange={setPrimaryDevice} />
            )}
            {currentStep === 3 && (
              <Step3 value={dbOption} onChange={setDbOption} />
            )}
            {currentStep === 4 && (
              <Step4
                name={appName}
                description={appDescription}
                onNameChange={setAppName}
                onDescriptionChange={setAppDescription}
                nameInputRef={nameInputRef}
              />
            )}
          </div>

          {/* Navigation */}
          <div className="mt-8 flex items-center justify-between gap-3">
            {/* Back button */}
            <button
              type="button"
              onClick={handleBack}
              disabled={isFirstStep}
              className={[
                'flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                isFirstStep
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100',
              ].join(' ')}
            >
              <ChevronLeftIcon size={16} />
              戻る
            </button>

            {/* Next / Create button */}
            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed() || isCreating}
              className={[
                'flex items-center gap-2 rounded-xl font-semibold transition-all duration-200',
                isLastStep ? 'px-8 py-3 text-base' : 'px-6 py-2.5 text-sm',
                canProceed() && !isCreating
                  ? 'bg-brand text-white hover:bg-brand-600 shadow-sm hover:shadow-md active:scale-95'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed',
              ].join(' ')}
            >
              {isCreating ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  作成中...
                </>
              ) : isLastStep ? (
                <>
                  <SparkleIcon size={16} />
                  アプリを作成
                </>
              ) : (
                <>
                  次へ
                  <ChevronRightIcon size={16} />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer hint */}
        <p className="mt-4 text-center text-xs text-gray-400">
          いつでも設定は後から変更できます
        </p>
      </div>

      {/* Keyframe animations */}
      <style jsx global>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(8px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
