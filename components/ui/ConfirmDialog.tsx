'use client';

import { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AlertTriangle, Trash2, X, Info } from 'lucide-react';
import { Button } from './Button';

type ConfirmVariant = 'destructive' | 'warning' | 'info';

type ConfirmOptions = {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  icon?: ReactNode;
};

type ConfirmContextType = {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
};

const ConfirmContext = createContext<ConfirmContextType | null>(null);

export function useConfirm() {
  const context = useContext(ConfirmContext);
  if (!context) {
    throw new Error('useConfirm must be used within a ConfirmProvider');
  }
  return context.confirm;
}

type ConfirmState = ConfirmOptions & {
  resolve: (value: boolean) => void;
};

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState | null>(null);

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setState({ ...options, resolve });
    });
  }, []);

  const handleConfirm = () => {
    state?.resolve(true);
    setState(null);
  };

  const handleCancel = () => {
    state?.resolve(false);
    setState(null);
  };

  const getVariantStyles = (variant: ConfirmVariant = 'destructive') => {
    switch (variant) {
      case 'destructive':
        return {
          iconBg: 'bg-[var(--copper-2)]',
          iconColor: 'text-[var(--copper-9)]',
          defaultIcon: <Trash2 className="w-6 h-6" />,
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-50',
          iconColor: 'text-amber-600',
          defaultIcon: <AlertTriangle className="w-6 h-6" />,
        };
      case 'info':
        return {
          iconBg: 'bg-[var(--sky-2)]',
          iconColor: 'text-[var(--sky-9)]',
          defaultIcon: <Info className="w-6 h-6" />,
        };
    }
  };

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}

      {/* Dialog Overlay */}
      {state && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={handleCancel}
          />

          {/* Dialog */}
          <div className="relative bg-[var(--surface)] rounded-xl shadow-2xl max-w-md w-full mx-4 overflow-hidden animate-scale-in">
            {/* Close button */}
            <button
              onClick={handleCancel}
              className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-[var(--surface-hover)] transition-colors"
            >
              <X className="w-4 h-4 text-[var(--text-tertiary)]" />
            </button>

            {/* Content */}
            <div className="p-6">
              {/* Icon */}
              <div className="flex justify-center mb-4">
                <div
                  className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    getVariantStyles(state.variant).iconBg
                  } ${getVariantStyles(state.variant).iconColor}`}
                >
                  {state.icon || getVariantStyles(state.variant).defaultIcon}
                </div>
              </div>

              {/* Title */}
              <h2 className="text-lg font-semibold text-[var(--text-primary)] text-center mb-2">
                {state.title}
              </h2>

              {/* Message */}
              <p className="text-sm text-[var(--text-secondary)] text-center mb-6">
                {state.message}
              </p>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  onClick={handleCancel}
                  variant="secondary"
                  className="flex-1"
                >
                  {state.cancelText || 'Cancel'}
                </Button>
                <Button
                  onClick={handleConfirm}
                  variant={state.variant === 'destructive' ? 'destructive' : 'create'}
                  className="flex-1"
                >
                  {state.confirmText || 'Confirm'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
}
