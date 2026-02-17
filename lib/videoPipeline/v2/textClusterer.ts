/**
 * Text Clusterer
 *
 * Groups consecutive frames with similar detected text into product clusters.
 * Each cluster represents one product being shown on screen.
 *
 * Algorithm:
 * 1. Sort frames by timestamp
 * 2. Group consecutive frames (within 6s) by Jaccard text overlap ≥ 0.5
 * 3. Pick the frame with the most detected text as representative
 * 4. Discard clusters with only generic text ("Subscribe", channel name, etc.)
 */

import type { TextDetectionResult, ProductCluster } from './types';

/** Jaccard similarity between two sets of strings */
function jaccardSimilarity(a: string[], b: string[]): number {
  if (a.length === 0 && b.length === 0) return 1;
  if (a.length === 0 || b.length === 0) return 0;

  const setA = new Set(a.map(s => s.toLowerCase().trim()));
  const setB = new Set(b.map(s => s.toLowerCase().trim()));

  let intersection = 0;
  for (const item of setA) {
    if (setB.has(item)) intersection++;
  }

  const union = new Set([...setA, ...setB]).size;
  return union > 0 ? intersection / union : 0;
}

/** Generic text that doesn't indicate a product */
const GENERIC_ONLY_PATTERNS = [
  /^subscri/i,
  /^like$/i,
  /^comment$/i,
  /^follow/i,
  /^share$/i,
  /^link\s+in/i,
  /^\d+$/,              // pure numbers
  /^#/,                 // hashtags
  /^@/,                 // handles
];

function isOnlyGenericText(texts: string[]): boolean {
  if (texts.length === 0) return true;
  return texts.every(t =>
    GENERIC_ONLY_PATTERNS.some(p => p.test(t.trim())) || t.trim().length <= 1
  );
}

/**
 * Group text detection results into product clusters.
 *
 * @param detections Text detection results sorted by timestamp
 * @param channelName Channel name to filter out (appears in many frames)
 * @param maxGapMs Max gap between consecutive frames in a cluster (default: 6000ms)
 * @param minJaccard Min Jaccard similarity to merge frames (default: 0.5)
 */
export function clusterTextDetections(
  detections: TextDetectionResult[],
  channelName: string = '',
  maxGapMs: number = 6000,
  minJaccard: number = 0.5,
): ProductCluster[] {
  // Filter to frames with product-relevant text
  const withText = detections
    .filter(d => d.hasProductText)
    .sort((a, b) => a.timestampMs - b.timestampMs);

  if (withText.length === 0) return [];

  // Filter out channel name from texts
  const channelLower = channelName.toLowerCase().trim();
  const filterTexts = (texts: string[]): string[] => {
    if (!channelLower) return texts;
    return texts.filter(t => {
      const lower = t.toLowerCase().trim();
      return lower !== channelLower && !lower.includes(channelLower);
    });
  };

  // Group consecutive frames into clusters
  const clusters: Array<{
    frames: TextDetectionResult[];
    filteredTexts: string[][];
  }> = [];

  let currentCluster = {
    frames: [withText[0]],
    filteredTexts: [filterTexts(withText[0].texts)],
  };

  for (let i = 1; i < withText.length; i++) {
    const current = withText[i];
    const prev = withText[i - 1];
    const gap = current.timestampMs - prev.timestampMs;
    const currentTexts = filterTexts(current.texts);
    const prevTexts = filterTexts(prev.texts);

    // Check if this frame belongs in the current cluster
    if (gap <= maxGapMs && jaccardSimilarity(currentTexts, prevTexts) >= minJaccard) {
      currentCluster.frames.push(current);
      currentCluster.filteredTexts.push(currentTexts);
    } else {
      clusters.push(currentCluster);
      currentCluster = {
        frames: [current],
        filteredTexts: [currentTexts],
      };
    }
  }
  clusters.push(currentCluster);

  // Build ProductCluster objects
  const productClusters: ProductCluster[] = [];
  let clusterId = 0;

  for (const cluster of clusters) {
    // Union all texts across frames
    const allTexts = new Set<string>();
    for (const texts of cluster.filteredTexts) {
      for (const text of texts) {
        allTexts.add(text);
      }
    }
    const textsArray = Array.from(allTexts);

    // Skip clusters with only generic text
    if (isOnlyGenericText(textsArray)) continue;

    // Find representative frame (most detected text)
    let bestFrameIdx = 0;
    let bestTextCount = 0;
    for (let i = 0; i < cluster.frames.length; i++) {
      const count = cluster.filteredTexts[i].length;
      if (count > bestTextCount) {
        bestTextCount = count;
        bestFrameIdx = i;
      }
    }

    // Find primary text (most common across frames)
    const textFrequency = new Map<string, number>();
    for (const texts of cluster.filteredTexts) {
      for (const text of texts) {
        const lower = text.toLowerCase().trim();
        textFrequency.set(lower, (textFrequency.get(lower) || 0) + 1);
      }
    }
    let primaryText = '';
    let maxFreq = 0;
    for (const [text, freq] of textFrequency) {
      if (freq > maxFreq) {
        maxFreq = freq;
        primaryText = text;
      }
    }
    // Use the original-case version
    const primaryOriginal = textsArray.find(
      t => t.toLowerCase().trim() === primaryText
    ) || primaryText;

    productClusters.push({
      id: `cluster_${String(clusterId++).padStart(3, '0')}`,
      representativeFrameId: cluster.frames[bestFrameIdx].frameId,
      frameIds: cluster.frames.map(f => f.frameId),
      startMs: cluster.frames[0].timestampMs,
      endMs: cluster.frames[cluster.frames.length - 1].timestampMs,
      texts: textsArray,
      primaryText: primaryOriginal,
    });
  }

  console.log(
    `[V2 Cluster] ${withText.length} text frames → ${productClusters.length} product clusters`
  );

  return productClusters;
}
