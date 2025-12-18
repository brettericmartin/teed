'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { fadeUp } from '@/lib/animations';

interface CuratorNoteProps {
  note: string;
  curatorName: string;
  curatorAvatar?: string;
  /** Display variant */
  variant?: 'inline' | 'featured' | 'minimal';
  className?: string;
}

export function CuratorNote({
  note,
  curatorName,
  curatorAvatar,
  variant = 'inline',
  className
}: CuratorNoteProps) {
  if (variant === 'minimal') {
    return (
      <div className={cn('flex items-start gap-3', className)}>
        {curatorAvatar && (
          <Image
            src={curatorAvatar}
            alt={curatorName}
            width={24}
            height={24}
            className="rounded-full object-cover"
          />
        )}
        <p className="text-sm text-[var(--text-secondary)] italic">
          &ldquo;{note}&rdquo; — <span className="font-medium not-italic">{curatorName}</span>
        </p>
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <motion.div
        variants={fadeUp}
        initial="initial"
        animate="animate"
        className={cn(
          'relative overflow-hidden rounded-xl',
          'border border-[var(--border-subtle)]',
          'bg-gradient-to-br from-[var(--sand-2)] to-[var(--sky-2)]',
          'p-6 md:p-8',
          className
        )}
      >
        {/* Subtle pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage:
              'radial-gradient(circle, currentColor 1px, transparent 1px)',
            backgroundSize: '20px 20px'
          }}
        />

        <div className="relative">
          {/* Header */}
          <div className="flex items-start gap-4 mb-4">
            {curatorAvatar && (
              <Image
                src={curatorAvatar}
                alt={curatorName}
                width={48}
                height={48}
                className="rounded-full object-cover ring-2 ring-white shadow-md"
              />
            )}
            <div>
              <p className="text-xs uppercase tracking-widest text-[var(--copper-10)] font-semibold mb-1">
                Why We Chose This
              </p>
              <p className="text-base font-semibold text-[var(--text-primary)]">
                {curatorName}
              </p>
            </div>
          </div>

          {/* Quote */}
          <blockquote className="font-serif text-lg italic text-[var(--text-primary)] leading-relaxed">
            &ldquo;{note}&rdquo;
          </blockquote>
        </div>
      </motion.div>
    );
  }

  // Default inline variant
  return (
    <div
      className={cn(
        'border-l-2 border-[var(--sand-8)] pl-6 py-4',
        className
      )}
    >
      {/* Quote */}
      <p className="font-serif italic text-[var(--text-secondary)] leading-relaxed mb-3">
        &ldquo;{note}&rdquo;
      </p>

      {/* Attribution */}
      <div className="flex items-center gap-3">
        {curatorAvatar && (
          <Image
            src={curatorAvatar}
            alt={curatorName}
            width={32}
            height={32}
            className="rounded-full object-cover"
          />
        )}
        <div>
          <p className="text-xs uppercase tracking-wider text-[var(--text-tertiary)] font-medium">
            Curator&apos;s Note
          </p>
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            {curatorName}
          </p>
        </div>
      </div>
    </div>
  );
}

// About This Bag component - auto-generated section
interface AboutBagProps {
  itemCount: number;
  category?: string;
  lastUpdated?: Date;
  highlights?: string[];
  className?: string;
}

export function AboutBag({
  itemCount,
  category,
  lastUpdated,
  highlights,
  className
}: AboutBagProps) {
  const formatDate = (date: Date) => {
    const now = new Date();
    const diffDays = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
    return `${Math.floor(diffDays / 365)} years ago`;
  };

  return (
    <div
      className={cn(
        'bg-[var(--surface-elevated)] rounded-xl p-5 border border-[var(--border-subtle)]',
        className
      )}
    >
      <h4 className="text-sm font-semibold text-[var(--text-primary)] mb-3">
        About this bag
      </h4>

      <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
        <li className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[var(--teed-green-8)]" />
          {itemCount} {itemCount === 1 ? 'item' : 'items'} curated
          {category && ` for ${category.toLowerCase()}`}
        </li>

        {highlights?.map((highlight, index) => (
          <li key={index} className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--teed-green-8)]" />
            {highlight}
          </li>
        ))}

        {lastUpdated && (
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--grey-6)]" />
            Updated {formatDate(lastUpdated)}
          </li>
        )}
      </ul>
    </div>
  );
}

// List descriptor - one-liner under title
interface ListDescriptorProps {
  text?: string;
  className?: string;
}

export function ListDescriptor({
  text = 'A curated list — clone it, tweak it, send it.',
  className
}: ListDescriptorProps) {
  return (
    <p
      className={cn(
        'text-sm text-[var(--text-secondary)] italic',
        className
      )}
    >
      {text}
    </p>
  );
}

export default CuratorNote;
