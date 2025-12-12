/**
 * Jina Reader - Free API for scraping blocked sites
 *
 * When direct fetch fails due to bot protection (Amazon, etc.),
 * Jina Reader can often get the content for us.
 */

export interface JinaReaderResult {
  success: boolean;
  title: string | null;
  description: string | null;
  content: string | null;
  error?: string;
}

/**
 * Fetch URL content via Jina Reader API
 *
 * Jina Reader handles JavaScript rendering and bot protection bypass.
 * Free tier has generous limits.
 */
export async function fetchViaJinaReader(url: string, timeout = 20000): Promise<JinaReaderResult> {
  const jinaUrl = `https://r.jina.ai/${url}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(jinaUrl, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'X-With-Generated-Alt': 'true',
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return {
        success: false,
        title: null,
        description: null,
        content: null,
        error: `Jina returned ${response.status}`,
      };
    }

    const contentType = response.headers.get('content-type') || '';
    let content: string;
    let title: string | null = null;
    let description: string | null = null;

    if (contentType.includes('application/json')) {
      // JSON response format
      const json = await response.json();
      content = json.content || json.text || '';
      title = json.title || extractTitleFromMarkdown(content);
      description = json.description || extractDescriptionFromMarkdown(content);
    } else {
      // Plain text/markdown response
      content = await response.text();
      title = extractTitleFromMarkdown(content);
      description = extractDescriptionFromMarkdown(content);
    }

    // Check if we got a CAPTCHA/bot detection page
    const lowerContent = content.toLowerCase();
    if (lowerContent.includes('robot') ||
        lowerContent.includes('captcha') ||
        lowerContent.includes('continue shopping') ||
        lowerContent.includes('automated access') ||
        lowerContent.includes('unusual traffic')) {
      return {
        success: false,
        title: null,
        description: null,
        content: null,
        error: 'Bot detection page',
      };
    }

    return {
      success: true,
      title,
      description,
      content: content.slice(0, 15000), // Limit content size for AI
    };

  } catch (error: any) {
    return {
      success: false,
      title: null,
      description: null,
      content: null,
      error: error.name === 'AbortError' ? 'timeout' : error.message,
    };
  }
}

/**
 * Extract title from Jina's markdown output
 */
function extractTitleFromMarkdown(markdown: string): string | null {
  // Jina often puts the title at the top as an H1
  const h1Match = markdown.match(/^#\s+(.+)$/m);
  if (h1Match) {
    return h1Match[1].trim();
  }

  // Or it might be in a "Title:" line
  const titleMatch = markdown.match(/^Title:\s*(.+)$/mi);
  if (titleMatch) {
    return titleMatch[1].trim();
  }

  // First non-empty line might be the title
  const lines = markdown.split('\n').filter(l => l.trim());
  if (lines.length > 0) {
    const firstLine = lines[0].replace(/^#+\s*/, '').trim();
    if (firstLine.length > 10 && firstLine.length < 200) {
      return firstLine;
    }
  }

  return null;
}

/**
 * Extract description from Jina's markdown output
 */
function extractDescriptionFromMarkdown(markdown: string): string | null {
  // Look for product description patterns
  const patterns = [
    /(?:Description|About|Product Info):\s*([^\n]+(?:\n(?![#\n])[^\n]+)*)/i,
    /^([A-Z][^.!?]*(?:[.!?](?:\s|$))){1,3}/m, // First 1-3 sentences
  ];

  for (const pattern of patterns) {
    const match = markdown.match(pattern);
    if (match && match[1]) {
      const desc = match[1].trim();
      if (desc.length > 20 && desc.length < 500) {
        return desc;
      }
    }
  }

  return null;
}

/**
 * Extract product info from Amazon-specific content
 */
export function extractAmazonProductInfo(content: string): {
  title: string | null;
  brand: string | null;
  price: string | null;
  features: string[];
} {
  const result: {
    title: string | null;
    brand: string | null;
    price: string | null;
    features: string[];
  } = {
    title: null,
    brand: null,
    price: null,
    features: [],
  };

  // Amazon product title is usually the first heading
  const titleMatch = content.match(/^#\s+(.+)$/m);
  if (titleMatch) {
    result.title = titleMatch[1].trim();

    // Brand is often the first word(s) before a specific pattern
    // e.g., "Casper Sleep Essential Mattress" -> brand is "Casper"
    // e.g., "Apple AirPods Pro" -> brand is "Apple"
    const brandPatterns = [
      /^([\w]+(?:\s+[\w]+)?)\s+(?:Sleep|Audio|Tech|Electronics|Home)/i,
      /^(Apple|Samsung|Sony|Bose|Casper|Nike|Adidas)/i,
    ];

    for (const pattern of brandPatterns) {
      const brandMatch = result.title.match(pattern);
      if (brandMatch) {
        result.brand = brandMatch[1];
        break;
      }
    }
  }

  // Extract price - look for dollar amounts
  const priceMatch = content.match(/\$[\d,]+\.?\d{0,2}/);
  if (priceMatch) {
    result.price = priceMatch[0];
  }

  // Extract bullet point features
  const featureMatches = content.match(/^[•\-*]\s+.+$/gm);
  if (featureMatches) {
    result.features = featureMatches
      .slice(0, 5)
      .map(f => f.replace(/^[•\-*]\s+/, '').trim());
  }

  return result;
}
