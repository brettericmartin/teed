import { NextRequest, NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

interface ScrapedMetadata {
  title: string | null;
  description: string | null;
  image: string | null;
  price: string | null;
  domain: string;
  url: string;
  brand: string | null;
  videoType?: 'youtube' | 'tiktok' | 'instagram';
  videoId?: string;
}

// Map of domains to brand names for brand-owned stores
const DOMAIN_TO_BRAND: Record<string, string> = {
  'goodgoodgolf.com': 'Good Good Golf',
  'taylormadegolf.com': 'TaylorMade',
  'callawaygolf.com': 'Callaway',
  'titleist.com': 'Titleist',
  'ping.com': 'Ping',
  'cobragolf.com': 'Cobra',
  'mizunogolf.com': 'Mizuno',
  'srixon.com': 'Srixon',
  'clevelandgolf.com': 'Cleveland',
  'bridgestonegolf.com': 'Bridgestone',
  'vokey.com': 'Titleist',
  'scottycameron.com': 'Titleist',
  'footjoy.com': 'FootJoy',
  'pumagolf.com': 'Puma',
  'nikegolf.com': 'Nike',
  'adidas.com': 'Adidas',
  'underarmour.com': 'Under Armour',
  'travismatthew.com': 'TravisMathew',
  'johnnieobrand.com': 'Johnnie-O',
  'gfore.com': 'G/FORE',
  'malbon.com': 'Malbon Golf',
  'birddog.com': 'Birddogs',
  'melin.com': 'Melin',
  'skechersperformance.com': 'Skechers',
  'ecco.com': 'ECCO',
  'truegolf.com': 'TRUE Linkswear',
  'sunjoy.com': 'Sun Joy',
  'truespec.com': 'True Spec',
  'pxg.com': 'PXG',
  'honma.com': 'Honma',
  'xxio.com': 'XXIO',
  'wilson.com': 'Wilson',
  'topflite.com': 'Top Flite',
  'volvikusa.com': 'Volvik',
  'vicegolf.com': 'Vice Golf',
  'seedgolf.com': 'Seed Golf',
  'oncore.golf': 'OnCore',
  'kirklandgolf.com': 'Kirkland Signature',
  'bushnellgolf.com': 'Bushnell',
  'garmin.com': 'Garmin',
  'voicecaddie.com': 'Voice Caddie',
  'shotscope.com': 'Shot Scope',
  'arccos.com': 'Arccos',
  'skytrak.com': 'SkyTrak',
  'flightscope.com': 'FlightScope',
  'trackman.com': 'TrackMan',
  'sunmountain.com': 'Sun Mountain',
  'oikiogolf.com': 'Ogio',
  'jones-sports.com': 'Jones Sports',
  'vesselgolf.com': 'Vessel',
  'stitch.com': 'Stitch',
  'titleist-cart-bags.com': 'Titleist',
  'superstroke.com': 'SuperStroke',
  'golfpride.com': 'Golf Pride',
  'lamkingrips.com': 'Lamkin',
  'karma.golf': 'Karma',
  'winn.com': 'Winn',
};

// Known golf brands to detect in text
const KNOWN_BRANDS = [
  'TaylorMade', 'Callaway', 'Titleist', 'Ping', 'Cobra', 'Mizuno', 'Srixon', 'Cleveland',
  'Bridgestone', 'FootJoy', 'Puma', 'Nike', 'Adidas', 'Under Armour', 'TravisMathew',
  'Johnnie-O', 'G/FORE', 'Malbon Golf', 'Good Good Golf', 'Birddogs', 'Melin', 'Skechers',
  'ECCO', 'TRUE Linkswear', 'PXG', 'Honma', 'XXIO', 'Wilson', 'Vice Golf', 'Bushnell',
  'Garmin', 'Arccos', 'Sun Mountain', 'Ogio', 'Jones Sports', 'Vessel', 'Stitch',
  'SuperStroke', 'Golf Pride', 'Lamkin', 'Scotty Cameron', 'Vokey'
];

// Extract brand from URL domain
function extractBrandFromUrl(url: string): string | null {
  try {
    const hostname = new URL(url).hostname.replace('www.', '');
    return DOMAIN_TO_BRAND[hostname] || null;
  } catch {
    return null;
  }
}

// Extract brand from text by matching known brands
function extractBrandFromText(text: string): string | null {
  if (!text) return null;
  const textLower = text.toLowerCase();
  for (const brand of KNOWN_BRANDS) {
    if (textLower.includes(brand.toLowerCase())) {
      return brand;
    }
  }
  return null;
}

// Video platform detection helpers
function extractYouTubeVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/shorts\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractTikTokVideoId(url: string): string | null {
  // TikTok URLs: tiktok.com/@user/video/VIDEO_ID or vm.tiktok.com/VIDEO_ID
  const patterns = [
    /tiktok\.com\/@[^/]+\/video\/(\d+)/,
    /tiktok\.com\/t\/([a-zA-Z0-9]+)/,
    /vm\.tiktok\.com\/([a-zA-Z0-9]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractInstagramPostId(url: string): string | null {
  // Instagram: instagram.com/p/POST_ID or instagram.com/reel/REEL_ID
  const match = url.match(/instagram\.com\/(?:p|reel|reels)\/([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

function isVideoUrl(url: string): { type: 'youtube' | 'tiktok' | 'instagram'; id: string } | null {
  const youtubeId = extractYouTubeVideoId(url);
  if (youtubeId) return { type: 'youtube', id: youtubeId };

  const tiktokId = extractTikTokVideoId(url);
  if (tiktokId) return { type: 'tiktok', id: tiktokId };

  const instagramId = extractInstagramPostId(url);
  if (instagramId) return { type: 'instagram', id: instagramId };

  return null;
}

async function fetchYouTubeMetadata(url: string, videoId: string): Promise<Partial<ScrapedMetadata>> {
  try {
    // Use oEmbed API for title
    const oembedUrl = `https://www.youtube.com/oembed?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl);

    if (response.ok) {
      const data = await response.json();
      return {
        title: data.title || null,
        description: `Video by ${data.author_name || 'YouTube'}`,
        image: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
        domain: 'youtube.com',
        brand: data.author_name || 'YouTube',
        videoType: 'youtube',
        videoId,
      };
    }
  } catch (e) {
    console.error('YouTube oEmbed error:', e);
  }

  // Fallback - just return thumbnail
  return {
    title: null,
    image: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    domain: 'youtube.com',
    videoType: 'youtube',
    videoId,
  };
}

async function fetchTikTokMetadata(url: string, videoId: string): Promise<Partial<ScrapedMetadata>> {
  try {
    const oembedUrl = `https://www.tiktok.com/oembed?url=${encodeURIComponent(url)}`;
    const response = await fetch(oembedUrl);

    if (response.ok) {
      const data = await response.json();
      return {
        title: data.title || null,
        description: `Video by @${data.author_name || 'TikTok'}`,
        image: data.thumbnail_url || null,
        domain: 'tiktok.com',
        brand: data.author_name ? `@${data.author_name}` : 'TikTok',
        videoType: 'tiktok',
        videoId,
      };
    }
  } catch (e) {
    console.error('TikTok oEmbed error:', e);
  }

  return {
    title: null,
    domain: 'tiktok.com',
    videoType: 'tiktok',
    videoId,
  };
}

async function fetchInstagramMetadata(url: string, postId: string): Promise<Partial<ScrapedMetadata>> {
  // Instagram's oEmbed requires authentication, so we'll fall back to scraping
  return {
    title: null,
    domain: 'instagram.com',
    videoType: 'instagram',
    videoId: postId,
  };
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

    // Check if this is a video URL (YouTube, TikTok, Instagram)
    const videoInfo = isVideoUrl(url);
    if (videoInfo) {
      let videoMetadata: Partial<ScrapedMetadata> = {};

      switch (videoInfo.type) {
        case 'youtube':
          videoMetadata = await fetchYouTubeMetadata(url, videoInfo.id);
          break;
        case 'tiktok':
          videoMetadata = await fetchTikTokMetadata(url, videoInfo.id);
          break;
        case 'instagram':
          videoMetadata = await fetchInstagramMetadata(url, videoInfo.id);
          break;
      }

      // For YouTube with successful oEmbed, return early
      // For TikTok/Instagram, fall through to scraping if oEmbed failed (no thumbnail)
      if (videoInfo.type === 'youtube' || videoMetadata.image) {
        return NextResponse.json({
          title: videoMetadata.title,
          description: videoMetadata.description || null,
          image: videoMetadata.image || null,
          price: null,
          domain: videoMetadata.domain || parsedUrl.hostname.replace('www.', ''),
          url,
          brand: videoMetadata.brand || null,
          videoType: videoMetadata.videoType,
          videoId: videoMetadata.videoId,
        }, { status: 200 });
      }
      // Fall through to regular scraping to get og:image for TikTok/Instagram
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
      brand: null,
    };

    // First, try to extract brand from URL domain
    metadata.brand = extractBrandFromUrl(url);

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

    // If brand wasn't extracted from URL, try to extract from title or description
    if (!metadata.brand) {
      const textBrand = extractBrandFromText(metadata.title || '') ||
                        extractBrandFromText(metadata.description || '');
      if (textBrand) {
        metadata.brand = textBrand;
      }
    }

    // Add video info if this was detected as a video URL (e.g., Instagram)
    if (videoInfo) {
      metadata.videoType = videoInfo.type;
      metadata.videoId = videoInfo.id;
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
