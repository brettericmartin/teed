/**
 * Team Generation API Endpoint
 * POST /api/admin/content-ideas/[id]/team-generate
 *
 * Streams real-time progress as the AI content team generates content.
 * Uses Server-Sent Events (SSE) for live updates.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAdminApi } from '@/lib/withAdmin';
import { runTeamGeneration, type BagData } from '@/lib/contentIdeas/agents/orchestrator';
import type { StreamEvent, TeamGenerationOutput } from '@/lib/types/teamGeneration';
import type { ContentIdea, ExtractedProduct } from '@/lib/types/contentIdeas';

// Initialize Supabase client with service role for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300; // 5 minutes max for team generation

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function POST(request: NextRequest, context: RouteParams) {
  // Verify admin authentication using standard pattern
  const authResult = await withAdminApi('moderator');
  if ('error' in authResult) {
    return authResult.error;
  }

  const { id } = await context.params;

  // Check for apply action
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'apply') {
    return handleApplyRecommendations(request, id);
  }

  // Parse request body for feedback
  let feedback: string | undefined;
  try {
    const body = await request.json();
    feedback = body.feedback;
  } catch {
    // No body or invalid JSON - that's fine
  }

  // Fetch content idea
  const { data: contentIdea, error: ideaError } = await supabase
    .from('content_ideas')
    .select('*')
    .eq('id', id)
    .single();

  if (ideaError || !contentIdea) {
    return NextResponse.json({ error: 'Content idea not found' }, { status: 404 });
  }

  // Check if already running
  const { data: existingRun } = await supabase
    .from('team_generations')
    .select('id, status')
    .eq('content_idea_id', id)
    .eq('status', 'running')
    .single();

  if (existingRun) {
    return NextResponse.json(
      { error: 'Generation already in progress', generationId: existingRun.id },
      { status: 409 }
    );
  }

  // Get products from content idea
  const products: ExtractedProduct[] = contentIdea.extracted_products || [];

  // Fetch linked bag if exists
  let bag: BagData | undefined;
  if (contentIdea.primary_bag_id) {
    const { data: bagData } = await supabase
      .from('bags')
      .select(`
        id,
        code,
        name,
        cover_image_url,
        items:bag_items(
          id,
          name,
          brand,
          description,
          photo_url,
          category_name,
          display_order,
          links:bag_item_links(url, label, source_type)
        )
      `)
      .eq('id', contentIdea.primary_bag_id)
      .single();

    if (bagData) {
      bag = {
        id: bagData.id,
        code: bagData.code,
        name: bagData.name,
        coverImageUrl: bagData.cover_image_url,
        items: (bagData.items || []).map((item: {
          id: string;
          name: string;
          brand?: string;
          description?: string;
          photo_url?: string;
          category_name?: string;
          display_order: number;
          links?: { url: string; label?: string; source_type?: string }[];
        }) => ({
          id: item.id,
          name: item.name,
          brand: item.brand,
          description: item.description,
          photo_url: item.photo_url,
          category_name: item.category_name,
          display_order: item.display_order,
          links: item.links,
        })),
      };
    }
  }

  // Create generation record
  const { data: generation, error: createError } = await supabase
    .from('team_generations')
    .insert({
      content_idea_id: id,
      status: 'running',
      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (createError || !generation) {
    return NextResponse.json({ error: 'Failed to create generation record' }, { status: 500 });
  }

  // Create streaming response
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (event: StreamEvent) => {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(data));
      };

      try {
        // Run team generation with progress callback
        const result = await runTeamGeneration(
          contentIdea as ContentIdea,
          products,
          bag,
          {
            feedback,
            onProgress: async (event: StreamEvent) => {
              sendEvent(event);

              // Update generation record with progress
              if (event.type === 'wave_complete') {
                const waveKey = `wave${event.wave}_output` as const;
                await supabase
                  .from('team_generations')
                  .update({
                    current_wave: event.wave,
                    progress_percent: event.progress,
                  })
                  .eq('id', generation.id);
              }
            },
          }
        );

        if (result.success && result.output) {
          // Save final output to database
          await supabase
            .from('team_generations')
            .update({
              status: 'completed',
              wave1_output: result.wave1Output,
              wave2_output: result.wave2Output,
              wave3_output: result.wave3Output,
              final_output: result.output,
              token_usage: result.tokenUsage,
              progress_percent: 100,
              completed_at: new Date().toISOString(),
            })
            .eq('id', generation.id);

          // Update content idea with team-generated content
          await supabase
            .from('content_ideas')
            .update({
              team_hooks: result.output.topHooks,
              team_platform_content: result.output.platformContent,
              team_bag_qa: result.output.bagQA,
              team_generated_at: new Date().toISOString(),
              team_generation_id: generation.id,
            })
            .eq('id', id);

          sendEvent({
            type: 'final',
            data: result.output,
            progress: 100,
          });
        } else {
          // Generation failed
          await supabase
            .from('team_generations')
            .update({
              status: 'failed',
              error_message: result.error || 'Unknown error',
              completed_at: new Date().toISOString(),
            })
            .eq('id', generation.id);

          sendEvent({
            type: 'error',
            error: result.error || 'Generation failed',
            progress: 0,
          });
        }
      } catch (error) {
        console.error('[TeamGenerate] Fatal error:', error);

        await supabase
          .from('team_generations')
          .update({
            status: 'failed',
            error_message: error instanceof Error ? error.message : 'Unknown error',
            completed_at: new Date().toISOString(),
          })
          .eq('id', generation.id);

        sendEvent({
          type: 'error',
          error: error instanceof Error ? error.message : 'Generation failed',
          progress: 0,
        });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// GET endpoint to retrieve existing generation
export async function GET(request: NextRequest, context: RouteParams) {
  // Verify admin authentication using standard pattern
  const authResult = await withAdminApi('moderator');
  if ('error' in authResult) {
    return authResult.error;
  }

  const { id } = await context.params;

  // Get latest generation for this content idea
  const { data: generation, error } = await supabase
    .from('team_generations')
    .select('*')
    .eq('content_idea_id', id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
    return NextResponse.json({ error: 'Failed to fetch generation' }, { status: 500 });
  }

  return NextResponse.json({ generation: generation || null });
}

// Handle applying team recommendations to content idea
async function handleApplyRecommendations(request: NextRequest, id: string) {
  try {
    const body = await request.json();
    const { output } = body as { output: TeamGenerationOutput };

    if (!output) {
      return NextResponse.json({ error: 'No output provided' }, { status: 400 });
    }

    // Build update object with available fields
    const updates: Record<string, unknown> = {};
    const fieldsUpdated: string[] = [];

    if (output.recommendedTitle) {
      updates.title = output.recommendedTitle;
      fieldsUpdated.push('title');
    }

    if (output.recommendedSummary) {
      updates.one_liner = output.recommendedSummary;
      fieldsUpdated.push('summary');
    }

    if (fieldsUpdated.length === 0) {
      return NextResponse.json({ error: 'No recommendations to apply' }, { status: 400 });
    }

    // Update the content idea
    const { error } = await supabase
      .from('content_ideas')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('[TeamGenerate] Apply error:', error);
      return NextResponse.json({ error: 'Failed to apply recommendations' }, { status: 500 });
    }

    return NextResponse.json({ success: true, fieldsUpdated });
  } catch (error) {
    console.error('[TeamGenerate] Apply error:', error);
    return NextResponse.json({ error: 'Failed to apply recommendations' }, { status: 500 });
  }
}
