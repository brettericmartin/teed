import { NextRequest, NextResponse } from 'next/server';
import { validateExternalUrl } from '@/lib/urlValidation';

/**
 * Proxy images to avoid CORS issues
 * GET /api/proxy-image?url=<encoded_url>
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const imageUrl = searchParams.get('url');

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'URL parameter is required' },
        { status: 400 }
      );
    }

    // Validate URL is not targeting internal/private resources (SSRF protection)
    const urlError = validateExternalUrl(imageUrl);
    if (urlError) {
      return NextResponse.json(
        { error: 'Invalid image URL' },
        { status: 400 }
      );
    }

    // Check if this is an Amazon URL - they require browser-like user agents
    const isAmazonUrl = imageUrl.includes('amazon') ||
      imageUrl.includes('media-amazon.com') ||
      imageUrl.includes('amazon-adsystem.com');

    // Use browser-like user agent for Amazon, simpler for others
    const userAgent = isAmazonUrl
      ? 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
      : 'Mozilla/5.0 (compatible; TeedBot/1.0)';

    // Fetch the image with appropriate headers
    const response = await fetch(imageUrl, {
      redirect: 'follow',
      headers: {
        'User-Agent': userAgent,
        'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': isAmazonUrl ? 'https://www.amazon.com/' : '',
      },
    });

    if (!response.ok) {
      console.error(`Proxy image failed for ${imageUrl}: HTTP ${response.status}`);
      return NextResponse.json(
        { error: 'Failed to fetch image' },
        { status: response.status }
      );
    }

    // Get the image data
    const imageBuffer = await response.arrayBuffer();

    // Verify we got actual image data (not a 1x1 pixel or empty response)
    if (imageBuffer.byteLength < 100) {
      console.error(`Proxy image returned tiny response (${imageBuffer.byteLength} bytes) for ${imageUrl}`);
      return NextResponse.json(
        { error: 'Image blocked or unavailable' },
        { status: 404 }
      );
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg';

    // Return the image with appropriate headers
    return new NextResponse(imageBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400', // Cache for 24 hours
      },
    });
  } catch (error: any) {
    console.error('Proxy image error:', error);
    return NextResponse.json(
      { error: 'Failed to proxy image' },
      { status: 500 }
    );
  }
}
