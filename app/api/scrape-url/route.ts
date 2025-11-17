import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface ScrapedMetadata {
  title: string | null;
  description: string | null;
  image: string | null;
  price: string | null;
  domain: string;
  url: string;
}

/**
 * POST /api/scrape-url
 * Scrapes a product URL and extracts metadata
 *
 * Body: { url: string }
 * Returns: ScrapedMetadata
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { url } = body;

    // Validate URL
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URL is required' },
        { status: 400 }
      );
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);
    } catch (error) {
      return NextResponse.json(
        { error: 'Invalid URL format' },
        { status: 400 }
      );
    }

    // Fetch the URL
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      // Don't follow redirects infinitely
      redirect: 'follow',
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch URL: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract metadata using multiple strategies
    const metadata: ScrapedMetadata = {
      title: null,
      description: null,
      image: null,
      price: null,
      domain: parsedUrl.hostname.replace('www.', ''),
      url,
    };

    // Title - try multiple sources
    metadata.title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('meta[property="product:title"]').attr('content') ||
      $('h1').first().text().trim() ||
      $('title').text().trim() ||
      null;

    // Description
    metadata.description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="twitter:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      $('meta[property="product:description"]').attr('content') ||
      null;

    // Image
    let imageUrl =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('meta[property="product:image"]').attr('content') ||
      $('img[itemprop="image"]').attr('src') ||
      null;

    // Make image URL absolute if relative
    if (imageUrl && !imageUrl.startsWith('http')) {
      imageUrl = new URL(imageUrl, url).href;
    }
    metadata.image = imageUrl;

    // Price - try multiple selectors for different sites
    const priceSelectors = [
      'meta[property="og:price:amount"]',
      'meta[property="product:price:amount"]',
      'span[itemprop="price"]',
      '.price',
      '[class*="price"]',
      '#price',
      'span.a-price-whole', // Amazon
      'span.a-offscreen', // Amazon
    ];

    for (const selector of priceSelectors) {
      const priceElement = $(selector);
      if (priceElement.length > 0) {
        const priceText = priceElement.attr('content') || priceElement.text();
        // Extract just the numeric price
        const priceMatch = priceText.match(/[\d,]+\.?\d*/);
        if (priceMatch) {
          metadata.price = priceMatch[0].replace(/,/g, '');
          break;
        }
      }
    }

    // Clean up the data
    if (metadata.title) {
      // Remove site name from title if present
      metadata.title = metadata.title
        .replace(/\s*[-|–]\s*Amazon.*$/i, '')
        .replace(/\s*[-|–]\s*eBay.*$/i, '')
        .replace(/\s*[-|–]\s*Walmart.*$/i, '')
        .trim();

      // Limit length
      if (metadata.title.length > 150) {
        metadata.title = metadata.title.substring(0, 147) + '...';
      }
    }

    if (metadata.description && metadata.description.length > 500) {
      metadata.description = metadata.description.substring(0, 497) + '...';
    }

    return NextResponse.json(metadata, { status: 200 });
  } catch (error) {
    console.error('Error scraping URL:', error);
    return NextResponse.json(
      {
        error: 'Failed to scrape URL',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
