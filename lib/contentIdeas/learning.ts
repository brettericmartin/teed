/**
 * Learning System for Content Idea Extraction
 *
 * Analyzes admin feedback/corrections to identify patterns and improve future extractions.
 * Uses the extraction_feedback table to:
 * 1. Identify common mistakes by vertical/category
 * 2. Track frequently missed brands/products
 * 3. Build confusion pairs (products AI frequently misidentifies)
 * 4. Generate improvement recommendations
 */

import { createClient } from '@supabase/supabase-js';
import type { ContentVertical } from '@/lib/types/contentIdeas';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

export interface FeedbackSummary {
  totalCorrections: number;
  byType: Record<string, number>;
  byVertical: Record<string, number>;
  recentTrend: 'improving' | 'stable' | 'declining';
}

export interface CommonMistake {
  type: 'missed_brand' | 'wrong_brand' | 'wrong_model' | 'false_positive' | 'content_type';
  pattern: string;
  frequency: number;
  examples: Array<{
    original: string;
    corrected: string;
    context?: string;
  }>;
  suggestedFix?: string;
}

export interface ConfusionPair {
  incorrectlyIdentifiedAs: string;
  actualProduct: string;
  frequency: number;
  vertical?: string;
}

export interface LearningInsights {
  summary: FeedbackSummary;
  commonMistakes: CommonMistake[];
  confusionPairs: ConfusionPair[];
  frequentlyMissedBrands: Array<{ brand: string; count: number; vertical?: string }>;
  contentTypeAccuracy: {
    total: number;
    correct: number;
    accuracy: number;
    commonMisdetections: Array<{
      detected: string;
      actual: string;
      count: number;
    }>;
  };
  recommendations: string[];
  generatedAt: string;
}

export interface ExtractionPromptEnhancements {
  // Brands to pay special attention to
  watchBrands: string[];
  // Common confusion pairs to avoid
  confusionWarnings: string[];
  // Category-specific notes
  categoryNotes: Record<string, string>;
  // Content type detection tips
  contentTypeHints: string[];
}

// ═══════════════════════════════════════════════════════════════════
// Database Client
// ═══════════════════════════════════════════════════════════════════

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ═══════════════════════════════════════════════════════════════════
// Core Learning Functions
// ═══════════════════════════════════════════════════════════════════

/**
 * Get learning insights from extraction feedback
 */
export async function getLearningInsights(
  vertical?: ContentVertical,
  daysBack: number = 30
): Promise<LearningInsights> {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);

  // Build query
  let query = supabaseAdmin
    .from('extraction_feedback')
    .select('*')
    .gte('created_at', startDate.toISOString());

  if (vertical) {
    query = query.eq('vertical', vertical);
  }

  const { data: feedback, error } = await query;

  if (error) {
    console.error('[Learning] Error fetching feedback:', error);
    throw new Error('Failed to fetch learning data');
  }

  const records = feedback || [];

  // Calculate summary
  const summary = calculateSummary(records, daysBack);

  // Analyze common mistakes
  const commonMistakes = analyzeCommonMistakes(records);

  // Find confusion pairs
  const confusionPairs = findConfusionPairs(records);

  // Find frequently missed brands
  const frequentlyMissedBrands = findMissedBrands(records);

  // Analyze content type accuracy
  const contentTypeAccuracy = analyzeContentTypeAccuracy(records);

  // Generate recommendations
  const recommendations = generateRecommendations(
    summary,
    commonMistakes,
    confusionPairs,
    frequentlyMissedBrands,
    contentTypeAccuracy
  );

  return {
    summary,
    commonMistakes,
    confusionPairs,
    frequentlyMissedBrands,
    contentTypeAccuracy,
    recommendations,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Get prompt enhancements based on learning
 */
export async function getPromptEnhancements(
  vertical?: ContentVertical
): Promise<ExtractionPromptEnhancements> {
  try {
    const insights = await getLearningInsights(vertical, 60);

    const watchBrands = insights.frequentlyMissedBrands
      .slice(0, 10)
      .map(b => b.brand);

    const confusionWarnings = insights.confusionPairs
      .slice(0, 5)
      .map(p => `Don't confuse "${p.incorrectlyIdentifiedAs}" with "${p.actualProduct}"`);

    const categoryNotes: Record<string, string> = {};
    for (const mistake of insights.commonMistakes) {
      if (mistake.type === 'wrong_model' && mistake.pattern) {
        const category = extractCategory(mistake.pattern);
        if (category) {
          categoryNotes[category] = mistake.suggestedFix || '';
        }
      }
    }

    const contentTypeHints = insights.contentTypeAccuracy.commonMisdetections
      .map(m => `Videos appearing as "${m.detected}" are often actually "${m.actual}"`);

    return {
      watchBrands,
      confusionWarnings,
      categoryNotes,
      contentTypeHints,
    };
  } catch (error) {
    console.error('[Learning] Error getting prompt enhancements:', error);
    // Return empty enhancements on error
    return {
      watchBrands: [],
      confusionWarnings: [],
      categoryNotes: {},
      contentTypeHints: [],
    };
  }
}

/**
 * Format enhancements as a prompt section
 */
export function formatEnhancementsForPrompt(
  enhancements: ExtractionPromptEnhancements
): string {
  const sections: string[] = [];

  if (enhancements.watchBrands.length > 0) {
    sections.push(
      `**Brands to Watch For:** Pay special attention to these commonly missed brands:\n` +
      enhancements.watchBrands.map(b => `- ${b}`).join('\n')
    );
  }

  if (enhancements.confusionWarnings.length > 0) {
    sections.push(
      `**Avoid Common Confusions:**\n` +
      enhancements.confusionWarnings.map(w => `- ${w}`).join('\n')
    );
  }

  if (Object.keys(enhancements.categoryNotes).length > 0) {
    sections.push(
      `**Category-Specific Notes:**\n` +
      Object.entries(enhancements.categoryNotes)
        .map(([cat, note]) => `- ${cat}: ${note}`)
        .join('\n')
    );
  }

  if (enhancements.contentTypeHints.length > 0) {
    sections.push(
      `**Content Type Detection Tips:**\n` +
      enhancements.contentTypeHints.map(h => `- ${h}`).join('\n')
    );
  }

  if (sections.length === 0) {
    return '';
  }

  return `\n\n## Learning-Based Improvements\n\n${sections.join('\n\n')}`;
}

// ═══════════════════════════════════════════════════════════════════
// Analysis Helpers
// ═══════════════════════════════════════════════════════════════════

interface FeedbackRecord {
  id: string;
  correction_type: string;
  validation_stage: string;
  vertical?: string;
  original_extraction: Record<string, unknown>;
  admin_corrections: Record<string, unknown>;
  admin_notes?: string;
  created_at: string;
}

function calculateSummary(records: FeedbackRecord[], daysBack: number): FeedbackSummary {
  const byType: Record<string, number> = {};
  const byVertical: Record<string, number> = {};

  for (const record of records) {
    byType[record.correction_type] = (byType[record.correction_type] || 0) + 1;
    if (record.vertical) {
      byVertical[record.vertical] = (byVertical[record.vertical] || 0) + 1;
    }
  }

  // Calculate trend (compare first half to second half of period)
  const midpoint = new Date();
  midpoint.setDate(midpoint.getDate() - Math.floor(daysBack / 2));

  const firstHalf = records.filter(r => new Date(r.created_at) < midpoint);
  const secondHalf = records.filter(r => new Date(r.created_at) >= midpoint);

  let recentTrend: 'improving' | 'stable' | 'declining' = 'stable';
  if (firstHalf.length > 0 && secondHalf.length > 0) {
    const ratio = secondHalf.length / firstHalf.length;
    if (ratio < 0.7) recentTrend = 'improving'; // Fewer corrections = improving
    else if (ratio > 1.3) recentTrend = 'declining';
  }

  return {
    totalCorrections: records.length,
    byType,
    byVertical,
    recentTrend,
  };
}

function analyzeCommonMistakes(records: FeedbackRecord[]): CommonMistake[] {
  const mistakes: CommonMistake[] = [];
  const typeGroups: Record<string, FeedbackRecord[]> = {};

  // Group by correction type
  for (const record of records) {
    if (!typeGroups[record.correction_type]) {
      typeGroups[record.correction_type] = [];
    }
    typeGroups[record.correction_type].push(record);
  }

  // Analyze each type
  for (const [type, group] of Object.entries(typeGroups)) {
    if (group.length < 2) continue; // Need multiple occurrences for a pattern

    const examples = group.slice(0, 3).map(r => ({
      original: JSON.stringify(r.original_extraction).slice(0, 100),
      corrected: JSON.stringify(r.admin_corrections).slice(0, 100),
      context: r.admin_notes,
    }));

    // Find common patterns
    const pattern = findPattern(group);

    mistakes.push({
      type: type as CommonMistake['type'],
      pattern,
      frequency: group.length,
      examples,
      suggestedFix: generateSuggestedFix(type, group),
    });
  }

  return mistakes.sort((a, b) => b.frequency - a.frequency);
}

function findPattern(records: FeedbackRecord[]): string {
  // Try to find common elements in corrections
  const originalValues: string[] = [];

  for (const record of records) {
    const original = record.original_extraction;
    if (typeof original === 'object' && original !== null) {
      if ('name' in original) originalValues.push(String(original.name));
      if ('brand' in original) originalValues.push(String(original.brand));
    }
  }

  // Find most common substring
  if (originalValues.length === 0) return 'Various products';

  const words = originalValues.flatMap(v => v.toLowerCase().split(/\s+/));
  const wordCounts: Record<string, number> = {};

  for (const word of words) {
    if (word.length > 2) {
      wordCounts[word] = (wordCounts[word] || 0) + 1;
    }
  }

  const sortedWords = Object.entries(wordCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3)
    .map(([word]) => word);

  return sortedWords.length > 0 ? sortedWords.join(', ') : 'Various products';
}

function findConfusionPairs(records: FeedbackRecord[]): ConfusionPair[] {
  const pairs: Map<string, { count: number; vertical?: string }> = new Map();

  for (const record of records) {
    if (record.correction_type === 'wrong_brand' || record.correction_type === 'wrong_model') {
      const original = record.original_extraction as { name?: string; brand?: string };
      const corrected = record.admin_corrections as { name?: string; brand?: string };

      if (original.name && corrected.name && original.name !== corrected.name) {
        const key = `${original.name}|${corrected.name}`;
        const existing = pairs.get(key);
        pairs.set(key, {
          count: (existing?.count || 0) + 1,
          vertical: record.vertical,
        });
      }
    }
  }

  return Array.from(pairs.entries())
    .map(([key, value]) => {
      const [incorrect, actual] = key.split('|');
      return {
        incorrectlyIdentifiedAs: incorrect,
        actualProduct: actual,
        frequency: value.count,
        vertical: value.vertical,
      };
    })
    .filter(p => p.frequency >= 2)
    .sort((a, b) => b.frequency - a.frequency);
}

function findMissedBrands(records: FeedbackRecord[]): Array<{ brand: string; count: number; vertical?: string }> {
  const brandCounts: Map<string, { count: number; vertical?: string }> = new Map();

  for (const record of records) {
    if (record.correction_type === 'missed_product') {
      const corrections = record.admin_corrections as { product?: { brand?: string } };
      const brand = corrections.product?.brand;

      if (brand) {
        const existing = brandCounts.get(brand);
        brandCounts.set(brand, {
          count: (existing?.count || 0) + 1,
          vertical: record.vertical,
        });
      }
    }
  }

  return Array.from(brandCounts.entries())
    .map(([brand, value]) => ({
      brand,
      count: value.count,
      vertical: value.vertical,
    }))
    .filter(b => b.count >= 2)
    .sort((a, b) => b.count - a.count);
}

function analyzeContentTypeAccuracy(records: FeedbackRecord[]): LearningInsights['contentTypeAccuracy'] {
  const contentTypeRecords = records.filter(r => r.correction_type === 'content_type');
  const total = contentTypeRecords.length;

  if (total === 0) {
    return {
      total: 0,
      correct: 0,
      accuracy: 1, // No errors = 100% accuracy
      commonMisdetections: [],
    };
  }

  const misdetections: Map<string, number> = new Map();

  for (const record of contentTypeRecords) {
    const original = record.original_extraction as { contentType?: string };
    const corrected = record.admin_corrections as { contentType?: string };

    if (original.contentType && corrected.contentType) {
      const key = `${original.contentType}|${corrected.contentType}`;
      misdetections.set(key, (misdetections.get(key) || 0) + 1);
    }
  }

  const commonMisdetections = Array.from(misdetections.entries())
    .map(([key, count]) => {
      const [detected, actual] = key.split('|');
      return { detected, actual, count };
    })
    .sort((a, b) => b.count - a.count);

  return {
    total,
    correct: 0, // Content type records are always corrections
    accuracy: 0, // We only have records of mistakes
    commonMisdetections,
  };
}

function generateSuggestedFix(type: string, records: FeedbackRecord[]): string {
  switch (type) {
    case 'missed_product':
      return 'Add these brands to the watchlist and check video more carefully';
    case 'wrong_brand':
      return 'Pay closer attention to brand logos and context clues';
    case 'wrong_model':
      return 'Verify model numbers against year and visual details';
    case 'false_positive':
      return 'Be more conservative with uncertain detections';
    case 'content_type':
      return 'Check transcript for enumeration patterns and title for collection keywords';
    default:
      return 'Review extraction logic for this category';
  }
}

function generateRecommendations(
  summary: FeedbackSummary,
  mistakes: CommonMistake[],
  confusionPairs: ConfusionPair[],
  missedBrands: Array<{ brand: string; count: number }>,
  contentTypeAccuracy: LearningInsights['contentTypeAccuracy']
): string[] {
  const recommendations: string[] = [];

  // Overall trend
  if (summary.recentTrend === 'declining') {
    recommendations.push('Extraction accuracy is declining - review recent changes to prompts or processing');
  } else if (summary.recentTrend === 'improving') {
    recommendations.push('Good progress! Extraction accuracy is improving');
  }

  // Top mistake type
  const topMistakeType = Object.entries(summary.byType)
    .sort(([, a], [, b]) => b - a)[0];

  if (topMistakeType) {
    const [type, count] = topMistakeType;
    if (count > 5) {
      recommendations.push(`Focus on reducing "${type}" errors (${count} occurrences)`);
    }
  }

  // Missed brands
  if (missedBrands.length > 3) {
    recommendations.push(
      `Add ${missedBrands.slice(0, 3).map(b => b.brand).join(', ')} to brand watchlist`
    );
  }

  // Confusion pairs
  if (confusionPairs.length > 0) {
    recommendations.push(
      `Create disambiguation rules for commonly confused products`
    );
  }

  // Content type
  if (contentTypeAccuracy.commonMisdetections.length > 0) {
    const top = contentTypeAccuracy.commonMisdetections[0];
    recommendations.push(
      `Improve "${top.detected}" vs "${top.actual}" content type detection`
    );
  }

  // Vertical-specific
  const topVertical = Object.entries(summary.byVertical)
    .sort(([, a], [, b]) => b - a)[0];

  if (topVertical && topVertical[1] > 10) {
    recommendations.push(
      `Review extraction prompts for "${topVertical[0]}" vertical (${topVertical[1]} corrections needed)`
    );
  }

  return recommendations;
}

function extractCategory(pattern: string): string | null {
  const categories = ['putter', 'driver', 'iron', 'wedge', 'ball', 'camera', 'lens', 'keyboard', 'mouse'];

  for (const cat of categories) {
    if (pattern.toLowerCase().includes(cat)) {
      return cat;
    }
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════
// API for Dashboard
// ═══════════════════════════════════════════════════════════════════

/**
 * Get feedback statistics for admin dashboard
 */
export async function getFeedbackStats(): Promise<{
  last24h: number;
  last7d: number;
  last30d: number;
  byType: Record<string, number>;
  byVertical: Record<string, number>;
}> {
  const now = new Date();
  const day = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const week = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const month = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const { data: allFeedback } = await supabaseAdmin
    .from('extraction_feedback')
    .select('correction_type, vertical, created_at')
    .gte('created_at', month.toISOString());

  const records = allFeedback || [];

  const last24h = records.filter(r => new Date(r.created_at) >= day).length;
  const last7d = records.filter(r => new Date(r.created_at) >= week).length;
  const last30d = records.length;

  const byType: Record<string, number> = {};
  const byVertical: Record<string, number> = {};

  for (const record of records) {
    byType[record.correction_type] = (byType[record.correction_type] || 0) + 1;
    if (record.vertical) {
      byVertical[record.vertical] = (byVertical[record.vertical] || 0) + 1;
    }
  }

  return { last24h, last7d, last30d, byType, byVertical };
}
