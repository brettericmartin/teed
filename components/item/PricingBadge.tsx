'use client';

import { CreditCard, Gift, Repeat, DollarSign } from 'lucide-react';
import type { PricingModel, PricingPeriod } from '@/lib/types/itemTypes';

interface PricingBadgeProps {
  pricingModel: PricingModel;
  priceAmount?: number;
  pricePeriod?: PricingPeriod;
  freeTierAvailable?: boolean;
  size?: 'sm' | 'md';
  showPrice?: boolean;
}

const PRICING_CONFIG: Record<
  PricingModel,
  { label: string; icon: React.ElementType; color: string }
> = {
  subscription: {
    label: 'Subscription',
    icon: Repeat,
    color: 'bg-[var(--teed-green-2)] text-[var(--teed-green-11)]',
  },
  one_time: {
    label: 'One-time',
    icon: CreditCard,
    color: 'bg-[var(--sky-2)] text-[var(--sky-11)]',
  },
  freemium: {
    label: 'Freemium',
    icon: Gift,
    color: 'bg-[var(--amber-2)] text-[var(--amber-11)]',
  },
  free: {
    label: 'Free',
    icon: Gift,
    color: 'bg-[var(--teed-green-3)] text-[var(--teed-green-12)]',
  },
};

const PERIOD_LABELS: Record<PricingPeriod, string> = {
  monthly: '/mo',
  yearly: '/yr',
  lifetime: '',
};

export function PricingBadge({
  pricingModel,
  priceAmount,
  pricePeriod,
  freeTierAvailable,
  size = 'sm',
  showPrice = true,
}: PricingBadgeProps) {
  const config = PRICING_CONFIG[pricingModel];
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

  // Format price display
  const formatPrice = () => {
    if (pricingModel === 'free') return 'Free';
    if (!showPrice || !priceAmount) return config.label;

    const periodSuffix = pricePeriod ? PERIOD_LABELS[pricePeriod] : '';
    return `$${priceAmount}${periodSuffix}`;
  };

  return (
    <div className="flex items-center gap-1.5">
      <span
        className={`inline-flex items-center rounded-full font-medium ${classes.badge} ${config.color}`}
      >
        <Icon className={classes.icon} />
        <span>{formatPrice()}</span>
      </span>

      {/* Free tier indicator */}
      {freeTierAvailable && pricingModel !== 'free' && (
        <span
          className={`inline-flex items-center rounded-full font-medium ${classes.badge} bg-[var(--teed-green-1)] text-[var(--teed-green-11)] border border-[var(--teed-green-6)]`}
        >
          <Gift className={classes.icon} />
          <span>Free tier</span>
        </span>
      )}
    </div>
  );
}

/**
 * Compact pricing display for cards
 */
export function PricingCompact({
  pricingModel,
  priceAmount,
  pricePeriod,
}: {
  pricingModel: PricingModel;
  priceAmount?: number;
  pricePeriod?: PricingPeriod;
}) {
  if (pricingModel === 'free') {
    return (
      <span className="text-sm font-semibold text-[var(--teed-green-11)]">Free</span>
    );
  }

  if (!priceAmount) {
    return (
      <span className="text-sm text-[var(--text-secondary)] capitalize">
        {pricingModel.replace('_', ' ')}
      </span>
    );
  }

  const periodSuffix = pricePeriod ? PERIOD_LABELS[pricePeriod] : '';

  return (
    <span className="text-sm">
      <span className="font-semibold text-[var(--text-primary)]">
        ${priceAmount}
      </span>
      {periodSuffix && (
        <span className="text-[var(--text-secondary)]">{periodSuffix}</span>
      )}
    </span>
  );
}

export default PricingBadge;
