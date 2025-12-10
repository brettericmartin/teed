/**
 * Product Details Expert Agent
 * Wave 1 - Research Phase
 *
 * Analyzes technical specs, features, market positioning, and competitor comparisons
 * for hero products in the content idea.
 */

import { openai } from '@/lib/openaiClient';
import type { ProductDetailsExpertOutput } from '@/lib/types/teamGeneration';
import type {
  BaseAgent,
  AgentContext,
  AgentResult,
  LLMConfig,
} from './types';
import { formatHeroProductsForPrompt, formatProductsForPrompt, DEFAULT_LLM_CONFIGS } from './types';

const AGENT_NAME = 'productDetailsExpert' as const;
const DISPLAY_NAME = 'Product Details Expert';

class ProductDetailsExpertAgent implements BaseAgent<ProductDetailsExpertOutput> {
  name = AGENT_NAME;
  displayName = DISPLAY_NAME;
  wave = 1 as const;

  private config: LLMConfig;

  constructor(config?: Partial<LLMConfig>) {
    this.config = {
      ...DEFAULT_LLM_CONFIGS.research,
      ...config,
    };
  }

  getSystemPrompt(): string {
    return `You are a Product Details Expert for Teed.club's content generation team.

Your role is to provide DEEP technical analysis of products featured in creator content.

WHAT MAKES YOU VALUABLE:
- You go beyond surface-level specs to find MEANINGFUL differentiators
- You understand what makes products interesting to ENTHUSIASTS, not just consumers
- You identify the "why it matters" behind technical features
- You spot unusual/underrated features that make good content hooks

ANALYSIS FOCUS:
1. Technical specifications that matter for the vertical (golf, camera, tech, etc.)
2. What makes this product DIFFERENT from alternatives
3. Who this product is ACTUALLY for (be specific, not generic)
4. Hidden features or use cases most people miss
5. Build quality, materials, craftsmanship details

OUTPUT REQUIREMENTS:
- Be SPECIFIC with specs, not vague ("f/1.8 aperture" not "wide aperture")
- Include price positioning context
- Identify REAL competitors, not just any similar product
- Focus on story-worthy details that could hook viewers

Remember: Teed values STORY over commerce. Your analysis should surface details that make products INTERESTING, not just purchasable.`;
  }

  getUserPrompt(context: AgentContext): string {
    const { contentIdea, videoTitle, creatorName, vertical, products, heroProducts } = context;

    return `Analyze the products from this creator's content:

VIDEO: "${videoTitle}" by ${creatorName}
VERTICAL: ${vertical}

CONTENT IDEA:
Title: ${contentIdea.idea_title}
Summary: ${contentIdea.idea_summary}

HERO PRODUCTS (focus your analysis here):
${formatHeroProductsForPrompt(heroProducts)}

ALL PRODUCTS MENTIONED:
${formatProductsForPrompt(products, 15)}

CREATOR CONTEXT:
${contentIdea.why_interesting_to_creator || 'Not available'}

Provide detailed technical analysis. For EACH hero product, include:
1. Key specifications (be specific with numbers/measurements)
2. Unique features that differentiate it
3. Real competitor products and how this compares
4. Price positioning in the market
5. Target audience (be specific)
6. Best use cases

Also identify overall technical highlights that could make good content hooks.

Return JSON:
{
  "heroProductAnalysis": [
    {
      "productName": "Full product name",
      "specifications": {
        "key1": "specific value",
        "key2": "specific value"
      },
      "uniqueFeatures": ["Feature 1 that sets it apart", "Feature 2"],
      "competitorComparison": [
        {
          "competitor": "Competitor Product Name",
          "advantage": "What our product does better",
          "disadvantage": "What competitor does better"
        }
      ],
      "pricePositioning": "budget|mid-range|premium|luxury",
      "targetAudience": "Specific description of who this is for",
      "bestUseCases": ["Use case 1", "Use case 2"]
    }
  ],
  "technicalHighlights": [
    "Surprising technical fact that could hook viewers",
    "Interesting spec comparison",
    "Hidden feature most people don't know"
  ],
  "keySellingPoints": [
    "Main value proposition 1",
    "Main value proposition 2"
  ]
}`;
  }

  async execute(context: AgentContext): Promise<AgentResult<ProductDetailsExpertOutput>> {
    const startTime = Date.now();

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

      const parsed = JSON.parse(content) as ProductDetailsExpertOutput;
      const tokenUsage = response.usage?.total_tokens || 0;

      // Validate required fields
      if (!parsed.heroProductAnalysis || !Array.isArray(parsed.heroProductAnalysis)) {
        parsed.heroProductAnalysis = [];
      }
      if (!parsed.technicalHighlights || !Array.isArray(parsed.technicalHighlights)) {
        parsed.technicalHighlights = [];
      }
      if (!parsed.keySellingPoints || !Array.isArray(parsed.keySellingPoints)) {
        parsed.keySellingPoints = [];
      }

      return {
        success: true,
        data: parsed,
        tokenUsage,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error('[ProductDetailsExpert] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - startTime,
      };
    }
  }
}

// Factory function
export function createProductDetailsExpert(config?: Partial<LLMConfig>): ProductDetailsExpertAgent {
  return new ProductDetailsExpertAgent(config);
}

export { ProductDetailsExpertAgent };
