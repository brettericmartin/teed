/**
 * Gap Analysis Agent
 *
 * Identifies missing products and tracks library expansion needs.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type {
  DiscoveryCategory,
  DiscoveredProduct,
  LibraryGap,
  GapAnalysisReport,
} from '../types';

// ============================================================================
// Gap Recording
// ============================================================================

export async function recordProductGap(
  product: DiscoveredProduct,
  sourceUrl: string,
  category: DiscoveryCategory,
  supabase: SupabaseClient<any, any>
): Promise<void> {
  try {
    // Use the database function for upsert
    await supabase.rpc('record_library_gap', {
      p_product_name: product.name,
      p_brand: product.brand || 'Unknown',
      p_category: category,
      p_source_url: sourceUrl,
    });
  } catch (error) {
    console.error(`[GapAnalysis] Error recording gap for ${product.name}:`, error);
  }
}

export async function recordMultipleGaps(
  products: { product: DiscoveredProduct; sourceUrl: string }[],
  category: DiscoveryCategory,
  supabase: SupabaseClient<any, any>
): Promise<number> {
  let recorded = 0;

  for (const { product, sourceUrl } of products) {
    await recordProductGap(product, sourceUrl, category, supabase);
    recorded++;
  }

  return recorded;
}

// ============================================================================
// Gap Analysis
// ============================================================================

export async function analyzeGaps(
  category: DiscoveryCategory,
  supabase: SupabaseClient<any, any>
): Promise<GapAnalysisReport> {
  // Get unresolved gaps for category
  const { data: gaps, error } = await supabase
    .from('discovery_library_gaps')
    .select('*')
    .eq('category', category)
    .eq('resolved', false)
    .order('mention_count', { ascending: false })
    .limit(50);

  if (error) {
    console.error('[GapAnalysis] Error fetching gaps:', error);
    return {
      category,
      generatedAt: new Date(),
      totalGaps: 0,
      topGaps: [],
      recommendations: [],
    };
  }

  const topGaps: LibraryGap[] = (gaps || []).slice(0, 10).map((g) => ({
    productName: g.product_name,
    brand: g.brand || 'Unknown',
    category: g.category as DiscoveryCategory,
    mentionCount: g.mention_count,
    sourceUrls: g.source_urls || [],
    firstSeenAt: new Date(g.first_seen_at),
    lastSeenAt: new Date(g.last_seen_at),
  }));

  // Generate recommendations
  const recommendations = generateRecommendations(topGaps, category);

  return {
    category,
    generatedAt: new Date(),
    totalGaps: gaps?.length || 0,
    topGaps,
    recommendations,
  };
}

function generateRecommendations(gaps: LibraryGap[], category: DiscoveryCategory): string[] {
  const recommendations: string[] = [];

  // Brand analysis
  const brandCounts = new Map<string, number>();
  for (const gap of gaps) {
    const count = brandCounts.get(gap.brand) || 0;
    brandCounts.set(gap.brand, count + gap.mentionCount);
  }

  // Top missing brands
  const sortedBrands = [...brandCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3);

  if (sortedBrands.length > 0) {
    recommendations.push(
      `Priority brands to add: ${sortedBrands.map(([b]) => b).join(', ')}`
    );
  }

  // High-frequency gaps
  const highFrequency = gaps.filter((g) => g.mentionCount >= 3);
  if (highFrequency.length > 0) {
    recommendations.push(
      `${highFrequency.length} products mentioned 3+ times - prioritize these for library addition`
    );
  }

  // Recent gaps
  const recentGaps = gaps.filter(
    (g) => g.lastSeenAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
  );
  if (recentGaps.length > 0) {
    recommendations.push(
      `${recentGaps.length} products discovered in the last week - likely trending`
    );
  }

  return recommendations;
}

// ============================================================================
// Gap Resolution
// ============================================================================

export async function resolveGap(
  gapId: string,
  catalogItemId: string,
  supabase: SupabaseClient<any, any>
): Promise<boolean> {
  const { error } = await supabase
    .from('discovery_library_gaps')
    .update({
      resolved: true,
      resolved_at: new Date().toISOString(),
      resolved_catalog_id: catalogItemId,
    })
    .eq('id', gapId);

  return !error;
}

// ============================================================================
// Statistics
// ============================================================================

export async function getGapStatistics(
  supabase: SupabaseClient<any, any>,
  category?: DiscoveryCategory
): Promise<{
  total: number;
  resolved: number;
  unresolved: number;
  topBrands: { brand: string; count: number }[];
}> {
  let query = supabase
    .from('discovery_library_gaps')
    .select('brand, resolved, mention_count');

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error || !data) {
    return { total: 0, resolved: 0, unresolved: 0, topBrands: [] };
  }

  const resolved = data.filter((g) => g.resolved).length;
  const unresolved = data.filter((g) => !g.resolved).length;

  // Brand statistics
  const brandCounts = new Map<string, number>();
  for (const gap of data.filter((g) => !g.resolved)) {
    const brand = gap.brand || 'Unknown';
    const count = brandCounts.get(brand) || 0;
    brandCounts.set(brand, count + gap.mention_count);
  }

  const topBrands = [...brandCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([brand, count]) => ({ brand, count }));

  return {
    total: data.length,
    resolved,
    unresolved,
    topBrands,
  };
}
