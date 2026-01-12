/**
 * Discovery Curation Team - Main Orchestrator
 *
 * Coordinates research, curation, and gap analysis agents
 * to discover trending gear and create curated bags.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { runResearch, saveResearchResults } from './agents/researchAgent';
import {
  curateResearchResults,
  createBagInDatabase,
  getTeedUserId,
} from './agents/curationAgent';
import {
  analyzeGaps,
  recordProductGap,
  getGapStatistics,
} from './agents/gapAnalysisAgent';
import { DEFAULT_RUN_CONFIG, isValidCategory, getCategoryConfig } from './config';
import type {
  DiscoveryCategory,
  DiscoveryRunConfig,
  DiscoveryRun,
  DiscoveryResult,
  ResearchResult,
  GapAnalysisReport,
} from './types';

// ============================================================================
// Main Orchestrator
// ============================================================================

export async function runDiscovery(
  category: DiscoveryCategory,
  config: Partial<DiscoveryRunConfig> = {}
): Promise<DiscoveryResult> {
  // Validate category
  if (!isValidCategory(category)) {
    throw new Error(`Invalid category: ${category}`);
  }

  // Merge with defaults
  const runConfig: DiscoveryRunConfig = { ...DEFAULT_RUN_CONFIG, ...config };

  // Initialize Supabase client
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Create run record
  const { data: runRecord, error: runError } = await supabase
    .from('discovery_runs')
    .insert({
      category,
      status: 'running',
      run_config: runConfig,
    })
    .select('id')
    .single();

  if (runError || !runRecord) {
    throw new Error(`Failed to create run record: ${runError?.message}`);
  }

  const runId = runRecord.id;
  console.log(`[Discovery] Starting run ${runId} for ${category}`);

  try {
    // ========================================
    // Phase 1: Research
    // ========================================
    console.log(`[Discovery] Phase 1: Research...`);
    const researchResults = await runResearch(category, runConfig, supabase);

    // Save research to database
    const { sourceIds, productCount } = await saveResearchResults(researchResults, supabase);

    // Update run with research stats
    await supabase
      .from('discovery_runs')
      .update({
        sources_found: researchResults.length,
        sources_processed: sourceIds.length,
        products_found: productCount,
      })
      .eq('id', runId);

    console.log(
      `[Discovery] Research complete: ${researchResults.length} sources, ${productCount} products`
    );

    // ========================================
    // Phase 2: Curation (if not dry run)
    // ========================================
    let bags: CuratedBag[] = [];
    const bagIds: string[] = [];

    if (!runConfig.dryRun && researchResults.length > 0) {
      console.log(`[Discovery] Phase 2: Curation...`);

      // Get @teed user
      const teedUserId = await getTeedUserId(supabase);
      if (!teedUserId) {
        throw new Error('@teed user not found');
      }

      // Curate results into bags
      bags = await curateResearchResults(researchResults, category);

      // Create bags in database
      for (const bag of bags) {
        const bagId = await createBagInDatabase(bag, teedUserId, supabase);
        if (bagId) {
          bagIds.push(bagId);
        }
      }

      console.log(`[Discovery] Curation complete: ${bagIds.length} bags created`);
    } else if (runConfig.dryRun) {
      console.log(`[Discovery] Dry run - skipping bag creation`);
    }

    // ========================================
    // Phase 3: Gap Analysis
    // ========================================
    console.log(`[Discovery] Phase 3: Gap Analysis...`);

    // Record gaps for products that weren't matched to catalog
    for (const result of researchResults) {
      for (const product of result.products) {
        // Products with low confidence or no catalog match are gaps
        if (product.confidence < 70) {
          await recordProductGap(product, result.sourceUrl, category, supabase);
        }
      }
    }

    const gapReport = await analyzeGaps(category, supabase);
    console.log(`[Discovery] Gap analysis: ${gapReport.totalGaps} unresolved gaps`);

    // ========================================
    // Complete Run
    // ========================================
    await supabase
      .from('discovery_runs')
      .update({
        status: 'completed',
        bags_created: bagIds.length,
        bag_ids: bagIds,
        completed_at: new Date().toISOString(),
      })
      .eq('id', runId);

    const run = await getRunStatus(runId, supabase);

    return {
      run: run!,
      bags,
      gapReport,
    };
  } catch (error) {
    // Mark run as failed
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await supabase
      .from('discovery_runs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: errorMessage,
      })
      .eq('id', runId);

    console.error(`[Discovery] Run failed:`, error);
    throw error;
  }
}

// ============================================================================
// Status & History
// ============================================================================

async function getRunStatus(
  runId: string,
  supabase: SupabaseClient<any, any>
): Promise<DiscoveryRun | null> {
  const { data, error } = await supabase
    .from('discovery_runs')
    .select('*')
    .eq('id', runId)
    .single();

  if (error || !data) return null;

  return {
    id: data.id,
    category: data.category as DiscoveryCategory,
    status: data.status as DiscoveryRun['status'],
    sourcesFound: data.sources_found,
    sourcesProcessed: data.sources_processed,
    productsFound: data.products_found,
    bagsCreated: data.bags_created,
    bagIds: data.bag_ids || [],
    startedAt: new Date(data.started_at),
    completedAt: data.completed_at ? new Date(data.completed_at) : undefined,
    errorMessage: data.error_message || undefined,
    config: data.run_config || {},
  };
}

export async function getDiscoveryRunStatus(runId: string): Promise<DiscoveryRun | null> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  return getRunStatus(runId, supabase);
}

export async function getRecentRuns(
  category?: DiscoveryCategory,
  limit: number = 10
): Promise<DiscoveryRun[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  let query = supabase
    .from('discovery_runs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(limit);

  if (category) {
    query = query.eq('category', category);
  }

  const { data, error } = await query;

  if (error || !data) return [];

  return data.map((d) => ({
    id: d.id,
    category: d.category as DiscoveryCategory,
    status: d.status as DiscoveryRun['status'],
    sourcesFound: d.sources_found,
    sourcesProcessed: d.sources_processed,
    productsFound: d.products_found,
    bagsCreated: d.bags_created,
    bagIds: d.bag_ids || [],
    startedAt: new Date(d.started_at),
    completedAt: d.completed_at ? new Date(d.completed_at) : undefined,
    errorMessage: d.error_message || undefined,
    config: d.run_config || {},
  }));
}

// ============================================================================
// Convenience Exports
// ============================================================================

export { isValidCategory, getCategoryConfig, getAllCategories } from './config';
export { analyzeGaps, getGapStatistics } from './agents/gapAnalysisAgent';
export type {
  DiscoveryCategory,
  DiscoveryRun,
  DiscoveryResult,
  DiscoveryRunConfig,
  ResearchResult,
  DiscoveredProduct,
  GapAnalysisReport,
  CuratedBag,
} from './types';

// Type import for curateResearchResults
import type { CuratedBag } from './types';
