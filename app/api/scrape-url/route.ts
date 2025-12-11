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

// Known brands to detect in text (sorted by length descending for greedy matching)
const KNOWN_BRANDS = [
  // Multi-word brands first (greedy matching)
  'Good Good Golf', 'Under Armour', 'TRUE Linkswear', 'Scotty Cameron', 'Sun Mountain',
  'Jones Sports', 'Golf Pride', 'Vice Golf', 'Malbon Golf', 'Peak Design', 'Bang & Olufsen',
  'Bowers & Wilkins', 'Audio-Technica', 'Black Diamond', 'Arc\'teryx', 'The North Face',
  'Patagonia', 'Outdoor Research', 'Mountain Hardwear', 'Sea to Summit',
  // Golf brands
  'TaylorMade', 'Callaway', 'Titleist', 'Ping', 'Cobra', 'Mizuno', 'Srixon', 'Cleveland',
  'Bridgestone', 'FootJoy', 'TravisMathew', 'Johnnie-O', 'G/FORE', 'Birddogs', 'Melin',
  'Skechers', 'ECCO', 'PXG', 'Honma', 'XXIO', 'Wilson', 'Bushnell', 'Garmin', 'Arccos',
  'Ogio', 'Vessel', 'Stitch', 'SuperStroke', 'Lamkin', 'Vokey',
  // Tech brands
  'Sony', 'Canon', 'Nikon', 'Fujifilm', 'Panasonic', 'Olympus', 'Leica', 'Hasselblad',
  'Apple', 'Samsung', 'Google', 'Microsoft', 'Logitech', 'Razer', 'Corsair', 'SteelSeries',
  'Bose', 'Sennheiser', 'Shure', 'Rode', 'Zoom', 'Tascam', 'Focusrite', 'Universal Audio',
  'DJI', 'GoPro', 'Insta360', 'Blackmagic', 'Atomos', 'Smallrig', 'Manfrotto', 'Gitzo',
  'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'LG', 'BenQ', 'ViewSonic', 'Anker', 'Belkin',
  'JBL', 'Sonos', 'Marshall', 'Beats', 'AirPods', 'Jabra', 'Skullcandy',
  // Fashion/Lifestyle
  'Nike', 'Adidas', 'Puma', 'New Balance', 'Reebok', 'Converse', 'Vans',
  'Gucci', 'Louis Vuitton', 'Prada', 'Burberry', 'Hermes', 'Chanel', 'Dior',
  'Ray-Ban', 'Oakley', 'Persol', 'Maui Jim', 'Costa', 'Smith',
  // Outdoor/EDC
  'Yeti', 'Hydro Flask', 'Stanley', 'Osprey', 'Gregory', 'Deuter', 'Fjallraven',
  'Benchmade', 'Spyderco', 'Kershaw', 'Leatherman', 'Gerber', 'SOG', 'CRKT',
  'Olight', 'Fenix', 'Streamlight', 'SureFire', 'Nitecore',
  'Bellroy', 'Ridge', 'Secrid', 'Ekster', 'Trayvax',
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

// Search Google Images for a product
async function searchGoogleImages(query: string): Promise<string | null> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !searchEngineId || !query) {
    return null;
  }

  try {
    const searchParams = new URLSearchParams({
      key: apiKey,
      cx: searchEngineId,
      q: query.trim(),
      searchType: 'image',
      num: '1',
      imgSize: 'medium',
      imgType: 'photo',
      safe: 'active',
    });

    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?${searchParams.toString()}`
    );

    if (!response.ok) return null;

    const data = await response.json();
    if (data.items && data.items.length > 0) {
      return data.items[0].link;
    }
    return null;
  } catch (error) {
    console.error('Google Image Search error:', error);
    return null;
  }
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
    let html = '';
    let fetchSucceeded = false;

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.5',
        },
        redirect: 'follow',
      });

      if (response.ok) {
        html = await response.text();
        fetchSucceeded = true;
      }
    } catch (fetchError) {
      console.error('Fetch error:', fetchError);
      // Continue without HTML - we can still extract from URL
    }

    const $ = fetchSucceeded ? cheerio.load(html) : null;

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

    // Only extract from HTML if fetch succeeded
    if ($) {
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

      // Detect bot-detection/garbage titles (just site name)
      const garbageTitles = [
        'amazon.com', 'amazon', 'ebay', 'ebay.com', 'walmart', 'walmart.com',
        'sign in', 'log in', 'robot check', 'captcha', 'access denied',
        'page not found', '404', 'error',
      ];
      if (garbageTitles.some(g => metadata.title!.toLowerCase() === g || metadata.title!.toLowerCase().startsWith(g + ' '))) {
        metadata.title = null;
      }
    }

    // For Amazon URLs without a proper title, try to extract product name from URL
    if (!metadata.title && metadata.domain.includes('amazon')) {
      // Try multiple URL patterns:
      // 1. /PRODUCT-NAME/dp/ASIN - has product slug before /dp/
      // 2. /dp/ASIN or /gp/product/ASIN or /p/ASIN - short form, no slug

      // Pattern 1: Extract product slug from URL (most informative)
      const productSlugMatch = url.match(/amazon\.[^/]+\/([^/]+)\/dp\//);
      if (productSlugMatch && productSlugMatch[1]) {
        const slug = productSlugMatch[1]
          .replace(/-/g, ' ')
          .replace(/\b\w/g, c => c.toUpperCase())
          .trim();
        if (slug.length > 3 && slug.length < 100) {
          metadata.title = slug;
        }
      }

      // Pattern 2: If no slug, extract ASIN and mark as Amazon product
      if (!metadata.title) {
        const asinMatch = url.match(/\/(?:dp|gp\/product|p)\/([A-Z0-9]{10})/i);
        if (asinMatch && asinMatch[1]) {
          // Use ASIN as reference - better than nothing
          metadata.title = `Amazon Product (${asinMatch[1]})`;
        }
      }
    }

    // For other sites without titles, use domain as fallback
    if (!metadata.title && metadata.domain) {
      // Extract a readable site name from domain
      const siteName = metadata.domain
        .replace(/^www\./, '')
        .split('.')[0]
        .replace(/-/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
      metadata.title = `${siteName} Product`;
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

    // If no image found, try Google Image Search as fallback
    if (!metadata.image && metadata.title) {
      let searchQuery: string;

      // For Amazon ASIN-only titles, search Amazon for that ASIN
      const asinMatch = metadata.title.match(/Amazon Product \(([A-Z0-9]{10})\)/i);
      if (asinMatch) {
        searchQuery = `Amazon ${asinMatch[1]} product`;
      } else {
        // Use title (and brand if available) as search query
        searchQuery = [metadata.brand, metadata.title].filter(Boolean).join(' ');
      }

      const googleImage = await searchGoogleImages(searchQuery);
      if (googleImage) {
        metadata.image = googleImage;
      }
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
