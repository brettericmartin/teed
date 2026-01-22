/**
 * Profile Story Types
 * Track changes to profiles for "The Story" timeline feature
 */

// All possible profile change types
export type ProfileChangeType =
  // Social links
  | 'social_link_added'
  | 'social_link_removed'
  | 'social_link_updated'
  // Profile blocks
  | 'block_added'
  | 'block_removed'
  | 'block_updated'
  | 'blocks_reordered'
  // Profile metadata
  | 'bio_updated'
  | 'display_name_updated'
  | 'handle_updated'
  | 'avatar_updated'
  | 'banner_updated'
  // Theme changes
  | 'theme_updated'
  | 'theme_colors_updated'
  | 'theme_background_updated'
  // Featured bags
  | 'featured_bag_added'
  | 'featured_bag_removed'
  | 'featured_bags_reordered'
  // General
  | 'profile_created'
  | 'major_update';

// Entity types for grouping
export type ProfileEntityType =
  | 'social_link'
  | 'block'
  | 'theme'
  | 'featured_bag'
  | 'profile';

// Single story entry from database
export interface ProfileStoryEntry {
  id: string;
  profile_id: string;
  change_type: ProfileChangeType;
  entity_type: ProfileEntityType | null;
  entity_id: string | null;
  field_changed: string | null;
  old_value: unknown;
  new_value: unknown;
  change_summary: string | null;
  change_note: string | null;
  is_visible: boolean;
  created_at: string;
}

// Settings for story display per action type
export type StoryVisibilityDefaults = {
  [K in ProfileChangeType]: boolean;
};

// Full story settings stored in creator_settings.story_settings
export interface ProfileStorySettings {
  enabled: boolean;
  defaults: StoryVisibilityDefaults;
  show_timestamps: boolean;
  max_public_entries: number;
}

// Default settings values
export const DEFAULT_STORY_SETTINGS: ProfileStorySettings = {
  enabled: true,
  defaults: {
    // Social links
    social_link_added: true,
    social_link_removed: true,
    social_link_updated: false,
    // Blocks
    block_added: true,
    block_removed: true,
    block_updated: false,
    blocks_reordered: false,
    // Profile metadata
    bio_updated: true,
    display_name_updated: true,
    handle_updated: false,
    avatar_updated: true,
    banner_updated: true,
    // Theme
    theme_updated: true,
    theme_colors_updated: false,
    theme_background_updated: false,
    // Featured bags
    featured_bag_added: true,
    featured_bag_removed: true,
    featured_bags_reordered: false,
    // General
    profile_created: true,
    major_update: true,
  },
  show_timestamps: true,
  max_public_entries: 50,
};

// Timeline entry for UI display (processed version)
export interface ProfileTimelineEntry {
  id: string;
  date: string;
  changeType: ProfileChangeType;
  entityType: ProfileEntityType | null;
  summary: string;
  isVisible: boolean;
  details?: {
    entityId?: string;
    fieldChanged?: string;
    oldValue?: unknown;
    newValue?: unknown;
    platform?: string; // For social links
    blockType?: string; // For blocks
  };
}

// API response for profile story endpoint
export interface ProfileStoryResponse {
  profile: {
    id: string;
    handle: string;
    display_name: string;
    created_at: string;
  };
  entries: ProfileStoryEntry[];
  timeline: ProfileTimelineEntry[];
  settings: ProfileStorySettings;
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

// Request body for toggling event visibility
export interface ToggleStoryVisibilityRequest {
  eventId: string;
  isVisible: boolean;
}

// Request body for updating story settings
export interface UpdateStorySettingsRequest {
  enabled?: boolean;
  defaults?: Partial<StoryVisibilityDefaults>;
  show_timestamps?: boolean;
  max_public_entries?: number;
}

// Response for settings update
export interface StorySettingsResponse {
  success: boolean;
  settings: ProfileStorySettings;
}

/**
 * Get a human-readable summary for a change type
 * Uses doctrine-compliant language: "Retired" instead of "Removed"
 */
export function getChangeTypeSummary(changeType: ProfileChangeType): string {
  const summaries: Record<ProfileChangeType, string> = {
    social_link_added: 'Added a social link',
    social_link_removed: 'Retired a social link',
    social_link_updated: 'Refined a social link',
    block_added: 'Added a profile block',
    block_removed: 'Retired a profile block',
    block_updated: 'Refined a profile block',
    blocks_reordered: 'Reorganized profile blocks',
    bio_updated: 'Refined bio',
    display_name_updated: 'Changed display name',
    handle_updated: 'Changed handle',
    avatar_updated: 'Updated avatar',
    banner_updated: 'Updated banner',
    theme_updated: 'Refined theme',
    theme_colors_updated: 'Changed theme colors',
    theme_background_updated: 'Changed background',
    featured_bag_added: 'Featured a bag',
    featured_bag_removed: 'Unfeatured a bag',
    featured_bags_reordered: 'Reorganized featured bags',
    profile_created: 'Created profile',
    major_update: 'Major profile update',
  };
  return summaries[changeType] || 'Profile updated';
}

/**
 * Get icon name for a change type (using lucide-react icons)
 */
export function getChangeTypeIcon(changeType: ProfileChangeType): string {
  const icons: Record<ProfileChangeType, string> = {
    social_link_added: 'link',
    social_link_removed: 'unlink',
    social_link_updated: 'link-2',
    block_added: 'plus-square',
    block_removed: 'minus-square',
    block_updated: 'edit',
    blocks_reordered: 'move',
    bio_updated: 'file-text',
    display_name_updated: 'user',
    handle_updated: 'at-sign',
    avatar_updated: 'image',
    banner_updated: 'image',
    theme_updated: 'palette',
    theme_colors_updated: 'droplet',
    theme_background_updated: 'image',
    featured_bag_added: 'star',
    featured_bag_removed: 'star-off',
    featured_bags_reordered: 'list-ordered',
    profile_created: 'user-plus',
    major_update: 'refresh-cw',
  };
  return icons[changeType] || 'edit';
}

/**
 * Get neutral color classes for a change type
 * Uses doctrine-compliant colors: neutral tones, no red for removals
 */
export function getChangeTypeColors(changeType: ProfileChangeType): {
  bg: string;
  text: string;
  ring: string;
} {
  switch (changeType) {
    case 'profile_created':
      return {
        bg: 'bg-gradient-to-br from-[var(--teed-green-8)] to-[var(--teed-green-10)]',
        text: 'text-white',
        ring: 'ring-[var(--teed-green-4)]',
      };
    case 'social_link_added':
    case 'block_added':
    case 'featured_bag_added':
      return {
        bg: 'bg-[var(--teed-green-2)]',
        text: 'text-[var(--teed-green-10)]',
        ring: 'ring-[var(--teed-green-5)]',
      };
    case 'social_link_removed':
    case 'block_removed':
    case 'featured_bag_removed':
      // Neutral stone/sand for removals - NOT red
      return {
        bg: 'bg-[var(--stone-2)]',
        text: 'text-[var(--stone-10)]',
        ring: 'ring-[var(--stone-5)]',
      };
    case 'social_link_updated':
    case 'block_updated':
    case 'bio_updated':
    case 'display_name_updated':
    case 'handle_updated':
      // Warm sand for refinements
      return {
        bg: 'bg-[var(--sand-2)]',
        text: 'text-[var(--sand-10)]',
        ring: 'ring-[var(--sand-5)]',
      };
    case 'avatar_updated':
    case 'banner_updated':
    case 'theme_updated':
    case 'theme_colors_updated':
    case 'theme_background_updated':
      return {
        bg: 'bg-[var(--sky-2)]',
        text: 'text-[var(--sky-10)]',
        ring: 'ring-[var(--sky-5)]',
      };
    case 'blocks_reordered':
    case 'featured_bags_reordered':
      return {
        bg: 'bg-[var(--grey-2)]',
        text: 'text-[var(--grey-10)]',
        ring: 'ring-[var(--grey-5)]',
      };
    case 'major_update':
      return {
        bg: 'bg-gradient-to-br from-[var(--sky-8)] to-[var(--sky-10)]',
        text: 'text-white',
        ring: 'ring-[var(--sky-4)]',
      };
    default:
      return {
        bg: 'bg-[var(--surface-elevated)]',
        text: 'text-[var(--text-secondary)]',
        ring: 'ring-[var(--border-subtle)]',
      };
  }
}

/**
 * Format a profile timeline entry for display
 */
export function formatProfileTimelineEntry(entry: ProfileTimelineEntry): string {
  if (entry.summary) return entry.summary;
  return getChangeTypeSummary(entry.changeType);
}

/**
 * Format date as month/year only - doctrine compliant
 * Never shows relative time like "3 days ago"
 */
export function formatStoryDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    year: 'numeric',
  });
  // Returns: "Mar 2026", "Jan 2025", etc.
}

/**
 * Group timeline entries by time period for visual display
 */
export type TimePeriod = 'this_week' | 'this_month' | 'earlier';

export interface TimelineGroup {
  label: string;
  period: TimePeriod;
  entries: ProfileTimelineEntry[];
  isCollapsed?: boolean;
}

export function groupEntriesByPeriod(entries: ProfileTimelineEntry[]): TimelineGroup[] {
  const now = new Date();
  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const thisWeek: ProfileTimelineEntry[] = [];
  const thisMonth: ProfileTimelineEntry[] = [];
  const earlier: ProfileTimelineEntry[] = [];

  for (const entry of entries) {
    const entryDate = new Date(entry.date);
    if (entryDate >= oneWeekAgo) {
      thisWeek.push(entry);
    } else if (entryDate >= oneMonthAgo) {
      thisMonth.push(entry);
    } else {
      earlier.push(entry);
    }
  }

  const groups: TimelineGroup[] = [];

  if (thisWeek.length > 0) {
    groups.push({
      label: 'This Week',
      period: 'this_week',
      entries: thisWeek,
    });
  }

  if (thisMonth.length > 0) {
    groups.push({
      label: 'This Month',
      period: 'this_month',
      entries: thisMonth,
    });
  }

  if (earlier.length > 0) {
    groups.push({
      label: 'Earlier',
      period: 'earlier',
      entries: earlier,
      isCollapsed: true,
    });
  }

  return groups;
}

/**
 * Unified story action types for filter chips
 */
export type StoryActionType = 'added' | 'retired' | 'refined' | 'reorganized';

export function getActionTypeFromChangeType(changeType: ProfileChangeType): StoryActionType {
  if (changeType.includes('_added') || changeType === 'profile_created') {
    return 'added';
  }
  if (changeType.includes('_removed')) {
    return 'retired';
  }
  if (changeType.includes('_reordered')) {
    return 'reorganized';
  }
  return 'refined';
}

export const ACTION_TYPE_LABELS: Record<StoryActionType, string> = {
  added: 'Added',
  retired: 'Retired',
  refined: 'Refined',
  reorganized: 'Reorganized',
};
