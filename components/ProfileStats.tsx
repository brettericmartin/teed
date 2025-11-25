'use client';

import { TrendingUp, Package, Eye, Users } from 'lucide-react';

type ProfileStatsProps = {
  totalBags: number;
  totalViews: number;
  totalFollowers: number;
  statsUpdatedAt?: string | null;
};

export default function ProfileStats({
  totalBags,
  totalViews,
  totalFollowers,
  statsUpdatedAt,
}: ProfileStatsProps) {
  const stats = [
    {
      label: 'Total Bags',
      value: totalBags,
      icon: Package,
      color: 'var(--teed-green-9)',
      bgColor: 'var(--teed-green-3)',
    },
    {
      label: 'Total Views',
      value: totalViews,
      icon: Eye,
      color: 'var(--sky-9)',
      bgColor: 'var(--sky-3)',
    },
    {
      label: 'Followers',
      value: totalFollowers,
      icon: Users,
      color: 'var(--evergreen-9)',
      bgColor: 'var(--evergreen-3)',
    },
  ];

  const formatNumber = (num: number) => {
    if (num >= 1000000) {
      return `${(num / 1000000).toFixed(1)}M`;
    }
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}K`;
    }
    return num.toString();
  };

  const formatLastUpdated = (dateString: string | null | undefined) => {
    if (!dateString) return null;

    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-[var(--surface)] rounded-[var(--radius-xl)] shadow-[var(--shadow-2)] border border-[var(--border-subtle)] p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-[var(--text-primary)]">Profile Stats</h2>
        {statsUpdatedAt && (
          <div className="flex items-center gap-1.5 text-xs text-[var(--text-tertiary)]">
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Updated {formatLastUpdated(statsUpdatedAt)}</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="flex items-center gap-4 p-4 rounded-[var(--radius-lg)] border border-[var(--border-subtle)] hover:border-[var(--border-primary)] transition-colors"
            >
              <div
                className="flex-shrink-0 w-12 h-12 rounded-[var(--radius-md)] flex items-center justify-center"
                style={{ backgroundColor: stat.bgColor }}
              >
                <Icon className="w-6 h-6" style={{ color: stat.color }} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-[var(--text-secondary)] mb-0.5">{stat.label}</p>
                <p className="text-2xl font-bold text-[var(--text-primary)]">
                  {formatNumber(stat.value)}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
