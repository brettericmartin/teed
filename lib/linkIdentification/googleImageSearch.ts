/**
 * Google Image Search Module
 *
 * Searches Google Images for product photos when direct scraping fails.
 * Used as a fallback when sites block scraping.
 */

interface GoogleSearchResult {
  link: string;
  title?: string;
  image?: {
    thumbnailLink?: string;
    contextLink?: string;
  };
}

/**
 * Search Google Images for a product
 * Returns array of image URLs
 */
export async function searchGoogleImages(query: string, limit: number = 5): Promise<string[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !searchEngineId) {
    console.log('[googleImageSearch] API key or search engine ID not configured');
    return [];
  }

  if (!query || query.trim().length < 3) {
    return [];
  }

  try {
    const searchParams = new URLSearchParams({
      key: apiKey,
      cx: searchEngineId,
      q: query.trim(),
      searchType: 'image',
      num: String(Math.min(limit, 10)),
      imgSize: 'large', // Prefer larger images for product photos
      imgType: 'photo',
      safe: 'active',
    });

    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?${searchParams.toString()}`
    );

    if (!response.ok) {
      console.log('[googleImageSearch] API error:', response.status);
      return [];
    }

    const data = await response.json();
    const results: GoogleSearchResult[] = data.items || [];

    // Filter and return image URLs
    return results
      .map((item) => item.link)
      .filter((url): url is string => {
        if (!url) return false;
        // Filter out problematic URLs
        if (url.includes('gstatic.com')) return false;
        if (url.includes('googleusercontent.com')) return false;
        // Accept any URL that looks like an image
        return true;
      })
      .slice(0, limit);
  } catch (error) {
    console.error('[googleImageSearch] Error:', error);
    return [];
  }
}

/**
 * Build a search query for a golf product
 */
export function buildProductSearchQuery(brand: string | null, productName: string): string {
  const parts: string[] = [];

  if (brand) {
    parts.push(brand);
  }

  if (productName) {
    parts.push(productName);
  }

  // Add "golf" if it seems like a golf product
  const golfTerms = ['driver', 'putter', 'iron', 'wedge', 'hybrid', 'fairway', 'wood', 'ball', 'bag'];
  const nameLower = productName.toLowerCase();
  const hasGolfTerm = golfTerms.some(term => nameLower.includes(term));

  if (hasGolfTerm && !nameLower.includes('golf')) {
    parts.push('golf');
  }

  // Add "product image" to help get cleaner results
  parts.push('product');

  return parts.join(' ');
}
