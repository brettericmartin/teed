/**
 * Product Library
 *
 * Persistent cache for scraped product data.
 * Reduces API usage by storing successful scrapes and serving them on future requests.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export interface ProductLibraryEntry {
  id: string;
  url: string;
  url_hash: string;
  domain: string;
  brand: string | null;
  product_name: string | null;
  full_name: string | null;
  category: string | null;
  description: string | null;
  price: string | null;
  image_url: string | null;
  specifications: string[];
  confidence: number;
  source: string;
  scrape_successful: boolean;
  hit_count: number;
  last_hit_at: string | null;
  created_at: string;
  updated_at: string;
}

export interface SaveToLibraryParams {
  url: string;
  domain: string;
  brand: string | null;
  productName: string | null;
  fullName: string | null;
  category: string | null;
  description: string | null;
  price: string | null;
  imageUrl: string | null;
  specifications: string[];
  confidence: number;
  source: string;
  scrapeSuccessful?: boolean;
}

// Create a Supabase client using service role for server-side operations
function getSupabaseAdmin(): SupabaseClient | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Generate a URL hash for consistent lookups
 */
export function hashUrl(url: string): string {
  // Normalize URL before hashing
  try {
    const parsed = new URL(url);
    // Remove tracking params
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref', 'fbclid', 'gclid'];
    trackingParams.forEach(param => parsed.searchParams.delete(param));
    // Lowercase hostname
    parsed.hostname = parsed.hostname.toLowerCase();
    return crypto.createHash('sha256').update(parsed.toString()).digest('hex');
  } catch {
    return crypto.createHash('sha256').update(url).digest('hex');
  }
}

/**
 * Look up a product by URL in the library
 * Returns the cached data if found and confidence is high enough
 */
export async function lookupInLibrary(url: string, minConfidence = 0.7): Promise<ProductLibraryEntry | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.log('[ProductLibrary] No Supabase client available');
    return null;
  }

  const urlHash = hashUrl(url);

  try {
    const { data, error } = await supabase
      .from('product_library')
      .select('*')
      .eq('url_hash', urlHash)
      .gte('confidence', minConfidence)
      .eq('scrape_successful', true)
      .single();

    if (error || !data) {
      return null;
    }

    // Update hit count and last_hit_at (fire-and-forget)
    (async () => {
      try {
        await supabase
          .from('product_library')
          .update({
            hit_count: (data.hit_count || 0) + 1,
            last_hit_at: new Date().toISOString(),
          })
          .eq('id', data.id);
      } catch {
        // Ignore errors
      }
    })();

    console.log(`[ProductLibrary] Cache hit for ${data.domain}: ${data.full_name}`);
    return data as ProductLibraryEntry;
  } catch (error) {
    console.error('[ProductLibrary] Lookup error:', error);
    return null;
  }
}

/**
 * Save a product to the library
 * Only saves if confidence meets threshold
 */
export async function saveToLibrary(params: SaveToLibraryParams): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    console.log('[ProductLibrary] No Supabase client available');
    return false;
  }

  // Only save high-confidence results
  if (params.confidence < 0.7) {
    console.log(`[ProductLibrary] Skipping low-confidence result (${params.confidence})`);
    return false;
  }

  const urlHash = hashUrl(params.url);

  try {
    const entry = {
      url: params.url,
      url_hash: urlHash,
      domain: params.domain,
      brand: params.brand,
      product_name: params.productName,
      full_name: params.fullName,
      category: params.category,
      description: params.description,
      price: params.price,
      image_url: params.imageUrl,
      specifications: params.specifications || [],
      confidence: params.confidence,
      source: params.source,
      scrape_successful: params.scrapeSuccessful ?? true,
    };

    // Upsert (insert or update if exists)
    const { error } = await supabase
      .from('product_library')
      .upsert(entry, {
        onConflict: 'url_hash',
        ignoreDuplicates: false, // Update if exists with higher confidence
      });

    if (error) {
      console.error('[ProductLibrary] Save error:', error);
      return false;
    }

    console.log(`[ProductLibrary] Saved: ${params.fullName} (${params.source}, ${(params.confidence * 100).toFixed(0)}%)`);
    return true;
  } catch (error) {
    console.error('[ProductLibrary] Save error:', error);
    return false;
  }
}

/**
 * Get library stats for admin dashboard
 */
export async function getLibraryStats(): Promise<{
  totalEntries: number;
  highConfidenceEntries: number;
  topDomains: { domain: string; count: number }[];
  recentHits: number;
} | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return null;
  }

  try {
    // Get total count
    const { count: totalEntries } = await supabase
      .from('product_library')
      .select('*', { count: 'exact', head: true });

    // Get high confidence count
    const { count: highConfidenceEntries } = await supabase
      .from('product_library')
      .select('*', { count: 'exact', head: true })
      .gte('confidence', 0.8);

    // Get top domains (manual aggregation since Supabase doesn't support GROUP BY easily)
    const { data: entries } = await supabase
      .from('product_library')
      .select('domain')
      .limit(1000);

    const domainCounts = new Map<string, number>();
    entries?.forEach(e => {
      domainCounts.set(e.domain, (domainCounts.get(e.domain) || 0) + 1);
    });

    const topDomains = Array.from(domainCounts.entries())
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get recent hits (last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { count: recentHits } = await supabase
      .from('product_library')
      .select('*', { count: 'exact', head: true })
      .gte('last_hit_at', yesterday);

    return {
      totalEntries: totalEntries || 0,
      highConfidenceEntries: highConfidenceEntries || 0,
      topDomains,
      recentHits: recentHits || 0,
    };
  } catch (error) {
    console.error('[ProductLibrary] Stats error:', error);
    return null;
  }
}
