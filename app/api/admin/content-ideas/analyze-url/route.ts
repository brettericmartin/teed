import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAdminApi } from '@/lib/withAdmin';
import { logAdminAction } from '@/lib/adminAuth';
import {
  extractVideoId,
  getVideoDetails,
  transformToSourceMetadata,
  buildYouTubeUrl,
} from '@/lib/contentIdeas/youtube';
import {
  extractProductsFromVideo,
  generateIdeaFromSource,
  generateHooksAndLongForm,
  generateShortFormFromLongForm,
  detectVideoContentType,
} from '@/lib/contentIdeas/generation';
import type {
  ContentVertical,
  ExtractedProduct,
  ContentIdea,
} from '@/lib/types/contentIdeas';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

interface AnalyzeUrlRequest {
  url: string;
  vertical?: ContentVertical;
  saveToDatabase?: boolean;
}

interface ClipOpportunity {
  itemName: string;
  brand: string | undefined;
  clipAngle: string;
  suggestedHook: string;
  estimatedDuration: string;
  heroScore: number;
  storySignals: string[];
}

interface AnalyzeUrlResponse {
  success: boolean;
  videoInfo: {
    title: string;
    channel: string;
    publishedAt: string;
    viewCount: string;
    likeCount: string;
    duration: string;
    thumbnailUrl: string;
    url: string;
  };
  contentType: 'single_hero' | 'roundup' | 'comparison';
  products: ExtractedProduct[];
  clipOpportunities: ClipOpportunity[];
  generatedIdea: {
    title: string;
    summary: string;
    whyCreator: string;
    whyAudience: string;
    tags: string[];
    hooks: Array<{ hook: string; style: string; platform: string }>;
    longFormOutline: Record<string, string | number | undefined>;
    shortFormIdeas: Array<{ hook: string; narrative: string; duration: number }>;
  };
  savedIdeaId?: string;
}

/**
 * POST /api/admin/content-ideas/analyze-url
 * Analyze any YouTube video URL and get a full content breakdown
 */
export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    const authResult = await withAdminApi('moderator');
    if ('error' in authResult) {
      return authResult.error;
    }
    const { admin } = authResult;

    // Parse request
    const body: AnalyzeUrlRequest = await request.json();
    const { url, vertical = 'other', saveToDatabase = false } = body;

    if (!url) {
      return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    // Extract video ID
    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        { error: 'Invalid YouTube URL. Please provide a valid YouTube video link.' },
        { status: 400 }
      );
    }

    console.log(`[AnalyzeURL] Analyzing video: ${videoId}`);

    // Fetch video details from YouTube
    const videos = await getVideoDetails([videoId]);
    if (videos.length === 0) {
      return NextResponse.json(
        { error: 'Video not found. It may be private or deleted.' },
        { status: 404 }
      );
    }

    const video = videos[0];
    const videoUrl = buildYouTubeUrl(videoId);
    const sourceMetadata = transformToSourceMetadata(video);

    // Check if already exists
    const { data: existing } = await supabaseAdmin
      .from('content_ideas')
      .select('id, idea_title, status')
      .eq('source_url', videoUrl)
      .single();

    if (existing) {
      console.log(`[AnalyzeURL] Video already exists as idea: ${existing.id}`);
    }

    // Extract products
    console.log(`[AnalyzeURL] Extracting products...`);
    const products = await extractProductsFromVideo(
      video.snippet.title,
      video.snippet.description,
      vertical,
      sourceMetadata.extractedLinks || []
    );

    console.log(`[AnalyzeURL] Found ${products.length} products`);

    // Detect content type
    const contentType = detectVideoContentType(
      video.snippet.title,
      video.snippet.description,
      products.length
    );

    console.log(`[AnalyzeURL] Content type: ${contentType}`);

    // Generate clip opportunities for each significant product
    const clipOpportunities: ClipOpportunity[] = products
      .filter(p => p.heroScore && p.heroScore >= 30)
      .sort((a, b) => (b.heroScore || 0) - (a.heroScore || 0))
      .slice(0, 10)
      .map(product => {
        // Generate clip angle based on story signals
        let clipAngle = 'Product spotlight';
        let suggestedHook = `Check out this ${product.name}`;

        if (product.storySignals && product.storySignals.length > 0) {
          const signals = product.storySignals.join(' ').toLowerCase();
          if (signals.includes('game changer') || signals.includes('changed')) {
            clipAngle = 'Transformation story';
            suggestedHook = `This ${product.brand || 'item'} completely changed my ${vertical}`;
          } else if (signals.includes('years') || signals.includes('old')) {
            clipAngle = 'Long-term review';
            suggestedHook = `I've used this ${product.name} for years - here's the truth`;
          } else if (signals.includes('underrated') || signals.includes('nobody talks')) {
            clipAngle = 'Hidden gem reveal';
            suggestedHook = `The most underrated ${vertical} item nobody talks about`;
          } else if (signals.includes('expensive') || signals.includes('budget')) {
            clipAngle = 'Value breakdown';
            suggestedHook = `Is the ${product.name} actually worth it?`;
          } else if (signals.includes('favorite') || signals.includes('love')) {
            clipAngle = 'Personal favorite';
            suggestedHook = `Why I can't live without my ${product.name}`;
          }
        }

        return {
          itemName: product.name,
          brand: product.brand,
          clipAngle,
          suggestedHook,
          estimatedDuration: product.heroScore && product.heroScore >= 60 ? '45-60s' : '15-30s',
          heroScore: product.heroScore || 0,
          storySignals: product.storySignals || [],
        };
      });

    // Generate full content idea
    console.log(`[AnalyzeURL] Generating content idea...`);
    const hasCreatorAffiliate = sourceMetadata.extractedLinks?.some(l => l.isAffiliate) || false;

    const ideaOutput = await generateIdeaFromSource(
      video.snippet.title,
      video.snippet.description,
      video.snippet.channelTitle,
      vertical,
      products,
      hasCreatorAffiliate
    );

    // Create partial idea for hooks generation
    const partialIdea: ContentIdea = {
      id: '',
      source_platform: 'youtube',
      source_url: videoUrl,
      source_channel_name: video.snippet.channelTitle,
      source_creator_handle: null,
      source_published_at: video.snippet.publishedAt,
      source_metadata: sourceMetadata,
      primary_bag_id: null,
      primary_catalog_item_id: null,
      hero_catalog_item_ids: [],
      hero_bag_item_ids: [],
      vertical,
      idea_title: ideaOutput.idea_title,
      idea_summary: ideaOutput.idea_summary,
      why_interesting_to_creator: ideaOutput.why_interesting_to_creator,
      why_interesting_to_audience: ideaOutput.why_interesting_to_audience,
      hook_options: [],
      long_form_outline: null,
      short_form_ideas: [],
      tags: ideaOutput.tags,
      affiliate_notes: ideaOutput.affiliate_notes,
      has_creator_affiliate: hasCreatorAffiliate,
      status: 'generated',
      created_by_admin_id: admin.id,
      reviewed_at: null,
      approved_at: null,
      discovered_at: new Date().toISOString(),
      screened_at: new Date().toISOString(),
      generated_at: new Date().toISOString(),
      screened_by_admin_id: admin.id,
      screening_notes: 'Manual URL analysis',
      extracted_products: products,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Generate hooks and long-form
    console.log(`[AnalyzeURL] Generating hooks and outline...`);
    const heroProducts = products
      .filter(p => p.isHeroCandidate)
      .sort((a, b) => (b.heroScore || 0) - (a.heroScore || 0));

    const hooksOutput = await generateHooksAndLongForm(partialIdea, heroProducts, products);

    // Generate short-form ideas
    console.log(`[AnalyzeURL] Generating short-form ideas...`);
    const shortFormOutput = await generateShortFormFromLongForm(
      hooksOutput.long_form_outline || { intro: '', creatorStory: '', heroBreakdown: '', bagContext: '', cta: '' },
      heroProducts,
      vertical
    );

    // Optionally save to database
    let savedIdeaId: string | undefined;
    if (saveToDatabase && !existing) {
      const { data: inserted, error: insertError } = await supabaseAdmin
        .from('content_ideas')
        .insert({
          source_platform: 'youtube',
          source_url: videoUrl,
          source_channel_name: video.snippet.channelTitle,
          source_creator_handle: null,
          source_published_at: video.snippet.publishedAt,
          source_metadata: sourceMetadata,
          vertical,
          idea_title: ideaOutput.idea_title,
          idea_summary: ideaOutput.idea_summary,
          why_interesting_to_creator: ideaOutput.why_interesting_to_creator,
          why_interesting_to_audience: ideaOutput.why_interesting_to_audience,
          hook_options: hooksOutput.hook_options,
          long_form_outline: hooksOutput.long_form_outline,
          short_form_ideas: shortFormOutput.short_form_ideas,
          tags: ideaOutput.tags,
          affiliate_notes: ideaOutput.affiliate_notes,
          has_creator_affiliate: hasCreatorAffiliate,
          status: 'generated',
          created_by_admin_id: admin.id,
          discovered_at: new Date().toISOString(),
          screened_at: new Date().toISOString(),
          generated_at: new Date().toISOString(),
          screened_by_admin_id: admin.id,
          screening_notes: 'Manual URL analysis',
          extracted_products: products,
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('[AnalyzeURL] Failed to save:', insertError);
      } else {
        savedIdeaId = inserted?.id;
        console.log(`[AnalyzeURL] Saved as idea: ${savedIdeaId}`);
      }
    } else if (existing) {
      savedIdeaId = existing.id;
    }

    // Log action
    await logAdminAction(admin, 'admin.login', 'content_ideas', savedIdeaId || null, {
      action: 'analyze_url',
      videoUrl,
      productsFound: products.length,
      contentType,
    });

    // Build response
    const response: AnalyzeUrlResponse = {
      success: true,
      videoInfo: {
        title: video.snippet.title,
        channel: video.snippet.channelTitle,
        publishedAt: video.snippet.publishedAt,
        viewCount: video.statistics?.viewCount || '0',
        likeCount: video.statistics?.likeCount || '0',
        duration: video.contentDetails?.duration || 'PT0M',
        thumbnailUrl: video.snippet.thumbnails?.high?.url || video.snippet.thumbnails?.medium?.url || '',
        url: videoUrl,
      },
      contentType,
      products,
      clipOpportunities,
      generatedIdea: {
        title: ideaOutput.idea_title,
        summary: ideaOutput.idea_summary,
        whyCreator: ideaOutput.why_interesting_to_creator,
        whyAudience: ideaOutput.why_interesting_to_audience,
        tags: ideaOutput.tags,
        hooks: (hooksOutput.hook_options || []).map(h => ({
          hook: h.hook,
          style: h.style,
          platform: h.platform,
        })),
        longFormOutline: (hooksOutput.long_form_outline || {}) as unknown as Record<string, string | number | undefined>,
        shortFormIdeas: (shortFormOutput.short_form_ideas || []).map(s => ({
          hook: s.hook,
          narrative: s.narrative,
          duration: s.durationSeconds,
        })),
      },
      savedIdeaId,
    };

    console.log(`[AnalyzeURL] Complete: ${products.length} products, ${clipOpportunities.length} clip opportunities`);
    return NextResponse.json(response);
  } catch (error) {
    console.error('[AnalyzeURL] Error:', error);
    return NextResponse.json(
      { error: 'Analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
