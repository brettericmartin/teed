/**
 * Unified AI Client for Product Library Agents
 *
 * Supports both OpenAI and Anthropic providers for collecting product data.
 * Includes retry logic, response parsing, and validation.
 */

import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import type { Category, Product, BrandCatalog } from '../schema';
import { generateBrandAgentPrompt, type BrandAgentConfig } from './orchestrator';

// =============================================================================
// Types
// =============================================================================

export type AIProvider = 'openai' | 'anthropic';

export interface AIClientConfig {
  provider: AIProvider;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

export interface CollectionResult {
  products: Product[];
  tokensUsed: number;
  duration: number;
  provider: AIProvider;
  model: string;
}

// Provider defaults - increased tokens for comprehensive collection
const PROVIDER_DEFAULTS = {
  openai: {
    model: 'gpt-4o',
    maxTokens: 16384,
    temperature: 0.1,
  },
  anthropic: {
    model: 'claude-sonnet-4-20250514',
    maxTokens: 16384,
    temperature: 0.1,
  },
};

// Bulk retailers by category for comprehensive product sourcing
const BULK_RETAILERS: Record<string, string[]> = {
  golf: [
    'Second Swing Golf (secondswing.com) - largest used golf retailer',
    'GlobalGolf (globalgolf.com) - new and used equipment',
    '2nd Swing (2ndswing.com) - extensive club database',
    'Callaway Pre-Owned (callawaygolfpreowned.com)',
    'TaylorMade Pre-Owned (taylormadegolfpreowned.com)',
    'Golf Avenue (golfavenue.com)',
    'Rock Bottom Golf (rockbottomgolf.com)',
    '3balls (3balls.com)',
  ],
  tech: [
    'Swappa (swappa.com) - used tech marketplace',
    'Back Market (backmarket.com) - refurbished devices',
    'Decluttr (decluttr.com)',
    'Best Buy - consumer electronics',
    'Amazon - comprehensive product listings',
    'B&H Photo (bhphotovideo.com)',
  ],
  photography: [
    'KEH Camera (keh.com) - largest used camera retailer',
    'MPB (mpb.com) - used photo gear',
    'Adorama Used',
    'B&H Photo Used Department',
    'LensRentals (lensrentals.com)',
  ],
  music: [
    'Reverb (reverb.com) - largest music gear marketplace',
    'Guitar Center - new and used',
    'Sweetwater (sweetwater.com)',
    'Sam Ash (samash.com)',
    'Musician\'s Friend (musiciansfriend.com)',
  ],
  outdoor: [
    'REI (rei.com) - outdoor gear retailer',
    'REI Used Gear (rei.com/used)',
    'Backcountry (backcountry.com)',
    'Moosejaw (moosejaw.com)',
    'Campsaver (campsaver.com)',
  ],
  fashion: [
    'Nordstrom (nordstrom.com)',
    'SSENSE (ssense.com)',
    'ThredUp (thredup.com)',
    'Poshmark (poshmark.com)',
    'Grailed (grailed.com)',
    'StockX (stockx.com) - for sneakers',
  ],
  makeup: [
    'Sephora (sephora.com)',
    'Ulta Beauty (ulta.com)',
    'Nordstrom Beauty',
    'SpaceNK (spacenk.com)',
    'Cult Beauty (cultbeauty.com)',
  ],
  gaming: [
    'Best Buy Gaming',
    'GameStop (gamestop.com)',
    'Micro Center (microcenter.com)',
    'Newegg (newegg.com)',
    'Amazon Gaming',
  ],
  fitness: [
    'Rogue Fitness (roguefitness.com)',
    'REP Fitness (repfitness.com)',
    'Dick\'s Sporting Goods',
    'Amazon Fitness',
    'Target Fitness',
  ],
  travel: [
    'Away (awaytravel.com)',
    'Nordstrom Luggage',
    'Amazon Travel',
    'REI Travel',
    'TravelSmith',
  ],
  edc: [
    'BladeHQ (bladehq.com) - largest knife retailer',
    'Knife Center (knifecenter.com)',
    'DLT Trading (dlttrading.com)',
    'GPKnives (gpknives.com)',
    'Amazon EDC',
  ],
};

// =============================================================================
// Client Initialization
// =============================================================================

let openaiClient: OpenAI | null = null;
let anthropicClient: Anthropic | null = null;

function getOpenAIClient(): OpenAI {
  if (!openaiClient) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error('Missing OPENAI_API_KEY environment variable');
    }
    openaiClient = new OpenAI({ apiKey });
  }
  return openaiClient;
}

function getAnthropicClient(): Anthropic {
  if (!anthropicClient) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error('Missing ANTHROPIC_API_KEY environment variable');
    }
    anthropicClient = new Anthropic({ apiKey });
  }
  return anthropicClient;
}

// =============================================================================
// Retry Logic
// =============================================================================

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 5,
  baseDelayMs = 2000,
  maxDelayMs = 120000
): Promise<T> {
  let lastError: Error = new Error('Unknown error');

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));
      const errorAny = error as { status?: number; code?: string };

      // Don't retry on auth errors
      if (errorAny?.status === 401 || errorAny?.status === 403) {
        throw error;
      }

      // Rate limit or server error - retry with backoff
      if (
        errorAny?.status === 429 ||
        errorAny?.status === 500 ||
        errorAny?.status === 502 ||
        errorAny?.status === 503 ||
        errorAny?.code === 'rate_limit_exceeded'
      ) {
        const delay = Math.min(
          baseDelayMs * Math.pow(2, attempt) + Math.random() * 500,
          maxDelayMs
        );
        console.log(
          `[AIClient] Rate limited/error, retrying in ${Math.round(delay / 1000)}s (attempt ${attempt + 1}/${maxRetries})...`
        );
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Other errors - throw immediately
      throw error;
    }
  }

  throw lastError;
}

// =============================================================================
// Response Parsing
// =============================================================================

/**
 * Parse AI response into Product array with fallback for markdown-wrapped JSON
 */
export function parseProductResponse(response: string): Product[] {
  // Try direct JSON parse first
  try {
    const parsed = JSON.parse(response);

    // Handle both array and object with products property
    if (Array.isArray(parsed)) {
      return parsed;
    }
    if (parsed.products && Array.isArray(parsed.products)) {
      return parsed.products;
    }
    if (parsed.name && parsed.products) {
      // BrandCatalog format
      return parsed.products;
    }

    console.warn('[AIClient] Unexpected response structure, returning empty array');
    return [];
  } catch {
    // Try to extract JSON from markdown code block
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      try {
        const parsed = JSON.parse(jsonMatch[1].trim());
        if (Array.isArray(parsed)) {
          return parsed;
        }
        if (parsed.products && Array.isArray(parsed.products)) {
          return parsed.products;
        }
        return [];
      } catch {
        console.error('[AIClient] Failed to parse JSON from code block');
      }
    }

    // Try to find JSON array in response
    const arrayMatch = response.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        return JSON.parse(arrayMatch[0]);
      } catch {
        console.error('[AIClient] Failed to parse extracted JSON array');
      }
    }

    console.error('[AIClient] Could not parse response as JSON');
    return [];
  }
}

/**
 * Validate and clean product data
 */
export function validateProducts(products: unknown[]): Product[] {
  const validProducts: Product[] = [];

  for (const item of products) {
    if (!item || typeof item !== 'object') continue;

    const product = item as Record<string, unknown>;

    // Required fields
    if (!product.name || typeof product.name !== 'string') continue;
    if (!product.brand || typeof product.brand !== 'string') continue;
    if (!product.category || typeof product.category !== 'string') continue;

    // Generate ID if missing
    const id =
      (product.id as string) ||
      `${product.brand}-${product.name}`
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');

    // Build validated product
    const validated: Product = {
      id,
      name: product.name as string,
      brand: product.brand as string,
      category: product.category as Category,
      subcategory: (product.subcategory as string) || undefined,
      releaseYear:
        typeof product.releaseYear === 'number'
          ? product.releaseYear
          : new Date().getFullYear(),
      msrp: typeof product.msrp === 'number' ? product.msrp : undefined,
      visualSignature: {
        primaryColors: Array.isArray(
          (product.visualSignature as Record<string, unknown>)?.primaryColors
        )
          ? ((product.visualSignature as Record<string, unknown>)
              .primaryColors as string[])
          : [],
        secondaryColors: Array.isArray(
          (product.visualSignature as Record<string, unknown>)?.secondaryColors
        )
          ? ((product.visualSignature as Record<string, unknown>)
              .secondaryColors as string[])
          : undefined,
        colorwayName:
          ((product.visualSignature as Record<string, unknown>)
            ?.colorwayName as string) || undefined,
        patterns: Array.isArray(
          (product.visualSignature as Record<string, unknown>)?.patterns
        )
          ? ((product.visualSignature as Record<string, unknown>)
              .patterns as Array<
              | 'solid'
              | 'striped'
              | 'plaid'
              | 'camo'
              | 'gradient'
              | 'geometric'
              | 'chevron'
              | 'heathered'
              | 'carbon-weave'
              | 'checkered'
              | 'floral'
              | 'other'
            >)
          : ['solid'],
        finish:
          ((product.visualSignature as Record<string, unknown>)?.finish as
            | 'matte'
            | 'glossy'
            | 'metallic'
            | 'satin'
            | 'textured'
            | 'brushed') || undefined,
        designCues: Array.isArray(
          (product.visualSignature as Record<string, unknown>)?.designCues
        )
          ? ((product.visualSignature as Record<string, unknown>)
              .designCues as string[])
          : [],
        distinguishingFeatures: Array.isArray(
          (product.visualSignature as Record<string, unknown>)
            ?.distinguishingFeatures
        )
          ? ((product.visualSignature as Record<string, unknown>)
              .distinguishingFeatures as string[])
          : [],
        logoPlacement:
          ((product.visualSignature as Record<string, unknown>)
            ?.logoPlacement as string) || undefined,
      },
      referenceImages: {
        primary:
          ((product.referenceImages as Record<string, unknown>)
            ?.primary as string) || '',
        angles: Array.isArray(
          (product.referenceImages as Record<string, unknown>)?.angles
        )
          ? ((product.referenceImages as Record<string, unknown>)
              .angles as string[])
          : undefined,
      },
      specifications:
        (product.specifications as Record<
          string,
          string | string[] | number | boolean
        >) || {},
      modelNumber: (product.modelNumber as string) || undefined,
      variants: Array.isArray(product.variants) ? product.variants : [],
      searchKeywords: Array.isArray(product.searchKeywords)
        ? (product.searchKeywords as string[])
        : [],
      aliases: Array.isArray(product.aliases)
        ? (product.aliases as string[])
        : undefined,
      productUrl: (product.productUrl as string) || undefined,
      description: (product.description as string) || undefined,
      features: Array.isArray(product.features)
        ? (product.features as string[])
        : undefined,
      lastUpdated: new Date().toISOString(),
      source: 'ai',
      dataConfidence:
        typeof product.dataConfidence === 'number' ? product.dataConfidence : 80,
    };

    validProducts.push(validated);
  }

  return validProducts;
}

// =============================================================================
// Main Collection Function
// =============================================================================

// Category subcategories for multi-pass collection - ensures comprehensive coverage
const CATEGORY_SUBCATEGORIES: Partial<Record<Category, Array<{ name: string; description: string }>>> = {
  golf: [
    { name: 'drivers', description: 'Drivers and driver heads (woods off the tee)' },
    { name: 'fairway-woods', description: 'Fairway woods (3-wood, 5-wood, 7-wood, etc.)' },
    { name: 'hybrids', description: 'Hybrid clubs and rescue clubs' },
    { name: 'irons', description: 'Iron sets and individual irons (3i-PW)' },
    { name: 'wedges', description: 'Wedges (pitching, gap, sand, lob)' },
    { name: 'putters', description: 'Putters (blade, mallet, insert, etc.)' },
  ],
  tech: [
    { name: 'phones', description: 'Smartphones and mobile devices' },
    { name: 'tablets', description: 'Tablets and e-readers' },
    { name: 'laptops', description: 'Laptops and notebook computers' },
    { name: 'headphones', description: 'Over-ear and on-ear headphones' },
    { name: 'earbuds', description: 'Wireless earbuds and in-ear monitors' },
    { name: 'speakers', description: 'Bluetooth and smart speakers' },
    { name: 'smartwatches', description: 'Smartwatches and fitness trackers' },
    { name: 'smart-home', description: 'Smart home devices (thermostats, cameras, doorbells)' },
  ],
  fashion: [
    { name: 'sneakers', description: 'Athletic sneakers and running shoes' },
    { name: 'jackets', description: 'Jackets, outerwear, and coats' },
    { name: 'pants', description: 'Pants, joggers, and shorts' },
    { name: 'tops', description: 'Shirts, t-shirts, hoodies, and sweaters' },
    { name: 'athletic', description: 'Athletic wear and performance apparel' },
    { name: 'accessories', description: 'Bags, hats, belts, and accessories' },
  ],
  makeup: [
    { name: 'face', description: 'Foundation, concealer, powder, and primer' },
    { name: 'lips', description: 'Lipstick, lip gloss, lip liner, and lip treatments' },
    { name: 'eyes', description: 'Eyeshadow, mascara, eyeliner, and brow products' },
    { name: 'cheeks', description: 'Blush, bronzer, highlighter, and contour' },
    { name: 'skincare', description: 'Serums, moisturizers, cleansers, and treatments' },
    { name: 'sunscreen', description: 'SPF products and sun protection' },
  ],
  outdoor: [
    { name: 'tents', description: 'Camping tents (backpacking, car camping, 4-season)' },
    { name: 'sleeping', description: 'Sleeping bags, sleeping pads, and quilts' },
    { name: 'backpacks', description: 'Hiking backpacks and daypacks' },
    { name: 'drinkware', description: 'Water bottles, tumblers, and hydration' },
    { name: 'cooking', description: 'Camp stoves, cookware, and water filters' },
    { name: 'clothing', description: 'Outdoor apparel and footwear' },
  ],
  photography: [
    { name: 'mirrorless', description: 'Mirrorless camera bodies' },
    { name: 'lenses', description: 'Camera lenses (prime, zoom, specialty)' },
    { name: 'drones', description: 'Camera drones and accessories' },
    { name: 'action-cameras', description: 'Action cameras and 360 cameras' },
    { name: 'lighting', description: 'Lighting equipment and flashes' },
    { name: 'accessories', description: 'Tripods, gimbals, bags, and straps' },
  ],
  gaming: [
    { name: 'consoles', description: 'Gaming consoles and handhelds' },
    { name: 'controllers', description: 'Game controllers and fight sticks' },
    { name: 'headsets', description: 'Gaming headsets and audio' },
    { name: 'keyboards', description: 'Gaming keyboards (mechanical, membrane)' },
    { name: 'mice', description: 'Gaming mice and mousepads' },
    { name: 'streaming', description: 'Streaming equipment (capture cards, microphones, lights)' },
  ],
  music: [
    { name: 'guitars', description: 'Electric and acoustic guitars' },
    { name: 'keyboards', description: 'Keyboards, synths, and digital pianos' },
    { name: 'microphones', description: 'Studio and live microphones' },
    { name: 'headphones', description: 'Studio headphones and monitors' },
    { name: 'dj-equipment', description: 'DJ controllers, mixers, and turntables' },
    { name: 'drums', description: 'Drums, electronic drum kits, and percussion' },
  ],
  fitness: [
    { name: 'cardio', description: 'Treadmills, bikes, rowers, and ellipticals' },
    { name: 'strength', description: 'Weights, racks, benches, and barbells' },
    { name: 'recovery', description: 'Massage guns, foam rollers, and recovery tools' },
    { name: 'wearables', description: 'Fitness trackers and smartwatches' },
    { name: 'yoga', description: 'Yoga mats, blocks, and accessories' },
    { name: 'accessories', description: 'Resistance bands, jump ropes, and kettlebells' },
  ],
  travel: [
    { name: 'carry-on', description: 'Carry-on luggage and cabin bags' },
    { name: 'checked', description: 'Checked luggage and large suitcases' },
    { name: 'backpacks', description: 'Travel backpacks and laptop bags' },
    { name: 'weekenders', description: 'Duffel bags and weekender bags' },
    { name: 'accessories', description: 'Packing cubes, organizers, and travel accessories' },
    { name: 'tech-organizers', description: 'Tech pouches and cable organizers' },
  ],
  edc: [
    { name: 'folding-knives', description: 'Folding pocket knives' },
    { name: 'multitools', description: 'Multi-tools and Swiss Army knives' },
    { name: 'flashlights', description: 'EDC flashlights and keychain lights' },
    { name: 'wallets', description: 'Wallets, cardholders, and money clips' },
    { name: 'pens', description: 'EDC pens and tactical pens' },
    { name: 'watches', description: 'EDC watches (field, dive, tactical)' },
  ],
};

/**
 * Collect products by subcategory for comprehensive results (multi-pass collection)
 * This queries each subcategory separately to get more comprehensive results than a single pass
 */
async function collectBrandProductsBySubcategory(
  category: Category,
  brandName: string,
  config: { provider: AIProvider; model: string; maxTokens: number; temperature: number }
): Promise<CollectionResult> {
  const startTime = Date.now();
  const allProducts: Product[] = [];
  let totalTokens = 0;

  const subcategories = CATEGORY_SUBCATEGORIES[category] || [];
  const retailers = BULK_RETAILERS[category] || [];
  const retailerList = retailers.length > 0 ? retailers.map(r => `- ${r}`).join('\n') : 'Major retailers and brand official site';

  console.log(`[AIClient] Collecting ${brandName} (${category}) products by subcategory...`);

  if (subcategories.length === 0) {
    console.log(`[AIClient] No subcategories defined for ${category}, skipping subcategory collection`);
    return { products: [], tokensUsed: 0, duration: Date.now() - startTime, provider: config.provider, model: config.model };
  }

  for (const subcategory of subcategories) {
    console.log(`[AIClient]   → ${subcategory.name}...`);

    const systemPrompt = `You are a ${category} product specialist with encyclopedic knowledge of ${brandName} products.

TASK: List ALL ${brandName} ${subcategory.description} released from 2019-2024.

REFERENCE SOURCES (retailers with extensive databases):
${retailerList}

SCOPE - BE EXHAUSTIVE:
- EVERY model released from 2019-2024
- Include all generations and iterations
- Include Pro/Premium versions, standard versions, and entry-level versions
- Include limited editions and special colorways
- Include models that are discontinued but still commonly found

OUTPUT: Valid JSON only (no markdown, no explanations):
{
  "products": [
    {
      "id": "brand-model-year-slug",
      "name": "Full Model Name",
      "brand": "${brandName}",
      "category": "${category}",
      "subcategory": "${subcategory.name}",
      "releaseYear": 2023,
      "msrp": 299,
      "visualSignature": {
        "primaryColors": ["black", "white"],
        "secondaryColors": ["silver"],
        "colorwayName": "Standard",
        "patterns": ["solid"],
        "finish": "matte",
        "designCues": ["signature design elements"],
        "distinguishingFeatures": ["unique visual identifiers"],
        "logoPlacement": "where logo appears"
      },
      "specifications": {},
      "modelNumber": "MODEL123",
      "variants": [
        {"sku": "variant-sku", "variantName": "Variant Name", "colorway": "Color", "availability": "current"}
      ],
      "searchKeywords": ["keywords"],
      "aliases": ["nicknames"],
      "source": "ai",
      "dataConfidence": 85
    }
  ]
}

TARGET: 5-15+ ${subcategory.name} from ${brandName} (2019-2024)`;

    const userPrompt = `List every ${brandName} ${subcategory.description} model from 2019-2024. Include every generation, every variant, and every colorway. Be thorough and comprehensive.`;

    try {
      const response = await retryWithBackoff(async () => {
        if (config.provider === 'openai') {
          const client = getOpenAIClient();
          const result = await client.chat.completions.create({
            model: config.model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
            max_tokens: config.maxTokens,
            temperature: config.temperature,
            response_format: { type: 'json_object' },
          });

          totalTokens += result.usage?.total_tokens || 0;
          return result.choices[0]?.message?.content || '';
        } else {
          const client = getAnthropicClient();
          const result = await client.messages.create({
            model: config.model,
            max_tokens: config.maxTokens,
            temperature: config.temperature,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
          });

          totalTokens += (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0);
          const content = result.content[0];
          if (content.type !== 'text') {
            throw new Error('Unexpected response type from Anthropic');
          }
          return content.text;
        }
      });

      const rawProducts = parseProductResponse(response);
      const validProducts = validateProducts(rawProducts);

      // Set subcategory for all products
      for (const product of validProducts) {
        product.subcategory = subcategory.name;
      }

      allProducts.push(...validProducts);
      console.log(`[AIClient]   → ${subcategory.name}: ${validProducts.length} products`);

      // Small delay between subcategory calls to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`[AIClient]   → ${subcategory.name}: Failed -`, error);
    }
  }

  const duration = Date.now() - startTime;
  console.log(`[AIClient] Collected ${allProducts.length} total products for ${brandName} (${category}) in ${Math.round(duration / 1000)}s`);

  return {
    products: allProducts,
    tokensUsed: totalTokens,
    duration,
    provider: config.provider,
    model: config.model,
  };
}

/**
 * Collect products for a brand using the specified AI provider
 * Uses multi-pass collection by subcategory for comprehensive results across all categories
 */
export async function collectBrandProducts(
  category: Category,
  brandName: string,
  config: Partial<AIClientConfig> = {}
): Promise<CollectionResult> {
  const startTime = Date.now();
  const provider = config.provider || 'openai';
  const defaults = PROVIDER_DEFAULTS[provider];
  const model = config.model || defaults.model;
  const maxTokens = config.maxTokens || defaults.maxTokens;
  const temperature = config.temperature || defaults.temperature;

  // Use multi-pass collection by subcategory for comprehensive results
  // This applies to ALL categories now, not just golf
  if (CATEGORY_SUBCATEGORIES[category]) {
    return collectBrandProductsBySubcategory(category, brandName, { provider, model, maxTokens, temperature });
  }

  // Build brand config for prompt generation
  const brandConfig: BrandAgentConfig = {
    brandName,
    category,
    productLines: [], // Will be inferred by AI
    yearRange: { min: 2019, max: 2024 },
  };

  const prompt = generateBrandAgentPrompt(brandConfig);

  // Get bulk retailers for this category
  const retailers = BULK_RETAILERS[category] || [];
  const retailerList = retailers.length > 0
    ? `\n\nREFERENCE SOURCES (these retailers have extensive product databases):\n${retailers.map(r => `- ${r}`).join('\n')}`
    : '';

  const systemPrompt = `You are a product research specialist with EXHAUSTIVE knowledge of ${category} products and brands.

Your task is to compile a COMPREHENSIVE product catalog for ${brandName} - EVERY MODEL from the past 6 years.

SCOPE - BE EXHAUSTIVE:
- Include EVERY model released from 2019-2024
- Include ALL product lines (not just flagship products)
- Include discontinued models that are still commonly found on resale sites
- Include limited editions and special releases
- Think like a bulk retailer cataloging their entire inventory
${retailerList}

CRITICAL REQUIREMENTS:
1. Output ONLY valid JSON - no markdown, no explanations, no code blocks
2. Return a JSON object with this exact structure:
{
  "products": [
    {
      "id": "unique-slug-id",
      "name": "Product Name",
      "brand": "${brandName}",
      "category": "${category}",
      "subcategory": "subcategory-name",
      "releaseYear": 2024,
      "msrp": 499,
      "visualSignature": {
        "primaryColors": ["color1", "color2"],
        "secondaryColors": ["accent1"],
        "colorwayName": "Official Colorway Name",
        "patterns": ["solid"],
        "finish": "matte",
        "designCues": ["design element 1", "design element 2"],
        "distinguishingFeatures": ["unique feature 1", "unique feature 2"],
        "logoPlacement": "where logo appears"
      },
      "referenceImages": {
        "primary": "image-url"
      },
      "specifications": {
        "key": "value"
      },
      "modelNumber": "official-model-number",
      "variants": [
        {
          "sku": "product-code",
          "variantName": "Variant description",
          "specifications": {},
          "colorway": "Colorway name",
          "availability": "current"
        }
      ],
      "searchKeywords": ["keyword1", "keyword2"],
      "aliases": ["alt name", "nickname"],
      "productUrl": "product-page-url",
      "description": "Brief description",
      "features": ["feature1", "feature2"],
      "source": "ai",
      "dataConfidence": 85
    }
  ]
}

TARGET: 30-50+ products covering ALL product lines from 2019-2024
- Include entry-level, mid-range, and premium products
- Each product should list ALL known colorways/variants
- Visual signatures are CRITICAL for photo identification - be extremely detailed
- Include model numbers, SKUs, and any common nicknames/aliases
- Be accurate with release years, original MSRP, and specifications

THINK COMPREHENSIVELY: If you were cataloging every ${brandName} item that Second Swing or a similar bulk retailer might have in stock, what would you include?`;

  let tokensUsed = 0;

  console.log(`[AIClient] Collecting ${brandName} (${category}) via ${provider}...`);

  const response = await retryWithBackoff(async () => {
    if (provider === 'openai') {
      const client = getOpenAIClient();
      const result = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: prompt },
        ],
        max_tokens: maxTokens,
        temperature,
        response_format: { type: 'json_object' },
      });

      tokensUsed = result.usage?.total_tokens || 0;
      return result.choices[0]?.message?.content || '';
    } else {
      const client = getAnthropicClient();
      const result = await client.messages.create({
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemPrompt,
        messages: [{ role: 'user', content: prompt }],
      });

      tokensUsed =
        (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0);
      const content = result.content[0];
      if (content.type !== 'text') {
        throw new Error('Unexpected response type from Anthropic');
      }
      return content.text;
    }
  });

  // Parse and validate
  const rawProducts = parseProductResponse(response);
  const products = validateProducts(rawProducts);

  const duration = Date.now() - startTime;
  console.log(
    `[AIClient] Collected ${products.length} products for ${brandName} in ${Math.round(duration / 1000)}s`
  );

  return {
    products,
    tokensUsed,
    duration,
    provider,
    model,
  };
}

/**
 * Test connection to AI provider
 */
export async function testConnection(provider: AIProvider): Promise<boolean> {
  try {
    if (provider === 'openai') {
      const client = getOpenAIClient();
      await client.models.list();
      return true;
    } else {
      const client = getAnthropicClient();
      // Simple test request
      await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }],
      });
      return true;
    }
  } catch (error) {
    console.error(`[AIClient] Connection test failed for ${provider}:`, error);
    return false;
  }
}
