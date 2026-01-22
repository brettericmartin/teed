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
  DiscoveryPhase,
} from './types';

// ============================================================================
// Progress Tracking
// ============================================================================

/**
 * Update the progress of a discovery run
 */
async function updateProgress(
  runId: string,
  phase: DiscoveryPhase,
  progress: number,
  supabase: SupabaseClient<any, any>,
  additionalData?: Record<string, unknown>
): Promise<void> {
  const updateData: Record<string, unknown> = {
    current_phase: phase,
    phase_progress: Math.min(100, Math.max(0, progress)),
    last_progress_update: new Date().toISOString(),
    ...additionalData,
  };

  await supabase.from('discovery_runs').update(updateData).eq('id', runId);
}

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

  // Create run record with initial progress
  const { data: runRecord, error: runError } = await supabase
    .from('discovery_runs')
    .insert({
      category,
      status: 'running',
      run_config: runConfig,
      current_phase: 'starting',
      phase_progress: 0,
      last_progress_update: new Date().toISOString(),
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
    // Phase 1: Research (Searching)
    // ========================================
    await updateProgress(runId, 'searching', 0, supabase);
    console.log(`[Discovery] Phase 1: Research...`);
    const researchResults = await runResearch(category, runConfig, supabase);

    // Update progress: extracting phase (saving to database)
    await updateProgress(runId, 'extracting', 50, supabase, {
      sources_found: researchResults.length,
    });

    // Save research to database
    const { sourceIds, productCount } = await saveResearchResults(researchResults, supabase);

    // Update run with research stats
    await updateProgress(runId, 'extracting', 100, supabase, {
      sources_found: researchResults.length,
      sources_processed: sourceIds.length,
      products_found: productCount,
    });

    console.log(
      `[Discovery] Research complete: ${researchResults.length} sources, ${productCount} products`
    );

    // ========================================
    // Phase 2: Curation (if not dry run)
    // ========================================
    let bags: CuratedBag[] = [];
    const bagIds: string[] = [];

    if (!runConfig.dryRun && researchResults.length > 0) {
      // Update progress: enriching phase
      await updateProgress(runId, 'enriching', 0, supabase);
      console.log(`[Discovery] Phase 2: Curation...`);

      // Get @teed user
      const teedUserId = await getTeedUserId(supabase);
      if (!teedUserId) {
        throw new Error('@teed user not found');
      }

      // Curate results into bags
      await updateProgress(runId, 'enriching', 30, supabase);
      bags = await curateResearchResults(researchResults, category);

      // Update progress: creating_bags phase
      await updateProgress(runId, 'creating_bags', 0, supabase);

      // Create bags in database
      for (let i = 0; i < bags.length; i++) {
        const bag = bags[i];
        const bagId = await createBagInDatabase(bag, teedUserId, supabase);
        if (bagId) {
          bagIds.push(bagId);
        }
        // Update progress within creating_bags phase
        const progress = Math.round(((i + 1) / bags.length) * 100);
        await updateProgress(runId, 'creating_bags', progress, supabase, {
          bags_created: bagIds.length,
        });
      }

      console.log(`[Discovery] Curation complete: ${bagIds.length} bags created`);
    } else if (runConfig.dryRun) {
      console.log(`[Discovery] Dry run - skipping bag creation`);
    }

    // ========================================
    // Phase 3: Gap Analysis
    // ========================================
    await updateProgress(runId, 'gap_analysis', 0, supabase);
    console.log(`[Discovery] Phase 3: Gap Analysis...`);

    // Record gaps for products that weren't matched to catalog
    const totalProducts = researchResults.reduce((sum, r) => sum + r.products.length, 0);
    let processedProducts = 0;

    for (const result of researchResults) {
      for (const product of result.products) {
        // Products with low confidence or no catalog match are gaps
        if (product.confidence < 70) {
          await recordProductGap(product, result.sourceUrl, category, supabase);
        }
        processedProducts++;
      }
      // Update progress periodically (per source)
      const progress = Math.round((processedProducts / Math.max(1, totalProducts)) * 80);
      await updateProgress(runId, 'gap_analysis', progress, supabase);
    }

    const gapReport = await analyzeGaps(category, supabase);
    await updateProgress(runId, 'gap_analysis', 100, supabase);
    console.log(`[Discovery] Gap analysis: ${gapReport.totalGaps} unresolved gaps`);

    // ========================================
    // Complete Run
    // ========================================
    await supabase
      .from('discovery_runs')
      .update({
        status: 'completed',
        current_phase: 'completed',
        phase_progress: 100,
        bags_created: bagIds.length,
        bag_ids: bagIds,
        completed_at: new Date().toISOString(),
        last_progress_update: new Date().toISOString(),
      })
      .eq('id', runId);

    const run = await getRunStatus(runId, supabase);

    return {
      run: run!,
      bags,
      gapReport,
    };
  } catch (error) {
    // Mark run as failed with phase info
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    await supabase
      .from('discovery_runs')
      .update({
        status: 'failed',
        current_phase: 'failed',
        phase_progress: 0,
        completed_at: new Date().toISOString(),
        error_message: errorMessage,
        last_progress_update: new Date().toISOString(),
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
    // Progress tracking
    currentPhase: data.current_phase || undefined,
    phaseProgress: data.phase_progress ?? undefined,
    lastProgressUpdate: data.last_progress_update ? new Date(data.last_progress_update) : undefined,
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
    // Progress tracking
    currentPhase: d.current_phase || undefined,
    phaseProgress: d.phase_progress ?? undefined,
    lastProgressUpdate: d.last_progress_update ? new Date(d.last_progress_update) : undefined,
  }));
}

// ============================================================================
// Convenience Exports
// ============================================================================

export { isValidCategory, getCategoryConfig, getAllCategories } from './config';
export { analyzeGaps, getGapStatistics } from './agents/gapAnalysisAgent';
export type {
  DiscoveryCategory,
  DiscoveryPhase,
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
