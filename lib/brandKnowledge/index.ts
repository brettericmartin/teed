/**
 * Brand Knowledge Base
 *
 * Provides category-specific brand knowledge for enhanced AI product identification.
 * Loads JSON files with brand visual signatures and injects them into AI prompts.
 */

import { CategoryKnowledge, ContextVerbosity } from './types';
import path from 'path';
import fs from 'fs';

// In-memory cache for loaded category data
const categoryCache = new Map<string, CategoryKnowledge>();

// Data directory path
const DATA_DIR = path.join(process.cwd(), 'lib/brandKnowledge/data');

/**
 * Category name normalization mapping
 */
const CATEGORY_MAPPING: Record<string, string> = {
  // Golf
  'golf': 'golf',
  'golf club': 'golf',
  'golf clubs': 'golf',
  'driver': 'golf',
  'irons': 'golf',
  'putter': 'golf',

  // Outdoor
  'outdoor': 'outdoor',
  'camping': 'outdoor',
  'hiking': 'outdoor',
  'backpacking': 'outdoor',

  // Tech
  'tech': 'tech',
  'technology': 'tech',
  'electronics': 'tech',
  'gadgets': 'tech',

  // Fashion
  'fashion': 'fashion',
  'clothing': 'fashion',
  'apparel': 'fashion',

  // Makeup
  'makeup': 'makeup',
  'cosmetics': 'makeup',
  'beauty': 'makeup',

  // Photography
  'photography': 'photography',
  'camera': 'photography',
  'cameras': 'photography',
  'photo': 'photography',
  'video': 'photography',

  // Gaming
  'gaming': 'gaming',
  'game': 'gaming',
  'games': 'gaming',
  'esports': 'gaming',
  'pc gaming': 'gaming',

  // Music
  'music': 'music',
  'audio': 'music',
  'instruments': 'music',
  'guitar': 'music',
  'studio': 'music',

  // Fitness
  'fitness': 'fitness',
  'gym': 'fitness',
  'workout': 'fitness',
  'exercise': 'fitness',
  'crossfit': 'fitness',
  'sports': 'fitness',

  // Travel
  'travel': 'travel',
  'luggage': 'travel',
  'bags': 'travel',
  'suitcase': 'travel',

  // EDC
  'edc': 'edc',
  'everyday carry': 'edc',
  'knife': 'edc',
  'knives': 'edc',
  'flashlight': 'edc',
  'wallet': 'edc',
};

/**
 * Normalize category name to match data file names
 */
function normalizeCategory(category: string): string {
  const lower = category.toLowerCase().trim();
  return CATEGORY_MAPPING[lower] || lower;
}

/**
 * Load category knowledge from JSON file
 */
export function loadCategoryKnowledge(category: string): CategoryKnowledge | null {
  const normalizedCategory = normalizeCategory(category);

  // Check cache first
  if (categoryCache.has(normalizedCategory)) {
    return categoryCache.get(normalizedCategory)!;
  }

  // Try to load from file
  const filePath = path.join(DATA_DIR, `${normalizedCategory}.json`);

  try {
    if (!fs.existsSync(filePath)) {
      console.log(`[brandKnowledge] No data file for category: ${normalizedCategory}`);
      return null;
    }

    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const data: CategoryKnowledge = JSON.parse(fileContent);

    // Cache it
    categoryCache.set(normalizedCategory, data);
    console.log(`[brandKnowledge] Loaded ${data.brands.length} brands for ${normalizedCategory}`);

    return data;
  } catch (error) {
    console.error(`[brandKnowledge] Error loading ${normalizedCategory}:`, error);
    return null;
  }
}

/**
 * Generate context injection string for AI prompts
 *
 * @param categories - Array of category names to load knowledge for
 * @param verbosity - How much detail to include (affects token count)
 * @returns Formatted string for prompt injection
 */
export function generateBrandContext(
  categories: string | string[],
  verbosity: ContextVerbosity = 'standard'
): string {
  const categoryList = Array.isArray(categories) ? categories : [categories];
  const sections: string[] = [];

  for (const category of categoryList) {
    const knowledge = loadCategoryKnowledge(category);
    if (!knowledge) continue;

    const categorySection = formatCategoryContext(knowledge, verbosity);
    if (categorySection) {
      sections.push(categorySection);
    }
  }

  if (sections.length === 0) {
    return '';
  }

  return `
═══════════════════════════════════════════════════════════════
BRAND KNOWLEDGE BASE (Use this to identify products)
═══════════════════════════════════════════════════════════════
${sections.join('\n\n')}
`;
}

/**
 * Format a single category's knowledge based on verbosity
 */
function formatCategoryContext(
  knowledge: CategoryKnowledge,
  verbosity: ContextVerbosity
): string {
  const lines: string[] = [];

  lines.push(`### ${knowledge.category.toUpperCase()} BRANDS ###`);

  // Color vocabulary (minimal gets none, standard gets some, detailed gets all)
  if (verbosity !== 'minimal' && knowledge.colorVocabulary) {
    lines.push('\nCOLOR TERMS:');
    const colorEntries = Object.entries(knowledge.colorVocabulary);
    const limit = verbosity === 'detailed' ? colorEntries.length : Math.min(4, colorEntries.length);

    for (let i = 0; i < limit; i++) {
      const [color, variants] = colorEntries[i];
      const variantLimit = verbosity === 'detailed' ? variants.length : 3;
      lines.push(`  ${color} → ${variants.slice(0, variantLimit).join(', ')}`);
    }
  }

  // Brands
  lines.push('\nBRANDS:');

  const brandLimit = verbosity === 'minimal' ? 3 : verbosity === 'standard' ? 5 : knowledge.brands.length;

  for (let i = 0; i < Math.min(brandLimit, knowledge.brands.length); i++) {
    const brand = knowledge.brands[i];
    const brandLines = formatBrandContext(brand, verbosity);
    lines.push(brandLines);
  }

  return lines.join('\n');
}

/**
 * Format a single brand's knowledge based on verbosity
 */
function formatBrandContext(brand: { name: string; aliases: string[]; signatureColors: string[]; designCues: string[]; identificationTips: string[]; recentColorways?: Array<{ line: string; year: string; colors: string[] }> }, verbosity: ContextVerbosity): string {
  const lines: string[] = [];

  if (verbosity === 'minimal') {
    // Just brand name and signature colors
    lines.push(`• ${brand.name}: ${brand.signatureColors.join('/')}`);
    return lines.join('\n');
  }

  // Standard and detailed
  lines.push(`\n**${brand.name}**${brand.aliases.length > 0 ? ` (${brand.aliases.join(', ')})` : ''}`);
  lines.push(`  Colors: ${brand.signatureColors.join(', ')}`);

  if (brand.designCues.length > 0) {
    const cueLimit = verbosity === 'detailed' ? brand.designCues.length : 2;
    lines.push(`  Cues: ${brand.designCues.slice(0, cueLimit).join(', ')}`);
  }

  // Identification tips
  if (brand.identificationTips.length > 0) {
    const tipLimit = verbosity === 'detailed' ? brand.identificationTips.length : 2;
    lines.push('  ID Tips:');
    for (let i = 0; i < Math.min(tipLimit, brand.identificationTips.length); i++) {
      lines.push(`    - ${brand.identificationTips[i]}`);
    }
  }

  // Recent colorways (detailed only)
  if (verbosity === 'detailed' && brand.recentColorways && brand.recentColorways.length > 0) {
    lines.push('  Recent Models:');
    for (const cw of brand.recentColorways.slice(0, 2)) {
      lines.push(`    - ${cw.line} (${cw.year}): ${cw.colors.join(', ')}`);
    }
  }

  return lines.join('\n');
}

/**
 * Get list of available category files
 */
export function getAvailableCategories(): string[] {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      return [];
    }

    return fs.readdirSync(DATA_DIR)
      .filter(file => file.endsWith('.json'))
      .map(file => file.replace('.json', ''));
  } catch (error) {
    console.error('[brandKnowledge] Error reading data directory:', error);
    return [];
  }
}

/**
 * Clear the category cache (useful for development/testing)
 */
export function clearCache(): void {
  categoryCache.clear();
}
