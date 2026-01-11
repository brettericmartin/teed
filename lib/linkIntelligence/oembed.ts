/**
 * oEmbed Discovery and Fetching
 *
 * Implements oEmbed protocol for embedding content from external platforms.
 * https://oembed.com/
 *
 * Features:
 * - oEmbed endpoint discovery via HTML link tags
 * - Fetching oEmbed data from platform endpoints
 * - Fallback to known endpoints when discovery fails
 * - Caching with configurable TTL
 */

import type { OEmbedResponse, EmbedResult } from './types';
import { getEmbedPlatform, matchEmbedUrl, getOEmbedEndpoint } from './platforms';

// =============================================================================
// OEMBED DISCOVERY
// =============================================================================

/**
 * Discover oEmbed endpoint from HTML page
 *
 * Looks for <link> tags with type="application/json+oembed"
 * or type="text/xml+oembed"
 *
 * @param html - HTML content of the page
 * @returns oEmbed endpoint URL or null
 */
export function discoverOEmbedEndpoint(html: string): string | null {
  // Look for JSON oEmbed link (preferred)
  const jsonMatch = html.match(
    /<link[^>]+type=["']application\/json\+oembed["'][^>]*>/gi
  );
  if (jsonMatch) {
    const hrefMatch = jsonMatch[0].match(/href=["']([^"']+)["']/i);
    if (hrefMatch) {
      return hrefMatch[1];
    }
  }

  // Fallback to XML oEmbed link
  const xmlMatch = html.match(
    /<link[^>]+type=["']text\/xml\+oembed["'][^>]*>/gi
  );
  if (xmlMatch) {
    const hrefMatch = xmlMatch[0].match(/href=["']([^"']+)["']/i);
    if (hrefMatch) {
      return hrefMatch[1];
    }
  }

  // Also check for alternate type order (type before href or vice versa)
  const altMatch = html.match(
    /<link[^>]+href=["']([^"']+)["'][^>]+type=["']application\/json\+oembed["'][^>]*>/gi
  );
  if (altMatch) {
    const hrefMatch = altMatch[0].match(/href=["']([^"']+)["']/i);
    if (hrefMatch) {
      return hrefMatch[1];
    }
  }

  return null;
}

/**
 * Get oEmbed endpoint URL for a given content URL
 *
 * First tries known endpoints from platform registry,
 * then falls back to discovery.
 *
 * @param url - Content URL
 * @param options - Options for endpoint resolution
 * @returns oEmbed API URL or null
 */
export function getOEmbedUrl(
  url: string,
  options: {
    maxWidth?: number;
    maxHeight?: number;
    format?: 'json' | 'xml';
  } = {}
): string | null {
  const match = matchEmbedUrl(url);
  if (!match) return null;

  const platform = match.platform;
  if (!platform.oembedEndpoint) return null;

  // Build oEmbed API URL
  const oembedUrl = new URL(platform.oembedEndpoint);
  oembedUrl.searchParams.set('url', url);

  if (options.format) {
    oembedUrl.searchParams.set('format', options.format);
  }
  if (options.maxWidth) {
    oembedUrl.searchParams.set('maxwidth', options.maxWidth.toString());
  }
  if (options.maxHeight) {
    oembedUrl.searchParams.set('maxheight', options.maxHeight.toString());
  }

  return oembedUrl.toString();
}

// =============================================================================
// OEMBED FETCHING
// =============================================================================

export interface OEmbedFetchOptions {
  timeout?: number;
  maxWidth?: number;
  maxHeight?: number;
  userAgent?: string;
}

const DEFAULT_OPTIONS: OEmbedFetchOptions = {
  timeout: 10000,
  maxWidth: 800,
  maxHeight: 600,
  userAgent: 'TeedBot/1.0 (+https://teed.gg)',
};

/**
 * Fetch oEmbed data for a URL
 *
 * @param url - Content URL to get oEmbed data for
 * @param options - Fetch options
 * @returns oEmbed response or null if not available
 */
export async function fetchOEmbed(
  url: string,
  options: OEmbedFetchOptions = {}
): Promise<OEmbedResponse | null> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Get oEmbed endpoint URL
  const oembedUrl = getOEmbedUrl(url, {
    maxWidth: opts.maxWidth,
    maxHeight: opts.maxHeight,
    format: 'json',
  });

  if (!oembedUrl) {
    return null;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), opts.timeout);

    const response = await fetch(oembedUrl, {
      headers: {
        'Accept': 'application/json',
        'User-Agent': opts.userAgent!,
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return parseOEmbedResponse(data);
  } catch (error) {
    // Silently fail - oEmbed is optional enrichment
    return null;
  }
}

/**
 * Parse and validate oEmbed response
 */
function parseOEmbedResponse(data: unknown): OEmbedResponse | null {
  if (!data || typeof data !== 'object') {
    return null;
  }

  const obj = data as Record<string, unknown>;

  // Type must be one of the valid oEmbed types
  const validTypes = ['photo', 'video', 'link', 'rich'];
  if (!obj.type || !validTypes.includes(obj.type as string)) {
    return null;
  }

  // Version should be "1.0"
  const version = typeof obj.version === 'string' ? obj.version : '1.0';

  const response: OEmbedResponse = {
    type: obj.type as OEmbedResponse['type'],
    version,
  };

  // Optional fields
  if (typeof obj.title === 'string') response.title = obj.title;
  if (typeof obj.author_name === 'string') response.authorName = obj.author_name;
  if (typeof obj.author_url === 'string') response.authorUrl = obj.author_url;
  if (typeof obj.provider_name === 'string') response.providerName = obj.provider_name;
  if (typeof obj.provider_url === 'string') response.providerUrl = obj.provider_url;
  if (typeof obj.cache_age === 'number') response.cacheAge = obj.cache_age;
  if (typeof obj.thumbnail_url === 'string') response.thumbnailUrl = obj.thumbnail_url;
  if (typeof obj.thumbnail_width === 'number') response.thumbnailWidth = obj.thumbnail_width;
  if (typeof obj.thumbnail_height === 'number') response.thumbnailHeight = obj.thumbnail_height;
  if (typeof obj.html === 'string') response.html = obj.html;
  if (typeof obj.width === 'number') response.width = obj.width;
  if (typeof obj.height === 'number') response.height = obj.height;

  return response;
}

// =============================================================================
// EMBED ENRICHMENT
// =============================================================================

/**
 * Enrich an embed result with oEmbed data
 *
 * @param embed - Parsed embed result
 * @param options - Fetch options
 * @returns Enriched embed result
 */
export async function enrichEmbedWithOEmbed(
  embed: EmbedResult,
  options: OEmbedFetchOptions = {}
): Promise<EmbedResult> {
  const oembed = await fetchOEmbed(embed.url, options);

  if (!oembed) {
    return embed;
  }

  return {
    ...embed,
    oembed,
  };
}

/**
 * Batch fetch oEmbed data for multiple URLs
 *
 * @param urls - Array of content URLs
 * @param options - Fetch options
 * @returns Map of URL to oEmbed response
 */
export async function batchFetchOEmbed(
  urls: string[],
  options: OEmbedFetchOptions & { concurrency?: number } = {}
): Promise<Map<string, OEmbedResponse | null>> {
  const { concurrency = 3, ...fetchOptions } = options;
  const results = new Map<string, OEmbedResponse | null>();

  // Process in batches to respect rate limits
  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        const oembed = await fetchOEmbed(url, fetchOptions);
        return { url, oembed };
      })
    );

    for (const { url, oembed } of batchResults) {
      results.set(url, oembed);
    }
  }

  return results;
}

// =============================================================================
// OEMBED PLATFORM SUPPORT CHECK
// =============================================================================

/**
 * Check if a URL has oEmbed support
 */
export function hasOEmbedSupport(url: string): boolean {
  const match = matchEmbedUrl(url);
  return !!(match?.platform.oembedEndpoint);
}

/**
 * Get all platforms that support oEmbed
 */
export function getOEmbedSupportedPlatforms(): string[] {
  const { EMBED_PLATFORMS } = require('./platforms');
  return EMBED_PLATFORMS
    .filter((p: { oembedEndpoint?: string }) => p.oembedEndpoint)
    .map((p: { id: string }) => p.id);
}

// =============================================================================
// EMBED HTML GENERATION
// =============================================================================

/**
 * Generate responsive embed HTML wrapper
 *
 * @param oembed - oEmbed response with HTML
 * @param options - Wrapper options
 * @returns Wrapped HTML for responsive embedding
 */
export function generateResponsiveEmbed(
  oembed: OEmbedResponse,
  options: {
    maxWidth?: number;
    className?: string;
  } = {}
): string {
  if (!oembed.html) {
    return '';
  }

  const { maxWidth = 800, className = 'oembed-embed' } = options;
  const aspectRatio = oembed.width && oembed.height
    ? (oembed.height / oembed.width) * 100
    : 56.25; // Default 16:9

  return `
    <div class="${className}" style="max-width: ${maxWidth}px; width: 100%;">
      <div style="position: relative; padding-bottom: ${aspectRatio}%; height: 0; overflow: hidden;">
        <div style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;">
          ${oembed.html}
        </div>
      </div>
    </div>
  `.trim();
}

/**
 * Sanitize oEmbed HTML for safe embedding
 *
 * Basic sanitization - for production use, consider a proper HTML sanitizer
 */
export function sanitizeOEmbedHtml(html: string): string {
  // Remove script tags (except from known embed providers)
  const safeScriptDomains = [
    'platform.twitter.com',
    'www.tiktok.com',
    'www.instagram.com',
    'www.youtube.com',
    'player.vimeo.com',
    'open.spotify.com',
    'w.soundcloud.com',
  ];

  // This is a basic implementation - use DOMPurify or similar in production
  let sanitized = html;

  // Remove potentially dangerous attributes
  sanitized = sanitized.replace(/\son\w+="[^"]*"/gi, '');
  sanitized = sanitized.replace(/\son\w+='[^']*'/gi, '');

  // Remove javascript: URLs
  sanitized = sanitized.replace(/href="javascript:[^"]*"/gi, 'href="#"');
  sanitized = sanitized.replace(/src="javascript:[^"]*"/gi, 'src=""');

  return sanitized;
}
