'use client';

import { useEffect, useRef, useState } from 'react';
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
  // Always: 1, (2 if responsive), 3, 4
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
// Sub-components
// ────────────────────────────────────────────────────────────

interface SelectCardProps {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
  className?: string;
}

function SelectCard({ selected, onClick, children, className = '' }: SelectCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        'w-full text-left rounded-xl border-2 p-4 transition-all duration-200',
        'hover:border-brand hover:bg-brand-50',
        selected
          ? 'border-brand bg-brand-50 shadow-sm'
          : 'border-gray-200 bg-white',
        className,
      ].join(' ')}
    >
      {children}
    </button>
  );
}

// ────────────────────────────────────────────────────────────
// Step 1 — Device Selection
// ────────────────────────────────────────────────────────────
interface Step1Props {
  value: DeviceSelection;
  onChange: (v: DeviceSelection) => void;
}

function Step1({ value, onChange }: Step1Props) {
  return (
    <div className="space-y-3">
      <SelectCard selected={value === 'mobile'} onClick={() => onChange('mobile')}>
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-none mt-0.5">📱</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900">モバイルのみ</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-brand text-white">
                おすすめ
              </span>
            </div>
            <p className="mt-0.5 text-sm text-gray-500">スマートフォン専用のアプリを作成します</p>
          </div>
          <RadioDot selected={value === 'mobile'} />
        </div>
      </SelectCard>

      <SelectCard selected={value === 'pc'} onClick={() => onChange('pc')}>
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-none mt-0.5">💻</span>
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-gray-900">PCのみ</span>
            <p className="mt-0.5 text-sm text-gray-500">パソコン専用のアプリを作成します</p>
          </div>
          <RadioDot selected={value === 'pc'} />
        </div>
      </SelectCard>

      <SelectCard selected={value === 'responsive'} onClick={() => onChange('responsive')}>
        <div className="flex items-start gap-3">
          <span className="text-2xl leading-none mt-0.5">📱</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-gray-900">PC / タブレット / モバイル</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-500 text-white">
                v4
              </span>
            </div>
            <p className="mt-0.5 text-sm text-gray-500">
              3デバイス対応のレスポンシブアプリ（v4環境）
            </p>
          </div>
          <RadioDot selected={value === 'responsive'} />
        </div>
      </SelectCard>
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
  const options: Array<{ key: PrimaryDevice; icon: string; label: string }> = [
    { key: 'mobile', icon: '📱', label: 'モバイル' },
    { key: 'tablet', icon: '📲', label: 'タブレット' },
    { key: 'desktop', icon: '💻', label: 'PC' },
  ];

  return (
    <div className="space-y-3">
      {options.map((opt) => (
        <SelectCard key={opt.key} selected={value === opt.key} onClick={() => onChange(opt.key)}>
          <div className="flex items-center gap-3">
            <span className="text-2xl leading-none">{opt.icon}</span>
            <span className="font-semibold text-gray-900 flex-1">{opt.label}</span>
            <RadioDot selected={value === opt.key} />
          </div>
        </SelectCard>
      ))}
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
      <SelectCard selected={value === 'create'} onClick={() => onChange('create')}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-brand-100 flex items-center justify-center text-brand text-lg">
            🗄️
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-gray-900">新規データベースを作成</span>
            <p className="mt-0.5 text-sm text-gray-500">新しいデータベースでアプリを作成します</p>
            <div className="mt-2 flex items-center gap-1.5 text-xs text-brand font-medium">
              <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
              Usersテーブルが自動作成されます
            </div>
          </div>
          <RadioDot selected={value === 'create'} />
        </div>
      </SelectCard>

      <SelectCard selected={value === 'skip'} onClick={() => onChange('skip')}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500 text-lg">
            ⏭️
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-semibold text-gray-900">このステップをスキップ</span>
            <p className="mt-0.5 text-sm text-gray-500">データベースなしで開始します</p>
            <p className="mt-1 text-xs text-gray-400">後から追加できます</p>
          </div>
          <RadioDot selected={value === 'skip'} />
        </div>
      </SelectCard>
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
            'w-full rounded-xl border px-4 py-3 text-base text-gray-900 outline-none',
            'transition-all duration-150 placeholder:text-gray-400',
            'focus:border-brand focus:ring-2 focus:ring-brand/20',
            name.length === 0 ? 'border-gray-300' : 'border-brand',
          ].join(' ')}
          maxLength={30}
          autoComplete="off"
        />
        <div className="mt-1 flex justify-end">
          <span
            className={[
              'text-xs',
              name.length >= 28 ? 'text-red-400' : 'text-gray-400',
            ].join(' ')}
          >
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
          rows={3}
          className={[
            'w-full rounded-xl border px-4 py-3 text-sm text-gray-900 outline-none resize-none',
            'transition-all duration-150 placeholder:text-gray-400',
            'focus:border-brand focus:ring-2 focus:ring-brand/20',
            description.length === 0 ? 'border-gray-300' : 'border-brand',
          ].join(' ')}
          maxLength={100}
        />
        <div className="mt-1 flex justify-end">
          <span
            className={[
              'text-xs',
              description.length >= 95 ? 'text-red-400' : 'text-gray-400',
            ].join(' ')}
          >
            {description.length}/100
          </span>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Radio dot indicator
// ────────────────────────────────────────────────────────────
function RadioDot({ selected }: { selected: boolean }) {
  return (
    <div
      className={[
        'flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all',
        selected ? 'border-brand' : 'border-gray-300',
      ].join(' ')}
    >
      {selected && <div className="w-2.5 h-2.5 rounded-full bg-brand" />}
    </div>
  );
}

// ────────────────────────────────────────────────────────────
// Progress Bar
// ────────────────────────────────────────────────────────────
interface ProgressBarProps {
  current: number;
  total: number;
}

function ProgressBar({ current, total }: ProgressBarProps) {
  const pct = Math.round((current / total) * 100);
  return (
    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
      <div
        className="h-full bg-brand rounded-full transition-all duration-300 ease-out"
        style={{ width: `${pct}%` }}
      />
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
  const stepMeta: Record<
    number,
    { title: string; subtitle: string }
  > = {
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
    <div className="min-h-screen bg-gradient-to-br from-brand-50 to-brand-100 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Header */}
          <div className="mb-6">
            {/* Logo / back link */}
            <div className="flex items-center justify-between mb-5">
              <button
                type="button"
                onClick={() => router.push('/workspace')}
                className="flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                ワークスペース
              </button>
              <span className="text-xs text-gray-400 font-medium">
                ステップ {stepIndex} / {totalSteps}
              </span>
            </div>

            {/* Progress bar */}
            <ProgressBar current={stepIndex} total={totalSteps} />

            {/* Step dots */}
            <div className="flex items-center justify-center gap-1.5 mt-3">
              {visibleSteps.map((s, idx) => (
                <div
                  key={s}
                  className={[
                    'rounded-full transition-all duration-300',
                    idx + 1 < stepIndex
                      ? 'w-2 h-2 bg-brand'
                      : idx + 1 === stepIndex
                      ? 'w-6 h-2 bg-brand'
                      : 'w-2 h-2 bg-gray-200',
                  ].join(' ')}
                />
              ))}
            </div>
          </div>

          {/* Title */}
          <div className="mb-6">
            <h1 className="text-xl font-bold text-gray-900">{title}</h1>
            <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
          </div>

          {/* Step content — animate with key-based re-render */}
          <div
            key={currentStep}
            className="animate-fade-in"
            style={{
              animation: 'fadeSlideIn 0.2s ease-out',
            }}
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
            <button
              type="button"
              onClick={handleBack}
              disabled={isFirstStep}
              className={[
                'flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium transition-all',
                isFirstStep
                  ? 'text-gray-300 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100',
              ].join(' ')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              戻る
            </button>

            <button
              type="button"
              onClick={handleNext}
              disabled={!canProceed() || isCreating}
              className={[
                'flex items-center gap-1.5 px-6 py-2.5 rounded-xl text-sm font-semibold transition-all',
                canProceed() && !isCreating
                  ? 'bg-brand text-white hover:bg-brand-600 shadow-sm hover:shadow-md active:scale-95'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed',
              ].join(' ')}
            >
              {isCreating ? (
                <>
                  <svg
                    className="w-4 h-4 animate-spin"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                    />
                  </svg>
                  作成中...
                </>
              ) : isLastStep ? (
                <>
                  アプリを作成
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </>
              ) : (
                <>
                  次へ
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Footer hint */}
        <p className="mt-4 text-center text-xs text-brand-700/60">
          いつでも設定は後から変更できます
        </p>
      </div>

      {/* Keyframe animation */}
      <style jsx global>{`
        @keyframes fadeSlideIn {
          from {
            opacity: 0;
            transform: translateY(6px);
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
