/**
 * Idea Agent - AI-Powered Bag Idea Suggestions
 *
 * Analyzes user's existing bags and generates personalized
 * creative bag ideas beyond traditional gear collections.
 */

import { openai } from '../openaiClient';
import { createClient } from '@supabase/supabase-js';
import type {
  IdeaCategory,
  BagIdea,
  SuggestedItem,
  UserContext,
  ExistingBagSummary,
  IdeaGenerationInput,
  IdeaGenerationResult,
  UserAnalysis,
} from './types';
import { IDEA_TEMPLATES, IDEA_CATEGORY_INFO } from './categories';

// Re-export types and categories
export * from './types';
export * from './categories';

// ============================================================================
// Supabase Client
// ============================================================================

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

// ============================================================================
// Retry Logic (matching existing patterns)
// ============================================================================

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

      if (error?.status === 400 || error?.status === 401) {
        throw error;
      }

      if (error?.status === 429 || error?.code === 'rate_limit_exceeded') {
        const delay = baseDelay * Math.pow(2, i);
        console.log(`[IdeaAgent] Rate limited, retrying in ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }

      if (i === maxRetries - 1) {
        throw error;
      }

      const delay = baseDelay * Math.pow(2, i);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// ============================================================================
// User Context Gathering
// ============================================================================

/**
 * Gather context about a user's existing bags and preferences
 */
export async function gatherUserContext(userId: string): Promise<UserContext> {
  const supabase = getSupabase();

  // Get user's bags with item counts
  const { data: bags, error: bagsError } = await supabase
    .from('bags')
    .select(`
      id,
      title,
      category,
      tags,
      bag_items (id)
    `)
    .eq('owner_id', userId)
    .order('created_at', { ascending: false });

  if (bagsError) {
    console.error('[IdeaAgent] Error fetching bags:', bagsError.message);
  }

  const existingBags: ExistingBagSummary[] = (bags || []).map((bag) => ({
    id: bag.id,
    title: bag.title,
    category: bag.category || 'other',
    itemCount: Array.isArray(bag.bag_items) ? bag.bag_items.length : 0,
    tags: bag.tags || [],
  }));

  // Calculate category distribution
  const categoryCounts: Record<string, number> = {};
  for (const bag of existingBags) {
    categoryCounts[bag.category] = (categoryCounts[bag.category] || 0) + 1;
  }
  const topCategories = Object.entries(categoryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([cat]) => cat);

  // Get preferred brands from bag items
  const bagIds = existingBags.map((b) => b.id);
  let preferredBrands: string[] = [];

  if (bagIds.length > 0) {
    const { data: items } = await supabase
      .from('bag_items')
      .select('brand')
      .in('bag_id', bagIds)
      .not('brand', 'is', null);

    if (items) {
      const brandCounts: Record<string, number> = {};
      for (const item of items) {
        if (item.brand) {
          brandCounts[item.brand] = (brandCounts[item.brand] || 0) + 1;
        }
      }
      preferredBrands = Object.entries(brandCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([brand]) => brand);
    }
  }

  // Calculate total items
  const totalItems = existingBags.reduce((sum, bag) => sum + bag.itemCount, 0);

  // Determine price range preference (simplified)
  const priceRange: 'budget' | 'mid-range' | 'premium' | 'mixed' = 'mixed';

  return {
    userId,
    existingBags,
    topCategories,
    preferredBrands,
    priceRange,
    totalItems,
  };
}

// ============================================================================
// AI Idea Generation
// ============================================================================

/**
 * Generate bag ideas using AI based on user context
 */
export async function generateIdeas(
  input: IdeaGenerationInput
): Promise<IdeaGenerationResult> {
  const startTime = Date.now();
  const limit = input.limit || 5;
  const creativityLevel = input.creativityLevel || 'balanced';

  // Gather user context
  const context = await gatherUserContext(input.userId);

  // Build context summary for prompt
  const existingBagsSummary = context.existingBags
    .slice(0, 10)
    .map((b) => `- "${b.title}" (${b.category}, ${b.itemCount} items)`)
    .join('\n');

  const templatesContext = IDEA_TEMPLATES
    .filter((t) => !input.focusCategory || t.category === input.focusCategory)
    .filter((t) => !input.excludeCategories?.includes(t.category))
    .slice(0, 10)
    .map((t) => `- ${t.name}: ${t.description} [${t.category}]`)
    .join('\n');

  const temperatureMap = {
    conservative: 0.4,
    balanced: 0.7,
    adventurous: 0.9,
  };

  const systemPrompt = `You are a creative collections curator who helps people organize their lives through thoughtful bag/list ideas.

Your job is to suggest personalized bag ideas that go beyond traditional gear collections. Think lifestyle setups, learning resources, gift guides, recipes, travel lists, and creative projects.

IMPORTANT:
- Suggest ideas that complement or expand on the user's existing interests
- Mix familiar territory (based on their bags) with creative new directions
- Be specific and actionable, not generic
- Each idea should feel achievable and inspiring
- Consider seasonal relevance and life moments

Categories you can suggest:
${Object.entries(IDEA_CATEGORY_INFO)
  .map(([cat, info]) => `- ${cat}: ${info.description}`)
  .join('\n')}

Return JSON with this exact structure:
{
  "ideas": [
    {
      "id": "unique-slug",
      "name": "Specific Name",
      "description": "Why this bag matters and what problem it solves",
      "category": "category-id",
      "whyItFits": "How this connects to user's existing interests",
      "suggestedItems": [
        {
          "name": "Item name",
          "category": "item category",
          "priority": "essential|recommended|optional",
          "reason": "Why include this",
          "estimatedPrice": "$XX-YY"
        }
      ],
      "estimatedBudget": "$XX-YY total range",
      "tags": ["tag1", "tag2"],
      "difficulty": "easy|medium|advanced"
    }
  ],
  "analysis": {
    "identifiedNiches": ["niche1", "niche2"],
    "collectionPatterns": ["pattern1", "pattern2"],
    "gapOpportunities": ["opportunity1", "opportunity2"],
    "personalityTraits": ["trait1", "trait2"]
  }
}`;

  const userPrompt = `Generate ${limit} creative bag ideas for this user.

USER'S EXISTING BAGS:
${existingBagsSummary || '(New user - no existing bags)'}

TOP CATEGORIES: ${context.topCategories.join(', ') || 'None yet'}
PREFERRED BRANDS: ${context.preferredBrands.slice(0, 5).join(', ') || 'Not determined'}
TOTAL ITEMS: ${context.totalItems}

${input.focusCategory ? `FOCUS ON CATEGORY: ${input.focusCategory}` : ''}
${input.excludeCategories?.length ? `AVOID CATEGORIES: ${input.excludeCategories.join(', ')}` : ''}

INSPIRATION TEMPLATES:
${templatesContext}

Generate ${limit} personalized, creative bag ideas with 3-5 suggested items each.`;

  try {
    const response = await retryWithBackoff(async () => {
      return await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 3000,
        temperature: temperatureMap[creativityLevel],
        response_format: { type: 'json_object' },
      });
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('No response from AI');
    }

    const parsed = JSON.parse(content);

    // Validate and sanitize ideas
    const ideas: BagIdea[] = (parsed.ideas || []).slice(0, limit).map((idea: any, idx: number) => ({
      id: idea.id || `idea-${idx}-${Date.now()}`,
      name: idea.name || 'Untitled Idea',
      description: idea.description || '',
      category: validateCategory(idea.category),
      whyItFits: idea.whyItFits || '',
      suggestedItems: (idea.suggestedItems || []).slice(0, 5).map((item: any) => ({
        name: item.name || 'Item',
        category: item.category || 'general',
        priority: validatePriority(item.priority),
        reason: item.reason || '',
        estimatedPrice: item.estimatedPrice,
      })),
      estimatedBudget: idea.estimatedBudget,
      complementsExisting: idea.complementsExisting,
      tags: idea.tags || [],
      difficulty: validateDifficulty(idea.difficulty),
    }));

    const analysis: UserAnalysis = {
      identifiedNiches: parsed.analysis?.identifiedNiches || [],
      collectionPatterns: parsed.analysis?.collectionPatterns || [],
      gapOpportunities: parsed.analysis?.gapOpportunities || [],
      personalityTraits: parsed.analysis?.personalityTraits || [],
    };

    console.log(`[IdeaAgent] Generated ${ideas.length} ideas in ${Date.now() - startTime}ms`);

    return {
      ideas,
      analysis,
      generatedAt: new Date(),
    };
  } catch (error: any) {
    console.error('[IdeaAgent] Error generating ideas:', error.message);
    throw error;
  }
}

// ============================================================================
// Quick Suggestions (Template-Based)
// ============================================================================

/**
 * Get quick template-based suggestions without AI
 * Useful for fast initial suggestions or when AI is unavailable
 */
export function getQuickSuggestions(
  context: UserContext,
  limit: number = 5
): BagIdea[] {
  const userCategories = new Set(context.topCategories);

  // Score templates based on relevance
  const scoredTemplates = IDEA_TEMPLATES.map((template) => {
    let score = 0;

    // Boost if related to user's categories
    if (userCategories.has(template.category)) {
      score += 2;
    }

    // Boost if tags overlap with user's bag tags
    const userTags = new Set(context.existingBags.flatMap((b) => b.tags));
    for (const tag of template.tags) {
      if (userTags.has(tag)) {
        score += 1;
      }
    }

    // Add some randomness for variety
    score += Math.random() * 2;

    return { template, score };
  });

  // Sort by score and take top N
  const topTemplates = scoredTemplates
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((s) => s.template);

  // Convert templates to BagIdea format
  return topTemplates.map((template, idx) => ({
    id: template.id,
    name: template.name,
    description: template.description,
    category: template.category,
    whyItFits: 'Based on your interests and collection patterns',
    suggestedItems: template.exampleItems.map((item, i) => ({
      name: item,
      category: template.category,
      priority: i < 2 ? 'essential' : i < 4 ? 'recommended' : 'optional',
      reason: '',
    })) as SuggestedItem[],
    tags: template.tags,
    difficulty: 'easy' as const,
  }));
}

// ============================================================================
// Helpers
// ============================================================================

function validateCategory(cat: string): IdeaCategory {
  const valid: IdeaCategory[] = [
    'gear', 'lifestyle', 'learning', 'recipes', 'travel',
    'gifts', 'creative', 'wellness', 'entertainment', 'seasonal',
  ];
  return valid.includes(cat as IdeaCategory) ? (cat as IdeaCategory) : 'gear';
}

function validatePriority(p: string): 'essential' | 'recommended' | 'optional' {
  const valid = ['essential', 'recommended', 'optional'];
  return valid.includes(p) ? (p as 'essential' | 'recommended' | 'optional') : 'recommended';
}

function validateDifficulty(d: string): 'easy' | 'medium' | 'advanced' {
  const valid = ['easy', 'medium', 'advanced'];
  return valid.includes(d) ? (d as 'easy' | 'medium' | 'advanced') : 'easy';
}
