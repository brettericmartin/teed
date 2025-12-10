'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Search,
  RefreshCw,
  Video,
  Sparkles,
  ExternalLink,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  Play,
  Loader2,
  Filter,
  Link2,
  Eye,
  Zap,
  CheckSquare,
  Square,
  ArrowRight,
} from 'lucide-react';
import { type AdminRole, ROLE_PERMISSIONS } from '@/lib/types/admin';
import type {
  ContentIdea,
  ContentIdeaStatus,
  ContentVertical,
  WorkflowStage,
} from '@/lib/types/contentIdeas';
import {
  STATUS_DISPLAY_NAMES,
  STATUS_COLORS,
  VERTICAL_DISPLAY_NAMES,
  STAGE_DISPLAY_NAMES,
} from '@/lib/types/contentIdeas';

interface Props {
  adminRole: AdminRole;
  adminId: string;
}

interface StageCounts {
  discovery: number;
  screening: number;
  generation: number;
  review: number;
}

export default function ContentIdeasClient({ adminRole, adminId }: Props) {
  const [activeStage, setActiveStage] = useState<WorkflowStage>('discovery');
  const [ideas, setIdeas] = useState<ContentIdea[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [stageCounts, setStageCounts] = useState<StageCounts>({
    discovery: 0,
    screening: 0,
    generation: 0,
    review: 0,
  });

  // Selection state for batch operations
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Filters
  const [verticalFilter, setVerticalFilter] = useState<ContentVertical | 'all'>('all');

  // Discovery verticals (which categories to scan)
  const [discoveryVerticals, setDiscoveryVerticals] = useState<ContentVertical[]>([
    'golf', 'camera', 'tech', 'gaming', 'desk'
  ]);

  const permissions = ROLE_PERMISSIONS[adminRole];

  // Fetch stage counts
  const fetchStageCounts = useCallback(async () => {
    try {
      const response = await fetch('/api/admin/content-ideas/stats');
      if (response.ok) {
        const stats = await response.json();
        setStageCounts({
          // Discovery: items waiting to be screened
          discovery: (stats.byStatus?.discovered || 0) + (stats.byStatus?.new || 0),
          // Screening: items selected but not yet generated
          screening: stats.byStatus?.selected || 0,
          // Generation: items that have been generated
          generation: stats.byStatus?.generated || 0,
          // Review: items in review or finalized
          review:
            (stats.byStatus?.in_review || 0) +
            (stats.byStatus?.approved || 0) +
            (stats.byStatus?.archived || 0) +
            (stats.byStatus?.rejected || 0),
        });
      }
    } catch (error) {
      console.error('Failed to fetch stage counts:', error);
    }
  }, []);

  // Fetch ideas for current stage
  const fetchIdeas = useCallback(async () => {
    setLoading(true);
    setSelectedIds(new Set());

    try {
      let endpoint = '/api/admin/content-ideas';
      const params = new URLSearchParams();

      // Map stage to status filter
      const stageStatuses: Record<WorkflowStage, string[]> = {
        discovery: ['discovered', 'new'],
        screening: ['screening', 'selected', 'skipped'],
        generation: ['generating', 'generated'],
        review: ['in_review', 'approved', 'archived', 'rejected'],
      };

      // Route to correct endpoint/status for each stage
      if (activeStage === 'discovery') {
        // Discovery: show discovered items waiting for screening
        endpoint = '/api/admin/content-ideas/screen';
      } else if (activeStage === 'screening') {
        // Screening: show selected items ready for generation
        params.set('status', 'selected');
      } else if (activeStage === 'generation') {
        // Generation: show generated items (not the queue)
        params.set('status', 'generated');
      } else {
        // Review stage - get in_review items first, then approved
        params.set('status', 'in_review');
      }

      if (verticalFilter !== 'all') {
        params.set('vertical', verticalFilter);
      }
      params.set('pageSize', '50');

      const url = params.toString() ? `${endpoint}?${params}` : endpoint;
      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        setIdeas(data.ideas || []);
      }
    } catch (error) {
      console.error('Failed to fetch ideas:', error);
    } finally {
      setLoading(false);
    }
  }, [activeStage, verticalFilter]);

  useEffect(() => {
    fetchIdeas();
  }, [fetchIdeas]);

  useEffect(() => {
    fetchStageCounts();
  }, [fetchStageCounts]);

  // Discovery: Scan for new videos
  const handleDiscover = async () => {
    if (actionLoading) return;

    if (discoveryVerticals.length === 0) {
      alert('Please select at least one vertical to scan');
      return;
    }

    const confirmed = window.confirm(
      `Scan YouTube for trending videos from top creators?\n\n` +
      `• Verticals: ${discoveryVerticals.join(', ')}\n` +
      `• Filters to 10K+ views only\n` +
      `• Looks back 2 weeks for fresh content\n` +
      `• NO AI credits used`
    );
    if (!confirmed) return;

    setActionLoading('discover');
    try {
      const response = await fetch('/api/social/discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verticals: discoveryVerticals,
          maxVideosPerVertical: 20,
          daysBack: 14,
          minViews: 10000, // Filter to established creators
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const byVertical = Object.entries(result.byVertical || {})
          .map(([v, c]) => `${v}: ${c}`)
          .join(', ');
        alert(`Discovery complete!\n\nVideos discovered: ${result.videosDiscovered}\nBy vertical: ${byVertical}\nErrors: ${result.errors.length}`);
        fetchIdeas();
        fetchStageCounts();
      } else {
        const error = await response.json();
        alert(`Discovery failed: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Discovery failed:', error);
      alert('Discovery failed. See console for details.');
    } finally {
      setActionLoading(null);
    }
  };

  // Screening: Select or skip ideas
  const handleScreen = async (action: 'select' | 'skip') => {
    if (selectedIds.size === 0) {
      alert('Select at least one idea to ' + action);
      return;
    }

    setActionLoading(action);
    try {
      const response = await fetch('/api/admin/content-ideas/screen', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaIds: Array.from(selectedIds),
          action,
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`${action === 'select' ? 'Selected' : 'Skipped'} ${result.processed} ideas`);
        setSelectedIds(new Set());
        fetchIdeas();
        fetchStageCounts();
      } else {
        const error = await response.json();
        alert(`Failed: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Screening failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Generation: Run full LLM pipeline
  const handleGenerate = async () => {
    if (selectedIds.size === 0) {
      alert('Select ideas to generate content for');
      return;
    }

    if (selectedIds.size > 5) {
      alert('Maximum 5 ideas can be generated at once');
      return;
    }

    const confirmed = window.confirm(
      `Generate full content for ${selectedIds.size} idea(s)?\n\nThis will use AI credits for:\n- Product extraction\n- Story generation\n- Hook variations\n- Long-form outline\n- Short-form ideas`
    );
    if (!confirmed) return;

    setActionLoading('generate');
    try {
      const response = await fetch('/api/admin/content-ideas/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaIds: Array.from(selectedIds),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        alert(
          `Generation complete!\n\nGenerated: ${result.generated}\nFailed: ${result.failed}`
        );
        setSelectedIds(new Set());
        fetchIdeas();
        fetchStageCounts();
      } else {
        const error = await response.json();
        alert(`Generation failed: ${error.error || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Generation failed:', error);
    } finally {
      setActionLoading(null);
    }
  };

  // Toggle selection
  const toggleSelection = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  // Select all
  const toggleSelectAll = () => {
    if (selectedIds.size === ideas.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(ideas.map(i => i.id)));
    }
  };

  const getYouTubeThumbnail = (idea: ContentIdea): string | null => {
    const youtube = idea.source_metadata?.youtube;
    if (youtube?.thumbnails) {
      return (
        youtube.thumbnails.medium?.url ||
        youtube.thumbnails.high?.url ||
        youtube.thumbnails.default?.url ||
        null
      );
    }
    return null;
  };

  const formatViewCount = (count: string | undefined): string => {
    if (!count) return '-';
    const num = parseInt(count, 10);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M views`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K views`;
    return `${count} views`;
  };

  const getViewCountStyle = (count: string | undefined): string => {
    if (!count) return 'text-gray-500';
    const num = parseInt(count, 10);
    if (num >= 1000000) return 'text-green-600 font-semibold';  // 1M+ = exceptional
    if (num >= 500000) return 'text-green-600';                  // 500K+ = great
    if (num >= 100000) return 'text-blue-600';                   // 100K+ = good
    if (num >= 50000) return 'text-gray-700';                    // 50K+ = decent
    return 'text-gray-500';
  };

  return (
    <main className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin Dashboard
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <Sparkles className="w-7 h-7 text-purple-600" />
                Content Ideas
              </h1>
              <p className="text-gray-600 mt-1">
                Staged workflow: Discover → Screen → Generate → Review
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link
                href="/admin/content-ideas/analyze"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-purple-600 rounded-lg hover:bg-purple-700"
              >
                <Zap className="w-4 h-4" />
                Analyze URL
              </Link>
              <Link
                href="/admin/content-ideas/queries"
                className="inline-flex items-center gap-2 px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <Filter className="w-4 h-4" />
                Manage Queries
              </Link>
            </div>
          </div>
        </div>

        {/* Stage Tabs */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-6">
          <div className="flex border-b border-gray-200">
            {(['discovery', 'screening', 'generation', 'review'] as WorkflowStage[]).map(
              (stage, index) => (
                <button
                  key={stage}
                  onClick={() => setActiveStage(stage)}
                  className={`flex-1 relative px-4 py-4 text-center font-medium transition-colors ${
                    activeStage === stage
                      ? 'bg-purple-50 text-purple-700 border-b-2 border-purple-600'
                      : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-lg">{index + 1}</span>
                    <span>{STAGE_DISPLAY_NAMES[stage]}</span>
                    <span
                      className={`px-2 py-0.5 text-xs rounded-full ${
                        activeStage === stage
                          ? 'bg-purple-200 text-purple-800'
                          : 'bg-gray-200 text-gray-600'
                      }`}
                    >
                      {stageCounts[stage]}
                    </span>
                  </div>
                  {index < 3 && (
                    <ArrowRight className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-300" />
                  )}
                </button>
              )
            )}
          </div>

          {/* Discovery Vertical Selector */}
          {activeStage === 'discovery' && (
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-100">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-blue-900 mr-2">Scan verticals:</span>
                {(['golf', 'camera', 'tech', 'gaming', 'desk', 'edc', 'fitness', 'music', 'art', 'travel', 'food', 'fashion'] as ContentVertical[]).map(v => (
                  <button
                    key={v}
                    onClick={() => {
                      setDiscoveryVerticals(prev =>
                        prev.includes(v) ? prev.filter(x => x !== v) : [...prev, v]
                      );
                    }}
                    className={`px-3 py-1 text-sm rounded-full transition-colors ${
                      discoveryVerticals.includes(v)
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-600 border border-gray-300 hover:border-blue-400'
                    }`}
                  >
                    {VERTICAL_DISPLAY_NAMES[v]}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Stage Actions */}
          <div className="p-4 bg-gray-50 flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              {/* Vertical Filter */}
              <select
                value={verticalFilter}
                onChange={e => setVerticalFilter(e.target.value as ContentVertical | 'all')}
                className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                <option value="all">All Verticals</option>
                {Object.entries(VERTICAL_DISPLAY_NAMES).map(([key, name]) => (
                  <option key={key} value={key}>{name}</option>
                ))}
              </select>

              {/* Selection toggle */}
              {ideas.length > 0 && (activeStage === 'discovery' || activeStage === 'screening') && (
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-gray-600 hover:text-gray-900"
                >
                  {selectedIds.size === ideas.length ? (
                    <CheckSquare className="w-4 h-4" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                  {selectedIds.size === ideas.length ? 'Deselect All' : 'Select All'}
                </button>
              )}

              {selectedIds.size > 0 && (
                <span className="text-sm text-purple-600 font-medium">
                  {selectedIds.size} selected
                </span>
              )}
            </div>

            {/* Stage-specific Actions */}
            <div className="flex items-center gap-2">
              {activeStage === 'discovery' && (
                <>
                  <button
                    onClick={handleDiscover}
                    disabled={actionLoading === 'discover'}
                    className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    {actionLoading === 'discover' ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    Discover Videos
                  </button>
                  {selectedIds.size > 0 && (
                    <>
                      <button
                        onClick={() => handleScreen('select')}
                        disabled={!!actionLoading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Select ({selectedIds.size})
                      </button>
                      <button
                        onClick={() => handleScreen('skip')}
                        disabled={!!actionLoading}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 disabled:opacity-50"
                      >
                        <XCircle className="w-4 h-4" />
                        Skip
                      </button>
                    </>
                  )}
                </>
              )}

              {activeStage === 'screening' && (
                <>
                  {ideas.length > 0 && selectedIds.size === 0 && (
                    <span className="text-sm text-gray-500">Select items to generate content</span>
                  )}
                  {selectedIds.size > 0 && (
                    <button
                      onClick={handleGenerate}
                      disabled={!!actionLoading || selectedIds.size > 5}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
                    >
                      {actionLoading === 'generate' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Zap className="w-4 h-4" />
                      )}
                      Generate Content ({selectedIds.size})
                    </button>
                  )}
                </>
              )}

              {activeStage === 'generation' && ideas.length > 0 && (
                <span className="text-sm text-gray-500">
                  Click on an idea to view generated content
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Ideas List */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
              <span className="ml-2 text-gray-600">Loading...</span>
            </div>
          ) : ideas.length === 0 ? (
            <div className="text-center py-12">
              <Video className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-600">No content ideas in this stage</p>
              {activeStage === 'discovery' && (
                <p className="text-sm text-gray-500 mt-1">
                  Click &quot;Discover Videos&quot; to scan YouTube
                </p>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {ideas.map(idea => {
                const thumbnail = getYouTubeThumbnail(idea);
                const viewCount = idea.source_metadata?.youtube?.statistics?.viewCount;
                const isSelected = selectedIds.has(idea.id);
                const canSelect = activeStage === 'discovery' || activeStage === 'screening';

                return (
                  <div
                    key={idea.id}
                    className={`p-4 hover:bg-gray-50 transition-colors ${
                      isSelected ? 'bg-purple-50' : ''
                    }`}
                  >
                    <div className="flex gap-4">
                      {/* Selection checkbox */}
                      {canSelect && (
                        <div className="flex-shrink-0 pt-2">
                          <button
                            onClick={() => toggleSelection(idea.id)}
                            className="text-gray-400 hover:text-purple-600"
                          >
                            {isSelected ? (
                              <CheckSquare className="w-5 h-5 text-purple-600" />
                            ) : (
                              <Square className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      )}

                      {/* Thumbnail */}
                      <div className="flex-shrink-0">
                        {thumbnail ? (
                          <div className="relative w-32 h-20 rounded-lg overflow-hidden bg-gray-200">
                            <img
                              src={thumbnail}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            <a
                              href={idea.source_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity"
                            >
                              <Play className="w-6 h-6 text-white" />
                            </a>
                          </div>
                        ) : (
                          <div className="w-32 h-20 rounded-lg bg-gray-200 flex items-center justify-center">
                            <Video className="w-6 h-6 text-gray-400" />
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div className="min-w-0">
                            <Link
                              href={`/admin/content-ideas/${idea.id}`}
                              className="font-medium text-gray-900 hover:text-purple-600 line-clamp-1"
                            >
                              {idea.idea_title ||
                                idea.source_metadata?.youtube?.title ||
                                'Untitled'}
                            </Link>
                            <div className="flex items-center gap-2 mt-1 text-sm">
                              <span className="text-gray-600">{idea.source_channel_name}</span>
                              {viewCount && (
                                <>
                                  <span className="text-gray-400">•</span>
                                  <span className={getViewCountStyle(viewCount)}>{formatViewCount(viewCount)}</span>
                                </>
                              )}
                            </div>
                          </div>

                          <span
                            className={`flex-shrink-0 px-2 py-1 text-xs font-medium rounded-full ${
                              STATUS_COLORS[idea.status]
                            }`}
                          >
                            {STATUS_DISPLAY_NAMES[idea.status]}
                          </span>
                        </div>

                        {/* Summary or Products */}
                        {idea.idea_summary ? (
                          <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                            {idea.idea_summary}
                          </p>
                        ) : idea.extracted_products && idea.extracted_products.length > 0 ? (
                          <div className="flex items-center gap-2 mt-2 flex-wrap">
                            <span className="text-xs text-gray-500">Products detected:</span>
                            {idea.extracted_products.slice(0, 3).map((p, i) => (
                              <span
                                key={i}
                                className={`px-2 py-0.5 text-xs rounded ${
                                  p.isHeroCandidate
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}
                              >
                                {p.name}
                              </span>
                            ))}
                            {idea.extracted_products.length > 3 && (
                              <span className="text-xs text-gray-500">
                                +{idea.extracted_products.length - 3} more
                              </span>
                            )}
                          </div>
                        ) : null}

                        {/* Tags */}
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          {idea.vertical && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                              {VERTICAL_DISPLAY_NAMES[idea.vertical] || idea.vertical}
                            </span>
                          )}
                          {idea.has_creator_affiliate && (
                            <span className="px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 rounded flex items-center gap-1">
                              <Link2 className="w-3 h-3" />
                              Affiliate
                            </span>
                          )}
                          {idea.tags?.slice(0, 2).map(tag => (
                            <span
                              key={tag}
                              className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Instructions per stage */}
        <div className="mt-6 p-4 bg-gray-100 rounded-lg text-sm text-gray-600">
          {activeStage === 'discovery' && (
            <div>
              <p className="mb-2">
                <strong>Step 1 - Discovery:</strong> Scan YouTube for trending videos from top creators (10K+ views).
              </p>
              <p className="text-gray-500">
                1. Toggle categories above → 2. Click &quot;Discover Videos&quot; → 3. Check boxes on promising videos → 4. Click &quot;Select&quot; to move them to Screening
              </p>
            </div>
          )}
          {activeStage === 'screening' && (
            <div>
              <p className="mb-2">
                <strong>Step 2 - Screening:</strong> These videos have been selected for content generation.
              </p>
              <p className="text-gray-500">
                1. Check boxes on videos you want to generate content for (max 5) → 2. Click &quot;Generate Content&quot; → 3. Wait for AI to process (uses credits)
              </p>
            </div>
          )}
          {activeStage === 'generation' && (
            <div>
              <p className="mb-2">
                <strong>Step 3 - Generated:</strong> AI has generated content for these videos. Click to view details.
              </p>
              <p className="text-gray-500">
                Each idea now has: hooks, long-form outline, short-form ideas, product extraction, and story angles.
              </p>
            </div>
          )}
          {activeStage === 'review' && (
            <p>
              <strong>Step 4 - Review:</strong> Final review stage. Approve ideas for use in content creation.
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
