import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import { identifyItemsInPhoto, toIdentifiedProductCompat } from '@/lib/visionPipeline';
import { trackApiUsage } from '@/lib/apiUsageTracker';
import type { PipelineOptions } from '@/lib/visionPipeline';

export const maxDuration = 120; // 2 minutes for full 4-stage pipeline

export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    // Auth check (cookie-based, consistent with other API routes)
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
    }

    const body = await request.json();
    const { image, options } = body as {
      image: string;
      options?: PipelineOptions;
    };

    if (!image) {
      return NextResponse.json({ error: 'Image is required' }, { status: 400 });
    }

    // Validate image size (base64 → ~75% of string length in bytes)
    const imageSizeKB = Math.round((image.length * 3) / 4 / 1024);
    if (imageSizeKB > 10240) {
      return NextResponse.json(
        { error: 'Image too large. Maximum size is 10MB.' },
        { status: 400 }
      );
    }

    console.log(`[identify-photo] Starting pipeline for user ${user.id}, image size: ${imageSizeKB}KB`);

    // Run the pipeline
    const result = await identifyItemsInPhoto(image, options);

    // Map to backward-compatible format
    const compatProducts = result.items.map(toIdentifiedProductCompat);

    const durationMs = Date.now() - startTime;

    // Track API usage (non-blocking)
    trackApiUsage({
      userId: user.id,
      endpoint: '/api/ai/identify-photo',
      model: 'gemini-2.5-flash+gpt-4o',
      operationType: 'identify',
      durationMs,
      status: 'success',
      inputTokens: result.stats.totalDetected * 1500 + 2000, // Estimate
      outputTokens: result.stats.totalDetected * 500,
    }).catch(console.error);

    return NextResponse.json({
      products: compatProducts,
      pipeline: {
        totalDetected: result.stats.totalDetected,
        totalIdentified: result.stats.totalIdentified,
        totalVerified: result.stats.totalVerified,
        stageTimings: result.stats.stageTimings,
        partial: result.stats.partial,
      },
      totalConfidence: compatProducts.length > 0
        ? Math.round(compatProducts.reduce((sum, p) => sum + p.confidence, 0) / compatProducts.length)
        : 0,
      processingTime: durationMs,
    });
  } catch (error: any) {
    const durationMs = Date.now() - startTime;
    console.error('[identify-photo] Pipeline error:', error);

    // Track error
    trackApiUsage({
      userId: null,
      endpoint: '/api/ai/identify-photo',
      model: 'gemini-2.5-flash+gpt-4o',
      operationType: 'identify',
      durationMs,
      status: 'error',
      errorMessage: error.message,
    }).catch(console.error);

    return NextResponse.json(
      { error: error.message || 'Failed to identify products in photo' },
      { status: 500 }
    );
  }
}
