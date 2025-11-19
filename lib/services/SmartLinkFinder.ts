import { openai } from '../openaiClient';

/**
 * Smart Link Finder - Uses AI to find the BEST place to buy products
 *
 * Philosophy: Prioritize genuineness over affiliate revenue
 * - New products → Official retailers, Amazon
 * - Used/vintage → eBay, specialty pre-owned sites
 * - Specialty items → Category-specific retailers
 */

export interface ProductContext {
  name: string;
  brand?: string;
  category?: string;
  isVintage?: boolean;
  isUsed?: boolean;
}

export interface LinkRecommendation {
  url: string;
  source: string; // 'ebay', 'amazon', 'specialty', 'manufacturer'
  reason: string;
  label: string; // Display label like "Find on eBay" or "Buy from PGA Tour Superstore"
  priority: number; // 1-5, 1 = best recommendation
  affiliatable: boolean; // Whether this can become an affiliate link
}

export interface SmartLinkResult {
  recommendations: LinkRecommendation[];
  primaryLink: LinkRecommendation; // Best single recommendation
  reasoning: string; // Why these sources were chosen
}

/**
 * Use AI to determine the best purchase sources for a product
 */
export async function findBestProductLinks(
  product: ProductContext
): Promise<SmartLinkResult> {
  const systemPrompt = `You are an expert at finding the best places to purchase products online.

Your goal is to recommend GENUINE, USEFUL purchase sources - not just default to Amazon for everything.

PRINCIPLES:
1. NEW products → Amazon, official retailers, specialty stores
2. USED/VINTAGE products → eBay, specialty pre-owned marketplaces (2nd Swing Golf, Reverb for music, etc.)
3. SPECIALTY items → Category-specific retailers (REI, PGA Tour Superstore, Sweetwater, etc.)
4. Consider AVAILABILITY - vintage items rarely on Amazon
5. Prioritize BEST USER EXPERIENCE over affiliate potential

CATEGORY-SPECIFIC SOURCES:

**Golf Equipment:**
- New: PGA Tour Superstore, Golf Galaxy, Amazon, manufacturer sites
- Used/Vintage: 2nd Swing Golf, GlobalGolf.com, eBay, CallawayPreowned.com
- Never recommend Amazon for vintage golf clubs (they're rarely there)

**Camping/Outdoor:**
- New: REI, Backcountry, Moosejaw, Amazon
- Used: REI Used Gear, eBay, GearTrade
- Specialty: Brand-direct (Patagonia, Arc'teryx)

**Tech/Electronics:**
- New: Amazon, Best Buy, B&H Photo, manufacturer sites
- Used: eBay, Swappa (phones), Back Market (refurb)
- Specialty: Adorama, Newegg

**Fashion/Apparel:**
- New: Brand website, Nordstrom, Amazon
- Vintage/Used: eBay, Grailed, Poshmark, ThredUp
- Specialty: SSENSE, Mr Porter, End Clothing

**Music/Audio:**
- New: Sweetwater, Guitar Center, Amazon
- Used: Reverb, eBay, Guitar Center Used
- Vintage: Reverb (best for vintage audio)

**Makeup/Beauty:**
- New: Sephora, Ulta, brand website, Amazon
- Used: Mercari, Poshmark (for sealed products)
- Specialty: Cult Beauty, Space NK

Return ONLY valid JSON in this format:
{
  "recommendations": [
    {
      "url": "https://www.ebay.com/sch/i.html?_nkw=...",
      "source": "ebay",
      "reason": "Best marketplace for used golf equipment",
      "label": "Find on eBay",
      "priority": 1,
      "affiliatable": true
    },
    {
      "url": "https://www.2ndswing.com/search?query=...",
      "source": "specialty",
      "reason": "Golf-specific pre-owned specialist",
      "label": "Buy from 2nd Swing Golf",
      "priority": 2,
      "affiliatable": false
    }
  ],
  "reasoning": "This is a vintage golf driver, so pre-owned marketplaces are the best option"
}

Provide 2-4 recommendations, ordered by priority.
IMPORTANT: Build actual search URLs - use proper URL encoding and site-specific search patterns.`;

  const productDescription = `${product.brand || ''} ${product.name}`.trim();
  const context = [];
  if (product.category) context.push(`Category: ${product.category}`);
  if (product.isVintage) context.push('This is a VINTAGE/OLD product');
  if (product.isUsed) context.push('User is looking for USED condition');

  const userPrompt = `Find the best places to buy this product:

Product: "${productDescription}"
${context.length > 0 ? context.join('\n') : ''}

Where should someone look to buy this? Provide actual search URLs, not generic homepage links.`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Cost-effective for this task
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.3,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const parsed = JSON.parse(content);

    // Validate and sanitize
    const recommendations: LinkRecommendation[] = (parsed.recommendations || []).map(
      (rec: any) => ({
        url: rec.url || '',
        source: rec.source || 'unknown',
        reason: rec.reason || '',
        label: rec.label || 'Find Product',
        priority: rec.priority || 5,
        affiliatable: rec.affiliatable ?? true,
      })
    );

    // Sort by priority
    recommendations.sort((a, b) => a.priority - b.priority);

    return {
      recommendations,
      primaryLink: recommendations[0] || {
        url: `https://www.google.com/search?q=${encodeURIComponent(productDescription)}`,
        source: 'google',
        reason: 'Fallback to Google search',
        label: 'Search on Google',
        priority: 10,
        affiliatable: false,
      },
      reasoning: parsed.reasoning || 'Generated purchase recommendations',
    };
  } catch (error) {
    console.error('Smart link finder error:', error);

    // Fallback to basic Google search
    return {
      recommendations: [
        {
          url: `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(productDescription)}`,
          source: 'google',
          reason: 'Fallback search',
          label: 'Find on Google Shopping',
          priority: 10,
          affiliatable: false,
        },
      ],
      primaryLink: {
        url: `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(productDescription)}`,
        source: 'google',
        reason: 'Fallback search',
        label: 'Find on Google Shopping',
        priority: 10,
        affiliatable: false,
      },
      reasoning: 'Using fallback search due to error',
    };
  }
}

/**
 * Detect if a product is likely vintage/old based on name and brand
 */
export function detectProductAge(productName: string, brand?: string): {
  isVintage: boolean;
  confidence: number;
  reason?: string;
} {
  const name = productName.toLowerCase();

  // Year detection
  const yearMatch = name.match(/\b(19\d{2}|20[0-1]\d)\b/);
  if (yearMatch) {
    const year = parseInt(yearMatch[1]);
    const currentYear = new Date().getFullYear();
    const age = currentYear - year;

    if (age > 5) {
      return {
        isVintage: true,
        confidence: 0.9,
        reason: `Product from ${year} (${age} years old)`,
      };
    }
  }

  // Vintage keywords
  const vintageKeywords = [
    'vintage',
    'retro',
    'classic',
    'old',
    'original',
    'legacy',
    'discontinued',
    'rare',
  ];

  for (const keyword of vintageKeywords) {
    if (name.includes(keyword)) {
      return {
        isVintage: true,
        confidence: 0.7,
        reason: `Contains vintage indicator: "${keyword}"`,
      };
    }
  }

  // Golf-specific old model detection
  if (brand?.toLowerCase().includes('taylormade')) {
    const oldModels = ['r7', 'r9', 'r11', 'r1', 'burner', 'rocketballz'];
    for (const model of oldModels) {
      if (name.includes(model)) {
        return {
          isVintage: true,
          confidence: 0.8,
          reason: `Old TaylorMade model: ${model}`,
        };
      }
    }
  }

  return {
    isVintage: false,
    confidence: 0.9,
  };
}
