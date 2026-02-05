'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, ChevronRight, Package, Camera, Share2, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

type ChecklistItem = {
  id: string;
  label: string;
  description: string;
  icon: React.ElementType;
  completed: boolean;
  action?: () => void;
  actionLabel?: string;
};

type GettingStartedChecklistProps = {
  bagCount: number;
  itemCount: number;
  hasProfilePhoto: boolean;
  hasShared: boolean;
  onCreateBag?: () => void;
  onAddItems?: () => void;
  onSetPhoto?: () => void;
  onShare?: () => void;
  className?: string;
};

const STORAGE_KEY = 'teed_checklist_dismissed';

export function GettingStartedChecklist({
  bagCount,
  itemCount,
  hasProfilePhoto,
  hasShared,
  onCreateBag,
  onAddItems,
  onSetPhoto,
  onShare,
  className,
}: GettingStartedChecklistProps) {
  const [isDismissed, setIsDismissed] = useState(true); // Start hidden to prevent flash
  const [isCollapsed, setIsCollapsed] = useState(false);

  // Check localStorage on mount
  useEffect(() => {
    const dismissed = localStorage.getItem(STORAGE_KEY);
    setIsDismissed(dismissed === 'true');
  }, []);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem(STORAGE_KEY, 'true');
  };

  // Define checklist items based on progress
  const items: ChecklistItem[] = [
    {
      id: 'create-bag',
      label: 'Create your first bag',
      description: 'Start a collection of your favorite gear',
      icon: Package,
      completed: bagCount > 0,
      action: onCreateBag,
      actionLabel: 'Create bag',
    },
    {
      id: 'add-items',
      label: 'Add 3 items',
      description: `${Math.min(itemCount, 3)}/3 items added`,
      icon: Sparkles,
      completed: itemCount >= 3,
      action: onAddItems,
      actionLabel: 'Add items',
    },
    {
      id: 'set-photo',
      label: 'Set a profile photo',
      description: 'Help others recognize you',
      icon: Camera,
      completed: hasProfilePhoto,
      action: onSetPhoto,
      actionLabel: 'Upload photo',
    },
    {
      id: 'share',
      label: 'Share your bag',
      description: 'Show off your collection',
      icon: Share2,
      completed: hasShared,
      action: onShare,
      actionLabel: 'Share',
    },
  ];

  const completedCount = items.filter((item) => item.completed).length;
  const progress = (completedCount / items.length) * 100;
  const allComplete = completedCount === items.length;

  // Auto-dismiss when all complete (after a delay for celebration)
  useEffect(() => {
    if (allComplete && !isDismissed) {
      const timer = setTimeout(() => {
        handleDismiss();
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [allComplete, isDismissed]);

  // Don't render if dismissed or all complete
  if (isDismissed || allComplete) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={cn(
        'bg-gradient-to-br from-[var(--teed-green-2)] to-[var(--sky-2)] border border-[var(--teed-green-6)] rounded-xl overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between">
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="flex items-center gap-2 text-left flex-1"
        >
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[var(--teed-green-9)]" />
            <span className="font-semibold text-[var(--text-primary)]">
              Getting Started
            </span>
          </div>
          <span className="text-sm text-[var(--text-secondary)]">
            {completedCount}/{items.length} complete
          </span>
          <ChevronRight
            className={cn(
              'w-4 h-4 text-[var(--text-tertiary)] transition-transform',
              !isCollapsed && 'rotate-90'
            )}
          />
        </button>
        <button
          onClick={handleDismiss}
          className="p-1 hover:bg-black/5 rounded-lg transition-colors"
          title="Dismiss checklist"
        >
          <X className="w-4 h-4 text-[var(--text-tertiary)]" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="px-4 pb-2">
        <div className="h-1.5 bg-white/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="h-full bg-gradient-to-r from-[var(--teed-green-8)] to-[var(--teed-green-9)] rounded-full"
          />
        </div>
      </div>

      {/* Checklist items */}
      <AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-2">
              {items.map((item, index) => {
                const Icon = item.icon;
                const isNextUp = !item.completed && items.slice(0, index).every((i) => i.completed);

                return (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={cn(
                      'flex items-center gap-3 p-2 rounded-lg transition-colors',
                      item.completed
                        ? 'bg-[var(--teed-green-3)]/50'
                        : isNextUp
                        ? 'bg-white/80 ring-2 ring-[var(--teed-green-6)]'
                        : 'bg-white/50'
                    )}
                  >
                    {/* Checkbox */}
                    <div
                      className={cn(
                        'w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-colors',
                        item.completed
                          ? 'bg-[var(--teed-green-9)] text-white'
                          : 'bg-white border-2 border-gray-300'
                      )}
                    >
                      {item.completed && <Check className="w-4 h-4" />}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div
                        className={cn(
                          'font-medium text-sm',
                          item.completed
                            ? 'text-[var(--text-tertiary)] line-through'
                            : 'text-[var(--text-primary)]'
                        )}
                      >
                        {item.label}
                      </div>
                      <div className="text-xs text-[var(--text-tertiary)]">
                        {item.description}
                      </div>
                    </div>

                    {/* Action button */}
                    {!item.completed && item.action && (
                      <button
                        onClick={item.action}
                        className={cn(
                          'px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex-shrink-0',
                          isNextUp
                            ? 'bg-[var(--teed-green-9)] text-white hover:bg-[var(--teed-green-10)]'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        )}
                      >
                        {item.actionLabel}
                      </button>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

export default GettingStartedChecklist;
