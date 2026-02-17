import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { withAdminApi } from '@/lib/withAdmin';
import { scoreRedditPost } from '@/lib/risingPosts/scoring';
import { scoreYouTubeVideo } from '@/lib/risingPosts/scoring';
import { searchYouTubeVideos, getVideoDetails } from '@/lib/contentIdeas/youtube';
import {
  SUBREDDIT_CONFIG,
  YOUTUBE_QUERIES,
  ALL_CATEGORIES,
  type RisingCategory,
  type RisingPost,
  type RisingPostsResponse,
  type RedditSort,
} from '@/lib/types/risingPosts';

// ═══════════════════════════════════════════════════════════════════
// Reddit Fetching
// ═══════════════════════════════════════════════════════════════════

interface RedditChild {
  data: {
    id: string;
    title: string;
    selftext: string;
    permalink: string;
    subreddit: string;
    link_flair_text: string | null;
    score: number;
    num_comments: number;
    created_utc: number;
    post_hint?: string;
    is_gallery?: boolean;
    thumbnail?: string;
    url?: string;
    preview?: {
      images?: Array<{
        source?: { url: string };
      }>;
    };
  };
}

async function fetchSubreddit(
  sub: string,
  sort: RedditSort,
  limit: number = 15
): Promise<RedditChild[]> {
  const url = `https://www.reddit.com/r/${sub}/${sort}.json?limit=${limit}`;
  const resp = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TeedRising/1.0)' },
    signal: AbortSignal.timeout(10000),
  });

  if (!resp.ok) {
    throw new Error(`Reddit r/${sub}/${sort}: ${resp.status}`);
  }

  const data = await resp.json();
  return data?.data?.children ?? [];
}

function getRedditThumbnail(child: RedditChild): string | undefined {
  // Try preview image first (higher quality)
  const previewUrl = child.data.preview?.images?.[0]?.source?.url;
  if (previewUrl) {
    return previewUrl.replace(/&amp;/g, '&');
  }
  // Fall back to thumbnail if it's a real URL
  if (child.data.thumbnail && child.data.thumbnail.startsWith('http')) {
    return child.data.thumbnail;
  }
  return undefined;
}

async function fetchAllRedditPosts(
  categories: RisingCategory[],
  sort: RedditSort
): Promise<{ posts: RisingPost[]; errors: string[] }> {
  const errors: string[] = [];
  const allPosts: RisingPost[] = [];
  const seenIds = new Set<string>();

  // Collect all subreddits with their category
  const subredditJobs: { sub: string; category: RisingCategory }[] = [];
  for (const cat of categories) {
    const subs = SUBREDDIT_CONFIG[cat] || [];
    for (const s of subs) {
      subredditJobs.push({ sub: s.sub, category: cat });
    }
  }

  // Batch 3 at a time with 500ms between batches
  const BATCH_SIZE = 3;
  for (let i = 0; i < subredditJobs.length; i += BATCH_SIZE) {
    const batch = subredditJobs.slice(i, i + BATCH_SIZE);

    const results = await Promise.allSettled(
      batch.map((job) => fetchSubreddit(job.sub, sort))
    );

    for (let j = 0; j < results.length; j++) {
      const result = results[j];
      const job = batch[j];

      if (result.status === 'rejected') {
        errors.push(`r/${job.sub}: ${result.reason}`);
        continue;
      }

      const now = Date.now() / 1000;
      for (const child of result.value) {
        const d = child.data;
        if (seenIds.has(d.id)) continue;
        seenIds.add(d.id);

        const ageHours = d.created_utc ? (now - d.created_utc) / 3600 : 999;
        const isImage = d.post_hint === 'image' || d.is_gallery === true;

        const { teedScore, keywordHits } = scoreRedditPost({
          title: d.title || '',
          selftext: d.selftext || '',
          linkFlairText: d.link_flair_text || '',
          score: d.score || 0,
          numComments: d.num_comments || 0,
          ageHours,
          isImage,
        });

        allPosts.push({
          id: `reddit_${d.id}`,
          platform: 'reddit',
          category: job.category,
          title: d.title || '',
          url: `https://reddit.com${d.permalink}`,
          source: `r/${d.subreddit}`,
          thumbnailUrl: getRedditThumbnail(child),
          flair: d.link_flair_text || undefined,
          score: d.score || 0,
          comments: d.num_comments || 0,
          ageHours: Math.round(ageHours * 10) / 10,
          isImage,
          keywordHits,
          teedScore,
          createdUtc: d.created_utc || 0,
        });
      }
    }

    // Rate limit: 500ms between batches
    if (i + BATCH_SIZE < subredditJobs.length) {
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }

  // Sort by teedScore descending
  allPosts.sort((a, b) => b.teedScore - a.teedScore);

  return { posts: allPosts, errors };
}

// ═══════════════════════════════════════════════════════════════════
// YouTube Fetching
// ═══════════════════════════════════════════════════════════════════

async function fetchAllYouTubePosts(
  categories: RisingCategory[]
): Promise<{ posts: RisingPost[]; errors: string[]; quotaUsed: number }> {
  const errors: string[] = [];
  const allPosts: RisingPost[] = [];
  let quotaUsed = 0;

  const publishedAfter = new Date();
  publishedAfter.setHours(publishedAfter.getHours() - 24);

  for (const cat of categories) {
    const queries = YOUTUBE_QUERIES[cat] || [];
    if (queries.length === 0) continue;

    // Use first query per category to conserve quota
    const query = queries[0];

    try {
      const searchResults = await searchYouTubeVideos(query, {
        maxResults: 5,
        publishedAfter: publishedAfter.toISOString(),
        order: 'date',
      });
      quotaUsed += 100; // search costs 100 units

      const videoIds = searchResults
        .map((item) => item.id?.videoId)
        .filter(Boolean) as string[];

      if (videoIds.length === 0) continue;

      const videos = await getVideoDetails(videoIds);
      quotaUsed += videoIds.length; // 1 unit per video

      const now = Date.now();
      for (const video of videos) {
        const publishedAt = new Date(video.snippet.publishedAt).getTime();
        const ageHours = (now - publishedAt) / (1000 * 3600);
        const views = parseInt(video.statistics?.viewCount || '0', 10);
        const likes = parseInt(video.statistics?.likeCount || '0', 10);
        const comments = parseInt(video.statistics?.commentCount || '0', 10);

        const { teedScore, keywordHits } = scoreYouTubeVideo({
          title: video.snippet.title,
          description: video.snippet.description,
          views,
          likes,
          comments,
          ageHours,
        });

        const thumbnailUrl =
          video.snippet.thumbnails?.high?.url ||
          video.snippet.thumbnails?.medium?.url ||
          video.snippet.thumbnails?.default?.url;

        allPosts.push({
          id: `youtube_${video.id}`,
          platform: 'youtube',
          category: cat,
          title: video.snippet.title,
          url: `https://www.youtube.com/watch?v=${video.id}`,
          source: video.snippet.channelTitle,
          thumbnailUrl,
          score: views,
          comments,
          ageHours: Math.round(ageHours * 10) / 10,
          isImage: false,
          keywordHits,
          teedScore,
          createdUtc: Math.floor(publishedAt / 1000),
        });
      }
    } catch (err) {
      errors.push(`YouTube [${cat}]: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  allPosts.sort((a, b) => b.teedScore - a.teedScore);

  return { posts: allPosts, errors, quotaUsed };
}

// ═══════════════════════════════════════════════════════════════════
// API Handler
// ═══════════════════════════════════════════════════════════════════

export async function GET(request: NextRequest) {
  const result = await withAdminApi('moderator');
  if ('error' in result) return result.error;

  const { searchParams } = new URL(request.url);

  // Parse categories
  const categoriesParam = searchParams.get('categories') || 'all';
  const categories: RisingCategory[] =
    categoriesParam === 'all'
      ? [...ALL_CATEGORIES]
      : (categoriesParam.split(',').filter((c) =>
          ALL_CATEGORIES.includes(c as RisingCategory)
        ) as RisingCategory[]);

  // Parse platforms
  const platformsParam = searchParams.get('platforms') || 'reddit,youtube';
  const platforms = platformsParam.split(',');
  const fetchReddit = platforms.includes('reddit');
  const fetchYouTube = platforms.includes('youtube');

  // Parse Reddit sort
  const redditSort = (searchParams.get('redditSort') || 'rising') as RedditSort;

  const allPosts: RisingPost[] = [];
  const allErrors: string[] = [];
  let quotaUsed = 0;

  // Fetch in parallel
  const promises: Promise<void>[] = [];

  if (fetchReddit) {
    promises.push(
      fetchAllRedditPosts(categories, redditSort).then(({ posts, errors }) => {
        allPosts.push(...posts);
        allErrors.push(...errors);
      })
    );
  }

  if (fetchYouTube) {
    promises.push(
      fetchAllYouTubePosts(categories).then(({ posts, errors, quotaUsed: qu }) => {
        allPosts.push(...posts);
        allErrors.push(...errors);
        quotaUsed += qu;
      })
    );
  }

  await Promise.all(promises);

  const response: RisingPostsResponse = {
    posts: allPosts,
    fetchedAt: new Date().toISOString(),
    errors: allErrors,
    quotaUsed,
  };

  return NextResponse.json(response);
}
