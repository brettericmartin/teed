/**
 * Product Identifier — GPT-4o on Representative Frames
 *
 * Sends representative frames from text clusters to GPT-4o in batches of 5.
 * Each request includes pre-detected text as context, dramatically improving
 * accuracy: "Text detected: ['KETL Mtn', 'Sunshirt']. Identify the exact brand and model."
 *
 * Cost: ~$0.50 for 100 clusters.
 */

import { openai } from '../../openaiClient';
import type { FrameStore } from './frameStore';
import type { ProductCluster, V2IdentifiedProduct } from './types';
import { fixGarbledBrand, fuzzyMatchBrand } from './fuzzyBrandMatcher';

interface IdentificationBatchResult {
  products: V2IdentifiedProduct[];
  tokensUsed: number;
}

/**
 * Identify products from a batch of clusters using GPT-4o.
 */
async function identifyBatch(
  clusters: ProductCluster[],
  frameStore: FrameStore,
  transcriptContext: string,
): Promise<IdentificationBatchResult> {
  if (clusters.length === 0) return { products: [], tokensUsed: 0 };

  // Load representative frames
  const imageContent: Array<{
    type: 'image_url';
    image_url: { url: string; detail: 'high' };
  }> = [];

  const clusterMap: Array<{ cluster: ProductCluster; imageIdx: number }> = [];

  for (const cluster of clusters) {
    const base64 = await frameStore.getBase64(cluster.representativeFrameId);
    if (!base64) continue;

    clusterMap.push({ cluster, imageIdx: imageContent.length });
    imageContent.push({
      type: 'image_url',
      image_url: { url: base64, detail: 'high' },
    });
  }

  if (imageContent.length === 0) return { products: [], tokensUsed: 0 };

  // Build prompt with text context for each cluster
  const clusterDescriptions = clusterMap.map(({ cluster, imageIdx }) => {
    const meta = frameStore.getFrameMeta(cluster.representativeFrameId);
    const textList = cluster.texts.length > 0
      ? cluster.texts.map(t => `"${t}"`).join(', ')
      : 'none detected';
    return `Image ${imageIdx + 1} (${cluster.id}, ${meta?.timestampFormatted || '?'}):
  Text detected: [${textList}]
  ${cluster.transcriptContext ? `Transcript: "${cluster.transcriptContext}"` : ''}
  ${cluster.matchedBrand ? `Possible brand: ${cluster.matchedBrand}` : ''}`;
  }).join('\n\n');

  const transcriptSection = transcriptContext
    ? `\nVIDEO TRANSCRIPT CONTEXT (first 2000 chars):\n${transcriptContext.slice(0, 2000)}\n`
    : '';

  const prompt = `Identify the EXACT brand and model of each product shown in these video frames.

I've already detected text visible in each frame — use this to help identify products.

CLUSTERS TO IDENTIFY:
${clusterDescriptions}
${transcriptSection}
For each image, identify the product. Use the pre-detected text as strong evidence.

RULES:
1. The detected text often contains the brand name, model name, or both
2. If detected text says "KETL Mtn Sunshirt", the brand is "KETL Mtn" (or "KETL Mountain") and the product is "Sunshirt"
3. If you see a brand logo but the text detection missed it, still include it
4. Set confidence based on evidence: 95+ if text clearly shows brand+model, 80+ if brand visible but model unclear, 60+ if inference only
5. Return ONE product per image (the primary product shown)
6. If the image doesn't show a product (transition frame, person talking), return null for that cluster

Return JSON:
{
  "products": [
    {
      "clusterId": "cluster_007",
      "name": "Product Model Name (without brand prefix)",
      "brand": "Brand Name",
      "category": "category (e.g., shirt, backpack, laptop, headphones)",
      "color": "primary color if visible",
      "confidence": 90,
      "visualDescription": "brief description of what's shown"
    }
  ]
}

Only include products you can identify. Omit clusters where no product is visible.`;

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
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    const tokensUsed = response.usage?.total_tokens || 0;

    if (!content) return { products: [], tokensUsed };

    const parsed = JSON.parse(content);
    const rawProducts = parsed.products || [];

    const products: V2IdentifiedProduct[] = [];

    for (const rp of rawProducts) {
      const clusterEntry = clusterMap.find(
        ({ cluster }) => cluster.id === rp.clusterId
      );
      if (!clusterEntry) continue;

      const { cluster } = clusterEntry;
      const meta = frameStore.getFrameMeta(cluster.representativeFrameId);

      // Try to fix garbled brand names
      let brand = rp.brand || '';
      if (brand) {
        const corrected = fixGarbledBrand(brand);
        if (corrected) brand = corrected;
      }

      // Also try to match detected text against brand dictionary
      if (!brand || brand === 'Unknown') {
        for (const text of cluster.texts) {
          const match = fuzzyMatchBrand(text);
          if (match.brand) {
            brand = match.brand.name;
            break;
          }
        }
      }

      products.push({
        name: rp.name || cluster.primaryText,
        brand,
        category: rp.category,
        color: rp.color,
        confidence: Math.min(100, Math.max(0, rp.confidence || 60)),
        clusterId: cluster.id,
        frameId: cluster.representativeFrameId,
        detectedText: cluster.texts,
        visualDescription: rp.visualDescription,
        timestampMs: meta?.timestampMs || cluster.startMs,
        timestampFormatted: meta?.timestampFormatted || '',
        sources: ['vision', 'text_overlay'],
      });
    }

    return { products, tokensUsed };
  } catch (error) {
    console.error('[V2 ProductID] Batch failed:', error instanceof Error ? error.message : error);
    return { products: [], tokensUsed: 0 };
  }
}

/**
 * Identify products from all clusters.
 * Processes in batches of 5 clusters per GPT-4o call.
 */
export async function identifyProducts(
  clusters: ProductCluster[],
  frameStore: FrameStore,
  transcriptContext: string = '',
  onProgress?: (processed: number, total: number) => void,
): Promise<V2IdentifiedProduct[]> {
  const batchSize = 5;
  const allProducts: V2IdentifiedProduct[] = [];
  let totalTokens = 0;

  for (let i = 0; i < clusters.length; i += batchSize) {
    const batch = clusters.slice(i, i + batchSize);
    const { products, tokensUsed } = await identifyBatch(batch, frameStore, transcriptContext);
    allProducts.push(...products);
    totalTokens += tokensUsed;

    onProgress?.(Math.min(i + batchSize, clusters.length), clusters.length);
  }

  console.log(
    `[V2 ProductID] ${clusters.length} clusters → ${allProducts.length} products identified, ` +
    `${totalTokens} tokens used`
  );

  return allProducts;
}
