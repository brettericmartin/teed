import { geminiFlash } from '@/lib/geminiClient';
import { openai } from '@/lib/openaiClient';
import type { EnumeratedItem, BoundingBox } from './types';

const ENUMERATION_PROMPT = `You are analyzing a photo to find every distinct physical product or object.

INSTRUCTIONS:
- Find EVERY distinct physical object/product in the image
- Include small items (cables, coasters, figurines, pens, chargers)
- Include partially visible items at edges
- Do NOT include the surface/desk/table itself
- Do NOT include walls, floors, or background elements
- Each item should be a distinct product someone might own/buy

Return a JSON array where each item has:
- "id": sequential integer starting at 1
- "label": brief description (e.g., "wireless mouse", "mechanical keyboard", "desk lamp")
- "bbox": bounding box as [y_min, x_min, y_max, x_max] with values 0-1000 (normalized coordinates)
- "category": one of ["electronics", "audio", "computing", "furniture", "lighting", "accessories", "clothing", "drinkware", "stationery", "sports", "tools", "decor", "other"]

IMPORTANT:
- Bounding boxes use coordinates normalized to 0-1000 range
- y_min is the top edge, y_max is the bottom edge
- x_min is the left edge, x_max is the right edge
- Make bounding boxes tight around each object
- If two items overlap, still list them separately

Return ONLY the JSON array, no other text.`;

/** Parse the JSON array from LLM response, handling markdown code blocks */
function parseEnumerationResponse(text: string): EnumeratedItem[] {
  // Strip markdown code blocks if present
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
  }

  const parsed = JSON.parse(cleaned);
  if (!Array.isArray(parsed)) {
    throw new Error('Expected JSON array from enumeration');
  }

  return parsed.map((item: any) => {
    const bbox = item.bbox;
    if (!Array.isArray(bbox) || bbox.length !== 4) {
      throw new Error(`Invalid bbox for item ${item.id}: ${JSON.stringify(bbox)}`);
    }

    return {
      id: item.id,
      label: item.label || 'unknown object',
      bbox: {
        yMin: Math.max(0, Math.min(1000, Number(bbox[0]))),
        xMin: Math.max(0, Math.min(1000, Number(bbox[1]))),
        yMax: Math.max(0, Math.min(1000, Number(bbox[2]))),
        xMax: Math.max(0, Math.min(1000, Number(bbox[3]))),
      } as BoundingBox,
      category: item.category || 'other',
    };
  });
}

/** Strip the data URL prefix from a base64 string, returning raw base64 */
function stripDataUrl(base64: string): string {
  const commaIdx = base64.indexOf(',');
  return commaIdx > -1 ? base64.substring(commaIdx + 1) : base64;
}

/** Detect the MIME type from a data URL or default to JPEG */
function getMimeType(base64: string): string {
  const match = base64.match(/^data:(image\/[^;]+);/);
  return match ? match[1] : 'image/jpeg';
}

/**
 * Stage 1: Enumerate all items in the photo using Gemini 2.5 Flash.
 * Falls back to GPT-4o if Gemini is unavailable.
 */
export async function enumerateItems(imageBase64: string): Promise<EnumeratedItem[]> {
  // Try Gemini first (native bounding box support)
  if (geminiFlash) {
    try {
      return await enumerateWithGemini(imageBase64);
    } catch (error) {
      console.warn('[enumerate] Gemini failed, falling back to GPT-4o:', error);
    }
  }

  // Fallback: GPT-4o
  return await enumerateWithGPT4o(imageBase64);
}

async function enumerateWithGemini(imageBase64: string): Promise<EnumeratedItem[]> {
  if (!geminiFlash) throw new Error('Gemini client not initialized');

  const mimeType = getMimeType(imageBase64);
  const rawBase64 = stripDataUrl(imageBase64);

  const result = await geminiFlash.generateContent([
    {
      inlineData: {
        mimeType,
        data: rawBase64,
      },
    },
    { text: ENUMERATION_PROMPT },
  ]);

  const responseText = result.response.text();
  return parseEnumerationResponse(responseText);
}

async function enumerateWithGPT4o(imageBase64: string): Promise<EnumeratedItem[]> {
  const imageUrl = imageBase64.startsWith('data:')
    ? imageBase64
    : `data:image/jpeg;base64,${imageBase64}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'image_url',
            image_url: { url: imageUrl, detail: 'high' },
          },
          { type: 'text', text: ENUMERATION_PROMPT },
        ],
      },
    ],
    max_tokens: 4000,
    temperature: 0.1,
  });

  const text = response.choices[0]?.message?.content;
  if (!text) throw new Error('Empty response from GPT-4o enumeration');

  return parseEnumerationResponse(text);
}
