'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  TrendingUp,
  RefreshCw,
  ExternalLink,
  MessageSquare,
  ArrowUpRight,
  Image as ImageIcon,
  FileText,
  Loader2,
  Info,
  BookOpen,
  Bookmark,
  X,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  ALL_CATEGORIES,
  CATEGORY_LABELS,
  TIKTOK_HASHTAGS,
  type RisingCategory,
  type RisingPlatform,
  type RisingPost,
  type RisingPostsResponse,
} from '@/lib/types/risingPosts';

// ─── Helpers ─────────────────────────────────────────────────────

function formatAge(hours: number): string {
  if (hours < 1) return `${Math.round(hours * 60)}m ago`;
  if (hours < 24) return `${Math.round(hours)}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
  return String(n);
}

function scoreColor(score: number): string {
  if (score >= 150) return 'bg-[var(--teed-green-4)] text-[var(--teed-green-11)]';
  if (score >= 80) return 'bg-[var(--amber-4)] text-[var(--amber-11)]';
  return 'bg-[var(--grey-4)] text-[var(--grey-11)]';
}

const PLATFORM_TEXT_COLORS: Record<RisingPlatform, string> = {
  reddit: 'text-orange-600',
  youtube: 'text-red-600',
  tiktok: 'text-gray-900 dark:text-gray-100',
};

// ─── localStorage Helpers ────────────────────────────────────────

const SAVED_KEY = 'teed_rising_saved';
const DISMISSED_KEY = 'teed_rising_dismissed';

function loadSet(key: string): Set<string> {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return new Set();
    return new Set(JSON.parse(raw));
  } catch {
    return new Set();
  }
}

function saveSet(key: string, set: Set<string>) {
  localStorage.setItem(key, JSON.stringify([...set]));
}

type PostFilter = 'all' | 'saved' | 'new';

// ─── Component ───────────────────────────────────────────────────

export default function RisingPostsClient() {
  const [posts, setPosts] = useState<RisingPost[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [quotaUsed, setQuotaUsed] = useState(0);

  const [selectedCategories, setSelectedCategories] = useState<Set<RisingCategory>>(
    new Set(ALL_CATEGORIES)
  );
  const [activeTab, setActiveTab] = useState<RisingPlatform>('reddit');
  const [postFilter, setPostFilter] = useState<PostFilter>('all');

  // Saved / dismissed state (localStorage-backed)
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  // Load from localStorage on mount
  useEffect(() => {
    setSavedIds(loadSet(SAVED_KEY));
    setDismissedIds(loadSet(DISMISSED_KEY));
  }, []);

  function toggleSave(id: string) {
    setSavedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      saveSet(SAVED_KEY, next);
      return next;
    });
  }

  function dismissPost(id: string) {
    setDismissedIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveSet(DISMISSED_KEY, next);
      return next;
    });
  }

  function clearDismissed() {
    setDismissedIds(new Set());
    localStorage.removeItem(DISMISSED_KEY);
  }

  // ─── Fetch ───────────────────────────────────────────────────

  const fetchPosts = useCallback(async () => {
    setLoading(true);
    setErrors([]);

    try {
      const cats =
        selectedCategories.size === ALL_CATEGORIES.length
          ? 'all'
          : Array.from(selectedCategories).join(',');

      const resp = await fetch(
        `/api/admin/rising-posts?categories=${cats}&platforms=reddit,youtube`
      );

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

      const data: RisingPostsResponse = await resp.json();
      setPosts(data.posts);
      setFetchedAt(data.fetchedAt);
      setErrors(data.errors);
      setQuotaUsed(data.quotaUsed);
    } catch (err) {
      setErrors([err instanceof Error ? err.message : 'Failed to fetch']);
    } finally {
      setLoading(false);
    }
  }, [selectedCategories]);

  useEffect(() => {
    fetchPosts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── Derived State ───────────────────────────────────────────

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      if (p.platform !== activeTab) return false;
      if (!selectedCategories.has(p.category)) return false;

      if (postFilter === 'saved') return savedIds.has(p.id);
      if (postFilter === 'new') return !dismissedIds.has(p.id) && !savedIds.has(p.id);
      // 'all' — show everything except dismissed (unless viewing saved)
      return !dismissedIds.has(p.id);
    });
  }, [posts, activeTab, selectedCategories, postFilter, savedIds, dismissedIds]);

  const platformCounts = useMemo(() => {
    const counts: Record<RisingPlatform, number> = {
      reddit: 0,
      youtube: 0,
      tiktok: 0,
    };
    for (const p of posts) {
      if (selectedCategories.has(p.category) && !dismissedIds.has(p.id)) {
        counts[p.platform]++;
      }
    }
    return counts;
  }, [posts, selectedCategories, dismissedIds]);

  const savedCount = useMemo(() => {
    return posts.filter(
      (p) => p.platform === activeTab && savedIds.has(p.id)
    ).length;
  }, [posts, activeTab, savedIds]);

  const timeSince = useMemo(() => {
    if (!fetchedAt) return null;
    const mins = Math.round((Date.now() - new Date(fetchedAt).getTime()) / 60000);
    if (mins < 1) return 'just now';
    if (mins === 1) return '1 minute ago';
    return `${mins} minutes ago`;
  }, [fetchedAt]);

  // ─── Category Toggle ────────────────────────────────────────

  function toggleCategory(cat: RisingCategory) {
    setSelectedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }

  function toggleAll() {
    if (selectedCategories.size === ALL_CATEGORIES.length) {
      setSelectedCategories(new Set());
    } else {
      setSelectedCategories(new Set(ALL_CATEGORIES));
    }
  }

  // ─── TikTok Hashtags for Selected Categories ────────────────

  const tiktokHashtags = useMemo(() => {
    const tags: { category: RisingCategory; hashtag: string; url: string }[] = [];
    for (const cat of ALL_CATEGORIES) {
      if (!selectedCategories.has(cat)) continue;
      for (const tag of TIKTOK_HASHTAGS[cat] || []) {
        tags.push({
          category: cat,
          hashtag: tag,
          url: `https://www.tiktok.com/tag/${tag}`,
        });
      }
    }
    return tags;
  }, [selectedCategories]);

  // ─── Render ──────────────────────────────────────────────────

  return (
    <div className="min-h-screen pt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/admin"
            className="inline-flex items-center gap-1.5 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] mb-4"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Admin
          </Link>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-[var(--text-primary)] flex items-center gap-3">
                <TrendingUp className="w-8 h-8 text-[var(--teed-green-11)]" />
                Rising Posts
              </h1>
              <p className="text-[var(--text-secondary)] mt-1">
                Real-time trending posts from Reddit, YouTube, and TikTok
              </p>
            </div>

            <Link
              href="/admin/content-ideas/automation-playbook"
              className="shrink-0 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-[var(--text-secondary)] bg-[var(--surface-elevated)] border border-[var(--border-subtle)] rounded-lg hover:text-[var(--text-primary)] hover:border-[var(--border-default)] transition-colors"
            >
              <BookOpen className="w-4 h-4" />
              Automation Playbook
            </Link>
          </div>
        </div>

        {/* Category Filter Bar */}
        <div className="mb-6 overflow-x-auto">
          <div className="flex gap-2 pb-2">
            <button
              onClick={toggleAll}
              className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategories.size === ALL_CATEGORIES.length
                  ? 'bg-[var(--text-primary)] text-[var(--surface)]'
                  : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
              }`}
            >
              All
            </button>
            {ALL_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategories.has(cat)
                    ? 'bg-[var(--teed-green-4)] text-[var(--teed-green-11)]'
                    : 'bg-[var(--surface-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Platform Tabs */}
        <div className="flex gap-1 mb-4 border-b border-[var(--border-subtle)]">
          {(
            [
              { key: 'reddit' as const, label: 'Reddit', color: 'text-orange-600' },
              { key: 'youtube' as const, label: 'YouTube', color: 'text-red-600' },
              { key: 'tiktok' as const, label: 'TikTok', color: 'text-[var(--text-primary)]' },
            ] as const
          ).map(({ key, label, color }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? `${color} border-current`
                  : 'text-[var(--text-secondary)] border-transparent hover:text-[var(--text-primary)]'
              }`}
            >
              {label}
              {key !== 'tiktok' && (
                <span className="ml-2 px-1.5 py-0.5 rounded-full text-xs bg-[var(--surface-elevated)]">
                  {platformCounts[key]}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Post Filter + Refresh Bar */}
        <div className="flex items-center justify-between mb-6">
          {/* Post filter pills */}
          <div className="flex items-center gap-2">
            <div className="flex gap-1 p-0.5 rounded-lg bg-[var(--surface-elevated)]">
              {(
                [
                  { key: 'all' as const, label: 'All', icon: <Eye className="w-3.5 h-3.5" /> },
                  { key: 'new' as const, label: 'New', icon: <EyeOff className="w-3.5 h-3.5" /> },
                  { key: 'saved' as const, label: `Saved${savedCount > 0 ? ` (${savedCount})` : ''}`, icon: <Bookmark className="w-3.5 h-3.5" /> },
                ] as const
              ).map(({ key, label, icon }) => (
                <button
                  key={key}
                  onClick={() => setPostFilter(key)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                    postFilter === key
                      ? 'bg-[var(--surface)] text-[var(--text-primary)] shadow-sm'
                      : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {icon}
                  {label}
                </button>
              ))}
            </div>

            {dismissedIds.size > 0 && (
              <button
                onClick={clearDismissed}
                className="text-xs text-[var(--text-secondary)] hover:text-[var(--text-primary)] underline underline-offset-2"
              >
                Reset {dismissedIds.size} dismissed
              </button>
            )}
          </div>

          {/* Right side: time + refresh */}
          <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
            {timeSince && <span className="hidden sm:inline">Last refreshed {timeSince}</span>}
            {quotaUsed > 0 && (
              <span className="hidden sm:inline text-xs">
                ~{quotaUsed.toLocaleString()}/10,000 quota
              </span>
            )}
            <button
              onClick={fetchPosts}
              disabled={loading}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border-subtle)] hover:border-[var(--border-default)] text-[var(--text-primary)] transition-colors disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Refresh
            </button>
          </div>
        </div>

        {/* Errors */}
        {errors.length > 0 && (
          <div className="mb-6 p-3 rounded-lg bg-[var(--amber-4)] text-[var(--amber-11)] text-sm">
            <p className="font-medium mb-1">
              Some sources had errors ({errors.length}):
            </p>
            <ul className="list-disc list-inside space-y-0.5 text-xs">
              {errors.slice(0, 5).map((e, i) => (
                <li key={i}>{e}</li>
              ))}
              {errors.length > 5 && (
                <li>...and {errors.length - 5} more</li>
              )}
            </ul>
          </div>
        )}

        {/* Content Area */}
        {activeTab === 'tiktok' ? (
          <TikTokTab hashtags={tiktokHashtags} />
        ) : loading && posts.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-[var(--text-secondary)]" />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-20 text-[var(--text-secondary)]">
            <p className="text-lg mb-2">
              {postFilter === 'saved'
                ? 'No saved posts yet'
                : postFilter === 'new'
                  ? 'All caught up'
                  : 'No posts found'}
            </p>
            <p className="text-sm">
              {postFilter === 'saved'
                ? 'Bookmark posts to find them here later'
                : postFilter === 'new'
                  ? 'All posts have been saved or dismissed'
                  : 'Try selecting more categories or refreshing'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isSaved={savedIds.has(post.id)}
                onToggleSave={() => toggleSave(post.id)}
                onDismiss={() => dismissPost(post.id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Post Card ───────────────────────────────────────────────────

function PostCard({
  post,
  isSaved,
  onToggleSave,
  onDismiss,
}: {
  post: RisingPost;
  isSaved: boolean;
  onToggleSave: () => void;
  onDismiss: () => void;
}) {
  return (
    <div className={`relative bg-[var(--surface)] border rounded-[var(--radius-xl)] overflow-hidden transition-colors ${
      isSaved
        ? 'border-[var(--teed-green-7)] shadow-[0_0_0_1px_var(--teed-green-7)]'
        : 'border-[var(--border-subtle)] hover:border-[var(--border-default)]'
    }`}>
      {/* Save + Dismiss buttons (top-right overlay) */}
      <div className="absolute top-2 right-2 z-10 flex gap-1">
        <button
          onClick={onToggleSave}
          title={isSaved ? 'Unsave' : 'Save for later'}
          className={`p-1.5 rounded-md backdrop-blur-sm transition-colors ${
            isSaved
              ? 'bg-[var(--teed-green-4)] text-[var(--teed-green-11)]'
              : 'bg-black/40 text-white/80 hover:text-white hover:bg-black/60'
          }`}
        >
          <Bookmark className={`w-3.5 h-3.5 ${isSaved ? 'fill-current' : ''}`} />
        </button>
        <button
          onClick={onDismiss}
          title="Dismiss"
          className="p-1.5 rounded-md bg-black/40 text-white/80 hover:text-white hover:bg-black/60 backdrop-blur-sm transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Thumbnail */}
      {post.thumbnailUrl && (
        <div className="aspect-video bg-[var(--grey-3)] overflow-hidden">
          <img
            src={post.thumbnailUrl}
            alt=""
            className="w-full h-full object-cover"
            loading="lazy"
          />
        </div>
      )}

      <div className="p-4">
        {/* Title */}
        <h3 className="text-sm font-medium text-[var(--text-primary)] line-clamp-2 mb-2">
          {post.title}
        </h3>

        {/* Meta row */}
        <div className="flex items-center gap-2 text-xs text-[var(--text-secondary)] mb-3">
          <span className={PLATFORM_TEXT_COLORS[post.platform]}>
            {post.source}
          </span>
          <span>&middot;</span>
          <span>{formatAge(post.ageHours)}</span>
          {post.flair && (
            <>
              <span>&middot;</span>
              <span className="px-1.5 py-0.5 rounded bg-[var(--surface-elevated)] text-[var(--text-secondary)]">
                {post.flair}
              </span>
            </>
          )}
        </div>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-xs text-[var(--text-secondary)] mb-3">
          {post.platform === 'reddit' ? (
            <>
              <span className="flex items-center gap-1">
                <ArrowUpRight className="w-3 h-3" />
                {formatNumber(post.score)}
              </span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {post.comments}
              </span>
              {post.isImage && (
                <span className="flex items-center gap-1">
                  <ImageIcon className="w-3 h-3" />
                  Image
                </span>
              )}
            </>
          ) : (
            <>
              <span>{formatNumber(post.score)} views</span>
              <span className="flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {post.comments}
              </span>
            </>
          )}

          {/* Teed Score badge */}
          <span
            className={`ml-auto px-2 py-0.5 rounded-full text-xs font-semibold ${scoreColor(
              post.teedScore
            )}`}
          >
            {post.teedScore}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <a
            href={post.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-[var(--border-subtle)] text-[var(--text-primary)] hover:bg-[var(--surface-elevated)] transition-colors"
          >
            <ExternalLink className="w-3 h-3" />
            Open
          </a>
          <Link
            href="/admin/tools"
            className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-[var(--teed-green-4)] text-[var(--teed-green-11)] hover:bg-[var(--teed-green-5)] transition-colors"
          >
            <FileText className="w-3 h-3" />
            Create Bag
          </Link>
        </div>
      </div>
    </div>
  );
}

// ─── TikTok Tab ──────────────────────────────────────────────────

function TikTokTab({
  hashtags,
}: {
  hashtags: { category: RisingCategory; hashtag: string; url: string }[];
}) {
  return (
    <div>
      {/* Info Banner */}
      <div className="flex items-start gap-3 p-4 mb-6 rounded-lg bg-[var(--surface-elevated)] border border-[var(--border-subtle)]">
        <Info className="w-5 h-5 text-[var(--text-secondary)] shrink-0 mt-0.5" />
        <div className="text-sm text-[var(--text-secondary)]">
          <p className="font-medium text-[var(--text-primary)] mb-1">
            TikTok posts are browsed manually
          </p>
          <p>
            No API access is available. These curated hashtag links open TikTok
            in your browser where you can browse trending content directly.
          </p>
        </div>
      </div>

      {/* Hashtag Grid */}
      {hashtags.length === 0 ? (
        <div className="text-center py-12 text-[var(--text-secondary)]">
          Select categories to see TikTok hashtags
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {hashtags.map(({ hashtag, url, category }) => (
            <a
              key={`${category}-${hashtag}`}
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex flex-col items-center gap-2 p-4 rounded-xl bg-[var(--surface)] border border-[var(--border-subtle)] hover:border-[var(--border-default)] hover:shadow-[var(--shadow-2)] transition-all"
            >
              <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--teed-green-11)]">
                #{hashtag}
              </span>
              <span className="text-xs text-[var(--text-secondary)]">
                {CATEGORY_LABELS[category]}
              </span>
              <ExternalLink className="w-3 h-3 text-[var(--text-secondary)] opacity-0 group-hover:opacity-100 transition-opacity" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}
