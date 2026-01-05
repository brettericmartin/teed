'use client';

import { Package, ShoppingBag, Star, Calendar } from 'lucide-react';

interface ProfileStatsProps {
  bagsCount: number;
  totalItems?: number;
  featuredItems?: number;
  memberSince?: string;
  compact?: boolean;
}

function formatMemberSince(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffYears = now.getFullYear() - date.getFullYear();
  const diffMonths = now.getMonth() - date.getMonth() + diffYears * 12;

  if (diffMonths < 1) return 'This month';
  if (diffMonths === 1) return '1 month';
  if (diffMonths < 12) return `${diffMonths} months`;
  if (diffYears === 1) return '1 year';
  return `${diffYears} years`;
}

export default function ProfileStats({
  bagsCount,
  totalItems = 0,
  featuredItems = 0,
  memberSince,
  compact = false,
}: ProfileStatsProps) {
  const stats = [
    {
      icon: Package,
      value: bagsCount,
      label: bagsCount === 1 ? 'Collection' : 'Collections',
      show: true,
    },
    {
      icon: ShoppingBag,
      value: totalItems,
      label: totalItems === 1 ? 'Item' : 'Items',
      show: totalItems > 0,
    },
    {
      icon: Star,
      value: featuredItems,
      label: 'Featured',
      show: featuredItems > 0 && !compact,
    },
    {
      icon: Calendar,
      value: formatMemberSince(memberSince),
      label: 'Member',
      show: Boolean(memberSince) && !compact,
    },
  ].filter((s) => s.show);

  if (stats.length === 0) return null;

  if (compact) {
    // Inline compact version
    return (
      <div className="px-4 py-2">
        <div className="flex items-center justify-center gap-4 text-sm text-[var(--theme-text-tertiary,var(--text-tertiary))]">
          {stats.map((stat, idx) => (
            <div key={stat.label} className="flex items-center gap-1.5">
              <stat.icon className="w-3.5 h-3.5" />
              <span className="font-medium text-[var(--theme-text-secondary,var(--text-secondary))]">
                {stat.value}
              </span>
              <span>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Full card version
  return (
    <div className="px-4 py-4">
      <div className="bg-[var(--surface)] rounded-2xl border border-[var(--border-subtle)] p-4 shadow-sm">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="flex flex-col items-center text-center py-2"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-2"
                style={{
                  background: 'var(--theme-primary, var(--teed-green-7))',
                  opacity: 0.15,
                }}
              >
                <stat.icon
                  className="w-5 h-5"
                  style={{ color: 'var(--theme-primary, var(--teed-green-9))' }}
                />
              </div>
              <span className="text-xl font-bold text-[var(--theme-text,var(--text-primary))]">
                {stat.value}
              </span>
              <span className="text-xs text-[var(--theme-text-tertiary,var(--text-tertiary))] uppercase tracking-wide">
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
