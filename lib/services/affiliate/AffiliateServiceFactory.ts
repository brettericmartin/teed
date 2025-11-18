/**
 * Affiliate Service Factory
 *
 * Creates appropriate affiliate services based on:
 * - Environment configuration (AFFILIATE_MODE)
 * - User settings (creator_settings table)
 * - System defaults
 *
 * Supports multiple providers in priority order:
 * 1. Amazon (if URL is Amazon and tag configured)
 * 2. Aggregator (if configured)
 * 3. Noop (fallback - returns original URLs)
 */

import { AffiliateService, AffiliateMode, CreatorSettings } from '@/lib/types/affiliate';
import { NoopAffiliateService } from './NoopAffiliateService';
import { AmazonAffiliateService } from './AmazonAffiliateService';
import { AggregatorAffiliateService } from './AggregatorAffiliateService';
import { getPlatformAmazonTag } from './PlatformAffiliateSettings';

export class AffiliateServiceFactory {
  /**
   * Create affiliate services based on environment configuration
   *
   * Returns array of services in priority order:
   * - Services are tried in sequence until one supports the URL
   * - Last service should always be a fallback (Noop)
   */
  static create(config: {
    mode: AffiliateMode;
    amazonTag?: string;
    aggregatorEndpoint?: string;
    aggregatorKey?: string;
    aggregatorPublisherId?: string;
  }): AffiliateService[] {
    const services: AffiliateService[] = [];

    try {
      switch (config.mode) {
        case 'none':
          services.push(new NoopAffiliateService());
          break;

        case 'amazon':
          if (config.amazonTag) {
            services.push(
              new AmazonAffiliateService({
                associateTag: config.amazonTag,
              })
            );
          } else {
            console.warn(
              '[AffiliateServiceFactory] Amazon mode enabled but no tag provided'
            );
            services.push(new NoopAffiliateService());
          }
          break;

        case 'aggregator':
          if (config.aggregatorEndpoint && config.aggregatorKey) {
            services.push(
              new AggregatorAffiliateService({
                apiEndpoint: config.aggregatorEndpoint,
                apiKey: config.aggregatorKey,
                publisherId: config.aggregatorPublisherId,
              })
            );
          } else {
            console.warn(
              '[AffiliateServiceFactory] Aggregator mode enabled but config missing'
            );
            services.push(new NoopAffiliateService());
          }
          break;

        case 'amazon+aggregator':
          // Try Amazon first (highest commission rates)
          if (config.amazonTag) {
            services.push(
              new AmazonAffiliateService({
                associateTag: config.amazonTag,
              })
            );
          }

          // Then try aggregator for non-Amazon URLs
          if (config.aggregatorEndpoint && config.aggregatorKey) {
            services.push(
              new AggregatorAffiliateService({
                apiEndpoint: config.aggregatorEndpoint,
                apiKey: config.aggregatorKey,
                publisherId: config.aggregatorPublisherId,
              })
            );
          }

          // Ensure we have at least one service
          if (services.length === 0) {
            console.warn(
              '[AffiliateServiceFactory] Combined mode but no services configured'
            );
            services.push(new NoopAffiliateService());
          }
          break;

        default:
          console.warn(
            `[AffiliateServiceFactory] Unknown mode: ${config.mode}, using noop`
          );
          services.push(new NoopAffiliateService());
      }

      // Always add Noop as final fallback if not already present
      const hasNoop = services.some((s) => s instanceof NoopAffiliateService);
      if (!hasNoop) {
        services.push(new NoopAffiliateService());
      }

      console.log(
        `[AffiliateServiceFactory] Created ${services.length} service(s): ${services.map((s) => s.getName()).join(', ')}`
      );

      return services;
    } catch (error) {
      console.error('[AffiliateServiceFactory] Error creating services:', error);
      // Failsafe: return noop
      return [new NoopAffiliateService()];
    }
  }

  /**
   * Create affiliate services for a specific user
   * Reads creator_settings from database
   *
   * PLATFORM-FIRST STRATEGY:
   * - If platform affiliate is enabled, use platform tags (platform earns)
   * - Otherwise, use user's tags (user earns)
   */
  static async createForUser(
    profileId: string,
    supabase: any
  ): Promise<AffiliateService[]> {
    try {
      // **1. Check for platform-level affiliate settings (priority)**
      const platformAmazonTag = await getPlatformAmazonTag();

      if (platformAmazonTag) {
        console.log(
          `[AffiliateServiceFactory] Using PLATFORM affiliate tag for all links (platform revenue mode)`
        );

        // Platform mode: Use platform's affiliate tags
        return this.create({
          mode: 'amazon', // Platform only supports Amazon for now
          amazonTag: platformAmazonTag,
        });
      }

      // **2. Fall back to user's affiliate settings**
      console.log(
        `[AffiliateServiceFactory] No platform tags, checking user ${profileId} settings`
      );

      // Fetch user's creator settings
      const { data: settings, error } = await supabase
        .from('creator_settings')
        .select('*')
        .eq('profile_id', profileId)
        .maybeSingle();

      if (error) {
        console.error(
          '[AffiliateServiceFactory] Error fetching creator settings:',
          error
        );
        return [new NoopAffiliateService()];
      }

      // Check if user has affiliate enabled
      if (!settings || !settings.affiliate_enabled) {
        console.log(
          `[AffiliateServiceFactory] Affiliate disabled for user ${profileId}`
        );
        return [new NoopAffiliateService()];
      }

      // Get environment mode
      const mode = (process.env.AFFILIATE_MODE || 'none') as AffiliateMode;

      // Use user's Amazon tag if available, fallback to env
      const amazonTag =
        settings.amazon_associate_tag || process.env.AMAZON_ASSOCIATE_TAG;

      console.log(
        `[AffiliateServiceFactory] Using USER affiliate tag for ${profileId} (user revenue mode)`
      );

      return this.create({
        mode,
        amazonTag,
        aggregatorEndpoint: process.env.AFFILIATE_AGGREGATOR_BASE_URL,
        aggregatorKey: process.env.AFFILIATE_AGGREGATOR_API_KEY,
        aggregatorPublisherId: process.env.AFFILIATE_AGGREGATOR_PUBLISHER_ID,
      });
    } catch (error) {
      console.error(
        '[AffiliateServiceFactory] Error in createForUser:',
        error
      );
      return [new NoopAffiliateService()];
    }
  }

  /**
   * Create affiliate services from environment only
   * Use when user context is not available
   */
  static createFromEnvironment(): AffiliateService[] {
    const mode = (process.env.AFFILIATE_MODE || 'none') as AffiliateMode;

    return this.create({
      mode,
      amazonTag: process.env.AMAZON_ASSOCIATE_TAG,
      aggregatorEndpoint: process.env.AFFILIATE_AGGREGATOR_BASE_URL,
      aggregatorKey: process.env.AFFILIATE_AGGREGATOR_API_KEY,
      aggregatorPublisherId: process.env.AFFILIATE_AGGREGATOR_PUBLISHER_ID,
    });
  }

  /**
   * Process URL through service chain
   * Returns first successful affiliate URL or original URL
   */
  static async processUrl(
    services: AffiliateService[],
    rawUrl: string,
    options?: {
      itemId?: string;
      userId?: string;
      forceRefresh?: boolean;
    }
  ) {
    for (const service of services) {
      if (service.supportsUrl(rawUrl)) {
        console.log(
          `[AffiliateServiceFactory] Processing URL with ${service.getName()}`
        );

        const result = await service.getAffiliateUrl({
          rawUrl,
          ...options,
        });

        // If successful (not 'none' provider or no error), return it
        if (result.provider !== 'none' || result.error) {
          return result;
        }
      }
    }

    // Fallback: return original URL with noop provider
    return {
      affiliateUrl: rawUrl,
      provider: 'none' as const,
      error: 'No affiliate service supported this URL',
    };
  }
}

// ═══════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════

/**
 * Get affiliate disclosure text for services
 */
export function getDisclosureText(services: AffiliateService[]): string {
  const disclosures: string[] = [];

  for (const service of services) {
    if (service instanceof AmazonAffiliateService) {
      disclosures.push(service.getDisclosureText());
    }
  }

  // Add generic disclosure if other providers present
  const hasOtherProviders = services.some(
    (s) =>
      !(s instanceof AmazonAffiliateService) &&
      !(s instanceof NoopAffiliateService)
  );

  if (hasOtherProviders) {
    disclosures.push(
      'This page contains affiliate links. If you purchase through these links, I may earn a commission at no extra cost to you.'
    );
  }

  // Deduplicate and join
  return [...new Set(disclosures)].join(' ');
}

/**
 * Check if affiliate is enabled for user
 */
export async function isAffiliateEnabledForUser(
  profileId: string,
  supabase: any
): Promise<boolean> {
  try {
    const { data: settings } = await supabase
      .from('creator_settings')
      .select('affiliate_enabled')
      .eq('profile_id', profileId)
      .maybeSingle();

    return settings?.affiliate_enabled || false;
  } catch (error) {
    console.error('[AffiliateServiceFactory] Error checking affiliate status:', error);
    return false;
  }
}
