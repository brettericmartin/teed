/**
 * URL Classifier
 *
 * Universal URL classification into three categories:
 * 1. Embed - Content that can be embedded (videos, audio, posts)
 * 2. Social - Profile URLs (not content)
 * 3. Product - Everything else (goes through product identification pipeline)
 *
 * Classification priority: Embed > Social > Product
 */

import type {
  UrlType,
  ClassifiedUrl,
  EmbedResult,
  SocialProfileResult,
} from './types';
import {
  matchEmbedUrl,
  matchSocialUrl,
  type UrlMatch,
} from './platforms';

// =============================================================================
// URL NORMALIZATION
// =============================================================================

/**
 * Tracking parameters to remove from URLs
 */
const TRACKING_PARAMS = new Set([
  // UTM parameters
  'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'utm_id',
  // Facebook
  'fbclid', 'fb_action_ids', 'fb_action_types', 'fb_source',
  // Google
  'gclid', 'gclsrc', 'dclid',
  // Microsoft
  'msclkid',
  // General
  'ref', 'ref_src', 'ref_url', 'referer', 'referrer',
  // Twitter
  'twclid', 's', 't',
  // Pinterest
  'epik',
  // TikTok
  'share_source', 'sender_device', 'sender_web_id',
  // Misc
  'mc_cid', 'mc_eid', '_ga', '_gl', 'yclid', 'zanpid',
]);

/**
 * Normalize a URL for consistent processing.
 *
 * - Trims whitespace
 * - Adds https:// if no protocol
 * - Removes tracking parameters
 * - Preserves essential query parameters
 */
export function normalizeUrl(url: string): string {
  let normalized = url.trim();

  // Handle mailto: links
  if (normalized.toLowerCase().startsWith('mailto:')) {
    return normalized;
  }

  // Add protocol if missing
  if (!normalized.match(/^https?:\/\//i)) {
    normalized = 'https://' + normalized;
  }

  // Remove tracking parameters
  try {
    const urlObj = new URL(normalized);

    // Remove tracking params
    TRACKING_PARAMS.forEach(param => {
      urlObj.searchParams.delete(param);
    });

    // Clean up empty search string
    if (urlObj.searchParams.toString() === '') {
      return urlObj.origin + urlObj.pathname + urlObj.hash;
    }

    return urlObj.toString();
  } catch {
    // If URL parsing fails, return as-is
    return normalized;
  }
}

/**
 * Extract domain from URL
 */
export function extractDomain(url: string): string {
  try {
    const urlObj = new URL(url.startsWith('http') ? url : 'https://' + url);
    return urlObj.hostname.replace(/^www\./, '');
  } catch {
    // Fallback: extract domain via regex
    const match = url.match(/(?:https?:\/\/)?(?:www\.)?([^\/\?#]+)/);
    return match?.[1]?.replace(/^www\./, '') || '';
  }
}

// =============================================================================
// URL CLASSIFICATION
// =============================================================================

/**
 * Classify a single URL into embed, social, or product.
 *
 * @param url - The URL to classify
 * @returns Classification result
 */
export function classifyUrl(url: string): ClassifiedUrl {
  if (!url) {
    return {
      url,
      normalizedUrl: '',
      type: 'product',
      platform: 'unknown',
      confidence: 0,
    };
  }

  const normalizedUrl = normalizeUrl(url);
  const domain = extractDomain(normalizedUrl);

  // 1. Try embed detection first (content URLs like videos, tracks, posts)
  const embedMatch = matchEmbedUrl(normalizedUrl);
  if (embedMatch) {
    return {
      url,
      normalizedUrl,
      type: 'embed',
      platform: embedMatch.platform.id,
      confidence: 1.0,
    };
  }

  // 2. Try social profile detection
  const socialMatch = matchSocialUrl(normalizedUrl);
  if (socialMatch) {
    return {
      url,
      normalizedUrl,
      type: 'social',
      platform: socialMatch.platform.id,
      confidence: 1.0,
    };
  }

  // 3. Default to product (will go through product identification pipeline)
  return {
    url,
    normalizedUrl,
    type: 'product',
    platform: 'unknown',
    confidence: 0.5, // Lower confidence since we're falling back
  };
}

/**
 * Classify multiple URLs at once
 */
export interface BatchClassificationResult {
  results: ClassifiedUrl[];
  summary: {
    embeds: number;
    social: number;
    products: number;
    total: number;
  };
}

export function classifyUrls(urls: string[]): BatchClassificationResult {
  const results: ClassifiedUrl[] = [];
  let embeds = 0;
  let social = 0;
  let products = 0;

  for (const url of urls) {
    const result = classifyUrl(url);
    results.push(result);

    switch (result.type) {
      case 'embed':
        embeds++;
        break;
      case 'social':
        social++;
        break;
      case 'product':
        products++;
        break;
    }
  }

  return {
    results,
    summary: {
      embeds,
      social,
      products,
      total: urls.length,
    },
  };
}

// =============================================================================
// EMBED PARSING
// =============================================================================

/**
 * Parse an embed URL and extract content information
 */
export function parseEmbedUrl(url: string): EmbedResult | null {
  const normalizedUrl = normalizeUrl(url);
  const match = matchEmbedUrl(normalizedUrl);

  if (!match) {
    return null;
  }

  const { platform, match: regexMatch } = match;

  // Extract content ID using platform-specific extractor
  let contentId = '';
  if (platform.extractors?.id) {
    contentId = platform.extractors.id(normalizedUrl, regexMatch) || '';
  } else if (regexMatch[1]) {
    // Fallback to first capture group
    contentId = regexMatch[1];
  }

  // Determine content type from URL
  let contentType: EmbedResult['contentType'];
  if (normalizedUrl.includes('/shorts/')) {
    contentType = 'short';
  } else if (normalizedUrl.includes('/reel/')) {
    contentType = 'reel';
  } else if (normalizedUrl.includes('/clip/') || normalizedUrl.includes('clips.')) {
    contentType = 'clip';
  } else if (normalizedUrl.includes('/track/')) {
    contentType = 'track';
  } else if (normalizedUrl.includes('/album/')) {
    contentType = 'album';
  } else if (normalizedUrl.includes('/playlist/')) {
    contentType = 'playlist';
  } else if (normalizedUrl.includes('/episode/') || normalizedUrl.includes('/show/')) {
    contentType = 'episode';
  } else if (normalizedUrl.includes('/status/') || normalizedUrl.includes('/post/')) {
    contentType = 'post';
  } else {
    contentType = 'video';
  }

  // Generate embed URL if template available
  let embedUrl: string | undefined;
  if (platform.embedUrlTemplate && contentId) {
    embedUrl = platform.embedUrlTemplate
      .replace('{id}', contentId)
      .replace('{type}', contentType);

    // Handle Spotify's special format
    if (platform.id === 'spotify' && regexMatch[1]) {
      embedUrl = platform.embedUrlTemplate
        .replace('{type}', regexMatch[1])
        .replace('{id}', contentId);
    }
  }

  return {
    type: 'embed',
    platform: platform.id,
    platformName: platform.name,
    contentId,
    contentType,
    url: normalizedUrl,
    embedUrl,
  };
}

// =============================================================================
// SOCIAL PROFILE PARSING
// =============================================================================

/**
 * Parse a social profile URL and extract profile information
 */
export function parseSocialProfileUrl(url: string): SocialProfileResult | null {
  const normalizedUrl = normalizeUrl(url);
  const match = matchSocialUrl(normalizedUrl);

  if (!match) {
    return null;
  }

  const { platform, match: regexMatch } = match;

  // Extract username using platform-specific extractor
  let username = '';
  if (platform.extractors?.username) {
    username = platform.extractors.username(normalizedUrl, regexMatch) || '';
  } else if (regexMatch[1]) {
    // Fallback to first capture group
    username = regexMatch[1];
  }

  // Generate profile URL (canonical format)
  let profileUrl = normalizedUrl;
  if (platform.domains.length > 0) {
    const primaryDomain = platform.domains[0];
    // Create canonical profile URL
    if (platform.id === 'substack-profile') {
      profileUrl = `https://${username}.substack.com`;
    } else if (platform.id === 'email') {
      profileUrl = `mailto:${username}`;
    } else {
      // Most platforms: domain/username format
      const separator = platform.id.includes('youtube') ? '/@' : '/';
      profileUrl = `https://${primaryDomain}${separator}${username}`;
    }
  }

  return {
    type: 'social',
    platform: platform.id.replace('-profile', '').replace('-channel', ''),
    platformName: platform.name,
    username,
    url: normalizedUrl,
    profileUrl,
  };
}

// =============================================================================
// URL VALIDATION
// =============================================================================

/**
 * Basic URL validation
 */
export function isValidUrl(str: string): boolean {
  if (!str) return false;

  // Allow mailto: links
  if (str.toLowerCase().startsWith('mailto:')) {
    return str.includes('@');
  }

  // Check for domain-like pattern
  const domainPattern = /^(https?:\/\/)?[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+/i;
  return domainPattern.test(str);
}

/**
 * Parse URLs from raw text input (newlines, commas, spaces)
 */
export function parseUrlsFromInput(input: string, maxUrls: number = 25): string[] {
  if (!input) return [];

  // Split by newlines, commas, or whitespace
  const parts = input.split(/[\n,\s]+/).filter(Boolean);

  // Filter to valid URLs
  const urls: string[] = [];
  const seen = new Set<string>();

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    if (isValidUrl(trimmed)) {
      const normalized = normalizeUrl(trimmed);

      // Deduplicate
      if (!seen.has(normalized)) {
        seen.add(normalized);
        urls.push(normalized);
      }
    }

    // Stop at max
    if (urls.length >= maxUrls) break;
  }

  return urls;
}

// =============================================================================
// DISPLAY HELPERS
// =============================================================================

/**
 * Get human-readable classification label
 */
export function getClassificationLabel(classification: ClassifiedUrl): string {
  switch (classification.type) {
    case 'embed':
      return `${classification.platform} Embed`;
    case 'social':
      return `${classification.platform} Profile`;
    case 'product':
      return 'Product Link';
  }
}

/**
 * Get icon for classification type
 */
export function getClassificationIcon(classification: ClassifiedUrl): string {
  switch (classification.type) {
    case 'embed':
      return 'video';
    case 'social':
      return 'user';
    case 'product':
      return 'shopping-bag';
  }
}
