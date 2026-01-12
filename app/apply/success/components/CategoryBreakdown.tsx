'use client';

import type { CategoryScores, ScorecardMode } from '@/lib/types/beta';
import { getCategoryFeedback } from '@/lib/scorecard';

interface CategoryBreakdownProps {
  categoryScores: CategoryScores;
  mode: ScorecardMode;
}

// Get color for score bar
function getScoreBarColor(score: number): string {
  if (score >= 80) return 'bg-emerald-500';
  if (score >= 60) return 'bg-blue-500';
  if (score >= 40) return 'bg-amber-500';
  return 'bg-orange-400';
}

// Get text color for score
function getScoreTextColor(score: number): string {
  if (score >= 80) return 'text-emerald-600 dark:text-emerald-400';
  if (score >= 60) return 'text-blue-600 dark:text-blue-400';
  if (score >= 40) return 'text-amber-600 dark:text-amber-400';
  return 'text-orange-600 dark:text-orange-400';
}

// Category display info
const CATEGORY_INFO: Record<string, { label: string; icon: string }> = {
  organization: { label: 'Organization', icon: '📁' },
  sharing: { label: 'Sharing', icon: '📤' },
  monetization: { label: 'Monetization', icon: '💰' },
  impact: { label: 'Impact', icon: '✨' },
  documentation: { label: 'Documentation', icon: '📝' },
};

export default function CategoryBreakdown({
  categoryScores,
  mode,
}: CategoryBreakdownProps) {
  // Build the categories to display based on mode
  const thirdCategory = mode === 'monetization' ? 'monetization' : 'impact';
  const thirdScore =
    mode === 'monetization'
      ? categoryScores.monetization ?? 50
      : categoryScores.impact ?? 50;

  const categories = [
    { key: 'organization', score: categoryScores.organization },
    { key: 'sharing', score: categoryScores.sharing },
    { key: thirdCategory, score: thirdScore },
    { key: 'documentation', score: categoryScores.documentation },
  ];

  // Sort by score descending to show strengths first
  const sortedCategories = [...categories].sort((a, b) => b.score - a.score);

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6 mb-6">
      <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
        <span>Your Strengths</span>
      </h3>

      <div className="space-y-4">
        {sortedCategories.map(({ key, score }) => {
          const info = CATEGORY_INFO[key];
          const feedback = getCategoryFeedback(key, score);

          return (
            <div key={key}>
              {/* Label row */}
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className="text-base">{info.icon}</span>
                  <span className="text-sm font-medium text-[var(--text-primary)]">
                    {info.label}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-[var(--text-tertiary)]">
                    {feedback}
                  </span>
                  <span
                    className={`text-sm font-semibold ${getScoreTextColor(score)}`}
                  >
                    {score}
                  </span>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-2.5 bg-gray-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${getScoreBarColor(score)} transition-all duration-700 rounded-full`}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Mode context */}
      <p className="text-xs text-[var(--text-tertiary)] mt-4 text-center">
        {mode === 'monetization'
          ? 'Scored for creators focused on building revenue'
          : 'Scored for creators focused on helping their audience'}
      </p>
    </div>
  );
}
