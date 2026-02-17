/**
 * Product Fusion V2 — Improved Dedup
 *
 * Deduplicates products using:
 * - Levenshtein distance on full names
 * - Word Jaccard overlap
 * - Abbreviation expansion ("Mtn" → "Mountain", "T-Shirt" → "Tee")
 * - Brand normalization
 *
 * Produces the final DraftProduct list for bag assembly.
 */

import { levenshteinDistance } from '@/lib/utils';
import { ABBREVIATION_EXPANSIONS } from './brandKnowledge';
import type { CrossValidatedProduct } from './types';
import type { DraftProduct, DraftLink, ProductSource } from '../types';
import type { FrameStore } from './frameStore';

let nextProductId = 1;
function genProductId(): string {
  return `draft-${nextProductId++}`;
}

/** Expand abbreviations in a string */
function expandAbbreviations(text: string): string {
  const words = text.toLowerCase().split(/[\s\-_]+/);
  return words.map(w => ABBREVIATION_EXPANSIONS[w] || w).join(' ');
}

/** Normalize a product name for comparison */
function normalizeName(brand: string, name: string): string {
  const full = `${brand} ${name}`.toLowerCase().trim();
  return expandAbbreviations(full);
}

/** Check if two products are duplicates */
function isDuplicate(a: CrossValidatedProduct, b: CrossValidatedProduct): boolean {
  const nameA = normalizeName(a.brand, a.name);
  const nameB = normalizeName(b.brand, b.name);

  // Exact match after normalization
  if (nameA === nameB) return true;

  // Substring containment
  if (nameA.includes(nameB) || nameB.includes(nameA)) return true;

  // Word Jaccard overlap — but EXCLUDE brand words to prevent
  // "Apple MacBook Pro" and "Apple iPad Pro" from being merged
  const brandWordsA = new Set((a.brand || '').toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const brandWordsB = new Set((b.brand || '').toLowerCase().split(/\s+/).filter(w => w.length > 2));
  const allBrandWords = new Set([...brandWordsA, ...brandWordsB]);

  const wordsA = new Set(nameA.split(/\s+/).filter(w => w.length > 2 && !allBrandWords.has(w)));
  const wordsB = new Set(nameB.split(/\s+/).filter(w => w.length > 2 && !allBrandWords.has(w)));
  if (wordsA.size > 0 && wordsB.size > 0) {
    const intersection = [...wordsA].filter(w => wordsB.has(w)).length;
    const union = new Set([...wordsA, ...wordsB]).size;
    if (union > 0 && intersection / union >= 0.6) return true;
  }

  // Levenshtein distance (for short names, after expansion)
  if (nameA.length < 30 && nameB.length < 30) {
    const maxDist = Math.max(2, Math.floor(Math.min(nameA.length, nameB.length) / 5));
    if (levenshteinDistance(nameA, nameB) <= maxDist) return true;
  }

  // Brand match + SAME product name (not just category)
  // "Apple MacBook Pro" and "Apple Macbook Pro 14" are duplicates,
  // but "Apple MacBook Pro" and "Apple iPad Pro" are NOT.
  if (a.brand && b.brand && a.brand.toLowerCase() === b.brand.toLowerCase()) {
    const nameOnlyA = a.name.toLowerCase().trim();
    const nameOnlyB = b.name.toLowerCase().trim();
    // Only merge if one name contains the other (same product, different detail level)
    if (nameOnlyA.includes(nameOnlyB) || nameOnlyB.includes(nameOnlyA)) return true;
  }

  return false;
}

/**
 * Merge two duplicate products, keeping the best data from each.
 */
function mergeProducts(primary: CrossValidatedProduct, secondary: CrossValidatedProduct): CrossValidatedProduct {
  // Keep the one with higher confidence as primary
  const [a, b] = primary.validatedConfidence >= secondary.validatedConfidence
    ? [primary, secondary]
    : [secondary, primary];

  // Merge sources
  const sources = [...new Set([...a.sources, ...b.sources])] as CrossValidatedProduct['sources'];

  return {
    ...a,
    sources,
    validatedConfidence: Math.min(100, Math.max(a.validatedConfidence, b.validatedConfidence) + 10),
    transcriptMatch: a.transcriptMatch || b.transcriptMatch,
    descriptionMatch: a.descriptionMatch || b.descriptionMatch,
    purchaseUrl: a.purchaseUrl || b.purchaseUrl,
    purchaseDomain: a.purchaseDomain || b.purchaseDomain,
    isAffiliate: a.isAffiliate ?? b.isAffiliate,
    productImageUrl: a.productImageUrl || b.productImageUrl,
    // Use the longer/more descriptive name
    name: a.name.length >= b.name.length ? a.name : b.name,
    brand: (a.brand && a.brand !== 'Unknown') ? a.brand : b.brand,
  };
}

/**
 * Deduplicate and fuse all products into the final DraftProduct list.
 */
export async function fuseProducts(
  products: CrossValidatedProduct[],
  frameStore: FrameStore,
  videoUrl: string,
): Promise<DraftProduct[]> {
  nextProductId = 1;

  // Step 1: Deduplicate
  const deduped: CrossValidatedProduct[] = [];

  for (const product of products) {
    let merged = false;
    for (let i = 0; i < deduped.length; i++) {
      if (isDuplicate(product, deduped[i])) {
        deduped[i] = mergeProducts(deduped[i], product);
        merged = true;
        break;
      }
    }
    if (!merged) {
      deduped.push({ ...product });
    }
  }

  const removedCount = products.length - deduped.length;
  if (removedCount > 0) {
    console.log(`[V2 Fusion] Dedup: ${products.length} → ${deduped.length} (removed ${removedCount} duplicates)`);
  }

  // Step 2: Sort by timestamp, then by confidence
  deduped.sort((a, b) => {
    if (a.timestampMs && b.timestampMs) return a.timestampMs - b.timestampMs;
    if (a.timestampMs) return -1;
    if (b.timestampMs) return 1;
    return b.validatedConfidence - a.validatedConfidence;
  });

  // Step 3: Convert to DraftProduct
  const draftProducts: DraftProduct[] = [];

  for (const p of deduped) {
    // Load frame as base64 for the video frame URL
    let videoFrameUrl: string | undefined;
    if (p.frameId) {
      videoFrameUrl = await frameStore.getBase64(p.frameId) || undefined;
    }

    // Build purchase links
    const purchaseLinks: DraftLink[] = [];
    if (p.purchaseUrl && p.purchaseDomain) {
      purchaseLinks.push({
        url: p.purchaseUrl,
        domain: p.purchaseDomain,
        isAffiliate: p.isAffiliate || false,
      });
    }

    // Map V2 sources to pipeline ProductSource
    const sources: ProductSource[] = [];
    if (p.sources.includes('vision') || p.sources.includes('text_overlay')) {
      if (!sources.includes('vision')) sources.push('vision');
    }
    if (p.sources.includes('transcript')) {
      if (!sources.includes('transcript')) sources.push('transcript');
    }
    if (p.sources.includes('description')) {
      if (!sources.includes('description')) sources.push('description');
    }

    draftProducts.push({
      id: genProductId(),
      name: p.name,
      brand: p.brand || '',
      category: p.category,
      color: p.color,
      description: p.visualDescription,
      confidence: p.validatedConfidence,
      sources,
      videoFrameUrl,
      productImageUrl: p.productImageUrl,
      purchaseUrl: purchaseLinks[0]?.url,
      purchaseLinks,
      timestamp: p.timestampFormatted,
      timestampMs: p.timestampMs,
      pipelineMetadata: {
        videoUrl,
        timestamp: p.timestampFormatted,
        sources,
        confidence: p.validatedConfidence,
      },
    });
  }

  return draftProducts;
}
