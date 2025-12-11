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
import type { ContentVertical } from '@/lib/types/contentIdeas';

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

/**
 * POST /api/admin/content-ideas/analyze-url
 * SIMPLIFIED: Fetch YouTube metadata and extract links from description.
 * No LLM processing - user enriches items in bag editor.
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await withAdminApi('moderator');
    if ('error' in authResult) {
      return authResult.error;
    }
    const { admin } = authResult;

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

    console.log(`[AnalyzeURL] Fetching video: ${videoId}`);

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
      return NextResponse.json({
        success: true,
        savedIdeaId: existing.id,
        alreadyExists: true,
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
        productLinksCount: sourceMetadata.extractedLinks?.filter(l => l.productHint || l.label).length || 0,
      });
    }

    // Count product links from description
    const extractedLinks = sourceMetadata.extractedLinks || [];
    const productLinks = extractedLinks.filter(l => l.productHint || l.label);
    const hasCreatorAffiliate = extractedLinks.some(l => l.isAffiliate);

    // Save to database if requested
    let savedIdeaId: string | undefined;
    if (saveToDatabase) {
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
          idea_title: video.snippet.title,
          idea_summary: `Gear setup from ${video.snippet.channelTitle}`,
          tags: [],
          has_creator_affiliate: hasCreatorAffiliate,
          status: 'generated',
          created_by_admin_id: admin.id,
          discovered_at: new Date().toISOString(),
          screened_at: new Date().toISOString(),
          generated_at: new Date().toISOString(),
          screened_by_admin_id: admin.id,
          screening_notes: 'Quick add via URL',
        })
        .select('id')
        .single();

      if (insertError) {
        console.error('[AnalyzeURL] Failed to save:', insertError);
        return NextResponse.json(
          { error: 'Failed to save', details: insertError.message },
          { status: 500 }
        );
      }

      savedIdeaId = inserted?.id;
      console.log(`[AnalyzeURL] Saved as idea: ${savedIdeaId}`);
    }

    // Log action
    await logAdminAction(admin, 'admin.login', 'content_ideas', savedIdeaId || null, {
      action: 'analyze_url',
      videoUrl,
      productLinksFound: productLinks.length,
    });

    return NextResponse.json({
      success: true,
      savedIdeaId,
      alreadyExists: false,
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
      productLinksCount: productLinks.length,
      hasCreatorAffiliate,
    });
  } catch (error) {
    console.error('[AnalyzeURL] Error:', error);
    return NextResponse.json(
      { error: 'Analysis failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
