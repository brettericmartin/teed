/**
 * Research Agent
 *
 * Deep research on trending content for a category.
 * Searches YouTube, TikTok, and RSS feeds for gear content.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import OpenAI from 'openai';
import { searchYouTubeVideos, getVideoDetails } from '@/lib/contentIdeas/youtube';
import { fetchViaJinaReader } from '@/lib/linkIdentification/jinaReader';
import {
  getYouTubeTranscript,
  extractVideoId,
  prepareTranscriptForAnalysis,
} from '../sources/youtubeTranscript';
import {
  getCategoryConfig,
  getYouTubeSearchQueries,
  getBrandKeywords,
} from '../config';
import { findBestProductLinks } from '@/lib/services/SmartLinkFinder';
import type {
  DiscoveryCategory,
  DiscoveryRunConfig,
  ResearchResult,
  YouTubeResearchResult,
  DiscoveredProduct,
  ProductLink,
  DbDiscoverySource,
} from '../types';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ============================================================================
// YouTube Research
// ============================================================================

interface YouTubeVideo {
  id: string;
  title: string;
  description: string;
  channelTitle: string;
  channelId: string;
  publishedAt: string;
  thumbnails: { high?: { url: string } };
  statistics?: {
    viewCount?: string;
    likeCount?: string;
    commentCount?: string;
  };
  contentDetails?: {
    duration?: string;
  };
  tags?: string[];
}

/**
 * Search YouTube for TRENDING content (popular, viral videos)
 * Uses broader time window and filters by view count
 */
async function searchYouTubeTrending(
  category: DiscoveryCategory,
  config: DiscoveryRunConfig
): Promise<YouTubeVideo[]> {
  const queries = getYouTubeSearchQueries(category);
  const categoryConfig = getCategoryConfig(category);
  const allVideoIds = new Set<string>();

  // Search within last 60 days for trending content
  const publishedAfter = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString();

  // Search up to 8 queries for better coverage
  const queriesToSearch = queries.slice(0, 8);
  console.log(`[Research] Trending search: ${queriesToSearch.length} queries`);

  for (const query of queriesToSearch) {
    try {
      console.log(`[Research]   YouTube trending: "${query}"`);
      const results = await searchYouTubeVideos(query, {
        maxResults: 10,
        publishedAfter,
        order: 'viewCount',
      });

      console.log(`[Research]     Found ${results.length} results`);
      for (const item of results) {
        allVideoIds.add(item.id.videoId);
      }
    } catch (error) {
      console.error(`[Research] YouTube search error for query "${query}":`, error);
    }

    // Rate limit between queries
    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`[Research] Trending: ${allVideoIds.size} unique video IDs`);
  return fetchVideoDetails([...allVideoIds], categoryConfig.minVideoViews);
}

/**
 * Search YouTube for NEW RELEASES (recent product announcements)
 * Uses shorter time window and relevance-based search
 */
async function searchYouTubeNewReleases(
  category: DiscoveryCategory,
  config: DiscoveryRunConfig
): Promise<YouTubeVideo[]> {
  const categoryConfig = getCategoryConfig(category);
  const newReleaseQueries = categoryConfig.newReleaseQueries || [];
  const allVideoIds = new Set<string>();

  if (newReleaseQueries.length === 0) {
    return [];
  }

  // Search within last 14 days for new releases
  const publishedAfter = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

  console.log(`[Research] New releases search: ${newReleaseQueries.length} queries`);

  for (const query of newReleaseQueries.slice(0, 6)) {
    try {
      console.log(`[Research]   YouTube new releases: "${query}"`);
      // Search by relevance for new releases (not view count)
      const results = await searchYouTubeVideos(query, {
        maxResults: 8,
        publishedAfter,
        order: 'relevance',
      });

      console.log(`[Research]     Found ${results.length} results`);
      for (const item of results) {
        allVideoIds.add(item.id.videoId);
      }
    } catch (error) {
      console.error(`[Research] YouTube new release search error for "${query}":`, error);
    }

    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`[Research] New releases: ${allVideoIds.size} unique video IDs`);
  // Lower minimum views for new releases (content hasn't had time to accumulate views)
  return fetchVideoDetails([...allVideoIds], Math.floor(categoryConfig.minVideoViews / 5));
}

/**
 * Fetch videos from known reliable channels for this category
 */
async function searchYouTubeChannels(
  category: DiscoveryCategory,
  config: DiscoveryRunConfig
): Promise<YouTubeVideo[]> {
  const categoryConfig = getCategoryConfig(category);
  const channels = categoryConfig.youtubeChannels || [];
  const allVideoIds = new Set<string>();

  if (channels.length === 0) {
    return [];
  }

  // Get recent videos from the last 30 days
  const publishedAfter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

  console.log(`[Research] Channel search: ${channels.length} channels`);

  for (const channelId of channels.slice(0, 5)) {
    try {
      console.log(`[Research]   Searching channel: ${channelId}`);
      // Search for recent gear-related videos from this channel
      const results = await searchYouTubeVideos(`${categoryConfig.displayName} gear`, {
        maxResults: 5,
        publishedAfter,
        channelId,
        order: 'date',
      });

      console.log(`[Research]     Found ${results.length} recent videos`);
      for (const item of results) {
        allVideoIds.add(item.id.videoId);
      }
    } catch (error) {
      console.error(`[Research] Channel search error for ${channelId}:`, error);
    }

    await new Promise((r) => setTimeout(r, 300));
  }

  console.log(`[Research] Channels: ${allVideoIds.size} unique video IDs`);
  // Use lower view threshold for channel content (trusted sources)
  return fetchVideoDetails([...allVideoIds], Math.floor(categoryConfig.minVideoViews / 2));
}

/**
 * Helper to fetch full video details and filter by views
 * Batches requests in groups of 50 (YouTube API limit)
 */
async function fetchVideoDetails(
  videoIds: string[],
  minViews: number
): Promise<YouTubeVideo[]> {
  if (videoIds.length === 0) {
    return [];
  }

  try {
    // Batch video IDs in groups of 50 (YouTube API limit)
    const batches: string[][] = [];
    for (let i = 0; i < videoIds.length; i += 50) {
      batches.push(videoIds.slice(i, i + 50));
    }

    const allVideoDetails: YouTubeVideo[] = [];
    for (const batch of batches) {
      const videoDetails = await getVideoDetails(batch);
      const videos: YouTubeVideo[] = videoDetails.map((v) => ({
        id: v.id,
        title: v.snippet.title,
        description: v.snippet.description,
        channelTitle: v.snippet.channelTitle,
        channelId: v.snippet.channelId,
        publishedAt: v.snippet.publishedAt,
        thumbnails: v.snippet.thumbnails,
        statistics: v.statistics,
        contentDetails: v.contentDetails,
        tags: v.snippet.tags,
      }));
      allVideoDetails.push(...videos);
      // Small delay between batches
      if (batches.length > 1) {
        await new Promise((r) => setTimeout(r, 200));
      }
    }

    console.log(`[Research] Got details for ${allVideoDetails.length} videos`);

    // Filter by minimum views
    const filtered = allVideoDetails.filter((v) => {
      const views = parseInt(v.statistics?.viewCount || '0', 10);
      return views >= minViews;
    });

    console.log(`[Research] Videos after min views filter (${minViews}): ${filtered.length}`);

    // Sort by views descending
    return filtered.sort((a, b) => {
      const viewsA = parseInt(a.statistics?.viewCount || '0', 10);
      const viewsB = parseInt(b.statistics?.viewCount || '0', 10);
      return viewsB - viewsA;
    });
  } catch (error) {
    console.error('[Research] Error fetching video details:', error);
    return [];
  }
}

/**
 * Combined YouTube search - searches trending, new releases, and channels
 */
async function searchYouTubeForCategory(
  category: DiscoveryCategory,
  config: DiscoveryRunConfig
): Promise<YouTubeVideo[]> {
  const seenIds = new Set<string>();
  const allVideos: YouTubeVideo[] = [];

  // 1. Search for TRENDING content
  console.log('[Research] Phase 1: Trending content...');
  const trendingVideos = await searchYouTubeTrending(category, config);
  let addedTrending = 0;
  for (const video of trendingVideos) {
    if (!seenIds.has(video.id)) {
      seenIds.add(video.id);
      allVideos.push(video);
      addedTrending++;
    }
  }
  console.log(`[Research]   Added ${addedTrending} trending videos`);

  // 2. Search for NEW RELEASES
  console.log('[Research] Phase 2: New releases...');
  const newReleaseVideos = await searchYouTubeNewReleases(category, config);
  let addedNewReleases = 0;
  for (const video of newReleaseVideos) {
    if (!seenIds.has(video.id)) {
      seenIds.add(video.id);
      allVideos.push(video);
      addedNewReleases++;
    }
  }
  console.log(`[Research]   Added ${addedNewReleases} new release videos`);

  // 3. Search KNOWN CHANNELS
  console.log('[Research] Phase 3: Known channels...');
  const channelVideos = await searchYouTubeChannels(category, config);
  let addedChannelVideos = 0;
  for (const video of channelVideos) {
    if (!seenIds.has(video.id)) {
      seenIds.add(video.id);
      allVideos.push(video);
      addedChannelVideos++;
    }
  }
  console.log(`[Research]   Added ${addedChannelVideos} channel videos`);

  console.log(`[Research] Total unique videos: ${allVideos.length}`);

  // Limit to maxSources
  return allVideos.slice(0, config.maxSources || 15);
}

async function processYouTubeVideo(
  video: YouTubeVideo,
  category: DiscoveryCategory,
  config: DiscoveryRunConfig,
  recentProducts: string[] = []
): Promise<YouTubeResearchResult | null> {
  const brandKeywords = getBrandKeywords(category);

  // Get transcript
  const transcriptResult = await getYouTubeTranscript(video.id);
  const transcript = transcriptResult.success ? transcriptResult.transcript : '';

  // Prepare content for AI analysis
  const contentForAnalysis = transcript || video.description;
  const { potentialMentions } = prepareTranscriptForAnalysis(contentForAnalysis, brandKeywords);

  // Extract products using AI (with awareness of recent products)
  let products = await extractProductsWithAI(
    contentForAnalysis,
    video.title,
    category,
    potentialMentions,
    config.maxProductsPerSource || 15,
    recentProducts
  );

  if (products.length === 0) {
    return null;
  }

  // Enrich products with purchase links
  console.log(`[Research] Enriching ${products.length} products with purchase links...`);
  products = await enrichProductsWithLinks(products, category);

  // Generate theme from video title
  const theme = generateThemeFromTitle(video.title, category);

  return {
    category,
    sourceType: 'youtube',
    sourceUrl: `https://www.youtube.com/watch?v=${video.id}`,
    sourceTitle: video.title,
    sourceThumbnail: video.thumbnails.high?.url,
    transcript: transcript || undefined,
    products,
    theme,
    creatorName: video.channelTitle,
    publishedAt: new Date(video.publishedAt),
    viewCount: parseInt(video.statistics?.viewCount || '0', 10),
    discoveredAt: new Date(),
    videoId: video.id,
    channelName: video.channelTitle,
    channelId: video.channelId,
    duration: video.contentDetails?.duration || '',
    likeCount: parseInt(video.statistics?.likeCount || '0', 10),
    commentCount: parseInt(video.statistics?.commentCount || '0', 10),
    tags: video.tags,
  };
}

// ============================================================================
// TikTok Research (via web scraping)
// ============================================================================

async function searchTikTokForCategory(
  category: DiscoveryCategory,
  config: DiscoveryRunConfig
): Promise<ResearchResult[]> {
  // TikTok doesn't have a public API, so we use hashtag search pages via Jina Reader
  // This is limited but provides some coverage
  const results: ResearchResult[] = [];
  const categoryConfig = getCategoryConfig(category);

  for (const hashtag of categoryConfig.tiktokHashtags.slice(0, 2)) {
    try {
      const hashtagClean = hashtag.replace('#', '');
      const url = `https://www.tiktok.com/tag/${hashtagClean}`;

      const scraped = await fetchViaJinaReader(url);
      if (!scraped.success || !scraped.content) {
        continue;
      }

      // Extract product mentions from the page content
      const products = await extractProductsWithAI(
        scraped.content.slice(0, 10000),
        `TikTok ${hashtag} trending videos`,
        category,
        getBrandKeywords(category),
        5
      );

      if (products.length > 0) {
        results.push({
          category,
          sourceType: 'tiktok',
          sourceUrl: url,
          sourceTitle: `TikTok ${hashtag} Trending`,
          products,
          theme: `Trending on TikTok: ${hashtag}`,
          discoveredAt: new Date(),
        });
      }
    } catch (error) {
      console.error(`TikTok scrape error for ${category}:`, error);
    }

    await new Promise((r) => setTimeout(r, 1000));
  }

  return results;
}

// ============================================================================
// RSS Feed Research
// ============================================================================

async function fetchRSSFeeds(
  category: DiscoveryCategory,
  config: DiscoveryRunConfig
): Promise<ResearchResult[]> {
  const categoryConfig = getCategoryConfig(category);
  const results: ResearchResult[] = [];

  for (const feed of categoryConfig.releaseFeeds) {
    try {
      // Use Jina Reader to fetch and parse RSS
      const scraped = await fetchViaJinaReader(feed.url);
      if (!scraped.success || !scraped.content) {
        continue;
      }

      // Extract product mentions from feed content
      const products = await extractProductsWithAI(
        scraped.content.slice(0, 15000),
        `${feed.name} - Recent Articles`,
        category,
        getBrandKeywords(category),
        10
      );

      if (products.length > 0) {
        results.push({
          category,
          sourceType: 'rss',
          sourceUrl: feed.url,
          sourceTitle: `${feed.name} - Latest`,
          products,
          theme: `New from ${feed.name}`,
          creatorName: feed.name,
          discoveredAt: new Date(),
        });
      }
    } catch (error) {
      console.error(`RSS fetch error for ${feed.name}:`, error);
    }

    await new Promise((r) => setTimeout(r, 500));
  }

  return results;
}

// ============================================================================
// AI Product Extraction
// ============================================================================

async function extractProductsWithAI(
  content: string,
  sourceTitle: string,
  category: DiscoveryCategory,
  brandKeywords: string[],
  maxProducts: number,
  recentProducts: string[] = []
): Promise<DiscoveredProduct[]> {
  const categoryConfig = getCategoryConfig(category);

  // Build recent products section if we have any
  const recentProductsSection = recentProducts.length > 0
    ? `\n\nRECENTLY DISCOVERED (prioritize NEW products over these):
${recentProducts.slice(0, 30).join(', ')}

IMPORTANT: We've recently covered the products above. While it's okay to include 1-2 if they're truly notable in this content, PRIORITIZE products NOT in this list to keep our coverage fresh and varied.`
    : '';

  const prompt = `Analyze this content and extract specific products mentioned with RICH DETAILS.

SOURCE: ${sourceTitle}
CATEGORY: ${categoryConfig.displayName}
EXPECTED PRODUCT TYPES: ${categoryConfig.productTypes.join(', ')}
KNOWN BRANDS: ${brandKeywords.slice(0, 20).join(', ')}${recentProductsSection}

CONTENT:
${content.slice(0, 12000)}

Extract up to ${maxProducts} specific products. For EACH product, provide DETAILED information:

1. name - The EXACT product name with model (e.g., "TaylorMade Qi10 Max Driver", not just "TaylorMade driver")
2. brand - The manufacturer
3. description - A RICH description combining:
   - Key specs mentioned (loft, shaft, weight, size, etc.)
   - Technology features (what makes it work)
   - Target user (who it's for)
4. whyNotable - WHY this product stands out:
   - Is it new/trending/best-seller?
   - What problem does it solve?
   - How did the creator describe it?
5. specs - Key specifications as key-value pairs (extract ALL specs mentioned)
6. priceRange - Approximate price if mentioned (e.g., "$499", "$300-400", "premium")
7. confidence - How confident you are this is correctly identified (0-100)
8. isRepeat - true if in the RECENTLY DISCOVERED list, false otherwise

BE SPECIFIC AND DETAILED. Don't just say "great driver" - extract the actual specs and features that make it notable.

Only include products with 60+ confidence.
Skip generic mentions without specific model names.

Respond in JSON format:
{
  "products": [
    {
      "name": "TaylorMade Qi10 Max Driver",
      "brand": "TaylorMade",
      "description": "460cc driver with 60X Carbon Twist Face for increased ball speed. Features Inertia Generator for higher MOI and forgiveness on off-center hits. Available in 9°, 10.5°, and 12° lofts.",
      "whyNotable": "2024's most forgiving driver according to the review. Picked as 'Best for High Handicappers' due to massive sweet spot and draw bias.",
      "specs": {
        "Head Size": "460cc",
        "Loft Options": "9°, 10.5°, 12°",
        "Technology": "60X Carbon Twist Face, Inertia Generator",
        "Target Player": "High handicappers seeking forgiveness"
      },
      "priceRange": "$599",
      "confidence": 92,
      "isRepeat": false
    }
  ]
}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
    });

    const responseText = response.choices[0]?.message?.content || '{}';
    const parsed = JSON.parse(responseText);

    if (!parsed.products || !Array.isArray(parsed.products)) {
      return [];
    }

    return parsed.products
      .filter((p: any) => p.confidence >= 60)
      .slice(0, maxProducts)
      .map((p: any): DiscoveredProduct => ({
        name: p.name || '',
        brand: p.brand || '',
        description: p.description || '',
        whyNotable: p.whyNotable || '',
        confidence: p.confidence || 60,
        priceRange: p.priceRange || undefined,
        specs: p.specs || undefined,
      }));
  } catch (error) {
    console.error('AI product extraction error:', error);
    return [];
  }
}

/**
 * Enrich products with purchase links using SmartLinkFinder
 * This runs after AI extraction to find where to buy each product
 */
async function enrichProductsWithLinks(
  products: DiscoveredProduct[],
  category: DiscoveryCategory
): Promise<DiscoveredProduct[]> {
  const categoryConfig = getCategoryConfig(category);
  const enrichedProducts: DiscoveredProduct[] = [];

  for (const product of products) {
    try {
      // Find best purchase links
      const linkResult = await findBestProductLinks({
        name: product.name,
        brand: product.brand,
        category: categoryConfig.displayName,
      });

      // Convert to our ProductLink format
      const productLinks: ProductLink[] = linkResult.recommendations.map((rec) => ({
        url: rec.url,
        source: rec.source,
        label: rec.label,
        affiliatable: rec.affiliatable,
        priority: rec.priority,
      }));

      enrichedProducts.push({
        ...product,
        productLinks,
        buyUrl: linkResult.primaryLink?.url,
      });

      // Rate limit between link lookups
      await new Promise((r) => setTimeout(r, 200));
    } catch (error) {
      console.error(`[Research] Link enrichment error for ${product.name}:`, error);
      enrichedProducts.push(product); // Keep product without links
    }
  }

  return enrichedProducts;
}

function generateThemeFromTitle(title: string, category: DiscoveryCategory): string {
  // Clean up title for theme
  const cleaned = title
    .replace(/\[.*?\]/g, '')
    .replace(/\(.*?\)/g, '')
    .replace(/\|.*$/g, '')
    .trim();

  if (cleaned.length > 60) {
    return cleaned.slice(0, 57) + '...';
  }

  return cleaned || `${getCategoryConfig(category).displayName} Gear`;
}

// ============================================================================
// Deduplication Helpers
// ============================================================================

interface RecentSourceInfo {
  recentUrls: Set<string>;
  recentProducts: string[]; // "Brand Product Name" format
}

/**
 * Get recently processed sources and products to avoid repetition
 */
async function getRecentSourceInfo(
  category: DiscoveryCategory,
  config: DiscoveryRunConfig,
  supabase: SupabaseClient<any, any>
): Promise<RecentSourceInfo> {
  const recentUrls = new Set<string>();
  const recentProducts: string[] = [];

  const skipDays = config.skipSourcesFromLastNDays ?? 14;
  const skipRuns = config.skipSourcesFromLastNRuns ?? 2;

  // Get sources from last N days
  if (skipDays > 0) {
    const cutoffDate = new Date(Date.now() - skipDays * 24 * 60 * 60 * 1000).toISOString();
    const { data: recentSources } = await supabase
      .from('discovery_sources')
      .select('source_url')
      .eq('category', category)
      .gte('created_at', cutoffDate);

    for (const source of recentSources || []) {
      recentUrls.add(source.source_url);
    }
    console.log(`[Research] Found ${recentUrls.size} sources from last ${skipDays} days`);
  }

  // Get sources from last N runs
  if (skipRuns > 0) {
    const { data: recentRuns } = await supabase
      .from('discovery_runs')
      .select('id, started_at')
      .eq('category', category)
      .eq('status', 'completed')
      .order('started_at', { ascending: false })
      .limit(skipRuns);

    if (recentRuns && recentRuns.length > 0) {
      const oldestRunDate = recentRuns[recentRuns.length - 1].started_at;
      const { data: runSources } = await supabase
        .from('discovery_sources')
        .select('source_url')
        .eq('category', category)
        .gte('created_at', oldestRunDate);

      for (const source of runSources || []) {
        recentUrls.add(source.source_url);
      }
      console.log(`[Research] Total recent sources to skip: ${recentUrls.size}`);
    }
  }

  // Get recently discovered products (for awareness, not strict filtering)
  const productCutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentProductData } = await supabase
    .from('discovered_products')
    .select('product_name, brand, source_id')
    .gte('created_at', productCutoff);

  // Filter to only products from this category's sources
  if (recentProductData) {
    const { data: categorySources } = await supabase
      .from('discovery_sources')
      .select('id')
      .eq('category', category);

    const categorySourceIds = new Set((categorySources || []).map(s => s.id));

    for (const product of recentProductData) {
      if (categorySourceIds.has(product.source_id)) {
        const productKey = `${product.brand || ''} ${product.product_name}`.trim();
        if (!recentProducts.includes(productKey)) {
          recentProducts.push(productKey);
        }
      }
    }
  }
  console.log(`[Research] Found ${recentProducts.length} recently discovered products`);

  return { recentUrls, recentProducts };
}

// ============================================================================
// Main Research Function
// ============================================================================

export async function runResearch(
  category: DiscoveryCategory,
  config: DiscoveryRunConfig = {},
  supabase?: SupabaseClient<any, any>
): Promise<ResearchResult[]> {
  const results: ResearchResult[] = [];

  // Get deduplication info
  let recentInfo: RecentSourceInfo = { recentUrls: new Set(), recentProducts: [] };
  if (supabase && config.skipExisting !== false) {
    recentInfo = await getRecentSourceInfo(category, config, supabase);
  }

  const { recentUrls, recentProducts } = recentInfo;

  // YouTube Research
  if (config.youtubeEnabled !== false) {
    console.log(`[Research] Searching YouTube for ${category}...`);
    const videos = await searchYouTubeForCategory(category, config);

    let skippedCount = 0;
    for (const video of videos) {
      const url = `https://www.youtube.com/watch?v=${video.id}`;
      if (recentUrls.has(url)) {
        skippedCount++;
        continue;
      }

      const result = await processYouTubeVideo(video, category, config, recentProducts);
      if (result) {
        results.push(result);
        console.log(`[Research] Found ${result.products.length} products in: ${video.title}`);
      }

      // Rate limit
      await new Promise((r) => setTimeout(r, 1000));
    }
    if (skippedCount > 0) {
      console.log(`[Research] Skipped ${skippedCount} recently processed videos`);
    }
  }

  // TikTok Research
  if (config.tiktokEnabled !== false) {
    console.log(`[Research] Searching TikTok for ${category}...`);
    const tiktokResults = await searchTikTokForCategory(category, config);
    for (const result of tiktokResults) {
      if (!recentUrls.has(result.sourceUrl)) {
        results.push(result);
      }
    }
  }

  // RSS Feed Research
  if (config.rssEnabled !== false) {
    console.log(`[Research] Fetching RSS feeds for ${category}...`);
    const rssResults = await fetchRSSFeeds(category, config);
    for (const result of rssResults) {
      if (!recentUrls.has(result.sourceUrl)) {
        results.push(result);
      }
    }
  }

  console.log(`[Research] Complete. Found ${results.length} sources with products.`);
  return results;
}

// ============================================================================
// Database Persistence
// ============================================================================

// Maximum lengths for text fields to prevent "string did not match" errors
// These errors occur when payloads exceed Supabase/PostgREST limits
const MAX_TRANSCRIPT_LENGTH = 50000; // 50KB for transcripts
const MAX_DESCRIPTION_LENGTH = 5000; // 5KB for descriptions
const MAX_URL_LENGTH = 2048; // Standard URL limit

/**
 * Safely truncate text fields to prevent payload size errors
 */
function truncateText(text: string | undefined | null, maxLength: number): string | null {
  if (!text) return null;
  if (text.length <= maxLength) return text;
  // Truncate and add indicator
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Validate URL length and return null if too long
 */
function validateUrl(url: string | undefined | null): string | null {
  if (!url) return null;
  if (url.length > MAX_URL_LENGTH) {
    console.warn(`[Research] URL too long (${url.length} chars), skipping: ${url.slice(0, 100)}...`);
    return null;
  }
  return url;
}

export async function saveResearchResults(
  results: ResearchResult[],
  supabase: SupabaseClient<any, any>
): Promise<{ sourceIds: string[]; productCount: number }> {
  const sourceIds: string[] = [];
  let productCount = 0;

  for (const result of results) {
    // Truncate transcript to prevent payload size errors
    const truncatedTranscript = truncateText(result.transcript, MAX_TRANSCRIPT_LENGTH);
    if (result.transcript && result.transcript.length > MAX_TRANSCRIPT_LENGTH) {
      console.log(`[Research] Truncated transcript from ${result.transcript.length} to ${MAX_TRANSCRIPT_LENGTH} chars`);
    }

    // Insert source
    const { data: source, error: sourceError } = await supabase
      .from('discovery_sources')
      .insert({
        source_type: result.sourceType,
        source_url: result.sourceUrl,
        source_title: truncateText(result.sourceTitle, 500),
        category: result.category,
        transcript: truncatedTranscript,
        metadata: {
          theme: result.theme,
          creatorName: result.creatorName,
          publishedAt: result.publishedAt,
          viewCount: result.viewCount,
        },
      })
      .select('id')
      .single();

    if (sourceError) {
      // Log the actual error for debugging
      if (sourceError.message?.includes('already exists') || sourceError.code === '23505') {
        console.log(`[Research] Source already exists: ${result.sourceUrl}`);
      } else {
        console.error(`[Research] Source insert error for ${result.sourceUrl}:`, sourceError.message);
      }
      continue;
    }

    sourceIds.push(source.id);

    // Insert products with full enriched data including purchase links
    for (const product of result.products) {
      // Validate and truncate product fields
      const productData = {
        source_id: source.id,
        product_name: truncateText(product.name, 500) || 'Unknown Product',
        brand: truncateText(product.brand, 200),
        description: truncateText(product.description, MAX_DESCRIPTION_LENGTH),
        why_notable: truncateText(product.whyNotable, 2000),
        source_link: validateUrl(product.sourceLink),
        image_url: validateUrl(product.imageUrl),
        confidence: product.confidence,
        specs: product.specs || null,
        price_range: truncateText(product.priceRange, 100),
        product_links: product.productLinks || [],
        buy_url: validateUrl(product.buyUrl),
        review_status: 'pending', // Start in pending review state
      };

      const { error: productError } = await supabase
        .from('discovered_products')
        .insert(productData);

      if (productError) {
        console.error(`[Research] Product insert error for ${product.name}:`, productError.message);
        // Continue with other products instead of failing completely
      } else {
        productCount++;
      }
    }
  }

  return { sourceIds, productCount };
}
