'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, GitFork, Bookmark } from 'lucide-react';
import { MagneticButton } from './MagneticButton';
import { cn } from '@/lib/utils';
import { slideUp } from '@/lib/animations';

interface StickyActionBarProps {
  bagName: string;
  itemCount: number;
  creatorHandle: string;
  onClone: () => void;
  onShare: () => void;
  onSave?: () => void;
  isSaved?: boolean;
  isOwner?: boolean;
  /** Scroll threshold to show the bar (in pixels). Default: 400 */
  threshold?: number;
  className?: string;
}

export function StickyActionBar({
  bagName,
  itemCount,
  creatorHandle,
  onClone,
  onShare,
  onSave,
  isSaved = false,
  isOwner = false,
  threshold = 400,
  className
}: StickyActionBarProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsVisible(window.scrollY > threshold);
    };

    // Check initial scroll position
    handleScroll();

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [threshold]);

  // Don't show for owners - they have the edit bar
  if (isOwner) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          variants={slideUp}
          initial="initial"
          animate="animate"
          exit="exit"
          className={cn(
            'fixed bottom-0 left-0 right-0 z-50',
            'bg-[var(--surface)]/95 backdrop-blur-lg',
            'border-t border-[var(--border-subtle)]',
            'safe-area-inset-bottom',
            className
          )}
        >
          <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
            {/* Bag Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate text-[var(--text-primary)]">
                {bagName}
              </h3>
              <p className="text-xs text-[var(--text-secondary)]">
                {itemCount} {itemCount === 1 ? 'item' : 'items'} &middot; by @{creatorHandle}
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Save Button (if handler provided) */}
              {onSave && (
                <button
                  onClick={onSave}
                  className={cn(
                    'p-2.5 rounded-lg transition-colors',
                    'border border-[var(--border-subtle)]',
                    isSaved
                      ? 'bg-[var(--teed-green-2)] border-[var(--teed-green-6)] text-[var(--teed-green-10)]'
                      : 'hover:bg-[var(--surface-hover)]'
                  )}
                  aria-label={isSaved ? 'Saved' : 'Save bag'}
                >
                  <Bookmark className={cn('w-5 h-5', isSaved && 'fill-current')} />
                </button>
              )}

              {/* Share Button */}
              <button
                onClick={onShare}
                className="p-2.5 border border-[var(--border-subtle)] rounded-lg hover:bg-[var(--surface-hover)] transition-colors lg:px-4 lg:flex lg:items-center lg:gap-2"
                aria-label="Share bag"
              >
                <Share2 className="w-5 h-5" />
                <span className="hidden lg:inline text-sm font-medium">Share</span>
              </button>

              {/* Clone Button - Primary */}
              <MagneticButton
                onClick={onClone}
                className="px-5 py-2.5 bg-[var(--teed-green-8)] text-white rounded-lg font-semibold hover:bg-[var(--teed-green-9)] flex items-center gap-2 whitespace-nowrap shadow-md hover:shadow-lg transition-shadow"
              >
                <GitFork className="w-4 h-4" />
                <span className="hidden sm:inline">Clone</span>
                <span className="sm:hidden">Clone</span>
              </MagneticButton>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default StickyActionBar;
