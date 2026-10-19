'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, X } from 'lucide-react';
import { analytics } from '@/lib/analytics';

const STORAGE_KEY = 'teed-save-tooltip-dismissed';

interface SaveTooltipProps {
  onSignUpClick: () => void;
  isMobile: boolean;
  bagId: string;
  bagCode: string;
  /**
   * Controlled visibility. When provided the tip never auto-opens; the parent
   * shows it on hover/focus of the bookmark. When omitted, falls back to the
   * legacy 4s auto-open.
   */
  open?: boolean;
}

function wasDismissed() {
  try {
    return typeof window !== 'undefined' && !!localStorage.getItem(STORAGE_KEY);
  } catch {
    return false;
  }
}

export function SaveTooltip({ onSignUpClick, isMobile, bagId, bagCode, open }: SaveTooltipProps) {
  const [autoVisible, setAutoVisible] = useState(false);
  const [dismissed, setDismissed] = useState(wasDismissed);
  const controlled = open !== undefined;
  const isVisible = controlled ? !!open && !dismissed : autoVisible;

  useEffect(() => {
    if (controlled || dismissed) return;

    const timer = setTimeout(() => {
      setAutoVisible(true);
      analytics.saveTooltipShown(bagId, bagCode);
    }, 4000);

    return () => clearTimeout(timer);
  }, [bagId, bagCode, controlled, dismissed]);

  useEffect(() => {
    if (controlled && isVisible) analytics.saveTooltipShown(bagId, bagCode);
  }, [controlled, isVisible, bagId, bagCode]);

  const handleDismiss = () => {
    setAutoVisible(false);
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, 'true');
    analytics.saveTooltipDismissed(bagId, bagCode);
  };

  const handleClick = () => {
    setAutoVisible(false);
    setDismissed(true);
    localStorage.setItem(STORAGE_KEY, 'true');
    analytics.saveTooltipClicked(bagId, bagCode);
    onSignUpClick();
  };

  if (isMobile) {
    // Mobile: fixed above StickyActionBar
    return (
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="fixed bottom-20 left-4 right-4 z-40"
          >
            <div className="bg-[var(--surface)] rounded-xl shadow-[var(--shadow-5)] border border-[var(--teed-green-6)] p-4">
              {/* Downward-pointing arrow */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[var(--surface)] border-b border-r border-[var(--teed-green-6)] rotate-45" />

              <div className="flex items-start gap-3 relative">
                <div className="w-10 h-10 rounded-full bg-[var(--teed-green-2)] flex items-center justify-center flex-shrink-0">
                  <Bookmark className="w-5 h-5 text-[var(--teed-green-9)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-sm text-[var(--text-primary)]">Like this bag?</h4>
                  <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                    Sign up to save it and get notified when it&apos;s updated.
                  </p>
                  <button
                    onClick={handleClick}
                    className="mt-2 px-4 py-1.5 bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Sign up to save
                  </button>
                </div>
                <button
                  onClick={handleDismiss}
                  className="p-1 hover:bg-[var(--surface-hover)] rounded-md transition-colors flex-shrink-0"
                  aria-label="Dismiss"
                >
                  <X className="w-4 h-4 text-[var(--text-secondary)]" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // Desktop: absolute, below the save button with upward-pointing arrow
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
          className="absolute top-full left-1/2 -translate-x-1/2 mt-2 z-40 w-64"
        >
          {/* Upward-pointing arrow */}
          <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[var(--surface)] border-t border-l border-[var(--teed-green-6)] rotate-45" />

          <div className="bg-[var(--surface)] rounded-xl shadow-[var(--shadow-5)] border border-[var(--teed-green-6)] p-4 relative">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-full bg-[var(--teed-green-2)] flex items-center justify-center flex-shrink-0">
                <Bookmark className="w-4 h-4 text-[var(--teed-green-9)]" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm text-[var(--text-primary)]">Like this bag?</h4>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Sign up to save it and get notified when it&apos;s updated.
                </p>
                <button
                  onClick={handleClick}
                  className="mt-2 px-4 py-1.5 bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Sign up to save
                </button>
              </div>
              <button
                onClick={handleDismiss}
                className="p-1 hover:bg-[var(--surface-hover)] rounded-md transition-colors flex-shrink-0 -mt-1 -mr-1"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4 text-[var(--text-secondary)]" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
