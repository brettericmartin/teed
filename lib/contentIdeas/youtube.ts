/**
 * YouTube Data API Integration for Content Ideas
 * Fetches and processes YouTube videos for the Social Media Manager
 */

import type {
  ContentVertical,
  ExtractedLink,
  SourceMetadata,
  YouTubeVideoMetadata,
} from '../types/contentIdeas';
import { isAffiliateLinkUrl, getAffiliateDomain, VERTICAL_SEARCH_QUERIES } from '../types/contentIdeas';

// ═══════════════════════════════════════════════════════════════════
// Types
// ═══════════════════════════════════════════════════════════════════

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    channelId: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: {
      default?: { url: string; width: number; height: number };
      medium?: { url: string; width: number; height: number };
      high?: { url: string; width: number; height: number };
    };
  };
}

interface YouTubeVideoItem {
  id: string;
  snippet: {
    title: string;
    description: string;
    channelId: string;
    channelTitle: string;
    publishedAt: string;
    thumbnails: {
      default?: { url: string; width: number; height: number };
      medium?: { url: string; width: number; height: number };
      high?: { url: string; width: number; height: number };
      maxres?: { url: string; width: number; height: number };
    };
    tags?: string[];
  };
  statistics?: {
    viewCount: string;
    likeCount?: string;
    commentCount?: string;
  };
  contentDetails?: {
    duration: string;
  };
}

interface YouTubeSearchResponse {
  items: YouTubeSearchItem[];
  pageInfo: { totalResults: number };
  nextPageToken?: string;
}

interface YouTubeVideoResponse {
  items: YouTubeVideoItem[];
}

// ═══════════════════════════════════════════════════════════════════
// API Functions
// ═══════════════════════════════════════════════════════════════════

const YOUTUBE_API_BASE = 'https://www.googleapis.com/youtube/v3';

function getApiKey(): string {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) {
    throw new Error('Missing YOUTUBE_API_KEY environment variable');
  }
  return key;
}

/**
 * Search YouTube for videos matching a query
 */
export async function searchYouTubeVideos(
  query: string,
  options: {
    maxResults?: number;
    publishedAfter?: string; // ISO date string
    order?: 'date' | 'viewCount' | 'relevance';
    channelId?: string; // Filter by specific channel
  } = {}
): Promise<YouTubeSearchItem[]> {
  const { maxResults = 10, publishedAfter, order = 'relevance', channelId } = options;

  const params = new URLSearchParams({
    part: 'snippet',
    type: 'video',
    q: query,
    maxResults: String(maxResults),
    order,
    key: getApiKey(),
    videoDuration: 'medium', // 4-20 minutes (typical WITB length)
    relevanceLanguage: 'en',
  });

  if (publishedAfter) {
    params.set('publishedAfter', publishedAfter);
  }

  if (channelId) {
    params.set('channelId', channelId);
  }

  const response = await fetch(`${YOUTUBE_API_BASE}/search?${params}`);

  if (!response.ok) {
    const error = await response.text();
    console.error('YouTube search failed:', error);
    throw new Error(`YouTube API error: ${response.status}`);
  }

  const data: YouTubeSearchResponse = await response.json();
  return data.items || [];
}

/**
 * Get detailed video information for multiple video IDs
 */
export async function getVideoDetails(videoIds: string[]): Promise<YouTubeVideoItem[]> {
  if (videoIds.length === 0) return [];

  const params = new URLSearchParams({
    part: 'snippet,statistics,contentDetails',
    id: videoIds.join(','),
    key: getApiKey(),
  });

  const response = await fetch(`${YOUTUBE_API_BASE}/videos?${params}`);

  if (!response.ok) {
    const error = await response.text();
    console.error('YouTube video details failed:', error);
    throw new Error(`YouTube API error: ${response.status}`);
  }

  const data: YouTubeVideoResponse = await response.json();
  return data.items || [];
}

/**
 * Search for videos across all queries for a vertical
 * Uses dynamic queries from database if available, falls back to static queries
 */
export async function searchVideosForVertical(
  vertical: ContentVertical,
  options: {
    maxVideosTotal?: number;
    daysBack?: number;
    dynamicQueries?: Array<{ query: string; priority: number }>;
  } = {}
): Promise<YouTubeVideoItem[]> {
  const { maxVideosTotal = 20, daysBack = 7, dynamicQueries } = options;

  // Use dynamic queries if provided, otherwise fall back to static
  let queries: string[];
  if (dynamicQueries && dynamicQueries.length > 0) {
    // Sort by priority and extract query strings
    queries = dynamicQueries
      .sort((a, b) => b.priority - a.priority)
      .map(q => q.query);
    console.log(`[YouTube] Using ${queries.length} dynamic queries for ${vertical}`);
  } else {
    queries = VERTICAL_SEARCH_QUERIES[vertical] || [];
    console.log(`[YouTube] Using ${queries.length} static queries for ${vertical}`);
  }

  if (queries.length === 0) {
    console.warn(`No search queries defined for vertical: ${vertical}`);
    return [];
  }

  const publishedAfter = new Date();
  publishedAfter.setDate(publishedAfter.getDate() - daysBack);

  // Collect video IDs from all queries
  const videoIdSet = new Set<string>();
  const videosPerQuery = Math.ceil(maxVideosTotal / queries.length);

  for (const query of queries) {
    try {
      const searchResults = await searchYouTubeVideos(query, {
        maxResults: videosPerQuery,
        publishedAfter: publishedAfter.toISOString(),
        order: 'relevance',
      });

      for (const item of searchResults) {
        if (item.id?.videoId) {
          videoIdSet.add(item.id.videoId);
        }
      }

      // Small delay between API calls
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error(`Failed to search for "${query}":`, error);
    }
  }

  // Get detailed info for all videos
  const videoIds = Array.from(videoIdSet).slice(0, maxVideosTotal);
  if (videoIds.length === 0) return [];

  // Batch video IDs in groups of 50 (API limit)
  const batches: string[][] = [];
  for (let i = 0; i < videoIds.length; i += 50) {
    batches.push(videoIds.slice(i, i + 50));
  }

  const allVideos: YouTubeVideoItem[] = [];
  for (const batch of batches) {
    const videos = await getVideoDetails(batch);
    allVideos.push(...videos);
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return allVideos;
}

// ═══════════════════════════════════════════════════════════════════
// URL Extraction
// ═══════════════════════════════════════════════════════════════════

/**
 * Extract URLs from video description text
 */
export function extractUrlsFromDescription(description: string): ExtractedLink[] {
  const links: ExtractedLink[] = [];

  // URL regex pattern
  const urlRegex = /https?:\/\/[^\s<>"{}|\\^`[\]]+/gi;
  const matches = description.match(urlRegex) || [];

  for (const url of matches) {
    // Clean up URL (remove trailing punctuation)
    const cleanUrl = url.replace(/[.,;:!?)]+$/, '');

    try {
      const urlObj = new URL(cleanUrl);
      const isAffiliate = isAffiliateLinkUrl(cleanUrl);

      // Try to extract product hint from surrounding context
      const urlIndex = description.indexOf(url);
      const contextStart = Math.max(0, urlIndex - 100);
      const contextEnd = Math.min(description.length, urlIndex + url.length + 50);
      const context = description.slice(contextStart, contextEnd);

      // Look for product name patterns near the URL
      let productHint: string | undefined;
      const beforeUrl = description.slice(contextStart, urlIndex);
      const labelMatch = beforeUrl.match(/(?:^|\n)([A-Z][^:\n]{5,50}):/);
      if (labelMatch) {
        productHint = labelMatch[1].trim();
      }

      links.push({
        url: cleanUrl,
        domain: urlObj.hostname,
        isAffiliate,
        affiliateType: isAffiliate ? getAffiliateDomain(cleanUrl) : undefined,
        productHint,
        label: productHint,
      });
    } catch {
      // Invalid URL, skip
    }
  }

  return links;
}

/**
 * Detect if description contains affiliate disclosure
 */
export function hasAffiliateDisclosure(description: string): boolean {
  const disclosurePatterns = [
    /affiliate/i,
    /commission/i,
    /paid link/i,
    /sponsored/i,
    /as an amazon associate/i,
    /earn from qualifying purchases/i,
    /i may earn/i,
    /small commission/i,
    /links below/i,
    /gear links/i,
  ];

  return disclosurePatterns.some(pattern => pattern.test(description));
}

// ═══════════════════════════════════════════════════════════════════
// Data Transformation
// ═══════════════════════════════════════════════════════════════════

/**
 * Transform YouTube API response into our SourceMetadata format
 */
export function transformToSourceMetadata(video: YouTubeVideoItem): SourceMetadata {
  const extractedLinks = extractUrlsFromDescription(video.snippet.description);
  const hasAffiliate = extractedLinks.some(l => l.isAffiliate) || hasAffiliateDisclosure(video.snippet.description);

  const youtubeMetadata: YouTubeVideoMetadata = {
    videoId: video.id,
    title: video.snippet.title,
    description: video.snippet.description,
    channelId: video.snippet.channelId,
    channelTitle: video.snippet.channelTitle,
    publishedAt: video.snippet.publishedAt,
    thumbnails: video.snippet.thumbnails,
    statistics: video.statistics,
    duration: video.contentDetails?.duration,
    tags: video.snippet.tags,
  };

  return {
    youtube: youtubeMetadata,
    extractedLinks,
    processedAt: new Date().toISOString(),
    extractionVersion: '1.0',
  };
}

/**
 * Build canonical YouTube video URL
 */
export function buildYouTubeUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Extract video ID from various YouTube URL formats
 */
export function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/, // Raw video ID
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Check if a video is likely a "What's in the Bag" / setup video
 */
export function isLikelySetupVideo(title: string, description: string): boolean {
  const keywords = [
    /what'?s in (the|my) bag/i,
    /witb/i,
    /setup tour/i,
    /desk setup/i,
    /room tour/i,
    /gear (breakdown|rundown|check)/i,
    /my (golf|camera|photography|desk|gaming|music) gear/i,
    /bag (check|breakdown|tour)/i,
    /equipment (tour|rundown)/i,
    /everyday carry/i,
    /edc/i,
    /what i (use|carry|bring)/i,
  ];

  const combined = `${title} ${description}`;
  return keywords.some(pattern => pattern.test(combined));
}

/**
 * Estimate video quality/relevance score
 * Higher scores = better content opportunity
 */
export function scoreVideoRelevance(video: YouTubeVideoItem, vertical: ContentVertical): number {
  let score = 0;
  const title = video.snippet.title.toLowerCase();
  const description = video.snippet.description.toLowerCase();
  const views = parseInt(video.statistics?.viewCount || '0', 10);

  // MAJOR FACTOR: View count (viral content is valuable even if not explicitly gear-focused)
  // High-view videos from top creators are worth reviewing
  if (views > 1000000) score += 50;       // 1M+ views = must review
  else if (views > 500000) score += 40;   // 500K+ = very high priority
  else if (views > 100000) score += 30;   // 100K+ = high priority
  else if (views > 50000) score += 20;    // 50K+ = good
  else if (views > 10000) score += 10;    // 10K+ = decent
  // Under 10K views = no bonus (filter these out)

  // Title relevance for gear/setup content
  if (isLikelySetupVideo(title, '')) score += 25;

  // Description relevance
  if (isLikelySetupVideo('', description)) score += 15;

  // Engagement bonus (high engagement = quality content)
  const likes = parseInt(video.statistics?.likeCount || '0', 10);
  const likeRatio = views > 0 ? likes / views : 0;
  if (likeRatio > 0.06) score += 15;      // Exceptional engagement
  else if (likeRatio > 0.04) score += 10; // Great engagement
  else if (likeRatio > 0.02) score += 5;  // Good engagement

  // Recency bonus (fresh content is more relevant)
  const publishedDate = new Date(video.snippet.publishedAt);
  const daysSincePublished = (Date.now() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);
  if (daysSincePublished < 2) score += 15;      // Very fresh
  else if (daysSincePublished < 5) score += 10; // Fresh
  else if (daysSincePublished < 14) score += 5; // Recent

  // Vertical-specific keywords (gear mentioned = good signal)
  const verticalKeywords: Record<ContentVertical, string[]> = {
    golf: ['driver', 'putter', 'iron', 'wedge', 'golf', 'club', 'titleist', 'taylormade', 'callaway', 'ping', 'scotty'],
    camera: ['camera', 'lens', 'sony', 'canon', 'nikon', 'fuji', 'photography', 'cinema', 'filmmaker', 'a7', 'r5', 'z8'],
    makeup: ['makeup', 'beauty', 'skincare', 'foundation', 'lipstick', 'palette', 'brush', 'sephora'],
    desk: ['desk', 'monitor', 'keyboard', 'mouse', 'workspace', 'wfh', 'home office', 'setup', 'ultrawide'],
    tech: ['tech', 'gadget', 'iphone', 'macbook', 'ipad', 'apple', 'samsung', 'pixel', 'review', 'unboxing'],
    edc: ['edc', 'everyday carry', 'knife', 'wallet', 'watch', 'flashlight', 'pocket', 'benchmade'],
    fitness: ['gym', 'workout', 'fitness', 'training', 'supplement', 'protein', 'home gym'],
    music: ['guitar', 'synth', 'studio', 'music', 'production', 'audio', 'midi', 'pedal', 'amp'],
    art: ['art', 'supplies', 'drawing', 'painting', 'sketchbook', 'pencil', 'brush', 'wacom'],
    gaming: ['gaming', 'pc', 'console', 'controller', 'stream', 'twitch', 'setup', 'rgb'],
    travel: ['travel', 'packing', 'luggage', 'carry-on', 'backpack', 'essentials'],
    food: ['kitchen', 'cooking', 'chef', 'knife', 'pan', 'cookware', 'equipment'],
    fashion: ['fashion', 'wardrobe', 'outfit', 'style', 'closet', 'collection'],
    other: [],
  };

  const keywords = verticalKeywords[vertical] || [];
  const matchCount = keywords.filter(kw => title.includes(kw) || description.includes(kw)).length;
  score += Math.min(matchCount * 4, 20);

  return Math.min(score, 100);
}

/**
 * Check if video meets minimum quality threshold
 */
export function meetsQualityThreshold(video: YouTubeVideoItem, minViews: number = 10000): boolean {
  const views = parseInt(video.statistics?.viewCount || '0', 10);
  return views >= minViews;
}
