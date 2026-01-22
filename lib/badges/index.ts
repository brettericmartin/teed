/**
 * Badge System
 *
 * Service for checking and awarding badges to users.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  BadgeId,
  BadgeDefinition,
  AwardedBadge,
  BadgeWithProgress,
  DbUserBadge,
  DbBadgeProgress,
} from './types';
import { BADGE_DEFINITIONS, getBadgeById } from './definitions';

// Re-export types and definitions
export * from './types';
export * from './definitions';

// ============================================================================
// Badge Service
// ============================================================================

/**
 * Get Supabase client for badge operations
 */
function getSupabase(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

/**
 * Check if a user has earned a specific badge
 */
export async function hasBadge(
  userId: string,
  badgeId: BadgeId,
  supabase?: SupabaseClient
): Promise<boolean> {
  const client = supabase || getSupabase();

  const { data, error } = await client
    .from('user_badges')
    .select('id')
    .eq('user_id', userId)
    .eq('badge_id', badgeId)
    .single();

  return !error && !!data;
}

/**
 * Award a badge to a user
 */
export async function awardBadge(
  userId: string,
  badgeId: BadgeId,
  progressValue: number = 0,
  supabase?: SupabaseClient
): Promise<boolean> {
  const client = supabase || getSupabase();

  // Check if already awarded
  const alreadyHas = await hasBadge(userId, badgeId, client);
  if (alreadyHas) {
    return false;
  }

  const { error } = await client.from('user_badges').insert({
    user_id: userId,
    badge_id: badgeId,
    progress_value: progressValue,
  });

  if (error) {
    console.error(`[Badges] Error awarding ${badgeId} to ${userId}:`, error.message);
    return false;
  }

  console.log(`[Badges] Awarded ${badgeId} to ${userId}`);
  return true;
}

/**
 * Update badge progress and check if badge should be awarded
 */
export async function updateProgress(
  userId: string,
  badgeId: BadgeId,
  increment: number = 1,
  supabase?: SupabaseClient
): Promise<{ awarded: boolean; newValue: number }> {
  const client = supabase || getSupabase();

  // Use the database function for atomic update
  const { data, error } = await client.rpc('update_badge_progress', {
    p_user_id: userId,
    p_badge_id: badgeId,
    p_increment: increment,
  });

  if (error) {
    console.error(`[Badges] Error updating progress for ${badgeId}:`, error.message);
    return { awarded: false, newValue: 0 };
  }

  // Get current value
  const { data: progress } = await client
    .from('badge_progress')
    .select('current_value')
    .eq('user_id', userId)
    .eq('badge_id', badgeId)
    .single();

  return {
    awarded: data === true,
    newValue: progress?.current_value || 0,
  };
}

/**
 * Get all badges for a user (awarded badges)
 */
export async function getUserBadges(
  userId: string,
  supabase?: SupabaseClient
): Promise<AwardedBadge[]> {
  const client = supabase || getSupabase();

  const { data, error } = await client
    .from('user_badges')
    .select('badge_id, awarded_at, progress_value')
    .eq('user_id', userId)
    .order('awarded_at', { ascending: false });

  if (error || !data) {
    return [];
  }

  return data
    .map((ub) => {
      const definition = getBadgeById(ub.badge_id as BadgeId);
      if (!definition) return null;

      return {
        ...definition,
        awardedAt: new Date(ub.awarded_at),
        progressValue: ub.progress_value,
      };
    })
    .filter((b): b is AwardedBadge => b !== null);
}

/**
 * Get badge progress for a user (including unearned badges)
 */
export async function getBadgeProgress(
  userId: string,
  supabase?: SupabaseClient
): Promise<BadgeWithProgress[]> {
  const client = supabase || getSupabase();

  // Get user's progress
  const { data: progressData } = await client
    .from('badge_progress')
    .select('badge_id, current_value')
    .eq('user_id', userId);

  const progressMap = new Map<string, number>();
  for (const p of progressData || []) {
    progressMap.set(p.badge_id, p.current_value);
  }

  // Get awarded badges
  const { data: awardedData } = await client
    .from('user_badges')
    .select('badge_id, awarded_at, progress_value')
    .eq('user_id', userId);

  const awardedMap = new Map<string, { awardedAt: Date; progressValue: number }>();
  for (const a of awardedData || []) {
    awardedMap.set(a.badge_id, {
      awardedAt: new Date(a.awarded_at),
      progressValue: a.progress_value,
    });
  }

  // Build badge list with progress
  const badges: BadgeWithProgress[] = [];
  for (const definition of Object.values(BADGE_DEFINITIONS)) {
    if (!definition.isActive) continue;

    const awarded = awardedMap.get(definition.id);
    const currentValue = awarded?.progressValue || progressMap.get(definition.id) || 0;
    const percentComplete = Math.min(
      100,
      Math.round((currentValue / definition.requirementValue) * 100)
    );

    badges.push({
      ...definition,
      currentValue,
      isAwarded: !!awarded,
      awardedAt: awarded?.awardedAt,
      percentComplete,
    });
  }

  return badges.sort((a, b) => a.sortOrder - b.sortOrder);
}

// ============================================================================
// Badge Check Functions (called from various parts of the app)
// ============================================================================

/**
 * Check collection badges (bag count)
 * Call this when a user creates a new bag
 */
export async function checkCollectionBadges(
  userId: string,
  bagCount: number,
  supabase?: SupabaseClient
): Promise<BadgeId[]> {
  const awarded: BadgeId[] = [];
  const client = supabase || getSupabase();

  // Check each collection badge
  const collectionBadges: Array<{ id: BadgeId; threshold: number }> = [
    { id: 'first_bag', threshold: 1 },
    { id: 'five_bags', threshold: 5 },
    { id: 'ten_bags', threshold: 10 },
    { id: 'twenty_bags', threshold: 20 },
  ];

  for (const badge of collectionBadges) {
    if (bagCount >= badge.threshold) {
      const wasAwarded = await awardBadge(userId, badge.id, bagCount, client);
      if (wasAwarded) {
        awarded.push(badge.id);
      }
    }
  }

  return awarded;
}

/**
 * Check item badges (total item count)
 * Call this when a user adds items to bags
 */
export async function checkItemBadges(
  userId: string,
  totalItemCount: number,
  supabase?: SupabaseClient
): Promise<BadgeId[]> {
  const awarded: BadgeId[] = [];
  const client = supabase || getSupabase();

  const itemBadges: Array<{ id: BadgeId; threshold: number }> = [
    { id: 'first_item', threshold: 1 },
    { id: 'fifty_items', threshold: 50 },
    { id: 'hundred_items', threshold: 100 },
  ];

  for (const badge of itemBadges) {
    if (totalItemCount >= badge.threshold) {
      const wasAwarded = await awardBadge(userId, badge.id, totalItemCount, client);
      if (wasAwarded) {
        awarded.push(badge.id);
      }
    }
  }

  return awarded;
}

/**
 * Check follower badges
 * Call this when a user gains followers
 */
export async function checkFollowerBadges(
  userId: string,
  followerCount: number,
  supabase?: SupabaseClient
): Promise<BadgeId[]> {
  const awarded: BadgeId[] = [];
  const client = supabase || getSupabase();

  const followerBadges: Array<{ id: BadgeId; threshold: number }> = [
    { id: 'first_follower', threshold: 1 },
    { id: 'ten_followers', threshold: 10 },
  ];

  for (const badge of followerBadges) {
    if (followerCount >= badge.threshold) {
      const wasAwarded = await awardBadge(userId, badge.id, followerCount, client);
      if (wasAwarded) {
        awarded.push(badge.id);
      }
    }
  }

  return awarded;
}

/**
 * Award action-based badges (first share, first embed)
 * Call these when the specific action happens
 */
export async function awardFirstShareBadge(
  userId: string,
  supabase?: SupabaseClient
): Promise<boolean> {
  return awardBadge(userId, 'first_share', 1, supabase);
}

export async function awardFirstEmbedBadge(
  userId: string,
  supabase?: SupabaseClient
): Promise<boolean> {
  return awardBadge(userId, 'first_embed', 1, supabase);
}

/**
 * Award special badges (manual assignment)
 */
export async function awardSpecialBadge(
  userId: string,
  badgeId: 'early_adopter' | 'founder',
  supabase?: SupabaseClient
): Promise<boolean> {
  return awardBadge(userId, badgeId, 1, supabase);
}

/**
 * Check impact badges (reach, geography, saves, clones)
 * Call this when viewing stats or after significant events
 */
export async function checkImpactBadges(
  userId: string,
  stats: {
    peopleReached: number;
    countriesReached: number;
    saves: number;
    clones: number;
  },
  supabase?: SupabaseClient
): Promise<BadgeId[]> {
  const awarded: BadgeId[] = [];
  const client = supabase || getSupabase();

  // Check reach milestones
  const reachBadges: Array<{ id: BadgeId; threshold: number }> = [
    { id: 'hundred_reached', threshold: 100 },
    { id: 'thousand_reached', threshold: 1000 },
  ];

  for (const badge of reachBadges) {
    if (stats.peopleReached >= badge.threshold) {
      const wasAwarded = await awardBadge(userId, badge.id, stats.peopleReached, client);
      if (wasAwarded) {
        awarded.push(badge.id);
      }
    }
  }

  // Check geography badges
  const geoBadges: Array<{ id: BadgeId; threshold: number }> = [
    { id: 'five_countries', threshold: 5 },
    { id: 'twenty_countries', threshold: 20 },
  ];

  for (const badge of geoBadges) {
    if (stats.countriesReached >= badge.threshold) {
      const wasAwarded = await awardBadge(userId, badge.id, stats.countriesReached, client);
      if (wasAwarded) {
        awarded.push(badge.id);
      }
    }
  }

  // Check trust badges (saves)
  const trustBadges: Array<{ id: BadgeId; threshold: number }> = [
    { id: 'ten_saves', threshold: 10 },
    { id: 'fifty_saves', threshold: 50 },
  ];

  for (const badge of trustBadges) {
    if (stats.saves >= badge.threshold) {
      const wasAwarded = await awardBadge(userId, badge.id, stats.saves, client);
      if (wasAwarded) {
        awarded.push(badge.id);
      }
    }
  }

  // Check inspiration badges (clones)
  const inspirationBadges: Array<{ id: BadgeId; threshold: number }> = [
    { id: 'first_clone', threshold: 1 },
    { id: 'five_clones', threshold: 5 },
  ];

  for (const badge of inspirationBadges) {
    if (stats.clones >= badge.threshold) {
      const wasAwarded = await awardBadge(userId, badge.id, stats.clones, client);
      if (wasAwarded) {
        awarded.push(badge.id);
      }
    }
  }

  return awarded;
}

// ============================================================================
// Comprehensive Badge Check
// ============================================================================

/**
 * Check all applicable badges for a user
 * Fetches current counts and checks all badge thresholds
 */
export async function checkAllBadges(
  userId: string,
  supabase?: SupabaseClient
): Promise<BadgeId[]> {
  const client = supabase || getSupabase();
  const awarded: BadgeId[] = [];

  try {
    // Get bag count
    const { count: bagCount } = await client
      .from('bags')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (bagCount) {
      const collectionAwarded = await checkCollectionBadges(userId, bagCount, client);
      awarded.push(...collectionAwarded);
    }

    // Get total item count across all bags
    const { data: bags } = await client
      .from('bags')
      .select('id')
      .eq('user_id', userId);

    if (bags && bags.length > 0) {
      const { count: itemCount } = await client
        .from('bag_items')
        .select('*', { count: 'exact', head: true })
        .in('bag_id', bags.map(b => b.id));

      if (itemCount) {
        const itemAwarded = await checkItemBadges(userId, itemCount, client);
        awarded.push(...itemAwarded);
      }
    }

    // Get follower count
    const { count: followerCount } = await client
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', userId);

    if (followerCount) {
      const followerAwarded = await checkFollowerBadges(userId, followerCount, client);
      awarded.push(...followerAwarded);
    }

    return awarded;
  } catch (error) {
    console.error('[Badges] Error checking all badges:', error);
    return [];
  }
}
