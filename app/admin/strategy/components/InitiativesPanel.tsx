'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle,
  Clock,
  Play,
  Archive,
  ChevronRight,
  Users,
  Server,
  TrendingUp,
  Building2,
  Mail,
  Briefcase,
  RefreshCw,
} from 'lucide-react';
import type {
  InitiativeListItem,
  InitiativeStatus,
  InitiativeCategory,
  ADVISORS,
} from '@/lib/types/strategicInitiatives';

const STATUS_CONFIG: Record<InitiativeStatus, { icon: React.ReactNode; label: string; color: string }> = {
  draft: { icon: <FileText className="w-4 h-4" />, label: 'Draft', color: 'grey' },
  in_review: { icon: <Clock className="w-4 h-4" />, label: 'In Review', color: 'amber' },
  approved: { icon: <CheckCircle className="w-4 h-4" />, label: 'Approved', color: 'teed-green' },
  in_progress: { icon: <Play className="w-4 h-4" />, label: 'In Progress', color: 'sky' },
  completed: { icon: <CheckCircle className="w-4 h-4" />, label: 'Completed', color: 'evergreen' },
  archived: { icon: <Archive className="w-4 h-4" />, label: 'Archived', color: 'grey' },
};

const CATEGORY_CONFIG: Record<InitiativeCategory, { icon: React.ReactNode; label: string }> = {
  infrastructure: { icon: <Server className="w-4 h-4" />, label: 'Infrastructure' },
  growth: { icon: <TrendingUp className="w-4 h-4" />, label: 'Growth' },
  monetization: { icon: <Briefcase className="w-4 h-4" />, label: 'Monetization' },
  product: { icon: <FileText className="w-4 h-4" />, label: 'Product' },
  b2b: { icon: <Building2 className="w-4 h-4" />, label: 'B2B' },
  platform: { icon: <Users className="w-4 h-4" />, label: 'Platform' },
};

const EFFORT_LABELS: Record<string, string> = {
  small: 'Small (1-2 weeks)',
  medium: 'Medium (1-2 months)',
  large: 'Large (1 quarter)',
  xlarge: 'XL (2+ quarters)',
};

export default function InitiativesPanel() {
  const [initiatives, setInitiatives] = useState<InitiativeListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<InitiativeStatus | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<InitiativeCategory | 'all'>('all');

  useEffect(() => {
    fetchInitiatives();
  }, [statusFilter, categoryFilter]);

  async function fetchInitiatives() {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (categoryFilter !== 'all') params.set('category', categoryFilter);

      const response = await fetch(`/api/admin/strategic-initiatives?${params}`);
      if (!response.ok) throw new Error('Failed to fetch initiatives');

      const data = await response.json();
      setInitiatives(data.initiatives || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  const statusCounts = initiatives.reduce((acc, init) => {
    acc[init.status] = (acc[init.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-[var(--text-primary)]">
            Strategic Initiatives
          </h2>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Board-evaluated plans for Teed&apos;s growth and development
          </p>
        </div>
        <button
          onClick={fetchInitiatives}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg hover:bg-[var(--grey-4)] transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
        {(Object.keys(STATUS_CONFIG) as InitiativeStatus[]).map((status) => {
          const config = STATUS_CONFIG[status];
          const count = statusCounts[status] || 0;
          const isActive = statusFilter === status;
          return (
            <button
              key={status}
              onClick={() => setStatusFilter(isActive ? 'all' : status)}
              className={`p-3 rounded-xl text-left transition-all ${
                isActive
                  ? `bg-[var(--${config.color}-4)] border-2 border-[var(--${config.color}-7)]`
                  : 'bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--border-default)]'
              }`}
            >
              <div className={`text-[var(--${config.color}-11)] flex items-center gap-2 mb-1`}>
                {config.icon}
                <span className="text-xs font-medium">{config.label}</span>
              </div>
              <div className="text-2xl font-bold text-[var(--text-primary)]">{count}</div>
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-2">
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value as InitiativeCategory | 'all')}
          className="px-3 py-2 text-sm bg-[var(--surface)] border border-[var(--border-subtle)] rounded-lg focus:ring-2 focus:ring-[var(--evergreen-6)] focus:border-transparent"
        >
          <option value="all">All Categories</option>
          {(Object.keys(CATEGORY_CONFIG) as InitiativeCategory[]).map((cat) => (
            <option key={cat} value={cat}>
              {CATEGORY_CONFIG[cat].label}
            </option>
          ))}
        </select>
        {statusFilter !== 'all' && (
          <button
            onClick={() => setStatusFilter('all')}
            className="px-3 py-2 text-sm text-[var(--copper-11)] hover:bg-[var(--copper-4)] rounded-lg transition-colors"
          >
            Clear Status Filter
          </button>
        )}
      </div>

      {/* Content */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-[var(--evergreen-9)]" />
        </div>
      )}

      {error && (
        <div className="bg-[var(--copper-4)] border border-[var(--copper-7)] rounded-xl p-4">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-[var(--copper-11)]" />
            <div>
              <p className="font-medium text-[var(--copper-11)]">Failed to load initiatives</p>
              <p className="text-sm text-[var(--copper-12)]">{error}</p>
            </div>
          </div>
        </div>
      )}

      {!loading && !error && initiatives.length === 0 && (
        <div className="text-center py-12 bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)]">
          <FileText className="w-12 h-12 text-[var(--text-tertiary)] mx-auto mb-3" />
          <h3 className="text-lg font-medium text-[var(--text-primary)] mb-1">
            No initiatives found
          </h3>
          <p className="text-sm text-[var(--text-secondary)]">
            {statusFilter !== 'all' || categoryFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Strategic initiatives will appear here once created'}
          </p>
        </div>
      )}

      {!loading && !error && initiatives.length > 0 && (
        <div className="space-y-3">
          {initiatives.map((initiative) => (
            <InitiativeCard key={initiative.id} initiative={initiative} />
          ))}
        </div>
      )}
    </div>
  );
}

function InitiativeCard({ initiative }: { initiative: InitiativeListItem }) {
  const statusConfig = STATUS_CONFIG[initiative.status];
  const categoryConfig = CATEGORY_CONFIG[initiative.category];

  return (
    <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] hover:border-[var(--evergreen-6)] transition-all hover:shadow-lg">
      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Title & Category */}
            <div className="flex items-center gap-3 mb-2">
              <div className={`p-2 rounded-lg bg-[var(--${statusConfig.color}-4)]`}>
                <span className={`text-[var(--${statusConfig.color}-11)]`}>
                  {categoryConfig.icon}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-[var(--text-primary)] truncate">
                  {initiative.title}
                </h3>
                <p className="text-xs text-[var(--text-secondary)]">
                  {categoryConfig.label}
                </p>
              </div>
            </div>

            {/* Tagline */}
            {initiative.tagline && (
              <p className="text-sm text-[var(--text-secondary)] mb-3 line-clamp-2">
                {initiative.tagline}
              </p>
            )}

            {/* Meta info */}
            <div className="flex flex-wrap items-center gap-3 text-xs">
              {/* Status Badge */}
              <span
                className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[var(--${statusConfig.color}-4)] text-[var(--${statusConfig.color}-11)]`}
              >
                {statusConfig.icon}
                {statusConfig.label}
              </span>

              {/* Priority */}
              {initiative.priority > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--amber-4)] text-[var(--amber-11)]">
                  Priority: {initiative.priority}
                </span>
              )}

              {/* Effort */}
              {initiative.estimated_effort && (
                <span className="text-[var(--text-tertiary)]">
                  {EFFORT_LABELS[initiative.estimated_effort] || initiative.estimated_effort}
                </span>
              )}

              {/* Board Decision */}
              {initiative.board_decision && (
                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-[var(--evergreen-4)] text-[var(--evergreen-11)]">
                  <Users className="w-3 h-3" />
                  {initiative.board_decision}
                </span>
              )}

              {/* Overall Score */}
              {initiative.overall_score && (
                <span className="text-[var(--text-tertiary)]">
                  Score: {initiative.overall_score}/50
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <Link
            href={`/admin/strategy/initiatives/${initiative.slug}`}
            className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-[var(--evergreen-11)] hover:bg-[var(--evergreen-4)] rounded-lg transition-colors shrink-0"
          >
            View
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
