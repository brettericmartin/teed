/**
 * Platform Affiliate Settings Service
 *
 * Fetches and caches platform-level affiliate configurations.
 * When enabled, platform tags will be injected instead of user tags,
 * allowing the platform to earn commissions.
 */

import { createClient } from '@supabase/supabase-js';

export interface PlatformAffiliateSetting {
  network: string;
  is_enabled: boolean;
  credentials: Record<string, string>;
}

class PlatformAffiliateSettingsCache {
  private cache: Map<string, PlatformAffiliateSetting> = new Map();
  private cacheExpiry: number = 5 * 60 * 1000; // 5 minutes
  private lastFetch: number = 0;

  async getPlatformSettings(): Promise<Map<string, PlatformAffiliateSetting>> {
    const now = Date.now();

    // Return cached if still valid
    if (now - this.lastFetch < this.cacheExpiry && this.cache.size > 0) {
      return this.cache;
    }

    // Fetch fresh settings
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false,
          },
        }
      );

      const { data, error } = await supabase
        .from('platform_affiliate_settings')
        .select('*')
        .eq('is_enabled', true);

      if (error) {
        console.error('[PlatformAffiliateSettings] Error fetching settings:', error);
        return this.cache; // Return stale cache on error
      }

      // Update cache
      this.cache.clear();
      data?.forEach((setting: any) => {
        this.cache.set(setting.network, {
          network: setting.network,
          is_enabled: setting.is_enabled,
          credentials: setting.credentials || {},
        });
      });

      this.lastFetch = now;
      console.log(`[PlatformAffiliateSettings] Loaded ${this.cache.size} enabled networks`);

      return this.cache;
    } catch (error) {
      console.error('[PlatformAffiliateSettings] Exception:', error);
      return this.cache;
    }
  }

  async getSettingForNetwork(network: string): Promise<PlatformAffiliateSetting | null> {
    const settings = await this.getPlatformSettings();
    return settings.get(network) || null;
  }

  clearCache() {
    this.cache.clear();
    this.lastFetch = 0;
  }
}

// Singleton instance
const platformSettingsCache = new PlatformAffiliateSettingsCache();

export async function getPlatformAmazonTag(): Promise<string | null> {
  const setting = await platformSettingsCache.getSettingForNetwork('amazon');
  if (setting && setting.is_enabled) {
    return setting.credentials.associate_tag || null;
  }
  return null;
}

export async function getPlatformImpactSettings(): Promise<{ publisherId: string; campaignId?: string } | null> {
  const setting = await platformSettingsCache.getSettingForNetwork('impact');
  if (setting && setting.is_enabled) {
    const publisherId = setting.credentials.publisher_id;
    const campaignId = setting.credentials.campaign_id;
    if (publisherId) {
      return { publisherId, campaignId: campaignId || undefined };
    }
  }
  return null;
}

export async function getPlatformCJSettings(): Promise<{ websiteId: string } | null> {
  const setting = await platformSettingsCache.getSettingForNetwork('cj');
  if (setting && setting.is_enabled) {
    const websiteId = setting.credentials.website_id;
    if (websiteId) {
      return { websiteId };
    }
  }
  return null;
}

export function clearPlatformSettingsCache() {
  platformSettingsCache.clearCache();
}
