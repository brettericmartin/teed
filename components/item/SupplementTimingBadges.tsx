'use client';

import { Sun, Moon, Coffee, Utensils, Dumbbell, Clock } from 'lucide-react';
import type { TimingPeriod } from '@/lib/types/itemTypes';

interface SupplementTimingBadgesProps {
  timing: TimingPeriod[];
  size?: 'sm' | 'md';
  showLabels?: boolean;
}

const TIMING_CONFIG: Record<
  TimingPeriod,
  { label: string; icon: React.ElementType; color: string }
> = {
  morning: {
    label: 'Morning',
    icon: Sun,
    color: 'bg-[var(--amber-2)] text-[var(--amber-11)]',
  },
  afternoon: {
    label: 'Afternoon',
    icon: Sun,
    color: 'bg-[var(--copper-2)] text-[var(--copper-11)]',
  },
  evening: {
    label: 'Evening',
    icon: Moon,
    color: 'bg-[var(--sky-2)] text-[var(--sky-11)]',
  },
  with_food: {
    label: 'With Food',
    icon: Utensils,
    color: 'bg-[var(--teed-green-2)] text-[var(--teed-green-11)]',
  },
  empty_stomach: {
    label: 'Empty Stomach',
    icon: Coffee,
    color: 'bg-[var(--sand-2)] text-[var(--sand-11)]',
  },
  before_bed: {
    label: 'Before Bed',
    icon: Moon,
    color: 'bg-[var(--sky-3)] text-[var(--sky-12)]',
  },
  pre_workout: {
    label: 'Pre-Workout',
    icon: Dumbbell,
    color: 'bg-[var(--copper-2)] text-[var(--copper-11)]',
  },
  post_workout: {
    label: 'Post-Workout',
    icon: Dumbbell,
    color: 'bg-[var(--teed-green-2)] text-[var(--teed-green-11)]',
  },
};

export function SupplementTimingBadges({
  timing,
  size = 'sm',
  showLabels = true,
}: SupplementTimingBadgesProps) {
  if (!timing || timing.length === 0) {
    return null;
  }

  const sizeClasses = {
    sm: {
      container: 'gap-1.5',
      badge: 'px-2 py-0.5 text-xs gap-1',
      icon: 'w-3 h-3',
    },
    md: {
      container: 'gap-2',
      badge: 'px-2.5 py-1 text-sm gap-1.5',
      icon: 'w-4 h-4',
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className={`flex flex-wrap ${classes.container}`}>
      {timing.map((period) => {
        const config = TIMING_CONFIG[period];
        if (!config) return null;

        const Icon = config.icon;

        return (
          <span
            key={period}
            className={`inline-flex items-center rounded-full font-medium ${classes.badge} ${config.color}`}
            title={config.label}
          >
            <Icon className={classes.icon} />
            {showLabels && <span>{config.label}</span>}
          </span>
        );
      })}
    </div>
  );
}

/**
 * Single timing badge for compact display
 */
export function TimingBadge({
  timing,
  size = 'sm',
}: {
  timing: TimingPeriod;
  size?: 'sm' | 'md';
}) {
  const config = TIMING_CONFIG[timing];
  if (!config) return null;

  const Icon = config.icon;

  const sizeClasses = {
    sm: {
      badge: 'px-2 py-0.5 text-xs gap-1',
      icon: 'w-3 h-3',
    },
    md: {
      badge: 'px-2.5 py-1 text-sm gap-1.5',
      icon: 'w-4 h-4',
    },
  };

  const classes = sizeClasses[size];

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${classes.badge} ${config.color}`}
      title={config.label}
    >
      <Icon className={classes.icon} />
      <span>{config.label}</span>
    </span>
  );
}

export default SupplementTimingBadges;
