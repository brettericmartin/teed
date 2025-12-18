'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, CheckCircle, AlertCircle, Info, Sparkles } from 'lucide-react';
import { toastVariants } from '@/lib/animations';

type ToastType = 'success' | 'error' | 'info' | 'ai';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
  duration?: number;
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
  showAI: (message: string, duration?: number) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastItem({ toast, onRemove }: { toast: Toast; onRemove: () => void }) {
  const icons = {
    success: <CheckCircle className="w-5 h-5" />,
    error: <AlertCircle className="w-5 h-5" />,
    info: <Info className="w-5 h-5" />,
    ai: <Sparkles className="w-5 h-5" />,
  };

  const styles = {
    success: {
      bg: 'bg-[var(--teed-green-2)]',
      border: 'border-[var(--teed-green-6)]',
      icon: 'text-[var(--teed-green-9)]',
      text: 'text-[var(--teed-green-11)]',
    },
    error: {
      bg: 'bg-[var(--copper-2)]',
      border: 'border-[var(--copper-6)]',
      icon: 'text-[var(--copper-9)]',
      text: 'text-[var(--copper-11)]',
    },
    info: {
      bg: 'bg-[var(--sand-2)]',
      border: 'border-[var(--sand-6)]',
      icon: 'text-[var(--sand-9)]',
      text: 'text-[var(--sand-11)]',
    },
    ai: {
      bg: 'bg-[var(--sky-2)]',
      border: 'border-[var(--sky-6)]',
      icon: 'text-[var(--sky-9)]',
      text: 'text-[var(--sky-11)]',
    },
  };

  const style = styles[toast.type];

  return (
    <motion.div
      layout
      variants={toastVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className={`
        ${style.bg} ${style.border} border
        rounded-xl px-4 py-3 shadow-lg
        flex items-center gap-3
        backdrop-blur-sm
        max-w-md w-full
      `}
      role="alert"
    >
      <motion.span
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 15, delay: 0.1 }}
        className={style.icon}
      >
        {icons[toast.type]}
      </motion.span>
      <p className={`${style.text} text-sm font-medium flex-1`}>{toast.message}</p>
      <button
        onClick={onRemove}
        className={`${style.icon} hover:opacity-70 transition-opacity p-1`}
        aria-label="Dismiss"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (message: string, type: ToastType = 'ai', duration: number = 4000) => {
      const id = `${Date.now()}-${Math.random()}`;
      const toast: Toast = { id, message, type, duration };

      setToasts((prev) => [...prev, toast]);

      if (duration > 0) {
        setTimeout(() => removeToast(id), duration);
      }
    },
    [removeToast]
  );

  const showSuccess = useCallback(
    (message: string, duration?: number) => showToast(message, 'success', duration),
    [showToast]
  );

  const showError = useCallback(
    (message: string, duration?: number) => showToast(message, 'error', duration ?? 6000),
    [showToast]
  );

  const showInfo = useCallback(
    (message: string, duration?: number) => showToast(message, 'info', duration),
    [showToast]
  );

  const showAI = useCallback(
    (message: string, duration?: number) => showToast(message, 'ai', duration),
    [showToast]
  );

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showInfo, showAI }}>
      {children}
      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((toast) => (
            <div key={toast.id} className="pointer-events-auto">
              <ToastItem toast={toast} onRemove={() => removeToast(toast.id)} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}
