'use client';

/**
 * Bag Analyzer Component
 *
 * Displays bag analysis results with scores, issues, and recommendations.
 */

import { useState } from 'react';
import {
  BarChart3,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Info,
  Zap,
  ChevronDown,
  ChevronRight,
  Loader2,
  RefreshCw,
  Target,
  Search,
  FolderOpen,
  DollarSign,
  Star,
  Sparkles,
  TrendingUp,
  Lightbulb,
} from 'lucide-react';
import type {
  BagAnalysisResult,
  DimensionScore,
  AnalysisIssue,
  MissingItem,
  AnalysisDimension,
  IssueLevel,
} from '@/lib/analyzer/types';

// Dimension icons
const DIMENSION_ICONS: Record<AnalysisDimension, React.ComponentType<{ className?: string }>> = {
  completeness: CheckCircle2,
  seo: Search,
  organization: FolderOpen,
  monetization: DollarSign,
  quality: Star,
  engagement: Sparkles,
};

// Issue level colors
const LEVEL_COLORS: Record<IssueLevel, { bg: string; text: string; icon: React.ComponentType<{ className?: string }> }> = {
  critical: { bg: 'bg-red-100 dark:bg-red-950/30', text: 'text-red-700 dark:text-red-400', icon: AlertCircle },
  warning: { bg: 'bg-amber-100 dark:bg-amber-950/30', text: 'text-amber-700 dark:text-amber-400', icon: AlertTriangle },
  suggestion: { bg: 'bg-blue-100 dark:bg-blue-950/30', text: 'text-blue-700 dark:text-blue-400', icon: Lightbulb },
  info: { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-400', icon: Info },
};

// Grade colors
const GRADE_COLORS: Record<string, string> = {
  A: 'text-green-600 dark:text-green-400',
  B: 'text-blue-600 dark:text-blue-400',
  C: 'text-amber-600 dark:text-amber-400',
  D: 'text-orange-600 dark:text-orange-400',
  F: 'text-red-600 dark:text-red-400',
};

interface BagAnalyzerProps {
  bagCode: string;
  className?: string;
}

export default function BagAnalyzer({ bagCode, className = '' }: BagAnalyzerProps) {
  const [analysis, setAnalysis] = useState<BagAnalysisResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [includeAI, setIncludeAI] = useState(false);
  const [expandedDimension, setExpandedDimension] = useState<AnalysisDimension | null>(null);

  const runAnalysis = async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (includeAI) params.set('ai', 'true');

      const response = await fetch(`/api/bags/${bagCode}/analyze?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to analyze bag');
      }

      setAnalysis(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-950/30">
            <BarChart3 className="w-5 h-5 text-purple-700 dark:text-purple-400" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">Bag Analyzer</h3>
            <p className="text-xs text-[var(--text-tertiary)]">Get insights and recommendations</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-[var(--text-secondary)]">
            <input
              type="checkbox"
              checked={includeAI}
              onChange={(e) => setIncludeAI(e.target.checked)}
              className="rounded border-[var(--border-subtle)]"
            />
            AI suggestions
          </label>
          <button
            onClick={runAnalysis}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : analysis ? (
              <RefreshCw className="w-4 h-4" />
            ) : (
              <Target className="w-4 h-4" />
            )}
            {analysis ? 'Re-analyze' : 'Analyze'}
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        {!loading && !analysis && (
          <div className="text-center py-8">
            <BarChart3 className="w-12 h-12 mx-auto mb-3 text-[var(--text-tertiary)]" />
            <p className="text-[var(--text-secondary)] mb-2">Ready to analyze</p>
            <p className="text-sm text-[var(--text-tertiary)]">
              Click "Analyze" to get insights about your bag
            </p>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 mx-auto mb-3 text-purple-600 animate-spin" />
            <p className="text-[var(--text-secondary)]">Analyzing your bag...</p>
          </div>
        )}

        {analysis && (
          <div className="space-y-6">
            {/* Overall Score */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--grey-2)]">
              <div>
                <p className="text-sm text-[var(--text-tertiary)]">Overall Score</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold text-[var(--text-primary)]">
                    {analysis.overallScore}
                  </span>
                  <span className="text-lg text-[var(--text-tertiary)]">/ 100</span>
                </div>
              </div>
              <div className={`text-6xl font-bold ${GRADE_COLORS[analysis.grade]}`}>
                {analysis.grade}
              </div>
            </div>

            {/* Strengths */}
            {analysis.strengths.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-green-600" />
                  Strengths
                </h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.strengths.map((strength, idx) => (
                    <span
                      key={idx}
                      className="px-3 py-1 rounded-full bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-sm"
                    >
                      {strength}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Wins */}
            {analysis.quickWins.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-600" />
                  Quick Wins
                </h4>
                <div className="space-y-2">
                  {analysis.quickWins.map((issue) => (
                    <IssueCard key={issue.id} issue={issue} />
                  ))}
                </div>
              </div>
            )}

            {/* Dimension Scores */}
            <div>
              <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
                Detailed Scores
              </h4>
              <div className="space-y-2">
                {analysis.dimensions.map((dim) => (
                  <DimensionCard
                    key={dim.dimension}
                    dimension={dim}
                    expanded={expandedDimension === dim.dimension}
                    onToggle={() =>
                      setExpandedDimension(
                        expandedDimension === dim.dimension ? null : dim.dimension
                      )
                    }
                  />
                ))}
              </div>
            </div>

            {/* Top Issues */}
            {analysis.topIssues.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600" />
                  Priority Issues
                </h4>
                <div className="space-y-2">
                  {analysis.topIssues.map((issue) => (
                    <IssueCard key={issue.id} issue={issue} />
                  ))}
                </div>
              </div>
            )}

            {/* Missing Items (AI) */}
            {analysis.missingItems.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-[var(--text-secondary)] mb-2 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-purple-600" />
                  Suggested Items to Add
                </h4>
                <div className="space-y-2">
                  {analysis.missingItems.map((item, idx) => (
                    <MissingItemCard key={idx} item={item} />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DimensionCard({
  dimension,
  expanded,
  onToggle,
}: {
  dimension: DimensionScore;
  expanded: boolean;
  onToggle: () => void;
}) {
  const Icon = DIMENSION_ICONS[dimension.dimension];
  const percentage = Math.round((dimension.score / dimension.maxScore) * 100);

  return (
    <div className="rounded-lg border border-[var(--border-subtle)] overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between p-3 hover:bg-[var(--grey-2)] transition-colors"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-[var(--text-tertiary)]" />
          <div className="text-left">
            <span className="font-medium text-[var(--text-primary)]">{dimension.label}</span>
            <span className="block text-xs text-[var(--text-tertiary)]">{dimension.description}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="font-bold text-[var(--text-primary)]">{dimension.score}</span>
            <span className="text-[var(--text-tertiary)]">/{dimension.maxScore}</span>
          </div>
          <div className="w-24 h-2 bg-[var(--grey-4)] rounded-full overflow-hidden">
            <div
              className={`h-full transition-all ${
                percentage >= 80
                  ? 'bg-green-500'
                  : percentage >= 60
                  ? 'bg-amber-500'
                  : 'bg-red-500'
              }`}
              style={{ width: `${percentage}%` }}
            />
          </div>
          {expanded ? (
            <ChevronDown className="w-5 h-5 text-[var(--text-tertiary)]" />
          ) : (
            <ChevronRight className="w-5 h-5 text-[var(--text-tertiary)]" />
          )}
        </div>
      </button>

      {expanded && dimension.issues.length > 0 && (
        <div className="border-t border-[var(--border-subtle)] p-3 bg-[var(--grey-2)] space-y-2">
          {dimension.issues.map((issue) => (
            <IssueCard key={issue.id} issue={issue} compact />
          ))}
        </div>
      )}
    </div>
  );
}

function IssueCard({ issue, compact = false }: { issue: AnalysisIssue; compact?: boolean }) {
  const { bg, text, icon: LevelIcon } = LEVEL_COLORS[issue.level];

  return (
    <div className={`rounded-lg ${bg} ${compact ? 'p-2' : 'p-3'}`}>
      <div className="flex items-start gap-2">
        <LevelIcon className={`w-4 h-4 mt-0.5 ${text}`} />
        <div className="flex-1 min-w-0">
          <p className={`font-medium ${text} ${compact ? 'text-sm' : ''}`}>{issue.title}</p>
          {!compact && (
            <>
              <p className="text-sm text-[var(--text-secondary)] mt-1">{issue.description}</p>
              <p className="text-sm text-[var(--text-primary)] mt-2 font-medium">
                💡 {issue.recommendation}
              </p>
            </>
          )}
        </div>
        {!compact && (
          <span className={`px-2 py-0.5 rounded text-xs ${text} ${bg}`}>
            {issue.effort}
          </span>
        )}
      </div>
    </div>
  );
}

function MissingItemCard({ item }: { item: MissingItem }) {
  const priorityColors = {
    essential: 'bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400',
    recommended: 'bg-blue-100 text-blue-700 dark:bg-blue-950/30 dark:text-blue-400',
    optional: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400',
  };

  return (
    <div className="flex items-start gap-3 p-3 rounded-lg bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800">
      <Sparkles className="w-4 h-4 mt-0.5 text-purple-600" />
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[var(--text-primary)]">{item.name}</span>
          <span className={`px-2 py-0.5 rounded text-xs ${priorityColors[item.priority]}`}>
            {item.priority}
          </span>
        </div>
        <p className="text-sm text-[var(--text-secondary)] mt-1">{item.reason}</p>
      </div>
    </div>
  );
}

/**
 * Compact analyzer widget for embedding
 */
export function AnalyzerWidget({
  bagCode,
  className = '',
}: {
  bagCode: string;
  className?: string;
}) {
  const [score, setScore] = useState<number | null>(null);
  const [grade, setGrade] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkScore = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/bags/${bagCode}/analyze`);
      const data = await response.json();
      if (response.ok) {
        setScore(data.overallScore);
        setGrade(data.grade);
      }
    } catch (err) {
      console.error('Failed to analyze:', err);
    } finally {
      setLoading(false);
    }
  };

  if (score !== null && grade !== null) {
    return (
      <div className={`flex items-center gap-2 ${className}`}>
        <span className="text-sm text-[var(--text-secondary)]">Score:</span>
        <span className="font-bold text-[var(--text-primary)]">{score}</span>
        <span className={`text-lg font-bold ${GRADE_COLORS[grade]}`}>{grade}</span>
      </div>
    );
  }

  return (
    <button
      onClick={checkScore}
      disabled={loading}
      className={`text-sm text-purple-600 hover:text-purple-700 ${className}`}
    >
      {loading ? 'Checking...' : 'Check bag score'}
    </button>
  );
}
