/**
 * Version History Types
 * Track changes to bags and items over time for changelog badges and timeline UI
 */

export type BagChangeType =
  | 'created'
  | 'items_added'
  | 'items_removed'
  | 'items_updated'
  | 'metadata_updated'
  | 'major_update';

export type ItemChangeType =
  | 'added'
  | 'updated'
  | 'replaced'
  | 'removed'
  | 'restored';

export interface BagVersionHistory {
  id: string;
  bag_id: string;
  version_number: number;
  change_type: BagChangeType;
  change_summary: string | null;
  items_changed: number;
  snapshot: BagSnapshot | null;
  created_at: string;
}

export interface BagSnapshot {
  title: string;
  description: string | null;
  items_count: number;
  items: Array<{
    id: string;
    custom_name: string | null;
    photo_url: string | null;
    sort_index: number;
  }>;
}

export interface ItemVersionHistory {
  id: string;
  item_id: string;
  bag_id: string;
  change_type: ItemChangeType;
  field_changed: string | null;
  old_value: unknown;
  new_value: unknown;
  change_note: string | null;
  is_visible: boolean;
  created_at: string;
}

// For UI display
export interface TimelineEntry {
  id: string;
  date: string;
  type: 'bag' | 'item';
  changeType: BagChangeType | ItemChangeType;
  summary: string;
  itemName?: string;
  isVisible?: boolean;
  details?: {
    fieldChanged?: string;
    oldValue?: string;
    newValue?: string;
    itemsAffected?: number;
  };
}

export interface VersionHistoryResponse {
  bag: {
    id: string;
    title: string;
    version_number: number;
    update_count: number;
    last_major_update: string | null;
    created_at: string;
  };
  versions: BagVersionHistory[];
  itemChanges: ItemVersionHistory[];
  timeline: TimelineEntry[];
}

// For "Why I switched" feature
export interface ItemReplacement {
  newItemId: string;
  replacedItemId: string;
  reason: string;
}

// Bag with version tracking fields
export interface BagWithVersioning {
  id: string;
  code: string;
  title: string;
  description: string | null;
  is_public: boolean;
  version_number: number;
  update_count: number;
  last_major_update: string | null;
  created_at: string;
  updated_at: string | null;
}

// For changelog badge display
export interface ChangelogBadge {
  type: 'new' | 'updated' | 'major_update';
  label: string;
  date: string;
  daysAgo: number;
}

/**
 * Get a human-readable change badge for a bag
 */
export function getChangelogBadge(bag: BagWithVersioning): ChangelogBadge | null {
  const now = new Date();
  const createdAt = new Date(bag.created_at);
  const lastUpdate = bag.last_major_update ? new Date(bag.last_major_update) : null;

  const daysSinceCreation = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const daysSinceUpdate = lastUpdate
    ? Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // New badge for bags less than 30 days old
  if (daysSinceCreation <= 30) {
    return {
      type: 'new',
      label: 'New',
      date: bag.created_at,
      daysAgo: daysSinceCreation,
    };
  }

  // Updated badge for bags with recent major updates
  if (daysSinceUpdate !== null && daysSinceUpdate <= 90) {
    return {
      type: daysSinceUpdate <= 7 ? 'major_update' : 'updated',
      label: formatUpdateLabel(daysSinceUpdate, lastUpdate!),
      date: bag.last_major_update!,
      daysAgo: daysSinceUpdate,
    };
  }

  return null;
}

/**
 * Format date as month/year - doctrine compliant
 * Never shows relative time like "days ago" to avoid freshness pressure
 */
function formatUpdateLabel(_daysAgo: number, date: Date): string {
  // Always use month/year format to avoid freshness pressure
  return `${date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
}

/**
 * Format any date as month/year only - doctrine compliant
 */
export function formatStoryDateFromBag(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
}

/**
 * Format a timeline entry for display
 * Uses doctrine-compliant language: "Retired" instead of "Removed"
 */
export function formatTimelineEntry(entry: TimelineEntry): string {
  switch (entry.changeType) {
    case 'created':
      return 'Created this bag';
    case 'items_added':
      return `Added ${entry.details?.itemsAffected || ''} ${entry.details?.itemsAffected === 1 ? 'item' : 'items'}`.trim();
    case 'items_removed':
      // Use "Retired" instead of "Removed" - doctrine compliant
      return `Retired ${entry.details?.itemsAffected || ''} ${entry.details?.itemsAffected === 1 ? 'item' : 'items'}`.trim();
    case 'items_updated':
      return `Refined ${entry.details?.itemsAffected || ''} ${entry.details?.itemsAffected === 1 ? 'item' : 'items'}`.trim();
    case 'metadata_updated':
      return 'Refined bag details';
    case 'major_update':
      return entry.summary || 'Major update';
    case 'added':
      return entry.itemName ? `Added "${entry.itemName}"` : 'Added item';
    case 'updated':
      return entry.itemName
        ? `Refined "${entry.itemName}" ${entry.details?.fieldChanged || ''}`.trim()
        : 'Refined item';
    case 'replaced':
      return entry.itemName
        ? `Switched to "${entry.itemName}"`
        : 'Switched item';
    case 'removed':
      // Use "Retired" instead of "Removed" - doctrine compliant
      return entry.itemName ? `Retired "${entry.itemName}"` : 'Retired item';
    case 'restored':
      return entry.itemName ? `Restored "${entry.itemName}"` : 'Restored item';
    default:
      return entry.summary || 'Change';
  }
}

/**
 * Get neutral color classes for item change types
 * Uses doctrine-compliant colors: neutral tones, no red for removals
 */
export function getItemChangeTypeColors(changeType: ItemChangeType): {
  bg: string;
  text: string;
  ring: string;
} {
  switch (changeType) {
    case 'added':
      return {
        bg: 'bg-[var(--teed-green-2)]',
        text: 'text-[var(--teed-green-10)]',
        ring: 'ring-[var(--teed-green-5)]',
      };
    case 'removed':
      // Neutral stone/sand for removals - NOT red
      return {
        bg: 'bg-[var(--stone-2)]',
        text: 'text-[var(--stone-10)]',
        ring: 'ring-[var(--stone-5)]',
      };
    case 'updated':
      // Warm sand for refinements
      return {
        bg: 'bg-[var(--sand-2)]',
        text: 'text-[var(--sand-10)]',
        ring: 'ring-[var(--sand-5)]',
      };
    case 'replaced':
      return {
        bg: 'bg-[var(--sky-2)]',
        text: 'text-[var(--sky-10)]',
        ring: 'ring-[var(--sky-5)]',
      };
    case 'restored':
      return {
        bg: 'bg-[var(--teed-green-2)]',
        text: 'text-[var(--teed-green-10)]',
        ring: 'ring-[var(--teed-green-5)]',
      };
    default:
      return {
        bg: 'bg-[var(--surface-elevated)]',
        text: 'text-[var(--text-secondary)]',
        ring: 'ring-[var(--border-subtle)]',
      };
  }
}
