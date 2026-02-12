'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabaseClient';
import { Clock, RefreshCw, LogOut } from 'lucide-react';

interface BetaGateProps {
  userEmail: string;
  userName: string;
  application: {
    id: string;
    status: string;
    waitlist_position: number | null;
    priority_score: number | null;
    approval_odds_percent: number | null;
  };
}

function getOddsColor(odds: number): string {
  if (odds >= 80) return 'text-emerald-600';
  if (odds >= 60) return 'text-teal-600';
  if (odds >= 40) return 'text-amber-600';
  return 'text-orange-600';
}

function getOddsBarColor(odds: number): string {
  if (odds >= 80) return 'bg-emerald-500';
  if (odds >= 60) return 'bg-teal-500';
  if (odds >= 40) return 'bg-amber-500';
  return 'bg-orange-500';
}

function getStatusLabel(status: string): string {
  switch (status) {
    case 'pending': return 'Under Review';
    case 'waitlisted': return 'Waitlisted';
    default: return status;
  }
}

export default function BetaGate({ userEmail, userName, application }: BetaGateProps) {
  const router = useRouter();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    router.refresh();
    // Small delay so the spinner is visible
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  const odds = application.approval_odds_percent ?? 50;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--bg-page)] to-[var(--sky-2)]">
      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-[var(--text-primary)] mb-4">
            Welcome, {userName}
          </h1>
          <p className="text-lg text-[var(--text-secondary)]">
            Your application is being reviewed. We'll let you know when it's your turn.
          </p>
        </div>

        {/* Status Card */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">
                  {getStatusLabel(application.status)}
                </h2>
                {application.waitlist_position && (
                  <p className="text-sm text-[var(--text-secondary)]">
                    Position #{application.waitlist_position}
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-50"
              title="Check for updates"
            >
              <RefreshCw className={`w-5 h-5 text-[var(--text-tertiary)] ${isRefreshing ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Approval Odds */}
          <div className="mb-6">
            <div className="flex items-baseline gap-2 mb-2">
              <span className={`text-3xl font-bold ${getOddsColor(odds)}`}>
                {odds}%
              </span>
              <span className="text-sm text-[var(--text-tertiary)]">
                approval odds
              </span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
              <div
                className={`h-full ${getOddsBarColor(odds)} transition-all duration-500`}
                style={{ width: `${odds}%` }}
              />
            </div>
          </div>

          {/* Stats Grid */}
          {application.priority_score !== null && (
            <div className="grid grid-cols-2 gap-4 mb-6 pt-6 border-t border-[var(--border-subtle)]">
              <div className="text-center p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                <p className="text-2xl font-bold text-[var(--text-primary)]">{application.priority_score}</p>
                <p className="text-xs text-[var(--text-tertiary)]">Priority Score</p>
              </div>
              <div className="text-center p-3 bg-gray-50 dark:bg-zinc-800 rounded-lg">
                <p className="text-2xl font-bold text-[var(--text-primary)]">#{application.waitlist_position || '—'}</p>
                <p className="text-xs text-[var(--text-tertiary)]">Queue Position</p>
              </div>
            </div>
          )}

          {/* Info */}
          <div className="bg-[var(--sky-2)] dark:bg-[var(--sky-3)] rounded-xl p-5 mb-6">
            <h3 className="font-semibold text-[var(--text-primary)] mb-3">While you wait:</h3>
            <ul className="space-y-2 text-sm text-[var(--text-secondary)]">
              <li className="flex items-start gap-2">
                <span className="text-[var(--teed-green-9)]">1.</span>
                <span>Share your referral link to move up the queue</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--teed-green-9)]">2.</span>
                <span>We review applications regularly</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--teed-green-9)]">3.</span>
                <span>You'll get an email at <span className="font-medium">{userEmail}</span> when approved</span>
              </li>
            </ul>
          </div>

          <Button variant="secondary" onClick={handleSignOut} className="w-full gap-2">
            <LogOut className="w-4 h-4" />
            Sign Out
          </Button>
        </div>

        {/* Features Preview */}
        <div className="mt-12 grid md:grid-cols-3 gap-6">
          <div className="bg-white/50 dark:bg-zinc-900/50 rounded-xl p-6 text-center">
            <div className="text-3xl mb-3">📸</div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">AI-Powered</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Upload a photo and let AI identify all your items
            </p>
          </div>
          <div className="bg-white/50 dark:bg-zinc-900/50 rounded-xl p-6 text-center">
            <div className="text-3xl mb-3">🔗</div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Share Anywhere</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Beautiful shareable pages for your curated collections
            </p>
          </div>
          <div className="bg-white/50 dark:bg-zinc-900/50 rounded-xl p-6 text-center">
            <div className="text-3xl mb-3">💰</div>
            <h3 className="font-semibold text-[var(--text-primary)] mb-2">Monetize</h3>
            <p className="text-sm text-[var(--text-secondary)]">
              Earn from your recommendations with built-in affiliate links
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
