/**
 * URL Parser and Slug Humanization
 *
 * Extracts product information from URL structure without network requests.
 * Key insight: Most product URLs contain enough information to identify
 * the product even without scraping the page.
 */

import { getBrandFromDomain, type DomainBrandInfo } from './domainBrands';

export interface ParsedProductUrl {
  // Original URL parts
  url: string;
  domain: string;
  pathname: string;
  params: Record<string, string>;

  // Brand detection
  brand: string | null;
  brandInfo: DomainBrandInfo | null;
  category: string | null;
  isRetailer: boolean;

  // Product identification
  productSlug: string | null;
  humanizedName: string | null;
  modelNumber: string | null;
  sku: string | null;

  // Variant info
  size: string | null;
  color: string | null;
  variant: string | null;

  // Confidence in URL-based identification
  urlConfidence: number;
}

// Product path indicators - these typically precede product slugs
const PRODUCT_PATH_INDICATORS = [
  'p', 'product', 'products', 'pd', 'dp', 'item', 'items',
  'detail', 'details', 'view', 'gp',
];

// Path segments that indicate non-product pages (skip these)
const NON_PRODUCT_PATHS = [
  'shop', 'buy', 'store', 'category', 'categories', 'collection', 'collections',
  'men', 'women', 'mens', 'womens', 'kids', 'sale', 'new', 'featured',
  'search', 'cart', 'checkout', 'account', 'help', 'about',
];

// Category path patterns - segments that are likely categories, not products
// These get penalized in slug scoring to favor actual product names
const CATEGORY_PATH_PATTERNS = [
  // Gender-based categories
  /^(men|women|mens|womens|unisex|boys|girls|kids|children|youth|adult)s?$/i,
  // Clothing categories
  /^(tops|bottoms|pants|shorts|joggers|jackets|hoodies|sweaters|shirts|tees|t-shirts|dresses|skirts|jeans|leggings|activewear)$/i,
  // Footwear categories
  /^(shoes|sneakers|boots|sandals|slippers|running|training|casual|dress|athletic)$/i,
  // Accessory categories
  /^(accessories|bags|hats|caps|belts|socks|gloves|scarves|sunglasses|watches|jewelry)$/i,
  // Collection/section indicators
  /^(new|sale|featured|trending|bestsellers|bestselling|clearance|outlet|arrivals|latest)$/i,
  // Sport/activity categories
  /^(golf|tennis|running|yoga|hiking|outdoor|gym|fitness|training|sports|athletic)$/i,
];

// Pure category words for slug scoring (single words that are definitely categories)
const PURE_CATEGORY_WORDS = new Set([
  'men', 'women', 'mens', 'womens', 'unisex', 'boys', 'girls', 'kids', 'children',
  'tops', 'bottoms', 'pants', 'shorts', 'joggers', 'jackets', 'hoodies', 'shirts',
  'shoes', 'sneakers', 'boots', 'sandals', 'running', 'training',
  'accessories', 'bags', 'hats', 'socks',
  'new', 'sale', 'featured', 'clearance', 'outlet',
  'golf', 'tennis', 'yoga', 'hiking', 'outdoor', 'gym', 'fitness',
]);

// SKU/Model patterns that appear in URLs
const SKU_PATTERNS = [
  /\b([A-Z]{2,4}[\d]{4,8})\b/i,           // GMF000027, ABC12345
  /\b([A-Z]+-[\w]+-[\d]+)\b/i,            // XYZ-ABC-123
  /\bB0[A-Z0-9]{8,10}\b/i,                // Amazon ASIN B0XXXXXXXX
  /\b([\d]{5,10})\b/,                      // Numeric SKU 12345678
  /\b([A-Z]{2,3}-[\d]{3,6})\b/i,          // AB-12345
  /\b([A-Z]{1,2}[\d]{2,4}[A-Z]{1,3})\b/i, // A12BC, AB123C
];

// Color patterns in URLs
const COLOR_PATTERNS = [
  /\b(black|white|red|blue|green|navy|grey|gray|brown|tan|beige|cream|olive|pink|purple|orange|yellow|silver|gold|bronze|copper|charcoal|midnight|onyx|ivory|slate|graphite|heather)\b/i,
  /dwvar.*?_color[=_]([^&_]+)/i,          // Demandware color param
  /color[=_]([^&_]+)/i,                   // Generic color param
];

// Size patterns in URLs
const SIZE_PATTERNS = [
  /\b(xs|s|m|l|xl|xxl|xxxl|2xl|3xl)\b/i,  // Letter sizes
  /\bsize[=_]?([\d.]+)\b/i,               // Numeric sizes
  /dwvar.*?_size[=_]([^&_]+)/i,           // Demandware size param
];

// Known brands for extraction from URL slugs (sorted by specificity - longer names first)
// Used when scraping retailer sites where brand is in the product slug
const SLUG_BRAND_PATTERNS: Array<{ pattern: RegExp; brand: string }> = [
  // Golf - Multi-word brands first
  { pattern: /^scotty[- ]?cameron/i, brand: 'Scotty Cameron' },
  { pattern: /^voice[- ]?caddie/i, brand: 'Voice Caddie' },
  { pattern: /^shot[- ]?scope/i, brand: 'Shot Scope' },
  { pattern: /^super[- ]?stroke/i, brand: 'SuperStroke' },
  { pattern: /^golf[- ]?pride/i, brand: 'Golf Pride' },

  // Golf - Single word brands
  { pattern: /^taylormade/i, brand: 'TaylorMade' },
  { pattern: /^callaway/i, brand: 'Callaway' },
  { pattern: /^titleist/i, brand: 'Titleist' },
  { pattern: /^bridgestone/i, brand: 'Bridgestone' },
  { pattern: /^cleveland/i, brand: 'Cleveland' },
  { pattern: /^odyssey/i, brand: 'Odyssey' },
  { pattern: /^mizuno/i, brand: 'Mizuno' },
  { pattern: /^srixon/i, brand: 'Srixon' },
  { pattern: /^cobra/i, brand: 'Cobra' },
  { pattern: /^ping\b/i, brand: 'PING' },
  { pattern: /^vokey/i, brand: 'Vokey' },
  { pattern: /^wilson/i, brand: 'Wilson' },
  { pattern: /^xxio/i, brand: 'XXIO' },
  { pattern: /^pxg\b/i, brand: 'PXG' },
  { pattern: /^honma/i, brand: 'Honma' },
  { pattern: /^miura/i, brand: 'Miura' },
  { pattern: /^bettinardi/i, brand: 'Bettinardi' },
  { pattern: /^bushnell/i, brand: 'Bushnell' },
  { pattern: /^garmin/i, brand: 'Garmin' },
  { pattern: /^arccos/i, brand: 'Arccos' },
  { pattern: /^footjoy/i, brand: 'FootJoy' },

  // Golf Apparel
  { pattern: /^travis[- ]?mathew/i, brand: 'TravisMathew' },
  { pattern: /^peter[- ]?millar/i, brand: 'Peter Millar' },
  { pattern: /^g\/fore|^gfore/i, brand: 'G/FORE' },
  { pattern: /^greyson/i, brand: 'Greyson' },
  { pattern: /^johnnie[- ]?o/i, brand: 'Johnnie-O' },
  { pattern: /^linksoul/i, brand: 'Linksoul' },
  { pattern: /^malbon/i, brand: 'Malbon Golf' },
  { pattern: /^bad[- ]?birdie/i, brand: 'Bad Birdie' },

  // General Sports/Fashion
  { pattern: /^under[- ]?armour/i, brand: 'Under Armour' },
  { pattern: /^new[- ]?balance/i, brand: 'New Balance' },
  { pattern: /^nike/i, brand: 'Nike' },
  { pattern: /^adidas/i, brand: 'adidas' },
  { pattern: /^puma/i, brand: 'Puma' },

  // Tech
  { pattern: /^apple/i, brand: 'Apple' },
  { pattern: /^samsung/i, brand: 'Samsung' },
  { pattern: /^sony/i, brand: 'Sony' },
  { pattern: /^bose/i, brand: 'Bose' },
  { pattern: /^logitech/i, brand: 'Logitech' },
  { pattern: /^anker/i, brand: 'Anker' },
];

// Golf model number patterns that should preserve case
const GOLF_MODEL_PATTERNS = [
  // TaylorMade models
  { pattern: /\bqi10\b/gi, replacement: 'Qi10' },
  { pattern: /\bqi35\b/gi, replacement: 'Qi35' },
  { pattern: /\bstealth\s*2\b/gi, replacement: 'Stealth 2' },
  { pattern: /\bstealth\s*plus\b/gi, replacement: 'Stealth Plus' },
  { pattern: /\bsim\s*2\b/gi, replacement: 'SIM 2' },
  { pattern: /\bsim\s*max\b/gi, replacement: 'SIM Max' },
  { pattern: /\btp5\b/gi, replacement: 'TP5' },
  { pattern: /\btp5x\b/gi, replacement: 'TP5x' },

  // Titleist models
  { pattern: /\btsr([1234])\b/gi, replacement: 'TSR$1' },
  { pattern: /\btsi([1234])\b/gi, replacement: 'TSi$1' },
  { pattern: /\bgt([1234])\b/gi, replacement: 'GT$1' },
  { pattern: /\bpro\s*v1\b/gi, replacement: 'Pro V1' },
  { pattern: /\bpro\s*v1x\b/gi, replacement: 'Pro V1x' },
  { pattern: /\bavx\b/gi, replacement: 'AVX' },
  { pattern: /\bsm([789]|10)\b/gi, replacement: 'SM$1' },

  // Callaway models
  { pattern: /\bparadym\b/gi, replacement: 'Paradym' },
  { pattern: /\bai\s*smoke\b/gi, replacement: 'Ai Smoke' },
  { pattern: /\brogue\s*st\b/gi, replacement: 'Rogue ST' },
  { pattern: /\bepic\s*max\b/gi, replacement: 'Epic Max' },
  { pattern: /\bepic\s*speed\b/gi, replacement: 'Epic Speed' },
  { pattern: /\bjaws\b/gi, replacement: 'JAWS' },
  { pattern: /\bmd5\b/gi, replacement: 'MD5' },
  { pattern: /\bchr\s*soft\b/gi, replacement: 'Chrome Soft' },
  { pattern: /\bchr\s*soft\s*x\b/gi, replacement: 'Chrome Soft X' },

  // PING models
  { pattern: /\bg430\b/gi, replacement: 'G430' },
  { pattern: /\bg425\b/gi, replacement: 'G425' },
  { pattern: /\bg410\b/gi, replacement: 'G410' },
  { pattern: /\bi([25]30)\b/gi, replacement: 'i$1' },
  { pattern: /\bpld\b/gi, replacement: 'PLD' },

  // Cobra models
  { pattern: /\baerojet\b/gi, replacement: 'Aerojet' },
  { pattern: /\bltdx\b/gi, replacement: 'LTDx' },
  { pattern: /\bdarkspeed\b/gi, replacement: 'Darkspeed' },

  // Mizuno models
  { pattern: /\bjpx([0-9]+)\b/gi, replacement: 'JPX$1' },
  { pattern: /\bst([- ]?[xz]|max)\b/gi, replacement: 'ST$1' },

  // Srixon models
  { pattern: /\bzx([457]|mk\s*ii)\b/gi, replacement: 'ZX$1' },
  { pattern: /\bz[- ]?star\b/gi, replacement: 'Z-Star' },

  // Cleveland models
  { pattern: /\brtx\b/gi, replacement: 'RTX' },
  { pattern: /\bcbx\b/gi, replacement: 'CBX' },

  // Generic patterns
  { pattern: /\bmax\b/gi, replacement: 'Max' },
  { pattern: /\bls\b/gi, replacement: 'LS' },
  { pattern: /\bhd\b/gi, replacement: 'HD' },
];

/**
 * Parse a product URL to extract all available information
 */
export function parseProductUrl(urlString: string): ParsedProductUrl {
  let parsed: URL;
  try {
    parsed = new URL(urlString);
  } catch {
    // Try adding https:// if missing
    try {
      parsed = new URL(`https://${urlString}`);
    } catch {
      return createEmptyResult(urlString);
    }
  }

  const domain = parsed.hostname.replace(/^www\./, '');
  const pathname = decodeURIComponent(parsed.pathname);
  const params = Object.fromEntries(parsed.searchParams.entries());

  // Get brand info from domain
  const brandInfo = getBrandFromDomain(domain);
  let brand = brandInfo?.brand || null;
  const category = brandInfo?.category || null;
  const isRetailer = brandInfo?.isRetailer || false;

  // Extract product slug from path
  const pathParts = pathname.split('/').filter(Boolean);
  const productSlug = extractProductSlug(pathParts, parsed.search, brandInfo);

  // For retailers, try to extract brand from the product slug
  let slugBrand: string | null = null;
  if (isRetailer && productSlug) {
    slugBrand = extractBrandFromSlug(productSlug);
    if (slugBrand) {
      brand = slugBrand;
    }
  }

  // Humanize the slug (passing the extracted brand for proper removal)
  const humanizedName = humanizeProductSlug(productSlug, brand);

  // Extract model/SKU
  const { modelNumber, sku } = extractModelAndSku(urlString, params);

  // Extract variants
  const color = extractColor(urlString, params);
  const size = extractSize(urlString, params);
  const variant = params.variant || params.v || null;

  // Calculate confidence based on what we found
  const urlConfidence = calculateUrlConfidence({
    hasBrand: !!brand,
    hasProductSlug: !!productSlug,
    hasHumanizedName: !!humanizedName && humanizedName.length > 5,
    hasModelNumber: !!modelNumber,
    isKnownRetailer: isRetailer,
  });

  return {
    url: urlString,
    domain,
    pathname,
    params,
    brand,
    brandInfo,
    category,
    isRetailer,
    productSlug,
    humanizedName,
    modelNumber,
    sku,
    size,
    color,
    variant,
    urlConfidence,
  };
}

/**
 * Extract brand from a product slug (for retailer URLs)
 */
function extractBrandFromSlug(slug: string): string | null {
  // Normalize the slug for matching
  const normalized = slug.replace(/-/g, ' ').toLowerCase();

  for (const { pattern, brand } of SLUG_BRAND_PATTERNS) {
    if (pattern.test(normalized)) {
      return brand;
    }
  }

  return null;
}

/**
 * Apply golf model number corrections to properly case model names
 */
function applyModelCorrections(name: string): string {
  let corrected = name;

  for (const { pattern, replacement } of GOLF_MODEL_PATTERNS) {
    corrected = corrected.replace(pattern, replacement);
  }

  return corrected;
}

/**
 * Score a URL segment as a potential product slug
 * Higher scores indicate more likely product names
 */
function scoreSlugCandidate(slug: string): number {
  let score = 0;
  // Strip common file extensions before scoring
  const cleanedSlug = slug.replace(/\.(html?|aspx?|php|jsp)$/i, '');
  const lower = cleanedSlug.toLowerCase();

  // Check if it's a pure category word (strong penalty)
  if (PURE_CATEGORY_WORDS.has(lower)) {
    score -= 50;
  }

  // Check if it matches category patterns (penalty)
  for (const pattern of CATEGORY_PATH_PATTERNS) {
    if (pattern.test(slug)) {
      score -= 30;
      break;
    }
  }

  // ID-like patterns (penalty) - things like prod12345, SKU-123
  if (/^prod\d+$/i.test(cleanedSlug) || /^[A-Z]{2,4}\d{5,}$/i.test(cleanedSlug) || /^sku[-_]?\d+$/i.test(cleanedSlug)) {
    score -= 20;
  }

  // SKU-style patterns: XX-XXXXX (2-3 letters, hyphen, 4-6 alphanumeric) - strong penalty
  // Examples: DW-TA127, AB-12345, XYZ-ABC1
  if (/^[A-Z]{2,3}-[A-Z0-9]{4,7}$/i.test(cleanedSlug)) {
    score -= 30;
  }

  // Amazon ref parameters (penalty)
  if (/^ref=/i.test(cleanedSlug)) {
    score -= 50;
  }

  // Underscore-prefixed identifiers like _/prod123 (penalty)
  if (/^_$/.test(cleanedSlug)) {
    score -= 40;
  }

  // Has hyphens (product-name-style) - bonus
  if (cleanedSlug.includes('-')) {
    score += 20;
    // More hyphens = more specific name (max +25 bonus)
    const hyphenCount = (cleanedSlug.match(/-/g) || []).length;
    score += Math.min(hyphenCount * 5, 25);
  }

  // Length bonus (longer = more specific, max +50)
  score += Math.min(cleanedSlug.length, 50);

  // Mixed case bonus (Title-Case product names)
  if (/[a-z]/.test(cleanedSlug) && /[A-Z]/.test(cleanedSlug)) {
    score += 10;
  }

  // Alphanumeric mix in product names (like "Qi10-Driver" or "Pro-V1") - bonus
  // But only if it also has descriptive words (more than just alphanumeric codes)
  if (/[a-zA-Z]/.test(cleanedSlug) && /\d/.test(cleanedSlug) && cleanedSlug.includes('-')) {
    // Check if it has at least one word-like segment (3+ consecutive letters)
    if (/[a-zA-Z]{3,}/.test(cleanedSlug)) {
      score += 10;
    }
  }

  return score;
}

/**
 * Check if a path segment matches a category pattern
 */
function isCategorySegment(segment: string): boolean {
  const lower = segment.toLowerCase();
  if (PURE_CATEGORY_WORDS.has(lower)) {
    return true;
  }
  for (const pattern of CATEGORY_PATH_PATTERNS) {
    if (pattern.test(segment)) {
      return true;
    }
  }
  return false;
}

/**
 * Extract the product slug from URL path parts
 */
function extractProductSlug(
  pathParts: string[],
  queryString: string,
  brandInfo?: DomainBrandInfo | null
): string | null {
  // Strategy 1: If we have site-specific URL config, use it
  if (brandInfo?.urlConfig?.productSlugIndex !== undefined) {
    // Find the product indicator and get the slug at the specified index
    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i].toLowerCase();
      if (PRODUCT_PATH_INDICATORS.includes(part)) {
        const targetIndex = i + 1 + brandInfo.urlConfig.productSlugIndex;
        const targetPart = pathParts[targetIndex];
        if (targetPart && !targetPart.startsWith('_')) {
          return cleanSlug(targetPart);
        }
      }
    }
  }

  // Strategy 2: Score candidates after product indicators
  for (let i = 0; i < pathParts.length; i++) {
    const part = pathParts[i].toLowerCase();
    if (PRODUCT_PATH_INDICATORS.includes(part)) {
      // Collect up to 4 candidates after the indicator
      const candidates: Array<{ slug: string; score: number }> = [];
      for (let j = 1; j <= 4 && i + j < pathParts.length; j++) {
        const candidate = pathParts[i + j];
        // Skip underscore-only segments (like Lululemon's /_/)
        if (candidate === '_' || candidate.startsWith('_')) continue;
        // Skip product indicators
        if (PRODUCT_PATH_INDICATORS.includes(candidate.toLowerCase())) continue;

        const score = scoreSlugCandidate(candidate);
        candidates.push({ slug: candidate, score });
      }

      // Return the highest-scoring candidate
      if (candidates.length > 0) {
        candidates.sort((a, b) => b.score - a.score);
        return cleanSlug(candidates[0].slug);
      }
    }
  }

  // Strategy 3: Find the highest-scoring slug-like path segment
  const slugCandidates = pathParts
    .filter(part => {
      const lower = part.toLowerCase();
      // Skip very short segments and non-product paths
      return !NON_PRODUCT_PATHS.includes(lower) && part.length > 3;
    })
    .filter(part => {
      // Slug should have letters
      return /[a-zA-Z]/.test(part);
    })
    .map(part => ({
      slug: part,
      score: scoreSlugCandidate(part),
    }))
    .sort((a, b) => b.score - a.score);

  if (slugCandidates.length > 0 && slugCandidates[0].score > 0) {
    return cleanSlug(slugCandidates[0].slug);
  }

  return null;
}

/**
 * Clean a URL slug for processing
 */
function cleanSlug(slug: string): string {
  return slug
    .replace(/\.html?$/i, '')     // Remove .html extension
    .replace(/\.aspx?$/i, '')     // Remove .asp extension
    .replace(/\.php$/i, '')       // Remove .php extension
    .replace(/\?.*$/, '')         // Remove query string if attached
    .trim();
}

/**
 * Humanize a product slug into a readable product name
 */
export function humanizeProductSlug(slug: string | null, brand: string | null): string | null {
  if (!slug || slug.length < 3) return null;

  let humanized = slug
    // Replace multiple dashes/underscores with single separator (e.g., "---" to " - ")
    .replace(/[-_]{2,}/g, ' - ')
    // Replace separators with spaces
    .replace(/[-_+]/g, ' ')
    // Handle camelCase
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    // Handle number-letter transitions (but keep model numbers together)
    .replace(/(\d)([a-zA-Z])/g, '$1 $2')
    // Remove common URL artifacts
    .replace(/\b(html|htm|aspx?|php|jsp)\b/gi, '')
    // Normalize spaces
    .replace(/\s+/g, ' ')
    .trim();

  // Title case each word
  humanized = humanized
    .split(' ')
    .map(word => {
      // Keep all-caps words (acronyms, model numbers)
      if (word === word.toUpperCase() && word.length <= 5) {
        return word;
      }
      // Title case
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');

  // Apply golf model number corrections (TSR3, Qi10, etc.)
  humanized = applyModelCorrections(humanized);

  // Clean up common patterns
  humanized = humanized
    // Remove SKU-like suffixes
    .replace(/\s+[A-Z]{2,3}\d{3,}$/i, '')
    // Clean up size suffixes that got into the name
    .replace(/\s+(Xs|S|M|L|Xl|Xxl|2xl|3xl)\s*$/i, '');

  // Remove brand from the beginning if present
  if (brand) {
    // Handle multi-word brands (e.g., "Scotty Cameron")
    const brandLower = brand.toLowerCase();
    const humanizedLower = humanized.toLowerCase();

    if (humanizedLower.startsWith(brandLower)) {
      humanized = humanized.slice(brand.length).trim();
      // Remove leading dash or connector if present
      humanized = humanized.replace(/^[-–—|:\s]+/, '').trim();
    }
  }

  // Minimum viable name
  if (humanized.length < 3) return null;

  return humanized;
}

/**
 * Extract model number and SKU from URL
 */
function extractModelAndSku(url: string, params: Record<string, string>): { modelNumber: string | null; sku: string | null } {
  // Check params first
  const sku = params.sku || params.productId || params.id || params.pid || params.skuId || null;

  // Look for model number in URL
  let modelNumber: string | null = null;

  for (const pattern of SKU_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      modelNumber = match[1] || match[0];
      break;
    }
  }

  return { modelNumber, sku };
}

/**
 * Extract color from URL
 */
function extractColor(url: string, params: Record<string, string>): string | null {
  // Check params
  if (params.color) return params.color;

  // Check URL patterns
  for (const pattern of COLOR_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      const color = match[1];
      // Humanize color code if needed
      return humanizeColorCode(color);
    }
  }

  return null;
}

/**
 * Extract size from URL
 */
function extractSize(url: string, params: Record<string, string>): string | null {
  // Check params
  if (params.size) return params.size;

  // Check URL patterns
  for (const pattern of SIZE_PATTERNS) {
    const match = url.match(pattern);
    if (match) {
      return match[1].toUpperCase();
    }
  }

  return null;
}

/**
 * Humanize color codes (e.g., "DNGM" -> might be "Dark Navy Gray Melange")
 * For now, just clean up obvious codes
 */
function humanizeColorCode(code: string): string {
  // Common color code mappings
  const colorCodes: Record<string, string> = {
    'blk': 'Black',
    'wht': 'White',
    'nvy': 'Navy',
    'gry': 'Gray',
    'red': 'Red',
    'blu': 'Blue',
    'grn': 'Green',
    'brn': 'Brown',
    'pnk': 'Pink',
    'prp': 'Purple',
    'org': 'Orange',
    'ylw': 'Yellow',
    'slv': 'Silver',
    'gld': 'Gold',
  };

  const lower = code.toLowerCase();
  if (colorCodes[lower]) {
    return colorCodes[lower];
  }

  // If it looks like a readable word, title case it
  if (/^[a-zA-Z]+$/.test(code) && code.length > 3) {
    return code.charAt(0).toUpperCase() + code.slice(1).toLowerCase();
  }

  // Return as-is if we can't decode it
  return code;
}

/**
 * Calculate confidence score for URL-based identification
 */
function calculateUrlConfidence(factors: {
  hasBrand: boolean;
  hasProductSlug: boolean;
  hasHumanizedName: boolean;
  hasModelNumber: boolean;
  isKnownRetailer: boolean;
}): number {
  let confidence = 0.3; // Base confidence

  if (factors.hasBrand && !factors.isKnownRetailer) {
    confidence += 0.25; // Known brand domain is very reliable
  }

  if (factors.hasProductSlug) {
    confidence += 0.15;
  }

  if (factors.hasHumanizedName) {
    confidence += 0.15;
  }

  if (factors.hasModelNumber) {
    confidence += 0.1;
  }

  // Cap at reasonable URL-only confidence
  return Math.min(confidence, 0.85);
}

/**
 * Create empty result for invalid URLs
 */
function createEmptyResult(url: string): ParsedProductUrl {
  return {
    url,
    domain: '',
    pathname: '',
    params: {},
    brand: null,
    brandInfo: null,
    category: null,
    isRetailer: false,
    productSlug: null,
    humanizedName: null,
    modelNumber: null,
    sku: null,
    size: null,
    color: null,
    variant: null,
    urlConfidence: 0,
  };
}

/**
 * Escape special regex characters
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Format parsed URL as a product name string
 * Combines brand + humanized name intelligently
 */
export function formatProductName(parsed: ParsedProductUrl): string | null {
  if (!parsed.humanizedName && !parsed.brand) {
    return null;
  }

  const parts: string[] = [];

  // Add brand if known and not a retailer
  if (parsed.brand && !parsed.isRetailer) {
    parts.push(parsed.brand);
  }

  // Add humanized product name
  if (parsed.humanizedName) {
    // Avoid duplicate brand in name
    let name = parsed.humanizedName;
    if (parsed.brand) {
      const brandLower = parsed.brand.toLowerCase();
      if (name.toLowerCase().startsWith(brandLower)) {
        name = name.slice(parsed.brand.length).trim();
      }
    }
    if (name) {
      parts.push(name);
    }
  }

  return parts.length > 0 ? parts.join(' ') : null;
}
