/**
 * Amazon Associates Affiliate Service
 *
 * Implements Amazon affiliate link generation with full compliance:
 * - HTTPS-only URLs (Amazon requirement)
 * - No link shortening/masking (Amazon policy)
 * - 24-hour cookie expiration tracking
 * - International domain support
 * - FTC disclosure requirements
 * - SubID support for attribution
 *
 * Best Practices from 2025 Research:
 * - Use "nofollow" rel attribute (handled in UI)
 * - Open links in new tabs (handled in UI)
 * - Clear "As an Amazon Associate..." disclosure
 */

import {
  AffiliateService,
  AffiliateUrlRequest,
  AffiliateUrlResponse,
  AffiliateError,
  AffiliateErrorCode,
} from '@/lib/types/affiliate';
import { getAffiliateCache, getTTLForProvider } from './AffiliateCache';

/**
 * Supported Amazon domains (international)
 */
const AMAZON_DOMAINS = [
  'amazon.com',      // United States
  'amazon.co.uk',    // United Kingdom
  'amazon.ca',       // Canada
  'amazon.de',       // Germany
  'amazon.fr',       // France
  'amazon.es',       // Spain
  'amazon.it',       // Italy
  'amazon.co.jp',    // Japan
  'amazon.in',       // India
  'amazon.com.au',   // Australia
  'amazon.com.br',   // Brazil
  'amazon.com.mx',   // Mexico
  'amazon.nl',       // Netherlands
  'amazon.se',       // Sweden
  'amazon.sg',       // Singapore
  'amazon.ae',       // UAE
  'amazon.sa',       // Saudi Arabia
] as const;

/**
 * FTC-compliant disclosure text
 */
const DEFAULT_AMAZON_DISCLOSURE =
  'As an Amazon Associate, I earn from qualifying purchases.';

export interface AmazonAffiliateConfig {
  associateTag: string;
  cookieDurationHours?: number; // Default: 24
  enableCaching?: boolean; // Default: true
  subId?: string; // Optional SubID for attribution
}

export class AmazonAffiliateService implements AffiliateService {
  private associateTag: string;
  private cookieDurationHours: number;
  private enableCaching: boolean;
  private subId?: string;
  private cache = getAffiliateCache();

  constructor(config: AmazonAffiliateConfig) {
    if (!config.associateTag || config.associateTag.trim().length === 0) {
      throw new AffiliateError(
        'Amazon Associate Tag is required',
        AffiliateErrorCode.INVALID_CONFIG,
        'amazon'
      );
    }

    this.associateTag = config.associateTag.trim();
    this.cookieDurationHours = config.cookieDurationHours || 24;
    this.enableCaching = config.enableCaching !== false;
    this.subId = config.subId;
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

      // Check if this is an Amazon URL
      if (!this.isAmazonDomain(url.hostname)) {
        return {
          affiliateUrl: request.rawUrl,
          provider: 'none',
        };
      }

      // Amazon requires HTTPS
      if (url.protocol !== 'https:') {
        url.protocol = 'https:';
        console.warn(
          `[AmazonAffiliateService] Upgraded HTTP to HTTPS for compliance: ${request.rawUrl}`
        );
      }

      // Check cache first (unless forceRefresh)
      if (this.enableCaching && !request.forceRefresh) {
        const cached = await this.cache.getCachedUrl(request.rawUrl);
        if (cached) {
          const expiresAt = new Date(
            Date.now() + this.cookieDurationHours * 60 * 60 * 1000
          ).toISOString();

          return {
            affiliateUrl: cached,
            provider: 'amazon',
            merchantDomain: url.hostname,
            cached: true,
            expiresAt,
            disclosure: {
              required: true,
              text: DEFAULT_AMAZON_DISCLOSURE,
            },
          };
        }
      }

      // Generate affiliate URL
      const affiliateUrl = this.generateAffiliateUrl(url);

      // Calculate expiration (Amazon 24hr cookie)
      const expiresAt = new Date(
        Date.now() + this.cookieDurationHours * 60 * 60 * 1000
      ).toISOString();

      // Cache the result
      if (this.enableCaching) {
        const ttl = getTTLForProvider('amazon');
        await this.cache.setCachedUrl(
          request.rawUrl,
          affiliateUrl,
          ttl
        );
      }

      return {
        affiliateUrl,
        provider: 'amazon',
        merchantDomain: url.hostname,
        cached: false,
        expiresAt,
        disclosure: {
          required: true,
          text: DEFAULT_AMAZON_DISCLOSURE,
        },
      };
    } catch (error: any) {
      console.error('[AmazonAffiliateService] Error generating affiliate URL:', error);

      // Fallback to original URL on error
      return {
        affiliateUrl: request.rawUrl,
        provider: 'none',
        error: error.message || 'Failed to generate Amazon affiliate URL',
      };
    }
  }

  /**
   * Generate Amazon affiliate URL with proper parameters
   */
  private generateAffiliateUrl(url: URL): string {
    // Remove existing affiliate tags (avoid double-tagging)
    url.searchParams.delete('tag');
    url.searchParams.delete('linkCode');
    url.searchParams.delete('psc'); // Amazon tracking param that can conflict

    // Add associate tag
    url.searchParams.set('tag', this.associateTag);

    // Add SubID for attribution (if provided)
    if (this.subId) {
      url.searchParams.set('ascsubtag', this.subId);
    }

    // Add linkCode for better tracking (optional)
    // This helps Amazon identify the source as API/programmatic
    url.searchParams.set('linkCode', 'll2');

    return url.toString();
  }

  /**
   * Check if hostname is an Amazon domain
   */
  private isAmazonDomain(hostname: string): boolean {
    const lowerHostname = hostname.toLowerCase();

    return AMAZON_DOMAINS.some((domain) => {
      return (
        lowerHostname === domain ||
        lowerHostname.endsWith(`.${domain}`)
      );
    });
  }

  supportsUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return this.isAmazonDomain(parsed.hostname);
    } catch {
      return false;
    }
  }

  getName(): string {
    return 'AmazonAffiliateService';
  }

  /**
   * Extract product ASIN from Amazon URL
   * Useful for analytics and product matching
   */
  static extractASIN(url: string): string | null {
    try {
      const parsed = new URL(url);

      // Pattern 1: /dp/ASIN
      const dpMatch = parsed.pathname.match(/\/dp\/([A-Z0-9]{10})/i);
      if (dpMatch) return dpMatch[1];

      // Pattern 2: /gp/product/ASIN
      const gpMatch = parsed.pathname.match(/\/gp\/product\/([A-Z0-9]{10})/i);
      if (gpMatch) return gpMatch[1];

      // Pattern 3: Query parameter
      const asinParam = parsed.searchParams.get('asin');
      if (asinParam && /^[A-Z0-9]{10}$/i.test(asinParam)) {
        return asinParam;
      }

      return null;
    } catch {
      return null;
    }
  }

  /**
   * Check if Amazon URL is a valid product page
   * (not search, homepage, etc.)
   */
  static isProductUrl(url: string): boolean {
    try {
      const parsed = new URL(url);

      // Must be Amazon domain
      const isAmazon = AMAZON_DOMAINS.some((domain) =>
        parsed.hostname.toLowerCase().includes(domain)
      );
      if (!isAmazon) return false;

      // Must have product identifier
      const hasProductPath =
        parsed.pathname.includes('/dp/') ||
        parsed.pathname.includes('/gp/product/');

      const hasASIN = this.extractASIN(url) !== null;

      return hasProductPath && hasASIN;
    } catch {
      return false;
    }
  }

  /**
   * Get disclosure text
   */
  getDisclosureText(): string {
    return DEFAULT_AMAZON_DISCLOSURE;
  }
}
