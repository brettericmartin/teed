import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAdminApi } from '@/lib/withAdmin';
import { logAdminAction } from '@/lib/adminAuth';
import {
  searchVideosForVertical,
  transformToSourceMetadata,
  buildYouTubeUrl,
  scoreVideoRelevance,
  isLikelySetupVideo,
  meetsQualityThreshold,
} from '@/lib/contentIdeas/youtube';
import type {
  ContentVertical,
  DiscoverVideosRequest,
  DiscoverVideosResponse,
  ExtractedProduct,
} from '@/lib/types/contentIdeas';

// Use service role for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// Default verticals to scan (top 5 most active)
const DEFAULT_VERTICALS: ContentVertical[] = ['golf', 'camera', 'tech', 'gaming', 'desk'];

/**
 * Extract basic product hints from title and description WITHOUT LLM
 * This is a lightweight regex-based extraction for the discovery phase
 */
function extractBasicProductHints(title: string, description: string): ExtractedProduct[] {
  const products: ExtractedProduct[] = [];
  const combined = `${title}\n${description}`;

  // Common brand patterns (expand as needed)
  const brandPatterns = [
    // Golf
    /\b(Titleist|TaylorMade|Callaway|Ping|Cobra|Mizuno|Cleveland|Scotty Cameron|Vokey|Odyssey|Bridgestone)\s+([A-Z0-9][A-Za-z0-9\s\-\.]+)/gi,
    // Camera
    /\b(Sony|Canon|Nikon|Fujifilm|Fuji|Panasonic|Lumix|Leica|GoPro|DJI|Sigma|Tamron|Zeiss)\s+([A-Z0-9][A-Za-z0-9\s\-\.]+)/gi,
    // Tech
    /\b(Apple|MacBook|iPhone|iPad|AirPods|Samsung|Google|Pixel|Dell|ASUS|Logitech|Razer|Anker|Elgato)\s*([A-Za-z0-9\s\-\.]*)/gi,
    // Generic product pattern "Brand Model"
    /\b([A-Z][a-z]+(?:\s[A-Z][a-z]+)?)\s+(Pro|Max|Ultra|Plus|Mini|Air|Studio|SE)?\s*([A-Z0-9][A-Za-z0-9\.\-]*)\b/g,
  ];

  const seenProducts = new Set<string>();

  for (const pattern of brandPatterns) {
    let match;
    while ((match = pattern.exec(combined)) !== null) {
      const brand = match[1].trim();
      const model = (match[2] || '').trim();

      if (model.length < 2) continue;

      const key = `${brand.toLowerCase()}-${model.toLowerCase()}`;
      if (seenProducts.has(key)) continue;
      seenProducts.add(key);

      // Determine if it's likely a "hero" candidate based on context
      const context = combined.slice(
        Math.max(0, match.index - 50),
        Math.min(combined.length, match.index + match[0].length + 50)
      );

      const isHeroCandidate =
        /favorite|love|main|primary|go-to|best|gamer?\s*changer/i.test(context) ||
        title.toLowerCase().includes(brand.toLowerCase());

      products.push({
        name: `${brand} ${model}`.trim(),
        brand,
        isHeroCandidate,
        heroScore: isHeroCandidate ? 60 : 30,
        mentionContext: context.trim(),
      });
    }
  }

  return products.slice(0, 10); // Limit to 10 products per video
}

/**
 * POST /api/social/discover
 * Stage 1: Discovery - Lightweight scan of YouTube videos, NO LLM calls
 * Creates content_ideas with status='discovered'
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
    let body: DiscoverVideosRequest;
    try {
      body = await request.json();
    } catch {
      body = {};
    }

    const {
      verticals = DEFAULT_VERTICALS,
      maxVideosPerVertical = 25, // Fetch more, filter down
      daysBack = 14, // Look back 2 weeks for trending content
      skipExisting = true,
      minViews = 10000, // Minimum 10K views to filter out small channels
    } = body;

    // Initialize response
    const response: DiscoverVideosResponse = {
      success: true,
      videosDiscovered: 0,
      byVertical: {} as Record<ContentVertical, number>,
      errors: [],
    };

    // Fetch dynamic queries from database for all requested verticals
    const { data: dynamicQueriesData } = await supabaseAdmin
      .from('content_search_queries')
      .select('query, vertical, priority')
      .in('vertical', verticals)
      .eq('is_active', true)
      .or('expires_at.is.null,expires_at.gt.now()')
      .or('starts_at.is.null,starts_at.lte.now()');

    // Group queries by vertical
    const queriesByVertical: Record<string, Array<{ query: string; priority: number }>> = {};
    dynamicQueriesData?.forEach(q => {
      if (!queriesByVertical[q.vertical]) queriesByVertical[q.vertical] = [];
      queriesByVertical[q.vertical].push({ query: q.query, priority: q.priority });
    });

    console.log(`[Discovery] Loaded ${dynamicQueriesData?.length || 0} dynamic queries`);

    // Process each vertical
    for (const vertical of verticals) {
      console.log(`[Discovery] Scanning vertical: ${vertical}`);
      response.byVertical[vertical] = 0;

      try {
        // Get dynamic queries for this vertical
        const verticalQueries = queriesByVertical[vertical];

        // Search YouTube for videos (no LLM)
        const videos = await searchVideosForVertical(vertical, {
          dynamicQueries: verticalQueries,
          maxVideosTotal: maxVideosPerVertical,
          daysBack,
        });

        console.log(`[Discovery] Found ${videos.length} videos for ${vertical}`);

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
                console.log(`[Discovery] Skipping existing: ${video.snippet.title}`);
                continue;
              }
            }

            // Check minimum view threshold first
            const views = parseInt(video.statistics?.viewCount || '0', 10);
            if (!meetsQualityThreshold(video, minViews)) {
              console.log(`[Discovery] Skipping low views (${views.toLocaleString()}): ${video.snippet.title}`);
              continue;
            }

            // Score video relevance (no LLM)
            const relevanceScore = scoreVideoRelevance(video, vertical);

            // Check if it's likely a setup/WITB video
            const isSetupVideo = isLikelySetupVideo(video.snippet.title, video.snippet.description);

            // Adjust threshold based on view count
            // High-view videos (100K+) are worth reviewing even if not explicitly gear-focused
            // They might show gear incidentally and are great content opportunities
            let relevanceThreshold = 25;
            if (views > 500000) relevanceThreshold = 15;      // 500K+ = very lenient
            else if (views > 100000) relevanceThreshold = 20; // 100K+ = lenient

            // Skip low relevance videos (unless it's a clear setup video)
            if (relevanceScore < relevanceThreshold && !isSetupVideo) {
              console.log(`[Discovery] Skipping low relevance (${relevanceScore}, ${views.toLocaleString()} views): ${video.snippet.title}`);
              continue;
            }

            console.log(`[Discovery] Accepting (score: ${relevanceScore}, views: ${views.toLocaleString()}): ${video.snippet.title}`);

            // Transform metadata (no LLM)
            const sourceMetadata = transformToSourceMetadata(video);
            const hasCreatorAffiliate = sourceMetadata.extractedLinks?.some(l => l.isAffiliate) || false;

            // Extract basic product hints (no LLM - regex only)
            const extractedProducts = extractBasicProductHints(
              video.snippet.title,
              video.snippet.description
            );

            // Insert content idea with status='discovered'
            const { error: insertError } = await supabaseAdmin
              .from('content_ideas')
              .insert({
                source_platform: 'youtube',
                source_url: videoUrl,
                source_channel_name: video.snippet.channelTitle,
                source_creator_handle: null,
                source_published_at: video.snippet.publishedAt,
                source_metadata: sourceMetadata,
                vertical,
                // No LLM-generated content yet
                idea_title: null,
                idea_summary: null,
                why_interesting_to_creator: null,
                why_interesting_to_audience: null,
                hook_options: [],
                long_form_outline: null,
                short_form_ideas: [],
                tags: [],
                affiliate_notes: null,
                has_creator_affiliate: hasCreatorAffiliate,
                // Staged workflow
                status: 'discovered',
                discovered_at: new Date().toISOString(),
                extracted_products: extractedProducts,
              });

            if (insertError) {
              console.error(`[Discovery] Insert error for ${videoUrl}:`, insertError);
              response.errors.push({ videoUrl, error: insertError.message });
            } else {
              response.videosDiscovered++;
              response.byVertical[vertical]++;
              console.log(`[Discovery] Added: ${video.snippet.title}`);
            }

            // Small delay between inserts
            await new Promise(resolve => setTimeout(resolve, 50));
          } catch (videoError) {
            console.error(`[Discovery] Error processing ${videoUrl}:`, videoError);
            response.errors.push({
              videoUrl,
              error: videoError instanceof Error ? videoError.message : 'Unknown error',
            });
          }
        }

        // Delay between verticals
        await new Promise(resolve => setTimeout(resolve, 200));
      } catch (verticalError) {
        console.error(`[Discovery] Error for vertical ${vertical}:`, verticalError);
        response.errors.push({
          videoUrl: `[vertical:${vertical}]`,
          error: verticalError instanceof Error ? verticalError.message : 'Unknown error',
        });
      }
    }

    // Log admin action
    await logAdminAction(admin, 'system.migration', 'content_ideas', null, {
      action: 'discover_videos',
      verticals,
      videosDiscovered: response.videosDiscovered,
      errors: response.errors.length,
    });

    console.log(`[Discovery] Complete: ${response.videosDiscovered} videos discovered`);
    return NextResponse.json(response);
  } catch (error) {
    console.error('[Discovery] Fatal error:', error);
    return NextResponse.json(
      { error: 'Discovery failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/social/discover
 * Get discovery status and recently discovered videos
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const authResult = await withAdminApi('moderator');
    if ('error' in authResult) {
      return authResult.error;
    }

    // Get count of discovered videos awaiting screening
    const { count: discoveredCount } = await supabaseAdmin
      .from('content_ideas')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'discovered');

    // Get recent discoveries
    const { data: recentDiscoveries } = await supabaseAdmin
      .from('content_ideas')
      .select('id, source_url, source_channel_name, vertical, discovered_at, source_metadata')
      .eq('status', 'discovered')
      .order('discovered_at', { ascending: false })
      .limit(10);

    // Check if YouTube API key is configured
    const hasYouTubeKey = !!process.env.YOUTUBE_API_KEY;

    return NextResponse.json({
      status: 'ready',
      hasYouTubeKey,
      discoveredCount: discoveredCount || 0,
      recentDiscoveries: recentDiscoveries || [],
      supportedVerticals: DEFAULT_VERTICALS,
    });
  } catch (error) {
    console.error('[Discovery] Status error:', error);
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 });
  }
}
