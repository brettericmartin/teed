'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  /** Width - can be number (px) or string (e.g., '100%', '50%') */
  width?: number | string;
  /** Height - can be number (px) or string */
  height?: number | string;
  /** Border radius preset */
  rounded?: 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
}

const roundedMap = {
  none: '',
  sm: 'rounded-sm',
  md: 'rounded-md',
  lg: 'rounded-lg',
  xl: 'rounded-xl',
  '2xl': 'rounded-2xl',
  full: 'rounded-full',
};

export function Skeleton({
  className,
  width,
  height,
  rounded = 'md',
}: SkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0.4 }}
      animate={{
        opacity: [0.4, 0.7, 0.4],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      className={cn(
        'bg-[var(--sand-4)]',
        roundedMap[rounded],
        className
      )}
      style={{
        width: typeof width === 'number' ? `${width}px` : width,
        height: typeof height === 'number' ? `${height}px` : height,
      }}
    />
  );
}

// Pre-built skeleton patterns for common UI elements

interface SkeletonTextProps {
  lines?: number;
  className?: string;
}

export function SkeletonText({ lines = 3, className }: SkeletonTextProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          height={14}
          width={i === lines - 1 ? '70%' : '100%'}
          rounded="sm"
        />
      ))}
    </div>
  );
}

interface SkeletonAvatarProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function SkeletonAvatar({ size = 'md', className }: SkeletonAvatarProps) {
  const sizeMap = {
    sm: 32,
    md: 48,
    lg: 64,
  };

  return (
    <Skeleton
      width={sizeMap[size]}
      height={sizeMap[size]}
      rounded="full"
      className={className}
    />
  );
}

// Bag card skeleton for grids
export function SkeletonBagCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-xl overflow-hidden',
        className
      )}
    >
      {/* Image placeholder */}
      <Skeleton height={200} width="100%" rounded="none" />

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <Skeleton height={20} width="80%" rounded="sm" />

        {/* Description */}
        <div className="space-y-1.5">
          <Skeleton height={12} width="100%" rounded="sm" />
          <Skeleton height={12} width="60%" rounded="sm" />
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-3 pt-2">
          <SkeletonAvatar size="sm" />
          <Skeleton height={14} width={80} rounded="sm" />
        </div>
      </div>
    </div>
  );
}

// Item card skeleton for bag detail view
export function SkeletonItemCard({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-xl overflow-hidden',
        className
      )}
    >
      {/* Image placeholder */}
      <Skeleton height={160} width="100%" rounded="none" />

      {/* Content */}
      <div className="p-3 space-y-2">
        {/* Brand */}
        <Skeleton height={10} width={60} rounded="sm" />
        {/* Name */}
        <Skeleton height={16} width="90%" rounded="sm" />
        {/* Link button */}
        <Skeleton height={32} width="100%" rounded="lg" className="mt-2" />
      </div>
    </div>
  );
}

// Full bag grid skeleton
interface SkeletonBagGridProps {
  count?: number;
  className?: string;
}

export function SkeletonBagGrid({ count = 6, className }: SkeletonBagGridProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6',
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
        >
          <SkeletonBagCard />
        </motion.div>
      ))}
    </motion.div>
  );
}

// Full item grid skeleton for bag detail
interface SkeletonItemGridProps {
  count?: number;
  className?: string;
}

export function SkeletonItemGrid({ count = 8, className }: SkeletonItemGridProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4',
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.03 }}
        >
          <SkeletonItemCard />
        </motion.div>
      ))}
    </motion.div>
  );
}

// Bag detail header skeleton
export function SkeletonBagHeader({ className }: { className?: string }) {
  return (
    <div className={cn('space-y-6', className)}>
      {/* Cover image */}
      <Skeleton height={300} width="100%" rounded="xl" />

      {/* Header content */}
      <div className="space-y-4">
        {/* Title */}
        <Skeleton height={32} width="60%" rounded="md" />

        {/* Description */}
        <div className="space-y-2">
          <Skeleton height={16} width="100%" rounded="sm" />
          <Skeleton height={16} width="80%" rounded="sm" />
        </div>

        {/* Meta row */}
        <div className="flex items-center gap-4">
          <SkeletonAvatar size="sm" />
          <Skeleton height={14} width={100} rounded="sm" />
          <Skeleton height={14} width={60} rounded="sm" />
        </div>

        {/* Tags */}
        <div className="flex gap-2">
          <Skeleton height={28} width={70} rounded="full" />
          <Skeleton height={28} width={90} rounded="full" />
          <Skeleton height={28} width={60} rounded="full" />
        </div>
      </div>
    </div>
  );
}

export default Skeleton;
