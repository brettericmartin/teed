'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Play,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Package,
  AlertTriangle,
  TrendingUp,
  Youtube,
  Rss,
  RefreshCw,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';

type DiscoveryCategory = 'golf' | 'tech' | 'photography' | 'edc' | 'fitness';

interface DiscoveryRun {
  id: string;
  category: DiscoveryCategory;
  status: 'running' | 'completed' | 'failed';
  sourcesFound: number;
  sourcesProcessed: number;
  productsFound: number;
  bagsCreated: number;
  bagIds: string[];
  startedAt: string;
  completedAt?: string;
  errorMessage?: string;
}

interface GapStatistics {
  total: number;
  resolved: number;
  unresolved: number;
  topBrands: { brand: string; count: number }[];
}

interface RunConfig {
  maxSources: number;
  maxProductsPerSource: number;
  dryRun: boolean;
  skipExisting: boolean;
  youtubeEnabled: boolean;
  tiktokEnabled: boolean;
  rssEnabled: boolean;
}

const CATEGORIES: { id: DiscoveryCategory; name: string; icon: string }[] = [
  { id: 'golf', name: 'Golf', icon: '⛳' },
  { id: 'tech', name: 'Tech & Gadgets', icon: '💻' },
  { id: 'photography', name: 'Photography', icon: '📷' },
  { id: 'edc', name: 'Everyday Carry', icon: '🔦' },
  { id: 'fitness', name: 'Fitness', icon: '💪' },
];

const DEFAULT_CONFIG: RunConfig = {
  maxSources: 10,
  maxProductsPerSource: 15,
  dryRun: false,
  skipExisting: true,
  youtubeEnabled: true,
  tiktokEnabled: true,
  rssEnabled: true,
};

export default function DiscoveryDashboardClient() {
  const [selectedCategory, setSelectedCategory] = useState<DiscoveryCategory>('golf');
  const [config, setConfig] = useState<RunConfig>(DEFAULT_CONFIG);
  const [isRunning, setIsRunning] = useState(false);
  const [runs, setRuns] = useState<DiscoveryRun[]>([]);
  const [gapStats, setGapStats] = useState<Record<string, GapStatistics>>({});
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingRuns, setLoadingRuns] = useState(true);

  // Fetch recent runs on mount
  useEffect(() => {
    fetchRecentRuns();
  }, []);

  // Poll for active run status
  useEffect(() => {
    if (!activeRunId) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/discovery/status/${activeRunId}`);
        if (!res.ok) return;

        const data = await res.json();
        if (data.status !== 'running') {
          setActiveRunId(null);
          setIsRunning(false);
          fetchRecentRuns();
        }
      } catch {
        // Ignore polling errors
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [activeRunId]);

  async function fetchRecentRuns() {
    setLoadingRuns(true);
    try {
      const res = await fetch('/api/discovery/results/all?limit=20&includeGaps=true');
      if (!res.ok) throw new Error('Failed to fetch runs');

      const data = await res.json();
      setRuns(data.runs || []);

      if (data.gapStatistics) {
        setGapStats({ all: data.gapStatistics });
      }

      // Fetch gap stats per category
      for (const cat of CATEGORIES) {
        const catRes = await fetch(`/api/discovery/results/${cat.id}?limit=5&includeGaps=true`);
        if (catRes.ok) {
          const catData = await catRes.json();
          if (catData.gapStatistics) {
            setGapStats((prev) => ({ ...prev, [cat.id]: catData.gapStatistics }));
          }
        }
      }
    } catch (err) {
      console.error('Error fetching runs:', err);
    } finally {
      setLoadingRuns(false);
    }
  }

  async function startDiscoveryRun() {
    setIsRunning(true);
    setError(null);

    try {
      const res = await fetch('/api/discovery/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: selectedCategory,
          config,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to start discovery run');
      }

      setActiveRunId(data.runId);
      // Refresh runs list
      setTimeout(fetchRecentRuns, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setIsRunning(false);
    }
  }

  const categoryStats = CATEGORIES.map((cat) => {
    const catRuns = runs.filter((r) => r.category === cat.id);
    const lastRun = catRuns[0];
    const gaps = gapStats[cat.id];

    return {
      ...cat,
      lastRun,
      totalRuns: catRuns.length,
      totalProducts: catRuns.reduce((sum, r) => sum + r.productsFound, 0),
      totalBags: catRuns.reduce((sum, r) => sum + r.bagsCreated, 0),
      gaps,
    };
  });

  return (
    <div className="min-h-screen pt-16">
      {/* Header */}
      <header className="bg-[var(--surface)] border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)]">
                Discovery Team
              </h1>
              <p className="text-sm text-[var(--text-secondary)] mt-2">
                Automated content research and bag curation
              </p>
            </div>
            <button
              onClick={fetchRecentRuns}
              disabled={loadingRuns}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-lg hover:bg-[var(--grey-3)] transition-colors"
            >
              <RefreshCw className={`w-4 h-4 ${loadingRuns ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Category Overview Cards */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Categories
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {categoryStats.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`p-4 rounded-xl border text-left transition-all ${
                  selectedCategory === cat.id
                    ? 'border-[var(--teed-green-8)] bg-[var(--teed-green-3)]'
                    : 'border-[var(--border-subtle)] bg-[var(--surface)] hover:border-[var(--border-default)]'
                }`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="font-medium text-[var(--text-primary)]">{cat.name}</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-[var(--text-tertiary)]">Products</span>
                    <p className="font-semibold text-[var(--text-primary)]">
                      {cat.totalProducts}
                    </p>
                  </div>
                  <div>
                    <span className="text-[var(--text-tertiary)]">Bags</span>
                    <p className="font-semibold text-[var(--text-primary)]">{cat.totalBags}</p>
                  </div>
                  {cat.gaps && (
                    <div className="col-span-2">
                      <span className="text-[var(--text-tertiary)]">Library Gaps</span>
                      <p className="font-semibold text-[var(--amber-11)]">
                        {cat.gaps.unresolved}
                      </p>
                    </div>
                  )}
                </div>
                {cat.lastRun && (
                  <div className="mt-2 pt-2 border-t border-[var(--border-subtle)]">
                    <span className="text-xs text-[var(--text-tertiary)]">
                      Last run: {new Date(cat.lastRun.startedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </button>
            ))}
          </div>
        </section>

        {/* Run Discovery Panel */}
        <section className="mb-8 p-6 bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)]">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Run Discovery for{' '}
            {CATEGORIES.find((c) => c.id === selectedCategory)?.name}
          </h2>

          {/* Configuration */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Max Sources
              </label>
              <input
                type="number"
                min={1}
                max={50}
                value={config.maxSources}
                onChange={(e) =>
                  setConfig({ ...config, maxSources: parseInt(e.target.value) || 10 })
                }
                className="w-full px-3 py-2 bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1">
                Products per Source
              </label>
              <input
                type="number"
                min={1}
                max={30}
                value={config.maxProductsPerSource}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    maxProductsPerSource: parseInt(e.target.value) || 15,
                  })
                }
                className="w-full px-3 py-2 bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-lg text-[var(--text-primary)]"
              />
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.dryRun}
                  onChange={(e) => setConfig({ ...config, dryRun: e.target.checked })}
                  className="w-4 h-4 rounded border-[var(--border-default)]"
                />
                <span className="text-sm text-[var(--text-secondary)]">
                  Dry Run (research only)
                </span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={config.skipExisting}
                  onChange={(e) =>
                    setConfig({ ...config, skipExisting: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-[var(--border-default)]"
                />
                <span className="text-sm text-[var(--text-secondary)]">
                  Skip processed sources
                </span>
              </label>
            </div>
            <div className="flex flex-col justify-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.youtubeEnabled}
                  onChange={(e) =>
                    setConfig({ ...config, youtubeEnabled: e.target.checked })
                  }
                  className="w-4 h-4 rounded border-[var(--border-default)]"
                />
                <Youtube className="w-4 h-4 text-red-500" />
                <span className="text-sm text-[var(--text-secondary)]">YouTube</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input
                  type="checkbox"
                  checked={config.rssEnabled}
                  onChange={(e) => setConfig({ ...config, rssEnabled: e.target.checked })}
                  className="w-4 h-4 rounded border-[var(--border-default)]"
                />
                <Rss className="w-4 h-4 text-orange-500" />
                <span className="text-sm text-[var(--text-secondary)]">RSS Feeds</span>
              </label>
            </div>
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
              <div className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <XCircle className="w-5 h-5" />
                <span className="font-medium">Error</span>
              </div>
              <p className="mt-1 text-sm text-red-600 dark:text-red-300">{error}</p>
            </div>
          )}

          {/* Run Button */}
          <button
            onClick={startDiscoveryRun}
            disabled={isRunning}
            className="flex items-center gap-2 px-6 py-3 bg-[var(--teed-green-9)] hover:bg-[var(--teed-green-10)] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isRunning ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Discovery Running...
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                Start Discovery
              </>
            )}
          </button>
        </section>

        {/* Recent Runs */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
            Recent Runs
          </h2>

          {loadingRuns ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--text-tertiary)]" />
            </div>
          ) : runs.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-tertiary)]">
              <Search className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No discovery runs yet</p>
              <p className="text-sm mt-1">Start your first discovery run above</p>
            </div>
          ) : (
            <div className="space-y-3">
              {runs.map((run) => (
                <RunCard key={run.id} run={run} />
              ))}
            </div>
          )}
        </section>

        {/* Library Gaps Overview */}
        {gapStats.all && gapStats.all.unresolved > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
              Library Gaps
            </h2>
            <div className="p-6 bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)]">
              <div className="flex items-center gap-4 mb-4">
                <div className="p-3 bg-[var(--amber-4)] rounded-lg">
                  <AlertTriangle className="w-6 h-6 text-[var(--amber-11)]" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-[var(--text-primary)]">
                    {gapStats.all.unresolved}
                  </p>
                  <p className="text-sm text-[var(--text-secondary)]">
                    Products not in library
                  </p>
                </div>
              </div>

              {gapStats.all.topBrands.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-2">
                    Top Missing Brands
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {gapStats.all.topBrands.slice(0, 10).map((b) => (
                      <span
                        key={b.brand}
                        className="px-3 py-1 bg-[var(--amber-3)] text-[var(--amber-11)] text-sm rounded-full"
                      >
                        {b.brand} ({b.count})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

function RunCard({ run }: { run: DiscoveryRun }) {
  const statusConfig = {
    running: {
      icon: <Loader2 className="w-4 h-4 animate-spin" />,
      color: 'text-[var(--sky-11)]',
      bg: 'bg-[var(--sky-4)]',
      label: 'Running',
    },
    completed: {
      icon: <CheckCircle2 className="w-4 h-4" />,
      color: 'text-[var(--teed-green-11)]',
      bg: 'bg-[var(--teed-green-4)]',
      label: 'Completed',
    },
    failed: {
      icon: <XCircle className="w-4 h-4" />,
      color: 'text-red-600 dark:text-red-400',
      bg: 'bg-red-100 dark:bg-red-950/30',
      label: 'Failed',
    },
  };

  const status = statusConfig[run.status];
  const category = CATEGORIES.find((c) => c.id === run.category);
  const duration = run.completedAt
    ? Math.round(
        (new Date(run.completedAt).getTime() - new Date(run.startedAt).getTime()) / 1000
      )
    : null;

  return (
    <div className="p-4 bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)]">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl">{category?.icon}</span>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-[var(--text-primary)]">
                {category?.name}
              </span>
              <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${status.bg} ${status.color}`}>
                {status.icon}
                {status.label}
              </span>
            </div>
            <div className="flex items-center gap-4 mt-1 text-xs text-[var(--text-tertiary)]">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {new Date(run.startedAt).toLocaleString()}
              </span>
              {duration && <span>{duration}s</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-center">
            <p className="text-lg font-semibold text-[var(--text-primary)]">
              {run.sourcesFound}
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">Sources</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-[var(--text-primary)]">
              {run.productsFound}
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">Products</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold text-[var(--teed-green-11)]">
              {run.bagsCreated}
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">Bags</p>
          </div>
          {run.bagIds && run.bagIds.length > 0 && (
            <Link
              href={`/admin/bags?ids=${run.bagIds.join(',')}`}
              className="flex items-center gap-1 text-sm text-[var(--teed-green-11)] hover:underline"
            >
              View Bags
              <ExternalLink className="w-3 h-3" />
            </Link>
          )}
        </div>
      </div>

      {run.errorMessage && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-950/30 rounded-lg">
          <p className="text-sm text-red-600 dark:text-red-400">{run.errorMessage}</p>
        </div>
      )}
    </div>
  );
}
