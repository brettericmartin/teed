/**
 * Shared category definitions used across the application
 * Single source of truth for bag categories
 */

export type CategoryValue =
  | 'golf'
  | 'edc'
  | 'travel'
  | 'photography'
  | 'tech'
  | 'music'
  | 'fitness'
  | 'cooking'
  | 'wishlist'
  | 'outdoor'
  | 'camping'
  | 'fashion'
  | 'gaming'
  | 'art'
  | 'other';

export interface Category {
  value: CategoryValue | 'all';
  label: string;
  icon: string;
}

/**
 * All available categories for bags
 * Used in bag editor, discover page, admin dashboard, etc.
 */
export const CATEGORIES: Category[] = [
  { value: 'golf', label: 'Golf', icon: '⛳' },
  { value: 'edc', label: 'EDC', icon: '🔑' },
  { value: 'travel', label: 'Travel', icon: '✈️' },
  { value: 'photography', label: 'Photography', icon: '📷' },
  { value: 'tech', label: 'Tech', icon: '💻' },
  { value: 'music', label: 'Music', icon: '🎵' },
  { value: 'fitness', label: 'Fitness', icon: '💪' },
  { value: 'cooking', label: 'Cooking', icon: '🍳' },
  { value: 'wishlist', label: 'Wish List', icon: '⭐' },
  { value: 'outdoor', label: 'Outdoor', icon: '🏔️' },
  { value: 'camping', label: 'Camping', icon: '🏕️' },
  { value: 'fashion', label: 'Fashion', icon: '👔' },
  { value: 'gaming', label: 'Gaming', icon: '🎮' },
  { value: 'art', label: 'Art', icon: '🎨' },
  { value: 'other', label: 'Other', icon: '📦' },
];

/**
 * Categories with 'all' option for filtering UIs
 */
export const CATEGORIES_WITH_ALL: Category[] = [
  { value: 'all', label: 'All Categories', icon: '📋' },
  ...CATEGORIES,
];

/**
 * Get a category by its value
 */
export function getCategory(value: string | null): Category | undefined {
  return CATEGORIES.find(c => c.value === value);
}

/**
 * Get category display label with icon
 */
export function getCategoryLabel(value: string | null): string {
  const category = getCategory(value);
  return category ? `${category.icon} ${category.label}` : '';
}

/**
 * Color mapping for categories (for UI styling)
 */
export const CATEGORY_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  golf: { bg: 'bg-[var(--teed-green-8)]', text: 'text-white', border: 'var(--teed-green-6)' },
  edc: { bg: 'bg-[var(--sand-9)]', text: 'text-white', border: 'var(--sand-6)' },
  outdoor: { bg: 'bg-[var(--evergreen-9)]', text: 'text-white', border: 'var(--evergreen-6)' },
  camping: { bg: 'bg-[var(--evergreen-8)]', text: 'text-white', border: 'var(--evergreen-6)' },
  travel: { bg: 'bg-[var(--sky-6)]', text: 'text-white', border: 'var(--sky-6)' },
  tech: { bg: 'bg-[var(--sky-7)]', text: 'text-white', border: 'var(--sky-7)' },
  fashion: { bg: 'bg-[var(--copper-7)]', text: 'text-white', border: 'var(--copper-6)' },
  fitness: { bg: 'bg-[var(--copper-8)]', text: 'text-white', border: 'var(--copper-6)' },
  gaming: { bg: 'bg-[var(--copper-6)]', text: 'text-white', border: 'var(--copper-6)' },
  photography: { bg: 'bg-[var(--sand-9)]', text: 'text-white', border: 'var(--sand-6)' },
  music: { bg: 'bg-[var(--sand-8)]', text: 'text-white', border: 'var(--sand-6)' },
  cooking: { bg: 'bg-[var(--copper-7)]', text: 'text-white', border: 'var(--copper-6)' },
  art: { bg: 'bg-[var(--sand-7)]', text: 'text-white', border: 'var(--sand-6)' },
  wishlist: { bg: 'bg-[var(--sky-8)]', text: 'text-white', border: 'var(--sky-6)' },
  other: { bg: 'bg-[var(--grey-7)]', text: 'text-white', border: 'var(--grey-6)' },
};

/**
 * Get category colors for UI styling
 */
export function getCategoryColors(value: string | null): { bg: string; text: string; border: string } {
  return CATEGORY_COLORS[value || ''] || CATEGORY_COLORS.other;
}
