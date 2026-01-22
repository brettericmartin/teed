'use client';

import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  X,
  Package,
  LayoutGrid,
  Link2,
  Share2,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type AddMenuOption = 'item' | 'block' | 'link' | 'social';

interface AddOption {
  id: AddMenuOption;
  icon: React.ReactNode;
  label: string;
  description: string;
  color: string;
  bgColor: string;
}

const ADD_OPTIONS: AddOption[] = [
  {
    id: 'item',
    icon: <Package className="w-6 h-6" />,
    label: 'Add Item',
    description: 'Add a product to one of your bags',
    color: 'text-[var(--sky-10)]',
    bgColor: 'bg-[var(--sky-3)] hover:bg-[var(--sky-4)]',
  },
  {
    id: 'block',
    icon: <LayoutGrid className="w-6 h-6" />,
    label: 'Add Block',
    description: 'Add a block to your profile',
    color: 'text-[var(--teed-green-10)]',
    bgColor: 'bg-[var(--teed-green-3)] hover:bg-[var(--teed-green-4)]',
  },
  {
    id: 'link',
    icon: <Link2 className="w-6 h-6" />,
    label: 'Add Link',
    description: 'Add a product link, video, or embed',
    color: 'text-[var(--copper-10)]',
    bgColor: 'bg-[var(--copper-3)] hover:bg-[var(--copper-4)]',
  },
  {
    id: 'social',
    icon: <Share2 className="w-6 h-6" />,
    label: 'Add Social',
    description: 'Connect your social accounts',
    color: 'text-[var(--sand-11)]',
    bgColor: 'bg-[var(--sand-3)] hover:bg-[var(--sand-4)]',
  },
];

interface UniversalAddMenuProps {
  /** Whether the user has any bags yet */
  hasBags: boolean;
  /** Whether this is on the profile/dashboard page (true) or bag page (false) */
  isProfileView: boolean;
  /** Callback when user selects Add Item */
  onAddItem: () => void;
  /** Callback when user selects Add Block (profile only) */
  onAddBlock?: () => void;
  /** Callback when user selects Add Link */
  onAddLink: () => void;
  /** Callback when user selects Add Social */
  onAddSocial: () => void;
  /** Custom class name for positioning */
  className?: string;
  /** Show as a fixed FAB (default) or inline button */
  variant?: 'fab' | 'inline' | 'header';
}

export function UniversalAddMenu({
  hasBags,
  isProfileView,
  onAddItem,
  onAddBlock,
  onAddLink,
  onAddSocial,
  className,
  variant = 'fab',
}: UniversalAddMenuProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleOptionClick = useCallback((option: AddMenuOption) => {
    setIsOpen(false);

    switch (option) {
      case 'item':
        onAddItem();
        break;
      case 'block':
        onAddBlock?.();
        break;
      case 'link':
        onAddLink();
        break;
      case 'social':
        onAddSocial();
        break;
    }
  }, [onAddItem, onAddBlock, onAddLink, onAddSocial]);

  // Filter options based on context
  const availableOptions = ADD_OPTIONS.filter(opt => {
    // Block option only available on profile view
    if (opt.id === 'block' && !isProfileView) return false;
    return true;
  });

  // FAB button style (floating action button)
  const fabButton = (
    <motion.button
      onClick={() => setIsOpen(true)}
      className={cn(
        'group relative flex items-center justify-center',
        'w-16 h-16 rounded-full shadow-xl',
        'bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)]',
        'text-white transition-all duration-200',
        'focus:outline-none focus:ring-4 focus:ring-[var(--teed-green-4)]',
        !isOpen && 'hover:scale-110 hover:shadow-2xl'
      )}
      whileTap={{ scale: 0.95 }}
    >
      <Plus className="w-8 h-8" strokeWidth={2.5} />

      {/* Pulse ring animation for new users */}
      {!hasBags && (
        <>
          <span className="absolute inset-0 rounded-full bg-[var(--teed-green-9)] animate-ping opacity-30" />
          <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
            <Sparkles className="w-4 h-4 text-[var(--copper-9)] animate-pulse" />
          </span>
        </>
      )}
    </motion.button>
  );

  // Header button style (for dashboard header)
  const headerButton = (
    <button
      onClick={() => setIsOpen(true)}
      className={cn(
        'flex items-center gap-2 px-6 py-3 rounded-xl',
        'bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)]',
        'text-white font-semibold shadow-lg',
        'hover:shadow-xl hover:scale-105',
        'transition-all duration-200',
        'focus:outline-none focus:ring-4 focus:ring-[var(--teed-green-4)]'
      )}
    >
      <Plus className="w-5 h-5" strokeWidth={2.5} />
      <span>Add</span>
    </button>
  );

  // Inline button style
  const inlineButton = (
    <button
      onClick={() => setIsOpen(true)}
      className={cn(
        'flex items-center gap-2 px-4 py-2 rounded-lg',
        'bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)]',
        'text-white font-medium text-sm',
        'transition-colors duration-200'
      )}
    >
      <Plus className="w-4 h-4" />
      <span>Add</span>
    </button>
  );

  return (
    <>
      {/* Trigger Button */}
      <div className={cn(
        variant === 'fab' && 'fixed bottom-6 right-6 z-50',
        className
      )}>
        {variant === 'fab' && fabButton}
        {variant === 'header' && headerButton}
        {variant === 'inline' && inlineButton}
      </div>

      {/* Menu Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] bg-black/40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Menu Panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className={cn(
                'fixed z-[101]',
                'inset-x-4 bottom-24 sm:inset-auto',
                'sm:bottom-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2',
                'bg-[var(--surface)] rounded-2xl shadow-2xl',
                'max-w-md w-full mx-auto overflow-hidden',
                'border border-[var(--border-subtle)]'
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border-subtle)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[var(--teed-green-9)] to-[var(--sky-9)] flex items-center justify-center">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--text-primary)]">
                      What would you like to add?
                    </h2>
                    <p className="text-sm text-[var(--text-tertiary)]">
                      Choose an option to get started
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-2 rounded-lg hover:bg-[var(--surface-hover)] text-[var(--text-tertiary)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Options */}
              <div className="p-4 space-y-2">
                {availableOptions.map((option, index) => (
                  <motion.button
                    key={option.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleOptionClick(option.id)}
                    className={cn(
                      'w-full flex items-center gap-4 p-4 rounded-xl',
                      'transition-all duration-200 group',
                      'hover:scale-[1.02] active:scale-[0.98]',
                      option.bgColor
                    )}
                  >
                    {/* Icon */}
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      'bg-white/60 dark:bg-black/10',
                      option.color
                    )}>
                      {option.icon}
                    </div>

                    {/* Text */}
                    <div className="flex-1 text-left">
                      <div className={cn('font-semibold', option.color)}>
                        {option.label}
                      </div>
                      <div className="text-sm text-[var(--text-secondary)]">
                        {option.description}
                      </div>
                    </div>

                    {/* Arrow */}
                    <ChevronRight className={cn(
                      'w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity',
                      option.color
                    )} />
                  </motion.button>
                ))}
              </div>

              {/* Hint for new users */}
              {!hasBags && (
                <div className="px-4 pb-4">
                  <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-[var(--teed-green-2)] border border-[var(--teed-green-4)]">
                    <Sparkles className="w-5 h-5 text-[var(--teed-green-9)] flex-shrink-0" />
                    <p className="text-sm text-[var(--teed-green-11)]">
                      <span className="font-medium">Tip:</span> Start by adding an item or link — we'll create a bag for you automatically!
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default UniversalAddMenu;
