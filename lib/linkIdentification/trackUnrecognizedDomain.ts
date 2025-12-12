/**
 * Track Unrecognized Domains
 *
 * When a URL is processed and the domain isn't in our database,
 * we track it for future expansion of the brand database.
 */

import { createClient } from '@supabase/supabase-js';

// Lazy initialization of Supabase client
let supabaseClient: ReturnType<typeof createClient> | null = null;

function getSupabase() {
  if (!supabaseClient) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
      return null;
    }

    supabaseClient = createClient(url, key, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }
  return supabaseClient;
}

/**
 * Track an unrecognized domain in the database
 *
 * This is a fire-and-forget operation - it won't block the main pipeline
 * and failures are silently ignored.
 */
export async function trackUnrecognizedDomain(
  domain: string,
  url: string,
  suggestedBrand?: string | null,
  suggestedCategory?: string | null
): Promise<void> {
  // Don't track empty domains or common retailers we don't care about
  if (!domain || isIgnoredDomain(domain)) {
    return;
  }

  const supabase = getSupabase();
  if (!supabase) {
    return;
  }

  try {
    // Use the upsert function we created in the migration
    const { error } = await supabase.rpc('upsert_unrecognized_domain', {
      p_domain: domain,
      p_url: url,
      p_user_id: null, // We could pass user ID if available
    });

    if (error) {
      // Log but don't throw - this is non-critical
      console.warn('[TrackDomain] Failed to track domain:', domain, error.message);
    }

    // If we have AI suggestions, update them separately
    if (suggestedBrand || suggestedCategory) {
      await supabase
        .from('unrecognized_domains')
        .update({
          suggested_brand: suggestedBrand,
          suggested_category: suggestedCategory,
        })
        .eq('domain', domain)
        .is('suggested_brand', null); // Only update if not already set
    }
  } catch (error) {
    // Silently fail - tracking is non-critical
    console.warn('[TrackDomain] Error:', error);
  }
}

/**
 * Domains we don't want to track (general retailers, CDNs, etc.)
 */
const IGNORED_DOMAINS = new Set([
  // Already have these as retailers
  'amazon.com',
  'amazon.co.uk',
  'amazon.ca',
  'amazon.de',
  'ebay.com',
  'ebay.co.uk',
  'walmart.com',
  'target.com',
  'costco.com',
  // URL shorteners
  'bit.ly',
  'goo.gl',
  't.co',
  'tinyurl.com',
  'ow.ly',
  // CDNs and image hosts
  'cloudinary.com',
  'imgix.net',
  'imgur.com',
  's3.amazonaws.com',
  'cloudfront.net',
  // Social media
  'facebook.com',
  'twitter.com',
  'instagram.com',
  'youtube.com',
  'tiktok.com',
  'pinterest.com',
  // Generic
  'google.com',
  'localhost',
]);

function isIgnoredDomain(domain: string): boolean {
  const normalized = domain.toLowerCase().replace(/^www\./, '');

  // Check exact match
  if (IGNORED_DOMAINS.has(normalized)) {
    return true;
  }

  // Check if it's a subdomain of ignored domain
  for (const ignored of IGNORED_DOMAINS) {
    if (normalized.endsWith('.' + ignored)) {
      return true;
    }
  }

  return false;
}

/**
 * Batch track multiple unrecognized domains
 */
export async function trackUnrecognizedDomains(
  domains: Array<{ domain: string; url: string; suggestedBrand?: string; suggestedCategory?: string }>
): Promise<void> {
  await Promise.all(
    domains.map(({ domain, url, suggestedBrand, suggestedCategory }) =>
      trackUnrecognizedDomain(domain, url, suggestedBrand, suggestedCategory)
    )
  );
}
