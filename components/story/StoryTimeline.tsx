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
  ChevronRight,
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
  Pencil,
  Check,
  X,
  Package,
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
import type { TimelineEntry, ItemChangeType, ItemSnapshot } from '@/lib/types/versionHistory';
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
  profileHandle?: string; // Used for public profile story fetch

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
  profileHandle,
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
  }, [bagCode, profileId, profileHandle, isOwner]);

  const fetchTimeline = async () => {
    try {
      setIsLoading(true);
      setError(null);

      let endpoint: string | null = null;

      if (bagCode) {
        // Bag-specific timeline
        endpoint = `/api/bags/${bagCode}/history${isOwner ? '?include_hidden=true' : ''}`;
      } else if (profileHandle && !isOwner) {
        // Public profile timeline (uses handle for public API)
        endpoint = `/api/users/${profileHandle}/story`;
      } else if (profileId && isOwner) {
        // Owner's profile timeline (authenticated endpoint)
        endpoint = `/api/profile/story?include_hidden=true`;
      } else if (profileHandle) {
        // Fallback: use public API with handle
        endpoint = `/api/users/${profileHandle}/story`;
      }

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

  // Update note for an entry
  const handleNoteUpdate = useCallback(
    (entryId: string, note: string) => {
      setTimeline((prev) =>
        prev.map((entry) =>
          entry.id === entryId
            ? { ...entry, curatorNote: note || undefined }
            : entry
        )
      );
    },
    []
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
          onNoteUpdate={handleNoteUpdate}
          bagCode={bagCode}
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
          onNoteUpdate={handleNoteUpdate}
          bagCode={bagCode}
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
  onNoteUpdate,
  bagCode,
  maxItems,
  showAll,
}: {
  groups: TimelineGroup[];
  expandedEntryId: string | null;
  isOwner: boolean;
  showHidden: boolean;
  onEntryClick: (entry: UnifiedTimelineEntry) => void;
  onToggleVisibility: (id: string, isVisible: boolean) => void;
  onNoteUpdate: (entryId: string, note: string) => void;
  bagCode?: string;
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
                className="absolute left-5 top-0 bottom-0 w-px"
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
                    onNoteUpdate={onNoteUpdate}
                    bagCode={bagCode}
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
  onNoteUpdate,
  bagCode,
}: {
  entries: UnifiedTimelineEntry[];
  expandedEntryId: string | null;
  isOwner: boolean;
  onEntryClick: (entry: UnifiedTimelineEntry) => void;
  onToggleVisibility: (id: string, isVisible: boolean) => void;
  onNoteUpdate: (entryId: string, note: string) => void;
  bagCode?: string;
}) {
  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-5 top-0 bottom-0 w-px bg-[var(--border-subtle)]" />
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
            onNoteUpdate={onNoteUpdate}
            bagCode={bagCode}
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

// Single timeline item with thumbnail support
function TimelineItem({
  entry,
  isExpanded,
  isOwner,
  onExpand,
  onToggleVisibility,
  onNoteUpdate,
  bagCode,
  animationDelay = 0,
}: {
  entry: UnifiedTimelineEntry;
  isExpanded: boolean;
  isOwner: boolean;
  onExpand: () => void;
  onToggleVisibility: () => void;
  onNoteUpdate?: (entryId: string, note: string) => void;
  bagCode?: string;
  animationDelay?: number;
}) {
  const [isEditingNote, setIsEditingNote] = useState(false);
  const [noteValue, setNoteValue] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);

  const isHidden = entry.isVisible === false;
  const changeType = entry.changeType as ProfileChangeType | ItemChangeType;
  const colors = isProfileChangeType(changeType)
    ? getChangeTypeColors(changeType)
    : getItemChangeTypeColors(changeType as ItemChangeType);

  // Check if this is a bag item entry with click-to-item support
  const timelineEntry = entry as TimelineEntry;
  const isItemEntry = 'type' in entry && entry.type === 'item';
  const itemExists = 'itemExists' in timelineEntry ? timelineEntry.itemExists : false;
  const itemSnapshot = 'itemSnapshot' in timelineEntry ? timelineEntry.itemSnapshot as ItemSnapshot | undefined : undefined;
  const curatorNote = 'curatorNote' in timelineEntry ? timelineEntry.curatorNote : undefined;
  const isRetired = changeType === 'removed';
  const isClickable = isItemEntry && itemExists;

  // Get photo URL - from current item or preserved snapshot
  const photoUrl = itemSnapshot?.photo_url || null;

  // Format date - month/year only (doctrine compliant)
  const formattedDate = formatStoryDate(entry.date);

  // Get summary text
  const summaryText =
    'summary' in entry
      ? entry.summary
      : formatTimelineEntry(entry as TimelineEntry);

  // Handle note editing
  const handleStartEditNote = (e: React.MouseEvent) => {
    e.stopPropagation();
    setNoteValue(curatorNote || '');
    setIsEditingNote(true);
  };

  const handleSaveNote = async () => {
    if (!bagCode) return;

    setIsSavingNote(true);
    try {
      const response = await fetch(`/api/bags/${bagCode}/history/${entry.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ change_note: noteValue.trim() || null }),
      });

      if (response.ok) {
        onNoteUpdate?.(entry.id, noteValue.trim());
        setIsEditingNote(false);
      }
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setIsSavingNote(false);
    }
  };

  const handleCancelEdit = () => {
    setIsEditingNote(false);
    setNoteValue('');
  };

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
          relative flex items-start gap-3 pl-1 py-2.5
          rounded-lg transition-all -mx-2 px-3
          ${isClickable ? 'cursor-pointer hover:translate-x-0.5 hover:shadow-sm' : isRetired ? 'cursor-default' : 'cursor-pointer'}
          ${isExpanded ? 'bg-[var(--teed-green-2)]' : 'hover:bg-[var(--surface-hover)]'}
          ${isRetired && !isExpanded ? 'border border-dashed border-[var(--grey-5)] bg-[var(--grey-1)]' : ''}
        `}
        onClick={onExpand}
      >
        {/* Thumbnail for item entries (40x40) */}
        {isItemEntry && photoUrl ? (
          <div
            className={`
              w-10 h-10 rounded-lg flex-shrink-0 overflow-hidden
              ${isRetired ? 'grayscale opacity-60 border border-[var(--grey-6)]' : 'border border-[var(--border-subtle)]'}
              transition-all duration-200 group-hover:scale-105
            `}
          >
            <img
              src={photoUrl}
              alt=""
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        ) : isItemEntry ? (
          /* Placeholder for items without photos */
          <div
            className={`
              w-10 h-10 rounded-lg flex-shrink-0 flex items-center justify-center
              ${isRetired ? 'bg-[var(--grey-3)] border border-dashed border-[var(--grey-6)]' : 'bg-[var(--surface-elevated)] border border-[var(--border-subtle)]'}
            `}
          >
            <Package className={`w-5 h-5 ${isRetired ? 'text-[var(--grey-8)]' : 'text-[var(--text-tertiary)]'}`} />
          </div>
        ) : (
          /* Icon for non-item entries */
          <TimelineIcon
            changeType={changeType}
            colors={colors}
            isExpanded={isExpanded}
          />
        )}

        {/* Content */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-2">
            <p className={`text-sm ${isHidden ? 'line-through text-[var(--text-tertiary)]' : 'text-[var(--text-primary)]'}`}>
              {summaryText}
            </p>
            {isRetired && (
              <span className="text-[10px] uppercase tracking-wide px-1.5 py-0.5 bg-[var(--grey-3)] text-[var(--grey-10)] rounded font-medium">
                retired
              </span>
            )}
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
            {formattedDate}
          </p>

          {/* Curator note display */}
          {curatorNote && !isEditingNote && (
            <p className="text-xs text-[var(--text-secondary)] mt-1.5 italic border-l-2 border-[var(--teed-green-6)] pl-2">
              "{curatorNote}"
            </p>
          )}

          {/* Inline note editor (owner only) */}
          {isEditingNote && (
            <div className="mt-2 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
              <input
                type="text"
                value={noteValue}
                onChange={(e) => setNoteValue(e.target.value.slice(0, 140))}
                placeholder="Add a note (140 chars max)..."
                className="flex-1 text-xs px-2 py-1.5 rounded border border-[var(--border-subtle)] bg-[var(--surface)] focus:outline-none focus:border-[var(--teed-green-6)] focus:ring-1 focus:ring-[var(--teed-green-6)]"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveNote();
                  if (e.key === 'Escape') handleCancelEdit();
                }}
              />
              <button
                onClick={handleSaveNote}
                disabled={isSavingNote}
                className="p-1 text-[var(--teed-green-9)] hover:bg-[var(--teed-green-2)] rounded transition-colors"
              >
                <Check className="w-4 h-4" />
              </button>
              <button
                onClick={handleCancelEdit}
                className="p-1 text-[var(--text-tertiary)] hover:bg-[var(--surface-alt)] rounded transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <span className="text-[10px] text-[var(--text-tertiary)]">{noteValue.length}/140</span>
            </div>
          )}
        </div>

        {/* Action buttons container */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {/* Note edit button (owner only) - appears on hover */}
          {isOwner && !isEditingNote && (
            <button
              onClick={handleStartEditNote}
              className={`
                opacity-0 group-hover:opacity-100 transition-opacity
                p-1.5 rounded-md hover:bg-[var(--surface-alt)] text-[var(--text-tertiary)]
              `}
              title={curatorNote ? 'Edit note' : 'Add note'}
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
          )}

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
                ${isHidden ? 'text-[var(--text-tertiary)]' : 'text-[var(--text-secondary)]'}
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

          {/* Clickable indicator - chevron for items that exist */}
          {isClickable && (
            <ChevronRight className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--teed-green-9)] transition-colors" />
          )}
        </div>
      </div>

      {/* Inline expansion panel for retired items (show snapshot) */}
      {isExpanded && isRetired && itemSnapshot && (
        <div className="ml-12 mt-2 p-4 bg-[var(--grey-2)] rounded-xl border border-dashed border-[var(--grey-5)] shadow-sm">
          <div className="text-xs text-[var(--grey-11)] mb-2 font-medium">This item was retired</div>
          <div className="text-sm space-y-1">
            {itemSnapshot.custom_name && (
              <p className="text-[var(--text-primary)]">{itemSnapshot.custom_name}</p>
            )}
            {itemSnapshot.brand && (
              <p className="text-[var(--text-secondary)] text-xs">{itemSnapshot.brand}</p>
            )}
            {itemSnapshot.custom_description && (
              <p className="text-[var(--text-tertiary)] text-xs mt-2">{itemSnapshot.custom_description}</p>
            )}
          </div>
        </div>
      )}

      {/* Inline expansion panel for other entries */}
      {isExpanded && !isRetired && entry.details && (
        <div className="ml-12 mt-2 p-4 bg-[var(--surface)] rounded-xl border border-[var(--border-subtle)] shadow-sm">
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
          <span className="text-[var(--grey-9)]">Previous:</span>
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
