'use client';

import { useState, useEffect } from 'react';
import { X } from 'lucide-react';

interface Hint {
  id: string;
  message: string;
  emoji: string;
}

const HINTS: Hint[] = [
  { id: 'drag', emoji: '↕️', message: 'Drag the ⋮⋮ handle to reposition blocks' },
  { id: 'select', emoji: '👆', message: 'Click any block to select it and see options' },
  { id: 'toolbar', emoji: '🔧', message: 'Use the toolbar to hide, duplicate, or delete' },
  { id: 'resize', emoji: '↔️', message: 'Drag block edges to resize' },
  { id: 'panel', emoji: '⚙️', message: 'Edit content and settings in the side panel' },
];

const HINTS_STORAGE_KEY = 'teed-edit-hints-dismissed';

interface EditModeHintsProps {
  isEditMode: boolean;
}

export default function EditModeHints({ isEditMode }: EditModeHintsProps) {
  const [currentHintIndex, setCurrentHintIndex] = useState(0);
  const [dismissed, setDismissed] = useState(false);
  const [allDismissed, setAllDismissed] = useState(true); // Default true for SSR
  const [mounted, setMounted] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem(HINTS_STORAGE_KEY);
    setAllDismissed(stored === 'true');
  }, []);

  // Reset when entering edit mode
  useEffect(() => {
    if (isEditMode && !allDismissed && mounted) {
      setCurrentHintIndex(0);
      setDismissed(false);
    }
  }, [isEditMode, allDismissed, mounted]);

  const handleNext = () => {
    if (currentHintIndex < HINTS.length - 1) {
      setCurrentHintIndex(prev => prev + 1);
    } else {
      setDismissed(true);
    }
  };

  const handleDismissAll = () => {
    localStorage.setItem(HINTS_STORAGE_KEY, 'true');
    setAllDismissed(true);
  };

  // Don't render during SSR or if not in edit mode
  if (!mounted || !isEditMode || dismissed || allDismissed) return null;

  const hint = HINTS[currentHintIndex];

  return (
    <div
      className="fixed bottom-32 left-1/2 -translate-x-1/2 z-[60]
                 bg-[var(--surface)] border border-[var(--border-subtle)]
                 rounded-xl shadow-xl px-4 py-3 max-w-sm mx-4
                 animate-in fade-in slide-in-from-bottom-4 duration-300
                 sm:bottom-28 lg:bottom-24"
    >
      <div className="flex items-start gap-3">
        <span className="text-2xl flex-shrink-0">{hint.emoji}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[var(--text-primary)]">{hint.message}</p>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={handleNext}
              className="text-sm font-medium text-[var(--teed-green-9)] hover:underline"
            >
              {currentHintIndex < HINTS.length - 1 ? 'Next tip →' : 'Got it!'}
            </button>
            <button
              onClick={handleDismissAll}
              className="text-xs text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
            >
              Don't show tips
            </button>
          </div>
        </div>
        <button
          onClick={() => setDismissed(true)}
          className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)] flex-shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress dots */}
      <div className="flex justify-center gap-1.5 mt-3">
        {HINTS.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-colors ${
              i === currentHintIndex
                ? 'bg-[var(--teed-green-9)]'
                : i < currentHintIndex
                  ? 'bg-[var(--teed-green-5)]'
                  : 'bg-[var(--border-subtle)]'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// Hook to reset hints (for settings page)
export function useEditHints() {
  const resetHints = () => {
    localStorage.removeItem(HINTS_STORAGE_KEY);
    // Force page reload to show hints again
    window.location.reload();
  };

  const dismissHints = () => {
    localStorage.setItem(HINTS_STORAGE_KEY, 'true');
  };

  const areHintsDismissed = () => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(HINTS_STORAGE_KEY) === 'true';
  };

  return { resetHints, dismissHints, areHintsDismissed };
}
