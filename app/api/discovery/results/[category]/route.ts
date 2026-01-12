/**
 * Discovery Results API
 *
 * Get recent discovery results for a category.
 * GET /api/discovery/results/[category]
 */

import { NextResponse } from 'next/server';
import { getRecentRuns, isValidCategory, getAllCategories, getGapStatistics } from '@/lib/discovery';
import type { DiscoveryCategory } from '@/lib/discovery';
import { createClient } from '@supabase/supabase-js';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ category: string }> }
) {
  try {
    const { category } = await params;

    // Special case: "all" returns runs for all categories
    const isAll = category === 'all';

    if (!isAll && !isValidCategory(category)) {
      return NextResponse.json(
        { error: `Invalid category: ${category}`, validCategories: getAllCategories() },
        { status: 400 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const includeGaps = searchParams.get('includeGaps') === 'true';

    // Get recent runs
    const runs = await getRecentRuns(isAll ? undefined : (category as DiscoveryCategory), limit);

    // Get gap statistics if requested
    let gapStats = null;
    if (includeGaps) {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
      );
      gapStats = await getGapStatistics(
        supabase,
        isAll ? undefined : (category as DiscoveryCategory)
      );
    }

    return NextResponse.json({
      category: isAll ? 'all' : category,
      runs: runs.map((run) => ({
        id: run.id,
        category: run.category,
        status: run.status,
        sourcesFound: run.sourcesFound,
        sourcesProcessed: run.sourcesProcessed,
        productsFound: run.productsFound,
        bagsCreated: run.bagsCreated,
        bagIds: run.bagIds || [],
        startedAt: run.startedAt,
        completedAt: run.completedAt,
        errorMessage: run.errorMessage,
      })),
      gapStatistics: gapStats,
    });
  } catch (error) {
    console.error('[Discovery Results API] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
