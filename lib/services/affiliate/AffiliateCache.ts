/**
 * Affiliate URL Caching Implementation
 *
 * Implements in-memory caching with TTL support to:
 * - Reduce API calls to affiliate providers
 * - Improve response times
 * - Respect Amazon's 24hr cookie window
 * - Prevent rate limit issues
 *
 * For production, consider Redis or Supabase-based caching
 */

import { AffiliateCache } from '@/lib/types/affiliate';

// ═══════════════════════════════════════════════════════════
// In-Memory Cache Implementation
// ═══════════════════════════════════════════════════════════

interface CacheEntry {
  url: string;
  expiresAt: number; // Unix timestamp in milliseconds
}

/**
 * Simple in-memory cache for affiliate URLs
 *
 * Limitations:
 * - Not shared across serverless function instances
 * - Lost on deployment/restart
 * - No persistence
 *
 * Best for:
 * - Development
 * - Low-traffic production (single instance)
 * - Vercel hobby tier
 *
 * For production scaling, migrate to Redis or Supabase
 */
export class MemoryAffiliateCache implements AffiliateCache {
  private cache: Map<string, CacheEntry>;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor() {
    this.cache = new Map();

    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(
      () => this.cleanupExpired(),
      5 * 60 * 1000
    );
  }

  /**
   * Generate cache key from raw URL
   * Uses hash to normalize URLs (handle trailing slashes, etc.)
   */
  private getCacheKey(rawUrl: string): string {
    try {
      const url = new URL(rawUrl);
      // Normalize: lowercase domain, sorted params
      const domain = url.hostname.toLowerCase();
      const path = url.pathname;
      const params = Array.from(url.searchParams.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => `${k}=${v}`)
        .join('&');

      return `${domain}${path}${params ? '?' + params : ''}`;
    } catch {
      // Invalid URL, use as-is
      return rawUrl;
    }
  }

  async getCachedUrl(rawUrl: string): Promise<string | null> {
    const key = this.getCacheKey(rawUrl);
    const entry = this.cache.get(key);

    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return entry.url;
  }

  async setCachedUrl(
    rawUrl: string,
    affiliateUrl: string,
    ttl: number
  ): Promise<void> {
    const key = this.getCacheKey(rawUrl);
    const expiresAt = Date.now() + (ttl * 1000);

    this.cache.set(key, {
      url: affiliateUrl,
      expiresAt,
    });
  }

  async invalidateUrl(rawUrl: string): Promise<void> {
    const key = this.getCacheKey(rawUrl);
    this.cache.delete(key);
  }

  async clearAll(): Promise<void> {
    this.cache.clear();
  }

  /**
   * Remove expired entries from cache
   */
  private cleanupExpired(): void {
    const now = Date.now();
    let removed = 0;

    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        removed++;
      }
    }

    if (removed > 0) {
      console.log(`[AffiliateCache] Cleaned up ${removed} expired entries`);
    }
  }

  /**
   * Get cache stats (for debugging/monitoring)
   */
  getStats() {
    const now = Date.now();
    let valid = 0;
    let expired = 0;

    for (const entry of this.cache.values()) {
      if (now > entry.expiresAt) {
        expired++;
      } else {
        valid++;
      }
    }

    return {
      total: this.cache.size,
      valid,
      expired,
    };
  }

  /**
   * Cleanup interval on shutdown
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.cache.clear();
  }
}

// ═══════════════════════════════════════════════════════════
// Supabase-Based Cache Implementation (Future)
// ═══════════════════════════════════════════════════════════

/**
 * TODO: Implement Supabase-based caching for production scaling
 *
 * Schema:
 * CREATE TABLE affiliate_cache (
 *   id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 *   raw_url_hash text UNIQUE NOT NULL,
 *   affiliate_url text NOT NULL,
 *   expires_at timestamptz NOT NULL,
 *   created_at timestamptz DEFAULT now()
 * );
 *
 * CREATE INDEX idx_affiliate_cache_hash ON affiliate_cache(raw_url_hash);
 * CREATE INDEX idx_affiliate_cache_expires ON affiliate_cache(expires_at)
 *   WHERE expires_at > now();
 *
 * Benefits:
 * - Shared across all serverless instances
 * - Survives deployments
 * - Can be queried for analytics
 * - Automatic cleanup with pg_cron
 */
export class SupabaseAffiliateCache implements AffiliateCache {
  constructor(private supabase: any) {
    // TODO: Implement
  }

  async getCachedUrl(rawUrl: string): Promise<string | null> {
    // TODO: Query affiliate_cache table
    return null;
  }

  async setCachedUrl(
    rawUrl: string,
    affiliateUrl: string,
    ttl: number
  ): Promise<void> {
    // TODO: Insert/upsert into affiliate_cache
  }

  async invalidateUrl(rawUrl: string): Promise<void> {
    // TODO: Delete from affiliate_cache
  }

  async clearAll(): Promise<void> {
    // TODO: Truncate affiliate_cache
  }
}

// ═══════════════════════════════════════════════════════════
// Redis-Based Cache Implementation (Future)
// ═══════════════════════════════════════════════════════════

/**
 * TODO: Implement Redis-based caching for high-scale production
 *
 * Requires:
 * - Upstash Redis or similar serverless Redis
 * - redis npm package
 *
 * Benefits:
 * - Ultra-fast lookups (<1ms)
 * - Automatic TTL expiration
 * - Distributed caching
 * - Battle-tested for high traffic
 *
 * Example:
 * await redis.setex(`affiliate:${hash}`, ttl, affiliateUrl);
 * const cached = await redis.get(`affiliate:${hash}`);
 */
export class RedisAffiliateCache implements AffiliateCache {
  constructor(private redis: any) {
    // TODO: Implement with Upstash Redis
  }

  async getCachedUrl(rawUrl: string): Promise<string | null> {
    // TODO: redis.get()
    return null;
  }

  async setCachedUrl(
    rawUrl: string,
    affiliateUrl: string,
    ttl: number
  ): Promise<void> {
    // TODO: redis.setex()
  }

  async invalidateUrl(rawUrl: string): Promise<void> {
    // TODO: redis.del()
  }

  async clearAll(): Promise<void> {
    // TODO: redis.flushdb()
  }
}

// ═══════════════════════════════════════════════════════════
// Factory & Singleton
// ═══════════════════════════════════════════════════════════

let globalCache: AffiliateCache | null = null;

/**
 * Get or create global cache instance
 * Singleton pattern to reuse cache across requests
 */
export function getAffiliateCache(): AffiliateCache {
  if (!globalCache) {
    // For now, use in-memory cache
    // TODO: Switch to Supabase or Redis in production
    globalCache = new MemoryAffiliateCache();
  }
  return globalCache;
}

/**
 * Reset cache (for testing)
 */
export function resetAffiliateCache(): void {
  if (globalCache && globalCache instanceof MemoryAffiliateCache) {
    globalCache.destroy();
  }
  globalCache = null;
}

// ═══════════════════════════════════════════════════════════
// Cache Configuration
// ═══════════════════════════════════════════════════════════

/**
 * Standard TTL values (in seconds)
 */
export const CacheTTL = {
  // Amazon Associates: 23 hours (before 24hr cookie expires)
  AMAZON: 23 * 60 * 60,

  // Aggregators: 12 hours (links don't expire as fast)
  AGGREGATOR: 12 * 60 * 60,

  // Direct: 7 days (stable links)
  DIRECT: 7 * 24 * 60 * 60,

  // Default fallback
  DEFAULT: 12 * 60 * 60,
} as const;

/**
 * Get appropriate TTL for provider
 */
export function getTTLForProvider(
  provider: 'amazon' | 'aggregator' | 'direct' | 'none'
): number {
  switch (provider) {
    case 'amazon':
      return CacheTTL.AMAZON;
    case 'aggregator':
      return CacheTTL.AGGREGATOR;
    case 'direct':
      return CacheTTL.DIRECT;
    default:
      return CacheTTL.DEFAULT;
  }
}
