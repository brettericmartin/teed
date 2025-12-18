'use client';

import { motion } from 'framer-motion';
import { ShoppingBag, Search, Camera, Plus, FolderOpen, Heart, Bookmark } from 'lucide-react';
import Link from 'next/link';
import { MagneticButton } from './MagneticButton';
import { cn } from '@/lib/utils';
import { fadeUp } from '@/lib/animations';
import type { LucideIcon } from 'lucide-react';

type EmptyStateVariant =
  | 'new-user'
  | 'no-bags'
  | 'no-items'
  | 'no-results'
  | 'no-saved'
  | 'no-clones'
  | 'search-empty';

interface EmptyStateConfig {
  icon: LucideIcon;
  title: string;
  description: string;
  cta: string;
  ctaHref?: string;
}

const configs: Record<EmptyStateVariant, EmptyStateConfig> = {
  'new-user': {
    icon: ShoppingBag,
    title: 'Your first bag awaits',
    description:
      'Start curating your collection. Add items you love, organize them your way, and share with the world.',
    cta: 'Create Your First Bag',
    ctaHref: '/bags/new'
  },
  'no-bags': {
    icon: ShoppingBag,
    title: 'No bags yet',
    description:
      'Create a bag to start organizing your gear. Golf clubs, travel essentials, desk setup — whatever you collect.',
    cta: 'Create a Bag',
    ctaHref: '/bags/new'
  },
  'no-items': {
    icon: Camera,
    title: 'This bag is empty',
    description:
      'Add items by snapping a photo with AI identification, or manually add products.',
    cta: 'Add Your First Item'
  },
  'no-results': {
    icon: Search,
    title: 'No results found',
    description: 'Try adjusting your search or browse our featured bags below.',
    cta: 'Clear Search'
  },
  'no-saved': {
    icon: Bookmark,
    title: 'Nothing saved yet',
    description:
      'Save bags you love to find them later. Tap the bookmark icon on any bag to save it here.',
    cta: 'Discover Bags',
    ctaHref: '/discover'
  },
  'no-clones': {
    icon: FolderOpen,
    title: 'No cloned bags',
    description:
      'Clone bags from other creators to make them your own. Browse featured bags to get started.',
    cta: 'Browse Featured Bags',
    ctaHref: '/discover'
  },
  'search-empty': {
    icon: Search,
    title: 'No matches',
    description: "We couldn't find anything matching your search. Try different keywords.",
    cta: 'Clear Search'
  }
};

interface EmptyStateProps {
  variant: EmptyStateVariant;
  onAction?: () => void;
  /** Override the default title */
  title?: string;
  /** Override the default description */
  description?: string;
  /** Override the default CTA text */
  ctaText?: string;
  /** Override the default CTA href */
  ctaHref?: string;
  /** Hide the CTA button */
  hideCta?: boolean;
  className?: string;
}

export function EmptyState({
  variant,
  onAction,
  title,
  description,
  ctaText,
  ctaHref,
  hideCta = false,
  className
}: EmptyStateProps) {
  const config = configs[variant];
  const Icon = config.icon;

  const displayTitle = title ?? config.title;
  const displayDescription = description ?? config.description;
  const displayCta = ctaText ?? config.cta;
  const displayHref = ctaHref ?? config.ctaHref;

  const handleClick = () => {
    if (onAction) {
      onAction();
    }
  };

  const ctaButton = (
    <MagneticButton
      onClick={!displayHref ? handleClick : undefined}
      className="px-6 py-3 bg-[var(--teed-green-8)] text-white font-semibold rounded-xl hover:bg-[var(--teed-green-9)] shadow-md hover:shadow-lg transition-all flex items-center gap-2"
    >
      <Plus className="w-4 h-4" />
      {displayCta}
    </MagneticButton>
  );

  return (
    <motion.div
      variants={fadeUp}
      initial="initial"
      animate="animate"
      className={cn(
        'flex flex-col items-center justify-center py-16 px-4 text-center',
        className
      )}
    >
      {/* Icon Circle */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        className="w-28 h-28 rounded-full bg-gradient-to-br from-[var(--teed-green-2)] to-[var(--sky-3)] flex items-center justify-center mb-6"
      >
        <Icon className="w-14 h-14 text-[var(--teed-green-9)]" strokeWidth={1.5} />
      </motion.div>

      {/* Content */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-3">
          {displayTitle}
        </h3>
        <p className="text-[var(--text-secondary)] max-w-md leading-relaxed mb-8">
          {displayDescription}
        </p>
      </motion.div>

      {/* CTA */}
      {!hideCta && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {displayHref ? (
            <Link href={displayHref}>{ctaButton}</Link>
          ) : (
            ctaButton
          )}
        </motion.div>
      )}
    </motion.div>
  );
}

// Compact version for inline use
interface CompactEmptyStateProps {
  icon?: LucideIcon;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export function CompactEmptyState({
  icon: Icon = FolderOpen,
  message,
  action,
  className
}: CompactEmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center py-8 px-4 text-center',
        className
      )}
    >
      <Icon className="w-10 h-10 text-[var(--text-tertiary)] mb-3" strokeWidth={1.5} />
      <p className="text-sm text-[var(--text-secondary)] mb-4">{message}</p>
      {action && (
        <button
          onClick={action.onClick}
          className="text-sm font-medium text-[var(--teed-green-8)] hover:text-[var(--teed-green-9)] underline underline-offset-2"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export default EmptyState;
