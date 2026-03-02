import { openai } from '@/lib/openaiClient';
import type { VisualSearchItem, IdentifiedItem, WebDetectionResult } from './types';

/** Max concurrent GPT-4o calls */
const CONCURRENCY_LIMIT = 5;

/**
 * Stage 4: Identify each cropped item using GPT-4o + web detection hints.
 *
 * Sends each crop individually for focused identification.
 * When web detection results are available, they're injected as hints.
 * Runs in parallel with a concurrency limit.
 */
export async function identifyItems(
  items: VisualSearchItem[],
  bagType?: string
): Promise<IdentifiedItem[]> {
  const results: IdentifiedItem[] = [];

  // Process in batches of CONCURRENCY_LIMIT
  for (let i = 0; i < items.length; i += CONCURRENCY_LIMIT) {
    const batch = items.slice(i, i + CONCURRENCY_LIMIT);
    const batchResults = await Promise.all(
      batch.map((item) => identifySingleItem(item, bagType))
    );
    results.push(...batchResults);
  }

  return results;
}

async function identifySingleItem(
  item: VisualSearchItem,
  bagType?: string
): Promise<IdentifiedItem> {
  const contextHint = bagType ? `\nThis item is from a "${bagType}" collection/setup.` : '';
  const webHints = buildWebDetectionHints(item.webDetection);

  const prompt = `This is a cropped photo of a "${item.label}" from a larger scene.${contextHint}
${webHints}
TASK: Identify the brand, model name, and color of this product.

INSTRUCTIONS:
1. Describe what you see: shape, colors, logos, text, distinguishing design features
2. Read any text/labels EXACTLY as printed — do not autocorrect or "fix" obscure brand names (e.g., "MANBA" is MANBA, not "Mamba"; "UGREEN" is UGREEN, not "Green")
3. Identify the brand using ALL available evidence — visible logos/text, distinctive design language, signature colorways, iconic product shapes, and material choices
4. Many brands have unmistakable design signatures (e.g., Klipsch copper woofers, IKEA ALEX drawer proportions, Apple aluminum unibody). USE these confidently.
5. Provide the most specific model you can. If you know the brand and product line but not the exact model, give the product line (e.g., "Reference" series, "ALEX" line).
6. If no brand text, logo, or unmistakable design signature is visible, return brand as null. Do NOT guess a brand based on vague shape alone.
7. If WEB DETECTION HINTS are provided above, use them as strong signals — they come from reverse image search and are often accurate. But still verify against what you see in the image.

Return JSON:
{
  "brand": "BrandName" or null if no brand text/logo/signature visible,
  "model": "Specific Model Name" or "Product Line" or null,
  "color": "Primary color/colorway" or null,
  "confidence": 0-100,
  "notes": "Brief description of visual evidence and identification reasoning"
}

CONFIDENCE GUIDE:
- 90-100: Brand text/logo clearly visible AND model confirmed by web detection or text on product
- 75-89: Brand text/logo visible OR web detection confirms brand/model with matching visual cues
- 50-74: Strong design cues suggest a brand (no text), or general product type is clear but brand uncertain
- 30-49: Some visual hints but multiple brands possible, web detection inconclusive
- 0-29: Very uncertain, no brand evidence, generic product
IMPORTANT: If brand is null, confidence MUST be ≤60. Brand-only (no model) caps at 70.

Return ONLY the JSON, no other text.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: item.cropBase64, detail: 'high' },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
      max_tokens: 500,
      temperature: 0.1,
    });

    const text = response.choices[0]?.message?.content;
    if (!text) throw new Error('Empty response');

    const parsed = parseIdentificationResponse(text);

    return {
      ...item,
      brand: parsed.brand,
      model: parsed.model,
      color: parsed.color,
      confidence: parsed.confidence,
      identificationNotes: parsed.notes,
    };
  } catch (error) {
    console.warn(`[identify] Failed for item ${item.id} (${item.label}):`, error);
    return {
      ...item,
      brand: null,
      model: null,
      color: null,
      confidence: 0,
      identificationNotes: `Identification failed: ${error instanceof Error ? error.message : 'unknown error'}`,
    };
  }
}

function buildWebDetectionHints(webDetection: WebDetectionResult | null): string {
  if (!webDetection) return '';

  const parts: string[] = [];

  if (webDetection.bestGuessLabels.length > 0) {
    parts.push(`Best guess: "${webDetection.bestGuessLabels.join('", "')}"`);
  }

  const topEntities = webDetection.webEntities
    .filter((e) => e.score > 0.3)
    .slice(0, 5)
    .map((e) => `${e.description} (${e.score.toFixed(1)})`)
    .join(', ');
  if (topEntities) {
    parts.push(`Entities: ${topEntities}`);
  }

  const topPages = webDetection.matchingPages
    .slice(0, 3)
    .map((p) => p.pageTitle || p.url)
    .join('; ');
  if (topPages) {
    parts.push(`Matching pages: ${topPages}`);
  }

  if (parts.length === 0) return '';

  return `\nWEB DETECTION HINTS (from reverse image search):\n${parts.join('\n')}\n`;
}

function parseIdentificationResponse(text: string): {
  brand: string | null;
  model: string | null;
  color: string | null;
  confidence: number;
  notes: string;
} {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const parsed = JSON.parse(cleaned);

  return {
    brand: parsed.brand || null,
    model: parsed.model || null,
    color: parsed.color || null,
    confidence: Math.max(0, Math.min(100, Number(parsed.confidence) || 0)),
    notes: parsed.notes || '',
  };
}

/**
 * Re-identify an item with a correction hint (used after validation mismatch).
 */
export async function reidentifyItem(
  item: IdentifiedItem,
  hint: string,
  bagType?: string
): Promise<{
  brand: string | null;
  model: string | null;
  color: string | null;
  confidence: number;
}> {
  const contextHint = bagType ? `\nThis item is from a "${bagType}" collection/setup.` : '';

  const prompt = `This is a cropped photo of a product that was initially identified as "${item.brand ?? ''} ${item.model ?? item.label}".

A visual comparison with a reference image suggests this identification may be wrong.
Hint from comparison: "${hint}"${contextHint}

Look again at this image carefully. What is the actual brand and model?

Return JSON:
{
  "brand": "BrandName" or null,
  "model": "Specific Model Name" or null,
  "color": "Primary color" or null,
  "confidence": 0-100
}

Return ONLY the JSON, no other text.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image_url',
              image_url: { url: item.cropBase64, detail: 'high' },
            },
            { type: 'text', text: prompt },
          ],
        },
      ],
      max_tokens: 300,
      temperature: 0.1,
    });

    const text = response.choices[0]?.message?.content;
    if (!text) throw new Error('Empty response');

    let cleaned = text.trim();
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
    }

    const parsed = JSON.parse(cleaned);
    return {
      brand: parsed.brand || null,
      model: parsed.model || null,
      color: parsed.color || null,
      confidence: Math.max(0, Math.min(100, Number(parsed.confidence) || 0)),
    };
  } catch (error) {
    console.warn(`[reidentify] Failed for item ${item.id}:`, error);
    return {
      brand: item.brand,
      model: item.model,
      color: item.color,
      confidence: item.confidence,
    };
  }
}
