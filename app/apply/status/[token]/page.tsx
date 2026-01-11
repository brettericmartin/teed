'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  Clock,
  Check,
  X,
  Users,
  Zap,
  Share2,
  Copy,
  Trophy,
  ArrowRight,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import BetaCapacityCounter from '@/components/BetaCapacityCounter';

interface ApplicationStatus {
  found: boolean;
  application_id: string;
  status: 'pending' | 'approved' | 'rejected' | 'waitlisted';
  first_name: string;
  creator_type: string;
  position_in_queue: number | null;
  total_pending: number | null;
  priority_score: number;
  approval_odds: number;
  referrals: number;
  referral_tier: number;
  referrals_for_instant: number;
  applied_at: string;
}

const TIER_NAMES = ['Standard', 'Engaged', 'Connector', 'Champion', 'Legend'];

function StatusBadge({ status }: { status: string }) {
  const config = {
    pending: {
      bg: 'bg-amber-100 dark:bg-amber-900/30',
      text: 'text-amber-700 dark:text-amber-300',
      icon: Clock,
      label: 'Under Review',
    },
    approved: {
      bg: 'bg-green-100 dark:bg-green-900/30',
      text: 'text-green-700 dark:text-green-300',
      icon: Check,
      label: 'Approved',
    },
    rejected: {
      bg: 'bg-red-100 dark:bg-red-900/30',
      text: 'text-red-700 dark:text-red-300',
      icon: X,
      label: 'Not Selected',
    },
    waitlisted: {
      bg: 'bg-sky-100 dark:bg-sky-900/30',
      text: 'text-sky-700 dark:text-sky-300',
      icon: Clock,
      label: 'Waitlisted',
    },
  };

  const c = config[status as keyof typeof config] || config.pending;
  const Icon = c.icon;

  return (
    <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${c.bg} ${c.text}`}>
      <Icon className="w-5 h-5" />
      <span className="font-medium">{c.label}</span>
    </div>
  );
}

function OddsBar({ odds }: { odds: number }) {
  const getColor = () => {
    if (odds >= 80) return 'bg-green-500';
    if (odds >= 60) return 'bg-teal-500';
    if (odds >= 40) return 'bg-amber-500';
    return 'bg-orange-500';
  };

  return (
    <div className="w-full">
      <div className="flex justify-between mb-2">
        <span className="text-sm text-[var(--text-secondary)]">Approval Odds</span>
        <span className={`text-lg font-bold ${
          odds >= 80 ? 'text-green-600' :
          odds >= 60 ? 'text-teal-600' :
          odds >= 40 ? 'text-amber-600' : 'text-orange-600'
        }`}>
          {odds}%
        </span>
      </div>
      <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
        <div
          className={`h-full ${getColor()} transition-all duration-500`}
          style={{ width: `${odds}%` }}
        />
      </div>
    </div>
  );
}

export default function StatusPage() {
  const params = useParams();
  const token = params.token as string;

  const [status, setStatus] = useState<ApplicationStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const res = await fetch(`/api/beta/status/${token}`);
        if (!res.ok) {
          if (res.status === 404) {
            setError('Invalid or expired status link');
          } else {
            setError('Failed to load status');
          }
          return;
        }
        const data = await res.json();
        setStatus(data);
      } catch (err) {
        console.error('Failed to fetch status:', err);
        setError('Failed to load status');
      } finally {
        setLoading(false);
      }
    };

    if (token) {
      fetchStatus();
    }
  }, [token]);

  const referralLink = status?.application_id
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/apply?ref=${status.application_id}`
    : '';

  const handleCopyLink = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--bg-page)] to-[var(--teed-green-1)] flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-3 border-[var(--teed-green-6)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[var(--text-secondary)]">Loading your status...</p>
        </div>
      </div>
    );
  }

  if (error || !status) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[var(--bg-page)] to-[var(--teed-green-1)] flex items-center justify-center p-4">
        <div className="bg-white dark:bg-zinc-900 rounded-2xl p-8 shadow-lg max-w-md w-full text-center">
          <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-600 dark:text-red-400" />
          </div>
          <h1 className="text-xl font-bold text-[var(--text-primary)] mb-2">
            {error || 'Status Not Found'}
          </h1>
          <p className="text-[var(--text-secondary)] mb-6">
            This status link may be invalid or expired.
          </p>
          <Link href="/apply">
            <Button variant="create">Apply for Beta Access</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--bg-page)] to-[var(--teed-green-1)]">
      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <span className="text-3xl font-bold text-[var(--text-primary)]">Teed</span>
          </Link>

          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            Hey {status.first_name}!
          </h1>
          <p className="text-[var(--text-secondary)]">
            Here's the status of your application
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex flex-col items-center text-center mb-6">
            <StatusBadge status={status.status} />

            {status.status === 'pending' && status.position_in_queue && (
              <p className="mt-4 text-[var(--text-secondary)]">
                Position <span className="font-bold text-[var(--text-primary)]">#{status.position_in_queue}</span> of {status.total_pending} pending applications
              </p>
            )}

            {status.status === 'approved' && (
              <p className="mt-4 text-green-600 dark:text-green-400">
                Check your email for your invite code!
              </p>
            )}
          </div>

          {/* Stats Grid */}
          {status.status === 'pending' && (
            <>
              <div className="border-t border-[var(--border-subtle)] pt-6 mb-6">
                <OddsBar odds={status.approval_odds} />
              </div>

              <div className="grid grid-cols-3 gap-4 text-center mb-6">
                <div>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">
                    {status.priority_score}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">Priority Score</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">
                    {status.referrals}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">Referrals</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">
                    {TIER_NAMES[status.referral_tier]}
                  </p>
                  <p className="text-xs text-[var(--text-tertiary)]">Tier</p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Improve Odds Card */}
        {status.status === 'pending' && (
          <div className="bg-gradient-to-br from-[var(--teed-green-2)] to-[var(--sky-2)] rounded-2xl p-6 mb-6">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-500" />
              Improve Your Odds
            </h3>

            {status.referrals_for_instant > 0 ? (
              <div className="bg-white/70 dark:bg-black/20 rounded-xl p-4 mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    Referrals to Instant Approval
                  </span>
                  <span className="text-sm text-[var(--text-secondary)]">
                    {status.referrals}/{5}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-[var(--teed-green-8)] to-purple-500 transition-all"
                    style={{ width: `${(status.referrals / 5) * 100}%` }}
                  />
                </div>
                <p className="text-sm text-[var(--text-secondary)]">
                  Refer {status.referrals_for_instant} more {status.referrals_for_instant === 1 ? 'friend' : 'friends'} for guaranteed approval!
                </p>
              </div>
            ) : (
              <div className="bg-purple-100 dark:bg-purple-900/30 rounded-xl p-4 mb-4 text-center">
                <Trophy className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                <p className="font-medium text-purple-700 dark:text-purple-300">
                  You've unlocked instant approval!
                </p>
              </div>
            )}

            {/* Share section */}
            <div className="bg-white/80 dark:bg-black/30 rounded-lg p-3 mb-3">
              <p className="text-xs text-[var(--text-tertiary)] mb-1">Your referral link</p>
              <p className="text-sm font-mono text-[var(--text-primary)] truncate">
                {referralLink}
              </p>
            </div>

            <Button
              variant="secondary"
              size="sm"
              onClick={handleCopyLink}
              className="w-full gap-2"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  Copy Link
                </>
              )}
            </Button>
          </div>
        )}

        {/* Capacity */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4 text-center">
            Founding Cohort Status
          </h3>
          <BetaCapacityCounter />
        </div>

        {/* Applied timestamp */}
        <p className="text-center text-sm text-[var(--text-tertiary)]">
          Applied on {new Date(status.applied_at).toLocaleDateString('en-US', {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>
    </div>
  );
}
