import { openai } from '../openaiClient';
import { trackApiUsage } from '../apiUsageTracker';

/**
 * Smart Link Finder - Uses AI to find the BEST place to buy products
 *
 * Pipeline: Google Web Search → AI Rank real results → Return real product links
 * Fallback: LLM-generated search URLs → Google Shopping hardcoded URL
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

// --- Domain helpers ---

const SOURCE_MAP: Record<string, string> = {
  'amazon.com': 'amazon',
  'ebay.com': 'ebay',
  'walmart.com': 'walmart',
  'target.com': 'target',
  'bestbuy.com': 'bestbuy',
  'rei.com': 'rei',
  'backcountry.com': 'backcountry',
  'dickssportinggoods.com': 'dickssportinggoods',
  'pgatoursuperstore.com': 'pgatoursuperstore',
  'golfgalaxy.com': 'golfgalaxy',
  '2ndswing.com': 'specialty',
  'globalgolf.com': 'specialty',
  'callawaygolfpreowned.com': 'specialty',
  'sweetwater.com': 'sweetwater',
  'guitarcenter.com': 'guitarcenter',
  'reverb.com': 'reverb',
  'bhphotovideo.com': 'bhphoto',
  'adorama.com': 'adorama',
  'newegg.com': 'newegg',
  'sephora.com': 'sephora',
  'ulta.com': 'ulta',
  'nordstrom.com': 'nordstrom',
  'grailed.com': 'grailed',
  'poshmark.com': 'poshmark',
  'swappa.com': 'swappa',
};

const AFFILIATE_DOMAINS = new Set([
  'amazon.com',
  'ebay.com',
  'walmart.com',
  'target.com',
  'bestbuy.com',
  'rei.com',
  'backcountry.com',
  'dickssportinggoods.com',
  'nordstrom.com',
]);

function extractDomain(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace(/^www\./, '');
    return hostname;
  } catch {
    return '';
  }
}

// Known regional/localized subdomains (e.g. es.callawaygolf.com, uk.titleist.com)
// These should be normalized to the base domain's US/English version
const REGIONAL_SUBDOMAIN_PATTERN = /^(es|uk|de|fr|it|jp|kr|au|ca|eu|en|us)\./;

/**
 * Normalize a URL by replacing regional subdomains with www.
 * e.g. https://es.callawaygolf.com/path → https://www.callawaygolf.com/path
 */
function normalizeRegionalUrl(url: string): string {
  try {
    const parsed = new URL(url);
    if (REGIONAL_SUBDOMAIN_PATTERN.test(parsed.hostname)) {
      parsed.hostname = parsed.hostname.replace(REGIONAL_SUBDOMAIN_PATTERN, 'www.');
      console.log(`[SmartLinkFinder] Normalized regional URL: ${url} → ${parsed.toString()}`);
      return parsed.toString();
    }
    return url;
  } catch {
    return url;
  }
}

function detectSource(domain: string): string {
  const clean = domain.replace(/^www\./, '');
  for (const [pattern, source] of Object.entries(SOURCE_MAP)) {
    if (clean === pattern || clean.endsWith('.' + pattern)) {
      return source;
    }
  }
  // Use the domain name (minus TLD) as source
  const parts = clean.split('.');
  return parts.length >= 2 ? parts[parts.length - 2] : 'other';
}

function isAffiliateable(domain: string): boolean {
  const clean = domain.replace(/^www\./, '');
  for (const d of AFFILIATE_DOMAINS) {
    if (clean === d || clean.endsWith('.' + d)) return true;
  }
  return false;
}

// --- Google Web Search ---

interface GoogleWebResult {
  title: string;
  link: string;
  snippet: string;
  displayLink: string;
}

// Known brand → domain overrides for brands whose website isn't just {brand}.com
const BRAND_DOMAIN_MAP: Record<string, string> = {
  // Golf - clubs
  'taylormade': 'taylormadegolf.com',
  'callaway': 'callawaygolf.com',
  'titleist': 'titleist.com',
  'ping': 'ping.com',
  'cobra': 'cobragolf.com',
  'cleveland': 'clevelandgolf.com',
  'mizuno': 'mizuno.com',
  'srixon': 'srixon.com',
  'scotty cameron': 'scottycameron.com',
  'odyssey': 'odysseygolf.com',
  'bettinardi': 'bettinardi.com',
  'evnroll': 'evnroll.com',
  'pxg': 'pxg.com',
  'vokey': 'vokey.com',
  'bridgestone': 'bridgestonegolf.com',
  'wilson': 'wilson.com',
  'xxio': 'xxio.com',
  'tour edge': 'touredge.com',
  // Golf - shafts
  'mitsubishi': 'mca-golf.com',
  'mitsubishi chemical': 'mca-golf.com',
  'fujikura': 'fujikuragolf.com',
  'project x': 'projectxgolf.com',
  'true temper': 'truetemper.com',
  'kbs': 'kbsgolfshafts.com',
  'graphite design': 'graphitedesign.com',
  'aldila': 'aldila.com',
  'nippon': 'nipponshaft.com',
  'ust mamiya': 'ustmamiya.com',
  'aerotech': 'aerotechgolfshafts.com',
  // Golf - apparel/accessories
  'footjoy': 'footjoy.com',
  'foot joy': 'footjoy.com',
  'acushnet': 'acushnetcompany.com',
  'vice': 'vicegolf.com',
  'vice golf': 'vicegolf.com',
  'kirkland': 'costco.com',
  // Outdoor
  'the north face': 'thenorthface.com',
  'arc\'teryx': 'arcteryx.com',
  'under armour': 'underarmour.com',
  'patagonia': 'patagonia.com',
  // Tech
  'garmin': 'garmin.com',
  'bushnell': 'bushnellgolf.com',
};

function guessBrandDomain(brand: string): string | null {
  const lower = brand.toLowerCase().trim();
  if (BRAND_DOMAIN_MAP[lower]) return BRAND_DOMAIN_MAP[lower];
  // Default: try {brand}.com (strip spaces)
  const slug = lower.replace(/[^a-z0-9]/g, '');
  return slug.length >= 2 ? `${slug}.com` : null;
}

async function runGoogleSearch(query: string, label: string): Promise<GoogleWebResult[]> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

  if (!apiKey || !searchEngineId) {
    console.log('[SmartLinkFinder] Google API key or search engine ID not configured');
    return [];
  }

  const startTime = Date.now();

  try {
    const searchParams = new URLSearchParams({
      key: apiKey,
      cx: searchEngineId,
      q: query,
      num: '10',
      gl: 'us',
      lr: 'lang_en',
      safe: 'active',
    });

    const response = await fetch(
      `https://www.googleapis.com/customsearch/v1?${searchParams.toString()}`
    );

    const durationMs = Date.now() - startTime;

    if (!response.ok) {
      console.log(`[SmartLinkFinder] Google API error (${label}):`, response.status);
      trackApiUsage({
        userId: null,
        endpoint: `SmartLinkFinder/${label}`,
        model: 'google-search',
        operationType: 'search',
        durationMs,
        status: 'error',
        errorMessage: `HTTP ${response.status}`,
      }).catch(console.error);
      return [];
    }

    const data = await response.json();
    const items = data.items || [];

    trackApiUsage({
      userId: null,
      endpoint: `SmartLinkFinder/${label}`,
      model: 'google-search',
      operationType: 'search',
      durationMs,
      status: 'success',
    }).catch(console.error);

    console.log(`[SmartLinkFinder] ${label} returned ${items.length} results for: ${query}`);

    return items.map((item: any) => ({
      title: item.title || '',
      link: item.link || '',
      snippet: item.snippet || '',
      displayLink: item.displayLink || '',
    }));
  } catch (error) {
    console.error(`[SmartLinkFinder] ${label} error:`, error);
    trackApiUsage({
      userId: null,
      endpoint: `SmartLinkFinder/${label}`,
      model: 'google-search',
      operationType: 'search',
      durationMs: Date.now() - startTime,
      status: 'error',
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
    }).catch(console.error);
    return [];
  }
}

async function searchGoogleWeb(product: ProductContext): Promise<GoogleWebResult[]> {
  const productDescription = `${product.brand || ''} ${product.name}`.trim();
  const buyTerm = product.isVintage || product.isUsed ? 'used' : 'buy';
  const generalQuery = `"${productDescription}" ${buyTerm}`;

  // Run general search, and optionally a brand-site-specific search in parallel
  const brandDomain = product.brand ? guessBrandDomain(product.brand) : null;

  const searches: Promise<GoogleWebResult[]>[] = [
    runGoogleSearch(generalQuery, 'searchGoogleWeb'),
  ];

  if (brandDomain) {
    const brandQuery = `site:${brandDomain} ${product.name}`;
    searches.push(runGoogleSearch(brandQuery, 'searchBrandSite'));
  }

  const results = await Promise.all(searches);
  const generalResults = results[0];
  const brandResults = results[1] || [];

  // Merge: brand-site results first (deduplicated), then general results
  const seen = new Set<string>();
  const merged: GoogleWebResult[] = [];

  for (const r of [...brandResults, ...generalResults]) {
    const url = r.link.toLowerCase();
    if (!seen.has(url)) {
      seen.add(url);
      merged.push(r);
    }
  }

  return merged;
}

// --- AI Ranking ---

const EXCLUDE_URL_PATTERNS = ['/search', '/sch/', '/blog/', '/review/', '/article/', '/news/'];
const EXCLUDE_DOMAINS = ['reddit.com', 'facebook.com', 'twitter.com', 'x.com', 'instagram.com', 'tiktok.com', 'youtube.com', 'pinterest.com', 'quora.com'];

// Domains that are brand-specific manufacturer sites — if the user's brand
// doesn't match, these results are from the WRONG brand and should be deprioritized
const BRAND_MANUFACTURER_DOMAINS: Record<string, string> = {
  'taylormadegolf.com': 'taylormade',
  'callawaygolf.com': 'callaway',
  'titleist.com': 'titleist',
  'ping.com': 'ping',
  'cobragolf.com': 'cobra',
  'clevelandgolf.com': 'cleveland',
  'mizuno.com': 'mizuno',
  'srixon.com': 'srixon',
  'mca-golf.com': 'mitsubishi',
  'fujikuragolf.com': 'fujikura',
  'projectxgolf.com': 'project x',
  'truetemper.com': 'true temper',
  'vicegolf.com': 'vice',
  'bettinardi.com': 'bettinardi',
  'evnroll.com': 'evnroll',
  'pxg.com': 'pxg',
  'vokey.com': 'vokey',
  'bridgestonegolf.com': 'bridgestone',
};

function prefilterResults(results: GoogleWebResult[], product?: ProductContext): GoogleWebResult[] {
  const targetBrand = product?.brand?.toLowerCase().trim();

  return results.filter((r) => {
    const url = r.link.toLowerCase();
    const domain = extractDomain(r.link);

    // Exclude social media / forums
    if (EXCLUDE_DOMAINS.some((d) => domain === d || domain.endsWith('.' + d))) return false;

    // Exclude search/blog/review pages
    if (EXCLUDE_URL_PATTERNS.some((p) => url.includes(p))) return false;

    // If we know the target brand, exclude OTHER manufacturer brand sites
    // (e.g. don't show vicegolf.com when searching for Mitsubishi shafts)
    if (targetBrand) {
      const domainBrand = BRAND_MANUFACTURER_DOMAINS[domain];
      if (domainBrand && !targetBrand.includes(domainBrand) && !domainBrand.includes(targetBrand)) {
        console.log(`[SmartLinkFinder] Prefilter: excluding ${domain} (brand "${domainBrand}" != target "${targetBrand}")`);
        return false;
      }
    }

    return true;
  });
}

async function rankResultsWithAI(
  results: GoogleWebResult[],
  product: ProductContext
): Promise<LinkRecommendation[]> {
  if (results.length === 0) return [];

  const productDescription = `${product.brand || ''} ${product.name}`.trim();
  const context = [];
  if (product.category) context.push(`Category: ${product.category}`);
  if (product.isVintage) context.push('VINTAGE/OLD product');
  if (product.isUsed) context.push('USED condition');

  const resultsText = results
    .map((r, i) => `[${i + 1}] ${r.title}\n    URL: ${r.link}\n    ${r.snippet}`)
    .join('\n\n');

  const brandDomain = product.brand ? guessBrandDomain(product.brand) : null;

  const systemPrompt = `You are a product link quality ranker. Given Google search results for a product, pick the best ACTUAL PRODUCT PAGES where someone can buy or view the product.

PRODUCT: "${productDescription}"
${product.brand ? `BRAND: "${product.brand}"` : ''}
${brandDomain ? `BRAND WEBSITE: ${brandDomain}` : ''}

RANKING CRITERIA (in strict priority order):
1. **Brand/manufacturer official website** — ALWAYS pick this first if available${brandDomain ? ` (look for ${brandDomain})` : ''}. This is the #1 priority.
2. **Exact product match** — The page must be for THIS specific product (brand + model name). REJECT pages that mention the product only as an accessory, component, or bundle with a DIFFERENT brand's product.
3. **Product detail page** — Must be a page where you can view or buy the product, not a search/listing/blog page.
4. **Reputable retailer** — Major retailers (Amazon, Dick's, PGA Tour Superstore, etc.) or authorized dealers.

CRITICAL RULES:
- REJECT any page from a DIFFERENT brand's website that merely includes this product as a component. For example, if looking for a "Mitsubishi Tensei shaft", REJECT a page on vicegolf.com or taylormadegolf.com that sells a club WITH that shaft — those are the wrong brand's site.
- REJECT search result pages, blog posts, reviews, articles, social media, and forum pages.
- Each pick MUST be from a different domain.

PREFER URLs containing: /product/, /dp/, /p/, /item/, /ip/, /shaft/, /golf/

Return ONLY valid JSON:
{
  "picks": [
    {
      "index": 1,
      "url": "https://...",
      "confidence": 85,
      "reason": "Official product page on brand website",
      "label": "View on Nike"
    }
  ]
}

Return at most 3 picks. Only include picks with confidence >= 50.
If no results are good product pages, return {"picks": []}.`;

  const userPrompt = `Product: "${productDescription}"
${context.length > 0 ? context.join(', ') : ''}

Search results:
${resultsText}`;

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      response_format: { type: 'json_object' },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return [];

    const parsed = JSON.parse(content);
    const picks = parsed.picks || [];

    // Deduplicate by domain — keep the first (highest-confidence) pick per domain
    const seenDomains = new Set<string>();
    const deduped = picks
      .filter((p: any) => p.url && p.confidence >= 50)
      .filter((p: any) => {
        const domain = extractDomain(p.url);
        if (seenDomains.has(domain)) return false;
        seenDomains.add(domain);
        return true;
      });

    return deduped
      .slice(0, 3)
      .map((p: any, i: number) => {
        const normalizedUrl = normalizeRegionalUrl(p.url);
        const domain = extractDomain(normalizedUrl);
        return {
          url: normalizedUrl,
          source: detectSource(domain),
          reason: p.reason || 'Product page found via search',
          label: p.label || `Buy on ${domain}`,
          priority: i + 1,
          affiliatable: isAffiliateable(domain),
        } satisfies LinkRecommendation;
      });
  } catch (error) {
    console.error('[SmartLinkFinder] AI ranking error:', error);
    return [];
  }
}

// --- LLM Fallback (original behavior) ---

async function findProductLinksViaLLM(product: ProductContext): Promise<SmartLinkResult> {
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

  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
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
}

// --- Main entry point ---

/**
 * Find the best product links using a two-stage pipeline:
 * 1. Google Web Search → AI Rank real product pages
 * 2. Fallback: LLM-generated search URLs
 * 3. Last resort: Google Shopping hardcoded URL
 */
export async function findBestProductLinks(
  product: ProductContext
): Promise<SmartLinkResult> {
  const productDescription = `${product.brand || ''} ${product.name}`.trim();

  // Stage 1: Try Google Web Search + AI Ranking
  try {
    const googleResults = await searchGoogleWeb(product);

    if (googleResults.length > 0) {
      const filtered = prefilterResults(googleResults, product);
      console.log(`[SmartLinkFinder] ${filtered.length}/${googleResults.length} results after prefilter`);

      if (filtered.length > 0) {
        const ranked = await rankResultsWithAI(filtered, product);

        if (ranked.length > 0) {
          console.log(`[SmartLinkFinder] Found ${ranked.length} real product links via Google+AI`);
          return {
            recommendations: ranked,
            primaryLink: ranked[0],
            reasoning: `Found real product pages via Google search for "${productDescription}"`,
          };
        }

        console.log('[SmartLinkFinder] AI ranking found no suitable product pages, falling back to LLM');
      } else {
        console.log('[SmartLinkFinder] All Google results filtered out, falling back to LLM');
      }
    } else {
      console.log('[SmartLinkFinder] No Google results, falling back to LLM');
    }
  } catch (error) {
    console.error('[SmartLinkFinder] Google+AI pipeline error:', error);
  }

  // Stage 2: Fallback to LLM-generated search URLs
  try {
    console.log('[SmartLinkFinder] Using LLM fallback for link generation');
    return await findProductLinksViaLLM(product);
  } catch (error) {
    console.error('[SmartLinkFinder] LLM fallback error:', error);
  }

  // Stage 3: Last resort — hardcoded Google Shopping URL
  console.log('[SmartLinkFinder] All pipelines failed, using Google Shopping fallback');
  const fallbackLink: LinkRecommendation = {
    url: `https://www.google.com/search?tbm=shop&q=${encodeURIComponent(productDescription)}`,
    source: 'google',
    reason: 'Fallback search',
    label: 'Find on Google Shopping',
    priority: 10,
    affiliatable: false,
  };

  return {
    recommendations: [fallbackLink],
    primaryLink: fallbackLink,
    reasoning: 'Using fallback search due to pipeline errors',
  };
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
