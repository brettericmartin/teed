/**
 * Unified Product Extraction API
 * Extracts products from all sources (description, transcript, video frames)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAdminApi } from '@/lib/withAdmin';
import { logAdminAction } from '@/lib/adminAuth';
import { extractProductsFromAllSources } from '@/lib/contentIdeas/unifiedExtraction';
import { buildYouTubeUrl } from '@/lib/contentIdeas/youtube';
import type { ContentIdea, ContentVertical } from '@/lib/types/contentIdeas';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

interface RouteParams {
  params: Promise<{ id: string }>;
}

/**
 * POST /api/admin/content-ideas/[id]/extract
 * Run unified product extraction from all sources
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await withAdminApi('moderator');
    if ('error' in authResult) {
      return authResult.error;
    }
    const { admin } = authResult;

    const { id } = await params;

    // Get options from request body
    const body = await request.json().catch(() => ({}));
    const {
      includeTranscript = true,
      includeFrames = true,
      maxFrames = 5,
    } = body;

    // Fetch the content idea
    const { data: contentIdea, error: fetchError } = await supabaseAdmin
      .from('content_ideas')
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !contentIdea) {
      return NextResponse.json({ error: 'Content idea not found' }, { status: 404 });
    }

    const idea = contentIdea as ContentIdea;

    // Validate we have a YouTube video
    if (idea.source_platform !== 'youtube' || !idea.source_metadata?.youtube?.videoId) {
      return NextResponse.json(
        { error: 'This endpoint only supports YouTube videos' },
        { status: 400 }
      );
    }

    const videoId = idea.source_metadata.youtube.videoId;
    const videoUrl = buildYouTubeUrl(videoId);
    const videoTitle = idea.source_metadata.youtube.title || idea.idea_title || '';
    const videoDescription = idea.source_metadata.youtube.description || '';
    const extractedLinks = idea.source_metadata.extractedLinks || [];

    console.log(`[Extract] Starting unified extraction for content idea ${id}`);
    console.log(`[Extract] Options: transcript=${includeTranscript}, frames=${includeFrames}`);

    // Get the base URL for API calls
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ||
                    `${request.nextUrl.protocol}//${request.nextUrl.host}`;

    // Run unified extraction
    const extractionResult = await extractProductsFromAllSources(
      videoUrl,
      videoTitle,
      videoDescription,
      idea.vertical as ContentVertical,
      extractedLinks.map(l => ({ url: l.url, label: l.label })),
      {
        includeTranscript,
        includeFrames,
        maxFrames,
        fetchFramesAsBase64: false, // Use URLs for now
        baseUrl,
      }
    );

    console.log(`[Extract] Extraction complete: ${extractionResult.products.length} products`);
    console.log(`[Extract] Content type: ${extractionResult.contentType}`);
    console.log(`[Extract] Sources used: description=${extractionResult.extractionSources.description}, transcript=${extractionResult.extractionSources.transcript}, frames=${extractionResult.extractionSources.frames}`);

    // Update the content idea with extracted products
    const { error: updateError } = await supabaseAdmin
      .from('content_ideas')
      .update({
        extracted_products: extractionResult.products,
        extraction_metadata: {
          contentType: extractionResult.contentType,
          contentTypeSignals: extractionResult.contentTypeSignals,
          extractionSources: extractionResult.extractionSources,
          transcriptAvailable: extractionResult.transcriptAvailable,
          framesAnalyzed: extractionResult.framesAnalyzed,
          extractedAt: new Date().toISOString(),
        },
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (updateError) {
      console.error('[Extract] Failed to update content idea:', updateError);
      return NextResponse.json(
        { error: 'Failed to save extraction results' },
        { status: 500 }
      );
    }

    // Log admin action
    await logAdminAction(
      admin,
      'settings.update',
      'content_ideas',
      id,
      {
        subAction: 'extract_products',
        productCount: extractionResult.products.length,
        contentType: extractionResult.contentType,
        sources: extractionResult.extractionSources,
      }
    );

    return NextResponse.json({
      success: true,
      extraction: {
        products: extractionResult.products,
        productCount: extractionResult.products.length,
        contentType: extractionResult.contentType,
        contentTypeSignals: extractionResult.contentTypeSignals,
        sources: extractionResult.extractionSources,
        transcriptAvailable: extractionResult.transcriptAvailable,
        framesAnalyzed: extractionResult.framesAnalyzed,
      },
      rawData: {
        descriptionProductCount: extractionResult.rawData.descriptionProducts.length,
        transcriptMentionCount: extractionResult.rawData.transcriptMentions.length,
        frameDetectionCount: extractionResult.rawData.frameDetections.length,
      },
    });
  } catch (error) {
    console.error('[Extract] Extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to extract products' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/content-ideas/[id]/extract
 * Get the current extraction status/results
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const authResult = await withAdminApi('moderator');
    if ('error' in authResult) {
      return authResult.error;
    }

    const { id } = await params;

    const { data: contentIdea, error } = await supabaseAdmin
      .from('content_ideas')
      .select('id, extracted_products, extraction_metadata')
      .eq('id', id)
      .single();

    if (error || !contentIdea) {
      return NextResponse.json({ error: 'Content idea not found' }, { status: 404 });
    }

    const hasExtraction = contentIdea.extracted_products &&
                          Array.isArray(contentIdea.extracted_products) &&
                          contentIdea.extracted_products.length > 0;

    return NextResponse.json({
      hasExtraction,
      productCount: hasExtraction ? contentIdea.extracted_products.length : 0,
      extractionMetadata: contentIdea.extraction_metadata || null,
      products: contentIdea.extracted_products || [],
    });
  } catch (error) {
    console.error('[Extract] Get extraction error:', error);
    return NextResponse.json(
      { error: 'Failed to get extraction status' },
      { status: 500 }
    );
  }
}
