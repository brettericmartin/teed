/**
 * Creator Scorecard Scoring Engine
 *
 * Calculates a personalized scorecard based on survey responses.
 * Supports two modes:
 * - 'monetization': For users interested in earning from their gear recommendations
 * - 'impact': For users focused on helping their audience (not monetizing)
 */

import type {
  SurveyResponses,
  CategoryScores,
  ScorecardResult,
  ScorecardMode,
} from '@/lib/types/beta';
import { getPersona } from './personas';
import { generateOpportunities } from './opportunities';

// Re-export utilities
export { getPersona, getPersonaById, getCategoryFeedback, PERSONAS } from './personas';
export { generateOpportunities, getOpportunityForCategory, getTopActionMessage } from './opportunities';

/**
 * Determine scoring mode based on user's monetization interest
 */
export function determineScoringMode(survey: SurveyResponses): ScorecardMode {
  // If user explicitly says they're not interested in monetization, use impact mode
  if (
    survey.affiliate_status === 'not_interested' ||
    survey.revenue_goals === 'not_priority'
  ) {
    return 'impact';
  }
  return 'monetization';
}

/**
 * Calculate Organization score (0-100)
 * Based on: creator_type, current_tools, usage_intent
 */
export function calculateOrganizationScore(survey: SurveyResponses): number {
  let score = 0;

  // Creator type (up to 30 points)
  // Professional creators tend to need better organization
  const creatorTypeScores: Record<string, number> = {
    professional_creator: 30,
    brand_ambassador: 25,
    serious_hobbyist: 20,
    building_audience: 15,
  };
  score += creatorTypeScores[survey.creator_type || ''] || 10;

  // Current tools usage (up to 35 points)
  // More tools = more awareness of need for organization
  const tools = survey.current_tools || [];
  const toolCount = tools.length;

  // Base points for tool variety (up to 21)
  score += Math.min(toolCount * 7, 21);

  // Bonus for organization-focused tools (up to 14)
  const organizationTools = ['notion', 'amazon_storefront', 'ltk'];
  const hasOrgTools = tools.some((t) => organizationTools.includes(t));
  if (hasOrgTools) score += 14;

  // Usage intent (up to 35 points)
  // Higher intent = higher organizational readiness
  const intentScores: Record<string, number> = {
    immediately: 35,
    this_week: 28,
    explore_first: 18,
    not_sure: 10,
  };
  score += intentScores[survey.usage_intent || ''] || 10;

  return Math.min(Math.round(score), 100);
}

/**
 * Calculate Sharing score (0-100)
 * Based on: audience_size, primary_platform, biggest_frustration
 */
export function calculateSharingScore(survey: SurveyResponses): number {
  let score = 0;

  // Audience size (up to 45 points)
  // Larger audience = more sharing experience
  const audienceScores: Record<string, number> = {
    '50k_plus': 45,
    '10k_50k': 38,
    '1k_10k': 28,
    under_1k: 18,
  };
  score += audienceScores[survey.audience_size || ''] || 15;

  // Platform (up to 35 points)
  // Visual/sharing platforms score higher
  const platformScores: Record<string, number> = {
    instagram: 35,
    youtube: 35,
    tiktok: 30,
    blog: 28,
    twitter: 22,
    other: 18,
  };
  score += platformScores[survey.primary_platform || ''] || 15;

  // Frustration signals sharing awareness (up to 20 points)
  const frustrationScores: Record<string, number> = {
    repeated_questions: 20, // Lots of audience engagement
    time_consuming: 15, // Actively sharing
    looks_bad: 12, // Cares about presentation
    affiliate_complexity: 10,
    no_analytics: 8,
  };
  score += frustrationScores[survey.biggest_frustration || ''] || 5;

  return Math.min(Math.round(score), 100);
}

/**
 * Calculate Monetization score (0-100)
 * Based on: affiliate_status, revenue_goals, current_tools
 * Only used when mode = 'monetization'
 */
export function calculateMonetizationScore(survey: SurveyResponses): number {
  let score = 0;

  // Affiliate status (up to 50 points)
  const affiliateScores: Record<string, number> = {
    actively: 50,
    sometimes: 38,
    want_to_start: 25,
    not_interested: 10,
  };
  score += affiliateScores[survey.affiliate_status || ''] || 10;

  // Revenue goals (up to 40 points)
  const revenueScores: Record<string, number> = {
    significant_income: 40,
    meaningful_income: 32,
    side_income: 22,
    not_priority: 10,
  };
  score += revenueScores[survey.revenue_goals || ''] || 10;

  // Bonus for monetization tools (up to 10 points)
  const tools = survey.current_tools || [];
  const monetizationTools = ['amazon_storefront', 'ltk'];
  const hasMonetizationTools = tools.some((t) => monetizationTools.includes(t));
  if (hasMonetizationTools) score += 10;

  return Math.min(Math.round(score), 100);
}

/**
 * Calculate Impact score (0-100)
 * Based on: audience_size, platform, usage_intent
 * Used when mode = 'impact' (non-monetization focused users)
 */
export function calculateImpactScore(survey: SurveyResponses): number {
  let score = 0;

  // Audience size (up to 45 points)
  // Larger audience = more potential impact
  const audienceScores: Record<string, number> = {
    '50k_plus': 45,
    '10k_50k': 38,
    '1k_10k': 30,
    under_1k: 22,
  };
  score += audienceScores[survey.audience_size || ''] || 20;

  // Platform reach (up to 35 points)
  const platformScores: Record<string, number> = {
    youtube: 35,
    instagram: 32,
    tiktok: 30,
    blog: 28,
    twitter: 22,
    other: 18,
  };
  score += platformScores[survey.primary_platform || ''] || 15;

  // Usage intent signals impact motivation (up to 20 points)
  const intentScores: Record<string, number> = {
    immediately: 20,
    this_week: 16,
    explore_first: 12,
    not_sure: 8,
  };
  score += intentScores[survey.usage_intent || ''] || 8;

  return Math.min(Math.round(score), 100);
}

/**
 * Calculate Documentation score (0-100)
 * Based on: documentation_habits, primary_niche, biggest_frustration
 */
export function calculateDocumentationScore(survey: SurveyResponses): number {
  let score = 0;

  // Documentation habits (up to 45 points) - primary factor
  const habitsScores: Record<string, number> = {
    detailed_notes: 45,
    basic_tracking: 30,
    scattered_info: 18,
    nothing_organized: 10,
  };
  score += habitsScores[survey.documentation_habits || ''] || 20; // Default to middle if not answered

  // Niche specificity (up to 30 points)
  // Specific niches show focus and expertise
  const specificNiches = ['golf', 'tech_gadgets', 'fitness', 'outdoor_adventure'];
  if (specificNiches.includes(survey.primary_niche || '')) {
    score += 30;
  } else if (survey.primary_niche === 'other' && survey.primary_niche_other) {
    score += 25; // They specified a custom niche - shows focus
  } else {
    score += 18;
  }

  // Frustration signals documentation awareness (up to 25 points)
  const frustrationScores: Record<string, number> = {
    time_consuming: 25, // Wants to document but it's slow
    repeated_questions: 22, // Has knowledge worth documenting
    no_analytics: 18,
    looks_bad: 15,
    affiliate_complexity: 12,
  };
  score += frustrationScores[survey.biggest_frustration || ''] || 10;

  return Math.min(Math.round(score), 100);
}

/**
 * Calculate complete scorecard result from survey responses
 */
export function calculateScorecardResult(survey: SurveyResponses): ScorecardResult {
  // Determine scoring mode based on user intent
  const mode = determineScoringMode(survey);

  // Calculate category scores
  const organization = calculateOrganizationScore(survey);
  const sharing = calculateSharingScore(survey);
  const documentation = calculateDocumentationScore(survey);

  // Calculate third category based on mode
  let categoryScores: CategoryScores;
  let overallScore: number;

  if (mode === 'monetization') {
    const monetization = calculateMonetizationScore(survey);
    categoryScores = { organization, sharing, monetization, documentation };

    // Weighted average: Organization 30%, Sharing 25%, Monetization 25%, Documentation 20%
    overallScore = Math.round(
      organization * 0.3 + sharing * 0.25 + monetization * 0.25 + documentation * 0.2
    );
  } else {
    const impact = calculateImpactScore(survey);
    categoryScores = { organization, sharing, impact, documentation };

    // Weighted average: Organization 35%, Sharing 30%, Impact 15%, Documentation 20%
    overallScore = Math.round(
      organization * 0.35 + sharing * 0.3 + impact * 0.15 + documentation * 0.2
    );
  }

  // Get persona based on score
  const persona = getPersona(overallScore);

  // Generate top opportunities based on weakest categories
  const topOpportunities = generateOpportunities(categoryScores, mode);

  return {
    overallScore,
    categoryScores,
    persona,
    percentile: 0, // Will be calculated server-side via database function
    mode,
    topOpportunities,
  };
}

/**
 * Serialize scorecard result for database storage
 */
export function serializeScorecardForDB(result: ScorecardResult) {
  return {
    scorecard_score: result.overallScore,
    scorecard_category_scores: result.categoryScores,
    scorecard_persona: result.persona.id,
    scorecard_mode: result.mode,
  };
}
