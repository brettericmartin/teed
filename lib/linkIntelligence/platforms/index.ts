/**
 * Platform Registry
 *
 * Unified registry for all platform definitions.
 * Provides lookup by ID, domain, or URL pattern matching.
 */

import type { PlatformDefinition } from '../types';
import {
  EMBED_PLATFORMS,
  getEmbedPlatform,
  getEmbedPlatformByDomain,
} from './embedPlatforms';
import {
  SOCIAL_PLATFORMS,
  getSocialPlatform,
  getSocialPlatformByDomain,
  isReservedUsername,
  RESERVED_USERNAMES,
} from './socialPlatforms';

// Re-export individual platforms
export * from './embedPlatforms';
export * from './socialPlatforms';

// =============================================================================
// COMBINED PLATFORM REGISTRY
// =============================================================================

/**
 * All platforms (embeds + social) combined
 */
export const ALL_PLATFORMS: PlatformDefinition[] = [
  ...EMBED_PLATFORMS,
  ...SOCIAL_PLATFORMS,
];

/**
 * Platform lookup by ID
 */
const PLATFORM_BY_ID = new Map<string, PlatformDefinition>();
for (const platform of ALL_PLATFORMS) {
  PLATFORM_BY_ID.set(platform.id, platform);
}

/**
 * Get any platform by ID
 */
export function getPlatform(id: string): PlatformDefinition | undefined {
  return PLATFORM_BY_ID.get(id);
}

/**
 * Get platform by domain (checks embeds first, then social)
 */
export function getPlatformByDomain(domain: string): PlatformDefinition | undefined {
  return getEmbedPlatformByDomain(domain) || getSocialPlatformByDomain(domain);
}

// =============================================================================
// URL MATCHING
// =============================================================================

export interface UrlMatch {
  platform: PlatformDefinition;
  match: RegExpMatchArray;
  type: 'embed' | 'social';
}

/**
 * Match a URL against all embed platforms
 */
export function matchEmbedUrl(url: string): UrlMatch | null {
  for (const platform of EMBED_PLATFORMS) {
    // Check exclude patterns first
    if (platform.excludePatterns) {
      const excluded = platform.excludePatterns.some(p => p.test(url));
      if (excluded) continue;
    }

    // Try each URL pattern
    for (const pattern of platform.urlPatterns) {
      const match = url.match(pattern);
      if (match) {
        return { platform, match, type: 'embed' };
      }
    }
  }
  return null;
}

/**
 * Match a URL against all social platforms
 */
export function matchSocialUrl(url: string): UrlMatch | null {
  for (const platform of SOCIAL_PLATFORMS) {
    // Check exclude patterns first
    if (platform.excludePatterns) {
      const excluded = platform.excludePatterns.some(p => p.test(url));
      if (excluded) continue;
    }

    // Try each URL pattern
    for (const pattern of platform.urlPatterns) {
      const match = url.match(pattern);
      if (match) {
        // For social platforms, check if username is reserved
        if (platform.extractors?.username) {
          const username = platform.extractors.username(url, match);
          if (username && isReservedUsername(username)) {
            continue;
          }
        }
        return { platform, match, type: 'social' };
      }
    }
  }
  return null;
}

/**
 * Match a URL against all platforms (embed first, then social)
 */
export function matchUrl(url: string): UrlMatch | null {
  // Priority: Embed > Social
  // This ensures content URLs are properly detected before profile URLs
  return matchEmbedUrl(url) || matchSocialUrl(url);
}

// =============================================================================
// PLATFORM STATISTICS
// =============================================================================

export interface PlatformStats {
  totalPlatforms: number;
  embedPlatforms: number;
  socialPlatforms: number;
  totalDomains: number;
  totalPatterns: number;
  platformsWithOEmbed: number;
}

/**
 * Get statistics about the platform registry
 */
export function getPlatformStats(): PlatformStats {
  const allDomains = new Set<string>();
  let totalPatterns = 0;
  let platformsWithOEmbed = 0;

  for (const platform of ALL_PLATFORMS) {
    platform.domains.forEach(d => allDomains.add(d));
    totalPatterns += platform.urlPatterns.length;
    if (platform.oembedEndpoint) {
      platformsWithOEmbed++;
    }
  }

  return {
    totalPlatforms: ALL_PLATFORMS.length,
    embedPlatforms: EMBED_PLATFORMS.length,
    socialPlatforms: SOCIAL_PLATFORMS.length,
    totalDomains: allDomains.size,
    totalPatterns,
    platformsWithOEmbed,
  };
}

// =============================================================================
// PLATFORM DISPLAY HELPERS
// =============================================================================

/**
 * Get display name for a platform ID
 */
export function getPlatformDisplayName(platformId: string): string {
  const platform = getPlatform(platformId);
  return platform?.name || platformId;
}

/**
 * Get icon name for a platform ID
 */
export function getPlatformIcon(platformId: string): string {
  const platform = getPlatform(platformId);
  return platform?.icon || 'link';
}

/**
 * Get brand color for a platform ID
 */
export function getPlatformColor(platformId: string): string | undefined {
  const platform = getPlatform(platformId);
  return platform?.color;
}

// =============================================================================
// OEMBED ENDPOINTS
// =============================================================================

/**
 * Get oEmbed endpoint for a platform
 */
export function getOEmbedEndpoint(platformId: string): string | undefined {
  const platform = getPlatform(platformId);
  return platform?.oembedEndpoint;
}

/**
 * Get all platforms with oEmbed support
 */
export function getOEmbedPlatforms(): PlatformDefinition[] {
  return ALL_PLATFORMS.filter(p => p.oembedEndpoint);
}

// Re-export utilities
export { isReservedUsername, RESERVED_USERNAMES };
export { getEmbedPlatform, getSocialPlatform };
