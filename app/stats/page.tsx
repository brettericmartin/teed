'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Users,
  Package,
  TrendingUp,
  Clock,
  Zap,
  ArrowRight,
  RefreshCw,
  Crown,
  Sparkles,
} from 'lucide-react';
import BetaCapacityCounter from '@/components/BetaCapacityCounter';
import { Button } from '@/components/ui/Button';

interface BetaStats {
  capacity: {
    current: number;
    max: number;
    remaining: number;
    percentage: number;
  };
  applications: {
    total: number;
    pending: number;
    approved_today: number;
    approval_rate: number;
  };
  activity: {
    bags_created: number;
    items_curated: number;
    active_users_24h: number;
  };
  recent_approvals: Array<{
    first_name: string;
    creator_type: string;
    approved_at: string;
  }>;
}

function StatCard({
  icon: Icon,
  label,
  value,
  subtext,
  color = 'teed-green',
}: {
  icon: React.ElementType;
  label: string;
  value: string | number;
  subtext?: string;
  color?: 'teed-green' | 'amber' | 'sky' | 'purple';
}) {
  const colorClasses = {
    'teed-green': 'from-[var(--teed-green-3)] to-[var(--teed-green-5)] text-[var(--teed-green-11)]',
    amber: 'from-amber-100 to-amber-200 text-amber-700',
    sky: 'from-sky-100 to-sky-200 text-sky-700',
    purple: 'from-purple-100 to-purple-200 text-purple-700',
  };

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-[var(--border-subtle)]">
      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center mb-4`}>
        <Icon className="w-6 h-6" />
      </div>
      <p className="text-sm text-[var(--text-tertiary)] mb-1">{label}</p>
      <p className="text-3xl font-bold text-[var(--text-primary)]">{value}</p>
      {subtext && (
        <p className="text-sm text-[var(--text-secondary)] mt-1">{subtext}</p>
      )}
    </div>
  );
}

function formatTimeAgo(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  return `${diffDays}d ago`;
}

export default function StatsPage() {
  const [stats, setStats] = useState<BetaStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const fetchStats = async () => {
    try {
      // Fetch all stats in parallel
      const [capacityRes, approvalsRes] = await Promise.all([
        fetch('/api/beta/capacity'),
        fetch('/api/beta/approvals/recent?limit=5'),
      ]);

      const capacity = await capacityRes.json();
      const approvals = await approvalsRes.json();

      setStats({
        capacity: {
          current: capacity.current || 0,
          max: capacity.max_capacity || 50,
          remaining: capacity.remaining || 0,
          percentage: capacity.percentage || 0,
        },
        applications: {
          total: capacity.total_applications || 0,
          pending: capacity.pending_applications || 0,
          approved_today: capacity.approved_today || 0,
          approval_rate: capacity.approval_rate || 0,
        },
        activity: {
          bags_created: capacity.bags_created || 0,
          items_curated: capacity.items_curated || 0,
          active_users_24h: capacity.active_users || 0,
        },
        recent_approvals: approvals.approvals || [],
      });

      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    // Refresh every 30 seconds
    const interval = setInterval(fetchStats, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--bg-page)] to-[var(--teed-green-1)]">
      <div className="max-w-5xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--teed-green-2)] border border-[var(--teed-green-6)] text-[var(--teed-green-11)] text-sm font-medium mb-4">
            <TrendingUp className="w-4 h-4" />
            Live Stats
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-[var(--text-primary)] mb-4">
            Teed Founding Cohort
          </h1>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Watch the founding cohort fill up in real-time.
            Limited to 50 members with lifetime benefits.
          </p>

          {/* Last updated */}
          <div className="mt-4 flex items-center justify-center gap-2 text-sm text-[var(--text-tertiary)]">
            <RefreshCw className="w-3 h-3" />
            Last updated: {lastUpdated.toLocaleTimeString()}
          </div>
        </div>

        {/* Main Capacity Counter */}
        <div className="bg-white dark:bg-zinc-900 rounded-3xl p-8 shadow-xl border border-[var(--border-subtle)] mb-8">
          <h2 className="text-xl font-semibold text-[var(--text-primary)] mb-6 text-center">
            Founding Member Capacity
          </h2>
          <BetaCapacityCounter className="max-w-md mx-auto" />

          {stats && stats.capacity.remaining <= 10 && (
            <div className="mt-6 p-4 bg-amber-50 dark:bg-amber-900/20 rounded-xl text-center">
              <p className="text-amber-700 dark:text-amber-300 font-medium flex items-center justify-center gap-2">
                <Zap className="w-4 h-4" />
                Only {stats.capacity.remaining} spots remaining!
              </p>
            </div>
          )}
        </div>

        {/* Stats Grid */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              icon={Users}
              label="Founding Members"
              value={`${stats.capacity.current}/${stats.capacity.max}`}
              subtext={`${stats.capacity.percentage}% filled`}
              color="teed-green"
            />
            <StatCard
              icon={Clock}
              label="Applications"
              value={stats.applications.total}
              subtext={`${stats.applications.pending} pending`}
              color="amber"
            />
            <StatCard
              icon={Package}
              label="Bags Created"
              value={stats.activity.bags_created}
              subtext="by founding members"
              color="sky"
            />
            <StatCard
              icon={Sparkles}
              label="Items Curated"
              value={stats.activity.items_curated.toLocaleString()}
              subtext="products shared"
              color="purple"
            />
          </div>
        )}

        {/* Recent Approvals */}
        {stats && stats.recent_approvals.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl p-6 shadow-lg border border-[var(--border-subtle)] mb-8">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Crown className="w-5 h-5 text-amber-500" />
              Recently Approved
            </h3>

            <div className="space-y-3">
              {stats.recent_approvals.map((approval, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 p-3 rounded-xl bg-[var(--surface-elevated)]"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--teed-green-6)] to-[var(--teed-green-8)] flex items-center justify-center text-white font-medium">
                    {approval.first_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--text-primary)]">
                      {approval.first_name}
                    </p>
                    <p className="text-sm text-[var(--text-tertiary)]">
                      {approval.creator_type?.replace(/_/g, ' ') || 'Creator'}
                    </p>
                  </div>
                  <span className="text-sm text-[var(--text-tertiary)]">
                    {formatTimeAgo(approval.approved_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="text-center">
          <p className="text-[var(--text-secondary)] mb-4">
            Ready to join the founding cohort?
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/apply">
              <Button variant="create" className="gap-2">
                Apply for Access
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/join">
              <Button variant="secondary" className="gap-2">
                Have an invite code?
              </Button>
            </Link>
          </div>
        </div>

        {/* Perks reminder */}
        <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { emoji: '🌟', label: 'Lifetime Free', desc: 'All features, forever' },
            { emoji: '🚀', label: 'Early Access', desc: 'New features first' },
            { emoji: '👑', label: 'Founding Badge', desc: 'Exclusive profile badge' },
            { emoji: '💬', label: 'Direct Input', desc: 'Shape the product' },
          ].map((perk, idx) => (
            <div key={idx} className="p-4 rounded-xl bg-white/50 dark:bg-zinc-800/50">
              <div className="text-2xl mb-2">{perk.emoji}</div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                {perk.label}
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">{perk.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
