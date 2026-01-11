'use client';

import { Sparkles, RefreshCw, Clock } from 'lucide-react';
import type { BagWithVersioning, ChangelogBadge as ChangelogBadgeType } from '@/lib/types/versionHistory';
import { getChangelogBadge } from '@/lib/types/versionHistory';

interface ChangelogBadgeProps {
  bag: BagWithVersioning;
  size?: 'sm' | 'md';
  showTooltip?: boolean;
}

export default function ChangelogBadge({ bag, size = 'sm', showTooltip = true }: ChangelogBadgeProps) {
  const badge = getChangelogBadge(bag);

  if (!badge) return null;

  const sizeClasses = size === 'sm'
    ? 'text-xs px-2 py-0.5 gap-1'
    : 'text-sm px-2.5 py-1 gap-1.5';

  const iconSize = size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5';

  const getBadgeStyles = () => {
    switch (badge.type) {
      case 'new':
        return 'bg-[var(--teed-green-3)] text-[var(--teed-green-11)] border border-[var(--teed-green-6)]';
      case 'major_update':
        return 'bg-[var(--sky-3)] text-[var(--sky-11)] border border-[var(--sky-6)]';
      case 'updated':
        return 'bg-[var(--sand-3)] text-[var(--sand-11)] border border-[var(--sand-6)]';
      default:
        return 'bg-[var(--surface-alt)] text-[var(--text-secondary)] border border-[var(--border-subtle)]';
    }
  };

  const getIcon = () => {
    switch (badge.type) {
      case 'new':
        return <Sparkles className={iconSize} />;
      case 'major_update':
        return <RefreshCw className={iconSize} />;
      case 'updated':
        return <Clock className={iconSize} />;
      default:
        return null;
    }
  };

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium
        ${sizeClasses}
        ${getBadgeStyles()}
      `}
      title={showTooltip ? `${badge.label}` : undefined}
    >
      {getIcon()}
      <span>{badge.label}</span>
    </span>
  );
}

// Simple variant for lists that just shows "Updated" badge without date
interface SimpleUpdateBadgeProps {
  lastUpdate: string | null;
  size?: 'sm' | 'md';
}

export function SimpleUpdateBadge({ lastUpdate, size = 'sm' }: SimpleUpdateBadgeProps) {
  if (!lastUpdate) return null;

  const daysSinceUpdate = Math.floor(
    (new Date().getTime() - new Date(lastUpdate).getTime()) / (1000 * 60 * 60 * 24)
  );

  // Only show badge for updates within the last 30 days
  if (daysSinceUpdate > 30) return null;

  const sizeClasses = size === 'sm'
    ? 'text-xs px-1.5 py-0.5'
    : 'text-sm px-2 py-0.5';

  const label = daysSinceUpdate === 0
    ? 'Today'
    : daysSinceUpdate === 1
      ? 'Yesterday'
      : daysSinceUpdate <= 7
        ? `${daysSinceUpdate}d ago`
        : `${Math.floor(daysSinceUpdate / 7)}w ago`;

  return (
    <span
      className={`
        inline-flex items-center rounded font-medium
        bg-[var(--sky-3)] text-[var(--sky-11)] border border-[var(--sky-6)]
        ${sizeClasses}
      `}
    >
      {label}
    </span>
  );
}
