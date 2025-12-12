/**
 * AI Semantic Analysis for URLs
 *
 * Uses LLM intelligence to understand product URLs even when scraping fails.
 * Key insight: GPT-4 knows most products and can infer from URL structure alone.
 */

import OpenAI from 'openai';
import type { ParsedProductUrl } from './urlParser';
import type { LightweightFetchResult, StructuredProductData } from './lightweightFetch';
import { getBestTitle, getBrand, getPrice, getImage } from './lightweightFetch';

// Lazy initialization of OpenAI client
let openaiClient: OpenAI | null = null;

function getOpenAI(): OpenAI {
  if (!openaiClient) {
    openaiClient = new OpenAI();
  }
  return openaiClient;
}

export interface AIProductAnalysis {
  brand: string | null;
  productName: string;
  fullName: string;  // brand + productName combined
  category: string | null;
  specifications: string[];
  estimatedPrice: string | null;
  confidence: number;
  reasoning: string;
  source: 'ai_url_only' | 'ai_with_scraped_data' | 'structured_data';
}

/**
 * Analyze a URL using AI, optionally with scraped data
 */
export async function analyzeUrlWithAI(
  url: string,
  parsedUrl: ParsedProductUrl,
  fetchResult: LightweightFetchResult | null
): Promise<AIProductAnalysis> {
  // If we have good structured data, use it directly
  if (fetchResult?.success && fetchResult.data?.jsonLd?.name) {
    return extractFromStructuredData(fetchResult.data, parsedUrl);
  }

  // Build the prompt based on what we have
  const prompt = buildAnalysisPrompt(url, parsedUrl, fetchResult);

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: getSystemPrompt(),
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 1000,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    // Validate and normalize the result
    return normalizeAIResult(result, parsedUrl, fetchResult?.success || false);

  } catch (error) {
    console.error('[AISemanticAnalysis] Error:', error);

    // Return best effort from URL parsing alone
    return {
      brand: parsedUrl.brand,
      productName: parsedUrl.humanizedName || 'Unknown Product',
      fullName: formatFullName(parsedUrl.brand, parsedUrl.humanizedName),
      category: parsedUrl.category,
      specifications: [],
      estimatedPrice: null,
      confidence: parsedUrl.urlConfidence * 0.7, // Reduce confidence on error
      reasoning: 'AI analysis failed, using URL parsing only',
      source: 'ai_url_only',
    };
  }
}

/**
 * Get the system prompt for product identification
 */
function getSystemPrompt(): string {
  return `You are a product identification expert with extensive knowledge of:
- Consumer brands across all categories (golf, tech, fashion, outdoor, etc.)
- E-commerce URL structures and conventions
- Product naming patterns and model numbers
- Brand-specific terminology and product lines
- Amazon product database and ASINs (you know many products by their B0XXXXXXXX codes)

Your task is to identify products from URLs and any available scraped data.

IMPORTANT GUIDELINES:
1. Domain Recognition: Many brands use their name in the domain (e.g., gfore.com = G/FORE, titleist.com = Titleist)
2. URL Slug Decoding: Product slugs often contain the product name with hyphens (e.g., "mens-g.112-golf-shoe" = "Men's G.112 Golf Shoe")
3. Model Numbers: Look for alphanumeric patterns in URLs (e.g., GMF000027 is a G/FORE SKU)
4. Category Context: Golf domains = golf products, camera domains = photography gear, etc.
5. Known Products: If you recognize the product from your training, use that knowledge
6. AMAZON ASINs: You often know Amazon products by their ASIN (B0XXXXXXXXX). If you recognize an ASIN, identify the product confidently!

CONFIDENCE SCORING:
- 0.9-1.0: Certain identification (known product, clear structured data, recognized ASIN)
- 0.7-0.9: High confidence (URL clearly indicates brand + product)
- 0.5-0.7: Moderate confidence (partial information, some inference)
- 0.3-0.5: Low confidence (significant guessing required)
- Below 0.3: Very uncertain

Always respond with valid JSON matching the specified schema.`;
}

/**
 * Build the analysis prompt
 */
function buildAnalysisPrompt(
  url: string,
  parsedUrl: ParsedProductUrl,
  fetchResult: LightweightFetchResult | null
): string {
  const parts: string[] = [];

  parts.push(`Analyze this product URL and identify the product:\n`);
  parts.push(`URL: ${url}`);
  parts.push(`Domain: ${parsedUrl.domain}`);

  // Check if this is an Amazon URL
  const isAmazon = parsedUrl.domain.includes('amazon');
  const asin = parsedUrl.modelNumber; // For Amazon, modelNumber contains the ASIN

  if (isAmazon && asin) {
    parts.push(`\n⚠️ AMAZON PRODUCT - ASIN: ${asin}`);
    parts.push(`This is an Amazon product URL. The ASIN is ${asin}.`);
    parts.push(`If you recognize this ASIN from your training data, identify the product with HIGH confidence.`);
    parts.push(`Many popular products have ASINs you know - search your knowledge!`);
  }

  // Brand information
  if (parsedUrl.brand) {
    parts.push(`\nBrand (from domain database): ${parsedUrl.brand}`);
    parts.push(`Brand category: ${parsedUrl.category}`);
  } else if (parsedUrl.isRetailer) {
    parts.push(`\nThis is a retailer site (${parsedUrl.domain}), brand must be extracted from product info`);
  } else {
    parts.push(`\nBrand: Unknown - infer from URL or content if possible`);
  }

  // URL parsing results
  if (parsedUrl.productSlug) {
    parts.push(`\nURL Product Slug: "${parsedUrl.productSlug}"`);
  }
  if (parsedUrl.humanizedName) {
    parts.push(`Humanized from slug: "${parsedUrl.humanizedName}"`);
  }
  if (parsedUrl.modelNumber) {
    parts.push(`Model/SKU from URL: ${parsedUrl.modelNumber}`);
  }
  if (parsedUrl.color) {
    parts.push(`Color variant: ${parsedUrl.color}`);
  }
  if (parsedUrl.size) {
    parts.push(`Size variant: ${parsedUrl.size}`);
  }

  // Scraped data if available
  if (fetchResult?.success && fetchResult.data) {
    parts.push(`\n--- SCRAPED DATA AVAILABLE ---`);

    const title = getBestTitle(fetchResult.data);
    if (title) parts.push(`Page Title: "${title}"`);

    const brand = getBrand(fetchResult.data);
    if (brand) parts.push(`Structured Data Brand: ${brand}`);

    const { amount, currency } = getPrice(fetchResult.data);
    if (amount) parts.push(`Price: ${currency} ${amount}`);

    const desc = fetchResult.data.ogDescription || fetchResult.data.metaDescription;
    if (desc) parts.push(`Description: "${desc.slice(0, 300)}..."`);

  } else if (fetchResult?.blocked) {
    parts.push(`\n--- SCRAPING BLOCKED (${fetchResult.reason}) ---`);
    parts.push(`You must identify the product using ONLY the URL information above.`);
    parts.push(`Use your knowledge of ${parsedUrl.brand || 'this brand'} and their products.`);
  } else {
    parts.push(`\n--- NO SCRAPED DATA ---`);
    parts.push(`Identify the product using URL analysis and your product knowledge.`);
  }

  parts.push(`\nRespond with JSON:`);
  parts.push(`{
  "brand": "Brand name (required)",
  "productName": "Product name without brand (required)",
  "category": "Product category",
  "specifications": ["spec1", "spec2"],
  "estimatedPrice": "$XX.XX or null if unknown",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of how you identified this product"
}`);

  return parts.join('\n');
}

/**
 * Extract product info from structured data (high confidence path)
 */
function extractFromStructuredData(
  data: StructuredProductData,
  parsedUrl: ParsedProductUrl
): AIProductAnalysis {
  const title = getBestTitle(data);
  const jsonLdBrand = getBrand(data);
  const { amount } = getPrice(data);

  // Use structured data brand, fall back to domain brand
  const brand = jsonLdBrand || parsedUrl.brand;

  // Clean the product name (remove brand if duplicated)
  let productName = title || parsedUrl.humanizedName || 'Unknown Product';
  if (brand && productName.toLowerCase().startsWith(brand.toLowerCase())) {
    productName = productName.slice(brand.length).trim();
    // Remove leading separators
    productName = productName.replace(/^[-–—|:]\s*/, '');
  }

  // Extract specifications from description
  const specs: string[] = [];
  const desc = data.ogDescription || data.metaDescription;
  if (desc) {
    // Try to extract key specs from description
    const specPatterns = [
      /(\d+(?:\.\d+)?(?:mm|cm|in|oz|lb|g|kg))/gi,  // Measurements
      /(leather|synthetic|mesh|waterproof|breathable)/gi,  // Materials
    ];
    for (const pattern of specPatterns) {
      const matches = desc.match(pattern);
      if (matches) {
        specs.push(...matches.slice(0, 3));
      }
    }
  }

  return {
    brand,
    productName,
    fullName: formatFullName(brand, productName),
    category: parsedUrl.category || data.jsonLd?.category || null,
    specifications: specs,
    estimatedPrice: amount,
    confidence: 0.95,
    reasoning: 'Extracted from structured JSON-LD data on page',
    source: 'structured_data',
  };
}

/**
 * Normalize and validate AI result
 */
function normalizeAIResult(
  result: any,
  parsedUrl: ParsedProductUrl,
  hadScrapedData: boolean
): AIProductAnalysis {
  // Ensure required fields
  const brand = result.brand || parsedUrl.brand || null;
  const productName = result.productName || parsedUrl.humanizedName || 'Unknown Product';

  // Validate confidence
  let confidence = typeof result.confidence === 'number'
    ? Math.min(Math.max(result.confidence, 0), 1)
    : 0.5;

  // CRITICAL: Cap confidence when AI is guessing without real data
  // This prevents the "95% confidence on wrong product" problem
  const isAmazon = parsedUrl.domain.includes('amazon');
  const isRetailer = parsedUrl.isRetailer;

  if (!hadScrapedData) {
    // No scraped data means AI is guessing from URL alone
    if (isAmazon || isRetailer) {
      // For retailers (especially Amazon), AI is just guessing ASIN -> product
      // Cap at 60% unless we have very strong signals
      confidence = Math.min(confidence, 0.60);
    } else {
      // For brand sites without scraped data, cap at 75%
      confidence = Math.min(confidence, 0.75);
    }
  }

  // Boost confidence if AI result matches URL parsing (but respect caps)
  if (parsedUrl.brand && result.brand?.toLowerCase() === parsedUrl.brand.toLowerCase()) {
    confidence = Math.min(confidence + 0.05, hadScrapedData ? 1 : 0.70);
  }

  return {
    brand,
    productName,
    fullName: formatFullName(brand, productName),
    category: result.category || parsedUrl.category || null,
    specifications: Array.isArray(result.specifications) ? result.specifications : [],
    estimatedPrice: result.estimatedPrice || null,
    confidence,
    reasoning: result.reasoning || 'AI analysis completed',
    source: hadScrapedData ? 'ai_with_scraped_data' : 'ai_url_only',
  };
}

/**
 * Format full product name with brand
 */
function formatFullName(brand: string | null, productName: string | null): string {
  if (!productName || productName === 'Unknown Product') {
    return brand || 'Unknown Product';
  }

  if (!brand) {
    return productName;
  }

  // Avoid duplicate brand
  if (productName.toLowerCase().startsWith(brand.toLowerCase())) {
    return productName;
  }

  return `${brand} ${productName}`;
}

/**
 * Quick AI analysis for simple cases (uses cheaper model)
 */
export async function quickAIAnalysis(
  url: string,
  parsedUrl: ParsedProductUrl
): Promise<AIProductAnalysis | null> {
  // Only use for cases where URL intelligence gives us good data
  if (!parsedUrl.brand || !parsedUrl.humanizedName) {
    return null;
  }

  try {
    const response = await getOpenAI().chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a product naming expert. Given a brand and rough product name, format it correctly. Respond with JSON: {"productName": "Correctly Formatted Name", "confidence": 0.0-1.0}',
        },
        {
          role: 'user',
          content: `Brand: ${parsedUrl.brand}\nRough name from URL: ${parsedUrl.humanizedName}\nCategory: ${parsedUrl.category || 'unknown'}`,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0,
      max_tokens: 200,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      brand: parsedUrl.brand,
      productName: result.productName || parsedUrl.humanizedName,
      fullName: formatFullName(parsedUrl.brand, result.productName || parsedUrl.humanizedName),
      category: parsedUrl.category,
      specifications: [],
      estimatedPrice: null,
      confidence: result.confidence || 0.7,
      reasoning: 'Quick AI name formatting',
      source: 'ai_url_only',
    };

  } catch {
    return null;
  }
}
