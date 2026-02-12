'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import {
  Check,
  Clock,
  Share2,
  Twitter,
  Mail,
  Copy,
  Users,
  Sparkles,
  ArrowRight,
  UserPlus,
  Zap,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { analytics } from '@/lib/analytics';
import BetaCapacityCounter from '@/components/BetaCapacityCounter';
import ReferralNotifications from '@/components/ReferralNotifications';
import CustomCodeClaim from './components/CustomCodeClaim';
import ScorecardHero from './components/ScorecardHero';
import CategoryBreakdown from './components/CategoryBreakdown';
import TopOpportunities from './components/TopOpportunities';
import type {
  BetaCapacity,
  ApplicationStats,
  BetaDeadline,
  RecentApproval,
  ReferralTierInfo,
  ScorecardResult,
} from '@/lib/types/beta';

// Helper to format relative time
function formatRelativeTime(dateString: string): string {
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

// Helper to format creator type for display
function formatCreatorType(type: string): string {
  const types: Record<string, string> = {
    professional_creator: 'Professional Creator',
    serious_hobbyist: 'Serious Hobbyist',
    brand_ambassador: 'Brand Ambassador',
    building_audience: 'Audience Builder',
  };
  return types[type] || type;
}

// Helper to format niche for display
function formatNiche(niche: string): string {
  const niches: Record<string, string> = {
    golf: 'Golf',
    tech_gadgets: 'Tech',
    fashion: 'Fashion',
    outdoor_adventure: 'Outdoor',
    home_office: 'Home Office',
    fitness: 'Fitness',
    other: 'Creator',
  };
  return niches[niche] || niche;
}

// Tier badge colors
function getTierBadgeStyles(color: string): string {
  const styles: Record<string, string> = {
    gray: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300',
    green: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300',
    gold: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
  };
  return styles[color] || styles.gray;
}

// Approval odds color
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

export default function SuccessContent() {
  const searchParams = useSearchParams();
  const position = searchParams.get('position');
  const applicationId = searchParams.get('id');
  const approvedParam = searchParams.get('approved') === 'true';
  const [copied, setCopied] = useState(false);
  const [capacity, setCapacity] = useState<BetaCapacity | null>(null);
  const [stats, setStats] = useState<ApplicationStats | null>(null);
  const [deadline, setDeadline] = useState<BetaDeadline | null>(null);
  const [recentApprovals, setRecentApprovals] = useState<RecentApproval[]>([]);
  const [scorecard, setScorecard] = useState<ScorecardResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [customCode, setCustomCode] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      try {
        // Fetch all data in parallel
        const [capacityRes, statsRes, deadlineRes, approvalsRes, scorecardRes] =
          await Promise.all([
            fetch('/api/beta/capacity'),
            applicationId
              ? fetch(`/api/beta/applications/${applicationId}/stats`)
              : Promise.resolve(null),
            fetch('/api/beta/deadline'),
            fetch('/api/beta/approvals/recent?limit=3'),
            applicationId
              ? fetch(`/api/beta/applications/${applicationId}/scorecard`)
              : Promise.resolve(null),
          ]);

        const capacityData = await capacityRes.json();
        setCapacity(capacityData);

        if (statsRes) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        const deadlineData = await deadlineRes.json();
        setDeadline(deadlineData);

        const approvalsData = await approvalsRes.json();
        setRecentApprovals(approvalsData.approvals || []);

        if (scorecardRes) {
          const scorecardData = await scorecardRes.json();
          setScorecard(scorecardData.scorecard || null);
        }

        // Send confirmation email (fire-and-forget, don't block UI)
        if (applicationId) {
          fetch('/api/beta/applications/notify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ applicationId }),
          }).catch((err) => {
            console.error('Failed to send confirmation email:', err);
          });
        }
      } catch (err) {
        console.error('Failed to fetch data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    analytics.pageViewed('apply_success', { application_id: applicationId });
  }, [applicationId]);

  const referralLink =
    typeof window !== 'undefined'
      ? `${window.location.origin}/apply?ref=${customCode || applicationId}`
      : '';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      if (applicationId) analytics.referralShared(applicationId, 'copy_link');
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const shareText =
    "I just applied for founding member access to @teedclub - a beautiful way to share your favorite products. Limited spots available!";

  // Determine states
  const isBetaFull = capacity?.is_at_capacity;
  const hasInstantApproval = approvedParam || stats?.has_instant_approval;
  const approvalOdds = stats?.approval_odds ?? 50;
  const currentTier = stats?.current_tier;
  const nextTier = stats?.next_tier;
  const successfulReferrals = stats?.successful_referrals ?? 0;
  const referralsUntilChampion = stats?.referrals_until_instant_approval ?? 5;

  return (
    <div className="min-h-screen bg-gradient-to-b from-[var(--bg-page)] to-[var(--teed-green-1)]">
      <div className="max-w-2xl mx-auto px-4 py-16">
        {/* Success Header */}
        <div className="text-center mb-8">
          {/* Success icon */}
          <div className="relative inline-block mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[var(--teed-green-6)] to-[var(--teed-green-9)] rounded-full flex items-center justify-center">
              <Check className="w-10 h-10 text-white" />
            </div>
            {/* Decorative rings */}
            <div className="absolute inset-0 -m-2 rounded-full border-2 border-[var(--teed-green-4)] animate-pulse" />
            <div className="absolute inset-0 -m-4 rounded-full border border-[var(--teed-green-3)]" />
          </div>

          <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-2">
            {hasInstantApproval
              ? "You're in!"
              : isBetaFull
                ? "You're on the waitlist"
                : 'Application received'}
          </h1>

          <p className="text-lg text-[var(--text-secondary)]">
            {hasInstantApproval
              ? 'Welcome to the founding cohort! Your account is ready to go.'
              : isBetaFull
                ? "The founding cohort is full, but you're on our list for the next wave."
                : 'Your application is being reviewed.'}
          </p>

          {hasInstantApproval && (
            <Link href="/dashboard">
              <Button variant="create" className="mt-4">
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          )}
        </div>

        {/* Creator Scorecard */}
        {scorecard && (
          <>
            <ScorecardHero
              overallScore={scorecard.overallScore}
              persona={scorecard.persona}
              percentile={scorecard.percentile}
              mode={scorecard.mode}
              onShare={() => {
                // Share scorecard - could open share modal or copy link
                const shareUrl = `${window.location.origin}/apply/success?id=${applicationId}`;
                navigator.clipboard.writeText(shareUrl);
              }}
            />

            <CategoryBreakdown
              categoryScores={scorecard.categoryScores}
              mode={scorecard.mode}
            />

            <TopOpportunities opportunities={scorecard.topOpportunities} />
          </>
        )}

        {/* Approval Odds Card (only if not instant approved) */}
        {!hasInstantApproval && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-[var(--text-primary)]">
                Your Approval Odds
              </h3>
              {currentTier && currentTier.tier > 0 && (
                <span
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${getTierBadgeStyles(currentTier.badge_color)}`}
                >
                  {currentTier.name}
                </span>
              )}
            </div>

            {/* Odds display */}
            <div className="mb-4">
              <div className="flex items-baseline gap-2 mb-2">
                <span
                  className={`text-4xl font-bold ${getOddsColor(approvalOdds)}`}
                >
                  {approvalOdds}%
                </span>
                <span className="text-sm text-[var(--text-tertiary)]">
                  chance of approval
                </span>
              </div>

              {/* Progress bar */}
              <div className="h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getOddsBarColor(approvalOdds)} transition-all duration-500`}
                  style={{ width: `${approvalOdds}%` }}
                />
              </div>
            </div>

            {/* Path to instant approval */}
            <div className="border-t border-[var(--border-subtle)] pt-4">
              <div className="flex items-center gap-2 text-sm text-[var(--text-secondary)] mb-3">
                <Zap className="w-4 h-4 text-purple-500" />
                <span>Path to instant approval</span>
              </div>

              <div className="space-y-2">
                {/* Current referrals progress */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-[var(--teed-green-1)] dark:bg-zinc-800">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--teed-green-9)] text-white flex items-center justify-center">
                      <Users className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">
                        Refer {referralsUntilChampion} more{' '}
                        {referralsUntilChampion === 1 ? 'friend' : 'friends'}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)]">
                        {successfulReferrals > 0
                          ? `${successfulReferrals} successful so far`
                          : 'Skip the review queue entirely'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium text-purple-600 bg-purple-50 dark:bg-purple-900/30 px-2 py-1 rounded">
                      Instant approval
                    </span>
                    <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)]" />
                  </div>
                </div>

                {/* Current tier progress */}
                {nextTier && currentTier && currentTier.tier < 3 && (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-zinc-800/50">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <UserPlus className="w-4 h-4 text-gray-600 dark:text-gray-400" />
                      </div>
                      <div>
                        <p className="font-medium text-[var(--text-primary)]">
                          Refer{' '}
                          {stats?.referrals_until_next_tier ??
                            nextTier.tier -
                              (currentTier.tier === 0
                                ? 0
                                : currentTier.tier === 1
                                  ? 1
                                  : 3)}{' '}
                          friend to unlock {nextTier.name}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)]">
                          {nextTier.benefits[0]}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-[var(--text-tertiary)]" />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Share & Move Up Card */}
        <div className="bg-gradient-to-br from-[var(--sky-2)] to-[var(--teed-green-2)] rounded-2xl p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm">
              <Share2 className="w-6 h-6 text-[var(--teed-green-9)]" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-[var(--text-primary)] mb-1">
                {hasInstantApproval
                  ? 'Share with friends'
                  : referralsUntilChampion <= 2
                    ? `Only ${referralsUntilChampion} more for instant approval!`
                    : 'Move up with referrals'}
              </h3>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                {hasInstantApproval
                  ? 'Help friends join the founding cohort'
                  : `Each friend who applies improves your odds. ${referralsUntilChampion} referrals = guaranteed approval.`}
              </p>

              {/* Referral link preview */}
              <div className="bg-white/80 dark:bg-black/20 rounded-lg p-3 mb-3">
                <p className="text-xs text-[var(--text-tertiary)] mb-1">
                  Your referral link
                </p>
                <p className="text-sm font-mono text-[var(--text-primary)] truncate">
                  {referralLink}
                </p>
              </div>

              {/* Custom code claim */}
              {applicationId && (
                <div className="mb-4">
                  <CustomCodeClaim
                    applicationId={applicationId}
                    currentCode={customCode}
                    onCodeClaimed={(code) => setCustomCode(code)}
                  />
                </div>
              )}

              {/* Share buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleCopyLink}
                  className="gap-2"
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

                <a
                  href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(referralLink)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => applicationId && analytics.referralShared(applicationId, 'twitter')}
                >
                  <Button variant="secondary" size="sm" className="gap-2">
                    <Twitter className="w-4 h-4" />
                    Tweet
                  </Button>
                </a>

                <a
                  href={`mailto:?subject=Join Teed with me&body=${encodeURIComponent(`Hey! I just applied to Teed, a beautiful way to share your favorite products. Apply with my link and we both benefit:\n\n${referralLink}\n\nIf 5 friends join, I get instant approval - help me out!`)}`}
                  onClick={() => applicationId && analytics.referralShared(applicationId, 'email')}
                >
                  <Button variant="secondary" size="sm" className="gap-2">
                    <Mail className="w-4 h-4" />
                    Email
                  </Button>
                </a>
              </div>

              {/* Referral stats - DOCTRINE: simple count, no leaderboard */}
              {successfulReferrals > 0 && (
                <div className="mt-4 pt-4 border-t border-white/30">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-[var(--teed-green-9)]" />
                    <span className="text-sm font-medium text-[var(--text-primary)]">
                      {successfulReferrals} successful{' '}
                      {successfulReferrals === 1 ? 'referral' : 'referrals'}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Approvals - Social Proof */}
        {recentApprovals.length > 0 && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-500" />
              Recently Approved
            </h3>

            <div className="space-y-3">
              {recentApprovals.map((approval, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-zinc-800"
                >
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[var(--teed-green-5)] to-[var(--teed-green-7)] flex items-center justify-center text-white font-semibold">
                    {approval.first_name[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-[var(--text-primary)]">
                      {approval.first_name}
                    </p>
                    <p className="text-xs text-[var(--text-tertiary)]">
                      {formatCreatorType(approval.creator_type)} •{' '}
                      {formatNiche(approval.niche)}
                    </p>
                  </div>
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {formatRelativeTime(approval.approved_at)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* What Happens Next */}
        {!hasInstantApproval && (
          <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6 mb-6">
            <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              What happens next?
            </h3>
            <ol className="space-y-4">
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-[var(--teed-green-9)] text-white flex items-center justify-center text-sm font-medium shrink-0">
                  1
                </span>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    We review applications weekly
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Higher-priority applications are reviewed first
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-[var(--sand-6)] text-[var(--sand-12)] flex items-center justify-center text-sm font-medium shrink-0">
                  2
                </span>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    Sign in anytime to check your status
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Your account is ready — just sign in at{' '}
                    <Link href="/login" className="text-[var(--teed-green-9)] hover:underline">
                      /login
                    </Link>
                  </p>
                </div>
              </li>
              <li className="flex gap-3">
                <span className="w-6 h-6 rounded-full bg-[var(--sand-6)] text-[var(--sand-12)] flex items-center justify-center text-sm font-medium shrink-0">
                  3
                </span>
                <div>
                  <p className="font-medium text-[var(--text-primary)]">
                    If accepted, you can start curating immediately
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    No extra steps needed — your account is already set up
                  </p>
                </div>
              </li>
            </ol>
          </div>
        )}

        {/* Current Capacity */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6 mb-6">
          <h3 className="font-semibold text-[var(--text-primary)] mb-4 text-center">
            Founding Cohort Status
          </h3>
          <BetaCapacityCounter />

          {/* Deadline notice */}
          {deadline?.has_deadline && !deadline.is_expired && (
            <div
              className={`mt-4 p-3 rounded-lg text-center ${
                deadline.is_urgent
                  ? 'bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300'
                  : 'bg-gray-50 dark:bg-gray-800 text-[var(--text-secondary)]'
              }`}
            >
              <p className="text-sm font-medium">{deadline.message}</p>
              {deadline.is_urgent && (
                <p className="text-xs mt-1 opacity-80">
                  Share now to maximize your referrals!
                </p>
              )}
            </div>
          )}
        </div>

        {/* Browse while you wait */}
        <div className="text-center">
          <p className="text-sm text-[var(--text-tertiary)] mb-4">
            {hasInstantApproval
              ? "You're in! Start exploring:"
              : 'While you wait, explore what others are curating:'}
          </p>
          <Link href="/discover">
            <Button variant="ghost">Browse Discover</Button>
          </Link>
        </div>
      </div>

      {/* Real-time notifications */}
      {applicationId && (
        <ReferralNotifications
          applicationId={applicationId}
          onNotification={(notification) => {
            // Refresh stats when a referral is received
            if (notification.type === 'referral_applied') {
              // Trigger a refresh of stats
              window.location.reload();
            }
          }}
        />
      )}
    </div>
  );
}
