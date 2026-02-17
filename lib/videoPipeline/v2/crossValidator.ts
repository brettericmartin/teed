/**
 * Cross-Validator
 *
 * Matches products across three sources:
 * - Vision (from productIdentifier)
 * - Transcript (from GPT-4o transcript analysis)
 * - Description links (from identifyProduct)
 *
 * Multi-source matches get confidence boosts (+20 per additional source).
 * Uses fuzzy name matching + timestamp proximity (30s window).
 */

import { levenshteinDistance } from '@/lib/utils';
import type { TranscriptProduct, DescriptionIdentifiedProduct } from '../types';
import type { V2IdentifiedProduct, CrossValidatedProduct } from './types';

/** Check if two product names refer to the same product */
function namesMatch(a: string, b: string): boolean {
  const aLower = a.toLowerCase().trim();
  const bLower = b.toLowerCase().trim();

  // Exact match
  if (aLower === bLower) return true;

  // Substring match
  if (aLower.includes(bLower) || bLower.includes(aLower)) return true;

  // Word overlap: Jaccard ≥ 0.4
  const aWords = new Set(aLower.split(/\s+/).filter(w => w.length > 2));
  const bWords = new Set(bLower.split(/\s+/).filter(w => w.length > 2));
  if (aWords.size === 0 || bWords.size === 0) return false;

  const intersection = [...aWords].filter(w => bWords.has(w)).length;
  const union = new Set([...aWords, ...bWords]).size;
  if (union > 0 && intersection / union >= 0.4) return true;

  // Levenshtein distance for short names
  if (aLower.length < 20 && bLower.length < 20) {
    const maxDist = Math.max(1, Math.floor(Math.min(aLower.length, bLower.length) / 4));
    if (levenshteinDistance(aLower, bLower) <= maxDist) return true;
  }

  return false;
}

/** Check if a brand name matches */
function brandsMatch(a: string, b: string): boolean {
  if (!a || !b) return false;
  const aLower = a.toLowerCase().trim();
  const bLower = b.toLowerCase().trim();
  if (aLower === bLower) return true;
  if (aLower.includes(bLower) || bLower.includes(aLower)) return true;
  // Allow 1 edit distance for brand names ≥ 5 chars
  if (aLower.length >= 5 && bLower.length >= 5) {
    return levenshteinDistance(aLower, bLower) <= 1;
  }
  return false;
}

/**
 * Cross-validate vision products against transcript and description sources.
 */
export function crossValidate(
  visionProducts: V2IdentifiedProduct[],
  transcriptProducts: TranscriptProduct[],
  descriptionProducts: DescriptionIdentifiedProduct[],
  timestampWindowMs: number = 30_000,
): CrossValidatedProduct[] {
  const usedTranscriptIdx = new Set<number>();
  const usedDescIdx = new Set<number>();

  const results: CrossValidatedProduct[] = visionProducts.map(vp => {
    let confidence = vp.confidence;
    let transcriptMatch = false;
    let descriptionMatch = false;
    let purchaseUrl: string | undefined;
    let purchaseDomain: string | undefined;
    let isAffiliate: boolean | undefined;
    let productImageUrl: string | undefined;
    const sources = [...vp.sources];

    const vpFullName = vp.brand ? `${vp.brand} ${vp.name}` : vp.name;

    // Match against transcript products
    for (let i = 0; i < transcriptProducts.length; i++) {
      if (usedTranscriptIdx.has(i)) continue;
      const tp = transcriptProducts[i];
      const tpFullName = tp.brand ? `${tp.brand} ${tp.name}` : tp.name;

      // Check name similarity
      const nameOk = namesMatch(vpFullName, tpFullName) ||
        namesMatch(vp.name, tp.name) ||
        (vp.brand && tp.brand && brandsMatch(vp.brand, tp.brand) && (
          namesMatch(vp.name, tp.name) ||
          (vp.category && tp.category && vp.category.toLowerCase() === tp.category.toLowerCase())
        ));

      // Check timestamp proximity
      const timestampOk = !tp.timestampMs || !vp.timestampMs ||
        Math.abs(tp.timestampMs - vp.timestampMs) <= timestampWindowMs;

      if (nameOk && timestampOk) {
        usedTranscriptIdx.add(i);
        transcriptMatch = true;
        confidence += 20;
        if (!sources.includes('transcript')) sources.push('transcript');
        break;
      }
    }

    // Match against description products
    for (let i = 0; i < descriptionProducts.length; i++) {
      if (usedDescIdx.has(i)) continue;
      const dp = descriptionProducts[i];

      const nameOk = namesMatch(vpFullName, dp.name) ||
        namesMatch(vp.name, dp.name) ||
        (vp.brand && dp.brand && brandsMatch(vp.brand, dp.brand));

      if (nameOk) {
        usedDescIdx.add(i);
        descriptionMatch = true;
        confidence += 20;
        purchaseUrl = dp.purchaseUrl;
        purchaseDomain = dp.domain;
        isAffiliate = dp.isAffiliate;
        productImageUrl = dp.imageUrl;
        if (!sources.includes('description')) sources.push('description');
        break;
      }
    }

    return {
      ...vp,
      sources,
      validatedConfidence: Math.min(100, confidence),
      transcriptMatch,
      descriptionMatch,
      purchaseUrl,
      purchaseDomain,
      isAffiliate,
      productImageUrl,
    };
  });

  // Add unmatched transcript products as standalone entries
  for (let i = 0; i < transcriptProducts.length; i++) {
    if (usedTranscriptIdx.has(i)) continue;
    const tp = transcriptProducts[i];

    results.push({
      name: tp.name,
      brand: tp.brand || '',
      category: tp.category,
      confidence: 65,
      validatedConfidence: 65,
      clusterId: '',
      frameId: '',
      detectedText: [],
      timestampMs: tp.timestampMs || 0,
      timestampFormatted: tp.timestampFormatted || '',
      sources: ['transcript'],
      transcriptMatch: true,
      descriptionMatch: false,
    });
  }

  // Add unmatched description products as standalone entries
  for (let i = 0; i < descriptionProducts.length; i++) {
    if (usedDescIdx.has(i)) continue;
    const dp = descriptionProducts[i];

    results.push({
      name: dp.name,
      brand: dp.brand || '',
      category: dp.category,
      confidence: Math.round(dp.confidence * 100),
      validatedConfidence: Math.round(dp.confidence * 100),
      clusterId: '',
      frameId: '',
      detectedText: [],
      timestampMs: 0,
      timestampFormatted: '',
      sources: ['description'],
      transcriptMatch: false,
      descriptionMatch: true,
      purchaseUrl: dp.purchaseUrl,
      purchaseDomain: dp.domain,
      isAffiliate: dp.isAffiliate,
      productImageUrl: dp.imageUrl,
    });
  }

  const multiSource = results.filter(r => r.sources.length > 1).length;
  console.log(
    `[V2 CrossVal] ${results.length} total products, ${multiSource} multi-source matches`
  );

  return results;
}
