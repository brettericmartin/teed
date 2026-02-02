/**
 * Normalize Stage
 *
 * First stage of the text parsing pipeline.
 * - Cleans and normalizes input text
 * - Extracts quantity indicators (2x, 3 pairs, etc.)
 * - Extracts price constraints (under $50, ~$100, etc.)
 */

import type { NormalizeResult, ParsedComponent, PriceConstraint } from '../types';

/**
 * Quantity patterns to detect
 * Order matters - more specific patterns first
 */
const QUANTITY_PATTERNS = [
  // "3x", "3 x", "x3"
  { pattern: /\b(\d+)\s*x\b/i, group: 1 },
  { pattern: /\bx\s*(\d+)\b/i, group: 1 },
  // "3 pairs", "2 sets", "4 pieces"
  { pattern: /\b(\d+)\s*(?:pair|set|piece|pack|box)s?\b/i, group: 1 },
  // Explicit "qty 3", "quantity: 2"
  { pattern: /\bqty\.?\s*[:=]?\s*(\d+)\b/i, group: 1 },
  { pattern: /\bquantity\s*[:=]?\s*(\d+)\b/i, group: 1 },
];

/**
 * Price constraint patterns
 */
const PRICE_PATTERNS: Array<{
  pattern: RegExp;
  type: PriceConstraint['type'];
  extract: (match: RegExpMatchArray) => Partial<PriceConstraint>;
}> = [
  // Range: "$50-100", "$50 - $100", "50-100 dollars"
  {
    pattern: /\$?\s*(\d+(?:\.\d{2})?)\s*[-–to]+\s*\$?\s*(\d+(?:\.\d{2})?)\s*(?:dollars?)?\b/i,
    type: 'range',
    extract: (m) => ({ min: parseFloat(m[1]), max: parseFloat(m[2]) }),
  },
  // Max: "under $50", "below $100", "< $50", "max $50"
  {
    pattern: /\b(?:under|below|less than|<|max|maximum)\s*\$?\s*(\d+(?:\.\d{2})?)\b/i,
    type: 'max',
    extract: (m) => ({ max: parseFloat(m[1]) }),
  },
  // Min: "over $50", "above $100", "> $50", "min $50"
  {
    pattern: /\b(?:over|above|more than|>|min|minimum|at least)\s*\$?\s*(\d+(?:\.\d{2})?)\b/i,
    type: 'min',
    extract: (m) => ({ min: parseFloat(m[1]) }),
  },
  // Approximate: "~$50", "about $50", "around $100", "roughly $75"
  {
    pattern: /\b(?:~|about|around|roughly|approximately|approx\.?)\s*\$?\s*(\d+(?:\.\d{2})?)\b/i,
    type: 'approximate',
    extract: (m) => ({ value: parseFloat(m[1]) }),
  },
];

/**
 * Normalize text by:
 * 1. Extracting and removing quantity indicators
 * 2. Extracting and removing price constraints
 * 3. Cleaning up whitespace and special characters
 */
export function normalize(input: string): NormalizeResult {
  let text = input.trim();
  const extractedComponents: ParsedComponent[] = [];
  let quantity = 1;
  let priceConstraint: PriceConstraint | null = null;

  // === Extract quantity ===
  for (const { pattern, group } of QUANTITY_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const extractedQty = parseInt(match[group], 10);
      if (extractedQty > 0 && extractedQty <= 100) {
        quantity = extractedQty;

        extractedComponents.push({
          type: 'quantity',
          value: String(extractedQty),
          confidence: 0.95,
          source: 'pattern',
          originalText: match[0],
          startIndex: match.index || 0,
          endIndex: (match.index || 0) + match[0].length,
        });

        // Remove quantity from text
        text = text.replace(match[0], ' ').trim();
        break; // Only extract one quantity
      }
    }
  }

  // === Extract price constraint ===
  for (const { pattern, type, extract } of PRICE_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      const extracted = extract(match);
      priceConstraint = {
        type,
        ...extracted,
        originalText: match[0],
      };

      extractedComponents.push({
        type: 'price',
        value: match[0],
        confidence: 0.9,
        source: 'pattern',
        originalText: match[0],
        startIndex: match.index || 0,
        endIndex: (match.index || 0) + match[0].length,
      });

      // Remove price constraint from text
      text = text.replace(match[0], ' ').trim();
      break; // Only extract one price constraint
    }
  }

  // === Clean up text ===
  // Remove multiple spaces
  text = text.replace(/\s+/g, ' ');

  // Remove leading/trailing punctuation that isn't part of a word
  text = text.replace(/^[^\w]+|[^\w]+$/g, '');

  // Normalize common abbreviations
  text = normalizeAbbreviations(text);

  return {
    normalizedText: text.trim(),
    quantity,
    priceConstraint,
    extractedComponents,
  };
}

/**
 * Normalize common abbreviations in product descriptions
 */
function normalizeAbbreviations(text: string): string {
  const abbreviations: Record<string, string> = {
    // Golf abbreviations
    'stf': 'stiff',
    'reg': 'regular',
    'snr': 'senior',
    'lh': 'left hand',
    'rh': 'right hand',
    'lft': 'left',
    'rgt': 'right',

    // General
    'blk': 'black',
    'wht': 'white',
    'gry': 'gray',

    // Tech
    'w/': 'with',
    'w/o': 'without',
  };

  let result = text;
  for (const [abbr, full] of Object.entries(abbreviations)) {
    const regex = new RegExp(`\\b${abbr}\\b`, 'gi');
    result = result.replace(regex, full);
  }

  return result;
}

/**
 * Split text into potential items (for bulk input)
 * Handles newlines, commas, semicolons, bullet points
 */
export function splitIntoItems(text: string): string[] {
  // Split on common delimiters
  const items = text
    .split(/[\n\r]+|;|(?:^|\s)[•●○◦▪▸►]\s*|(?:^|\s)\d+\.\s+/)
    .map(item => item.trim())
    .filter(item => item.length > 0);

  // If we only got one item but it has commas, try splitting on those
  // But be careful not to split "brand, model" patterns
  if (items.length === 1 && items[0].includes(',')) {
    const commaSplit = items[0].split(',').map(i => i.trim()).filter(Boolean);
    // Only use comma split if items look like separate products
    // (each has more than one word or starts with a different letter)
    if (commaSplit.length >= 2 && commaSplit.every(i => i.split(/\s+/).length >= 2)) {
      return commaSplit;
    }
  }

  return items;
}
