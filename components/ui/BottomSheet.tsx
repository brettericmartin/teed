'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence, PanInfo, useMotionValue, useTransform, useAnimation } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  /** Show as modal on desktop, bottom sheet on mobile */
  adaptiveMode?: boolean;
  /** Max height as percentage of viewport (default: 90) */
  maxHeight?: number;
  /** Show close button */
  showCloseButton?: boolean;
  /** Custom class for the sheet content */
  className?: string;
}

/**
 * BottomSheet component that displays as a swipe-to-dismiss bottom sheet on mobile
 * and a centered modal on desktop.
 *
 * Features:
 * - Swipe down to dismiss (mobile)
 * - Drag handle indicator
 * - Smooth spring animations
 * - Backdrop click to close
 * - Keyboard escape to close
 */
export function BottomSheet({
  isOpen,
  onClose,
  children,
  title,
  adaptiveMode = true,
  maxHeight = 90,
  showCloseButton = true,
  className,
}: BottomSheetProps) {
  const sheetRef = useRef<HTMLDivElement>(null);
  const y = useMotionValue(0);
  const controls = useAnimation();

  // Transform y position to backdrop opacity
  const backdropOpacity = useTransform(y, [0, 300], [1, 0]);

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Handle drag end - close if dragged down enough
  const handleDragEnd = (_: any, info: PanInfo) => {
    const threshold = 100; // pixels
    const velocity = info.velocity.y;

    if (info.offset.y > threshold || velocity > 500) {
      onClose();
    } else {
      // Snap back to position
      controls.start({ y: 0 });
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ opacity: backdropOpacity }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
          />

          {/* Sheet Container */}
          <motion.div
            ref={sheetRef}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{ y }}
            drag="y"
            dragConstraints={{ top: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={handleDragEnd}
            className={cn(
              'fixed z-50 touch-none',
              // Mobile: Bottom sheet
              'inset-x-0 bottom-0',
              // Desktop: Center modal (when adaptiveMode is true)
              adaptiveMode && 'sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg'
            )}
          >
            <div
              className={cn(
                'bg-[var(--surface)] overflow-hidden flex flex-col',
                // Mobile: Rounded top corners
                'rounded-t-2xl',
                // Desktop: Fully rounded
                adaptiveMode && 'sm:rounded-2xl',
                className
              )}
              style={{
                maxHeight: `${maxHeight}vh`,
              }}
            >
              {/* Drag Handle (mobile only) */}
              <div className={cn('flex-shrink-0', adaptiveMode && 'sm:hidden')}>
                <div className="flex justify-center pt-3 pb-2">
                  <div className="w-10 h-1 bg-[var(--border)] rounded-full" />
                </div>
              </div>

              {/* Header */}
              {(title || showCloseButton) && (
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-subtle)] flex-shrink-0">
                  {title ? (
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">{title}</h2>
                  ) : (
                    <div />
                  )}
                  {showCloseButton && (
                    <button
                      onClick={onClose}
                      className="p-2 -mr-2 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)] transition-colors"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  )}
                </div>
              )}

              {/* Content */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                {children}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

export default BottomSheet;
