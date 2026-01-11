/**
 * Universal URL Classifier
 *
 * Classifies URLs into three categories:
 * 1. Embed - YouTube videos, Spotify tracks, TikTok videos, etc. (content that can be embedded)
 * 2. Social - Social media profile URLs (not content)
 * 3. Product - Everything else (goes through full scraping pipeline)
 *
 * Classification priority: Embed > Social > Product
 * This ensures content URLs are properly detected before falling back to profile detection.
 */

import { parseEmbedUrl, type ParsedEmbed, type EmbedPlatform } from '@/lib/embeds/parseEmbedUrl';
import { parseSocialProfileUrl, type ParsedSocialProfile } from './parseSocialProfileUrl';

/**
 * Classification result types
 */
export type LinkClassification =
  | EmbedClassification
  | SocialClassification
  | ProductClassification;

export interface EmbedClassification {
  type: 'embed';
  platform: EmbedPlatform;
  embedData: ParsedEmbed;
  originalUrl: string;
}

export interface SocialClassification {
  type: 'social';
  platform: string;
  username: string;
  displayName: string;
  originalUrl: string;
}

export interface ProductClassification {
  type: 'product';
  originalUrl: string;
}

/**
 * Batch classification result
 */
export interface ClassificationResult {
  index: number;
  originalUrl: string;
  classification: LinkClassification;
}

export interface ClassificationSummary {
  embeds: number;
  social: number;
  products: number;
  total: number;
}

/**
 * Classify a single URL.
 *
 * Priority order:
 * 1. Embed (content that can be embedded)
 * 2. Social (profile URLs)
 * 3. Product (fallback - goes through scraping pipeline)
 *
 * @param url - The URL to classify
 * @returns Classification result
 */
export function classifyUrl(url: string): LinkClassification {
  if (!url) {
    return { type: 'product', originalUrl: url };
  }

  const normalizedUrl = normalizeUrl(url);

  // 1. Try embed detection first (content URLs like videos, tracks, posts)
  const embedResult = parseEmbedUrl(normalizedUrl);
  if (embedResult.platform !== 'unknown') {
    return {
      type: 'embed',
      platform: embedResult.platform,
      embedData: embedResult,
      originalUrl: normalizedUrl,
    };
  }

  // 2. Try social profile detection (profile URLs)
  const socialResult = parseSocialProfileUrl(normalizedUrl);
  if (socialResult) {
    return {
      type: 'social',
      platform: socialResult.platform,
      username: socialResult.username,
      displayName: socialResult.displayName,
      originalUrl: normalizedUrl,
    };
  }

  // 3. Default to product (will go through scraping pipeline)
  return {
    type: 'product',
    originalUrl: normalizedUrl,
  };
}

/**
 * Classify multiple URLs at once.
 *
 * @param urls - Array of URLs to classify
 * @returns Array of classification results and summary
 */
export function classifyUrls(urls: string[]): {
  results: ClassificationResult[];
  summary: ClassificationSummary;
} {
  const results: ClassificationResult[] = [];
  let embeds = 0;
  let social = 0;
  let products = 0;

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const classification = classifyUrl(url);

    results.push({
      index: i,
      originalUrl: url,
      classification,
    });

    // Count by type
    switch (classification.type) {
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

/**
 * Normalize a URL for consistent processing.
 *
 * - Trims whitespace
 * - Adds https:// if no protocol
 * - Removes tracking parameters
 */
function normalizeUrl(url: string): string {
  let normalized = url.trim();

  // Add protocol if missing
  if (!normalized.match(/^https?:\/\//i)) {
    // Check if it's a mailto: link
    if (normalized.startsWith('mailto:')) {
      return normalized;
    }
    normalized = 'https://' + normalized;
  }

  // Remove common tracking parameters
  try {
    const urlObj = new URL(normalized);
    const trackingParams = [
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content',
      'fbclid', 'gclid', 'ref', 'ref_src', 'ref_url',
    ];
    trackingParams.forEach((param) => urlObj.searchParams.delete(param));
    return urlObj.toString();
  } catch {
    // If URL parsing fails, return as-is
    return normalized;
  }
}

/**
 * Parse URLs from raw text input.
 *
 * Handles:
 * - Multiple URLs on separate lines
 * - Comma-separated URLs
 * - Mixed formats
 *
 * @param input - Raw text containing URLs
 * @param maxUrls - Maximum number of URLs to return (default 25)
 * @returns Array of parsed URLs
 */
export function parseUrlsFromInput(input: string, maxUrls: number = 25): string[] {
  if (!input) return [];

  // Split by newlines, commas, or spaces
  const parts = input.split(/[\n,\s]+/).filter(Boolean);

  // Filter to valid URLs
  const urls: string[] = [];
  const seen = new Set<string>();

  for (const part of parts) {
    const trimmed = part.trim();
    if (!trimmed) continue;

    // Basic URL validation
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

/**
 * Basic URL validation.
 */
function isValidUrl(str: string): boolean {
  // Allow mailto: links
  if (str.startsWith('mailto:')) {
    return str.includes('@');
  }

  // Check for domain-like pattern
  const domainPattern = /^(https?:\/\/)?[a-zA-Z0-9][-a-zA-Z0-9]*(\.[a-zA-Z0-9][-a-zA-Z0-9]*)+/i;
  return domainPattern.test(str);
}

/**
 * Get a human-readable description of a classification.
 */
export function getClassificationLabel(classification: LinkClassification): string {
  switch (classification.type) {
    case 'embed':
      return `${getPlatformLabel(classification.platform)} Embed`;
    case 'social':
      return `${classification.displayName} Profile`;
    case 'product':
      return 'Product Link';
  }
}

/**
 * Get platform label for embeds.
 */
function getPlatformLabel(platform: EmbedPlatform): string {
  const labels: Record<EmbedPlatform, string> = {
    youtube: 'YouTube',
    spotify: 'Spotify',
    tiktok: 'TikTok',
    twitter: 'Twitter/X',
    instagram: 'Instagram',
    twitch: 'Twitch',
    unknown: 'Unknown',
  };
  return labels[platform] || platform;
}

/**
 * Get icon name for a classification.
 */
export function getClassificationIcon(classification: LinkClassification): string {
  switch (classification.type) {
    case 'embed':
      return 'video';
    case 'social':
      return 'user';
    case 'product':
      return 'shopping-bag';
  }
}
