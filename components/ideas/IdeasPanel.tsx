'use client';

/**
 * Ideas Panel Component
 *
 * Displays AI-generated bag ideas with the ability to create bags from suggestions.
 */

import { useState } from 'react';
import {
  Lightbulb,
  Sparkles,
  ChevronRight,
  Package,
  Home,
  BookOpen,
  Utensils,
  Plane,
  Gift,
  Palette,
  Heart,
  Film,
  Calendar,
  Loader2,
  RefreshCw,
  Plus,
  X,
} from 'lucide-react';
import type { BagIdea, IdeaCategory, UserAnalysis } from '@/lib/ideas/types';
import { IDEA_CATEGORY_INFO } from '@/lib/ideas/categories';

// Map category to icon
const CATEGORY_ICONS: Record<IdeaCategory, React.ComponentType<{ className?: string }>> = {
  gear: Package,
  lifestyle: Home,
  learning: BookOpen,
  recipes: Utensils,
  travel: Plane,
  gifts: Gift,
  creative: Palette,
  wellness: Heart,
  entertainment: Film,
  seasonal: Calendar,
};

// Map category to color classes
const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  'teed-green': {
    bg: 'bg-[var(--teed-green-4)]',
    text: 'text-[var(--teed-green-11)]',
    border: 'border-[var(--teed-green-7)]',
  },
  sky: {
    bg: 'bg-[var(--sky-4)]',
    text: 'text-[var(--sky-11)]',
    border: 'border-[var(--sky-7)]',
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-300 dark:border-amber-700',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-950/30',
    text: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-300 dark:border-purple-700',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-950/30',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-300 dark:border-red-700',
  },
};

interface IdeasPanelProps {
  onCreateBag?: (idea: BagIdea) => void;
  className?: string;
}

export default function IdeasPanel({ onCreateBag, className = '' }: IdeasPanelProps) {
  const [ideas, setIdeas] = useState<BagIdea[]>([]);
  const [analysis, setAnalysis] = useState<UserAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedIdea, setExpandedIdea] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<IdeaCategory | null>(null);

  const fetchIdeas = async (category?: IdeaCategory | null) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('limit', '5');
      if (category) {
        params.set('category', category);
      }

      const response = await fetch(`/api/bags/ideas?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch ideas');
      }

      setIdeas(data.ideas);
      setAnalysis(data.analysis || null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBag = (idea: BagIdea) => {
    if (onCreateBag) {
      onCreateBag(idea);
    }
  };

  const categoryInfo = (category: IdeaCategory) => IDEA_CATEGORY_INFO[category];
  const categoryColor = (category: IdeaCategory) => {
    const info = categoryInfo(category);
    return CATEGORY_COLORS[info?.color || 'teed-green'];
  };

  return (
    <div className={`rounded-xl border border-[var(--border-subtle)] bg-[var(--surface)] ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[var(--border-subtle)]">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-[var(--teed-green-4)]">
            <Lightbulb className="w-5 h-5 text-[var(--teed-green-11)]" />
          </div>
          <div>
            <h3 className="font-semibold text-[var(--text-primary)]">Idea Agent</h3>
            <p className="text-xs text-[var(--text-tertiary)]">AI-powered bag suggestions</p>
          </div>
        </div>
        <button
          onClick={() => fetchIdeas(selectedCategory)}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--teed-green-9)] text-white text-sm font-medium hover:bg-[var(--teed-green-10)] disabled:opacity-50 transition-colors"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : ideas.length > 0 ? (
            <RefreshCw className="w-4 h-4" />
          ) : (
            <Sparkles className="w-4 h-4" />
          )}
          {ideas.length > 0 ? 'Refresh' : 'Generate Ideas'}
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 p-4 overflow-x-auto border-b border-[var(--border-subtle)]">
        <button
          onClick={() => {
            setSelectedCategory(null);
            if (ideas.length > 0) fetchIdeas(null);
          }}
          className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
            selectedCategory === null
              ? 'bg-[var(--teed-green-9)] text-white'
              : 'bg-[var(--grey-4)] text-[var(--text-secondary)] hover:bg-[var(--grey-5)]'
          }`}
        >
          All
        </button>
        {(Object.keys(IDEA_CATEGORY_INFO) as IdeaCategory[]).map((cat) => {
          const info = IDEA_CATEGORY_INFO[cat];
          return (
            <button
              key={cat}
              onClick={() => {
                setSelectedCategory(cat);
                if (ideas.length > 0) fetchIdeas(cat);
              }}
              className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-[var(--teed-green-9)] text-white'
                  : 'bg-[var(--grey-4)] text-[var(--text-secondary)] hover:bg-[var(--grey-5)]'
              }`}
            >
              {info.label}
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-4">
        {error && (
          <div className="p-3 rounded-lg bg-red-100 dark:bg-red-950/30 text-red-700 dark:text-red-400 text-sm mb-4">
            {error}
          </div>
        )}

        {!loading && ideas.length === 0 && (
          <div className="text-center py-8">
            <Lightbulb className="w-12 h-12 mx-auto mb-3 text-[var(--text-tertiary)]" />
            <p className="text-[var(--text-secondary)] mb-2">No ideas yet</p>
            <p className="text-sm text-[var(--text-tertiary)]">
              Click "Generate Ideas" to get personalized bag suggestions
            </p>
          </div>
        )}

        {loading && (
          <div className="text-center py-8">
            <Loader2 className="w-8 h-8 mx-auto mb-3 text-[var(--teed-green-9)] animate-spin" />
            <p className="text-[var(--text-secondary)]">Generating ideas...</p>
            <p className="text-sm text-[var(--text-tertiary)]">Analyzing your collection</p>
          </div>
        )}

        {/* Ideas List */}
        {ideas.length > 0 && (
          <div className="space-y-3">
            {ideas.map((idea) => {
              const Icon = CATEGORY_ICONS[idea.category] || Package;
              const colors = categoryColor(idea.category);
              const isExpanded = expandedIdea === idea.id;

              return (
                <div
                  key={idea.id}
                  className={`rounded-xl border transition-all ${colors.border} ${
                    isExpanded ? colors.bg : 'bg-[var(--surface)] hover:bg-[var(--grey-2)]'
                  }`}
                >
                  {/* Idea Header */}
                  <button
                    onClick={() => setExpandedIdea(isExpanded ? null : idea.id)}
                    className="w-full flex items-start gap-3 p-4 text-left"
                  >
                    <div className={`p-2 rounded-lg ${colors.bg}`}>
                      <Icon className={`w-5 h-5 ${colors.text}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium text-[var(--text-primary)] truncate">
                          {idea.name}
                        </h4>
                        <span className={`px-2 py-0.5 rounded-full text-xs ${colors.bg} ${colors.text}`}>
                          {idea.difficulty}
                        </span>
                      </div>
                      <p className="text-sm text-[var(--text-secondary)] line-clamp-2">
                        {idea.description}
                      </p>
                    </div>
                    <ChevronRight
                      className={`w-5 h-5 text-[var(--text-tertiary)] transition-transform ${
                        isExpanded ? 'rotate-90' : ''
                      }`}
                    />
                  </button>

                  {/* Expanded Content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-[var(--border-subtle)] mt-0 pt-4">
                      {/* Why It Fits */}
                      {idea.whyItFits && (
                        <p className="text-sm text-[var(--text-secondary)] mb-4 italic">
                          "{idea.whyItFits}"
                        </p>
                      )}

                      {/* Suggested Items */}
                      {idea.suggestedItems.length > 0 && (
                        <div className="mb-4">
                          <h5 className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
                            Suggested Items
                          </h5>
                          <div className="space-y-2">
                            {idea.suggestedItems.map((item, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between text-sm"
                              >
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`w-2 h-2 rounded-full ${
                                      item.priority === 'essential'
                                        ? 'bg-green-500'
                                        : item.priority === 'recommended'
                                        ? 'bg-blue-500'
                                        : 'bg-gray-400'
                                    }`}
                                  />
                                  <span className="text-[var(--text-primary)]">{item.name}</span>
                                </div>
                                {item.estimatedPrice && (
                                  <span className="text-[var(--text-tertiary)]">
                                    {item.estimatedPrice}
                                  </span>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Budget & Tags */}
                      <div className="flex flex-wrap items-center gap-2 mb-4">
                        {idea.estimatedBudget && (
                          <span className="px-2 py-1 rounded bg-[var(--grey-4)] text-xs text-[var(--text-secondary)]">
                            {idea.estimatedBudget}
                          </span>
                        )}
                        {idea.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 rounded bg-[var(--grey-3)] text-xs text-[var(--text-tertiary)]"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>

                      {/* Create Button */}
                      <button
                        onClick={() => handleCreateBag(idea)}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-[var(--teed-green-9)] text-white font-medium hover:bg-[var(--teed-green-10)] transition-colors"
                      >
                        <Plus className="w-4 h-4" />
                        Create This Bag
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Analysis Summary */}
        {analysis && analysis.identifiedNiches.length > 0 && (
          <div className="mt-6 p-4 rounded-lg bg-[var(--grey-3)] border border-[var(--border-subtle)]">
            <h5 className="text-xs font-medium text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
              Your Collection Profile
            </h5>
            <div className="flex flex-wrap gap-2">
              {analysis.identifiedNiches.map((niche) => (
                <span
                  key={niche}
                  className="px-2 py-1 rounded-full bg-[var(--teed-green-4)] text-[var(--teed-green-11)] text-xs"
                >
                  {niche}
                </span>
              ))}
            </div>
            {analysis.gapOpportunities.length > 0 && (
              <p className="mt-2 text-xs text-[var(--text-tertiary)]">
                <strong>Opportunities:</strong> {analysis.gapOpportunities.join(', ')}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Compact version for sidebars/widgets
 */
export function IdeasWidget({
  onCreateBag,
  className = '',
}: {
  onCreateBag?: (idea: BagIdea) => void;
  className?: string;
}) {
  const [ideas, setIdeas] = useState<BagIdea[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchQuickIdeas = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/bags/ideas?limit=3&quick=true');
      const data = await response.json();
      if (response.ok) {
        setIdeas(data.ideas);
      }
    } catch (err) {
      console.error('Failed to fetch ideas:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`p-4 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-[var(--teed-green-11)]" />
          <span className="text-sm font-medium text-[var(--text-primary)]">Quick Ideas</span>
        </div>
        <button
          onClick={fetchQuickIdeas}
          disabled={loading}
          className="text-xs text-[var(--teed-green-11)] hover:underline"
        >
          {loading ? 'Loading...' : 'Refresh'}
        </button>
      </div>

      {ideas.length === 0 && !loading && (
        <button
          onClick={fetchQuickIdeas}
          className="w-full py-3 text-center text-sm text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
        >
          Click to get suggestions
        </button>
      )}

      {ideas.length > 0 && (
        <div className="space-y-2">
          {ideas.map((idea) => (
            <button
              key={idea.id}
              onClick={() => onCreateBag?.(idea)}
              className="w-full text-left p-2 rounded-lg hover:bg-[var(--grey-3)] transition-colors"
            >
              <span className="text-sm text-[var(--text-primary)] font-medium">{idea.name}</span>
              <span className="block text-xs text-[var(--text-tertiary)] truncate">
                {idea.description}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
