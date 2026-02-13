/**
 * Badge Definitions
 *
 * Static badge definitions for client-side use.
 * These mirror the database seed data in migration 078.
 */

import type { BadgeDefinition, BadgeId } from './types';

export const BADGE_DEFINITIONS: Record<BadgeId, BadgeDefinition> = {
  // Collection badges
  first_bag: {
    id: 'first_bag',
    name: 'First Bag',
    description: 'Created your first bag',
    category: 'collection',
    icon: 'package',
    color: 'teed-green',
    requirementType: 'count',
    requirementValue: 1,
    sortOrder: 10,
    isActive: true,
  },
  five_bags: {
    id: 'five_bags',
    name: 'Curator',
    description: 'Created 5 bags',
    category: 'collection',
    icon: 'layers',
    color: 'sky',
    requirementType: 'count',
    requirementValue: 5,
    sortOrder: 20,
    isActive: true,
  },
  ten_bags: {
    id: 'ten_bags',
    name: 'Collector',
    description: 'Created 10 bags',
    category: 'collection',
    icon: 'archive',
    color: 'amber',
    requirementType: 'count',
    requirementValue: 10,
    sortOrder: 30,
    isActive: true,
  },
  twenty_bags: {
    id: 'twenty_bags',
    name: 'Archivist',
    description: 'Created 20 bags',
    category: 'collection',
    icon: 'library',
    color: 'purple',
    requirementType: 'count',
    requirementValue: 20,
    sortOrder: 40,
    isActive: true,
  },

  // Item badges
  first_item: {
    id: 'first_item',
    name: 'First Pick',
    description: 'Added your first item to a bag',
    category: 'items',
    icon: 'plus',
    color: 'teed-green',
    requirementType: 'count',
    requirementValue: 1,
    sortOrder: 50,
    isActive: true,
  },
  fifty_items: {
    id: 'fifty_items',
    name: 'Gear Head',
    description: 'Added 50 items across all bags',
    category: 'items',
    icon: 'box',
    color: 'sky',
    requirementType: 'count',
    requirementValue: 50,
    sortOrder: 60,
    isActive: true,
  },
  hundred_items: {
    id: 'hundred_items',
    name: 'Equipment Expert',
    description: 'Added 100 items across all bags',
    category: 'items',
    icon: 'boxes',
    color: 'amber',
    requirementType: 'count',
    requirementValue: 100,
    sortOrder: 70,
    isActive: true,
  },

  // Engagement badges
  first_share: {
    id: 'first_share',
    name: 'Spreader',
    description: 'Shared your first bag',
    category: 'engagement',
    icon: 'share-2',
    color: 'teed-green',
    requirementType: 'action',
    requirementValue: 1,
    sortOrder: 80,
    isActive: true,
  },
  first_follower: {
    id: 'first_follower',
    name: 'Influencer',
    description: 'Gained your first follower',
    category: 'engagement',
    icon: 'user-plus',
    color: 'sky',
    requirementType: 'count',
    requirementValue: 1,
    sortOrder: 90,
    isActive: true,
  },
  ten_followers: {
    id: 'ten_followers',
    name: 'Tastemaker',
    description: 'Gained 10 followers',
    category: 'engagement',
    icon: 'users',
    color: 'amber',
    requirementType: 'count',
    requirementValue: 10,
    sortOrder: 100,
    isActive: true,
  },
  first_embed: {
    id: 'first_embed',
    name: 'Publisher',
    description: 'Created your first embed',
    category: 'engagement',
    icon: 'code',
    color: 'purple',
    requirementType: 'action',
    requirementValue: 1,
    sortOrder: 110,
    isActive: true,
  },

  // Special badges
  early_adopter: {
    id: 'early_adopter',
    name: 'Early Adopter',
    description: 'Joined during beta',
    category: 'special',
    icon: 'zap',
    color: 'amber',
    requirementType: 'manual',
    requirementValue: 1,
    sortOrder: 200,
    isActive: true,
  },
  founder: {
    id: 'founder',
    name: 'Founder',
    description: 'Founding member of Teed.club',
    category: 'special',
    icon: 'crown',
    color: 'purple',
    requirementType: 'manual',
    requirementValue: 1,
    sortOrder: 210,
    isActive: true,
  },

  // Impact badges (reach)
  hundred_reached: {
    id: 'hundred_reached',
    name: 'Century Club',
    description: 'Your curations have reached 100 people',
    category: 'impact',
    icon: 'users',
    color: 'teed-green',
    requirementType: 'count',
    requirementValue: 100,
    sortOrder: 120,
    isActive: true,
  },
  thousand_reached: {
    id: 'thousand_reached',
    name: 'Thousand',
    description: 'Your curations have reached 1000 people',
    category: 'impact',
    icon: 'globe',
    color: 'sky',
    requirementType: 'count',
    requirementValue: 1000,
    sortOrder: 130,
    isActive: true,
  },

  // Impact badges (geography)
  five_countries: {
    id: 'five_countries',
    name: 'Going Global',
    description: 'Discovered in 5 different countries',
    category: 'impact',
    icon: 'map',
    color: 'amber',
    requirementType: 'count',
    requirementValue: 5,
    sortOrder: 140,
    isActive: true,
  },
  twenty_countries: {
    id: 'twenty_countries',
    name: 'Worldwide',
    description: 'Discovered in 20 different countries',
    category: 'impact',
    icon: 'globe-2',
    color: 'purple',
    requirementType: 'count',
    requirementValue: 20,
    sortOrder: 150,
    isActive: true,
  },

  // Inspiration badges (clones)
  first_clone: {
    id: 'first_clone',
    name: 'Trendsetter',
    description: 'Someone was inspired to create their own collection based on yours',
    category: 'inspiration',
    icon: 'sparkles',
    color: 'teed-green',
    requirementType: 'count',
    requirementValue: 1,
    sortOrder: 160,
    isActive: true,
  },
  five_clones: {
    id: 'five_clones',
    name: 'Movement Starter',
    description: '5 people created collections inspired by yours',
    category: 'inspiration',
    icon: 'flame',
    color: 'amber',
    requirementType: 'count',
    requirementValue: 5,
    sortOrder: 170,
    isActive: true,
  },

  // Trust badges (saves)
  ten_saves: {
    id: 'ten_saves',
    name: 'Trusted Curator',
    description: '10 people have saved your bags',
    category: 'trust',
    icon: 'bookmark',
    color: 'sky',
    requirementType: 'count',
    requirementValue: 10,
    sortOrder: 180,
    isActive: true,
  },
  fifty_saves: {
    id: 'fifty_saves',
    name: 'Must-Follow',
    description: '50 people have saved your bags',
    category: 'trust',
    icon: 'heart',
    color: 'purple',
    requirementType: 'count',
    requirementValue: 50,
    sortOrder: 190,
    isActive: true,
  },
};

/**
 * Get all badges grouped by category
 */
export function getBadgesByCategory(): Record<string, BadgeDefinition[]> {
  const grouped: Record<string, BadgeDefinition[]> = {};

  for (const badge of Object.values(BADGE_DEFINITIONS)) {
    if (!grouped[badge.category]) {
      grouped[badge.category] = [];
    }
    grouped[badge.category].push(badge);
  }

  // Sort each category by sortOrder
  for (const category of Object.keys(grouped)) {
    grouped[category].sort((a, b) => a.sortOrder - b.sortOrder);
  }

  return grouped;
}

/**
 * Get badge definition by ID
 */
export function getBadgeById(id: BadgeId): BadgeDefinition | undefined {
  return BADGE_DEFINITIONS[id];
}

/**
 * Get all active badges
 */
export function getActiveBadges(): BadgeDefinition[] {
  return Object.values(BADGE_DEFINITIONS)
    .filter(b => b.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/**
 * Badge color to CSS class mapping
 */
export const BADGE_COLOR_CLASSES: Record<string, { bg: string; text: string; border: string }> = {
  'teed-green': {
    bg: 'bg-[var(--teed-green-4)]',
    text: 'text-[var(--teed-green-11)]',
    border: 'border-[var(--teed-green-7)]',
  },
  sky: {
    bg: 'bg-[var(--sky-4)]',
    text: 'text-[var(--sky-11)]',
    border: 'border-[var(--sky-7)]',
  },
  amber: {
    bg: 'bg-amber-100 dark:bg-amber-950/30',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-300 dark:border-amber-700',
  },
  purple: {
    bg: 'bg-purple-100 dark:bg-purple-950/30',
    text: 'text-purple-700 dark:text-purple-400',
    border: 'border-purple-300 dark:border-purple-700',
  },
  red: {
    bg: 'bg-red-100 dark:bg-red-950/30',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-300 dark:border-red-700',
  },
  slate: {
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-600',
  },
};
