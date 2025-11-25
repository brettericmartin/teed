'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import FeedbackModal from './FeedbackModal';

interface Profile {
  id: string;
  handle: string;
  display_name: string;
  beta_tier: string | null;
  beta_approved_at: string | null;
}

interface BetaPoints {
  total_points: number;
  bugs_reported: number;
  features_suggested: number;
  bags_created: number;
  items_added: number;
  ai_uses: number;
  streak_days: number;
  max_streak: number;
  badges: string[];
}

interface LeaderboardEntry {
  rank: number;
  user_id: string;
  handle: string;
  display_name: string;
  total_points: number;
  badges: string[];
  streak_days: number;
}

interface Props {
  profile: Profile | null;
  points: BetaPoints | null;
  leaderboard: LeaderboardEntry[];
  userRank: number | null;
  userId: string;
}

const BADGES: Record<string, { name: string; icon: string; description: string }> = {
  founding_member: { name: 'Founding Member', icon: '🏆', description: 'One of the original beta testers' },
  bug_hunter: { name: 'Bug Hunter', icon: '🐛', description: 'Reported 5+ confirmed bugs' },
  visionary: { name: 'Visionary', icon: '💡', description: 'Suggested a feature that shipped' },
  on_fire: { name: 'On Fire', icon: '🔥', description: '7-day activity streak' },
  curator_pro: { name: 'Curator Pro', icon: '✨', description: 'Created 10+ bags' },
  feedback_champion: { name: 'Feedback Champion', icon: '🎯', description: 'Submitted 10+ feedback items' },
};

const TESTING_TASKS = [
  { id: 'create_bag', title: 'Create your first bag', points: 25, description: 'Add a new bag with at least 3 items' },
  { id: 'use_ai', title: 'Try AI identification', points: 15, description: 'Upload a photo and let AI identify items' },
  { id: 'share_bag', title: 'Share a bag', points: 20, description: 'Share a bag link on social media' },
  { id: 'submit_feedback', title: 'Submit feedback', points: 30, description: 'Report a bug or suggest a feature' },
  { id: 'invite_friend', title: 'Invite a friend', points: 50, description: 'Get someone to join using your referral' },
];

export default function BetaHubContent({ profile, points, leaderboard, userRank, userId }: Props) {
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackType, setFeedbackType] = useState<'bug' | 'feature' | 'question' | 'praise'>('bug');

  const userPoints = points?.total_points || 0;
  const userInLeaderboard = leaderboard.find((l) => l.user_id === userId);
  const displayRank = userInLeaderboard?.rank || userRank;

  const openFeedback = (type: 'bug' | 'feature' | 'question' | 'praise') => {
    setFeedbackType(type);
    setShowFeedbackModal(true);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-page)]">
      {/* Header */}
      <div className="bg-gradient-to-r from-[var(--teed-green-9)] to-[var(--teed-green-8)] text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <Link href="/dashboard" className="text-white/80 hover:text-white flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Dashboard
            </Link>
            <span className="text-sm font-medium px-3 py-1 bg-white/20 rounded-full">
              {profile?.beta_tier || 'Beta Tester'}
            </span>
          </div>
          <h1 className="text-3xl font-bold mb-2">Beta Hub</h1>
          <p className="text-white/80">Welcome back, {profile?.display_name || profile?.handle}!</p>

          {/* Points Summary */}
          <div className="mt-6 grid grid-cols-3 gap-4">
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">{userPoints}</div>
              <div className="text-sm text-white/70">Total Points</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">#{displayRank || '-'}</div>
              <div className="text-sm text-white/70">Rank</div>
            </div>
            <div className="bg-white/10 rounded-xl p-4 text-center">
              <div className="text-3xl font-bold">{points?.streak_days || 0}</div>
              <div className="text-sm text-white/70">Day Streak</div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Quick Actions */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => openFeedback('bug')}
                  className="p-4 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-left"
                >
                  <span className="text-2xl mb-2 block">🐛</span>
                  <span className="font-medium text-[var(--text-primary)]">Report Bug</span>
                  <span className="text-sm text-[var(--text-secondary)] block">+30 pts</span>
                </button>
                <button
                  onClick={() => openFeedback('feature')}
                  className="p-4 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-left"
                >
                  <span className="text-2xl mb-2 block">💡</span>
                  <span className="font-medium text-[var(--text-primary)]">Suggest Feature</span>
                  <span className="text-sm text-[var(--text-secondary)] block">+20 pts</span>
                </button>
                <button
                  onClick={() => openFeedback('question')}
                  className="p-4 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-left"
                >
                  <span className="text-2xl mb-2 block">❓</span>
                  <span className="font-medium text-[var(--text-primary)]">Ask Question</span>
                  <span className="text-sm text-[var(--text-secondary)] block">+5 pts</span>
                </button>
                <button
                  onClick={() => openFeedback('praise')}
                  className="p-4 border border-gray-200 dark:border-zinc-700 rounded-xl hover:bg-gray-50 dark:hover:bg-zinc-800 transition-colors text-left"
                >
                  <span className="text-2xl mb-2 block">💚</span>
                  <span className="font-medium text-[var(--text-primary)]">Share Praise</span>
                  <span className="text-sm text-[var(--text-secondary)] block">+10 pts</span>
                </button>
              </div>
            </div>

            {/* Testing Tasks */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Testing Tasks</h2>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                Complete these tasks to earn points and help us improve Teed.
              </p>
              <div className="space-y-3">
                {TESTING_TASKS.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-3 border border-gray-200 dark:border-zinc-700 rounded-lg"
                  >
                    <div>
                      <p className="font-medium text-[var(--text-primary)]">{task.title}</p>
                      <p className="text-sm text-[var(--text-secondary)]">{task.description}</p>
                    </div>
                    <span className="text-sm font-semibold text-[var(--teed-green-9)]">+{task.points}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* How to Test */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">How to Be a Great Tester</h2>
              <div className="space-y-4 text-sm text-[var(--text-secondary)]">
                <div className="flex gap-3">
                  <span className="text-lg">1.</span>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">Try Everything</p>
                    <p>Click every button, try edge cases, use features in unexpected ways.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-lg">2.</span>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">Be Specific</p>
                    <p>When reporting bugs, include steps to reproduce, device info, and screenshots.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-lg">3.</span>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">Think Like a User</p>
                    <p>What would confuse someone new? What's missing that you'd expect?</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="text-lg">4.</span>
                  <div>
                    <p className="font-medium text-[var(--text-primary)]">Share Your Experience</p>
                    <p>Both good and bad feedback helps us build something great.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Badges */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Your Badges</h2>
              {points?.badges && points.badges.length > 0 ? (
                <div className="space-y-3">
                  {points.badges.map((badgeId) => {
                    const badge = BADGES[badgeId];
                    if (!badge) return null;
                    return (
                      <div key={badgeId} className="flex items-center gap-3">
                        <span className="text-2xl">{badge.icon}</span>
                        <div>
                          <p className="font-medium text-[var(--text-primary)]">{badge.name}</p>
                          <p className="text-xs text-[var(--text-secondary)]">{badge.description}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-[var(--text-secondary)]">
                  Complete tasks and submit feedback to earn badges!
                </p>
              )}
            </div>

            {/* Leaderboard */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Leaderboard</h2>
              <div className="space-y-2">
                {leaderboard.slice(0, 5).map((entry, i) => (
                  <div
                    key={entry.user_id}
                    className={`flex items-center justify-between p-2 rounded-lg ${
                      entry.user_id === userId ? 'bg-[var(--teed-green-2)]' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className={`w-6 text-center font-bold ${i < 3 ? 'text-[var(--teed-green-9)]' : 'text-[var(--text-secondary)]'}`}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : entry.rank}
                      </span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">
                        {entry.handle}
                      </span>
                    </div>
                    <span className="text-sm text-[var(--text-secondary)]">{entry.total_points} pts</span>
                  </div>
                ))}
              </div>
              {displayRank && displayRank > 5 && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-zinc-800">
                  <div className="flex items-center justify-between p-2 bg-[var(--teed-green-2)] rounded-lg">
                    <div className="flex items-center gap-3">
                      <span className="w-6 text-center font-bold text-[var(--text-secondary)]">{displayRank}</span>
                      <span className="text-sm font-medium text-[var(--text-primary)]">You</span>
                    </div>
                    <span className="text-sm text-[var(--text-secondary)]">{userPoints} pts</span>
                  </div>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="bg-white dark:bg-zinc-900 rounded-xl shadow-sm p-6">
              <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">Your Activity</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Bugs Reported</span>
                  <span className="font-medium text-[var(--text-primary)]">{points?.bugs_reported || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Features Suggested</span>
                  <span className="font-medium text-[var(--text-primary)]">{points?.features_suggested || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Bags Created</span>
                  <span className="font-medium text-[var(--text-primary)]">{points?.bags_created || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">AI Uses</span>
                  <span className="font-medium text-[var(--text-primary)]">{points?.ai_uses || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Best Streak</span>
                  <span className="font-medium text-[var(--text-primary)]">{points?.max_streak || 0} days</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <FeedbackModal
          type={feedbackType}
          userId={userId}
          onClose={() => setShowFeedbackModal(false)}
        />
      )}
    </div>
  );
}
