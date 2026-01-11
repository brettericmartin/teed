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
 *
 * Now powered by the Link Intelligence Library for expanded platform support (40+ platforms).
 */

import {
  classifyUrl as liClassifyUrl,
  classifyUrls as liClassifyUrls,
  parseEmbedUrl as liParseEmbedUrl,
  parseSocialProfileUrl as liParseSocialProfileUrl,
  normalizeUrl,
  isValidUrl as liIsValidUrl,
  parseUrlsFromInput as liParseUrlsFromInput,
  type ClassifiedUrl,
  type EmbedResult,
  type SocialProfileResult,
} from '@/lib/linkIntelligence';

// Re-export ParsedEmbed type for backward compatibility
import type { EmbedPlatform, ParsedEmbed } from '@/lib/embeds/parseEmbedUrl';
import type { ParsedSocialProfile } from './parseSocialProfileUrl';

// =============================================================================
// BACKWARD COMPATIBLE TYPES
// =============================================================================

/**
 * Classification result types (backward compatible)
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

// =============================================================================
// ADAPTER FUNCTIONS
// =============================================================================

/**
 * Convert Link Intelligence embed result to legacy ParsedEmbed format.
 */
function toLegacyEmbed(embed: EmbedResult): ParsedEmbed {
  // Map new platform names to legacy EmbedPlatform type
  const platformMap: Record<string, EmbedPlatform> = {
    youtube: 'youtube',
    spotify: 'spotify',
    tiktok: 'tiktok',
    twitter: 'twitter',
    instagram: 'instagram',
    twitch: 'twitch',
  };

  return {
    platform: platformMap[embed.platform] || 'unknown',
    id: embed.contentId,
    originalUrl: embed.url,
    embedUrl: embed.embedUrl,
    type: embed.contentType,
  };
}

/**
 * Convert Link Intelligence social result to legacy ParsedSocialProfile format.
 */
function toLegacySocialProfile(social: SocialProfileResult): ParsedSocialProfile {
  return {
    platform: social.platform,
    username: social.username,
    displayName: social.displayName || social.platformName || social.platform,
    originalUrl: social.url,
  };
}

/**
 * Convert Link Intelligence ClassifiedUrl to legacy LinkClassification format.
 * Note: classifyUrl only returns type/platform, so we need to call parse functions for full data.
 */
function toLegacyClassification(result: ClassifiedUrl, url: string): LinkClassification {
  if (result.type === 'embed') {
    // Get full embed data by parsing
    const embedResult = liParseEmbedUrl(url);
    if (embedResult) {
      return {
        type: 'embed',
        platform: toLegacyEmbed(embedResult).platform,
        embedData: toLegacyEmbed(embedResult),
        originalUrl: result.normalizedUrl,
      };
    }
  }

  if (result.type === 'social') {
    // Get full social data by parsing
    const socialResult = liParseSocialProfileUrl(url);
    if (socialResult) {
      const legacy = toLegacySocialProfile(socialResult);
      return {
        type: 'social',
        platform: legacy.platform,
        username: legacy.username,
        displayName: legacy.displayName,
        originalUrl: result.normalizedUrl,
      };
    }
  }

  return {
    type: 'product',
    originalUrl: result.normalizedUrl,
  };
}

// =============================================================================
// PUBLIC API (backward compatible)
// =============================================================================

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

  const result = liClassifyUrl(url);
  return toLegacyClassification(result, url);
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
  return liParseUrlsFromInput(input, maxUrls);
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

// =============================================================================
// EXTENDED API (new features from Link Intelligence)
// =============================================================================

/**
 * Get detailed classification with Link Intelligence metadata.
 * Use this for new code that wants access to the full data.
 */
export function classifyUrlDetailed(url: string): ClassifiedUrl {
  return liClassifyUrl(url);
}

/**
 * Get full embed details (new format with more platforms).
 * Returns null for non-embed URLs.
 */
export function parseEmbedUrlDetailed(url: string): EmbedResult | null {
  return liParseEmbedUrl(url);
}

/**
 * Get full social profile details (new format with more platforms).
 * Returns null for non-profile URLs.
 */
export function parseSocialProfileUrlDetailed(url: string): SocialProfileResult | null {
  return liParseSocialProfileUrl(url);
}

// Re-export Link Intelligence utilities for direct access
export { normalizeUrl, liIsValidUrl as isValidUrl };
