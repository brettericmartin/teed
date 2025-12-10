import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAdminApi } from '@/lib/withAdmin';
import { logAdminAction } from '@/lib/adminAuth';
import {
  extractProductsFromVideo,
  generateIdeaFromSource,
  generateHooksAndLongForm,
  generateShortFormFromLongForm,
} from '@/lib/contentIdeas/generation';
import type {
  ContentIdea,
  ContentVertical,
  GenerateContentRequest,
  GenerateContentResponse,
  ExtractedProduct,
} from '@/lib/types/contentIdeas';

// Use service role for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * POST /api/admin/content-ideas/generate
 * Stage 3: Full Generation - Run LLM pipeline on selected ideas
 * This is where the expensive AI calls happen
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const authResult = await withAdminApi('admin');
    if ('error' in authResult) {
      return authResult.error;
    }
    const { admin } = authResult;

    // Parse request body
    const body: GenerateContentRequest = await request.json();

    if (!body.ideaIds || !Array.isArray(body.ideaIds) || body.ideaIds.length === 0) {
      return NextResponse.json({ error: 'ideaIds array is required' }, { status: 400 });
    }

    // Limit batch size to prevent timeout
    if (body.ideaIds.length > 5) {
      return NextResponse.json(
        { error: 'Maximum 5 ideas can be generated at once' },
        { status: 400 }
      );
    }

    const { ideaIds, options = {} } = body;
    const {
      skipProductExtraction = false,
      skipHooks = false,
      skipLongForm = false,
      skipShortForm = false,
    } = options;

    // Fetch the selected ideas
    const { data: ideas, error: fetchError } = await supabaseAdmin
      .from('content_ideas')
      .select('*')
      .in('id', ideaIds)
      .eq('status', 'selected');

    if (fetchError) {
      console.error('[Generate] Fetch error:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch ideas' }, { status: 500 });
    }

    if (!ideas || ideas.length === 0) {
      return NextResponse.json(
        { error: 'No selected ideas found with the given IDs' },
        { status: 400 }
      );
    }

    // Initialize response
    const response: GenerateContentResponse = {
      success: true,
      generated: 0,
      failed: 0,
      results: [],
    };

    // Process each idea
    for (const idea of ideas as ContentIdea[]) {
      console.log(`[Generate] Processing: ${idea.id}`);

      try {
        // Mark as generating
        await supabaseAdmin
          .from('content_ideas')
          .update({ status: 'generating' })
          .eq('id', idea.id);

        const youtube = idea.source_metadata?.youtube;
        const videoTitle = youtube?.title || '';
        const videoDescription = youtube?.description || '';
        const creatorName = idea.source_channel_name || 'Unknown Creator';
        const vertical = (idea.vertical || 'other') as ContentVertical;

        // Step 1: Extract products (LLM call)
        let products: ExtractedProduct[] = idea.extracted_products || [];
        if (!skipProductExtraction) {
          console.log(`[Generate] Extracting products for ${idea.id}...`);
          products = await extractProductsFromVideo(
            videoTitle,
            videoDescription,
            vertical,
            idea.source_metadata?.extractedLinks?.map(l => ({ url: l.url, label: l.label })) || []
          );
        }

        // Step 2: Generate idea content (LLM call)
        console.log(`[Generate] Generating idea for ${idea.id}...`);
        const ideaOutput = await generateIdeaFromSource(
          videoTitle,
          videoDescription,
          creatorName,
          vertical,
          products,
          idea.has_creator_affiliate
        );

        // Build partial idea for hooks generation
        const partialIdea: ContentIdea = {
          ...idea,
          idea_title: ideaOutput.idea_title,
          idea_summary: ideaOutput.idea_summary,
          why_interesting_to_creator: ideaOutput.why_interesting_to_creator,
          why_interesting_to_audience: ideaOutput.why_interesting_to_audience,
          tags: ideaOutput.tags,
        };

        // Get hero products
        const heroProducts = products
          .filter(p => p.isHeroCandidate)
          .sort((a, b) => (b.heroScore || 0) - (a.heroScore || 0))
          .slice(0, 3);

        // Step 3: Generate hooks and long-form outline (LLM call)
        let hooksOutput: any = { hook_options: [], long_form_outline: null };
        if (!skipHooks || !skipLongForm) {
          console.log(`[Generate] Generating hooks for ${idea.id}...`);
          hooksOutput = await generateHooksAndLongForm(partialIdea, heroProducts);
        }

        // Step 4: Generate short-form ideas (LLM call)
        let shortFormOutput = { short_form_ideas: [] as any[] };
        if (!skipShortForm && hooksOutput.long_form_outline) {
          console.log(`[Generate] Generating short-form for ${idea.id}...`);
          shortFormOutput = await generateShortFormFromLongForm(
            hooksOutput.long_form_outline,
            heroProducts,
            vertical
          );
        }

        // Update the idea with generated content
        const { error: updateError } = await supabaseAdmin
          .from('content_ideas')
          .update({
            status: 'generated',
            generated_at: new Date().toISOString(),
            // LLM-generated content
            idea_title: ideaOutput.idea_title,
            idea_summary: ideaOutput.idea_summary,
            why_interesting_to_creator: ideaOutput.why_interesting_to_creator,
            why_interesting_to_audience: ideaOutput.why_interesting_to_audience,
            tags: ideaOutput.tags,
            affiliate_notes: ideaOutput.affiliate_notes,
            // Content assets
            extracted_products: products,
            hook_options: skipHooks ? [] : hooksOutput.hook_options,
            long_form_outline: skipLongForm ? null : hooksOutput.long_form_outline,
            short_form_ideas: skipShortForm ? [] : shortFormOutput.short_form_ideas,
          })
          .eq('id', idea.id);

        if (updateError) {
          throw new Error(`Update failed: ${updateError.message}`);
        }

        response.generated++;
        response.results.push({ ideaId: idea.id, success: true });
        console.log(`[Generate] Success: ${idea.id}`);

        // Delay between ideas to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
      } catch (ideaError) {
        console.error(`[Generate] Error for ${idea.id}:`, ideaError);

        // Mark as failed (revert to selected so it can be retried)
        await supabaseAdmin
          .from('content_ideas')
          .update({ status: 'selected' })
          .eq('id', idea.id);

        response.failed++;
        response.results.push({
          ideaId: idea.id,
          success: false,
          error: ideaError instanceof Error ? ideaError.message : 'Unknown error',
        });
      }
    }

    response.success = response.failed === 0;

    // Log admin action
    await logAdminAction(admin, 'system.migration', 'content_ideas', null, {
      action: 'generate_content',
      idea_count: ideaIds.length,
      generated: response.generated,
      failed: response.failed,
    });

    console.log(`[Generate] Complete: ${response.generated} generated, ${response.failed} failed`);
    return NextResponse.json(response);
  } catch (error) {
    console.error('[Generate] Fatal error:', error);
    return NextResponse.json(
      { error: 'Generation failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/admin/content-ideas/generate
 * Get ideas ready for generation (selected status)
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const authResult = await withAdminApi('moderator');
    if ('error' in authResult) {
      return authResult.error;
    }

    // Get selected ideas awaiting generation
    const { data: ideas, error } = await supabaseAdmin
      .from('content_ideas')
      .select(`
        id,
        source_platform,
        source_url,
        source_channel_name,
        source_published_at,
        source_metadata,
        vertical,
        has_creator_affiliate,
        extracted_products,
        screened_at,
        screening_notes
      `)
      .eq('status', 'selected')
      .order('screened_at', { ascending: false })
      .limit(20);

    if (error) {
      console.error('[Generate] Query error:', error);
      return NextResponse.json({ error: 'Failed to fetch ideas' }, { status: 500 });
    }

    // Get count of already generated
    const { count: generatedCount } = await supabaseAdmin
      .from('content_ideas')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'generated');

    // Get count currently generating
    const { count: generatingCount } = await supabaseAdmin
      .from('content_ideas')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'generating');

    return NextResponse.json({
      ideas: ideas || [],
      selectedCount: ideas?.length || 0,
      generatedCount: generatedCount || 0,
      generatingCount: generatingCount || 0,
    });
  } catch (error) {
    console.error('[Generate] GET error:', error);
    return NextResponse.json({ error: 'Failed to get generation queue' }, { status: 500 });
  }
}
