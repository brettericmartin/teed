/**
 * Badge System Types
 *
 * Defines types for the achievement/badge system.
 */

export type BadgeCategory = 'collection' | 'items' | 'engagement' | 'special' | 'impact' | 'inspiration' | 'trust';

export type BadgeRequirementType = 'count' | 'action' | 'manual';

export type BadgeColor =
  | 'teed-green'
  | 'sky'
  | 'amber'
  | 'purple'
  | 'red'
  | 'slate';

// Badge definition (from database)
export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  icon: string; // Lucide icon name
  color: BadgeColor;
  requirementType: BadgeRequirementType;
  requirementValue: number;
  sortOrder: number;
  isActive: boolean;
}

// User's awarded badge
export interface UserBadge {
  badgeId: string;
  userId: string;
  awardedAt: Date;
  progressValue: number;
  metadata?: Record<string, unknown>;
}

// Badge with full definition (for display)
export interface AwardedBadge extends BadgeDefinition {
  awardedAt: Date;
  progressValue: number;
}

// Badge progress tracking
export interface BadgeProgress {
  badgeId: string;
  userId: string;
  currentValue: number;
  lastUpdated: Date;
}

// Badge with progress (for showing progress toward unearned badges)
export interface BadgeWithProgress extends BadgeDefinition {
  currentValue: number;
  isAwarded: boolean;
  awardedAt?: Date;
  percentComplete: number;
}

// Database types (snake_case)
export interface DbBadgeDefinition {
  id: string;
  name: string;
  description: string;
  category: BadgeCategory;
  icon: string;
  color: string;
  requirement_type: BadgeRequirementType;
  requirement_value: number;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface DbUserBadge {
  id: string;
  user_id: string;
  badge_id: string;
  awarded_at: string;
  progress_value: number;
  metadata: Record<string, unknown>;
}

export interface DbBadgeProgress {
  id: string;
  user_id: string;
  badge_id: string;
  current_value: number;
  last_updated: string;
}

// Badge IDs (for type safety)
export type CollectionBadgeId =
  | 'first_bag'
  | 'five_bags'
  | 'ten_bags'
  | 'twenty_bags';

export type ItemsBadgeId =
  | 'first_item'
  | 'fifty_items'
  | 'hundred_items';

export type EngagementBadgeId =
  | 'first_share'
  | 'first_follower'
  | 'ten_followers'
  | 'first_embed';

export type SpecialBadgeId =
  | 'early_adopter'
  | 'founder';

export type ImpactBadgeId =
  | 'hundred_reached'
  | 'thousand_reached'
  | 'five_countries'
  | 'twenty_countries';

export type InspirationBadgeId =
  | 'first_clone'
  | 'five_clones';

export type TrustBadgeId =
  | 'ten_saves'
  | 'fifty_saves';

export type BadgeId =
  | CollectionBadgeId
  | ItemsBadgeId
  | EngagementBadgeId
  | SpecialBadgeId
  | ImpactBadgeId
  | InspirationBadgeId
  | TrustBadgeId;
