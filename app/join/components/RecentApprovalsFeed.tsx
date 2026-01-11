'use client';

import { useState, useEffect } from 'react';
import { CheckCircle, Sparkles } from 'lucide-react';

interface RecentApproval {
  first_name: string;
  creator_type: string;
  niche: string;
  audience_size: string;
  approved_at: string;
}

/**
 * RecentApprovalsFeed
 *
 * Displays a live feed of recent beta approvals to create social proof
 * and urgency on the /join page. Auto-refreshes every 30 seconds.
 */
export default function RecentApprovalsFeed() {
  const [approvals, setApprovals] = useState<RecentApproval[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchApprovals = async () => {
    try {
      const response = await fetch('/api/beta/approvals/recent?limit=5');
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setApprovals(data.approvals || []);
    } catch (error) {
      console.error('Error fetching recent approvals:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchApprovals, 30000);
    return () => clearInterval(interval);
  }, []);

  // Format relative time
  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    return `${diffDays}d ago`;
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 bg-gray-100 dark:bg-zinc-800 rounded-lg" />
        ))}
      </div>
    );
  }

  if (approvals.length === 0) {
    return null; // Don't show section if no approvals yet
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-center gap-2">
        <Sparkles className="w-5 h-5 text-[var(--teed-green-9)]" />
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          Recently Approved
        </h3>
      </div>

      {/* Approval cards */}
      <div className="space-y-2">
        {approvals.map((approval, index) => (
          <div
            key={`${approval.first_name}-${index}`}
            className="flex items-center gap-3 p-3 bg-white dark:bg-zinc-900 rounded-xl border border-[var(--border-subtle)] hover:border-[var(--teed-green-6)] transition-colors"
          >
            {/* Avatar placeholder with checkmark */}
            <div className="relative">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--teed-green-4)] to-[var(--teed-green-6)] flex items-center justify-center">
                <span className="text-sm font-bold text-[var(--teed-green-11)]">
                  {approval.first_name.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-[var(--teed-green-9)] rounded-full flex items-center justify-center">
                <CheckCircle className="w-3 h-3 text-white" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-medium text-[var(--text-primary)]">
                  {approval.first_name}
                </span>
                <span className="text-xs text-[var(--teed-green-9)] font-medium">
                  approved
                </span>
              </div>
              <div className="text-sm text-[var(--text-secondary)] truncate">
                {approval.creator_type}
                {approval.niche && ` · ${approval.niche}`}
              </div>
            </div>

            {/* Time */}
            <div className="text-xs text-[var(--text-tertiary)] whitespace-nowrap">
              {getRelativeTime(approval.approved_at)}
            </div>
          </div>
        ))}
      </div>

      {/* CTA hint */}
      <p className="text-center text-sm text-[var(--text-tertiary)]">
        Join them — apply for founding access
      </p>
    </div>
  );
}
