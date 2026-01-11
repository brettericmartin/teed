'use client';

import { useState, useEffect } from 'react';
import {
  Clock,
  Plus,
  Minus,
  RefreshCw,
  ArrowRight,
  Sparkles,
  Package,
  ChevronDown,
  ChevronUp,
  Loader2,
} from 'lucide-react';
import type { TimelineEntry, VersionHistoryResponse } from '@/lib/types/versionHistory';
import { formatTimelineEntry } from '@/lib/types/versionHistory';

interface VersionTimelineProps {
  bagCode: string;
  isExpanded?: boolean;
  maxItems?: number;
}

export default function VersionTimeline({ bagCode, isExpanded = false, maxItems = 5 }: VersionTimelineProps) {
  const [history, setHistory] = useState<VersionHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(isExpanded);

  useEffect(() => {
    fetchHistory();
  }, [bagCode]);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/bags/${bagCode}/history`);
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      setError('Unable to load history');
      console.error('[VersionTimeline] Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading history...</span>
      </div>
    );
  }

  if (error || !history) {
    return null;
  }

  const { timeline, bag } = history;

  if (timeline.length === 0) {
    return (
      <div className="text-sm text-[var(--text-tertiary)]">
        No changes recorded yet
      </div>
    );
  }

  const displayedTimeline = showAll ? timeline : timeline.slice(0, maxItems);
  const hasMore = timeline.length > maxItems;

  return (
    <div className="space-y-4">
      {/* Header with version info */}
      <div className="flex items-center justify-between text-sm">
        <div className="flex items-center gap-2 text-[var(--text-secondary)]">
          <Clock className="w-4 h-4" />
          <span>Version {bag.version_number}</span>
          {bag.update_count > 0 && (
            <span className="text-[var(--text-tertiary)]">
              ({bag.update_count} updates)
            </span>
          )}
        </div>
        {bag.last_major_update && (
          <span className="text-xs text-[var(--text-tertiary)]">
            Last updated {formatDate(bag.last_major_update)}
          </span>
        )}
      </div>

      {/* Timeline */}
      <div className="relative">
        {/* Vertical line */}
        <div className="absolute left-3 top-0 bottom-0 w-px bg-[var(--border-subtle)]" />

        <div className="space-y-3">
          {displayedTimeline.map((entry) => (
            <TimelineItem key={entry.id} entry={entry} />
          ))}
        </div>
      </div>

      {/* Show more/less */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-1 text-sm text-[var(--teed-green-9)] hover:text-[var(--teed-green-10)]"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show {timeline.length - maxItems} more
            </>
          )}
        </button>
      )}
    </div>
  );
}

function TimelineItem({ entry }: { entry: TimelineEntry }) {
  const getIcon = () => {
    switch (entry.changeType) {
      case 'created':
        return <Sparkles className="w-3 h-3" />;
      case 'added':
      case 'items_added':
        return <Plus className="w-3 h-3" />;
      case 'removed':
      case 'items_removed':
        return <Minus className="w-3 h-3" />;
      case 'replaced':
        return <ArrowRight className="w-3 h-3" />;
      case 'updated':
      case 'items_updated':
      case 'metadata_updated':
        return <RefreshCw className="w-3 h-3" />;
      case 'major_update':
        return <Package className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getIconBgColor = () => {
    switch (entry.changeType) {
      case 'created':
        return 'bg-[var(--teed-green-9)] text-white';
      case 'added':
      case 'items_added':
        return 'bg-[var(--teed-green-3)] text-[var(--teed-green-11)]';
      case 'removed':
      case 'items_removed':
        return 'bg-[var(--red-3)] text-[var(--red-11)]';
      case 'replaced':
        return 'bg-[var(--sky-3)] text-[var(--sky-11)]';
      case 'updated':
      case 'items_updated':
      case 'metadata_updated':
        return 'bg-[var(--amber-3)] text-[var(--amber-11)]';
      case 'major_update':
        return 'bg-[var(--sky-9)] text-white';
      default:
        return 'bg-[var(--surface-alt)] text-[var(--text-secondary)]';
    }
  };

  return (
    <div className="relative flex items-start gap-3 pl-1">
      {/* Icon */}
      <div
        className={`
          w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
          ${getIconBgColor()}
        `}
      >
        {getIcon()}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 pt-0.5">
        <p className="text-sm text-[var(--text-primary)]">
          {formatTimelineEntry(entry)}
        </p>
        <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
          {formatDate(entry.date)}
        </p>
      </div>
    </div>
  );
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  } else if (diffDays === 1) {
    return 'Yesterday';
  } else if (diffDays <= 7) {
    return `${diffDays} days ago`;
  } else if (diffDays <= 30) {
    const weeks = Math.floor(diffDays / 7);
    return `${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`;
  } else {
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  }
}

// Compact badge for displaying in bag cards
export function VersionBadge({ versionNumber, updateCount }: { versionNumber: number; updateCount: number }) {
  if (versionNumber <= 1 && updateCount === 0) return null;

  return (
    <span className="inline-flex items-center gap-1 text-xs text-[var(--text-tertiary)]">
      <Clock className="w-3 h-3" />
      v{versionNumber}
      {updateCount > 0 && <span>({updateCount} updates)</span>}
    </span>
  );
}
