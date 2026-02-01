/**
 * Item Type Inference
 *
 * Smart detection of item_type based on:
 * - URL domains (software/service detection)
 * - Product names (supplement keywords)
 * - Bag context (category, tags)
 */

import type { ItemType } from '@/lib/types/itemTypes';

// ============================================
// Domain-based Inference
// ============================================

/**
 * Known software/SaaS domains
 */
const SOFTWARE_DOMAINS = new Set([
  // Design
  'figma.com',
  'sketch.com',
  'canva.com',
  'adobe.com',
  'framer.com',
  'webflow.com',

  // Development
  'github.com',
  'gitlab.com',
  'bitbucket.org',
  'vercel.com',
  'netlify.com',
  'heroku.com',
  'railway.app',
  'render.com',
  'fly.io',
  'supabase.com',
  'firebase.google.com',
  'aws.amazon.com',
  'cloud.google.com',
  'azure.microsoft.com',
  'digitalocean.com',

  // Productivity
  'notion.so',
  'notion.com',
  'airtable.com',
  'coda.io',
  'clickup.com',
  'asana.com',
  'monday.com',
  'trello.com',
  'linear.app',
  'height.app',
  'todoist.com',
  'obsidian.md',
  'roamresearch.com',
  'craft.do',

  // Communication
  'slack.com',
  'discord.com',
  'zoom.us',
  'loom.com',
  'calendly.com',
  'cal.com',

  // AI Tools
  'openai.com',
  'anthropic.com',
  'midjourney.com',
  'runwayml.com',
  'stability.ai',
  'huggingface.co',
  'replicate.com',

  // Video/Audio
  'descript.com',
  'riverside.fm',
  'streamyard.com',
  'restream.io',
  'anchor.fm',
  'transistor.fm',

  // Marketing
  'mailchimp.com',
  'convertkit.com',
  'beehiiv.com',
  'substack.com',
  'buttondown.email',
  'hubspot.com',
  'intercom.com',
  'crisp.chat',

  // Analytics
  'amplitude.com',
  'mixpanel.com',
  'posthog.com',
  'plausible.io',
  'fathom.so',
  'hotjar.com',

  // Storage/Files
  'dropbox.com',
  'box.com',
  'drive.google.com',
  'onedrive.live.com',

  // Code Editors
  'code.visualstudio.com',
  'cursor.sh',
  'replit.com',
  'codesandbox.io',
  'stackblitz.com',
]);

/**
 * Known supplement/health domains
 */
const SUPPLEMENT_DOMAINS = new Set([
  // Major supplement retailers
  'iherb.com',
  'vitacost.com',
  'swansonvitamins.com',
  'pureformulas.com',
  'luckyvitamin.com',

  // Premium brands
  'thorne.com',
  'pureencapsulations.com',
  'lifextension.com',
  'jarrow.com',
  'nowfoods.com',
  'gardenoflife.com',
  'naturemade.com',
  'nordicnaturals.com',
  'athleticgreens.com',
  'ag1.com',
  'momentous.com',
  'livemomentous.com',

  // Biohacking/Longevity
  'examine.com',
  'hubermanlab.com',
  'foundmyfitness.com',
  'bulletproof.com',
  'onnit.com',
  'nootropicsdepot.com',
  'doublewoodsupplements.com',
]);

/**
 * Domains that are definitely physical products (not software)
 */
const PHYSICAL_PRODUCT_DOMAINS = new Set([
  // General retail
  'amazon.com',
  'walmart.com',
  'target.com',
  'bestbuy.com',
  'costco.com',

  // Sports/Outdoor
  'rei.com',
  'backcountry.com',
  'moosejaw.com',
  'patagonia.com',
  'thenorthface.com',

  // Golf
  'golfgalaxy.com',
  'pgatoursuperstore.com',
  'callawaygolf.com',
  'taylormadegolf.com',
  'titleist.com',

  // Electronics
  'apple.com',
  'bhphotovideo.com',
  'adorama.com',

  // Fashion
  'nordstrom.com',
  'zappos.com',
]);

/**
 * Extract domain from URL
 */
function extractDomain(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./, '').toLowerCase();
  } catch {
    return null;
  }
}

/**
 * Infer item type from URL
 */
export function inferTypeFromUrl(url: string): ItemType | null {
  const domain = extractDomain(url);
  if (!domain) return null;

  // Check exact domain matches
  if (SOFTWARE_DOMAINS.has(domain)) {
    return 'software';
  }

  if (SUPPLEMENT_DOMAINS.has(domain)) {
    return 'supplement';
  }

  // Check if it's a known physical product retailer
  if (PHYSICAL_PRODUCT_DOMAINS.has(domain)) {
    return 'physical_product';
  }

  // Check for software-like patterns in URL
  if (
    domain.endsWith('.app') ||
    domain.endsWith('.io') ||
    domain.endsWith('.dev') ||
    domain.endsWith('.tools') ||
    domain.endsWith('.ai')
  ) {
    return 'software';
  }

  // Check for supplement patterns in URL path
  if (url.toLowerCase().includes('/supplements') ||
      url.toLowerCase().includes('/vitamins') ||
      url.toLowerCase().includes('/health/')) {
    return 'supplement';
  }

  return null; // Can't determine, use default
}

// ============================================
// Name-based Inference
// ============================================

/**
 * Keywords that suggest supplements
 */
const SUPPLEMENT_KEYWORDS = [
  // Forms
  'vitamin', 'mineral', 'supplement', 'capsule', 'softgel', 'tablet', 'powder',
  'gummy', 'gummies', 'tincture', 'extract',

  // Specific supplements
  'magnesium', 'zinc', 'iron', 'calcium', 'potassium', 'selenium',
  'd3', 'k2', 'b12', 'b-complex', 'folate', 'biotin', 'niacin',
  'omega-3', 'omega 3', 'fish oil', 'krill oil', 'cod liver',
  'probiotic', 'prebiotic', 'digestive enzyme',
  'collagen', 'protein powder', 'whey', 'casein', 'creatine', 'bcaa',
  'ashwagandha', 'rhodiola', 'ginseng', 'maca', 'lions mane', "lion's mane",
  'reishi', 'cordyceps', 'chaga', 'mushroom complex',
  'melatonin', 'gaba', 'l-theanine', 'glycine', '5-htp',
  'coq10', 'ubiquinol', 'nad+', 'nmn', 'resveratrol', 'quercetin',
  'turmeric', 'curcumin', 'glucosamine', 'chondroitin', 'msm',
  'elderberry', 'echinacea', 'astragalus',
];

/**
 * Keywords that suggest software
 */
const SOFTWARE_KEYWORDS = [
  'app', 'software', 'saas', 'platform', 'tool', 'subscription',
  'pro plan', 'premium plan', 'enterprise', 'free tier',
  'api', 'sdk', 'plugin', 'extension', 'integration',
  'cloud', 'hosting', 'deployment', 'ci/cd',
  'editor', 'ide', 'workspace', 'dashboard',
];

/**
 * Keywords that suggest services (not downloadable software)
 */
const SERVICE_KEYWORDS = [
  'subscription', 'membership', 'plan', 'monthly', 'annual',
  'service', 'hosting', 'cloud', 'storage', 'api access',
];

/**
 * Infer item type from product name
 */
export function inferTypeFromName(name: string): ItemType | null {
  const lower = name.toLowerCase();

  // Check supplement keywords
  for (const keyword of SUPPLEMENT_KEYWORDS) {
    if (lower.includes(keyword)) {
      return 'supplement';
    }
  }

  // Check software keywords
  for (const keyword of SOFTWARE_KEYWORDS) {
    if (lower.includes(keyword)) {
      return 'software';
    }
  }

  return null;
}

// ============================================
// Context-based Inference
// ============================================

/**
 * Bag categories/tags that suggest item types
 */
const BAG_CONTEXT_MAP: Record<string, ItemType> = {
  // Supplement contexts
  'supplements': 'supplement',
  'supplement stack': 'supplement',
  'vitamins': 'supplement',
  'biohacking': 'supplement',
  'health stack': 'supplement',
  'nootropics': 'supplement',
  'longevity': 'supplement',

  // Software/creator contexts
  'creator tools': 'software',
  'software': 'software',
  'tech stack': 'software',
  'dev tools': 'software',
  'developer tools': 'software',
  'saas': 'software',
  'apps': 'software',
  'productivity': 'software',

  // Service contexts
  'subscriptions': 'service',
  'services': 'service',
};

/**
 * Infer item type from bag context (category, tags, title)
 */
export function inferTypeFromBagContext(
  bagTitle?: string | null,
  bagCategory?: string | null,
  bagTags?: string[] | null
): ItemType | null {
  // Check category
  if (bagCategory) {
    const categoryLower = bagCategory.toLowerCase();
    if (BAG_CONTEXT_MAP[categoryLower]) {
      return BAG_CONTEXT_MAP[categoryLower];
    }
  }

  // Check tags
  if (bagTags && bagTags.length > 0) {
    for (const tag of bagTags) {
      const tagLower = tag.toLowerCase();
      if (BAG_CONTEXT_MAP[tagLower]) {
        return BAG_CONTEXT_MAP[tagLower];
      }
    }
  }

  // Check title
  if (bagTitle) {
    const titleLower = bagTitle.toLowerCase();
    for (const [context, itemType] of Object.entries(BAG_CONTEXT_MAP)) {
      if (titleLower.includes(context)) {
        return itemType;
      }
    }
  }

  return null;
}

// ============================================
// Combined Inference
// ============================================

export interface InferenceContext {
  url?: string | null;
  productName?: string | null;
  brand?: string | null;
  bagTitle?: string | null;
  bagCategory?: string | null;
  bagTags?: string[] | null;
}

/**
 * Infer item type from all available context
 * Priority: URL > Name > Bag Context
 */
export function inferItemType(context: InferenceContext): ItemType {
  // 1. Try URL inference (most reliable)
  if (context.url) {
    const urlType = inferTypeFromUrl(context.url);
    if (urlType) return urlType;
  }

  // 2. Try name inference
  if (context.productName) {
    const nameType = inferTypeFromName(context.productName);
    if (nameType) return nameType;
  }

  // 3. Try brand inference (some brands are clearly supplements)
  if (context.brand) {
    const brandLower = context.brand.toLowerCase();
    const supplementBrands = [
      'thorne', 'pure encapsulations', 'life extension', 'jarrow',
      'now foods', 'garden of life', 'nordic naturals', 'momentous',
      'athletic greens', 'ag1', 'onnit', 'bulletproof'
    ];
    if (supplementBrands.some(b => brandLower.includes(b))) {
      return 'supplement';
    }
  }

  // 4. Try bag context inference
  const bagType = inferTypeFromBagContext(
    context.bagTitle,
    context.bagCategory,
    context.bagTags
  );
  if (bagType) return bagType;

  // 5. Default to physical product
  return 'physical_product';
}

/**
 * Check if an inferred type should override an existing type
 * Only override if current type is 'physical_product' (the default)
 */
export function shouldOverrideType(currentType: ItemType | null | undefined, inferredType: ItemType): boolean {
  if (!currentType || currentType === 'physical_product') {
    return inferredType !== 'physical_product';
  }
  return false;
}
