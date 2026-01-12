'use client';

import { Folder, Share2, DollarSign, Users, Edit3, ArrowRight } from 'lucide-react';
import type { ScorecardOpportunity } from '@/lib/types/beta';

interface TopOpportunitiesProps {
  opportunities: ScorecardOpportunity[];
}

// Icon mapping
function getOpportunityIcon(iconName: string) {
  const icons: Record<string, React.ReactNode> = {
    folder: <Folder className="w-5 h-5" />,
    share: <Share2 className="w-5 h-5" />,
    'dollar-sign': <DollarSign className="w-5 h-5" />,
    users: <Users className="w-5 h-5" />,
    edit: <Edit3 className="w-5 h-5" />,
  };
  return icons[iconName] || <ArrowRight className="w-5 h-5" />;
}

// Category color mapping
function getCategoryColor(category: string): { bg: string; icon: string; border: string } {
  const colors: Record<string, { bg: string; icon: string; border: string }> = {
    organization: {
      bg: 'bg-blue-50 dark:bg-blue-950',
      icon: 'text-blue-600 dark:text-blue-400',
      border: 'border-blue-100 dark:border-blue-900',
    },
    sharing: {
      bg: 'bg-purple-50 dark:bg-purple-950',
      icon: 'text-purple-600 dark:text-purple-400',
      border: 'border-purple-100 dark:border-purple-900',
    },
    monetization: {
      bg: 'bg-emerald-50 dark:bg-emerald-950',
      icon: 'text-emerald-600 dark:text-emerald-400',
      border: 'border-emerald-100 dark:border-emerald-900',
    },
    impact: {
      bg: 'bg-amber-50 dark:bg-amber-950',
      icon: 'text-amber-600 dark:text-amber-400',
      border: 'border-amber-100 dark:border-amber-900',
    },
    documentation: {
      bg: 'bg-rose-50 dark:bg-rose-950',
      icon: 'text-rose-600 dark:text-rose-400',
      border: 'border-rose-100 dark:border-rose-900',
    },
  };
  return colors[category] || colors.organization;
}

export default function TopOpportunities({
  opportunities,
}: TopOpportunitiesProps) {
  if (opportunities.length === 0) {
    // User scored high in everything - show congratulations
    return (
      <div className="bg-gradient-to-br from-emerald-50 to-green-50 dark:from-emerald-950 dark:to-green-950 rounded-2xl p-6 mb-6 border border-emerald-100 dark:border-emerald-900">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
            <span className="text-2xl">🏆</span>
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">
              Outstanding!
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              You're already doing great across all categories. Teed will help you take it to the next level.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6 mb-6">
      <h3 className="font-semibold text-[var(--text-primary)] mb-4 flex items-center gap-2">
        <span>Top Opportunities</span>
        <span className="text-xs font-normal text-[var(--text-tertiary)]">
          where Teed can help most
        </span>
      </h3>

      <div className="grid gap-4 md:grid-cols-2">
        {opportunities.map((opportunity, index) => {
          const colors = getCategoryColor(opportunity.category as string);

          return (
            <div
              key={index}
              className={`p-4 rounded-xl border ${colors.border} ${colors.bg} transition-all hover:shadow-md`}
            >
              {/* Icon and title */}
              <div className="flex items-start gap-3 mb-2">
                <div
                  className={`w-10 h-10 rounded-lg bg-white dark:bg-zinc-800 flex items-center justify-center shadow-sm ${colors.icon}`}
                >
                  {getOpportunityIcon(opportunity.icon)}
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-[var(--text-primary)]">
                    {opportunity.title}
                  </h4>
                  {opportunity.potentialGain > 0 && (
                    <span className="text-xs text-[var(--teed-green-9)] font-medium">
                      +{opportunity.potentialGain} potential points
                    </span>
                  )}
                </div>
              </div>

              {/* Description */}
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                {opportunity.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
