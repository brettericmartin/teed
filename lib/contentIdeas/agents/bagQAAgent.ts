/**
 * Bag QA Agent
 * Wave 3 - Platform Phase (Optional)
 *
 * Reviews the linked Teed bag for quality improvements including
 * photo quality, descriptions, links, and item suggestions.
 * Only runs if a bag is linked to the content idea.
 */

import { openai } from '@/lib/openaiClient';
import type { BagQAOutput } from '@/lib/types/teamGeneration';
import type {
  BaseAgent,
  AgentContext,
  AgentResult,
  LLMConfig,
} from './types';
import { formatBagItemsForPrompt, formatProductsForPrompt, DEFAULT_LLM_CONFIGS } from './types';

const AGENT_NAME = 'bagQAAgent' as const;
const DISPLAY_NAME = 'Bag QA Agent';

class BagQAAgentClass implements BaseAgent<BagQAOutput> {
  name = AGENT_NAME;
  displayName = DISPLAY_NAME;
  wave = 3 as const;

  private config: LLMConfig;

  constructor(config?: Partial<LLMConfig>) {
    this.config = {
      ...DEFAULT_LLM_CONFIGS.qa,
      ...config,
    };
  }

  getSystemPrompt(): string {
    return `You are a Bag QA Agent for Teed.club's content generation team.

Your role is to review Teed bags and identify improvements that will make them more engaging and valuable.

TEED BAG QUALITY STANDARDS:

1. PHOTO QUALITY
   - Every item should have a clear, representative photo
   - Product photos > lifestyle photos > no photo
   - Missing photos hurt engagement significantly

2. DESCRIPTIONS
   - Should explain WHY the creator uses this item
   - Should mention any customizations or personal touches
   - Generic specs are less valuable than personal context

3. AFFILIATE LINKS
   - Items should have purchase links where possible
   - Amazon links are most common
   - Direct brand links are valuable
   - Missing links = missed revenue opportunity

4. ITEM COMPLETENESS
   - All products from the video should be in the bag
   - Related accessories shouldn't be forgotten
   - Consider what viewers will want to find

SCORING CRITERIA (0-100):
- 90-100: Publication ready, minimal improvements needed
- 70-89: Good foundation, some improvements recommended
- 50-69: Needs work before content goes live
- 0-49: Significant gaps that could hurt engagement

PRIORITY LEVELS:
- HIGH: Issues that will noticeably hurt engagement
- MEDIUM: Improvements that would help but aren't critical
- LOW: Nice-to-haves for polish`;
  }

  getUserPrompt(context: AgentContext): string {
    const { contentIdea, videoTitle, creatorName, products, bag, wave2Output } = context;

    if (!bag) {
      return 'No bag linked to this content idea.';
    }

    // Get viral content angle for context
    const primaryAngle = wave2Output?.viralityManager?.recommendedPrimaryAngle || 'Not specified';

    return `Review this Teed bag for quality improvements:

VIDEO: "${videoTitle}" by ${creatorName}

CONTENT ANGLE: ${primaryAngle}

═══════════════════════════════════════
BAG INFORMATION
═══════════════════════════════════════

Bag Name: ${bag.name}
Bag Code: ${bag.code}
Total Items: ${bag.items.length}
Has Cover Image: ${bag.coverImageUrl ? 'Yes' : 'No'}

CURRENT ITEMS IN BAG:
${formatBagItemsForPrompt(bag.items)}

═══════════════════════════════════════
PRODUCTS MENTIONED IN VIDEO
═══════════════════════════════════════
${formatProductsForPrompt(products, 20)}

═══════════════════════════════════════
YOUR TASK
═══════════════════════════════════════

Analyze the bag and provide:

1. OVERALL SCORE (0-100) with justification

2. PHOTO QUALITY ASSESSMENT
   - Which items have good/bad/missing photos?
   - Suggest search queries for better photos

3. DESCRIPTION IMPROVEMENTS
   - Which descriptions are weak?
   - Suggest improved versions with personal context

4. LINK ASSESSMENT
   - Which items are missing purchase links?
   - What link types are missing?
   - Provide search queries to find products

5. ITEM SUGGESTIONS
   - What products from the video are missing from the bag?
   - What related items would viewers expect to find?

6. PRIORITIZED ACTIONS
   - What should be fixed first?
   - High/Medium/Low priority with impact explanation

Return JSON:
{
  "overallScore": 72,
  "bagSummary": {
    "totalItems": 12,
    "itemsWithPhotos": 10,
    "itemsWithDescriptions": 8,
    "itemsWithAffiliateLinks": 6
  },
  "photoQualityAssessment": [
    {
      "itemId": "item-uuid",
      "itemName": "Product Name",
      "currentPhotoUrl": "url or null",
      "quality": "good|needs_improvement|missing",
      "recommendation": "What to do",
      "suggestedSearchQuery": "search query for better photo"
    }
  ],
  "descriptionImprovements": [
    {
      "itemId": "item-uuid",
      "itemName": "Product Name",
      "currentDescription": "Current text or null",
      "suggestedDescription": "Improved description with personal context",
      "reasoning": "Why this is better"
    }
  ],
  "linkAssessment": [
    {
      "itemId": "item-uuid",
      "itemName": "Product Name",
      "hasAffiliateLink": false,
      "currentLinks": ["url1", "url2"],
      "missingLinkTypes": ["amazon", "brand"],
      "searchQuery": "search query to find product"
    }
  ],
  "itemSuggestions": [
    {
      "productName": "Product to add",
      "brand": "Brand Name",
      "reasoning": "Why this should be in the bag",
      "mentionedInVideo": true,
      "searchQuery": "search query to find it",
      "estimatedPrice": "$XX",
      "category": "category suggestion"
    }
  ],
  "prioritizedActions": [
    {
      "priority": "high",
      "action": "What to do",
      "impact": "Why this matters"
    }
  ]
}`;
  }

  async execute(context: AgentContext): Promise<AgentResult<BagQAOutput>> {
    const startTime = Date.now();

    // Check if bag exists
    if (!context.bag) {
      return {
        success: false,
        error: 'No bag linked to this content idea - skipping Bag QA',
        durationMs: Date.now() - startTime,
      };
    }

    if (!context.wave2Output) {
      return {
        success: false,
        error: 'Bag QA Agent requires Wave 2 output to proceed',
        durationMs: Date.now() - startTime,
      };
    }

    try {
      const response = await openai.chat.completions.create({
        model: this.config.model,
        messages: [
          { role: 'system', content: this.getSystemPrompt() },
          { role: 'user', content: this.getUserPrompt(context) },
        ],
        response_format: { type: 'json_object' },
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
      });

      const content = response.choices[0]?.message?.content;
      if (!content) {
        return {
          success: false,
          error: 'No response from LLM',
          durationMs: Date.now() - startTime,
        };
      }

      const parsed = JSON.parse(content) as BagQAOutput;
      const tokenUsage = response.usage?.total_tokens || 0;

      // Validate required fields
      if (typeof parsed.overallScore !== 'number') parsed.overallScore = 50;
      if (!parsed.bagSummary) {
        parsed.bagSummary = {
          totalItems: context.bag.items.length,
          itemsWithPhotos: 0,
          itemsWithDescriptions: 0,
          itemsWithAffiliateLinks: 0,
        };
      }
      if (!parsed.photoQualityAssessment) parsed.photoQualityAssessment = [];
      if (!parsed.descriptionImprovements) parsed.descriptionImprovements = [];
      if (!parsed.linkAssessment) parsed.linkAssessment = [];
      if (!parsed.itemSuggestions) parsed.itemSuggestions = [];
      if (!parsed.prioritizedActions) parsed.prioritizedActions = [];

      return {
        success: true,
        data: parsed,
        tokenUsage,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error('[BagQAAgent] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - startTime,
      };
    }
  }
}

export function createBagQAAgent(config?: Partial<LLMConfig>): BagQAAgentClass {
  return new BagQAAgentClass(config);
}

export { BagQAAgentClass };
