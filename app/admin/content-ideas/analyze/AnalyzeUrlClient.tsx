'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Link2,
  Loader2,
  Play,
  Scissors,
  Package,
  Sparkles,
  Copy,
  Check,
  ExternalLink,
  Eye,
  ThumbsUp,
  Clock,
  Film,
  Bookmark,
  Star,
  Zap,
  Video,
  MessageSquare,
  FileText,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { type AdminRole } from '@/lib/types/admin';
import type { ContentVertical, ExtractedProduct } from '@/lib/types/contentIdeas';
import { VERTICAL_DISPLAY_NAMES } from '@/lib/types/contentIdeas';

interface Props {
  adminRole: AdminRole;
}

interface ClipOpportunity {
  itemName: string;
  brand: string | undefined;
  clipAngle: string;
  suggestedHook: string;
  estimatedDuration: string;
  heroScore: number;
  storySignals: string[];
}

interface AnalysisResult {
  success: boolean;
  videoInfo: {
    title: string;
    channel: string;
    publishedAt: string;
    viewCount: string;
    likeCount: string;
    duration: string;
    thumbnailUrl: string;
    url: string;
  };
  contentType: 'single_hero' | 'roundup' | 'comparison';
  products: ExtractedProduct[];
  clipOpportunities: ClipOpportunity[];
  generatedIdea: {
    title: string;
    summary: string;
    whyCreator: string;
    whyAudience: string;
    tags: string[];
    hooks: Array<{ hook: string; style: string; platform: string }>;
    longFormOutline: Record<string, string>;
    shortFormIdeas: Array<{ hook: string; narrative: string; duration: number }>;
  };
  savedIdeaId?: string;
}

export default function AnalyzeUrlClient({ adminRole }: Props) {
  const [url, setUrl] = useState('');
  const [vertical, setVertical] = useState<ContentVertical>('tech');
  const [saveToDb, setSaveToDb] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [copiedHook, setCopiedHook] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState<'clips' | 'hooks' | 'outline' | 'shortform'>('clips');
  const [expandedClips, setExpandedClips] = useState<Set<number>>(new Set([0, 1, 2]));
  const [saving, setSaving] = useState(false);

  const handleSaveToDatabase = async () => {
    if (!url.trim() || !result) return;

    setSaving(true);
    setError(null);

    try {
      const response = await fetch('/api/admin/content-ideas/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, vertical, saveToDatabase: true }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error || 'Save failed';
        throw new Error(errorMsg);
      }

      // Update result with the savedIdeaId
      setResult({ ...result, savedIdeaId: data.savedIdeaId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleAnalyze = async () => {
    if (!url.trim()) {
      setError('Please enter a YouTube URL');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/admin/content-ideas/analyze-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, vertical, saveToDatabase: saveToDb }),
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMsg = data.details ? `${data.error}: ${data.details}` : data.error || 'Analysis failed';
        throw new Error(errorMsg);
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Analysis failed');
    } finally {
      setLoading(false);
    }
  };

  const copyHook = (hook: string, index: number) => {
    navigator.clipboard.writeText(hook);
    setCopiedHook(index);
    setTimeout(() => setCopiedHook(null), 2000);
  };

  const formatViewCount = (count: string): string => {
    const num = parseInt(count, 10);
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return count;
  };

  const formatDuration = (isoDuration: string): string => {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return isoDuration;
    const hours = match[1] ? `${match[1]}:` : '';
    const minutes = match[2] || '0';
    const seconds = match[3]?.padStart(2, '0') || '00';
    return `${hours}${minutes}:${seconds}`;
  };

  const toggleClip = (index: number) => {
    const newExpanded = new Set(expandedClips);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedClips(newExpanded);
  };

  const getContentTypeBadge = (type: string) => {
    const styles = {
      roundup: 'bg-purple-100 text-purple-700',
      comparison: 'bg-blue-100 text-blue-700',
      single_hero: 'bg-green-100 text-green-700',
    };
    const labels = {
      roundup: 'Multi-Item Roundup',
      comparison: 'Comparison',
      single_hero: 'Single Hero Item',
    };
    return (
      <span className={`px-3 py-1 text-sm font-medium rounded-full ${styles[type as keyof typeof styles]}`}>
        {labels[type as keyof typeof labels]}
      </span>
    );
  };

  return (
    <main className="min-h-screen bg-gray-50 pt-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link
            href="/admin/content-ideas"
            className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Content Ideas
          </Link>

          <div className="flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Analyze Video URL</h1>
              <p className="text-gray-600">
                Paste any YouTube URL to get a full item breakdown with clip opportunities
              </p>
            </div>
          </div>
        </div>

        {/* Input Section */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                YouTube Video URL
              </label>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                    onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                  />
                </div>
                <select
                  value={vertical}
                  onChange={(e) => setVertical(e.target.value as ContentVertical)}
                  className="px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  {Object.entries(VERTICAL_DISPLAY_NAMES).map(([key, name]) => (
                    <option key={key} value={key}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={saveToDb}
                  onChange={(e) => setSaveToDb(e.target.checked)}
                  className="w-4 h-4 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
                />
                <span className="text-sm text-gray-600">Save to content ideas database</span>
              </label>

              <button
                onClick={handleAnalyze}
                disabled={loading || !url.trim()}
                className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 text-white font-medium rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Zap className="w-5 h-5" />
                    Analyze Video
                  </>
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            {/* Video Info Card */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="flex gap-6 p-6">
                {/* Thumbnail */}
                <div className="flex-shrink-0">
                  <a
                    href={result.videoInfo.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block relative group"
                  >
                    <img
                      src={result.videoInfo.thumbnailUrl}
                      alt=""
                      className="w-64 h-36 object-cover rounded-lg"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg">
                      <Play className="w-12 h-12 text-white" />
                    </div>
                  </a>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-gray-900 line-clamp-2">
                        {result.videoInfo.title}
                      </h2>
                      <p className="text-gray-600 mt-1">{result.videoInfo.channel}</p>
                    </div>
                    {getContentTypeBadge(result.contentType)}
                  </div>

                  <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {formatViewCount(result.videoInfo.viewCount)} views
                    </span>
                    <span className="flex items-center gap-1">
                      <ThumbsUp className="w-4 h-4" />
                      {formatViewCount(result.videoInfo.likeCount)} likes
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {formatDuration(result.videoInfo.duration)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 mt-4">
                    <span className="text-sm text-gray-500">
                      {result.products.length} products detected
                    </span>
                    <span className="text-sm text-gray-500">
                      {result.clipOpportunities.length} clip opportunities
                    </span>
                    {result.savedIdeaId ? (
                      <Link
                        href={`/admin/content-ideas/${result.savedIdeaId}`}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700"
                      >
                        <Sparkles className="w-4 h-4" />
                        Open for AI Review
                      </Link>
                    ) : (
                      <button
                        onClick={handleSaveToDatabase}
                        disabled={saving}
                        className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 disabled:opacity-50"
                      >
                        {saving ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Bookmark className="w-4 h-4" />
                            Save for AI Review
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Generated Title & Summary */}
            <div className="bg-gradient-to-r from-purple-50 to-indigo-50 rounded-lg border border-purple-200 p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-2">
                {result.generatedIdea.title}
              </h3>
              <p className="text-gray-700">{result.generatedIdea.summary}</p>
              <div className="flex flex-wrap gap-2 mt-4">
                {result.generatedIdea.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 text-xs font-medium bg-purple-100 text-purple-700 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>

            {/* Tabs */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
              <div className="border-b border-gray-200">
                <nav className="flex">
                  {[
                    { id: 'clips', label: 'Clip Opportunities', icon: Scissors, count: result.clipOpportunities.length },
                    { id: 'hooks', label: 'Hooks', icon: MessageSquare, count: result.generatedIdea.hooks.length },
                    { id: 'outline', label: 'Long-Form Outline', icon: FileText },
                    { id: 'shortform', label: 'Short-Form Ideas', icon: Video, count: result.generatedIdea.shortFormIdeas.length },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id as typeof activeTab)}
                      className={`flex items-center gap-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                        activeTab === tab.id
                          ? 'border-purple-600 text-purple-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      <tab.icon className="w-4 h-4" />
                      {tab.label}
                      {tab.count !== undefined && (
                        <span className={`px-2 py-0.5 text-xs rounded-full ${
                          activeTab === tab.id ? 'bg-purple-100' : 'bg-gray-100'
                        }`}>
                          {tab.count}
                        </span>
                      )}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {/* Clip Opportunities Tab */}
                {activeTab === 'clips' && (
                  <div className="space-y-4">
                    {result.clipOpportunities.length > 0 ? (
                      <>
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-sm text-gray-600">
                            Each item below is a potential standalone clip. Higher hero scores = stronger story potential.
                          </p>
                          <span className="text-sm text-purple-600 font-medium">
                            {result.clipOpportunities.filter(c => c.heroScore >= 50).length} high-potential clips
                          </span>
                        </div>

                        {result.clipOpportunities.map((clip, index) => (
                          <div
                            key={index}
                            className={`border rounded-lg overflow-hidden transition-all ${
                              clip.heroScore >= 60
                                ? 'border-purple-300 bg-purple-50/50'
                                : clip.heroScore >= 50
                                ? 'border-amber-200 bg-amber-50/30'
                                : 'border-gray-200'
                            }`}
                          >
                            <button
                              onClick={() => toggleClip(index)}
                              className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50/50"
                            >
                              <div className="flex items-center gap-4">
                                <div className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${
                                  clip.heroScore >= 60
                                    ? 'bg-purple-200 text-purple-700'
                                    : clip.heroScore >= 50
                                    ? 'bg-amber-200 text-amber-700'
                                    : 'bg-gray-200 text-gray-600'
                                }`}>
                                  <Star className="w-5 h-5" />
                                </div>
                                <div>
                                  <h4 className="font-medium text-gray-900">
                                    {clip.brand ? `${clip.brand} ` : ''}{clip.itemName}
                                  </h4>
                                  <p className="text-sm text-gray-600">{clip.clipAngle}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className={`px-2 py-1 text-xs font-medium rounded ${
                                  clip.heroScore >= 60
                                    ? 'bg-purple-100 text-purple-700'
                                    : clip.heroScore >= 50
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  Score: {clip.heroScore}
                                </span>
                                <span className="text-sm text-gray-500">{clip.estimatedDuration}</span>
                                {expandedClips.has(index) ? (
                                  <ChevronUp className="w-5 h-5 text-gray-400" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                            </button>

                            {expandedClips.has(index) && (
                              <div className="px-4 pb-4 pt-2 border-t border-gray-100">
                                <div className="bg-white rounded-lg p-4 border border-gray-200">
                                  <p className="text-sm text-gray-500 mb-2">Suggested Hook:</p>
                                  <div className="flex items-start justify-between gap-4">
                                    <p className="text-gray-900 font-medium">
                                      &quot;{clip.suggestedHook}&quot;
                                    </p>
                                    <button
                                      onClick={() => copyHook(clip.suggestedHook, index)}
                                      className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600"
                                    >
                                      {copiedHook === index ? (
                                        <Check className="w-4 h-4 text-green-500" />
                                      ) : (
                                        <Copy className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                </div>

                                {clip.storySignals.length > 0 && (
                                  <div className="mt-3">
                                    <p className="text-xs text-gray-500 mb-1">Story Signals:</p>
                                    <div className="flex flex-wrap gap-1">
                                      {clip.storySignals.map((signal, i) => (
                                        <span
                                          key={i}
                                          className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                                        >
                                          {signal}
                                        </span>
                                      ))}
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </>
                    ) : (
                      <p className="text-center text-gray-500 py-8">
                        No significant clip opportunities identified.
                      </p>
                    )}
                  </div>
                )}

                {/* Hooks Tab */}
                {activeTab === 'hooks' && (
                  <div className="space-y-3">
                    {result.generatedIdea.hooks.map((hook, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200 group"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <p className="text-gray-900 font-medium">&quot;{hook.hook}&quot;</p>
                          <button
                            onClick={() => copyHook(hook.hook, index + 100)}
                            className="flex-shrink-0 p-2 text-gray-400 hover:text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            {copiedHook === index + 100 ? (
                              <Check className="w-4 h-4 text-green-500" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                        <div className="flex gap-2 mt-2">
                          <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                            {hook.platform}
                          </span>
                          <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-700 rounded">
                            {hook.style}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Outline Tab */}
                {activeTab === 'outline' && (
                  <div className="space-y-6">
                    {Object.entries(result.generatedIdea.longFormOutline).map(([key, value]) => {
                      if (key === 'estimatedDurationMinutes' || !value) return null;
                      const labels: Record<string, string> = {
                        intro: 'Introduction & Hook',
                        creatorStory: "Creator's Story",
                        heroBreakdown: 'Hero Item Breakdown',
                        comparison: 'Comparison',
                        demonstration: 'Demonstration',
                        bagContext: 'Teed Bag Context',
                        cta: 'Call to Action',
                        curatorCredentials: "Curator's Credentials",
                        topPicks: 'Top Picks',
                        hiddenGems: 'Hidden Gems',
                        budgetPicks: 'Budget Picks',
                      };
                      return (
                        <div key={key}>
                          <h4 className="text-sm font-medium text-purple-600 mb-2">
                            {labels[key] || key}
                          </h4>
                          <p className="text-gray-700 whitespace-pre-wrap">{value}</p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Short-Form Tab */}
                {activeTab === 'shortform' && (
                  <div className="space-y-4">
                    {result.generatedIdea.shortFormIdeas.map((idea, index) => (
                      <div
                        key={index}
                        className="p-4 bg-gray-50 rounded-lg border border-gray-200"
                      >
                        <div className="flex items-start gap-4">
                          <div className="flex-shrink-0 w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <span className="text-lg font-bold text-purple-600">{index + 1}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">&quot;{idea.hook}&quot;</p>
                            <p className="text-sm text-gray-600 mt-2">{idea.narrative}</p>
                            <span className="inline-block mt-2 text-xs text-gray-500">
                              {idea.duration}s
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Products List */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
                <Package className="w-5 h-5 text-gray-400" />
                All Detected Products ({result.products.length})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {result.products.map((product, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${
                      product.isHeroCandidate
                        ? 'border-purple-200 bg-purple-50/50'
                        : 'border-gray-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900 text-sm">
                          {product.brand ? `${product.brand} ` : ''}{product.name}
                        </p>
                        {product.category && (
                          <p className="text-xs text-gray-500">{product.category}</p>
                        )}
                      </div>
                      {product.heroScore && (
                        <span className={`px-2 py-0.5 text-xs rounded ${
                          product.heroScore >= 60
                            ? 'bg-purple-100 text-purple-700'
                            : product.heroScore >= 40
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {product.heroScore}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
