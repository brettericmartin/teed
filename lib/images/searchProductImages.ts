import { trackApiUsage } from '@/lib/apiUsageTracker';

/**
 * Google image search for a product, server side. The same search as
 * /api/ai/find-product-image, for callers that already run on the server
 * (Enhance details offers a few photos next to its other suggestions).
 * Never throws; returns [] when search isn't configured or fails.
 */
export async function searchProductImages(query: string, limit = 6): Promise<string[]> {
  const q = query.trim();
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;
  if (!q || !apiKey || !searchEngineId) return [];

  const startTime = Date.now();
  try {
    const params = new URLSearchParams({
      key: apiKey,
      cx: searchEngineId,
      q,
      searchType: 'image',
      num: String(Math.min(Math.max(limit, 1), 10)),
      imgSize: 'large',
      imgType: 'photo',
      safe: 'active',
    });
    const response = await fetch(`https://www.googleapis.com/customsearch/v1?${params.toString()}`, {
      signal: AbortSignal.timeout(8000),
    });
    trackApiUsage({
      userId: null,
      endpoint: '/api/items/preview-enrichment#images',
      model: 'google-search',
      operationType: 'search',
      durationMs: Date.now() - startTime,
      status: response.ok ? 'success' : response.status === 429 ? 'rate_limited' : 'error',
    }).catch(() => {});
    if (!response.ok) return [];

    const data = await response.json();
    const items: Array<{ link?: string; image?: { width?: number; height?: number } }> = data.items || [];
    return items
      .filter((item) => typeof item.link === 'string' && item.link.startsWith('https://'))
      .map((item) => ({
        url: item.link as string,
        shortSide: Math.min(item.image?.width || 0, item.image?.height || 0),
      }))
      // Images at least 400px on the short side first, then the larger ones
      .sort((a, b) => (Number(b.shortSide >= 400) - Number(a.shortSide >= 400)) || b.shortSide - a.shortSide)
      .map((item) => item.url)
      .slice(0, limit);
  } catch (error) {
    console.error('[searchProductImages] failed:', error);
    return [];
  }
}
