import { openai } from './openaiClient';

/**
 * Best Practice: Define TypeScript interfaces for all AI responses
 */
export interface IdentifiedProduct {
  name: string; // MUST be specific model/product name, not generic
  brand?: string;
  category: string;
  confidence: number; // 0-100
  estimatedPrice?: string;
  color?: string;
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
    // Check if valid base64
    if (!base64Image.startsWith('data:image/')) {
      return { valid: false, error: 'Invalid image format', sizeKB: 0 };
    }

    // Calculate size
    const base64Data = base64Image.split(',')[1];
    const sizeKB = Math.round((base64Data.length * 3) / 4 / 1024);

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
    return { valid: false, error: 'Failed to process image', sizeKB: 0 };
  }
}

/**
 * Best Practice: Structured prompt engineering for consistent results
 * Identify products in an image using GPT-4 Vision
 */
export async function identifyProductsInImage(
  imageBase64: string,
  context?: { bagType?: string; expectedCategories?: string[]; focusCategories?: string[] }
): Promise<VisionAnalysisResult> {
  const startTime = Date.now();

  // Best Practice: Validate input before expensive API call
  const validation = validateAndCompressImage(imageBase64);
  if (!validation.valid) {
    throw new Error(validation.error || 'Invalid image');
  }

  // Best Practice: Use system message for consistent behavior with emphasis on specificity
  const systemPrompt = `You are an expert product identifier with deep knowledge of specific product models, brands, and SKUs.

CRITICAL REQUIREMENTS:
1. IDENTIFY EVERY PRODUCT VISIBLE - If there are 20+ items, list them ALL. No limits.
2. BE HYPER-SPECIFIC - Never use generic names like "Driver", "Golf Bag", "Tent"
3. Include EXACT model names like "TaylorMade SIM2 Max Driver", "Callaway Rogue ST Triple Diamond Fairway Wood"
4. Include model numbers/SKUs when visible (e.g., "M2 2017", "Apex DCB 21")
5. For products where you're unsure, provide alternatives with reasoning
6. SPECIFICITY IS EVERYTHING - generic names are useless

CONFIDENCE SCORING (BE CONSERVATIVE):
- 90-100: You can see CLEAR branding, model text/numbers, distinctive design features
- 70-89: Brand is clear but model is inferred from visual features
- 50-69: Can identify general product type but brand/model uncertain
- 30-49: Can only make educated guess based on shape/color
- <30: Very uncertain, minimal visible details

IMPORTANT: If you can't read text/logos clearly or see distinctive features, DO NOT give high confidence.
Better to say 60% confidence with alternatives than falsely claim 95% certainty.

DETAIL FORMATTING STANDARDS (use pipe separator):
- Golf: "Loft | Shaft | Flex" (e.g., "10.5° | Fujikura Ventus | Stiff")
- Makeup: "Shade | Finish | Size" (e.g., "Ruby Woo | Matte | 3g")
- Fashion: "Size | Color | Material" (e.g., "Medium | Black | 100% Cotton")
- Tech: "Storage | Key Feature | Connectivity" (e.g., "256GB | A17 Pro | USB-C")
- Outdoor: "Weight | Rating | Capacity" (e.g., "12.6oz | 20°F | 2-person")
*Adapt format if specific details aren't visible - don't guess, just omit.*

GOOD EXAMPLES:
✅ "TaylorMade Stealth 2 Plus Driver" NOT "Driver"
✅ "Titleist Pro V1x Golf Balls (2023)" NOT "Golf Balls"
✅ "Ping G425 Max Fairway 3-Wood" NOT "Fairway Wood"
✅ "REI Co-op Half Dome SL 2+ Tent" NOT "Tent"
✅ "Osprey Atmos AG 65 Backpack" NOT "Backpack"

BAD EXAMPLES (NEVER DO THIS):
❌ "Golf Club" - too generic
❌ "Driver" - missing brand and model
❌ "Camping Stove" - need brand and model
❌ "Backpack" - need specific model

Return your response as valid JSON with this exact structure:
{
  "products": [
    {
      "name": "Specific Product Name with Model",
      "brand": "Brand name",
      "category": "One of: camping, golf, hiking, travel, sports, electronics, clothing, other",
      "confidence": 85,
      "modelNumber": "Model/SKU if visible (optional)",
      "estimatedPrice": "$XX-XX range (optional)",
      "color": "Primary color (optional)",
      "specifications": ["spec1", "spec2"] (optional),
      "alternatives": [
        {
          "name": "Alternative Product Name",
          "brand": "Brand",
          "confidence": 60,
          "reason": "Why this could be the product"
        }
      ] (only if confidence < 70)
    }
  ]
}

If you cannot identify the SPECIFIC model, include alternatives. Confidence should be 0-100.`;

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
    const products: IdentifiedProduct[] = parsed.products.map((p) => ({
      name: p.name || 'Unknown Product',
      brand: p.brand || undefined,
      category: p.category || 'other',
      confidence: Math.min(100, Math.max(0, p.confidence || 50)),
      estimatedPrice: p.estimatedPrice,
      color: p.color,
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

    return {
      products: productsWithImages,
      totalConfidence,
      processingTime,
      warnings: warnings.length > 0 ? warnings : undefined,
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





