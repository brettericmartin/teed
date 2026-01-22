'use client';

/**
 * Badge Icon Component
 *
 * Displays a badge with icon, name, and optional progress indicator.
 */

import {
  Package,
  Layers,
  Archive,
  Library,
  Plus,
  Box,
  Boxes,
  Share2,
  UserPlus,
  Users,
  Code,
  Zap,
  Crown,
  Award,
  Globe,
  Globe2,
  Map,
  Sparkles,
  Flame,
  Bookmark,
  Heart,
} from 'lucide-react';
import type { BadgeDefinition, BadgeWithProgress, AwardedBadge } from '@/lib/badges/types';
import { BADGE_COLOR_CLASSES } from '@/lib/badges/definitions';

// Map icon names to Lucide components
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  package: Package,
  layers: Layers,
  archive: Archive,
  library: Library,
  plus: Plus,
  box: Box,
  boxes: Boxes,
  'share-2': Share2,
  'user-plus': UserPlus,
  users: Users,
  code: Code,
  zap: Zap,
  crown: Crown,
  // Impact badges
  globe: Globe,
  'globe-2': Globe2,
  map: Map,
  // Inspiration badges
  sparkles: Sparkles,
  flame: Flame,
  // Trust badges
  bookmark: Bookmark,
  heart: Heart,
};

interface BadgeIconProps {
  badge: BadgeDefinition | AwardedBadge | BadgeWithProgress;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  showDescription?: boolean;
  showProgress?: boolean;
  className?: string;
}

export default function BadgeIcon({
  badge,
  size = 'md',
  showName = true,
  showDescription = false,
  showProgress = false,
  className = '',
}: BadgeIconProps) {
  const Icon = ICON_MAP[badge.icon] || Award;
  const colors = BADGE_COLOR_CLASSES[badge.color] || BADGE_COLOR_CLASSES.slate;

  // Check if it's a progress badge
  const isProgressBadge = 'isAwarded' in badge;
  const isAwarded = isProgressBadge ? badge.isAwarded : 'awardedAt' in badge;
  const percentComplete = isProgressBadge ? (badge as BadgeWithProgress).percentComplete : 100;

  const sizeClasses = {
    sm: {
      container: 'p-2',
      icon: 'w-4 h-4',
      name: 'text-xs',
      desc: 'text-xs',
    },
    md: {
      container: 'p-3',
      icon: 'w-5 h-5',
      name: 'text-sm',
      desc: 'text-xs',
    },
    lg: {
      container: 'p-4',
      icon: 'w-6 h-6',
      name: 'text-base',
      desc: 'text-sm',
    },
  };

  const sizeClass = sizeClasses[size];

  return (
    <div
      className={`
        inline-flex items-center gap-2 rounded-lg border transition-all
        ${colors.bg} ${colors.border}
        ${isAwarded ? '' : 'opacity-50 grayscale'}
        ${sizeClass.container}
        ${className}
      `}
      title={`${badge.name}${isAwarded ? '' : ' (Not yet earned)'}`}
    >
      <div className={`${colors.text}`}>
        <Icon className={sizeClass.icon} />
      </div>

      {(showName || showDescription) && (
        <div className="flex flex-col">
          {showName && (
            <span className={`font-medium ${colors.text} ${sizeClass.name}`}>
              {badge.name}
            </span>
          )}
          {showDescription && (
            <span className={`text-[var(--text-tertiary)] ${sizeClass.desc}`}>
              {badge.description}
            </span>
          )}
        </div>
      )}

      {showProgress && !isAwarded && percentComplete < 100 && (
        <div className="ml-auto flex items-center gap-2">
          <div className="w-16 h-1.5 bg-[var(--grey-4)] rounded-full overflow-hidden">
            <div
              className={`h-full ${colors.bg.replace('bg-', 'bg-')} transition-all`}
              style={{ width: `${percentComplete}%` }}
            />
          </div>
          <span className="text-xs text-[var(--text-tertiary)]">{percentComplete}%</span>
        </div>
      )}
    </div>
  );
}

/**
 * Badge Grid - Display multiple badges in a grid
 */
interface BadgeGridProps {
  badges: (BadgeDefinition | AwardedBadge | BadgeWithProgress)[];
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  showProgress?: boolean;
  maxDisplay?: number;
  className?: string;
}

export function BadgeGrid({
  badges,
  size = 'md',
  showName = true,
  showProgress = false,
  maxDisplay,
  className = '',
}: BadgeGridProps) {
  const displayBadges = maxDisplay ? badges.slice(0, maxDisplay) : badges;
  const remaining = maxDisplay && badges.length > maxDisplay ? badges.length - maxDisplay : 0;

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {displayBadges.map((badge) => (
        <BadgeIcon
          key={badge.id}
          badge={badge}
          size={size}
          showName={showName}
          showProgress={showProgress}
        />
      ))}
      {remaining > 0 && (
        <div className="inline-flex items-center px-3 py-2 rounded-lg bg-[var(--grey-4)] text-[var(--text-tertiary)] text-sm">
          +{remaining} more
        </div>
      )}
    </div>
  );
}

/**
 * Badge Showcase - Featured display of earned badges
 */
interface BadgeShowcaseProps {
  badges: AwardedBadge[];
  title?: string;
  emptyMessage?: string;
  className?: string;
}

export function BadgeShowcase({
  badges,
  title = 'Achievements',
  emptyMessage = 'No badges earned yet',
  className = '',
}: BadgeShowcaseProps) {
  return (
    <div className={className}>
      {title && (
        <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">{title}</h3>
      )}
      {badges.length === 0 ? (
        <p className="text-sm text-[var(--text-tertiary)]">{emptyMessage}</p>
      ) : (
        <BadgeGrid badges={badges} size="md" showName />
      )}
    </div>
  );
}

/**
 * Badge Progress Card - Shows progress toward a specific badge
 */
interface BadgeProgressCardProps {
  badge: BadgeWithProgress;
  className?: string;
}

export function BadgeProgressCard({ badge, className = '' }: BadgeProgressCardProps) {
  const Icon = ICON_MAP[badge.icon] || Award;
  const colors = BADGE_COLOR_CLASSES[badge.color] || BADGE_COLOR_CLASSES.slate;

  return (
    <div
      className={`
        p-4 rounded-xl border transition-all
        ${badge.isAwarded ? colors.bg : 'bg-[var(--surface)]'}
        ${badge.isAwarded ? colors.border : 'border-[var(--border-subtle)]'}
        ${className}
      `}
    >
      <div className="flex items-start gap-3">
        <div
          className={`
            p-2 rounded-lg
            ${badge.isAwarded ? colors.bg : 'bg-[var(--grey-4)]'}
          `}
        >
          <Icon
            className={`
              w-5 h-5
              ${badge.isAwarded ? colors.text : 'text-[var(--text-tertiary)]'}
            `}
          />
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h4 className={`font-medium ${badge.isAwarded ? colors.text : 'text-[var(--text-primary)]'}`}>
              {badge.name}
            </h4>
            {badge.isAwarded && (
              <span className={`text-xs ${colors.text}`}>Earned!</span>
            )}
          </div>

          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            {badge.description}
          </p>

          {!badge.isAwarded && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs text-[var(--text-tertiary)] mb-1">
                <span>
                  {badge.currentValue} / {badge.requirementValue}
                </span>
                <span>{badge.percentComplete}%</span>
              </div>
              <div className="h-1.5 bg-[var(--grey-4)] rounded-full overflow-hidden">
                <div
                  className="h-full bg-[var(--teed-green-9)] transition-all duration-500"
                  style={{ width: `${badge.percentComplete}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
