/**
 * Bag Analyzer
 *
 * Analyzes bags for completeness, SEO, organization, monetization,
 * and quality - providing actionable recommendations.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { openai } from '../openaiClient';
import type {
  BagAnalysisInput,
  BagAnalysisResult,
  BagData,
  DimensionScore,
  AnalysisIssue,
  MissingItem,
  AnalysisDimension,
  IssueLevel,
} from './types';

// Re-export types
export * from './types';

// ============================================================================
// Supabase Client
// ============================================================================

function getSupabase(): SupabaseClient {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ============================================================================
// Main Analysis Function
// ============================================================================

/**
 * Analyze a bag and return comprehensive results
 */
export async function analyzeBag(input: BagAnalysisInput): Promise<BagAnalysisResult> {
  const supabase = getSupabase();

  // Fetch bag data
  const bagData = await fetchBagData(input, supabase);
  if (!bagData) {
    throw new Error('Bag not found');
  }

  // Run all analysis dimensions
  const dimensions: DimensionScore[] = [
    analyzeCompleteness(bagData),
    analyzeSEO(bagData),
    analyzeOrganization(bagData),
    analyzeMonetization(bagData),
    analyzeQuality(bagData),
    analyzeEngagement(bagData),
  ];

  // Calculate overall score (weighted average)
  const weights: Record<AnalysisDimension, number> = {
    completeness: 0.25,
    seo: 0.20,
    organization: 0.15,
    monetization: 0.15,
    quality: 0.15,
    engagement: 0.10,
  };

  const overallScore = Math.round(
    dimensions.reduce((sum, d) => sum + d.score * weights[d.dimension], 0)
  );

  // Collect all issues
  const allIssues = dimensions.flatMap((d) => d.issues);

  // Sort by impact and get top issues
  const topIssues = allIssues
    .filter((i) => i.level === 'critical' || i.level === 'warning')
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 5);

  // Find quick wins (high impact, easy effort)
  const quickWins = allIssues
    .filter((i) => i.effort === 'easy' && i.impact >= 5)
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 3);

  // Identify strengths
  const strengths = identifyStrengths(bagData, dimensions);

  // Get missing items (AI-powered if enabled)
  let missingItems: MissingItem[] = [];
  if (input.includeAIAnalysis) {
    missingItems = await suggestMissingItems(bagData);
  }

  // Calculate grade
  const grade = calculateGrade(overallScore);

  return {
    bagId: bagData.id,
    bagCode: bagData.code,
    bagTitle: bagData.title,
    overallScore,
    grade,
    dimensions,
    topIssues,
    quickWins,
    missingItems,
    strengths,
    analyzedAt: new Date(),
  };
}

// ============================================================================
// Data Fetching
// ============================================================================

async function fetchBagData(
  input: BagAnalysisInput,
  supabase: SupabaseClient
): Promise<BagData | null> {
  let query = supabase
    .from('bags')
    .select(`
      id,
      code,
      title,
      description,
      category,
      tags,
      meta_description,
      cover_photo_id,
      hero_item_id,
      is_complete,
      is_public,
      created_at,
      updated_at,
      bag_items (
        id,
        name,
        brand,
        custom_description,
        photo_url,
        is_featured,
        featured_position,
        sort_index,
        section_id,
        bag_item_links (
          id,
          url,
          link_type,
          is_affiliate
        )
      ),
      bag_sections (
        id,
        name,
        description,
        sort_index
      )
    `)
    .eq('owner_id', input.userId);

  if (input.bagId) {
    query = query.eq('id', input.bagId);
  } else if (input.bagCode) {
    query = query.eq('code', input.bagCode);
  } else {
    return null;
  }

  const { data, error } = await query.single();

  if (error || !data) {
    console.error('[Analyzer] Error fetching bag:', error?.message);
    return null;
  }

  return {
    ...data,
    items: (data.bag_items || []).map((item: any) => ({
      ...item,
      links: item.bag_item_links || [],
    })),
    sections: data.bag_sections || [],
  };
}

// ============================================================================
// Dimension Analyzers
// ============================================================================

function analyzeCompleteness(bag: BagData): DimensionScore {
  const issues: AnalysisIssue[] = [];
  let score = 0;
  const maxScore = 100;

  // Title (10 points)
  if (bag.title && bag.title.length > 5) {
    score += 10;
  } else {
    issues.push(createIssue('completeness', 'critical', 'title-missing',
      'Missing or weak title',
      'Your bag title is too short or missing.',
      'Add a descriptive title (10-60 characters) that clearly describes your bag.',
      8, 'easy'));
  }

  // Description (15 points)
  const descLen = bag.description?.length || 0;
  if (descLen >= 100) {
    score += 15;
  } else if (descLen >= 50) {
    score += 8;
    issues.push(createIssue('completeness', 'warning', 'description-short',
      'Description could be longer',
      `Your description is ${descLen} characters. Aim for 100+.`,
      'Expand your description to explain the purpose and context of this bag.',
      5, 'easy'));
  } else {
    issues.push(createIssue('completeness', 'critical', 'description-missing',
      'Missing or very short description',
      'A good description helps users understand your bag.',
      'Write 2-3 sentences explaining what this bag is for and who it\'s for.',
      7, 'easy'));
  }

  // Items (20 points)
  const itemCount = bag.items.length;
  if (itemCount >= 8) {
    score += 20;
  } else if (itemCount >= 5) {
    score += 15;
    issues.push(createIssue('completeness', 'suggestion', 'few-items',
      'Could use more items',
      `You have ${itemCount} items. Bags with 8+ items perform better.`,
      'Consider adding more items to make your bag more comprehensive.',
      4, 'medium'));
  } else if (itemCount >= 3) {
    score += 8;
    issues.push(createIssue('completeness', 'warning', 'too-few-items',
      'Bag needs more items',
      `Only ${itemCount} items. This may seem incomplete.`,
      'Add at least 5-8 items to create a useful bag.',
      6, 'medium'));
  } else {
    issues.push(createIssue('completeness', 'critical', 'very-few-items',
      'Bag is nearly empty',
      `Only ${itemCount} item(s). This bag needs content.`,
      'Add items to make this bag valuable to viewers.',
      9, 'medium'));
  }

  // Cover photo (10 points)
  if (bag.cover_photo_id) {
    score += 10;
  } else {
    issues.push(createIssue('completeness', 'warning', 'no-cover',
      'No cover photo',
      'Bags with cover photos get more engagement.',
      'Upload a cover photo that represents your bag.',
      6, 'easy'));
  }

  // Item photos (15 points)
  const itemsWithPhotos = bag.items.filter((i) => i.photo_url).length;
  const photoRatio = itemCount > 0 ? itemsWithPhotos / itemCount : 0;
  score += Math.round(photoRatio * 15);
  if (photoRatio < 0.5 && itemCount > 0) {
    issues.push(createIssue('completeness', 'warning', 'few-item-photos',
      'Many items lack photos',
      `Only ${Math.round(photoRatio * 100)}% of items have photos.`,
      'Add photos to your items to make them more recognizable.',
      5, 'medium'));
  }

  // Tags (10 points)
  const tagCount = bag.tags?.length || 0;
  if (tagCount >= 3) {
    score += 10;
  } else if (tagCount >= 1) {
    score += 5;
    issues.push(createIssue('completeness', 'suggestion', 'few-tags',
      'Add more tags',
      `You have ${tagCount} tag(s). 3-7 tags is optimal.`,
      'Add relevant tags to improve discoverability.',
      3, 'easy'));
  } else {
    issues.push(createIssue('completeness', 'warning', 'no-tags',
      'No tags',
      'Tags help people find your bag.',
      'Add 3-7 relevant tags describing your bag.',
      5, 'easy'));
  }

  // Category (10 points)
  if (bag.category && bag.category !== 'other') {
    score += 10;
  } else {
    issues.push(createIssue('completeness', 'warning', 'no-category',
      'Category not set',
      'Setting a category helps with organization and discovery.',
      'Choose the most relevant category for your bag.',
      4, 'easy'));
  }

  // Meta description (10 points)
  if (bag.meta_description && bag.meta_description.length >= 50) {
    score += 10;
  } else if (bag.meta_description) {
    score += 5;
    issues.push(createIssue('completeness', 'suggestion', 'short-meta',
      'Meta description is short',
      'A longer meta description improves SEO.',
      'Expand to 120-160 characters for best results.',
      3, 'easy'));
  }

  return {
    dimension: 'completeness',
    score: Math.min(score, maxScore),
    maxScore,
    label: 'Completeness',
    description: 'How complete and filled out your bag is',
    issues,
  };
}

function analyzeSEO(bag: BagData): DimensionScore {
  const issues: AnalysisIssue[] = [];
  let score = 0;
  const maxScore = 100;

  // Title length (20 points)
  const titleLen = bag.title?.length || 0;
  if (titleLen >= 20 && titleLen <= 60) {
    score += 20;
  } else if (titleLen >= 10) {
    score += 10;
    issues.push(createIssue('seo', 'suggestion', 'title-length',
      'Title length not optimal',
      `Title is ${titleLen} chars. Optimal is 20-60.`,
      'Adjust title length for better SEO.',
      3, 'easy'));
  }

  // Meta description (30 points)
  const metaLen = bag.meta_description?.length || 0;
  if (metaLen >= 120 && metaLen <= 160) {
    score += 30;
  } else if (metaLen >= 50) {
    score += 15;
    issues.push(createIssue('seo', 'warning', 'meta-length',
      'Meta description not optimal',
      `Meta description is ${metaLen} chars. Optimal is 120-160.`,
      'Adjust meta description for better search results.',
      5, 'easy'));
  } else {
    issues.push(createIssue('seo', 'critical', 'no-meta',
      'Missing meta description',
      'Meta description is important for search engines.',
      'Add a compelling 120-160 character meta description.',
      7, 'easy'));
  }

  // Tags (25 points)
  const tagCount = bag.tags?.length || 0;
  if (tagCount >= 3 && tagCount <= 7) {
    score += 25;
  } else if (tagCount >= 1) {
    score += 12;
    issues.push(createIssue('seo', 'suggestion', 'tag-count',
      'Tag count not optimal',
      `You have ${tagCount} tags. 3-7 is optimal.`,
      tagCount < 3 ? 'Add more relevant tags.' : 'Consider removing less relevant tags.',
      3, 'easy'));
  } else {
    issues.push(createIssue('seo', 'warning', 'no-tags-seo',
      'No tags for SEO',
      'Tags improve search discoverability.',
      'Add 3-7 relevant, searchable tags.',
      5, 'easy'));
  }

  // URL slug (15 points)
  const slugLen = bag.code?.length || 0;
  if (slugLen >= 5 && slugLen <= 50 && !bag.code.includes('--')) {
    score += 15;
  } else {
    score += 8;
  }

  // Category (10 points)
  if (bag.category && bag.category !== 'other') {
    score += 10;
  }

  return {
    dimension: 'seo',
    score: Math.min(score, maxScore),
    maxScore,
    label: 'SEO & Discoverability',
    description: 'How well optimized for search and sharing',
    issues,
  };
}

function analyzeOrganization(bag: BagData): DimensionScore {
  const issues: AnalysisIssue[] = [];
  let score = 0;
  const maxScore = 100;

  const itemCount = bag.items.length;

  // Featured items (35 points)
  const featuredCount = bag.items.filter((i) => i.is_featured).length;
  if (featuredCount >= 1 && featuredCount <= 8) {
    score += 35;
  } else if (itemCount > 5) {
    issues.push(createIssue('organization', 'suggestion', 'no-featured',
      'No featured items',
      'Featured items highlight your top picks.',
      'Mark 1-8 items as featured to help visitors.',
      4, 'easy'));
  }

  // Sort order (30 points)
  const hasSortOrder = bag.items.every((item, idx) =>
    item.sort_index !== null && item.sort_index !== undefined
  );
  if (hasSortOrder) {
    score += 30;
  }

  // Hero item (25 points)
  if (bag.hero_item_id) {
    score += 25;
  } else if (itemCount > 0) {
    issues.push(createIssue('organization', 'suggestion', 'no-hero',
      'No hero item set',
      'A hero item is featured prominently at the top.',
      'Set your most important item as the hero.',
      3, 'easy'));
  }

  // Good item count (10 points) - not too few, not overwhelming
  if (itemCount >= 3 && itemCount <= 20) {
    score += 10;
  } else if (itemCount > 20) {
    issues.push(createIssue('organization', 'suggestion', 'many-items',
      'Large collection',
      `You have ${itemCount} items which may be hard to browse.`,
      'Consider creating multiple focused bags.',
      2, 'medium'));
  }

  return {
    dimension: 'organization',
    score: Math.min(score, maxScore),
    maxScore,
    label: 'Organization',
    description: 'How well structured and easy to navigate',
    issues,
  };
}

function analyzeMonetization(bag: BagData): DimensionScore {
  const issues: AnalysisIssue[] = [];
  let score = 0;
  const maxScore = 100;

  const itemCount = bag.items.length;
  if (itemCount === 0) {
    return {
      dimension: 'monetization',
      score: 0,
      maxScore,
      label: 'Monetization',
      description: 'Affiliate link coverage and revenue potential',
      issues: [],
    };
  }

  // Count items with affiliate links
  const itemsWithAffiliateLinks = bag.items.filter((item) =>
    item.links.some((link) => link.is_affiliate)
  ).length;
  const coverage = itemsWithAffiliateLinks / itemCount;

  // Coverage score (60 points)
  score += Math.round(coverage * 60);
  if (coverage < 0.5) {
    issues.push(createIssue('monetization', 'warning', 'low-affiliate-coverage',
      'Low affiliate link coverage',
      `Only ${Math.round(coverage * 100)}% of items have affiliate links.`,
      'Add affiliate links to more items to increase potential revenue.',
      6, 'medium'));
  }

  // Has any links (20 points)
  const totalLinks = bag.items.reduce((sum, item) => sum + item.links.length, 0);
  if (totalLinks > 0) {
    score += 20;
  } else {
    issues.push(createIssue('monetization', 'critical', 'no-links',
      'No product links',
      'Your bag has no product links at all.',
      'Add links to products so viewers can purchase items.',
      8, 'medium'));
  }

  // Link diversity (20 points)
  const hasAmazon = bag.items.some((item) =>
    item.links.some((link) => link.url?.includes('amazon'))
  );
  const hasOtherAffiliate = bag.items.some((item) =>
    item.links.some((link) => link.is_affiliate && !link.url?.includes('amazon'))
  );
  if (hasAmazon) score += 10;
  if (hasOtherAffiliate) score += 10;

  return {
    dimension: 'monetization',
    score: Math.min(score, maxScore),
    maxScore,
    label: 'Monetization',
    description: 'Affiliate link coverage and revenue potential',
    issues,
  };
}

function analyzeQuality(bag: BagData): DimensionScore {
  const issues: AnalysisIssue[] = [];
  let score = 0;
  const maxScore = 100;

  const itemCount = bag.items.length;
  if (itemCount === 0) {
    return {
      dimension: 'quality',
      score: 0,
      maxScore,
      label: 'Item Quality',
      description: 'Detail and richness of item information',
      issues: [],
    };
  }

  // Brand info (25 points)
  const itemsWithBrand = bag.items.filter((i) => i.brand).length;
  const brandRatio = itemsWithBrand / itemCount;
  score += Math.round(brandRatio * 25);
  if (brandRatio < 0.5) {
    issues.push(createIssue('quality', 'suggestion', 'missing-brands',
      'Many items missing brand info',
      `Only ${Math.round(brandRatio * 100)}% of items have brand specified.`,
      'Add brand names to help users identify products.',
      4, 'easy'));
  }

  // Item descriptions (25 points)
  const itemsWithDesc = bag.items.filter((i) =>
    i.custom_description && i.custom_description.length > 20
  ).length;
  const descRatio = itemsWithDesc / itemCount;
  score += Math.round(descRatio * 25);
  if (descRatio < 0.3) {
    issues.push(createIssue('quality', 'warning', 'missing-item-desc',
      'Most items lack descriptions',
      'Item descriptions help explain why you chose each item.',
      'Add personal notes about why you recommend each item.',
      5, 'medium'));
  }

  // Photos (30 points)
  const itemsWithPhotos = bag.items.filter((i) => i.photo_url).length;
  const photoRatio = itemsWithPhotos / itemCount;
  score += Math.round(photoRatio * 30);

  // Item specificity - items with both brand and description (20 points)
  const wellDocumented = bag.items.filter((i) =>
    i.brand && i.custom_description && i.custom_description.length > 10
  ).length;
  const specificityRatio = wellDocumented / itemCount;
  score += Math.round(specificityRatio * 20);

  return {
    dimension: 'quality',
    score: Math.min(score, maxScore),
    maxScore,
    label: 'Item Quality',
    description: 'Detail and richness of item information',
    issues,
  };
}

function analyzeEngagement(bag: BagData): DimensionScore {
  const issues: AnalysisIssue[] = [];
  let score = 0;
  const maxScore = 100;

  const itemCount = bag.items.length;

  // Cover photo appeal (25 points)
  if (bag.cover_photo_id) {
    score += 25;
  }

  // Featured items (25 points)
  const featuredCount = bag.items.filter((i) => i.is_featured).length;
  if (featuredCount > 0) {
    score += Math.min(25, featuredCount * 5);
  }

  // Hero item (20 points)
  if (bag.hero_item_id) {
    score += 20;
  }

  // Visual content (15 points)
  const itemsWithPhotos = bag.items.filter((i) => i.photo_url).length;
  if (itemCount > 0) {
    score += Math.round((itemsWithPhotos / itemCount) * 15);
  }

  // Description engagement (15 points)
  const descLen = bag.description?.length || 0;
  if (descLen >= 150) {
    score += 15;
  } else if (descLen >= 50) {
    score += 8;
  }

  // Add engagement suggestions
  if (score < 50 && itemCount > 0) {
    issues.push(createIssue('engagement', 'suggestion', 'low-engagement',
      'Low engagement potential',
      'Your bag may not capture viewer attention effectively.',
      'Add a cover photo, feature your best items, and write an engaging description.',
      5, 'medium'));
  }

  return {
    dimension: 'engagement',
    score: Math.min(score, maxScore),
    maxScore,
    label: 'Engagement Potential',
    description: 'Visual appeal and shareability',
    issues,
  };
}

// ============================================================================
// AI-Powered Missing Items
// ============================================================================

async function suggestMissingItems(bag: BagData): Promise<MissingItem[]> {
  if (bag.items.length === 0) return [];

  const itemNames = bag.items.map((i) => i.name).join(', ');

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You suggest missing items for gear bags/collections. Return JSON array with max 5 items:
[{"name": "Item name", "category": "category", "reason": "why it's needed", "priority": "essential|recommended|optional"}]
Only suggest items that are commonly expected but missing. Be specific with product types.`,
        },
        {
          role: 'user',
          content: `Bag: "${bag.title}"
Category: ${bag.category || 'general'}
Current items: ${itemNames}
Description: ${bag.description || 'No description'}

What essential items might be missing?`,
        },
      ],
      max_tokens: 500,
      temperature: 0.5,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content);
    return (parsed.items || parsed || []).slice(0, 5);
  } catch (err) {
    console.error('[Analyzer] AI suggestion error:', err);
    return [];
  }
}

// ============================================================================
// Helpers
// ============================================================================

function createIssue(
  dimension: AnalysisDimension,
  level: IssueLevel,
  id: string,
  title: string,
  description: string,
  recommendation: string,
  impact: number,
  effort: 'easy' | 'medium' | 'hard'
): AnalysisIssue {
  return { id, dimension, level, title, description, recommendation, impact, effort };
}

function calculateGrade(score: number): 'A' | 'B' | 'C' | 'D' | 'F' {
  if (score >= 90) return 'A';
  if (score >= 80) return 'B';
  if (score >= 70) return 'C';
  if (score >= 60) return 'D';
  return 'F';
}

function identifyStrengths(bag: BagData, dimensions: DimensionScore[]): string[] {
  const strengths: string[] = [];

  // Find high-scoring dimensions
  for (const dim of dimensions) {
    if (dim.score >= 80) {
      switch (dim.dimension) {
        case 'completeness':
          strengths.push('Well-documented and complete');
          break;
        case 'seo':
          strengths.push('Great SEO optimization');
          break;
        case 'organization':
          strengths.push('Well organized and easy to navigate');
          break;
        case 'monetization':
          strengths.push('Strong monetization setup');
          break;
        case 'quality':
          strengths.push('High-quality item details');
          break;
        case 'engagement':
          strengths.push('Visually engaging');
          break;
      }
    }
  }

  // Check specific strengths
  if (bag.items.length >= 10) {
    strengths.push('Comprehensive item collection');
  }
  const featuredCount = bag.items.filter((i) => i.is_featured).length;
  if (featuredCount >= 3) {
    strengths.push('Great featured item selection');
  }

  return strengths.slice(0, 5);
}
