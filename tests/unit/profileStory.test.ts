/**
 * Unit Tests for Profile Story Types and Helpers
 *
 * Tests the profileStory.ts module for:
 * - Date formatting (doctrine compliance)
 * - Color palette (neutral for removals)
 * - Change type categorization
 * - Timeline grouping
 */

import {
  formatStoryDate,
  getChangeTypeColors,
  getChangeTypeIcon,
  getActionTypeFromChangeType,
  groupEntriesByPeriod,
  getChangeTypeSummary,
  DEFAULT_STORY_SETTINGS,
  ACTION_TYPE_LABELS,
} from '@/lib/types/profileStory';

import type {
  ProfileChangeType,
  ProfileStorySettings,
  ProfileTimelineEntry,
  StoryActionType,
} from '@/lib/types/profileStory';

// Mock date for consistent testing
const MOCK_DATE = new Date('2026-01-19T12:00:00Z');
const MOCK_DATE_STRING = '2026-01-19T12:00:00Z';

describe('formatStoryDate', () => {
  test('returns month and year format', () => {
    const result = formatStoryDate('2026-01-15T10:30:00Z');
    expect(result).toMatch(/Jan\s+2026/);
  });

  test('does not include day or time', () => {
    const result = formatStoryDate('2026-03-25T15:45:30Z');
    expect(result).not.toMatch(/25/);
    expect(result).not.toMatch(/15:45/);
    expect(result).toMatch(/Mar\s+2026/);
  });

  test('does not use relative time (doctrine compliance)', () => {
    const recentDate = new Date();
    recentDate.setDate(recentDate.getDate() - 1); // Yesterday
    const result = formatStoryDate(recentDate.toISOString());

    // Should NOT contain relative time
    expect(result).not.toMatch(/yesterday/i);
    expect(result).not.toMatch(/\d+ days? ago/i);
    expect(result).not.toMatch(/today/i);

    // Should contain month and year
    expect(result).toMatch(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}/);
  });
});

describe('getChangeTypeColors', () => {
  test('returns neutral colors for removed/retired items', () => {
    const removeTypes: ProfileChangeType[] = [
      'social_link_removed',
      'block_removed',
      'featured_bag_removed',
    ];

    for (const type of removeTypes) {
      const colors = getChangeTypeColors(type);

      // Should NOT use red
      expect(colors.bg).not.toMatch(/red/i);
      expect(colors.text).not.toMatch(/red/i);
      expect(colors.ring).not.toMatch(/red/i);

      // Should use neutral colors (stone, grey, or sand)
      const hasNeutral =
        colors.bg.includes('stone') ||
        colors.bg.includes('grey') ||
        colors.bg.includes('sand');
      expect(hasNeutral).toBeTruthy();
    }
  });

  test('returns teed-green for added items', () => {
    const addTypes: ProfileChangeType[] = [
      'social_link_added',
      'block_added',
      'featured_bag_added',
      'profile_created',
    ];

    for (const type of addTypes) {
      const colors = getChangeTypeColors(type);
      expect(colors.bg).toMatch(/teed-green/i);
    }
  });

  test('returns warm colors for updates', () => {
    const updateTypes: ProfileChangeType[] = [
      'social_link_updated',
      'block_updated',
      'bio_updated',
      'display_name_updated',
    ];

    for (const type of updateTypes) {
      const colors = getChangeTypeColors(type);
      // Should use sand or amber (warm neutral)
      const hasWarm =
        colors.bg.includes('sand') ||
        colors.bg.includes('amber');
      expect(hasWarm).toBeTruthy();
    }
  });
});

describe('getActionTypeFromChangeType', () => {
  test('categorizes add actions correctly', () => {
    expect(getActionTypeFromChangeType('social_link_added')).toBe('added');
    expect(getActionTypeFromChangeType('block_added')).toBe('added');
    expect(getActionTypeFromChangeType('featured_bag_added')).toBe('added');
    expect(getActionTypeFromChangeType('profile_created')).toBe('added');
  });

  test('categorizes remove actions as retired', () => {
    expect(getActionTypeFromChangeType('social_link_removed')).toBe('retired');
    expect(getActionTypeFromChangeType('block_removed')).toBe('retired');
    expect(getActionTypeFromChangeType('featured_bag_removed')).toBe('retired');
  });

  test('categorizes update actions as refined', () => {
    expect(getActionTypeFromChangeType('social_link_updated')).toBe('refined');
    expect(getActionTypeFromChangeType('block_updated')).toBe('refined');
    expect(getActionTypeFromChangeType('bio_updated')).toBe('refined');
  });

  test('categorizes reorder actions as reorganized', () => {
    expect(getActionTypeFromChangeType('blocks_reordered')).toBe('reorganized');
    expect(getActionTypeFromChangeType('featured_bags_reordered')).toBe('reorganized');
  });
});

describe('getChangeTypeSummary', () => {
  test('returns human-readable summary for each type', () => {
    const types: ProfileChangeType[] = [
      'social_link_added',
      'social_link_removed',
      'block_added',
      'bio_updated',
      'profile_created',
    ];

    for (const type of types) {
      const summary = getChangeTypeSummary(type);
      expect(typeof summary).toBe('string');
      expect(summary.length).toBeGreaterThan(0);
    }
  });

  test('uses "Retired" instead of "Removed" (doctrine)', () => {
    const summary = getChangeTypeSummary('social_link_removed');
    // Should use softer language
    expect(summary.toLowerCase()).toContain('retired');
    expect(summary.toLowerCase()).not.toContain('removed');
  });
});

describe('DEFAULT_STORY_SETTINGS', () => {
  test('has all required fields', () => {
    expect(DEFAULT_STORY_SETTINGS).toHaveProperty('enabled');
    expect(DEFAULT_STORY_SETTINGS).toHaveProperty('show_timestamps');
    expect(DEFAULT_STORY_SETTINGS).toHaveProperty('max_public_entries');
    expect(DEFAULT_STORY_SETTINGS).toHaveProperty('defaults');
  });

  test('enabled is true by default', () => {
    expect(DEFAULT_STORY_SETTINGS.enabled).toBe(true);
  });

  test('has reasonable max_public_entries', () => {
    expect(DEFAULT_STORY_SETTINGS.max_public_entries).toBeGreaterThan(0);
    expect(DEFAULT_STORY_SETTINGS.max_public_entries).toBeLessThanOrEqual(100);
  });

  test('defaults object has all change types', () => {
    const requiredTypes = [
      'social_link_added',
      'social_link_removed',
      'block_added',
      'block_removed',
      'bio_updated',
      'avatar_updated',
    ];

    for (const type of requiredTypes) {
      expect(DEFAULT_STORY_SETTINGS.defaults).toHaveProperty(type);
    }
  });
});

describe('ACTION_TYPE_LABELS', () => {
  test('has labels for all action types', () => {
    const actionTypes: StoryActionType[] = ['added', 'retired', 'refined', 'reorganized'];

    for (const type of actionTypes) {
      expect(ACTION_TYPE_LABELS).toHaveProperty(type);
      expect(typeof ACTION_TYPE_LABELS[type]).toBe('string');
    }
  });
});

describe('groupEntriesByPeriod', () => {
  test('groups entries into time periods', () => {
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const lastWeek = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000);
    const lastMonth = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000);
    const earlier = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const entries: ProfileTimelineEntry[] = [
      {
        id: '1',
        date: yesterday.toISOString(),
        changeType: 'block_added',
        entityType: 'block',
        summary: 'Added block',
        isVisible: true,
      },
      {
        id: '2',
        date: lastWeek.toISOString(),
        changeType: 'bio_updated',
        entityType: 'profile',
        summary: 'Updated bio',
        isVisible: true,
      },
      {
        id: '3',
        date: lastMonth.toISOString(),
        changeType: 'social_link_added',
        entityType: 'social_link',
        summary: 'Added link',
        isVisible: true,
      },
      {
        id: '4',
        date: earlier.toISOString(),
        changeType: 'profile_created',
        entityType: 'profile',
        summary: 'Profile created',
        isVisible: true,
      },
    ];

    const groups = groupEntriesByPeriod(entries);

    // Should have at least some groups
    expect(groups.length).toBeGreaterThan(0);

    // Each group should have expected structure
    for (const group of groups) {
      expect(group).toHaveProperty('label');
      expect(group).toHaveProperty('period');
      expect(group).toHaveProperty('entries');
      expect(['this_week', 'this_month', 'earlier']).toContain(group.period);
    }
  });

  test('returns empty array for empty input', () => {
    const groups = groupEntriesByPeriod([]);
    expect(groups).toEqual([]);
  });
});
