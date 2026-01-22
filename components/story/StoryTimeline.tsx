'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Clock,
  Plus,
  Minus,
  RefreshCw,
  ArrowRight,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  Eye,
  EyeOff,
  Link,
  Unlink,
  Image,
  Palette,
  User,
  AtSign,
  FileText,
  Star,
  StarOff,
  Move,
  PlusSquare,
  MinusSquare,
  Edit,
} from 'lucide-react';
import type {
  ProfileTimelineEntry,
  ProfileChangeType,
  StoryActionType,
  TimelineGroup,
} from '@/lib/types/profileStory';
import {
  formatStoryDate,
  getChangeTypeColors,
  getActionTypeFromChangeType,
  groupEntriesByPeriod,
  ACTION_TYPE_LABELS,
} from '@/lib/types/profileStory';
import type { TimelineEntry, ItemChangeType } from '@/lib/types/versionHistory';
import {
  formatTimelineEntry,
  getItemChangeTypeColors,
  formatStoryDateFromBag,
} from '@/lib/types/versionHistory';

// Unified entry type for both bag and profile stories
type UnifiedTimelineEntry = ProfileTimelineEntry | (TimelineEntry & { isVisible?: boolean });

interface StoryTimelineProps {
  // Data source - either bag-specific or profile-wide
  bagCode?: string;
  profileId?: string;

  // Display options
  maxItems?: number;
  isExpanded?: boolean;
  showFilters?: boolean;
  groupByTimePeriod?: boolean;

  // Owner capabilities
  isOwner?: boolean;

  // Callbacks
  onItemClick?: (entry: UnifiedTimelineEntry) => void;
  onBlockClick?: (blockId: string) => void;
  onBagClick?: (bagCode: string) => void;
}

interface FilterChip {
  type: StoryActionType;
  label: string;
  icon: typeof Plus;
  colorClass: string;
}

const FILTER_CHIPS: FilterChip[] = [
  {
    type: 'added',
    label: 'Added',
    icon: Plus,
    colorClass: 'teed-green',
  },
  {
    type: 'retired',
    label: 'Retired',
    icon: Minus,
    colorClass: 'stone',
  },
  {
    type: 'refined',
    label: 'Refined',
    icon: RefreshCw,
    colorClass: 'sand',
  },
  {
    type: 'reorganized',
    label: 'Reorganized',
    icon: Move,
    colorClass: 'grey',
  },
];

export default function StoryTimeline({
  bagCode,
  profileId,
  maxItems = 5,
  isExpanded = false,
  showFilters = true,
  groupByTimePeriod = true,
  isOwner = false,
  onItemClick,
  onBlockClick,
  onBagClick,
}: StoryTimelineProps) {
  const [timeline, setTimeline] = useState<UnifiedTimelineEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAll, setShowAll] = useState(isExpanded);
  const [showHidden, setShowHidden] = useState(false);
  const [activeFilters, setActiveFilters] = useState<StoryActionType[]>([]);
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);

  // Fetch timeline data
  useEffect(() => {
    fetchTimeline();
  }, [bagCode, profileId]);

  const fetchTimeline = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const endpoint = bagCode
        ? `/api/bags/${bagCode}/history${isOwner ? '?include_hidden=true' : ''}`
        : profileId
          ? `/api/profile/story${isOwner ? '?include_hidden=true' : ''}`
          : null;

      if (!endpoint) {
        setError('No data source specified');
        return;
      }

      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch story');
      }

      const data = await response.json();
      setTimeline(data.timeline || []);
    } catch (err) {
      setError('Unable to load story');
      console.error('[StoryTimeline] Error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Filter timeline based on active filters
  const filteredTimeline = useMemo(() => {
    let filtered = timeline;

    // Filter by visibility
    if (!showHidden) {
      filtered = filtered.filter((entry) => entry.isVisible !== false);
    }

    // Filter by action type
    if (activeFilters.length > 0) {
      filtered = filtered.filter((entry) => {
        const actionType = getActionTypeFromChangeType(
          entry.changeType as ProfileChangeType
        );
        return activeFilters.includes(actionType);
      });
    }

    return filtered;
  }, [timeline, activeFilters, showHidden]);

  // Group by time period if enabled
  const groupedTimeline = useMemo(() => {
    if (!groupByTimePeriod) return null;
    return groupEntriesByPeriod(filteredTimeline as ProfileTimelineEntry[]);
  }, [filteredTimeline, groupByTimePeriod]);

  // Count hidden entries
  const hiddenCount = useMemo(() => {
    return timeline.filter((entry) => entry.isVisible === false).length;
  }, [timeline]);

  // Count by filter type
  const countByType = useMemo(() => {
    const counts: Record<StoryActionType, number> = {
      added: 0,
      retired: 0,
      refined: 0,
      reorganized: 0,
    };

    filteredTimeline.forEach((entry) => {
      const actionType = getActionTypeFromChangeType(
        entry.changeType as ProfileChangeType
      );
      counts[actionType]++;
    });

    return counts;
  }, [filteredTimeline]);

  // Toggle filter
  const toggleFilter = useCallback((type: StoryActionType) => {
    setActiveFilters((prev) =>
      prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]
    );
  }, []);

  // Toggle visibility of an entry
  const toggleEntryVisibility = useCallback(
    async (entryId: string, currentVisibility: boolean) => {
      try {
        const endpoint = bagCode
          ? `/api/bags/${bagCode}/history/${entryId}`
          : `/api/profile/story/${entryId}`;

        const response = await fetch(endpoint, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ is_visible: !currentVisibility }),
        });

        if (response.ok) {
          setTimeline((prev) =>
            prev.map((entry) =>
              entry.id === entryId
                ? { ...entry, isVisible: !currentVisibility }
                : entry
            )
          );
        }
      } catch (err) {
        console.error('[StoryTimeline] Toggle visibility error:', err);
      }
    },
    [bagCode]
  );

  // Handle entry click
  const handleEntryClick = useCallback(
    (entry: UnifiedTimelineEntry) => {
      if (expandedEntryId === entry.id) {
        setExpandedEntryId(null);
      } else {
        setExpandedEntryId(entry.id);
        onItemClick?.(entry);
      }
    },
    [expandedEntryId, onItemClick]
  );

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-[var(--text-secondary)] text-sm py-4">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Loading story...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-sm text-[var(--text-tertiary)] py-4">{error}</div>
    );
  }

  if (timeline.length === 0) {
    return (
      <div className="text-sm text-[var(--text-tertiary)] py-4 italic">
        The story begins when you make your first change
      </div>
    );
  }

  const displayedTimeline = showAll
    ? filteredTimeline
    : filteredTimeline.slice(0, maxItems);
  const hasMore = filteredTimeline.length > maxItems;

  return (
    <div className="space-y-4">
      {/* Filter chips bar */}
      {showFilters && (
        <div className="flex flex-wrap gap-2">
          {FILTER_CHIPS.map((chip) => {
            const isActive = activeFilters.includes(chip.type);
            const count = countByType[chip.type];
            const Icon = chip.icon;

            return (
              <button
                key={chip.type}
                onClick={() => toggleFilter(chip.type)}
                className={`
                  inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full
                  text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? `bg-[var(--${chip.colorClass}-3)] text-[var(--${chip.colorClass}-11)]
                         ring-2 ring-[var(--${chip.colorClass}-6)] ring-offset-1 ring-offset-[var(--background)]`
                      : `bg-[var(--surface-elevated)] text-[var(--text-secondary)]
                         hover:bg-[var(--surface-hover)] border border-[var(--border-subtle)]`
                  }
                `}
              >
                <Icon className="w-3.5 h-3.5" />
                {chip.label}
                {count > 0 && (
                  <span className="ml-0.5 text-xs opacity-75">({count})</span>
                )}
              </button>
            );
          })}

          {/* Clear all button */}
          {activeFilters.length > 0 && (
            <button
              onClick={() => setActiveFilters([])}
              className="px-2 py-1.5 text-xs text-[var(--text-tertiary)]
                         hover:text-[var(--text-secondary)] transition-colors"
            >
              Clear all
            </button>
          )}
        </div>
      )}

      {/* Show hidden toggle (owner only) */}
      {isOwner && hiddenCount > 0 && (
        <button
          onClick={() => setShowHidden(!showHidden)}
          className={`
            inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm
            transition-colors
            ${
              showHidden
                ? 'bg-[var(--surface-alt)] text-[var(--text-primary)]'
                : 'text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]'
            }
          `}
        >
          {showHidden ? (
            <Eye className="w-3.5 h-3.5" />
          ) : (
            <EyeOff className="w-3.5 h-3.5" />
          )}
          {showHidden ? 'Showing' : 'Show'} {hiddenCount} hidden
        </button>
      )}

      {/* Timeline content */}
      {groupByTimePeriod && groupedTimeline ? (
        <GroupedTimelineView
          groups={groupedTimeline}
          expandedEntryId={expandedEntryId}
          isOwner={isOwner}
          showHidden={showHidden}
          onEntryClick={handleEntryClick}
          onToggleVisibility={toggleEntryVisibility}
          maxItems={maxItems}
          showAll={showAll}
        />
      ) : (
        <FlatTimelineView
          entries={displayedTimeline}
          expandedEntryId={expandedEntryId}
          isOwner={isOwner}
          onEntryClick={handleEntryClick}
          onToggleVisibility={toggleEntryVisibility}
        />
      )}

      {/* Show more/less */}
      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="flex items-center gap-1 text-sm text-[var(--teed-green-9)] hover:text-[var(--teed-green-10)] transition-colors"
        >
          {showAll ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Show less
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              Show {filteredTimeline.length - maxItems} more
            </>
          )}
        </button>
      )}
    </div>
  );
}

// Grouped timeline view with time period headers
function GroupedTimelineView({
  groups,
  expandedEntryId,
  isOwner,
  showHidden,
  onEntryClick,
  onToggleVisibility,
  maxItems,
  showAll,
}: {
  groups: TimelineGroup[];
  expandedEntryId: string | null;
  isOwner: boolean;
  showHidden: boolean;
  onEntryClick: (entry: UnifiedTimelineEntry) => void;
  onToggleVisibility: (id: string, isVisible: boolean) => void;
  maxItems: number;
  showAll: boolean;
}) {
  let totalShown = 0;

  return (
    <div className="space-y-6">
      {groups.map((group) => {
        // Skip if already shown enough items
        if (!showAll && totalShown >= maxItems) return null;

        const entriesToShow = showAll
          ? group.entries
          : group.entries.slice(0, maxItems - totalShown);

        totalShown += entriesToShow.length;

        if (entriesToShow.length === 0) return null;

        return (
          <div key={group.label}>
            <TimePeriodHeader
              label={group.label}
              count={group.entries.length}
              period={group.period}
            />
            <div className="relative mt-2">
              {/* Gradient timeline line */}
              <div
                className="absolute left-3 top-0 bottom-0 w-px"
                style={{
                  background:
                    group.period === 'this_week'
                      ? 'linear-gradient(to bottom, var(--teed-green-6) 0%, var(--border-subtle) 100%)'
                      : 'var(--border-subtle)',
                }}
              />
              <div className="space-y-1">
                {entriesToShow.map((entry, index) => (
                  <TimelineItem
                    key={entry.id}
                    entry={entry}
                    isExpanded={expandedEntryId === entry.id}
                    isOwner={isOwner}
                    onExpand={() => onEntryClick(entry)}
                    onToggleVisibility={() =>
                      onToggleVisibility(entry.id, entry.isVisible)
                    }
                    animationDelay={index * 50}
                  />
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Flat timeline view without grouping
function FlatTimelineView({
  entries,
  expandedEntryId,
  isOwner,
  onEntryClick,
  onToggleVisibility,
}: {
  entries: UnifiedTimelineEntry[];
  expandedEntryId: string | null;
  isOwner: boolean;
  onEntryClick: (entry: UnifiedTimelineEntry) => void;
  onToggleVisibility: (id: string, isVisible: boolean) => void;
}) {
  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-3 top-0 bottom-0 w-px bg-[var(--border-subtle)]" />
      <div className="space-y-1">
        {entries.map((entry, index) => (
          <TimelineItem
            key={entry.id}
            entry={entry}
            isExpanded={expandedEntryId === entry.id}
            isOwner={isOwner}
            onExpand={() => onEntryClick(entry)}
            onToggleVisibility={() =>
              onToggleVisibility(entry.id, entry.isVisible ?? true)
            }
            animationDelay={index * 50}
          />
        ))}
      </div>
    </div>
  );
}

// Time period header with visual interest
function TimePeriodHeader({
  label,
  count,
  period,
}: {
  label: string;
  count: number;
  period: 'this_week' | 'this_month' | 'earlier';
}) {
  const styles = {
    this_week: {
      bg: 'bg-gradient-to-r from-[var(--teed-green-2)] to-transparent',
      border: 'border-l-4 border-[var(--teed-green-6)]',
      text: 'text-[var(--teed-green-11)]',
    },
    this_month: {
      bg: 'bg-[var(--surface-elevated)]',
      border: 'border-l-2 border-[var(--border-subtle)]',
      text: 'text-[var(--text-secondary)]',
    },
    earlier: {
      bg: 'bg-transparent',
      border: 'border-l border-dashed border-[var(--border-subtle)]',
      text: 'text-[var(--text-tertiary)]',
    },
  };

  const style = styles[period];

  return (
    <div className={`${style.bg} ${style.border} pl-4 py-2 rounded-r-lg`}>
      <h4
        className={`text-xs font-semibold uppercase tracking-wider ${style.text}`}
      >
        {label}
        <span className="ml-2 font-normal opacity-75">({count})</span>
      </h4>
    </div>
  );
}

// Single timeline item
function TimelineItem({
  entry,
  isExpanded,
  isOwner,
  onExpand,
  onToggleVisibility,
  animationDelay = 0,
}: {
  entry: UnifiedTimelineEntry;
  isExpanded: boolean;
  isOwner: boolean;
  onExpand: () => void;
  onToggleVisibility: () => void;
  animationDelay?: number;
}) {
  const isHidden = entry.isVisible === false;
  const changeType = entry.changeType as ProfileChangeType | ItemChangeType;
  const colors = isProfileChangeType(changeType)
    ? getChangeTypeColors(changeType)
    : getItemChangeTypeColors(changeType as ItemChangeType);

  // Format date - month/year only (doctrine compliant)
  const formattedDate = formatStoryDate(entry.date);

  // Get summary text
  const summaryText =
    'summary' in entry
      ? entry.summary
      : formatTimelineEntry(entry as TimelineEntry);

  return (
    <div
      className={`
        relative group transition-all duration-300
        ${isHidden ? 'opacity-50' : ''}
      `}
      style={{
        animation: `timeline-entry-appear 0.3s ease-out forwards`,
        animationDelay: `${animationDelay}ms`,
        opacity: 0,
      }}
    >
      {/* Main entry row */}
      <div
        className={`
          relative flex items-start gap-3 pl-1 py-2 cursor-pointer
          rounded-lg transition-colors -mx-2 px-3
          ${
            isExpanded
              ? 'bg-[var(--teed-green-2)]'
              : 'hover:bg-[var(--surface-hover)]'
          }
        `}
        onClick={onExpand}
      >
        {/* Icon */}
        <TimelineIcon
          changeType={changeType}
          colors={colors}
          isExpanded={isExpanded}
        />

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-sm text-[var(--text-primary)]">{summaryText}</p>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            {formattedDate}
          </p>
        </div>

        {/* Owner visibility toggle - appears on hover */}
        {isOwner && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleVisibility();
            }}
            className={`
              opacity-0 group-hover:opacity-100 transition-opacity
              p-1.5 rounded-md hover:bg-[var(--surface-alt)]
              ${
                isHidden
                  ? 'text-[var(--text-tertiary)]'
                  : 'text-[var(--text-secondary)]'
              }
            `}
            title={isHidden ? 'Show event' : 'Hide event'}
          >
            {isHidden ? (
              <EyeOff className="w-3.5 h-3.5" />
            ) : (
              <Eye className="w-3.5 h-3.5" />
            )}
          </button>
        )}

        {/* Expand indicator for item entries */}
        {'itemName' in entry && entry.itemName && (
          <ChevronDown
            className={`
              w-4 h-4 text-[var(--text-tertiary)] transition-transform
              ${isExpanded ? 'rotate-180' : ''}
            `}
          />
        )}
      </div>

      {/* Inline expansion panel */}
      {isExpanded && entry.details && (
        <div className="ml-9 mt-2 p-4 bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] shadow-sm">
          <InlineDetails entry={entry} />
        </div>
      )}
    </div>
  );
}

// Timeline icon with colors
function TimelineIcon({
  changeType,
  colors,
  isExpanded,
}: {
  changeType: ProfileChangeType | ItemChangeType;
  colors: { bg: string; text: string; ring: string };
  isExpanded: boolean;
}) {
  const Icon = getIconForChangeType(changeType);

  return (
    <div
      className={`
        w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0
        ${colors.bg} ${colors.text}
        transition-all duration-300
        ${isExpanded ? `ring-2 ${colors.ring} scale-110` : ''}
      `}
    >
      <Icon className="w-3.5 h-3.5" />
    </div>
  );
}

// Get icon component for change type
function getIconForChangeType(
  changeType: ProfileChangeType | ItemChangeType
): typeof Plus {
  const icons: Record<string, typeof Plus> = {
    // Profile changes
    profile_created: Sparkles,
    social_link_added: Link,
    social_link_removed: Unlink,
    social_link_updated: Link,
    block_added: PlusSquare,
    block_removed: MinusSquare,
    block_updated: Edit,
    blocks_reordered: Move,
    bio_updated: FileText,
    display_name_updated: User,
    handle_updated: AtSign,
    avatar_updated: Image,
    banner_updated: Image,
    theme_updated: Palette,
    theme_colors_updated: Palette,
    theme_background_updated: Image,
    featured_bag_added: Star,
    featured_bag_removed: StarOff,
    featured_bags_reordered: Move,
    major_update: RefreshCw,
    // Bag item changes
    created: Sparkles,
    added: Plus,
    items_added: Plus,
    removed: Minus,
    items_removed: Minus,
    updated: RefreshCw,
    items_updated: RefreshCw,
    replaced: ArrowRight,
    restored: Plus,
    metadata_updated: Edit,
  };

  return icons[changeType] || Clock;
}

// Inline details panel
function InlineDetails({ entry }: { entry: UnifiedTimelineEntry }) {
  const details = entry.details;
  if (!details) return null;

  return (
    <div className="text-sm space-y-2">
      {details.fieldChanged && (
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-tertiary)]">Field:</span>
          <span className="text-[var(--text-secondary)]">
            {details.fieldChanged}
          </span>
        </div>
      )}

      {details.oldValue !== undefined && details.oldValue !== null && (
        <div className="flex items-start gap-2">
          <span className="text-[var(--stone-9)]">Previous:</span>
          <span className="text-[var(--text-tertiary)] line-through">
            {formatValue(details.oldValue)}
          </span>
        </div>
      )}

      {details.newValue !== undefined && details.newValue !== null && (
        <div className="flex items-start gap-2">
          <span className="text-[var(--teed-green-9)]">New:</span>
          <span className="text-[var(--text-primary)]">
            {formatValue(details.newValue)}
          </span>
        </div>
      )}

      {'platform' in details && details.platform && (
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-tertiary)]">Platform:</span>
          <span className="text-[var(--text-secondary)] capitalize">
            {details.platform}
          </span>
        </div>
      )}

      {'blockType' in details && details.blockType && (
        <div className="flex items-center gap-2">
          <span className="text-[var(--text-tertiary)]">Block type:</span>
          <span className="text-[var(--text-secondary)]">
            {details.blockType.replace(/_/g, ' ')}
          </span>
        </div>
      )}
    </div>
  );
}

// Helper to format values for display
function formatValue(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return value.toString();
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value === null) return '(empty)';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

// Type guard for profile change types
function isProfileChangeType(
  type: ProfileChangeType | ItemChangeType
): type is ProfileChangeType {
  const profileTypes: ProfileChangeType[] = [
    'social_link_added',
    'social_link_removed',
    'social_link_updated',
    'block_added',
    'block_removed',
    'block_updated',
    'blocks_reordered',
    'bio_updated',
    'display_name_updated',
    'handle_updated',
    'avatar_updated',
    'banner_updated',
    'theme_updated',
    'theme_colors_updated',
    'theme_background_updated',
    'featured_bag_added',
    'featured_bag_removed',
    'featured_bags_reordered',
    'profile_created',
    'major_update',
  ];
  return profileTypes.includes(type as ProfileChangeType);
}
