/**
 * Color Dictionary
 *
 * Comprehensive color names and synonyms for extraction
 */

// Primary colors with their variations
export const COLOR_DICTIONARY: Record<string, string[]> = {
  // Basic colors
  black: ['blk', 'noir', 'onyx', 'jet', 'ebony', 'midnight'],
  white: ['wht', 'blanc', 'ivory', 'cream', 'pearl', 'snow', 'chalk'],
  gray: ['grey', 'gry', 'charcoal', 'slate', 'ash', 'silver', 'graphite', 'heather'],
  red: ['crimson', 'scarlet', 'ruby', 'cherry', 'burgundy', 'maroon', 'wine', 'cardinal'],
  blue: ['navy', 'royal', 'cobalt', 'sapphire', 'azure', 'teal', 'cyan', 'indigo', 'denim'],
  green: ['forest', 'olive', 'sage', 'emerald', 'lime', 'mint', 'hunter', 'kelly', 'pine'],
  yellow: ['gold', 'golden', 'mustard', 'lemon', 'canary', 'sunflower'],
  orange: ['tangerine', 'coral', 'peach', 'rust', 'copper', 'amber', 'apricot'],
  pink: ['rose', 'blush', 'fuchsia', 'magenta', 'salmon', 'dusty rose', 'mauve'],
  purple: ['violet', 'plum', 'lavender', 'lilac', 'grape', 'eggplant', 'amethyst'],
  brown: ['tan', 'beige', 'khaki', 'camel', 'chocolate', 'espresso', 'mocha', 'coffee', 'walnut', 'chestnut'],

  // Material-inspired colors
  bronze: ['antique brass'],
  copper: [],
  gold: ['golden'],
  silver: ['metallic silver', 'chrome'],

  // Nature-inspired
  sand: ['desert', 'dune', 'oatmeal'],
  sky: ['sky blue', 'powder blue', 'baby blue'],
  ocean: ['sea', 'marine', 'aqua', 'turquoise'],
  moss: ['army green'],
  stone: ['rock', 'pebble', 'concrete'],

  // Multi-tone descriptors
  multicolor: ['multi', 'rainbow', 'tie-dye', 'tie dye', 'ombre', 'gradient'],
  camo: ['camouflage', 'camo print'],
};

// Create a reverse lookup map for fast matching
const colorLookup = new Map<string, string>();

for (const [primary, variants] of Object.entries(COLOR_DICTIONARY)) {
  colorLookup.set(primary.toLowerCase(), primary);
  for (const variant of variants) {
    colorLookup.set(variant.toLowerCase(), primary);
  }
}

/**
 * Extract color from text
 * @param text - The text to search for colors
 * @returns The primary color name if found, null otherwise
 */
export function extractColor(text: string): string | null {
  const textLower = text.toLowerCase();

  // Check for multi-word colors first (longer matches take priority)
  const allColorTerms = Object.entries(COLOR_DICTIONARY)
    .flatMap(([primary, variants]) => [primary, ...variants])
    .sort((a, b) => b.length - a.length); // Longer first

  for (const term of allColorTerms) {
    // Use word boundary matching
    const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
    if (regex.test(textLower)) {
      return colorLookup.get(term.toLowerCase()) || term;
    }
  }

  return null;
}

/**
 * Find all colors mentioned in text
 * @param text - The text to search
 * @returns Array of { color, position, originalText }
 */
export function findAllColors(text: string): Array<{ color: string; position: number; originalText: string }> {
  const textLower = text.toLowerCase();
  const results: Array<{ color: string; position: number; originalText: string }> = [];
  const seen = new Set<number>(); // Track positions to avoid overlaps

  // Check all color terms, longer first
  const allColorTerms = Object.entries(COLOR_DICTIONARY)
    .flatMap(([primary, variants]) =>
      [{ term: primary, primary }, ...variants.map(v => ({ term: v, primary }))]
    )
    .sort((a, b) => b.term.length - a.term.length);

  for (const { term, primary } of allColorTerms) {
    const regex = new RegExp(`\\b${term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    let match;

    while ((match = regex.exec(textLower)) !== null) {
      // Skip if this position overlaps with an already-found color
      if (seen.has(match.index)) continue;

      // Mark all positions in this match as seen
      for (let i = match.index; i < match.index + match[0].length; i++) {
        seen.add(i);
      }

      results.push({
        color: primary,
        position: match.index,
        originalText: text.slice(match.index, match.index + match[0].length),
      });
    }
  }

  return results.sort((a, b) => a.position - b.position);
}

/**
 * Remove color terms from text
 * @param text - The original text
 * @returns Text with color terms removed
 */
export function removeColors(text: string): string {
  const colors = findAllColors(text);
  if (colors.length === 0) return text;

  // Remove in reverse order to preserve indices
  let result = text;
  for (const { position, originalText } of [...colors].reverse()) {
    result = result.slice(0, position) + result.slice(position + originalText.length);
  }

  // Clean up extra spaces
  return result.replace(/\s+/g, ' ').trim();
}
