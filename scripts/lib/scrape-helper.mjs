/**
 * Helper for bag creation scripts to auto-extract metadata from URLs
 * Uses the /api/scrape-url endpoint for YouTube thumbnails, product images, etc.
 */

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

/**
 * Scrape URL metadata using the Teed API
 * @param {string} url - URL to scrape
 * @returns {Promise<{title: string, description: string, image: string, price: string, brand: string, videoType: string, videoId: string}>}
 */
export async function scrapeUrl(url) {
  try {
    const response = await fetch(`${BASE_URL}/api/scrape-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });

    if (!response.ok) {
      console.warn(`Scrape failed for ${url}: ${response.status}`);
      return null;
    }

    return response.json();
  } catch (error) {
    console.warn(`Scrape error for ${url}:`, error.message);
    return null;
  }
}

/**
 * Extract YouTube video ID from URL
 * @param {string} url - YouTube URL
 * @returns {string|null} - Video ID or null
 */
export function extractYouTubeId(url) {
  const patterns = [
    /youtube\.com\/watch\?v=([^&]+)/,
    /youtu\.be\/([^?]+)/,
    /youtube\.com\/embed\/([^?]+)/
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

/**
 * Get YouTube thumbnail URL
 * @param {string} videoId - YouTube video ID
 * @returns {string} - Thumbnail URL
 */
export function getYouTubeThumbnail(videoId) {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
}

/**
 * Process item with auto-scraped metadata
 * @param {object} item - Item with url property
 * @returns {Promise<object>} - Item with photo_url added if available
 */
export async function enrichItemWithMetadata(item) {
  if (!item.url) return item;

  // Fast path for YouTube - don't need to call API
  const youtubeId = extractYouTubeId(item.url);
  if (youtubeId) {
    return {
      ...item,
      photo_url: item.photo_url || getYouTubeThumbnail(youtubeId)
    };
  }

  // For other URLs, call the scrape API
  const metadata = await scrapeUrl(item.url);
  if (metadata) {
    return {
      ...item,
      photo_url: item.photo_url || metadata.image,
      // Optionally fill in other fields if not set
      brand: item.brand || metadata.brand,
      custom_name: item.custom_name || metadata.title
    };
  }

  return item;
}

/**
 * Process multiple items in parallel with rate limiting
 * @param {object[]} items - Array of items
 * @param {number} concurrency - Max parallel requests (default 3)
 * @returns {Promise<object[]>} - Enriched items
 */
export async function enrichItemsWithMetadata(items, concurrency = 3) {
  const results = [];

  for (let i = 0; i < items.length; i += concurrency) {
    const batch = items.slice(i, i + concurrency);
    const enriched = await Promise.all(batch.map(enrichItemWithMetadata));
    results.push(...enriched);
  }

  return results;
}
