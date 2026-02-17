/**
 * Gap Resolver V2 — Uncapped Resolution
 *
 * Processes ALL unmatched transcript mentions (no cap on 5 like V1).
 * For each unmatched mention:
 * 1. Check text-detection clusters within 30s
 * 2. If none found, extract 3 new 720p frames at mention ±10s
 * 3. Send targeted GPT-4o vision query
 */

import { execFile } from 'child_process';
import { promises as fsPromises } from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import { openai } from '../../openaiClient';
import type { TranscriptProduct } from '../types';
import type { ProductCluster, V2IdentifiedProduct, CrossValidatedProduct } from './types';
import type { FrameStore } from './frameStore';
import { fixGarbledBrand } from './fuzzyBrandMatcher';

function execPromise(command: string, args: string[], timeoutMs = 60_000): Promise<string> {
  return new Promise((resolve, reject) => {
    execFile(command, args, {
      maxBuffer: 50 * 1024 * 1024,
      timeout: timeoutMs,
    }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error(`${command} failed: ${error.message}\nstderr: ${stderr}`));
      } else {
        resolve(stdout);
      }
    });
  });
}

function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

interface GapEntry {
  transcriptProduct: TranscriptProduct;
  timestampMs: number;
}

/**
 * Find transcript products that weren't matched during cross-validation.
 */
export function findUnmatchedMentions(
  transcriptProducts: TranscriptProduct[],
  validatedProducts: CrossValidatedProduct[],
): GapEntry[] {
  const matched = new Set<number>();

  // Find which transcript products were already matched
  for (const vp of validatedProducts) {
    if (!vp.transcriptMatch) continue;
    // Find the transcript product that matched
    for (let i = 0; i < transcriptProducts.length; i++) {
      if (matched.has(i)) continue;
      const tp = transcriptProducts[i];
      const tpName = `${tp.brand || ''} ${tp.name}`.toLowerCase().trim();
      const vpName = `${vp.brand || ''} ${vp.name}`.toLowerCase().trim();
      if (tpName === vpName || tpName.includes(vpName) || vpName.includes(tpName)) {
        matched.add(i);
        break;
      }
    }
  }

  return transcriptProducts
    .filter((_, i) => !matched.has(i))
    .filter(tp => tp.timestampMs && tp.timestampMs > 0)
    .map(tp => ({
      transcriptProduct: tp,
      timestampMs: tp.timestampMs!,
    }));
}

/**
 * Try to resolve a gap using existing text clusters.
 * Looks for clusters within 30s of the transcript mention.
 */
function findClusterMatch(
  gap: GapEntry,
  clusters: ProductCluster[],
  windowMs: number = 30_000,
): ProductCluster | null {
  const ts = gap.timestampMs;
  const productName = `${gap.transcriptProduct.brand || ''} ${gap.transcriptProduct.name}`.toLowerCase();

  for (const cluster of clusters) {
    // Check timestamp proximity
    if (Math.abs(cluster.startMs - ts) > windowMs &&
        Math.abs(cluster.endMs - ts) > windowMs) continue;

    // Check if any cluster text matches the product
    for (const text of cluster.texts) {
      const textLower = text.toLowerCase();
      if (productName.includes(textLower) || textLower.includes(productName)) {
        return cluster;
      }
      // Check brand match
      const brand = gap.transcriptProduct.brand?.toLowerCase() || '';
      if (brand && textLower.includes(brand)) return cluster;
    }
  }

  return null;
}

/**
 * Extract targeted frames from the video and run GPT-4o vision.
 */
async function resolveWithVision(
  gap: GapEntry,
  videoPath: string,
  tempDir: string,
): Promise<V2IdentifiedProduct | null> {
  const ts = gap.timestampMs;
  const offsets = [-10_000, 0, 10_000]; // ±10s around mention
  const frames: Array<{ base64: string; timestampMs: number }> = [];

  for (const offset of offsets) {
    const frameTs = Math.max(0, ts + offset);
    const frameSec = Math.floor(frameTs / 1000);
    const outPath = path.join(tempDir, `gap_${frameSec}.jpg`);

    try {
      await execPromise('ffmpeg', [
        '-ss', String(frameSec),
        '-i', videoPath,
        '-frames:v', '1',
        '-q:v', '2',
        '-y',
        outPath,
      ], 15_000);

      const stat = await fsPromises.stat(outPath);
      if (stat.size < 500) continue;

      const buffer = await fsPromises.readFile(outPath);
      const base64 = `data:image/jpeg;base64,${buffer.toString('base64')}`;
      frames.push({ base64, timestampMs: frameTs });
    } catch {
      // Skip failed frame extraction
    }
  }

  if (frames.length === 0) return null;

  // Send targeted vision query
  const imageContent = frames.map(f => ({
    type: 'image_url' as const,
    image_url: { url: f.base64, detail: 'high' as const },
  }));

  const tp = gap.transcriptProduct;
  const prompt = `The video creator mentions "${tp.brand || ''} ${tp.name}" (category: ${tp.category || 'unknown'}) around timestamp ${formatTimestamp(ts)}.

These frames are from around that moment. Identify the EXACT product shown.

Context: "${tp.mentionContext || ''}"

Look for:
1. Text overlays showing brand/model
2. Brand logos
3. Distinctive product design

Return JSON:
{
  "product": {
    "name": "Model Name",
    "brand": "Brand",
    "category": "${tp.category || 'product'}",
    "confidence": 85,
    "visualDescription": "what you see"
  }
}

If you cannot identify the specific product, return { "product": null }.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          ...imageContent,
        ],
      }],
      response_format: { type: 'json_object' },
      temperature: 0.2,
      max_tokens: 1000,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;

    const parsed = JSON.parse(content);
    if (!parsed.product) return null;

    let brand = parsed.product.brand || tp.brand || '';
    const corrected = fixGarbledBrand(brand);
    if (corrected) brand = corrected;

    return {
      name: parsed.product.name || tp.name,
      brand,
      category: parsed.product.category || tp.category,
      confidence: Math.min(100, Math.max(0, parsed.product.confidence || 60)),
      clusterId: '',
      frameId: '',
      detectedText: [],
      visualDescription: parsed.product.visualDescription,
      timestampMs: ts,
      timestampFormatted: formatTimestamp(ts),
      sources: ['vision', 'transcript'],
    };
  } catch (error) {
    console.error('[V2 GapResolver] Vision query failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Resolve ALL unmatched transcript mentions.
 * No cap — processes every unmatched mention.
 */
export async function resolveAllGaps(
  gaps: GapEntry[],
  clusters: ProductCluster[],
  frameStore: FrameStore,
  videoPath: string,
  tempDir: string,
  onProgress?: (resolved: number, total: number) => void,
): Promise<V2IdentifiedProduct[]> {
  const resolved: V2IdentifiedProduct[] = [];

  for (let i = 0; i < gaps.length; i++) {
    const gap = gaps[i];

    // First try: match against existing text clusters
    const clusterMatch = findClusterMatch(gap, clusters);
    if (clusterMatch) {
      const tp = gap.transcriptProduct;
      resolved.push({
        name: tp.name,
        brand: tp.brand || '',
        category: tp.category,
        confidence: 70,
        clusterId: clusterMatch.id,
        frameId: clusterMatch.representativeFrameId,
        detectedText: clusterMatch.texts,
        timestampMs: gap.timestampMs,
        timestampFormatted: formatTimestamp(gap.timestampMs),
        sources: ['transcript', 'text_overlay'],
      });
      onProgress?.(i + 1, gaps.length);
      continue;
    }

    // Second try: extract new frames and run vision
    const product = await resolveWithVision(gap, videoPath, tempDir);
    if (product && product.confidence >= 55) {
      resolved.push(product);
    } else {
      // Keep as transcript-only product
      const tp = gap.transcriptProduct;
      resolved.push({
        name: tp.name,
        brand: tp.brand || '',
        category: tp.category,
        confidence: 50,
        clusterId: '',
        frameId: '',
        detectedText: [],
        timestampMs: gap.timestampMs,
        timestampFormatted: formatTimestamp(gap.timestampMs),
        sources: ['transcript'],
      });
    }

    onProgress?.(i + 1, gaps.length);
  }

  console.log(
    `[V2 GapResolver] ${gaps.length} gaps → ${resolved.filter(r => r.confidence >= 55).length} resolved, ` +
    `${resolved.filter(r => r.confidence < 55).length} transcript-only`
  );

  return resolved;
}
