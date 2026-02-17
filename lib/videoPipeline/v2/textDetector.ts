/**
 * Text Detector — GPT-4o-mini Batch Text Detection
 *
 * Sends ALL frames through GPT-4o-mini with `detail: low` to detect
 * visible text (brand names, model numbers, product specs).
 * Processes in batches of 20 frames. Cost: ~$0.08 for 500 frames.
 *
 * This is the key innovation of V2: cheap text detection on every frame
 * lets us know WHERE products are shown before expensive GPT-4o analysis.
 */

import { openai } from '../../openaiClient';
import type { FrameStore } from './frameStore';
import type { TextDetectionResult } from './types';

/** Generic text patterns to filter out (not product-related) */
const GENERIC_TEXT_PATTERNS = [
  /^subscri/i,
  /^like\s/i,
  /^comment\s/i,
  /^follow\s/i,
  /^share\s/i,
  /^click\s/i,
  /^link\s+in\s+/i,
  /^#\w+$/,           // hashtags
  /^@\w+$/,           // handles
  /^\d+[KkMm]?\s*(views|likes|followers|subscribers)/i,
  /^(intro|outro|subscribe|bell|notification)/i,
];

function isGenericText(text: string): boolean {
  return GENERIC_TEXT_PATTERNS.some(pattern => pattern.test(text.trim()));
}

interface TextDetectionBatchResult {
  results: TextDetectionResult[];
  tokensUsed: number;
}

/**
 * Detect text in a batch of frames using GPT-4o-mini.
 * Sends up to 20 frames per request with `detail: low`.
 */
async function detectTextBatch(
  frameIds: string[],
  frameStore: FrameStore,
): Promise<TextDetectionBatchResult> {
  const base64Map = await frameStore.getBase64Batch(frameIds);
  if (base64Map.size === 0) return { results: [], tokensUsed: 0 };

  // Build image content for API call
  const imageContent: Array<{
    type: 'image_url';
    image_url: { url: string; detail: 'low' };
  }> = [];
  const orderedIds: string[] = [];

  for (const [id, base64] of base64Map) {
    imageContent.push({
      type: 'image_url',
      image_url: { url: base64, detail: 'low' },
    });
    orderedIds.push(id);
  }

  const frameLabels = orderedIds
    .map((id, i) => {
      const meta = frameStore.getFrameMeta(id);
      return `Image ${i + 1} (${id}): ${meta?.timestampFormatted || '?'}`;
    })
    .join('\n');

  const prompt = `For each image, list ALL visible text you can read. Include:
- Product names, brand names, model numbers
- Text overlays, captions, labels
- Price tags, specs, descriptions
- Any text on products, packaging, or screens

FRAME INDEX:
${frameLabels}

Return JSON:
{
  "frames": [
    { "index": 0, "texts": ["Brand Name", "Model X Pro", "some other text"] },
    { "index": 1, "texts": [] }
  ]
}

If no text is visible in a frame, return an empty texts array.
Include ALL text you can read, even partial text.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          ...imageContent,
        ],
      }],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 4000,
    });

    const content = response.choices[0]?.message?.content;
    const tokensUsed = response.usage?.total_tokens || 0;

    if (!content) return { results: [], tokensUsed };

    const parsed = JSON.parse(content);
    const frameResults = parsed.frames || [];

    const results: TextDetectionResult[] = [];
    for (const fr of frameResults) {
      const idx = typeof fr.index === 'number' ? fr.index : -1;
      if (idx < 0 || idx >= orderedIds.length) continue;

      const frameId = orderedIds[idx];
      const meta = frameStore.getFrameMeta(frameId);
      const texts: string[] = (fr.texts || []).filter(
        (t: unknown): t is string => typeof t === 'string' && t.trim().length > 0
      );

      // Filter out generic/non-product text
      const productTexts = texts.filter(t => !isGenericText(t));

      results.push({
        frameId,
        timestampMs: meta?.timestampMs || 0,
        texts,
        hasProductText: productTexts.length > 0,
      });
    }

    return { results, tokensUsed };
  } catch (error) {
    console.error('[V2 TextDetect] Batch failed:', error instanceof Error ? error.message : error);
    return { results: [], tokensUsed: 0 };
  }
}

/**
 * Run text detection on all frames.
 * Processes in batches of 20, yielding progress updates.
 */
export async function detectTextInAllFrames(
  frameStore: FrameStore,
  onProgress?: (processed: number, total: number) => void,
): Promise<TextDetectionResult[]> {
  const allFrameIds = frameStore.getAllFrameIds();
  const batchSize = 20;
  const allResults: TextDetectionResult[] = [];
  let totalTokens = 0;

  for (let i = 0; i < allFrameIds.length; i += batchSize) {
    const batch = allFrameIds.slice(i, i + batchSize);

    // Retry with backoff on rate limit errors
    let retries = 3;
    let result: TextDetectionBatchResult = { results: [], tokensUsed: 0 };
    while (retries > 0) {
      result = await detectTextBatch(batch, frameStore);
      if (result.results.length > 0 || retries === 1) break;
      // If batch returned nothing, might be a rate limit — wait and retry
      retries--;
      if (retries > 0) {
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }

    allResults.push(...result.results);
    totalTokens += result.tokensUsed;

    onProgress?.(Math.min(i + batchSize, allFrameIds.length), allFrameIds.length);
  }

  const framesWithText = allResults.filter(r => r.texts.length > 0).length;
  const framesWithProductText = allResults.filter(r => r.hasProductText).length;

  console.log(
    `[V2 TextDetect] ${allResults.length} frames analyzed, ` +
    `${framesWithText} with text, ${framesWithProductText} with product text, ` +
    `${totalTokens} tokens used`
  );

  return allResults;
}
