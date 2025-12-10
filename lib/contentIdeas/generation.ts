/**
 * Content Ideas Generation Module
 * LLM-powered functions for generating content ideas, hooks, and outlines
 */

import { openai } from '../openaiClient';
import type {
  ContentIdea,
  ContentTag,
  ContentVertical,
  ExtractedProduct,
  GenerateHooksOutput,
  GenerateIdeaOutput,
  GenerateShortFormOutput,
  HookOption,
  LongFormOutline,
  ShortFormIdea,
} from '../types/contentIdeas';

// ═══════════════════════════════════════════════════════════════════
// Video Type Detection
// ═══════════════════════════════════════════════════════════════════

export type VideoContentType = 'single_hero' | 'roundup' | 'comparison';

/**
 * Detect if a video is a roundup/deals/collection type
 * These videos feature multiple products equally, not one hero
 */
export function detectVideoContentType(title: string, description: string, productCount: number): VideoContentType {
  const titleLower = title.toLowerCase();
  const combined = `${title} ${description}`.toLowerCase();

  // FIRST: Check if title clearly indicates a SINGLE ITEM focus
  // These patterns indicate the video is about ONE specific product, regardless of how many products are extracted
  const singleItemTitlePatterns = [
    /review/i,                          // "Sony A7IV Review"
    /unboxing/i,                        // "Unboxing the new..."
    /hands[- ]?on/i,                    // "Hands-on with..."
    /first\s*(look|impressions)/i,      // "First Look at..."
    /testing/i,                         // "Testing the new..."
    /abusing/i,                         // "Abusing Canon's New R6"
    /breaking/i,                        // "Breaking in my new..."
    /one\s*(year|month|week)\s*(later|with)/i,  // "One year with..."
    /long[- ]?term/i,                   // "Long-term review"
    /honest\s*(thoughts|review)/i,      // "Honest thoughts on..."
    /is\s*(it|the)\s+worth/i,           // "Is the X worth it?"
    /should\s+you\s+(buy|get)/i,        // "Should you buy..."
    /why\s+i\s+(bought|got|switched)/i, // "Why I bought..."
    /my\s+new/i,                        // "My new camera"
    /finally\s+got/i,                   // "Finally got the..."
    /switching\s+to/i,                  // "Switching to Sony"
  ];

  // If title indicates single item focus, don't treat as roundup
  const isSingleItemTitle = singleItemTitlePatterns.some(pattern => pattern.test(titleLower));

  if (isSingleItemTitle) {
    // Even with many products, title clearly indicates single-item focus
    // Check for comparison still
    const comparisonPatterns = [
      /\bvs\.?\b/i,
      /versus/i,
      /compared?\s+to/i,
      /which\s*(one|is\s*better)/i,
    ];

    if (comparisonPatterns.some(pattern => pattern.test(titleLower))) {
      return 'comparison';
    }

    return 'single_hero';
  }

  // Roundup patterns - videos featuring multiple products equally
  // These MUST be in the TITLE to count (description alone isn't enough)
  const roundupTitlePatterns = [
    /^\d+\s*(best|top|favorite|essential|must.?have|recommended)/i,  // "14 Best..."
    /^best\s+\d+/i,                                                   // "Best 10..."
    /^top\s*\d+/i,                                                    // "Top 10..."
    /^\d+\s*(thing|item|product|gadget|gear|tool|accessory)/i,       // "14 Items..."
    /(black\s*friday|cyber\s*monday|prime\s*day)\s*(deal|sale)/i,    // "Black Friday Deals"
    /gift\s*guide/i,                                                  // "Gift Guide"
    /roundup/i,                                                       // "Gear Roundup"
    /haul\b/i,                                                        // "Tech Haul"
    /what\s*i\s*(bought|got|ordered)/i,                              // "What I Bought"
    /favorites\s*(of|from|for)\s*\d{4}/i,                            // "Favorites of 2024"
  ];

  // Comparison patterns
  const comparisonPatterns = [
    /\bvs\.?\b/i,
    /versus/i,
    /compared?\s+to/i,
    /which\s*(one|is\s*better)/i,
    /\bor\b.*\?$/i, // "X or Y?" at end
  ];

  // Check if TITLE explicitly indicates roundup
  const isRoundupTitle = roundupTitlePatterns.some(pattern => pattern.test(titleLower));

  if (isRoundupTitle) {
    return 'roundup';
  }

  // Check for comparison
  if (comparisonPatterns.some(pattern => pattern.test(titleLower))) {
    return 'comparison';
  }

  // Only fall back to product count if title is ambiguous AND has VERY many products
  // AND description also suggests it's a list
  const descriptionListPatterns = [
    /here\s*(are|is)\s*(my|the|our)\s*\d+/i,
    /\d+\s*items\s*(i|we)/i,
    /everything\s*(in|from)\s*(my|the)/i,
  ];

  const hasListDescription = descriptionListPatterns.some(p => p.test(combined));
  const veryManyProducts = productCount >= 10;

  if (veryManyProducts && hasListDescription) {
    return 'roundup';
  }

  // Default to single_hero - most videos focus on one main thing
  return 'single_hero';
}

// ═══════════════════════════════════════════════════════════════════
// Retry Logic
// ═══════════════════════════════════════════════════════════════════

async function retryWithBackoff<T>(fn: () => Promise<T>, maxRetries = 3, baseDelay = 1000): Promise<T> {
  let lastError: Error;

  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error as Error;
      const errorWithStatus = error as { status?: number; code?: string };

      // Don't retry on certain errors
      if (errorWithStatus?.status === 400 || errorWithStatus?.status === 401) {
        throw error;
      }

      // Check if rate limited
      if (errorWithStatus?.status === 429 || errorWithStatus?.code === 'rate_limit_exceeded') {
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

// ═══════════════════════════════════════════════════════════════════
// Product Extraction from Video
// ═══════════════════════════════════════════════════════════════════

export async function extractProductsFromVideo(
  videoTitle: string,
  videoDescription: string,
  vertical: ContentVertical,
  extractedLinks: Array<{ url: string; label?: string }> = []
): Promise<ExtractedProduct[]> {
  const prompt = `You are analyzing a "${vertical}" gear/setup video to extract products mentioned.

VIDEO TITLE: ${videoTitle}

VIDEO DESCRIPTION:
${videoDescription.slice(0, 4000)}

LINKS FOUND IN DESCRIPTION:
${extractedLinks.map(l => `- ${l.label || 'Link'}: ${l.url}`).join('\n') || 'None'}

Extract ALL products/items mentioned or implied. For each product:
1. Identify brand and specific model name when possible
2. Estimate the category (club type for golf, camera body/lens/accessory for camera, etc.)
3. Note any context about WHY the creator uses/mentions this item
4. Score each product for "hero potential" (0-100) based on:
   - Story/emotional weight (creator shares personal story, nostalgia, sentiment)
   - Uniqueness/differentiation (unusual choice, custom, rare, vintage, discontinued)
   - Visual/viral potential (interesting look, surprising choice, controversial)
   - How much the creator talks about it

   NOTE: Do NOT score highly just because it's new or expensive. Score based on STORY and INTEREST.

5. List "story signals" - evidence that this item has a story (e.g., "creator mentioned winning a tournament", "inherited from father", "10 years old", "discontinued model")

Return JSON array with this structure:
{
  "products": [
    {
      "name": "Specific Product Name",
      "brand": "Brand Name",
      "category": "category/subcategory",
      "modelNumber": "if known",
      "estimatedPrice": "$XXX" or "N/A" if unknown/vintage,
      "mentionContext": "Brief context of how/why creator mentions this",
      "isHeroCandidate": true/false,
      "heroScore": 0-100,
      "storySignals": ["signal1", "signal2"]
    }
  ]
}`;

  const response = await retryWithBackoff(() =>
    openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.3,
      max_tokens: 2000,
    })
  );

  const content = response.choices[0]?.message?.content;
  if (!content) {
    return [];
  }

  try {
    const parsed = JSON.parse(content);
    return parsed.products || [];
  } catch {
    console.error('Failed to parse product extraction response:', content);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════
// Idea Generation
// ═══════════════════════════════════════════════════════════════════

export async function generateIdeaFromSource(
  videoTitle: string,
  videoDescription: string,
  creatorName: string,
  vertical: ContentVertical,
  products: ExtractedProduct[],
  hasCreatorAffiliate: boolean
): Promise<GenerateIdeaOutput> {
  // Detect video content type
  const contentType = detectVideoContentType(videoTitle, videoDescription, products.length);

  // For roundup videos, use a different prompt that focuses on the collection
  if (contentType === 'roundup') {
    return generateRoundupIdea(videoTitle, creatorName, vertical, products, hasCreatorAffiliate);
  }

  // Sort products by hero score to identify top heroes
  const heroProducts = products
    .filter(p => p.isHeroCandidate)
    .sort((a, b) => (b.heroScore || 0) - (a.heroScore || 0))
    .slice(0, 3);

  const heroContext = heroProducts
    .map(
      (p, i) =>
        `${i + 1}. ${p.brand || ''} ${p.name} (Hero Score: ${p.heroScore})
   Context: ${p.mentionContext || 'N/A'}
   Story Signals: ${p.storySignals?.join(', ') || 'None'}`
    )
    .join('\n\n');

  const prompt = `You are a content strategist for Teed.club, a platform that connects people through the gear they find interesting.

Teed's philosophy:
- Commerce is secondary to STORY and CONNECTION
- Older gear, discontinued items, and sentimental pieces are just as valuable as new releases
- The "why it matters" is more important than specs or price

VIDEO: "${videoTitle}" by ${creatorName}
VERTICAL: ${vertical}

TOP HERO CANDIDATES:
${heroContext || 'None identified yet'}

ALL PRODUCTS MENTIONED:
${products.map(p => `- ${p.brand || ''} ${p.name}: ${p.mentionContext || 'mentioned'}`).join('\n')}

CREATOR HAS AFFILIATE LINKS: ${hasCreatorAffiliate ? 'Yes - respect their links' : 'No'}

Generate content idea with these fields:

1. idea_title: Catchy title focusing on STORY not specs (e.g., "The $40 Putter Tiger Woods Couldn't Beat" not "New Scotty Cameron Review")

2. idea_summary: 2-3 sentences capturing the interesting angle. Lead with story/emotion.

3. why_interesting_to_creator: 1-2 paragraphs from the creator's POV. Why does this gear matter to THEM? Focus on:
   - Personal journey/history with the item
   - Emotional significance (wins, memories, gifts)
   - Why they chose it over alternatives
   - Any quirks or customizations

4. why_interesting_to_audience: 1-2 paragraphs on why viewers should care. Focus on:
   - Relatability ("we've all had that one club we can't quit")
   - Aspiration (achievable, not just "buy expensive gear")
   - Learning/curiosity (what can viewers learn?)
   - Connection (how does this help viewers find their community?)

5. tags: Array of relevant tags from: sentimental, tour-pro, budget, retro, high-tech, underrated, viral, trending, classic, unique, discontinued, rare, custom, diy, sponsored, celebrity

6. affiliate_notes: Brief explanation of link priority policy for this video

7. hero_catalog_item_ids: Leave empty (will be populated after catalog matching)

Return as JSON:
{
  "idea_title": "...",
  "idea_summary": "...",
  "why_interesting_to_creator": "...",
  "why_interesting_to_audience": "...",
  "tags": ["tag1", "tag2"],
  "affiliate_notes": "...",
  "has_creator_affiliate": ${hasCreatorAffiliate},
  "hero_catalog_item_ids": []
}`;

  const response = await retryWithBackoff(() =>
    openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1500,
    })
  );

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from LLM');
  }

  const parsed = JSON.parse(content);
  return {
    idea_title: parsed.idea_title || `${creatorName}'s ${vertical} Setup`,
    idea_summary: parsed.idea_summary || '',
    why_interesting_to_creator: parsed.why_interesting_to_creator || '',
    why_interesting_to_audience: parsed.why_interesting_to_audience || '',
    tags: (parsed.tags || []) as ContentTag[],
    affiliate_notes: parsed.affiliate_notes || '',
    has_creator_affiliate: hasCreatorAffiliate,
    hero_catalog_item_ids: [],
  };
}

/**
 * Generate content idea for roundup/deals videos
 * These feature multiple products equally, not one hero
 */
async function generateRoundupIdea(
  videoTitle: string,
  creatorName: string,
  vertical: ContentVertical,
  products: ExtractedProduct[],
  hasCreatorAffiliate: boolean
): Promise<GenerateIdeaOutput> {
  // Group products by category for better organization
  const categories = new Map<string, ExtractedProduct[]>();
  products.forEach(p => {
    const cat = p.category || 'other';
    if (!categories.has(cat)) categories.set(cat, []);
    categories.get(cat)!.push(p);
  });

  // Get top products by score (up to 8 for roundup)
  const topProducts = products
    .sort((a, b) => (b.heroScore || 0) - (a.heroScore || 0))
    .slice(0, 8);

  const productsContext = topProducts
    .map((p, i) => `${i + 1}. ${p.brand || ''} ${p.name} - ${p.mentionContext || 'featured'}`)
    .join('\n');

  const categorySummary = Array.from(categories.entries())
    .map(([cat, prods]) => `${cat}: ${prods.length} items`)
    .join(', ');

  const prompt = `You are a content strategist for Teed.club, a platform that connects people through the gear they find interesting.

This is a ROUNDUP/COLLECTION video - it features multiple products equally, not a single hero item.

VIDEO: "${videoTitle}" by ${creatorName}
VERTICAL: ${vertical}
TOTAL PRODUCTS: ${products.length}
CATEGORIES: ${categorySummary}

TOP FEATURED PRODUCTS:
${productsContext}

CREATOR HAS AFFILIATE LINKS: ${hasCreatorAffiliate ? 'Yes - respect their links' : 'No'}

Generate content idea that focuses on THE COLLECTION as a whole, not any single item.

For roundup content, the story is about:
- The curator's perspective and taste
- Discovering multiple interesting products
- Value and variety for the audience
- Building a complete kit/setup

1. idea_title: A catchy title about the COLLECTION, not one item. Examples:
   - "14 Game-Changing EDC Picks from a Gear Expert"
   - "The Ultimate Black Friday Tech Haul Worth Your Money"
   - "A Photographer's Top 10 Holiday Gift Picks Under $100"

2. idea_summary: 2-3 sentences about what makes THIS COLLECTION interesting. What's the theme? What makes the curator's picks special?

3. why_interesting_to_creator: 1-2 paragraphs about WHY the creator curated THIS specific collection:
   - What's their selection criteria?
   - Why these items over others?
   - Any personal experience with these products?
   - What gap does this collection fill?

4. why_interesting_to_audience: 1-2 paragraphs on why viewers should explore this collection:
   - What problem does it solve?
   - Value proposition (budget-friendly? premium quality?)
   - Discovery opportunity (find something new)
   - Trust in the curator's taste

5. tags: Array of relevant tags from: roundup, deals, gift-guide, budget, premium, trending, viral, curated, collection, best-of, comparison, seasonal

6. affiliate_notes: Brief explanation of link priority for this roundup video

Return as JSON:
{
  "idea_title": "...",
  "idea_summary": "...",
  "why_interesting_to_creator": "...",
  "why_interesting_to_audience": "...",
  "tags": ["roundup", ...],
  "affiliate_notes": "...",
  "has_creator_affiliate": ${hasCreatorAffiliate},
  "hero_catalog_item_ids": []
}`;

  const response = await retryWithBackoff(() =>
    openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1500,
    })
  );

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from LLM');
  }

  const parsed = JSON.parse(content);
  return {
    idea_title: parsed.idea_title || `${creatorName}'s ${vertical} Roundup`,
    idea_summary: parsed.idea_summary || '',
    why_interesting_to_creator: parsed.why_interesting_to_creator || '',
    why_interesting_to_audience: parsed.why_interesting_to_audience || '',
    tags: (parsed.tags || ['roundup']) as ContentTag[],
    affiliate_notes: parsed.affiliate_notes || '',
    has_creator_affiliate: hasCreatorAffiliate,
    hero_catalog_item_ids: [],
  };
}

// ═══════════════════════════════════════════════════════════════════
// Hook and Long-Form Outline Generation
// ═══════════════════════════════════════════════════════════════════

export async function generateHooksAndLongForm(
  contentIdea: ContentIdea,
  heroProducts: ExtractedProduct[],
  allProducts?: ExtractedProduct[]
): Promise<GenerateHooksOutput> {
  // Detect if this is a roundup based on tags or product count
  const isRoundup = contentIdea.tags?.includes('roundup') ||
    contentIdea.tags?.includes('collection') ||
    contentIdea.tags?.includes('deals') ||
    (allProducts && allProducts.length >= 5);

  if (isRoundup && allProducts) {
    return generateRoundupHooks(contentIdea, allProducts);
  }

  const heroContext = heroProducts
    .map(
      p =>
        `- ${p.brand || ''} ${p.name}
  Context: ${p.mentionContext || 'N/A'}
  Story Signals: ${p.storySignals?.join(', ') || 'None'}`
    )
    .join('\n');

  const prompt = `You are creating content assets for Teed.club's Social Media Manager.

CONTENT IDEA:
Title: ${contentIdea.idea_title}
Summary: ${contentIdea.idea_summary}
Vertical: ${contentIdea.vertical}

WHY IT'S INTERESTING (Creator POV):
${contentIdea.why_interesting_to_creator}

WHY IT'S INTERESTING (Audience POV):
${contentIdea.why_interesting_to_audience}

HERO PRODUCTS:
${heroContext || 'None specified'}

Generate:

1. hook_options: 8-10 short-form hooks. Each hook should:
   - Be under 15 words
   - Create curiosity or emotional pull
   - Work for TikTok/Reels/Shorts
   - NOT be clickbait - must deliver on promise
   - Focus on STORY not specs

   Include variety of styles: curiosity, controversy, story, question, reveal, comparison

2. long_form_outline: Structured outline for 8-12 minute YouTube video:
   - intro: Hook + promise (30 seconds)
   - creatorStory: The creator's personal journey with this gear (2-3 min)
   - heroBreakdown: Deep dive on hero item(s) - why it matters, not just specs (3-4 min)
   - comparison: How this compares to alternatives (optional, 2 min)
   - demonstration: Showing it in action (optional, 2 min)
   - bagContext: How this fits into the creator's full setup/bag on Teed (1-2 min)
   - cta: Invite to explore the bag on Teed, connect with similar gear lovers (30 sec)
   - estimatedDurationMinutes: total

Return as JSON:
{
  "hook_options": [
    {
      "hook": "The hook text",
      "platform": "tiktok|reels|shorts|all",
      "style": "curiosity|controversy|story|question|reveal|comparison"
    }
  ],
  "long_form_outline": {
    "intro": "...",
    "creatorStory": "...",
    "heroBreakdown": "...",
    "comparison": "...",
    "demonstration": "...",
    "bagContext": "...",
    "cta": "...",
    "estimatedDurationMinutes": 10
  }
}`;

  const response = await retryWithBackoff(() =>
    openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.8, // Higher creativity for hooks
      max_tokens: 2000,
    })
  );

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from LLM');
  }

  const parsed = JSON.parse(content);

  return {
    hook_options: (parsed.hook_options || []) as HookOption[],
    long_form_outline: (parsed.long_form_outline || null) as LongFormOutline,
  };
}

/**
 * Generate hooks and outline for roundup/collection videos
 */
async function generateRoundupHooks(
  contentIdea: ContentIdea,
  products: ExtractedProduct[]
): Promise<GenerateHooksOutput> {
  const topProducts = products
    .sort((a, b) => (b.heroScore || 0) - (a.heroScore || 0))
    .slice(0, 8);

  const productsContext = topProducts
    .map((p, i) => `${i + 1}. ${p.brand || ''} ${p.name}`)
    .join('\n');

  const prompt = `You are creating content assets for Teed.club's Social Media Manager.

This is a ROUNDUP/COLLECTION content - focus on the variety, not any single item.

CONTENT IDEA:
Title: ${contentIdea.idea_title}
Summary: ${contentIdea.idea_summary}
Vertical: ${contentIdea.vertical}

FEATURED PRODUCTS (${products.length} total):
${productsContext}

WHY IT'S INTERESTING (Creator POV):
${contentIdea.why_interesting_to_creator}

WHY IT'S INTERESTING (Audience POV):
${contentIdea.why_interesting_to_audience}

Generate:

1. hook_options: 8-10 short-form hooks for ROUNDUP content. Each hook should:
   - Be under 15 words
   - Focus on the COLLECTION/VALUE, not one item
   - Use list/number appeal (e.g., "14 items that changed my workflow")
   - Create curiosity about what's on the list
   - Work for TikTok/Reels/Shorts

   Hook styles for roundups: list-curiosity, value-prop, surprise-find, deal-alert, must-have, underrated-picks

2. long_form_outline: Structured outline for 10-15 minute YouTube roundup video:
   - intro: Hook + what we're covering + why this list matters (1 min)
   - curatorCredentials: Why trust this creator's picks? Their background/expertise (1 min)
   - topPicks: Highlight 3-5 standout items with brief "why I picked this" (5-7 min)
   - hiddenGems: 2-3 underrated items most people overlook (2-3 min)
   - budgetPicks: Value options for those on a budget (optional, 1-2 min)
   - bagContext: See the full collection on Teed + explore similar curated bags (1-2 min)
   - cta: Invite to check out the complete list on Teed (30 sec)
   - estimatedDurationMinutes: total

Return as JSON:
{
  "hook_options": [
    {
      "hook": "The hook text",
      "platform": "tiktok|reels|shorts|all",
      "style": "list-curiosity|value-prop|surprise-find|deal-alert|must-have|underrated-picks"
    }
  ],
  "long_form_outline": {
    "intro": "...",
    "curatorCredentials": "...",
    "topPicks": "...",
    "hiddenGems": "...",
    "budgetPicks": "...",
    "bagContext": "...",
    "cta": "...",
    "estimatedDurationMinutes": 12
  }
}`;

  const response = await retryWithBackoff(() =>
    openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 2000,
    })
  );

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from LLM');
  }

  const parsed = JSON.parse(content);

  return {
    hook_options: (parsed.hook_options || []) as HookOption[],
    long_form_outline: (parsed.long_form_outline || null) as LongFormOutline,
  };
}

// ═══════════════════════════════════════════════════════════════════
// Short-Form Ideas from Long-Form
// ═══════════════════════════════════════════════════════════════════

export async function generateShortFormFromLongForm(
  longFormOutline: LongFormOutline,
  heroProducts: ExtractedProduct[],
  vertical: ContentVertical
): Promise<GenerateShortFormOutput> {
  const prompt = `You are creating short-form content ideas from a long-form video outline.

LONG-FORM OUTLINE:
${JSON.stringify(longFormOutline, null, 2)}

HERO PRODUCTS:
${heroProducts.map(p => `- ${p.brand || ''} ${p.name}: ${p.mentionContext || ''}`).join('\n')}

VERTICAL: ${vertical}

Generate 5-8 short-form video ideas that could be extracted from this long-form content.

Each short should:
- Be 15-60 seconds
- Have a clear hook and narrative arc
- Focus on ONE specific moment, insight, or product
- Work as standalone content
- Drive curiosity about the full video/bag

Variety of beat types:
- story: Personal narrative moment
- tip: Actionable advice or insight
- comparison: A vs B moment
- reaction: Surprising reveal or reaction
- reveal: Showing something unexpected

Return as JSON:
{
  "short_form_ideas": [
    {
      "hook": "Opening hook text",
      "narrative": "Brief description of the 15-60 second narrative",
      "durationSeconds": 30,
      "onScreenText": ["Text overlay 1", "Text overlay 2"],
      "beatType": "story|tip|comparison|reaction|reveal",
      "platform": "tiktok|reels|shorts"
    }
  ]
}`;

  const response = await retryWithBackoff(() =>
    openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.8,
      max_tokens: 1500,
    })
  );

  const content = response.choices[0]?.message?.content;
  if (!content) {
    throw new Error('No response from LLM');
  }

  const parsed = JSON.parse(content);

  return {
    short_form_ideas: (parsed.short_form_ideas || []) as ShortFormIdea[],
  };
}

// ═══════════════════════════════════════════════════════════════════
// Full Generation Pipeline
// ═══════════════════════════════════════════════════════════════════

export interface FullGenerationResult {
  products: ExtractedProduct[];
  ideaOutput: GenerateIdeaOutput;
  hooksOutput: GenerateHooksOutput;
  shortFormOutput: GenerateShortFormOutput;
}

export async function runFullGenerationPipeline(
  videoTitle: string,
  videoDescription: string,
  creatorName: string,
  vertical: ContentVertical,
  extractedLinks: Array<{ url: string; label?: string }>,
  hasCreatorAffiliate: boolean
): Promise<FullGenerationResult> {
  // Step 1: Extract products
  const products = await extractProductsFromVideo(videoTitle, videoDescription, vertical, extractedLinks);

  // Step 2: Generate idea
  const ideaOutput = await generateIdeaFromSource(
    videoTitle,
    videoDescription,
    creatorName,
    vertical,
    products,
    hasCreatorAffiliate
  );

  // Create partial ContentIdea for hook generation
  const partialIdea: ContentIdea = {
    id: '',
    source_platform: 'youtube',
    source_url: '',
    source_channel_name: creatorName,
    source_creator_handle: null,
    source_published_at: null,
    source_metadata: {},
    primary_bag_id: null,
    primary_catalog_item_id: null,
    hero_catalog_item_ids: [],
    hero_bag_item_ids: [],
    vertical,
    idea_title: ideaOutput.idea_title,
    idea_summary: ideaOutput.idea_summary,
    why_interesting_to_creator: ideaOutput.why_interesting_to_creator,
    why_interesting_to_audience: ideaOutput.why_interesting_to_audience,
    hook_options: [],
    long_form_outline: null,
    short_form_ideas: [],
    tags: ideaOutput.tags,
    affiliate_notes: ideaOutput.affiliate_notes,
    has_creator_affiliate: hasCreatorAffiliate,
    status: 'new',
    created_by_admin_id: null,
    reviewed_at: null,
    approved_at: null,
    // Staged workflow fields
    discovered_at: null,
    screened_at: null,
    generated_at: null,
    screened_by_admin_id: null,
    screening_notes: null,
    extracted_products: products,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Get hero products
  const heroProducts = products.filter(p => p.isHeroCandidate).sort((a, b) => (b.heroScore || 0) - (a.heroScore || 0));

  // Step 3: Generate hooks and long-form outline
  // Pass all products for roundup detection
  const hooksOutput = await generateHooksAndLongForm(partialIdea, heroProducts, products);

  // Step 4: Generate short-form ideas
  const shortFormOutput = await generateShortFormFromLongForm(
    hooksOutput.long_form_outline || {
      intro: '',
      creatorStory: '',
      heroBreakdown: '',
      bagContext: '',
      cta: '',
    },
    heroProducts,
    vertical
  );

  return {
    products,
    ideaOutput,
    hooksOutput,
    shortFormOutput,
  };
}
