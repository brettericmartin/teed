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

function formatUpdateLabel(daysAgo: number, date: Date): string {
  if (daysAgo === 0) return 'Updated today';
  if (daysAgo === 1) return 'Updated yesterday';
  if (daysAgo <= 7) return `Updated ${daysAgo} days ago`;
  if (daysAgo <= 30) return `Updated ${Math.floor(daysAgo / 7)} weeks ago`;

  // Format as month/year for older updates
  return `Updated ${date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`;
}

/**
 * Format a timeline entry for display
 */
export function formatTimelineEntry(entry: TimelineEntry): string {
  switch (entry.changeType) {
    case 'created':
      return 'Created this bag';
    case 'items_added':
      return `Added ${entry.details?.itemsAffected || 'items'} items`;
    case 'items_removed':
      return `Removed ${entry.details?.itemsAffected || 'items'} items`;
    case 'items_updated':
      return `Updated ${entry.details?.itemsAffected || 'items'} items`;
    case 'metadata_updated':
      return 'Updated bag details';
    case 'major_update':
      return entry.summary || 'Major update';
    case 'added':
      return entry.itemName ? `Added "${entry.itemName}"` : 'Added item';
    case 'updated':
      return entry.itemName
        ? `Updated "${entry.itemName}" ${entry.details?.fieldChanged || ''}`
        : 'Updated item';
    case 'replaced':
      return entry.itemName
        ? `Switched to "${entry.itemName}"`
        : 'Replaced item';
    case 'removed':
      return entry.itemName ? `Removed "${entry.itemName}"` : 'Removed item';
    case 'restored':
      return entry.itemName ? `Restored "${entry.itemName}"` : 'Restored item';
    default:
      return entry.summary || 'Change';
  }
}
