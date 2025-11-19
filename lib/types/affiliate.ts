/**
 * Affiliate Link Management Types
 * Comprehensive type definitions for affiliate monetization system
 */

// ═══════════════════════════════════════════════════════════
// Provider Types
// ═══════════════════════════════════════════════════════════

/**
 * Supported affiliate providers
 * - none: No affiliate processing (passthrough)
 * - amazon: Amazon Associates
 * - aggregator: Third-party aggregator (Skimlinks, Impact, etc.)
 * - direct: Direct merchant affiliate program
 */
export type AffiliateProviderType = 'none' | 'amazon' | 'aggregator' | 'direct';

/**
 * Affiliate mode configuration
 */
export type AffiliateMode = 'none' | 'amazon' | 'aggregator' | 'amazon+aggregator';

// ═══════════════════════════════════════════════════════════
// Request/Response Types
// ═══════════════════════════════════════════════════════════

/**
 * Input for affiliate URL generation
 */
export interface AffiliateUrlRequest {
  rawUrl: string;
  itemId?: string; // For tracking and caching
  userId?: string; // For user-specific settings
  forceRefresh?: boolean; // Bypass cache
}

/**
 * Output from affiliate URL generation
 */
export interface AffiliateUrlResponse {
  affiliateUrl: string;
  provider: AffiliateProviderType;
  merchantDomain?: string;
  cached?: boolean;
  expiresAt?: string; // ISO timestamp for Amazon 24hr cookie
  error?: string;
  disclosure?: {
    required: boolean;
    text: string;
  };
}

// ═══════════════════════════════════════════════════════════
// Database Row Types
// ═══════════════════════════════════════════════════════════

/**
 * affiliate_links table row
 */
export interface AffiliateLink {
  id: string;
  bag_item_id: string;

  // URLs
  raw_url: string;
  affiliate_url: string;
  provider: AffiliateProviderType;
  merchant_domain: string | null;

  // FTC Compliance
  disclosure_text: string;
  disclosure_required: boolean;

  // Amazon 24hr cookie compliance
  cookie_expires_at: string | null;
  is_active: boolean;

  // Tracking
  clicks: number;
  last_click_at: string | null;
  last_clicked_ip: string | null;
  last_clicked_user_agent: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * Insertable affiliate link (without generated fields)
 */
export interface AffiliateInsert {
  bag_item_id: string;
  raw_url: string;
  affiliate_url: string;
  provider: AffiliateProviderType;
  merchant_domain?: string;
  disclosure_text?: string;
  disclosure_required?: boolean;
  cookie_expires_at?: string;
  is_active?: boolean;
}

/**
 * Updatable affiliate link fields
 */
export interface AffiliateUpdate {
  affiliate_url?: string;
  merchant_domain?: string;
  disclosure_text?: string;
  is_active?: boolean;
  cookie_expires_at?: string;
}

/**
 * creator_settings table row
 */
export interface CreatorSettings {
  id: string;
  profile_id: string;

  // Feature flags
  is_pro: boolean;
  affiliate_enabled: boolean;

  // Affiliate configuration
  amazon_associate_tag: string | null;

  // FTC Compliance & Privacy
  custom_disclosure_text: string | null;
  show_disclosure: boolean;
  allow_link_tracking: boolean;

  // Limits
  max_bags: number;

  // Customization
  custom_domain: string | null;
  theme_preset: string | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

/**
 * affiliate_clicks table row
 */
export interface AffiliateClick {
  id: string;
  affiliate_link_id: string;

  // Tracking data
  clicked_at: string;
  ip_address: string | null;
  user_agent: string | null;
  referrer: string | null;

  // Session
  session_id: string | null;

  // Geographic (optional)
  country_code: string | null;
  region: string | null;

  // Device
  device_type: 'mobile' | 'tablet' | 'desktop' | 'unknown' | null;

  // Timestamps
  created_at: string;
}

/**
 * Click event for insertion
 */
export interface ClickEventInsert {
  affiliate_link_id: string;
  ip_address?: string;
  user_agent?: string;
  referrer?: string;
  session_id?: string;
  country_code?: string;
  region?: string;
  device_type?: 'mobile' | 'tablet' | 'desktop' | 'unknown';
}

// ═══════════════════════════════════════════════════════════
// Service Interfaces
// ═══════════════════════════════════════════════════════════

/**
 * Core affiliate service interface
 * All affiliate providers must implement this
 */
export interface AffiliateService {
  /**
   * Convert a raw URL into an affiliate URL
   * Returns original URL if affiliate processing fails or is disabled
   */
  getAffiliateUrl(request: AffiliateUrlRequest): Promise<AffiliateUrlResponse>;

  /**
   * Check if a URL is supported by this provider
   */
  supportsUrl(url: string): boolean;

  /**
   * Get provider name for logging/debugging
   */
  getName(): string;
}

/**
 * Caching interface for affiliate URLs
 */
export interface AffiliateCache {
  /**
   * Get cached affiliate URL
   * @returns Cached URL or null if not found/expired
   */
  getCachedUrl(rawUrl: string): Promise<string | null>;

  /**
   * Cache an affiliate URL
   * @param rawUrl Original URL
   * @param affiliateUrl Generated affiliate URL
   * @param ttl Time to live in seconds (23 hours for Amazon)
   */
  setCachedUrl(rawUrl: string, affiliateUrl: string, ttl: number): Promise<void>;

  /**
   * Invalidate cached URL
   */
  invalidateUrl(rawUrl: string): Promise<void>;

  /**
   * Clear all cached URLs (admin/maintenance)
   */
  clearAll(): Promise<void>;
}

// ═══════════════════════════════════════════════════════════
// Analytics Types
// ═══════════════════════════════════════════════════════════

/**
 * Click statistics for a bag
 */
export interface BagClickStats {
  total_clicks: number;
  unique_sessions: number;
  clicks_last_7_days: number;
  clicks_last_30_days: number;
  top_item_name: string | null;
  top_item_clicks: number | null;
}

/**
 * Click statistics for an item
 */
export interface ItemClickStats {
  total_clicks: number;
  clicks_today: number;
  clicks_last_7_days: number;
  clicks_last_30_days: number;
  avg_clicks_per_day: number;
  last_clicked_at: string | null;
}

/**
 * Aggregate analytics for creator
 */
export interface CreatorAnalytics {
  total_clicks: number;
  total_bags: number;
  total_items_with_links: number;
  clicks_last_30_days: number;
  estimated_earnings: number | null; // Requires conversion tracking
  top_performing_bags: Array<{
    bag_id: string;
    bag_title: string;
    clicks: number;
  }>;
  top_performing_items: Array<{
    item_id: string;
    item_name: string;
    clicks: number;
  }>;
}

// ═══════════════════════════════════════════════════════════
// Utility Types
// ═══════════════════════════════════════════════════════════

/**
 * Parsed merchant information from URL
 */
export interface MerchantInfo {
  domain: string;
  name: string;
  supported: boolean;
  provider: AffiliateProviderType;
}

/**
 * Link health status
 */
export interface LinkHealth {
  link_id: string;
  is_active: boolean;
  is_expired: boolean;
  needs_refresh: boolean;
  last_checked_at: string;
  error_message?: string;
}

/**
 * Disclosure configuration
 */
export interface DisclosureConfig {
  enabled: boolean;
  text: string;
  position: 'top' | 'bottom' | 'inline';
  style: 'banner' | 'badge' | 'text';
}

// ═══════════════════════════════════════════════════════════
// Configuration Types
// ═══════════════════════════════════════════════════════════

/**
 * Amazon-specific configuration
 */
export interface AmazonConfig {
  associateTag: string;
  cookieDuration: number; // in hours, default 24
  internationalDomains: string[];
}

/**
 * Aggregator configuration
 */
export interface AggregatorConfig {
  apiEndpoint: string;
  apiKey: string;
  timeout: number; // in milliseconds
  retryAttempts: number;
}

/**
 * Global affiliate system configuration
 */
export interface AffiliateConfig {
  mode: AffiliateMode;
  amazon?: AmazonConfig;
  aggregator?: AggregatorConfig;
  cacheEnabled: boolean;
  cacheTTL: number; // in seconds
  trackingEnabled: boolean;
  disclosureRequired: boolean;
  defaultDisclosureText: string;
}

// ═══════════════════════════════════════════════════════════
// Error Types
// ═══════════════════════════════════════════════════════════

/**
 * Affiliate-specific errors
 */
export class AffiliateError extends Error {
  constructor(
    message: string,
    public code: string,
    public provider?: AffiliateProviderType,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'AffiliateError';
  }
}

/**
 * Error codes
 */
export enum AffiliateErrorCode {
  INVALID_URL = 'INVALID_URL',
  PROVIDER_UNAVAILABLE = 'PROVIDER_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  INVALID_CONFIG = 'INVALID_CONFIG',
  CACHE_ERROR = 'CACHE_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
  COMPLIANCE_ERROR = 'COMPLIANCE_ERROR',
}
