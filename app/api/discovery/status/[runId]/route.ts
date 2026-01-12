/**
 * Discovery Status API
 *
 * Check the status of a discovery run.
 * GET /api/discovery/status/[runId]
 */

import { NextResponse } from 'next/server';
import { getDiscoveryRunStatus } from '@/lib/discovery';

export async function GET(request: Request, { params }: { params: Promise<{ runId: string }> }) {
  try {
    const { runId } = await params;

    if (!runId) {
      return NextResponse.json({ error: 'Run ID is required' }, { status: 400 });
    }

    const run = await getDiscoveryRunStatus(runId);

    if (!run) {
      return NextResponse.json({ error: 'Run not found' }, { status: 404 });
    }

    return NextResponse.json({
      id: run.id,
      category: run.category,
      status: run.status,
      sourcesFound: run.sourcesFound,
      sourcesProcessed: run.sourcesProcessed,
      productsFound: run.productsFound,
      bagsCreated: run.bagsCreated,
      bagIds: run.bagIds,
      startedAt: run.startedAt,
      completedAt: run.completedAt,
      errorMessage: run.errorMessage,
    });
  } catch (error) {
    console.error('[Discovery Status API] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
