'use client';

import { Eye, GitFork, Bookmark, BadgeCheck, Sparkles, TrendingUp } from 'lucide-react';
import { cn, formatNumber } from '@/lib/utils';

interface SocialProofMetricsProps {
  viewCount?: number;
  cloneCount?: number;
  saveCount?: number;
  isFeatured?: boolean;
  featuredCategory?: string;
  isTrending?: boolean;
  isVerified?: boolean;
  /** Threshold to show view count. Default: 50 */
  viewThreshold?: number;
  /** Threshold to show save count. Default: 10 */
  saveThreshold?: number;
  className?: string;
  /** Display style */
  variant?: 'inline' | 'stacked' | 'compact';
}

export function SocialProofMetrics({
  viewCount,
  cloneCount,
  saveCount,
  isFeatured,
  featuredCategory,
  isTrending,
  isVerified,
  viewThreshold = 50,
  saveThreshold = 10,
  className,
  variant = 'inline'
}: SocialProofMetricsProps) {
  const metrics = [];

  // View Count (only if > threshold)
  if (viewCount && viewCount > viewThreshold) {
    metrics.push(
      <span key="views" className="flex items-center gap-1.5">
        <Eye className="w-4 h-4" />
        <span>{formatNumber(viewCount)} views</span>
      </span>
    );
  }

  // Clone Count
  if (cloneCount && cloneCount > 0) {
    metrics.push(
      <span key="clones" className="flex items-center gap-1.5">
        <GitFork className="w-4 h-4" />
        <span>
          {formatNumber(cloneCount)} {cloneCount === 1 ? 'clone' : 'clones'}
        </span>
      </span>
    );
  }

  // Save Count (only if > threshold)
  if (saveCount && saveCount > saveThreshold) {
    metrics.push(
      <span key="saves" className="flex items-center gap-1.5">
        <Bookmark className="w-4 h-4" />
        <span>{formatNumber(saveCount)} saves</span>
      </span>
    );
  }

  if (variant === 'stacked') {
    return (
      <div className={cn('space-y-2', className)}>
        {/* Badges Row */}
        <div className="flex items-center gap-2 flex-wrap">
          {isFeatured && <FeaturedBadge category={featuredCategory} />}
          {isTrending && <TrendingBadge />}
          {isVerified && <VerifiedBadge />}
        </div>

        {/* Metrics Row */}
        {metrics.length > 0 && (
          <div className="flex items-center gap-4 text-sm text-[var(--text-secondary)]">
            {metrics}
          </div>
        )}
      </div>
    );
  }

  if (variant === 'compact') {
    return (
      <div className={cn('flex items-center gap-3 text-xs text-[var(--text-tertiary)]', className)}>
        {viewCount && viewCount > viewThreshold && (
          <span className="flex items-center gap-1">
            <Eye className="w-3.5 h-3.5" />
            {formatNumber(viewCount)}
          </span>
        )}
        {cloneCount && cloneCount > 0 && (
          <span className="flex items-center gap-1">
            <GitFork className="w-3.5 h-3.5" />
            {formatNumber(cloneCount)}
          </span>
        )}
        {isFeatured && (
          <span className="flex items-center gap-1 text-[var(--copper-10)]">
            <Sparkles className="w-3.5 h-3.5" />
          </span>
        )}
      </div>
    );
  }

  // Default inline variant
  return (
    <div className={cn('flex items-center gap-4 flex-wrap text-sm text-[var(--text-secondary)]', className)}>
      {/* Metrics */}
      {metrics.map((metric, index) => (
        <span key={index}>
          {index > 0 && <span className="sr-only">, </span>}
          {metric}
        </span>
      ))}

      {/* Featured Badge */}
      {isFeatured && (
        <>
          {metrics.length > 0 && <span className="text-[var(--border-subtle)]">&middot;</span>}
          <FeaturedBadge category={featuredCategory} />
        </>
      )}

      {/* Trending Badge */}
      {isTrending && (
        <>
          {(metrics.length > 0 || isFeatured) && (
            <span className="text-[var(--border-subtle)]">&middot;</span>
          )}
          <TrendingBadge />
        </>
      )}

      {/* Verified Badge (for creator attribution) */}
      {isVerified && <VerifiedBadge />}
    </div>
  );
}

// Featured Badge Component
function FeaturedBadge({ category }: { category?: string }) {
  return (
    <span className="badge-featured inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full">
      <Sparkles className="w-3.5 h-3.5" />
      <span className="text-xs font-semibold">
        Featured{category ? ` in ${category}` : ''}
      </span>
    </span>
  );
}

// Trending Badge Component
function TrendingBadge() {
  return (
    <span className="badge-trending inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full">
      <TrendingUp className="w-3.5 h-3.5" />
      <span className="text-xs font-semibold">Trending</span>
    </span>
  );
}

// Verified Badge Component
function VerifiedBadge() {
  return (
    <span title="Verified creator">
      <BadgeCheck className="w-4 h-4 text-[var(--teed-green-8)]" />
    </span>
  );
}

// Export individual badge components for reuse
export { FeaturedBadge, TrendingBadge, VerifiedBadge };
export default SocialProofMetrics;
