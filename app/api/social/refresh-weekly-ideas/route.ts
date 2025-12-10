import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAdminApi } from '@/lib/withAdmin';
import { logAdminAction } from '@/lib/adminAuth';
import {
  searchVideosForVertical,
  transformToSourceMetadata,
  buildYouTubeUrl,
  scoreVideoRelevance,
  runFullGenerationPipeline,
} from '@/lib/contentIdeas';
import type {
  ContentVertical,
  RefreshWeeklyIdeasRequest,
  RefreshWeeklyIdeasResponse,
} from '@/lib/types/contentIdeas';

// Use service role for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Default verticals to process
const DEFAULT_VERTICALS: ContentVertical[] = ['golf', 'camera', 'desk'];

/**
 * POST /api/social/refresh-weekly-ideas
 * Fetches recent YouTube videos and generates content ideas
 * Admin-only endpoint
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
    let body: RefreshWeeklyIdeasRequest;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const {
      verticals = DEFAULT_VERTICALS,
      maxVideosPerVertical = 10,
      daysBack = 7,
      skipExisting = true,
    } = body;

    // Initialize response tracking
    const response: RefreshWeeklyIdeasResponse = {
      success: true,
      videosProcessed: 0,
      ideasCreated: 0,
      ideasUpdated: 0,
      errors: [],
      byVertical: {} as Record<ContentVertical, { videosFound: number; ideasCreated: number }>,
    };

    // Process each vertical
    for (const vertical of verticals) {
      console.log(`Processing vertical: ${vertical}`);
      response.byVertical[vertical] = { videosFound: 0, ideasCreated: 0 };

      try {
        // Search YouTube for videos
        const videos = await searchVideosForVertical(vertical, {
          maxVideosTotal: maxVideosPerVertical,
          daysBack,
        });

        response.byVertical[vertical].videosFound = videos.length;
        console.log(`Found ${videos.length} videos for ${vertical}`);

        // Process each video
        for (const video of videos) {
          const videoUrl = buildYouTubeUrl(video.id);

          try {
            // Check if video already exists
            if (skipExisting) {
              const { data: existing } = await supabaseAdmin
                .from('content_ideas')
                .select('id')
                .eq('source_url', videoUrl)
                .single();

              if (existing) {
                console.log(`Skipping existing video: ${video.snippet.title}`);
                continue;
              }
            }

            // Score video relevance
            const relevanceScore = scoreVideoRelevance(video, vertical);
            if (relevanceScore < 30) {
              console.log(`Skipping low relevance video (${relevanceScore}): ${video.snippet.title}`);
              continue;
            }

            response.videosProcessed++;

            // Transform metadata
            const sourceMetadata = transformToSourceMetadata(video);
            const hasCreatorAffiliate = sourceMetadata.extractedLinks?.some(l => l.isAffiliate) || false;

            // Run full generation pipeline
            console.log(`Generating idea for: ${video.snippet.title}`);
            const generationResult = await runFullGenerationPipeline(
              video.snippet.title,
              video.snippet.description,
              video.snippet.channelTitle,
              vertical,
              sourceMetadata.extractedLinks || [],
              hasCreatorAffiliate
            );

            // Insert content idea
            const { data: newIdea, error: insertError } = await supabaseAdmin
              .from('content_ideas')
              .insert({
                source_platform: 'youtube',
                source_url: videoUrl,
                source_channel_name: video.snippet.channelTitle,
                source_creator_handle: null,
                source_published_at: video.snippet.publishedAt,
                source_metadata: sourceMetadata,
                vertical,
                idea_title: generationResult.ideaOutput.idea_title,
                idea_summary: generationResult.ideaOutput.idea_summary,
                why_interesting_to_creator: generationResult.ideaOutput.why_interesting_to_creator,
                why_interesting_to_audience: generationResult.ideaOutput.why_interesting_to_audience,
                hook_options: generationResult.hooksOutput.hook_options,
                long_form_outline: generationResult.hooksOutput.long_form_outline,
                short_form_ideas: generationResult.shortFormOutput.short_form_ideas,
                tags: generationResult.ideaOutput.tags,
                affiliate_notes: generationResult.ideaOutput.affiliate_notes,
                has_creator_affiliate: hasCreatorAffiliate,
                status: 'new',
              })
              .select('id')
              .single();

            if (insertError) {
              console.error(`Failed to insert idea for ${videoUrl}:`, insertError);
              response.errors.push({ videoUrl, error: insertError.message });
            } else {
              response.ideasCreated++;
              response.byVertical[vertical].ideasCreated++;

              // Insert links for extracted URLs
              if (sourceMetadata.extractedLinks && sourceMetadata.extractedLinks.length > 0) {
                const linkInserts = sourceMetadata.extractedLinks.slice(0, 20).map(link => ({
                  kind: link.isAffiliate ? 'creator_affiliate' : 'external_product',
                  url: link.url,
                  label: link.label || link.productHint || null,
                  metadata: {
                    source: 'youtube_description',
                    content_idea_id: newIdea?.id,
                    is_affiliate: link.isAffiliate,
                    affiliate_type: link.affiliateType || null,
                    domain: link.domain,
                  },
                  is_auto_generated: true,
                }));

                // Note: We're not associating these links to a bag yet
                // That will happen when an admin creates a bag from the idea
                await supabaseAdmin.from('links').insert(linkInserts);
              }

              console.log(`Created idea: ${generationResult.ideaOutput.idea_title}`);
            }

            // Rate limiting between videos
            await new Promise(resolve => setTimeout(resolve, 2000));
          } catch (videoError) {
            console.error(`Error processing video ${videoUrl}:`, videoError);
            response.errors.push({
              videoUrl,
              error: videoError instanceof Error ? videoError.message : 'Unknown error',
            });
          }
        }
      } catch (verticalError) {
        console.error(`Error processing vertical ${vertical}:`, verticalError);
        response.errors.push({
          videoUrl: `[vertical:${vertical}]`,
          error: verticalError instanceof Error ? verticalError.message : 'Unknown error',
        });
      }
    }

    // Log admin action
    await logAdminAction(admin, 'system.migration', 'content_ideas', null, {
      action: 'refresh_weekly_ideas',
      verticals,
      videosProcessed: response.videosProcessed,
      ideasCreated: response.ideasCreated,
      errors: response.errors.length,
    });

    return NextResponse.json(response);
  } catch (error) {
    console.error('Refresh weekly ideas error:', error);
    return NextResponse.json(
      { error: 'Failed to refresh ideas', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/social/refresh-weekly-ideas
 * Returns status of content ideas system
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const authResult = await withAdminApi('moderator');
    if ('error' in authResult) {
      return authResult.error;
    }

    // Get counts by status
    const { data: statusCounts } = await supabaseAdmin.rpc('count_content_ideas_by_status');

    // Get counts by vertical
    const { data: verticalCounts } = await supabaseAdmin
      .from('content_ideas')
      .select('vertical')
      .then(res => {
        const counts: Record<string, number> = {};
        res.data?.forEach(row => {
          const v = row.vertical || 'unknown';
          counts[v] = (counts[v] || 0) + 1;
        });
        return { data: counts };
      });

    // Get recent ideas
    const { data: recentIdeas } = await supabaseAdmin
      .from('content_ideas')
      .select('id, idea_title, vertical, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    // Check if YouTube API key is configured
    const hasYouTubeKey = !!process.env.YOUTUBE_API_KEY;

    return NextResponse.json({
      status: 'operational',
      hasYouTubeKey,
      counts: {
        byStatus: statusCounts || [],
        byVertical: verticalCounts || {},
      },
      recentIdeas: recentIdeas || [],
      supportedVerticals: DEFAULT_VERTICALS,
    });
  } catch (error) {
    console.error('Get status error:', error);
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
  }
}
