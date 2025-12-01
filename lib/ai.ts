import { openai } from './openaiClient';
import { generateBrandContext, loadCategoryKnowledge } from './brandKnowledge';
import {
  generateProductLibraryContext,
  matchAgainstLibrary,
  type LibraryMatchResult,
} from './productLibrary/integration';
import type { Category } from './productLibrary/schema';

/**
 * Best Practice: Define TypeScript interfaces for all AI responses
 */
/**
 * Structured color information for products
 */
export interface ProductColors {
  primary: string;           // Main/dominant color (e.g., "Stealth Black", "Navy Blue")
  secondary?: string;        // Second most prominent color
  accent?: string;           // Trim, highlights, small details
  finish?: 'matte' | 'glossy' | 'metallic' | 'satin' | 'textured' | 'brushed';
  colorway?: string;         // Official brand colorway name if known (e.g., "Qi10 Blue")
}

/**
 * Pattern recognition for products
 */
export interface ProductPattern {
  type: 'solid' | 'striped' | 'plaid' | 'camo' | 'gradient' | 'geometric' |
        'chevron' | 'heathered' | 'carbon-weave' | 'checkered' | 'floral' | 'other';
  location: 'all-over' | 'accent' | 'trim' | 'crown-only' | 'partial' | 'sole-only';
  description?: string;      // Additional pattern details if unusual
}

/**
 * Visual brand signature detection (beyond text recognition)
 */
export interface BrandSignature {
  signatureColors?: string[];    // Brand's signature color palette detected
  logoShape?: string;            // Logo shape description even if text unreadable
  designCues: string[];          // Visual elements that identify the brand
  visualConfidence: number;      // 0-100 confidence based on visual cues ONLY
}

/**
 * Stage 1: Category detection result (fast, cheap)
 */
export interface CategoryDetectionResult {
  categories: Array<{
    category: 'golf' | 'tech' | 'outdoor' | 'fashion' | 'camping' | 'sports' | 'electronics' | 'other';
    objectCount: number;
    confidence: number;
  }>;
  totalObjects: number;
  processingTimeMs: number;
}

export interface IdentifiedProduct {
  name: string; // MUST be specific model/product name, not generic
  brand?: string;
  category: string;
  confidence: number; // 0-100
  estimatedPrice?: string;
  color?: string;              // Simple color string (kept for backwards compatibility)
  colors?: ProductColors;      // NEW: Structured color information
  pattern?: ProductPattern;    // NEW: Pattern recognition
  brandSignature?: BrandSignature; // NEW: Visual brand cues
  specifications?: string[];
  modelNumber?: string; // Specific model/SKU if visible
  productImage?: { // Fetched from Google Custom Search
    imageUrl: string;
    thumbnailUrl: string;
    source: string;
  };
  alternatives?: Array<{ // Alternative identifications when confidence < 70
    name: string;
    brand?: string;
    confidence: number;
    reason: string;
  }>;
  sourceImageIndex?: number; // Index of the source image this product was identified from (for bulk uploads)
}

export interface VisionAnalysisResult {
  products: IdentifiedProduct[];
  totalConfidence: number;
  processingTime: number;
  warnings?: string[];
}

/**
 * Best Practice: Retry logic with exponential backoff for rate limits
 */
async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  maxRetries = 3,
  baseDelay = 1000
): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      // Don't retry on certain errors
      if (error?.status === 400 || error?.status === 401) {
        throw error;
      }

      // Check if rate limited
      if (error?.status === 429 || error?.code === 'rate_limit_exceeded') {
        const delay = baseDelay * Math.pow(2, i);
        console.log(`Rate limited, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }

      // Last attempt, throw error
      if (i === maxRetries - 1) {
        throw error;
      }

      // General retry with backoff
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

/**
 * Best Practice: Image compression and validation before sending to API
 */
export function validateAndCompressImage(base64Image: string): {
  valid: boolean;
  compressed?: string;
  error?: string;
  sizeKB: number;
} {
  try {
    // Check if valid data URL (handle various formats from mobile browsers)
    if (!base64Image || typeof base64Image !== 'string') {
      return { valid: false, error: 'Invalid image data', sizeKB: 0 };
    }

    // Accept data URLs starting with data:image/ (handles jpeg, png, heic, webp, etc)
    if (!base64Image.startsWith('data:image/')) {
      return { valid: false, error: 'Invalid image format', sizeKB: 0 };
    }

    // Calculate size - safely extract base64 portion
    const commaIndex = base64Image.indexOf(',');
    if (commaIndex === -1) {
      return { valid: false, error: 'Malformed data URL', sizeKB: 0 };
    }

    const base64Data = base64Image.substring(commaIndex + 1);
    if (!base64Data || base64Data.length === 0) {
      return { valid: false, error: 'Empty image data', sizeKB: 0 };
    }

    // Remove whitespace for accurate size calculation (mobile Safari adds newlines)
    const cleanBase64 = base64Data.replace(/\s/g, '');
    const sizeKB = Math.round((cleanBase64.length * 3) / 4 / 1024);

    // OpenAI limit is 20MB, we allow up to 10MB for high quality photos
    if (sizeKB > 10240) {
      return {
        valid: false,
        error: `Image too large: ${sizeKB}KB. Please compress to under 10MB.`,
        sizeKB,
      };
    }

    return { valid: true, compressed: base64Image, sizeKB };
  } catch (error) {
    console.error('Image validation error:', error);
    return { valid: false, error: 'Failed to process image', sizeKB: 0 };
  }
}

/**
 * STAGE 1: Quick Category Detection using gpt-4o-mini
 *
 * Fast, cheap scan to identify product categories before detailed analysis.
 * Uses ~$0.001 per image vs ~$0.01 for full gpt-4o analysis.
 *
 * @param imageBase64 - Base64 encoded image
 * @returns Categories detected with counts and confidence
 */
export async function detectCategories(
  imageBase64: string
): Promise<CategoryDetectionResult> {
  const startTime = Date.now();

  // Validate image first
  const validation = validateAndCompressImage(imageBase64);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid image');
  }

  const systemPrompt = `You are a fast product category scanner. Quickly identify what TYPES of products are in the image.

Return JSON with this exact structure:
{
  "categories": [
    { "category": "golf", "objectCount": 5, "confidence": 90 },
    { "category": "fashion", "objectCount": 2, "confidence": 85 }
  ],
  "totalObjects": 7
}

Category options: golf, tech, outdoor, fashion, camping, sports, electronics, other

Rules:
- Be FAST - don't analyze details, just identify categories
- Count approximate objects per category
- Confidence 0-100 for category identification certainty
- Only list categories that have items present`;

  try {
    const response = await retryWithBackoff(async () => {
      return await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Fast and cheap for category detection
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              { type: 'text', text: 'Quickly scan and categorize the products in this image.' },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64,
                  detail: 'low', // Low detail for speed - we just need categories
                },
              },
            ],
          },
        ],
        max_tokens: 300,
        temperature: 0.1, // Very low for consistency
        response_format: { type: 'json_object' },
      });
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from category detection');
    }

    const parsed = JSON.parse(content);
    const processingTimeMs = Date.now() - startTime;

    console.log(`[Stage 1] Category detection completed in ${processingTimeMs}ms:`, parsed.categories);

    return {
      categories: (parsed.categories || []).map((c: any) => ({
        category: c.category || 'other',
        objectCount: c.objectCount || 1,
        confidence: Math.min(100, Math.max(0, c.confidence || 50)),
      })),
      totalObjects: parsed.totalObjects || 0,
      processingTimeMs,
    };
  } catch (error: any) {
    console.error('[Stage 1] Category detection failed:', error.message);
    // Return empty result on error - Stage 2 will proceed without brand context
    return {
      categories: [],
      totalObjects: 0,
      processingTimeMs: Date.now() - startTime,
    };
  }
}

/**
 * Best Practice: Structured prompt engineering for consistent results
 * Two-Stage Product Identification:
 * - Stage 1: Quick category detection with gpt-4o-mini
 * - Stage 2: Detailed identification with category-specific brand knowledge
 */
export async function identifyProductsInImage(
  imageBase64: string,
  context?: {
    bagType?: string;
    expectedCategories?: string[];
    focusCategories?: string[];
    skipCategoryDetection?: boolean;
    useProductLibrary?: boolean;
    validateAgainstLibrary?: boolean;
  }
): Promise<VisionAnalysisResult & { libraryMatches?: LibraryMatchResult[] }> {
  const startTime = Date.now();

  // Best Practice: Validate input before expensive API call
  const validation = validateAndCompressImage(imageBase64);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid image');
  }

  // === STAGE 1: Quick Category Detection ===
  let brandContext = '';
  let detectedCategories: string[] = [];

  if (!context?.skipCategoryDetection) {
    try {
      const categoryResult = await detectCategories(imageBase64);
      detectedCategories = categoryResult.categories.map(c => c.category);

      // Load brand knowledge for detected categories
      if (detectedCategories.length > 0) {
        brandContext = generateBrandContext(detectedCategories, 'standard');
        console.log(`[Stage 2] Loaded brand knowledge for: ${detectedCategories.join(', ')}`);

        // Also load product library context if enabled
        if (context?.useProductLibrary) {
          const libraryCategories = detectedCategories.filter(
            (c): c is Category =>
              ['golf', 'tech', 'fashion', 'makeup', 'outdoor', 'photography', 'gaming', 'music', 'fitness', 'travel', 'edc'].includes(c)
          );
          if (libraryCategories.length > 0) {
            const libraryContext = generateProductLibraryContext(libraryCategories, {
              maxProductsPerCategory: 15,
              includeVariants: false,
            });
            if (libraryContext.productContext) {
              brandContext += '\n' + libraryContext.productContext;
              console.log(`[Stage 2] Added ${libraryContext.productCount} products from library`);
            }
          }
        }
      }
    } catch (error) {
      console.warn('[Stage 1] Category detection failed, proceeding without brand context:', error);
    }
  }

  // === STAGE 2: Detailed Product Identification ===
  // Build system prompt with optional brand context
  const systemPrompt = `You are an expert product identifier with deep knowledge of specific product models, brands, and SKUs.
${brandContext}
═══════════════════════════════════════════════════════════════
IDENTIFICATION REQUIREMENTS
═══════════════════════════════════════════════════════════════

CRITICAL RULES:
1. IDENTIFY EVERY PRODUCT VISIBLE - If there are 20+ items, list them ALL. No limits.
2. BE HYPER-SPECIFIC - Never use generic names like "Driver", "Golf Bag", "Tent"
3. Include EXACT model names like "TaylorMade Qi10 Max Driver", "Callaway Paradym Ai Smoke Driver"
4. Include model numbers/SKUs when visible (e.g., "M2 2017", "Apex DCB 21")
5. For products where you're unsure, provide alternatives with reasoning
6. SPECIFICITY IS EVERYTHING - generic names are useless

═══════════════════════════════════════════════════════════════
COLOR & PATTERN IDENTIFICATION (CRITICAL)
═══════════════════════════════════════════════════════════════

For EVERY product, you MUST provide detailed visual attributes:

COLOR IDENTIFICATION:
- Primary: The dominant/main color (use brand-specific terms from knowledge base if available)
- Secondary: Second most prominent color (if applicable)
- Accent: Trim, highlights, small details (if applicable)
- Finish: matte, glossy, metallic, satin, textured, or brushed
- Colorway: Official brand colorway name if recognizable (e.g., "Qi10 Blue", "Stealth Carbon")

PATTERN IDENTIFICATION:
- Type: solid, striped, plaid, camo, gradient, geometric, chevron, heathered, carbon-weave, checkered, floral, or other
- Location: all-over, accent, trim, crown-only, partial, or sole-only
- Description: Any additional pattern details

BRAND SIGNATURE (for visual brand identification):
- Even if text is unreadable, identify brands by visual cues
- Note logo shapes, design elements, signature colorways
- Rate your visual confidence separately (0-100)

═══════════════════════════════════════════════════════════════
CONFIDENCE SCORING (BE CONSERVATIVE)
═══════════════════════════════════════════════════════════════
- 90-100: CLEAR branding, model text/numbers, distinctive design features visible
- 70-89: Brand is clear but model is inferred from visual features
- 50-69: Can identify general product type but brand/model uncertain
- 30-49: Can only make educated guess based on shape/color
- <30: Very uncertain, minimal visible details

IMPORTANT: If you can't read text/logos clearly, DO NOT give high confidence.
Better to say 60% confidence with alternatives than falsely claim 95% certainty.

═══════════════════════════════════════════════════════════════
EXAMPLES
═══════════════════════════════════════════════════════════════
GOOD:
✅ "TaylorMade Qi10 Max Driver" with colors: { primary: "Qi Blue", secondary: "Carbon Black", finish: "metallic" }
✅ "Titleist TSR2 Driver" with brandSignature: { signatureColors: ["black", "gold"], logoShape: "eagle silhouette", designCues: ["brushed black finish", "gold accents"], visualConfidence: 85 }

BAD (NEVER DO THIS):
❌ "Driver" - too generic
❌ "Golf Club" - missing brand and model
❌ color: "blue" - too vague, use specific terms

═══════════════════════════════════════════════════════════════
JSON OUTPUT FORMAT
═══════════════════════════════════════════════════════════════
Return your response as valid JSON:
{
  "products": [
    {
      "name": "Specific Product Name with Model",
      "brand": "Brand name",
      "category": "camping|golf|hiking|travel|sports|electronics|clothing|other",
      "confidence": 85,
      "modelNumber": "Model/SKU if visible",
      "estimatedPrice": "$XX-XX range",
      "color": "Primary color (simple string for backwards compatibility)",
      "colors": {
        "primary": "Main color with brand terminology",
        "secondary": "Second color if present",
        "accent": "Trim/detail color if present",
        "finish": "matte|glossy|metallic|satin|textured|brushed",
        "colorway": "Official colorway name if known"
      },
      "pattern": {
        "type": "solid|striped|plaid|camo|gradient|geometric|chevron|heathered|carbon-weave|checkered|floral|other",
        "location": "all-over|accent|trim|crown-only|partial|sole-only",
        "description": "Additional pattern details"
      },
      "brandSignature": {
        "signatureColors": ["brand's signature colors detected"],
        "logoShape": "Description of logo shape if visible",
        "designCues": ["Visual elements that identify the brand"],
        "visualConfidence": 75
      },
      "specifications": ["spec1", "spec2"],
      "alternatives": [
        {
          "name": "Alternative Product Name",
          "brand": "Brand",
          "confidence": 60,
          "reason": "Why this could be the product"
        }
      ]
    }
  ]
}

Include "alternatives" only when confidence < 70. Always include "colors" and "brandSignature".`;

  let userPrompt = '';

  if (context?.focusCategories && context.focusCategories.length > 0) {
    // Video/category filtering mode
    userPrompt = `Identify ONLY products in these categories: ${context.focusCategories.join(', ')}.

IGNORE all other items (furniture, backgrounds, unrelated objects).
FIND EVERY product that matches the focus categories - list them ALL.

For each matching product:
- Read any visible text/logos carefully
- Identify specific brand and model
- Include detailed specifications using the format standards
- Never use generic names`;
  } else if (context?.bagType) {
    // Bag context mode
    userPrompt = `Identify ALL products in this image with MAXIMUM SPECIFICITY. Include exact model names, not generic descriptions.

Context: This is for a ${context.bagType} bag.${
        context.expectedCategories
          ? ` Expected categories: ${context.expectedCategories.join(', ')}`
          : ''
      }

For each product:
- Read any visible text/logos carefully
- Identify specific model/version
- If unsure between models, provide alternatives
- Never settle for generic names
- Find EVERY product visible - no matter how many`;
  } else {
    // Default mode
    userPrompt = `Identify ALL products visible in this image with MAXIMUM SPECIFICITY.

Requirements:
- Find EVERY product in the image, even if there are 20+ items
- Include exact model names and numbers
- Read all visible text on products
- If you can't determine the exact model, provide your best alternatives
- Never use generic names like "club" or "bag" - be specific`;
  }

  try {
    // Best Practice: Use retry logic for reliability
    const response = await retryWithBackoff(async () => {
      return await openai.chat.completions.create({
        model: 'gpt-4o', // Best practice: Use latest vision model
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: userPrompt,
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageBase64,
                  detail: 'high', // Best practice: Use 'high' for product identification
                },
              },
            ],
          },
        ],
        max_tokens: 4096, // Maximized to find ALL products in image, even 20+ items
        temperature: 0.2, // Very low for maximum consistency and specificity
        response_format: { type: 'json_object' }, // Best practice: Force JSON output
      });
    });

    const content = response.choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from AI');
    }

    // Best Practice: Validate and parse JSON response with error handling
    let parsed: { products: IdentifiedProduct[] };
    try {
      parsed = JSON.parse(content);
    } catch (parseError) {
      console.error('Failed to parse AI response:', content);
      throw new Error('AI returned invalid JSON. Please try again.');
    }

    // Best Practice: Validate response structure
    if (!parsed.products || !Array.isArray(parsed.products)) {
      throw new Error('Invalid response structure from AI');
    }

    // Best Practice: Sanitize and validate each product
    const products: IdentifiedProduct[] = parsed.products.map((p: any) => ({
      name: p.name || 'Unknown Product',
      brand: p.brand || undefined,
      category: p.category || 'other',
      confidence: Math.min(100, Math.max(0, p.confidence || 50)),
      estimatedPrice: p.estimatedPrice,
      color: p.color,
      // NEW: Structured color information
      colors: p.colors ? {
        primary: p.colors.primary || p.color || undefined,
        secondary: p.colors.secondary || undefined,
        accent: p.colors.accent || undefined,
        finish: ['matte', 'glossy', 'metallic', 'satin', 'textured', 'brushed'].includes(p.colors.finish)
          ? p.colors.finish
          : undefined,
        colorway: p.colors.colorway || undefined,
      } : undefined,
      // NEW: Pattern recognition
      pattern: p.pattern ? {
        type: p.pattern.type || 'solid',
        location: p.pattern.location || 'all-over',
        description: p.pattern.description || undefined,
      } : undefined,
      // NEW: Brand signature for visual identification
      brandSignature: p.brandSignature ? {
        signatureColors: p.brandSignature.signatureColors || [],
        logoShape: p.brandSignature.logoShape || undefined,
        designCues: p.brandSignature.designCues || [],
        visualConfidence: Math.min(100, Math.max(0, p.brandSignature.visualConfidence || 50)),
      } : undefined,
      specifications: p.specifications,
      modelNumber: p.modelNumber,
      alternatives: p.alternatives?.map((alt: any) => ({
        name: alt.name || 'Unknown',
        brand: alt.brand,
        confidence: Math.min(100, Math.max(0, alt.confidence || 50)),
        reason: alt.reason || 'Alternative identification',
      })),
    }));

    // Best Practice: Fetch product images in parallel for better performance
    const productsWithImages = await Promise.all(
      products.map(async (product) => {
        const productImage = await fetchProductImage(product.name, product.brand);
        return {
          ...product,
          productImage: productImage || undefined,
        };
      })
    );

    const processingTime = Date.now() - startTime;
    const totalConfidence =
      productsWithImages.length > 0
        ? Math.round(productsWithImages.reduce((sum, p) => sum + p.confidence, 0) / productsWithImages.length)
        : 0;

    const warnings: string[] = [];
    if (productsWithImages.length === 0) {
      warnings.push('No products identified in image');
    }
    if (totalConfidence < 50) {
      warnings.push('Low confidence in identification results');
    }
    if (validation.sizeKB > 1024) {
      warnings.push(`Large image (${validation.sizeKB}KB) - consider compressing`);
    }

    // Optional: Validate against product library
    let libraryMatches: LibraryMatchResult[] | undefined;
    if (context?.validateAgainstLibrary && productsWithImages.length > 0) {
      try {
        libraryMatches = matchAgainstLibrary(productsWithImages, {
          confidenceThreshold: 60,
          autoCorrect: true,
        });
        const validatedCount = libraryMatches.filter(m => m.validated).length;
        console.log(`[Library] Validated ${validatedCount}/${productsWithImages.length} products against catalog`);
      } catch (error) {
        console.warn('[Library] Validation failed:', error);
      }
    }

    return {
      products: productsWithImages,
      totalConfidence,
      processingTime,
      warnings: warnings.length > 0 ? warnings : undefined,
      libraryMatches,
    };
  } catch (error: any) {
    // Best Practice: Detailed error logging for debugging
    console.error('Vision API error:', {
      message: error.message,
      status: error?.status,
      code: error?.code,
      type: error?.type,
    });

    // Best Practice: User-friendly error messages
    if (error?.status === 401) {
      throw new Error('OpenAI API key is invalid');
    }
    if (error?.status === 429) {
      throw new Error('Rate limit exceeded. Please try again in a moment.');
    }
    if (error?.status === 400) {
      throw new Error('Invalid image format or size');
    }

    throw new Error(`Failed to identify products: ${error.message}`);
  }
}

/**
 * Fetch product image from Google Custom Search API
 *
 * Best Practice: Cache results to minimize API calls (100 free/day, then $5/1000)
 */
export async function fetchProductImage(
  productName: string,
  brand?: string
): Promise<{ imageUrl: string; thumbnailUrl: string; source: string } | null> {
  try {
    const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
    const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

    if (!apiKey || !searchEngineId) {
      console.warn('Google Custom Search API not configured. Skipping image fetch.');
      return null;
    }

    // Construct search query with brand for better results
    const query = brand ? `${brand} ${productName}` : productName;

    // Best Practice: Use specific search parameters for product images
    const searchParams = new URLSearchParams({
      key: apiKey,
      cx: searchEngineId,
      q: query,
      searchType: 'image',
      num: '3', // Get top 3 results
      imgSize: 'medium', // Medium size images
      imgType: 'photo', // Only photos, not clipart
      safe: 'active', // Family-safe results
      fileType: 'jpg,png', // Only JPG/PNG
    });

    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?${searchParams.toString()}`
    );

    if (!response.ok) {
      const error = await response.json();
      console.error('Google Image Search error:', error);

      // Best Practice: Handle quota exceeded gracefully
      if (response.status === 429) {
        console.warn('Google Image Search quota exceeded');
      }
      return null;
    }

    const data = await response.json();

    // Best Practice: Validate response structure
    if (!data.items || data.items.length === 0) {
      console.log(`No images found for: ${query}`);
      return null;
    }

    // Return the first (best) result
    const firstImage = data.items[0];
    return {
      imageUrl: firstImage.link,
      thumbnailUrl: firstImage.image?.thumbnailLink || firstImage.link,
      source: firstImage.displayLink || 'Unknown',
    };

  } catch (error: any) {
    console.error('Failed to fetch product image:', error.message);
    return null;
  }
}

/**
 * Generate a description for an item based on its name and optional URL.
 */
export async function generateItemDescription(input: {
  name: string;
  url?: string;
}): Promise<string> {
  const prompt = `Generate a brief description for the following item: ${input.name}${
    input.url ? ` (URL: ${input.url})` : ''
  }`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 200,
  });

  return response.choices[0]?.message?.content || '';
}

/**
 * Summarize a container with its items.
 */
export async function summarizeContainer(input: {
  name: string;
  items: { name: string; brand?: string }[];
}): Promise<string> {
  const itemsList = input.items
    .map((item) => `- ${item.name}${item.brand ? ` (${item.brand})` : ''}`)
    .join('\n');

  const prompt = `Summarize the following container "${input.name}" and its items:\n\n${itemsList}`;

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [
      {
        role: 'user',
        content: prompt,
      },
    ],
    max_tokens: 300,
  });

  return response.choices[0]?.message?.content || '';
}

/**
 * Best Practice: TypeScript interfaces for bag category AI responses
 */
export interface BagCategoryResult {
  category: string;
  confidence: number;
  alternativeCategories?: string[];
  reasoning?: string;
}

export interface ItemRecommendation {
  name: string;
  category: string;
  priority: 'essential' | 'recommended' | 'optional';
  reason: string;
  estimatedPrice?: string;
}

export interface BagRecommendationsResult {
  category: string;
  items: ItemRecommendation[];
  totalRecommendations: number;
}

/**
 * Identify bag category/type from title and description using AI
 * Best Practice: Use AI to auto-categorize bags for better organization
 */
export async function identifyBagCategory(input: {
  title: string;
  description?: string;
}): Promise<BagCategoryResult> {
  const systemPrompt = `You are an expert at categorizing gear and equipment bags.
Analyze the bag title and description, then return a JSON response with this structure:
{
  "category": "One of: camping, hiking, golf, travel, sports, backpacking, photography, fishing, cycling, climbing, emergency, other",
  "confidence": 85,
  "alternativeCategories": ["category2", "category3"],
  "reasoning": "Brief explanation"
}`;

  const userPrompt = `Categorize this bag:
Title: "${input.title}"
${input.description ? `Description: "${input.description}"` : ''}

What type of bag is this?`;

  try {
    const response = await retryWithBackoff(async () => {
      return await openai.chat.completions.create({
        model: 'gpt-4o-mini', // Cost-effective for simple categorization
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        max_tokens: 300,
        temperature: 0.3,
        response_format: { type: 'json_object' },
      });
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const parsed: BagCategoryResult = JSON.parse(content);

    // Validate and sanitize
    return {
      category: parsed.category || 'other',
      confidence: Math.min(100, Math.max(0, parsed.confidence || 50)),
      alternativeCategories: parsed.alternativeCategories,
      reasoning: parsed.reasoning,
    };
  } catch (error: any) {
    console.error('Category identification error:', error.message);
    // Return default category on error
    return {
      category: 'other',
      confidence: 0,
      reasoning: 'Failed to identify category',
    };
  }
}

/**
 * Generate recommended items for a bag based on its category and description
 * Best Practice: Use AI to help users quickly populate their bags
 */
export async function recommendItemsForBag(input: {
  bagTitle: string;
  bagDescription?: string;
  bagCategory?: string;
  maxRecommendations?: number;
}): Promise<BagRecommendationsResult> {
  const maxItems = input.maxRecommendations || 10;

  // If no category provided, identify it first
  let category = input.bagCategory;
  if (!category || category === 'other') {
    const categoryResult = await identifyBagCategory({
      title: input.bagTitle,
      description: input.bagDescription,
    });
    category = categoryResult.category;
  }

  const systemPrompt = `You are an expert gear advisor. Recommend essential items for different types of bags/kits.
Return a JSON response with this structure:
{
  "category": "bag category",
  "items": [
    {
      "name": "Item name",
      "category": "item category",
      "priority": "essential|recommended|optional",
      "reason": "Why this item is important",
      "estimatedPrice": "$XX-XX range (optional)"
    }
  ]
}

Focus on practical, commonly needed items. Prioritize essentials first.`;

  const userPrompt = `Recommend ${maxItems} items for this bag:
Title: "${input.bagTitle}"
${input.bagDescription ? `Description: "${input.bagDescription}"` : ''}
Category: ${category}

What items should be included? Prioritize essential items first.`;

  try {
    const response = await retryWithBackoff(async () => {
      return await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
        max_tokens: 1500,
        temperature: 0.5, // Slightly higher for creative recommendations
        response_format: { type: 'json_object' },
      });
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const parsed: { category: string; items: ItemRecommendation[] } = JSON.parse(content);

    // Validate and sanitize items
    const items: ItemRecommendation[] = (parsed.items || [])
      .slice(0, maxItems)
      .map((item) => ({
        name: item.name || 'Recommended Item',
        category: item.category || category,
        priority: ['essential', 'recommended', 'optional'].includes(item.priority)
          ? item.priority
          : 'recommended',
        reason: item.reason || 'Commonly used item',
        estimatedPrice: item.estimatedPrice,
      }));

    return {
      category: parsed.category || category,
      items,
      totalRecommendations: items.length,
    };
  } catch (error: any) {
    console.error('Item recommendation error:', error.message);
    // Return empty recommendations on error
    return {
      category: category,
      items: [],
      totalRecommendations: 0,
    };
  }
}





