/**
 * Product Inference Stage
 *
 * Final stage of the text parsing pipeline.
 * - Infers product name from remaining text
 * - Refines category based on all available context
 * - Cleans up product name (removes common noise words)
 */

import type { ProductInferenceResult, ParsedComponent, ExtractedSpec } from '../types';
import type { Category } from '@/lib/productLibrary/schema';

/**
 * Common noise words to remove from product names
 */
const NOISE_WORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'for', 'with', 'in', 'on', 'at',
  'new', 'brand', 'genuine', 'authentic', 'official', 'original',
  'men', 'mens', "men's", 'women', 'womens', "women's", 'unisex',
  'buy', 'shop', 'sale', 'discount',
]);

/**
 * Golf product model patterns for better name inference
 */
const GOLF_MODEL_PATTERNS = [
  // TaylorMade models
  { pattern: /\b(qi10|qi\s*10)\s*(max|ls|plus|tour)?/i, replacement: 'Qi10', suffix: true },
  { pattern: /\b(stealth\s*2?)\s*(plus|hd)?/i, replacement: 'Stealth', suffix: true },
  { pattern: /\b(sim\s*2?)\s*(max|d)?/i, replacement: 'SIM', suffix: true },
  { pattern: /\b(p[·-]?7\d{2})/i, replacement: (m: string) => m.toUpperCase().replace(/[·-]/g, ''), suffix: false },

  // Callaway models
  { pattern: /\b(paradym)\s*(x|ai|triple\s*diamond)?/i, replacement: 'Paradym', suffix: true },
  { pattern: /\b(ai\s*smoke)\s*(max|triple\s*diamond)?/i, replacement: 'Ai Smoke', suffix: true },
  { pattern: /\b(big\s*bertha)\s*(b21|b-21)?/i, replacement: 'Big Bertha', suffix: true },
  { pattern: /\b(rogue\s*st)\s*(max|ls)?/i, replacement: 'Rogue ST', suffix: true },
  { pattern: /\b(apex)\s*(pro|dcb)?/i, replacement: 'Apex', suffix: true },

  // Titleist models
  { pattern: /\b(tsr[1-4])/i, replacement: (m: string) => m.toUpperCase(), suffix: false },
  { pattern: /\b(gt[1-4])/i, replacement: (m: string) => m.toUpperCase(), suffix: false },
  { pattern: /\b(t\d{3})/i, replacement: (m: string) => m.toUpperCase(), suffix: false },
  { pattern: /\b(pro\s*v1x?)/i, replacement: 'Pro V1', suffix: true },

  // PING models
  { pattern: /\b(g\s*430)\s*(max|lst|sft)?/i, replacement: 'G430', suffix: true },
  { pattern: /\b(g\s*425)\s*(max|lst|sft)?/i, replacement: 'G425', suffix: true },
  { pattern: /\b(i\d{3})/i, replacement: (m: string) => m.toUpperCase(), suffix: false },
  { pattern: /\b(blueprint)/i, replacement: 'Blueprint', suffix: false },

  // Cobra models
  { pattern: /\b(darkspeed)\s*(max|ls|x)?/i, replacement: 'Darkspeed', suffix: true },
  { pattern: /\b(aerojet)\s*(max|ls)?/i, replacement: 'Aerojet', suffix: true },
  { pattern: /\b(ltdx)\s*(max|ls)?/i, replacement: 'LTDx', suffix: true },

  // Generic club types
  { pattern: /\b(driver)\b/i, replacement: 'Driver', suffix: false },
  { pattern: /\b(3\s*wood|three\s*wood|fairway)\b/i, replacement: '3 Wood', suffix: false },
  { pattern: /\b(5\s*wood|five\s*wood)\b/i, replacement: '5 Wood', suffix: false },
  { pattern: /\b(hybrid)\b/i, replacement: 'Hybrid', suffix: false },
  { pattern: /\b(putter)\b/i, replacement: 'Putter', suffix: false },
  { pattern: /\b(wedge)\b/i, replacement: 'Wedge', suffix: false },
  { pattern: /\b(irons?)\b/i, replacement: 'Irons', suffix: false },
];

/**
 * Infer product name and refine category from remaining text
 */
export function productInference(
  remainingText: string,
  specs: ExtractedSpec[],
  currentCategory: Category | null
): ProductInferenceResult {
  const extractedComponents: ParsedComponent[] = [];
  let productName: ProductInferenceResult['productName'] = null;
  let refinedCategory = currentCategory;

  if (!remainingText || remainingText.trim().length === 0) {
    return { productName: null, refinedCategory, extractedComponents };
  }

  let cleanedText = remainingText.trim();

  // === Clean up the text ===
  // Remove noise words (but only if they're at the start or alone)
  const words = cleanedText.split(/\s+/);
  const filteredWords = words.filter((word, idx) => {
    const lower = word.toLowerCase().replace(/[^\w]/g, '');
    // Only remove noise words at the start
    if (idx === 0 && NOISE_WORDS.has(lower)) return false;
    // Remove empty or very short words
    if (word.length < 2) return false;
    return true;
  });
  cleanedText = filteredWords.join(' ');

  // === Try to match golf model patterns ===
  if (currentCategory === 'golf' || !currentCategory) {
    for (const { pattern, replacement, suffix } of GOLF_MODEL_PATTERNS) {
      const match = cleanedText.match(pattern);
      if (match) {
        const modelName = typeof replacement === 'function' ? replacement(match[1]) : replacement;
        let suffixText = '';

        // Include suffix if pattern captures it
        if (suffix && match[2]) {
          suffixText = ' ' + match[2].charAt(0).toUpperCase() + match[2].slice(1).toLowerCase();
        }

        // Replace the match with the properly formatted model
        cleanedText = cleanedText.replace(match[0], modelName + suffixText);

        if (!refinedCategory) {
          refinedCategory = 'golf';
        }
      }
    }
  }

  // === Final cleanup ===
  // Capitalize first letter of each significant word
  cleanedText = cleanedText
    .split(/\s+/)
    .map((word, idx) => {
      // Keep certain words lowercase (articles, prepositions) except at start
      const lower = word.toLowerCase();
      if (idx > 0 && ['of', 'the', 'and', 'or', 'for', 'with'].includes(lower)) {
        return lower;
      }
      // Keep all-caps words as-is (model numbers like TSR4)
      if (word === word.toUpperCase() && word.length <= 6) {
        return word;
      }
      // Capitalize first letter
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');

  // Remove any duplicate spaces or trailing punctuation
  cleanedText = cleanedText.replace(/\s+/g, ' ').replace(/[,;:]+$/, '').trim();

  if (cleanedText.length > 0) {
    // Calculate confidence based on what we know
    let confidence = 0.5; // Base confidence

    // Boost if we matched a known model pattern
    if (GOLF_MODEL_PATTERNS.some(p => p.pattern.test(remainingText))) {
      confidence += 0.2;
    }

    // Boost if we have specs (suggests this is a real product)
    if (specs.length > 0) {
      confidence += 0.15;
    }

    // Boost if the text has a reasonable length (not too short, not too long)
    if (cleanedText.length >= 3 && cleanedText.length <= 50) {
      confidence += 0.1;
    }

    productName = {
      value: cleanedText,
      confidence: Math.min(confidence, 0.95),
    };

    extractedComponents.push({
      type: 'product',
      value: cleanedText,
      confidence: productName.confidence,
      source: 'inference',
      originalText: remainingText,
      startIndex: 0,
      endIndex: remainingText.length,
    });
  }

  return {
    productName,
    refinedCategory,
    extractedComponents,
  };
}

/**
 * Combine brand and product name intelligently
 */
export function combineNameParts(
  brand: string | null,
  productName: string | null
): string {
  if (!brand && !productName) return 'Unknown Product';
  if (!brand) return productName || 'Unknown Product';
  if (!productName) return brand;

  // Check if product name already contains brand
  if (productName.toLowerCase().includes(brand.toLowerCase())) {
    return productName;
  }

  return `${brand} ${productName}`;
}
