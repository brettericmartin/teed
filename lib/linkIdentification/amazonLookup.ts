/**
 * Amazon Product Lookup via ASIN
 *
 * Uses free services to look up Amazon products by ASIN.
 * Much more reliable than AI guessing.
 */

export interface AmazonProductInfo {
  success: boolean;
  title: string | null;
  brand: string | null;
  price: string | null;
  image: string | null;
  error?: string;
}

/**
 * Look up an Amazon product by ASIN using multiple fallback methods
 */
export async function lookupAmazonProduct(asin: string): Promise<AmazonProductInfo> {
  // Try multiple methods in order of reliability

  // Method 1: Amazon's own product embed endpoint (often works)
  const embedResult = await tryAmazonEmbed(asin);
  if (embedResult.success && embedResult.title) {
    return embedResult;
  }

  // Method 2: Rainforest API free tier alternative - use the mobile page
  const mobileResult = await tryAmazonMobile(asin);
  if (mobileResult.success && mobileResult.title) {
    return mobileResult;
  }

  return {
    success: false,
    title: null,
    brand: null,
    price: null,
    image: null,
    error: 'Could not look up Amazon product',
  };
}

/**
 * Try Amazon's embed endpoint - sometimes returns product data
 */
async function tryAmazonEmbed(asin: string): Promise<AmazonProductInfo> {
  try {
    // Amazon's affiliate image endpoint often returns useful data
    const imageUrl = `https://ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=${asin}&Format=_SL250_&ID=AsinImage&ServiceVersion=20070822`;

    // This gets the product image at least
    const response = await fetch(imageUrl, {
      method: 'HEAD',
      redirect: 'follow',
    });

    if (response.ok) {
      return {
        success: true,
        title: null, // We'll need AI to fill this in
        brand: null,
        price: null,
        image: imageUrl,
      };
    }
  } catch {
    // Ignore errors
  }

  return {
    success: false,
    title: null,
    brand: null,
    price: null,
    image: null,
  };
}

/**
 * Try Amazon's mobile site - sometimes less aggressive blocking
 */
async function tryAmazonMobile(asin: string): Promise<AmazonProductInfo> {
  const mobileUrl = `https://www.amazon.com/dp/${asin}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(mobileUrl, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return { success: false, title: null, brand: null, price: null, image: null };
    }

    const html = await response.text();

    // Check if we got blocked
    // Important: Large real Amazon pages (>100KB) can contain "robot" in scripts/footers.
    // Only flag as blocked if page is small (likely a CAPTCHA page) or has strong indicators.
    const isSmallPage = html.length < 50000;
    const hasStrongBotIndicators = html.includes('automated access') ||
      html.includes('captcha') ||
      html.includes('Sorry, we just need to make sure') ||
      html.includes('Enter the characters you see below');
    if (isSmallPage && html.toLowerCase().includes('robot') || hasStrongBotIndicators) {
      return { success: false, title: null, brand: null, price: null, image: null };
    }

    // Extract title from HTML
    const titleMatch = html.match(/<title>([^<]+)<\/title>/i);
    let title = titleMatch ? titleMatch[1] : null;

    // Clean up Amazon title format: "Product Name : Amazon.com"
    if (title) {
      title = title
        .replace(/\s*:\s*Amazon\.com.*$/i, '')
        .replace(/\s*-\s*Amazon\.com.*$/i, '')
        .replace(/Amazon\.com\s*:\s*/i, '')
        .trim();
    }

    // Extract price
    const priceMatch = html.match(/\$[\d,]+\.?\d{0,2}/);
    const price = priceMatch ? priceMatch[0] : null;

    // Extract image
    const imageMatch = html.match(/"large":"(https:\/\/m\.media-amazon\.com\/images\/[^"]+)"/);
    const image = imageMatch ? imageMatch[1] : null;

    if (title && title.length > 5) {
      // Extract brand (usually first word or two before product type)
      const brand = extractBrandFromTitle(title);

      return {
        success: true,
        title,
        brand,
        price,
        image,
      };
    }
  } catch {
    // Ignore errors
  }

  return {
    success: false,
    title: null,
    brand: null,
    price: null,
    image: null,
  };
}

/**
 * Extract brand from Amazon product title
 * Amazon titles usually start with the brand name
 */
function extractBrandFromTitle(title: string): string | null {
  // Common brand patterns at start of Amazon titles
  const brandPatterns = [
    // Known brands to look for
    /^(Casper|Tempur-Pedic|Purple|Nectar|Tuft & Needle|Leesa|Saatva)/i,
    /^(Apple|Samsung|Sony|LG|Bose|JBL|Anker)/i,
    /^(Nike|Adidas|Under Armour|Puma|New Balance|Reebok)/i,
    /^(TaylorMade|Callaway|Titleist|Ping|Cobra|Cleveland|Mizuno)/i,
    /^(Instant Pot|Ninja|KitchenAid|Cuisinart|Hamilton Beach)/i,
    /^(Dyson|Shark|Bissell|iRobot|Roborock|Eufy)/i,
    // Generic pattern: first 1-2 capitalized words
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+/,
  ];

  for (const pattern of brandPatterns) {
    const match = title.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

/**
 * Get Amazon product image URL from ASIN
 */
export function getAmazonImageUrl(asin: string): string {
  return `https://ws-na.amazon-adsystem.com/widgets/q?_encoding=UTF8&ASIN=${asin}&Format=_SL500_&ID=AsinImage&ServiceVersion=20070822`;
}
