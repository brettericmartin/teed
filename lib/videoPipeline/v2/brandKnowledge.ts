/**
 * Shared Brand Knowledge
 *
 * Product line → parent brand mappings and channel brand inference.
 * Extracted from gapResolver.ts for reuse across V1 and V2 pipelines.
 */

import type { VisionProduct } from '../types';

/**
 * Known product line prefixes that GPT-4o sometimes misidentifies as brands.
 * Maps prefix → actual parent brand.
 */
export const PRODUCT_LINE_BRANDS: Record<string, string> = {
  'a.i.': 'Callaway',
  'ai': 'Callaway',
  'opus': 'Callaway',
  'apex': 'Callaway',
  'elyte': 'Callaway',
  'paradym': 'Callaway',
  'chrome': 'Callaway',
  'mavrik': 'Callaway',
  'rogue': 'Callaway',
  'big bertha': 'Callaway',
  'jaws': 'Callaway',
  'qi': 'TaylorMade',
  'stealth': 'TaylorMade',
  'spider': 'TaylorMade',
  'sim': 'TaylorMade',
  'tp': 'TaylorMade',
  'p7': 'TaylorMade',
  'phantom': 'Titleist',
  'vokey': 'Titleist',
  'pro v1': 'Titleist',
  'tsi': 'Titleist',
  'gt': 'Titleist',
  'tri-hot': 'Odyssey',
  'ten': 'Odyssey',
  'z-star': 'Srixon',
  'zx': 'Srixon',
};

/** Golf brand keywords found in channel names */
export const CHANNEL_BRAND_KEYWORDS: Record<string, string> = {
  'callaway': 'Callaway',
  'taylormade': 'TaylorMade',
  'titleist': 'Titleist',
  'ping': 'Ping',
  'cobra': 'Cobra',
  'srixon': 'Srixon',
  'mizuno': 'Mizuno',
  'cleveland': 'Cleveland',
  'odyssey': 'Odyssey',
};

/** Common abbreviations for product fusion dedup */
export const ABBREVIATION_EXPANSIONS: Record<string, string> = {
  'mtn': 'mountain',
  'mt': 'mount',
  'tee': 't-shirt',
  't-shirt': 'tee',
  'tshirt': 't-shirt',
  'backpk': 'backpack',
  'bk': 'backpack',
  'jkt': 'jacket',
  'pnt': 'pant',
  'sht': 'shirt',
  'snkr': 'sneaker',
  'ss': 'short sleeve',
  'ls': 'long sleeve',
  'sl': 'sleeveless',
  'qz': 'quarter zip',
  'tech': 'technical',
  'perf': 'performance',
  'ltwt': 'lightweight',
  'lt': 'light',
  'ultralt': 'ultralight',
  'ul': 'ultralight',
  'wp': 'waterproof',
};

/**
 * Fix known brand misparses on a vision product.
 * GPT-4o sometimes reads a text overlay like "A.I. ONE MILLED 7T"
 * and sets brand="A.I." — this corrects it to "Callaway".
 */
export function fixProductBrand(product: VisionProduct, channelName: string): void {
  const brandLower = (product.brand || '').toLowerCase().trim();
  const nameLower = product.name.toLowerCase();

  // 1. Check if the "brand" is actually a known product line prefix
  if (brandLower && PRODUCT_LINE_BRANDS[brandLower]) {
    product.brand = PRODUCT_LINE_BRANDS[brandLower];
    return;
  }

  // 2. Check if product name starts with a known product line
  if (!product.brand || product.brand === 'Unknown' || product.brand === 'unknown') {
    for (const [prefix, parentBrand] of Object.entries(PRODUCT_LINE_BRANDS)) {
      if (nameLower.startsWith(prefix)) {
        product.brand = parentBrand;
        return;
      }
    }
  }

  // 3. If still no brand, try to infer from channel name
  if (!product.brand || product.brand === 'Unknown' || product.brand === 'unknown') {
    const channelLower = channelName.toLowerCase();
    for (const [keyword, brand] of Object.entries(CHANNEL_BRAND_KEYWORDS)) {
      if (channelLower.includes(keyword)) {
        product.brand = brand;
        return;
      }
    }
  }
}
