import { NextRequest, NextResponse } from 'next/server';
import { trackApiUsage } from '@/lib/apiUsageTracker';

/**
 * Extract product images from a given URL by fetching the page and parsing Open Graph / meta images
 *
 * POST /api/ai/extract-product-images
 * Body: { url: string, productName?: string, brand?: string }
 * Returns: { images: string[], source: 'og' | 'meta' | 'google' }
 */

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let usedGoogleSearch = false;
  try {
    const body = await request.json();
    const { url, productName, brand } = body;

    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    console.log('[extract-product-images] Extracting images from:', url);

    const images: string[] = [];
    let source: 'og' | 'meta' | 'google' = 'og';

    try {
      // Try to fetch the product page and extract images
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        },
        redirect: 'follow',
      });

      if (response.ok) {
        const html = await response.text();

        // Extract Open Graph image
        const ogImageMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
        if (ogImageMatch && ogImageMatch[1]) {
          const ogImage = resolveUrl(ogImageMatch[1], url);
          if (ogImage && isValidImageUrl(ogImage)) {
            images.push(ogImage);
          }
        }

        // Try alternate og:image format
        const ogImageAltMatch = html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
        if (ogImageAltMatch && ogImageAltMatch[1] && !images.includes(resolveUrl(ogImageAltMatch[1], url))) {
          const ogImageAlt = resolveUrl(ogImageAltMatch[1], url);
          if (ogImageAlt && isValidImageUrl(ogImageAlt)) {
            images.push(ogImageAlt);
          }
        }

        // Extract Twitter card image
        const twitterImageMatch = html.match(/<meta\s+(?:name|property)=["']twitter:image(?::src)?["']\s+content=["']([^"']+)["']/i);
        if (twitterImageMatch && twitterImageMatch[1]) {
          const twitterImage = resolveUrl(twitterImageMatch[1], url);
          if (twitterImage && isValidImageUrl(twitterImage) && !images.includes(twitterImage)) {
            images.push(twitterImage);
            source = 'meta';
          }
        }

        // Extract product images from JSON-LD
        const jsonLdMatches = html.matchAll(/<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
        for (const match of jsonLdMatches) {
          try {
            const jsonLd = JSON.parse(match[1]);
            const productImages = extractImagesFromJsonLd(jsonLd, url);
            for (const img of productImages) {
              if (isValidImageUrl(img) && !images.includes(img)) {
                images.push(img);
              }
            }
          } catch (e) {
            // JSON parse error, skip
          }
        }

        // Extract product images from common patterns
        const productImagePatterns = [
          /<img[^>]+class=["'][^"']*product[^"']*["'][^>]+src=["']([^"']+)["']/gi,
          /<img[^>]+src=["']([^"']+)["'][^>]+class=["'][^"']*product[^"']*["']/gi,
          /<img[^>]+data-src=["']([^"']+)["'][^>]+class=["'][^"']*product[^"']*["']/gi,
          /<img[^>]+class=["'][^"']*gallery[^"']*["'][^>]+src=["']([^"']+)["']/gi,
          /<img[^>]+class=["'][^"']*main[^"']*["'][^>]+src=["']([^"']+)["']/gi,
        ];

        for (const pattern of productImagePatterns) {
          const matches = html.matchAll(pattern);
          for (const match of matches) {
            if (match[1]) {
              const imgUrl = resolveUrl(match[1], url);
              if (imgUrl && isValidImageUrl(imgUrl) && !images.includes(imgUrl) && images.length < 6) {
                images.push(imgUrl);
                source = 'meta';
              }
            }
          }
        }
      }
    } catch (fetchError) {
      console.log('[extract-product-images] Could not fetch URL, will fall back to Google:', fetchError);
    }

    // If we didn't find images from the URL, fall back to Google Image Search
    if (images.length === 0 && (productName || brand)) {
      console.log('[extract-product-images] No images found from URL, falling back to Google Image Search');

      const query = [brand, productName].filter(Boolean).join(' ');
      const googleImages = await searchGoogleImages(query);

      if (googleImages.length > 0) {
        images.push(...googleImages);
        source = 'google';
        usedGoogleSearch = true;
      }
    }

    console.log(`[extract-product-images] Found ${images.length} images from ${source}`);

    // Track API usage (only if Google search was used)
    if (usedGoogleSearch) {
      const durationMs = Date.now() - startTime;
      trackApiUsage({
        userId: null,
        endpoint: '/api/ai/extract-product-images',
        model: 'google-search',
        operationType: 'search',
        durationMs,
        status: 'success',
      }).catch(console.error);
    }

    return NextResponse.json({
      images: images.slice(0, 6),
      source,
      url,
    });

  } catch (error: any) {
    console.error('[extract-product-images] Error:', error);

    // Track error only if Google search was attempted
    if (usedGoogleSearch) {
      trackApiUsage({
        userId: null,
        endpoint: '/api/ai/extract-product-images',
        model: 'google-search',
        operationType: 'search',
        durationMs: Date.now() - startTime,
        status: error?.status === 429 ? 'rate_limited' : 'error',
        errorCode: error?.code,
        errorMessage: error?.message,
      }).catch(console.error);
    }

    return NextResponse.json(
      { error: error.message || 'Failed to extract product images' },
      { status: 500 }
    );
  }
}

function resolveUrl(imageUrl: string, baseUrl: string): string {
  try {
    if (imageUrl.startsWith('http://') || imageUrl.startsWith('https://')) {
      return imageUrl;
    }
    if (imageUrl.startsWith('//')) {
      return 'https:' + imageUrl;
    }
    const base = new URL(baseUrl);
    if (imageUrl.startsWith('/')) {
      return base.origin + imageUrl;
    }
    return new URL(imageUrl, baseUrl).href;
  } catch {
    return '';
  }
}

function isValidImageUrl(url: string): boolean {
  if (!url) return false;

  // Check if it's a valid URL
  try {
    new URL(url);
  } catch {
    return false;
  }

  // Filter out common non-product images
  const lowerUrl = url.toLowerCase();
  const excludePatterns = [
    'logo', 'icon', 'favicon', 'placeholder', 'loading', 'spinner',
    'badge', 'banner', 'avatar', 'profile', 'social', 'share',
    '1x1', 'pixel', 'tracking', 'spacer', 'blank'
  ];

  for (const pattern of excludePatterns) {
    if (lowerUrl.includes(pattern)) {
      return false;
    }
  }

  // Must look like an image
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];
  const hasImageExtension = imageExtensions.some(ext => lowerUrl.includes(ext));
  const hasImageInPath = lowerUrl.includes('/image') || lowerUrl.includes('/img') || lowerUrl.includes('/product');

  return hasImageExtension || hasImageInPath || url.includes('cdn') || url.includes('cloudinary');
}

function extractImagesFromJsonLd(jsonLd: any, baseUrl: string): string[] {
  const images: string[] = [];

  if (Array.isArray(jsonLd)) {
    for (const item of jsonLd) {
      images.push(...extractImagesFromJsonLd(item, baseUrl));
    }
    return images;
  }

  // Handle Product schema
  if (jsonLd['@type'] === 'Product' || jsonLd['@type'] === 'product') {
    if (jsonLd.image) {
      if (typeof jsonLd.image === 'string') {
        images.push(resolveUrl(jsonLd.image, baseUrl));
      } else if (Array.isArray(jsonLd.image)) {
        for (const img of jsonLd.image) {
          if (typeof img === 'string') {
            images.push(resolveUrl(img, baseUrl));
          } else if (img.url) {
            images.push(resolveUrl(img.url, baseUrl));
          }
        }
      } else if (jsonLd.image.url) {
        images.push(resolveUrl(jsonLd.image.url, baseUrl));
      }
    }
  }

  // Handle @graph structure
  if (jsonLd['@graph'] && Array.isArray(jsonLd['@graph'])) {
    images.push(...extractImagesFromJsonLd(jsonLd['@graph'], baseUrl));
  }

  return images.filter(Boolean);
}

async function searchGoogleImages(query: string): Promise<string[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !searchEngineId) {
    console.log('[extract-product-images] Google API not configured');
    return [];
  }

  try {
    const searchParams = new URLSearchParams({
      key: apiKey,
      cx: searchEngineId,
      q: query.trim(),
      searchType: 'image',
      num: '6',
      imgSize: 'medium',
      imgType: 'photo',
      safe: 'active',
    });

    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?${searchParams.toString()}`
    );

    if (!response.ok) {
      console.error('[extract-product-images] Google search failed:', response.status);
      return [];
    }

    const data = await response.json();
    return (data.items || []).map((item: any) => item.link);
  } catch (error) {
    console.error('[extract-product-images] Google search error:', error);
    return [];
  }
}
