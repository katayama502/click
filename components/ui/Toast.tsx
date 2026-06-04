'use client';

import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X, type LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const toastConfig: Record<
  ToastType,
  { icon: LucideIcon; classes: string }
> = {
  success: {
    icon: CheckCircle,
    classes: 'bg-white border-l-4 border-green-500',
  },
  error: {
    icon: XCircle,
    classes: 'bg-white border-l-4 border-red-500',
  },
  info: {
    icon: Info,
    classes: 'bg-white border-l-4 border-blue-500',
  },
  warning: {
    icon: AlertTriangle,
    classes: 'bg-white border-l-4 border-yellow-500',
  },
};

const iconColor: Record<ToastType, string> = {
  success: 'text-green-500',
  error: 'text-red-500',
  info: 'text-blue-500',
  warning: 'text-yellow-500',
};

const MAX_TOASTS = 3;
const DURATION = 3000;

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback(
    (message: string, type: ToastType = 'info') => {
      const id = `toast-${++counterRef.current}`;
      setToasts((prev) => {
        const next = [...prev, { id, message, type }];
        // Keep only last MAX_TOASTS
        return next.slice(-MAX_TOASTS);
      });
      setTimeout(() => removeToast(id), DURATION);
    },
    [removeToast]
  );

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div
        aria-live="polite"
        aria-atomic="false"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
      >
        {toasts.map((item) => {
          const { icon: Icon, classes } = toastConfig[item.type];
          return (
            <div
              key={item.id}
              role="alert"
              className={cn(
                'pointer-events-auto flex items-start gap-3 min-w-[280px] max-w-sm px-4 py-3 rounded-xl shadow-lg',
                'animate-in slide-in-from-right-4 fade-in duration-200',
                classes
              )}
            >
              <Icon size={18} className={cn('mt-0.5 shrink-0', iconColor[item.type])} />
              <p className="flex-1 text-sm text-gray-800 leading-snug">{item.message}</p>
              <button
                onClick={() => removeToast(item.id)}
                aria-label="Dismiss notification"
                className="shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return ctx;
}
