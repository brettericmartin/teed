'use client';

import { useMemo } from 'react';
import { Check, User, FileText, Share2, Palette, Package } from 'lucide-react';

interface ProfileCompletionIndicatorProps {
  hasAvatar: boolean;
  hasBio: boolean;
  hasSocialLinks: boolean;
  hasThemeCustomized: boolean;
  bagsCount: number;
  minBagsForComplete?: number;
}

interface CompletionStep {
  id: string;
  label: string;
  complete: boolean;
  icon: React.ComponentType<{ className?: string }>;
}

export default function ProfileCompletionIndicator({
  hasAvatar,
  hasBio,
  hasSocialLinks,
  hasThemeCustomized,
  bagsCount,
  minBagsForComplete = 1,
}: ProfileCompletionIndicatorProps) {
  const steps: CompletionStep[] = useMemo(() => [
    { id: 'avatar', label: 'Profile photo', complete: hasAvatar, icon: User },
    { id: 'bio', label: 'Bio written', complete: hasBio, icon: FileText },
    { id: 'social', label: 'Social links', complete: hasSocialLinks, icon: Share2 },
    { id: 'theme', label: 'Theme customized', complete: hasThemeCustomized, icon: Palette },
    { id: 'bags', label: `${minBagsForComplete}+ bag${minBagsForComplete > 1 ? 's' : ''} created`, complete: bagsCount >= minBagsForComplete, icon: Package },
  ], [hasAvatar, hasBio, hasSocialLinks, hasThemeCustomized, bagsCount, minBagsForComplete]);

  const completedCount = steps.filter(s => s.complete).length;
  const totalSteps = steps.length;
  const progressPercent = Math.round((completedCount / totalSteps) * 100);
  const isComplete = completedCount === totalSteps;

  // Don't show if profile is complete (celebrate but don't persist)
  if (isComplete) {
    return null;
  }

  return (
    <div className="px-4 py-3">
      <div className="bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] p-4 shadow-sm">
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-[var(--text-secondary)]">
            Profile setup
          </span>
          <span className="text-xs text-[var(--text-tertiary)]">
            {completedCount} of {totalSteps}
          </span>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-[var(--grey-3)] rounded-full overflow-hidden mb-4">
          <div
            className="h-full bg-[var(--teed-green-8)] rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Steps */}
        <div className="space-y-2">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.id}
                className={`
                  flex items-center gap-3 text-sm
                  ${step.complete ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-secondary)]'}
                `}
              >
                <div
                  className={`
                    w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0
                    transition-all duration-300
                    ${step.complete
                      ? 'bg-[var(--teed-green-8)] text-white'
                      : 'bg-[var(--grey-3)] text-[var(--text-tertiary)]'
                    }
                  `}
                >
                  {step.complete ? (
                    <Check className="w-3 h-3" />
                  ) : (
                    <Icon className="w-3 h-3" />
                  )}
                </div>
                <span className={step.complete ? 'line-through' : ''}>
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>

        {/* Encouraging message */}
        {progressPercent >= 60 && progressPercent < 100 && (
          <p className="mt-4 text-xs text-[var(--text-tertiary)] text-center">
            Almost there! Your profile is looking great.
          </p>
        )}
      </div>
    </div>
  );
}
