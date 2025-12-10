import { NextRequest, NextResponse } from 'next/server';
import { trackApiUsage } from '@/lib/apiUsageTracker';

/**
 * Find product images using Google Custom Search API
 *
 * POST /api/ai/find-product-image
 * Body: { query: string }
 * Returns: { images: string[] }
 */

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  try {
    const body = await request.json();
    const { query } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required' },
        { status: 400 }
      );
    }

    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

    if (!apiKey || !searchEngineId) {
      console.error('Google Custom Search API not configured', {
        hasApiKey: !!apiKey,
        hasSearchEngineId: !!searchEngineId,
        apiKeyLength: apiKey?.length || 0,
        searchEngineIdLength: searchEngineId?.length || 0,
      });
      return NextResponse.json(
        { error: 'Image search is not configured. Please contact support.' },
        { status: 503 }
      );
    }

    console.log('Starting image search for query:', query);

    // Use Google Custom Search API to find product images
    const searchParams = new URLSearchParams({
      key: apiKey,
      cx: searchEngineId,
      q: query.trim(),
      searchType: 'image',
      num: '10', // Get 10 results to pick from
      imgSize: 'medium', // Medium size images
      imgType: 'photo', // Only photos, not clipart
      safe: 'active', // Family-safe results
    });

    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?${searchParams.toString()}`
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      console.error('Google Image Search error:', {
        status: response.status,
        statusText: response.statusText,
        error,
        query: query.trim(),
      });

      // Handle quota exceeded
      if (response.status === 429) {
        return NextResponse.json(
          { error: 'Image search quota exceeded. Please try again later.' },
          { status: 429 }
        );
      }

      // Handle invalid API key
      if (response.status === 400 && error.error?.message?.includes('API key')) {
        return NextResponse.json(
          { error: 'Google API key is invalid. Please check configuration.' },
          { status: 503 }
        );
      }

      return NextResponse.json(
        {
          error: 'Failed to search for images',
          details: error.error?.message || 'Unknown error',
        },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Extract image URLs
    if (!data.items || data.items.length === 0) {
      console.log('No images found for query:', query);
      return NextResponse.json({
        images: [],
        message: 'No images found for this product',
      });
    }

    // Return array of image URLs
    const images = data.items.map((item: any) => item.link);
    console.log(`Found ${images.length} images for query:`, query);

    // Track API usage - Google Custom Search ($5 per 1000 queries)
    const durationMs = Date.now() - startTime;
    trackApiUsage({
      userId: null,
      endpoint: '/api/ai/find-product-image',
      model: 'google-search',
      operationType: 'search',
      durationMs,
      status: 'success',
    }).catch(console.error);

    return NextResponse.json({
      images,
      count: images.length,
    });

  } catch (error: any) {
    console.error('Find product image error:', error);

    // Track error
    trackApiUsage({
      userId: null,
      endpoint: '/api/ai/find-product-image',
      model: 'google-search',
      operationType: 'search',
      durationMs: Date.now() - startTime,
      status: error?.status === 429 ? 'rate_limited' : 'error',
      errorCode: error?.code,
      errorMessage: error?.message,
    }).catch(console.error);

    return NextResponse.json(
      { error: error.message || 'Failed to find product images' },
      { status: 500 }
    );
  }
}
