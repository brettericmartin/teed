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
    let imageBuffer: ArrayBuffer | Uint8Array = await response.arrayBuffer();

    // Verify we got actual image data (not a 1x1 pixel or empty response)
    if (imageBuffer.byteLength < 100) {
      console.error(`Proxy image returned tiny response (${imageBuffer.byteLength} bytes) for ${imageUrl}`);
      return NextResponse.json(
        { error: 'Image blocked or unavailable' },
        { status: 404 }
      );
    }

    let contentType = response.headers.get('content-type') || 'image/jpeg';

    // This proxied any public URL as-is (an HTML page came back with status 200); only images now.
    if (!contentType.startsWith('image/')) {
      return NextResponse.json({ error: 'Not an image' }, { status: 415 });
    }

    // ?w=<px>: resize for a thumbnail slot. Makers' CDNs serve 700 to 900 KB originals
    // that /for/golf-simulators and the list rows were loading into 56 to 400 px boxes.
    const width = Math.min(1600, Math.max(0, parseInt(searchParams.get('w') || '0', 10) || 0));
    if (width >= 16 && !contentType.includes('svg')) {
      try {
        const sharp = (await import('sharp')).default;
        const resized = await sharp(Buffer.from(imageBuffer), { animated: false })
          .rotate()
          .resize({ width, withoutEnlargement: true, fit: 'inside' })
          .webp({ quality: 78 })
          .toBuffer();
        imageBuffer = new Uint8Array(resized);
        contentType = 'image/webp';
      } catch (resizeError) {
        console.error(`Proxy image resize failed for ${imageUrl}:`, resizeError);
        // Fall through and serve the original
      }
    }

    // Return the image with appropriate headers
    return new NextResponse(imageBuffer as BodyInit, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, s-maxage=604800, stale-while-revalidate=86400',
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
