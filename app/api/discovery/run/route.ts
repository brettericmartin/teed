/**
 * Discovery Run API
 *
 * Triggers a discovery run for a specific category.
 * POST /api/discovery/run
 */

import { NextResponse } from 'next/server';
import { runDiscovery, isValidCategory, getAllCategories } from '@/lib/discovery';
import type { DiscoveryCategory, DiscoveryRunConfig } from '@/lib/discovery';

export const maxDuration = 300; // 5 minutes max for edge functions

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, config } = body as {
      category: string;
      config?: Partial<DiscoveryRunConfig>;
    };

    // Validate category
    if (!category) {
      return NextResponse.json(
        { error: 'Category is required', validCategories: getAllCategories() },
        { status: 400 }
      );
    }

    if (!isValidCategory(category)) {
      return NextResponse.json(
        { error: `Invalid category: ${category}`, validCategories: getAllCategories() },
        { status: 400 }
      );
    }

    // Validate API keys
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json({ error: 'OPENAI_API_KEY not configured' }, { status: 500 });
    }

    if (!process.env.YOUTUBE_API_KEY) {
      return NextResponse.json({ error: 'YOUTUBE_API_KEY not configured' }, { status: 500 });
    }

    console.log(`[Discovery API] Starting run for ${category}`);

    // Run discovery
    const result = await runDiscovery(category as DiscoveryCategory, config);

    return NextResponse.json({
      success: true,
      runId: result.run.id,
      category: result.run.category,
      status: result.run.status,
      sourcesFound: result.run.sourcesFound,
      productsFound: result.run.productsFound,
      bagsCreated: result.run.bagsCreated,
      bags: result.bags.map((b) => ({
        title: b.title,
        itemCount: b.items.length,
        theme: b.theme,
      })),
      gapReport: {
        totalGaps: result.gapReport.totalGaps,
        recommendations: result.gapReport.recommendations,
      },
    });
  } catch (error) {
    console.error('[Discovery API] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  // Return available categories
  return NextResponse.json({
    availableCategories: getAllCategories(),
    usage: {
      method: 'POST',
      body: {
        category: 'string (required)',
        config: {
          maxSources: 'number (default: 10)',
          maxProductsPerSource: 'number (default: 15)',
          dryRun: 'boolean (default: false)',
          skipExisting: 'boolean (default: true)',
          youtubeEnabled: 'boolean (default: true)',
          tiktokEnabled: 'boolean (default: true)',
          rssEnabled: 'boolean (default: true)',
        },
      },
    },
  });
}
