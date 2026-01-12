'use client';

import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import type { ScorecardPersona, ScorecardMode } from '@/lib/types/beta';

interface ScorecardHeroProps {
  overallScore: number;
  persona: ScorecardPersona;
  percentile: number;
  mode: ScorecardMode;
  onShare?: () => void;
}

// Color mapping for score ring
function getScoreColor(score: number): { ring: string; bg: string } {
  if (score >= 85) return { ring: 'stroke-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-950' };
  if (score >= 70) return { ring: 'stroke-blue-500', bg: 'bg-blue-50 dark:bg-blue-950' };
  if (score >= 50) return { ring: 'stroke-amber-500', bg: 'bg-amber-50 dark:bg-amber-950' };
  if (score >= 30) return { ring: 'stroke-orange-500', bg: 'bg-orange-50 dark:bg-orange-950' };
  return { ring: 'stroke-slate-500', bg: 'bg-slate-50 dark:bg-slate-900' };
}

// Persona color mapping
function getPersonaColor(color: ScorecardPersona['color']): string {
  const colors: Record<ScorecardPersona['color'], string> = {
    emerald: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300',
    blue: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
    amber: 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300',
    orange: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300',
    slate: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  };
  return colors[color];
}

export default function ScorecardHero({
  overallScore,
  persona,
  percentile,
  mode,
  onShare,
}: ScorecardHeroProps) {
  const scoreColors = getScoreColor(overallScore);

  // Calculate stroke dasharray for the circular progress
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (overallScore / 100) * circumference;

  return (
    <div className="bg-white dark:bg-zinc-900 rounded-2xl shadow-lg p-6 mb-6">
      <div className="flex flex-col md:flex-row items-center gap-6">
        {/* Score Circle */}
        <div className="relative flex-shrink-0">
          <svg
            className="w-40 h-40 transform -rotate-90"
            viewBox="0 0 160 160"
          >
            {/* Background circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-gray-100 dark:text-zinc-800"
            />
            {/* Progress circle */}
            <circle
              cx="80"
              cy="80"
              r={radius}
              strokeWidth="12"
              fill="none"
              strokeLinecap="round"
              className={scoreColors.ring}
              style={{
                strokeDasharray: circumference,
                strokeDashoffset,
                transition: 'stroke-dashoffset 1s ease-out',
              }}
            />
          </svg>
          {/* Score display in center */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-4xl font-bold text-[var(--text-primary)]">
              {overallScore}
            </span>
            <span className="text-sm text-[var(--text-tertiary)]">/ 100</span>
          </div>
        </div>

        {/* Persona Info */}
        <div className="flex-1 text-center md:text-left">
          {/* Persona badge */}
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="text-2xl">{persona.emoji}</span>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${getPersonaColor(persona.color)}`}
            >
              {persona.name}
            </span>
          </div>

          {/* Persona description */}
          <p className="text-[var(--text-secondary)] mb-2">
            {persona.description}
          </p>

          {/* Frame/tagline */}
          <p className="text-sm text-[var(--text-tertiary)] italic">
            "{persona.frame}"
          </p>

          {/* Percentile display */}
          {percentile > 0 && (
            <p className="text-sm text-[var(--text-secondary)] mt-3">
              <span className="font-medium text-[var(--teed-green-9)]">
                Top {100 - percentile}%
              </span>{' '}
              of {mode === 'monetization' ? 'creators building revenue' : 'creators focused on impact'}
            </p>
          )}

          {/* Share button */}
          {onShare && (
            <Button
              variant="secondary"
              size="sm"
              onClick={onShare}
              className="mt-4 gap-2"
            >
              <Share2 className="w-4 h-4" />
              Share Your Score
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
