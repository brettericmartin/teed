/**
 * Aggregator Affiliate Service (Skimlinks-style)
 *
 * Supports multi-merchant affiliate networks:
 * - Skimlinks
 * - Impact
 * - Commission Junction
 * - ShareASale
 * - Custom aggregators
 *
 * Current Status: STUB - Returns original URL
 * TODO Phase 5: Implement real API integration
 *
 * Architecture Pattern:
 * 1. Send URL to aggregator API
 * 2. Receive wrapped affiliate URL
 * 3. Cache for performance
 * 4. Track clicks via SubID
 */

import {
  AffiliateService,
  AffiliateUrlRequest,
  AffiliateUrlResponse,
  AffiliateError,
  AffiliateErrorCode,
} from '@/lib/types/affiliate';
import { getAffiliateCache, getTTLForProvider } from './AffiliateCache';

export interface AggregatorConfig {
  apiEndpoint: string;
  apiKey: string;
  publisherId?: string;
  timeout?: number; // in milliseconds, default 5000
  retryAttempts?: number; // default 3
}

export class AggregatorAffiliateService implements AffiliateService {
  private apiEndpoint: string;
  private apiKey: string;
  private publisherId?: string;
  private timeout: number;
  private retryAttempts: number;
  private cache = getAffiliateCache();

  constructor(config: AggregatorConfig) {
    if (!config.apiEndpoint || !config.apiKey) {
      throw new AffiliateError(
        'Aggregator API endpoint and key are required',
        AffiliateErrorCode.INVALID_CONFIG,
        'aggregator'
      );
    }

    this.apiEndpoint = config.apiEndpoint.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = config.apiKey;
    this.publisherId = config.publisherId;
    this.timeout = config.timeout || 5000;
    this.retryAttempts = config.retryAttempts || 3;
  }

  async getAffiliateUrl(
    request: AffiliateUrlRequest
  ): Promise<AffiliateUrlResponse> {
    try {
      // Validate URL
      let url: URL;
      try {
        url = new URL(request.rawUrl);
      } catch {
        return {
          affiliateUrl: request.rawUrl,
          provider: 'none',
          error: 'Invalid URL format',
        };
      }

      // Check cache first
      if (!request.forceRefresh) {
        const cached = await this.cache.getCachedUrl(request.rawUrl);
        if (cached) {
          return {
            affiliateUrl: cached,
            provider: 'aggregator',
            merchantDomain: url.hostname,
            cached: true,
          };
        }
      }

      // TODO Phase 5: Implement real aggregator API call
      // For now, return original URL as fallback
      console.warn(
        '[AggregatorAffiliateService] STUB - Not yet implemented. Returning original URL.'
      );

      const affiliateUrl = await this.callAggregatorAPI(request.rawUrl);

      // Cache the result
      const ttl = getTTLForProvider('aggregator');
      await this.cache.setCachedUrl(
        request.rawUrl,
        affiliateUrl,
        ttl
      );

      return {
        affiliateUrl,
        provider: 'aggregator',
        merchantDomain: url.hostname,
        cached: false,
      };
    } catch (error: any) {
      console.error('[AggregatorAffiliateService] Error:', error);

      // Graceful fallback to original URL
      return {
        affiliateUrl: request.rawUrl,
        provider: 'none',
        error: error.message || 'Aggregator service unavailable',
      };
    }
  }

  /**
   * Call aggregator API to get affiliate URL
   * TODO Phase 5: Implement actual API integration
   */
  private async callAggregatorAPI(rawUrl: string): Promise<string> {
    // STUB: For now, just return the original URL
    // TODO: Implement actual API call based on provider

    /* Example Skimlinks API call:

    const response = await fetch(`${this.apiEndpoint}/api/links`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: rawUrl,
        publisher_id: this.publisherId,
      }),
      signal: AbortSignal.timeout(this.timeout),
    });

    if (!response.ok) {
      throw new AffiliateError(
        `Aggregator API error: ${response.statusText}`,
        AffiliateErrorCode.PROVIDER_UNAVAILABLE,
        'aggregator'
      );
    }

    const data = await response.json();
    return data.affiliate_url || rawUrl;
    */

    return rawUrl; // Stub fallback
  }

  /**
   * Retry logic with exponential backoff
   * TODO Phase 5: Implement for production reliability
   */
  private async retryWithBackoff<T>(
    fn: () => Promise<T>,
    attempt: number = 0
  ): Promise<T> {
    try {
      return await fn();
    } catch (error: any) {
      // Don't retry on client errors
      if (error.code === AffiliateErrorCode.INVALID_URL) {
        throw error;
      }

      // Retry on rate limits and server errors
      if (attempt < this.retryAttempts) {
        const delay = Math.pow(2, attempt) * 1000; // 1s, 2s, 4s
        console.log(
          `[AggregatorAffiliateService] Retrying in ${delay}ms (attempt ${attempt + 1}/${this.retryAttempts})`
        );

        await new Promise((resolve) => setTimeout(resolve, delay));
        return this.retryWithBackoff(fn, attempt + 1);
      }

      throw error;
    }
  }

  supportsUrl(url: string): boolean {
    try {
      new URL(url);
      // Aggregator supports all URLs except Amazon (handled by AmazonService)
      return !url.toLowerCase().includes('amazon');
    } catch {
      return false;
    }
  }

  getName(): string {
    return 'AggregatorAffiliateService';
  }

  /**
   * Extract merchant domain from URL
   */
  private extractDomain(url: string): string | undefined {
    try {
      return new URL(url).hostname;
    } catch {
      return undefined;
    }
  }
}

// ═══════════════════════════════════════════════════════════
// Provider-Specific Implementations (Future)
// ═══════════════════════════════════════════════════════════

/**
 * TODO Phase 5: Skimlinks-specific implementation
 *
 * API Documentation: https://developers.skimlinks.com/
 *
 * Example Request:
 * POST https://go.redirectingat.com/
 * {
 *   "url": "https://example.com/product",
 *   "pub_id": "12345",
 *   "custom_id": "bag_item_uuid"
 * }
 *
 * Response:
 * {
 *   "affiliate_url": "https://go.skimresources.com/...",
 *   "merchant": "Example Store",
 *   "commission_rate": 5.0
 * }
 */
export class SkimlinksAffiliateService extends AggregatorAffiliateService {
  constructor(apiKey: string, publisherId: string) {
    super({
      apiEndpoint: 'https://go.redirectingat.com',
      apiKey,
      publisherId,
    });
  }

  // Override with Skimlinks-specific implementation
}

/**
 * TODO Phase 5: Impact-specific implementation
 *
 * API Documentation: https://developer.impact.com/
 */
export class ImpactAffiliateService extends AggregatorAffiliateService {
  constructor(apiKey: string, accountSid: string) {
    super({
      apiEndpoint: 'https://api.impact.com',
      apiKey,
      publisherId: accountSid,
    });
  }

  // Override with Impact-specific implementation
}

/**
 * TODO Phase 5: Generic aggregator for custom implementations
 */
export class CustomAggregatorService extends AggregatorAffiliateService {
  // Use base implementation with custom endpoint
}
