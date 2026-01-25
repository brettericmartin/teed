'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Package,
  LayoutGrid,
  Link2,
  Share2,
  X,
  ChevronDown,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export type AddAction = 'bag' | 'block' | 'link' | 'social';

interface AddOption {
  id: AddAction;
  icon: React.ReactNode;
  label: string;
  shortLabel: string;
}

const ADD_OPTIONS: AddOption[] = [
  {
    id: 'bag',
    icon: <Package className="w-5 h-5" />,
    label: 'New Bag',
    shortLabel: 'Bag',
  },
  {
    id: 'block',
    icon: <LayoutGrid className="w-5 h-5" />,
    label: 'Add Panel',
    shortLabel: 'Panel',
  },
  {
    id: 'link',
    icon: <Link2 className="w-5 h-5" />,
    label: 'Add Link',
    shortLabel: 'Link',
  },
  {
    id: 'social',
    icon: <Share2 className="w-5 h-5" />,
    label: 'Social Links',
    shortLabel: 'Social',
  },
];

interface ProminentAddBarProps {
  onAddBag: () => void;
  onAddBlock: () => void;
  onAddLink: () => void;
  onAddSocial: () => void;
  className?: string;
}

/**
 * ProminentAddBar - A highly visible add bar for profile owners
 *
 * This component provides an unmissable way to add content to the profile.
 * It shows as a large button that expands to reveal options.
 */
export function ProminentAddBar({
  onAddBag,
  onAddBlock,
  onAddLink,
  onAddSocial,
  className,
}: ProminentAddBarProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAction = (action: AddAction) => {
    setIsExpanded(false);
    switch (action) {
      case 'bag':
        onAddBag();
        break;
      case 'block':
        onAddBlock();
        break;
      case 'link':
        onAddLink();
        break;
      case 'social':
        onAddSocial();
        break;
    }
  };

  return (
    <div className={cn('w-full', className)}>
      {/* Main Add Bar */}
      <div className="relative">
        {/* Collapsed State - Big obvious button */}
        <AnimatePresence mode="wait">
          {!isExpanded ? (
            <motion.button
              key="collapsed"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              onClick={() => setIsExpanded(true)}
              className={cn(
                'w-full flex items-center justify-center gap-3',
                'py-4 px-6 rounded-2xl',
                'bg-gradient-to-r from-[var(--teed-green-9)] to-[var(--teed-green-10)]',
                'hover:from-[var(--teed-green-10)] hover:to-[var(--evergreen-9)]',
                'text-white font-semibold text-lg',
                'shadow-lg hover:shadow-xl',
                'transition-all duration-200',
                'border-2 border-[var(--teed-green-7)]'
              )}
            >
              <Plus className="w-6 h-6" strokeWidth={2.5} />
              <span>Add to Your Profile</span>
              <ChevronDown className="w-5 h-5 ml-1" />
            </motion.button>
          ) : (
            <motion.div
              key="expanded"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={cn(
                'rounded-2xl overflow-hidden',
                'bg-[var(--surface)] border-2 border-[var(--teed-green-7)]',
                'shadow-xl'
              )}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-3 bg-gradient-to-r from-[var(--teed-green-9)] to-[var(--teed-green-10)]">
                <div className="flex items-center gap-2 text-white">
                  <Plus className="w-5 h-5" />
                  <span className="font-semibold">What would you like to add?</span>
                </div>
                <button
                  onClick={() => setIsExpanded(false)}
                  className="p-1.5 rounded-lg hover:bg-white/20 text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Options Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3">
                {ADD_OPTIONS.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => handleAction(option.id)}
                    className={cn(
                      'flex flex-col items-center gap-2 p-4 rounded-xl',
                      'bg-[var(--surface-elevated)] hover:bg-[var(--teed-green-2)]',
                      'border border-[var(--border-subtle)] hover:border-[var(--teed-green-6)]',
                      'transition-all duration-150',
                      'group'
                    )}
                  >
                    <div className={cn(
                      'w-12 h-12 rounded-xl flex items-center justify-center',
                      'bg-[var(--teed-green-3)] text-[var(--teed-green-10)]',
                      'group-hover:bg-[var(--teed-green-4)] group-hover:scale-110',
                      'transition-all duration-150'
                    )}>
                      {option.icon}
                    </div>
                    <span className="font-medium text-sm text-[var(--text-primary)]">
                      {option.label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

export default ProminentAddBar;
