import { openai } from '@/lib/openaiClient';
import { fetchProductImage } from '@/lib/ai';
import { reidentifyItem } from './identify';
import type { IdentifiedItem, ValidatedItem } from './types';

/** Max concurrent validation calls */
const CONCURRENCY_LIMIT = 5;

/** Minimum confidence to attempt validation (below this, skip) */
const MIN_CONFIDENCE_FOR_VALIDATION = 40;

/**
 * Stage 4: Validate identifications by comparing crops against reference images.
 *
 * For each identified item with confidence >= 40:
 * 1. Fetch a reference image via Google Custom Search
 * 2. Send both images to GPT-4o for visual comparison
 * 3. If mismatch with a suggested correction, re-identify once
 */
export async function validateItems(
  identifiedItems: IdentifiedItem[],
  bagType?: string
): Promise<ValidatedItem[]> {
  const results: ValidatedItem[] = [];

  // Process in batches
  for (let i = 0; i < identifiedItems.length; i += CONCURRENCY_LIMIT) {
    const batch = identifiedItems.slice(i, i + CONCURRENCY_LIMIT);
    const batchResults = await Promise.all(
      batch.map((item) => validateSingleItem(item, bagType))
    );
    results.push(...batchResults);
  }

  return results;
}

async function validateSingleItem(
  item: IdentifiedItem,
  bagType?: string
): Promise<ValidatedItem> {
  // Skip validation for low-confidence or unidentified items
  if (item.confidence < MIN_CONFIDENCE_FOR_VALIDATION || (!item.brand && !item.model)) {
    return {
      ...item,
      validation: {
        verdict: 'unverified',
        confidence: 0,
        discrepancies: [],
        suggestedCorrection: null,
        referenceImageUrl: null,
      },
    };
  }

  // Include label (product type from enumeration) for specificity
  // e.g. "Klipsch Reference bookshelf speaker" instead of just "Klipsch Reference"
  const brandModel = [item.brand, item.model].filter(Boolean).join(' ');
  const productName = brandModel
    ? `${brandModel} ${item.label}`
    : item.label;

  try {
    // Step 1: Find reference image (don't pass brand separately — it's already in productName)
    const refImage = await fetchProductImage(productName);

    if (!refImage) {
      return {
        ...item,
        validation: {
          verdict: 'unverified',
          confidence: 0,
          discrepancies: ['No reference image found'],
          suggestedCorrection: null,
          referenceImageUrl: null,
        },
      };
    }

    // Step 2: Compare crop vs reference
    const comparison = await compareImages(
      item.cropBase64,
      refImage.imageUrl,
      productName
    );

    let validatedItem: ValidatedItem = {
      ...item,
      validation: {
        verdict: comparison.match ? 'verified' : 'mismatch',
        confidence: comparison.confidence,
        discrepancies: comparison.discrepancies,
        suggestedCorrection: comparison.suggestedCorrection,
        referenceImageUrl: refImage.imageUrl,
      },
    };

    // Step 3: Re-identify if mismatch with correction hint
    if (!comparison.match && comparison.suggestedCorrection) {
      const corrected = await reidentifyItem(item, comparison.suggestedCorrection, bagType);

      if (corrected.confidence > item.confidence) {
        validatedItem.corrected = corrected;
        // Update verdict based on re-identification confidence
        validatedItem.validation.verdict = corrected.confidence >= 60 ? 'unverified' : 'mismatch';
      }
    }

    return validatedItem;
  } catch (error) {
    console.warn(`[validate] Failed for item ${item.id} (${productName}):`, error);
    return {
      ...item,
      validation: {
        verdict: 'unverified',
        confidence: 0,
        discrepancies: [`Validation error: ${error instanceof Error ? error.message : 'unknown'}`],
        suggestedCorrection: null,
        referenceImageUrl: null,
      },
    };
  }
}

async function compareImages(
  cropBase64: string,
  referenceUrl: string,
  productName: string
): Promise<{
  match: boolean;
  confidence: number;
  discrepancies: string[];
  suggestedCorrection: string | null;
}> {
  const prompt = `You are comparing two images to verify a product identification.

IMAGE 1 (left): A cropped photo of an item from a scene
IMAGE 2 (right): A reference image for "${productName}"

TASK: Do these show the same product (same brand and model)?

Compare:
- Overall shape and form factor
- Color scheme
- Brand markings, logos, text
- Proportions and design details
- Material/texture

Return JSON:
{
  "match": true/false,
  "confidence": 0-100,
  "discrepancies": ["list of visual differences"],
  "suggestedCorrection": "If not a match, what does the item in Image 1 actually look like? Provide a brief description to help re-identify it" or null if match
}

IMPORTANT:
- Minor color differences due to lighting are OK (still a match)
- Different angles/perspectives are OK (still a match)
- Different model generations or entirely different products = NOT a match
- If confidence is below 50, set match to false

Return ONLY the JSON, no other text.`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: cropBase64, detail: 'high' },
          },
          {
            type: 'image_url',
            image_url: { url: referenceUrl, detail: 'high' },
          },
          { type: 'text', text: prompt },
        ],
      },
    ],
    max_tokens: 500,
    temperature: 0.1,
  });

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error('Empty comparison response');

  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const parsed = JSON.parse(cleaned);

  return {
    match: Boolean(parsed.match),
    confidence: Math.max(0, Math.min(100, Number(parsed.confidence) || 0)),
    discrepancies: Array.isArray(parsed.discrepancies) ? parsed.discrepancies : [],
    suggestedCorrection: parsed.suggestedCorrection || null,
  };
}
