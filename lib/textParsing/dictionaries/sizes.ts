/**
 * Size Dictionary
 *
 * Size patterns and mappings for extraction
 */

import type { ExtractedSize } from '../types';

// Clothing sizes (letter-based)
export const CLOTHING_SIZES = ['xxs', 'xs', 's', 'm', 'l', 'xl', 'xxl', '2xl', '3xl', '4xl', '5xl'];
export const CLOTHING_SIZE_ALIASES: Record<string, string> = {
  'extra small': 'xs',
  'x-small': 'xs',
  'small': 's',
  'medium': 'm',
  'med': 'm',
  'large': 'l',
  'extra large': 'xl',
  'x-large': 'xl',
  '2x': '2xl',
  '3x': '3xl',
  '4x': '4xl',
  '5x': '5xl',
};

// US shoe sizes (common range)
export const US_SHOE_SIZES = [
  '4', '4.5', '5', '5.5', '6', '6.5', '7', '7.5', '8', '8.5',
  '9', '9.5', '10', '10.5', '11', '11.5', '12', '12.5', '13', '14', '15', '16',
];

// Golf-specific sizes
export const GOLF_GLOVE_SIZES = ['s', 'm', 'ml', 'm/l', 'l', 'xl', 'cadet s', 'cadet m', 'cadet ml', 'cadet l'];
export const GOLF_GRIP_SIZES = ['undersize', 'standard', 'midsize', 'oversize', 'jumbo'];

// Waist/pant sizes
export const WAIST_SIZES = ['28', '29', '30', '31', '32', '33', '34', '35', '36', '38', '40', '42', '44'];
export const INSEAM_SIZES = ['28', '29', '30', '31', '32', '33', '34', '36'];

/**
 * Extract size from text
 */
export function extractSize(text: string): ExtractedSize | null {
  const textLower = text.toLowerCase();

  // Check for explicit "size X" pattern first
  const explicitSizeMatch = textLower.match(/\bsize\s+(\d+(?:\.\d+)?|[a-z]{1,3})\b/i);
  if (explicitSizeMatch) {
    const sizeValue = explicitSizeMatch[1].toUpperCase();
    return {
      value: sizeValue,
      type: isNumericSize(sizeValue) ? 'numeric' : 'clothing',
      normalized: normalizeSize(sizeValue),
    };
  }

  // Check for clothing size aliases (multi-word)
  for (const [alias, normalized] of Object.entries(CLOTHING_SIZE_ALIASES)) {
    const regex = new RegExp(`\\b${alias}\\b`, 'i');
    if (regex.test(textLower)) {
      return {
        value: normalized.toUpperCase(),
        type: 'clothing',
        normalized: normalized.toUpperCase(),
      };
    }
  }

  // Check for standalone clothing sizes with word boundaries
  // Must be careful not to match 's' in the middle of words
  for (const size of CLOTHING_SIZES) {
    // For single letters, require them to be surrounded by spaces or at start/end
    if (size.length === 1) {
      const regex = new RegExp(`(?:^|\\s)${size}(?:\\s|$)`, 'i');
      if (regex.test(textLower)) {
        return {
          value: size.toUpperCase(),
          type: 'clothing',
          normalized: size.toUpperCase(),
        };
      }
    } else {
      const regex = new RegExp(`\\b${size}\\b`, 'i');
      if (regex.test(textLower)) {
        return {
          value: size.toUpperCase(),
          type: 'clothing',
          normalized: size.toUpperCase(),
        };
      }
    }
  }

  // Check for shoe sizes with context words
  const shoeSizeMatch = textLower.match(/\b(?:size|us|men'?s?|women'?s?|shoe)\s*(\d{1,2}(?:\.\d)?)\b/i);
  if (shoeSizeMatch) {
    const sizeNum = shoeSizeMatch[1];
    if (US_SHOE_SIZES.includes(sizeNum)) {
      return {
        value: sizeNum,
        type: 'shoe',
        normalized: sizeNum,
      };
    }
  }

  // Check for waist x inseam pattern (e.g., "32x30" or "32 x 30")
  const waistInseamMatch = textLower.match(/\b(\d{2})\s*x\s*(\d{2})\b/);
  if (waistInseamMatch) {
    const waist = waistInseamMatch[1];
    const inseam = waistInseamMatch[2];
    if (WAIST_SIZES.includes(waist) && INSEAM_SIZES.includes(inseam)) {
      return {
        value: `${waist}x${inseam}`,
        type: 'numeric',
        normalized: `${waist}x${inseam}`,
      };
    }
  }

  return null;
}

/**
 * Find all sizes in text with their positions
 */
export function findAllSizes(text: string): Array<{ size: ExtractedSize; position: number; originalText: string }> {
  const results: Array<{ size: ExtractedSize; position: number; originalText: string }> = [];
  const textLower = text.toLowerCase();

  // Find explicit "size X" patterns
  const explicitPattern = /\bsize\s+(\d+(?:\.\d+)?|[a-z]{1,3})\b/gi;
  let match;
  while ((match = explicitPattern.exec(textLower)) !== null) {
    const sizeValue = match[1].toUpperCase();
    results.push({
      size: {
        value: sizeValue,
        type: isNumericSize(sizeValue) ? 'numeric' : 'clothing',
        normalized: normalizeSize(sizeValue),
      },
      position: match.index,
      originalText: match[0],
    });
  }

  // Find waist x inseam patterns
  const waistPattern = /\b(\d{2})\s*x\s*(\d{2})\b/gi;
  while ((match = waistPattern.exec(textLower)) !== null) {
    results.push({
      size: {
        value: `${match[1]}x${match[2]}`,
        type: 'numeric',
        normalized: `${match[1]}x${match[2]}`,
      },
      position: match.index,
      originalText: match[0],
    });
  }

  // Find standalone clothing sizes (be careful with context)
  for (const size of [...CLOTHING_SIZES].sort((a, b) => b.length - a.length)) {
    const pattern = size.length === 1
      ? new RegExp(`(?:^|\\s)(${size})(?:\\s|$)`, 'gi')
      : new RegExp(`\\b(${size})\\b`, 'gi');

    while ((match = pattern.exec(textLower)) !== null) {
      // Skip if this position is already covered
      const position = match.index + (size.length === 1 ? match[0].indexOf(match[1]) : 0);
      if (results.some(r => r.position === position)) continue;

      results.push({
        size: {
          value: size.toUpperCase(),
          type: 'clothing',
          normalized: size.toUpperCase(),
        },
        position,
        originalText: match[1],
      });
    }
  }

  return results.sort((a, b) => a.position - b.position);
}

/**
 * Remove size references from text
 */
export function removeSizes(text: string): string {
  const sizes = findAllSizes(text);
  if (sizes.length === 0) return text;

  // Track positions to remove
  const toRemove: Array<{ start: number; end: number }> = [];

  for (const { position, originalText } of sizes) {
    // For "size X" patterns, remove the whole thing
    const fullMatch = text.slice(position).match(/^size\s+\S+/i);
    if (fullMatch) {
      toRemove.push({ start: position, end: position + fullMatch[0].length });
    } else {
      toRemove.push({ start: position, end: position + originalText.length });
    }
  }

  // Remove in reverse order
  let result = text;
  for (const { start, end } of [...toRemove].sort((a, b) => b.start - a.start)) {
    result = result.slice(0, start) + result.slice(end);
  }

  return result.replace(/\s+/g, ' ').trim();
}

// Helper functions
function isNumericSize(size: string): boolean {
  return /^\d+(\.\d+)?$/.test(size) || /^\d+x\d+$/.test(size);
}

function normalizeSize(size: string): string {
  const lower = size.toLowerCase();
  return CLOTHING_SIZE_ALIASES[lower] || size.toUpperCase();
}
