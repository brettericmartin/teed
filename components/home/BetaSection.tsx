'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Zap, Users, ChevronRight } from 'lucide-react';
import BetaCapacityCounter from '@/components/BetaCapacityCounter';
import type { RecentApproval } from '@/lib/types/beta';

/**
 * BetaSection
 *
 * Prominent beta/waitlist section for the homepage showing:
 * - Live capacity counter
 * - Recent approvals (social proof)
 * - Dual CTA (Apply + Have code)
 */
export default function BetaSection() {
  const [recentApprovals, setRecentApprovals] = useState<RecentApproval[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchApprovals = async () => {
      try {
        const res = await fetch('/api/beta/approvals/recent?limit=5');
        if (res.ok) {
          const data = await res.json();
          setRecentApprovals(data.approvals || []);
        }
      } catch (err) {
        console.error('Failed to fetch approvals:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchApprovals();

    // Refresh every 30 seconds
    const interval = setInterval(fetchApprovals, 30000);
    return () => clearInterval(interval);
  }, []);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[var(--teed-green-1)] to-[var(--surface)]">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[var(--teed-green-2)] border border-[var(--teed-green-6)] mb-4">
            <Zap className="w-4 h-4 text-[var(--teed-green-9)]" />
            <span className="text-sm font-medium text-[var(--teed-green-11)]">
              Limited Founding Member Access
            </span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold text-[var(--text-primary)] mb-3">
            Join the Founding Cohort
          </h2>
          <p className="text-lg text-[var(--text-secondary)] max-w-2xl mx-auto">
            Be among the first 50 creators to shape the future of product curation.
            Founding members get exclusive perks and lifetime benefits.
          </p>
        </div>

        {/* Capacity Counter */}
        <div className="mb-8">
          <BetaCapacityCounter className="max-w-md mx-auto" />
        </div>

        {/* Recent Approvals */}
        {!isLoading && recentApprovals.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-center gap-2 mb-4">
              <Users className="w-4 h-4 text-[var(--text-tertiary)]" />
              <span className="text-sm text-[var(--text-tertiary)]">
                Recently approved
              </span>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              {recentApprovals.slice(0, 5).map((approval, idx) => (
                <div
                  key={`${approval.first_name}-${idx}`}
                  className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[var(--surface)] border border-[var(--border-subtle)] text-sm"
                >
                  <div className="w-6 h-6 rounded-full bg-gradient-to-br from-[var(--teed-green-6)] to-[var(--teed-green-8)] flex items-center justify-center text-white text-xs font-medium">
                    {approval.first_name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <span className="text-[var(--text-primary)] font-medium">
                    {approval.first_name}
                  </span>
                  <span className="text-[var(--text-tertiary)]">·</span>
                  <span className="text-[var(--text-secondary)]">
                    {approval.creator_type || 'Creator'}
                  </span>
                  <span className="text-[var(--text-tertiary)]">·</span>
                  <span className="text-[var(--text-tertiary)]">
                    {formatTimeAgo(approval.approved_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Dual CTA */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/apply"
            className="flex items-center gap-2 px-8 py-4 bg-[var(--teed-green-9)] text-white font-semibold rounded-xl hover:bg-[var(--teed-green-10)] transition-all shadow-lg hover:shadow-xl hover:scale-105"
          >
            Apply for Access
            <ChevronRight className="w-5 h-5" />
          </Link>
          <Link
            href="/join"
            className="flex items-center gap-2 px-8 py-4 bg-[var(--surface)] border-2 border-[var(--border-subtle)] text-[var(--text-primary)] font-semibold rounded-xl hover:border-[var(--teed-green-6)] hover:bg-[var(--teed-green-1)] transition-all"
          >
            Have an invite code?
          </Link>
        </div>

        {/* Benefit highlights */}
        <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          {[
            { label: 'Lifetime Free', desc: 'All features, forever' },
            { label: 'Early Access', desc: 'New features first' },
            { label: 'Founding Badge', desc: 'Exclusive profile badge' },
            { label: 'Direct Input', desc: 'Shape the product' },
          ].map((benefit, idx) => (
            <div key={idx} className="p-4">
              <p className="text-sm font-semibold text-[var(--teed-green-11)]">
                {benefit.label}
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-1">
                {benefit.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
