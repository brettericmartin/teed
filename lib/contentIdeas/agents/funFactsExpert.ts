/**
 * Fun Facts Expert Agent
 * Wave 1 - Research Phase
 *
 * Discovers creator lore, product history, surprising facts, and emotional hooks
 * that can make content more engaging and shareable.
 */

import { openai } from '@/lib/openaiClient';
import type { FunFactsExpertOutput } from '@/lib/types/teamGeneration';
import type {
  BaseAgent,
  AgentContext,
  AgentResult,
  LLMConfig,
} from './types';
import { formatHeroProductsForPrompt, formatProductsForPrompt, DEFAULT_LLM_CONFIGS } from './types';

const AGENT_NAME = 'funFactsExpert' as const;
const DISPLAY_NAME = 'Fun Facts Expert';

class FunFactsExpertAgent implements BaseAgent<FunFactsExpertOutput> {
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
    return `You are a Fun Facts Expert for Teed.club's content generation team.

Your role is to uncover the STORIES behind products and creators that make content shareable and memorable.

WHAT MAKES YOU VALUABLE:
- You find the human stories behind gear choices
- You know product history that most people don't
- You identify emotional hooks that create connection
- You spot "did you know" moments that make people stop scrolling

TYPES OF FACTS YOU FIND:

1. CREATOR LORE
   - Why they chose this specific item
   - Personal stories/memories attached
   - Journey from beginner to current setup
   - Quirks or superstitions about their gear

2. PRODUCT HISTORY
   - When the product was released and why it mattered
   - Discontinued items and why they're special
   - Design evolution stories
   - Celebrity/pro users of the product
   - Manufacturing details that are interesting

3. SURPRISE FACTORS
   - Counterintuitive facts ("costs $50 but outperforms $500 alternatives")
   - Hidden features nobody uses
   - Unexpected use cases
   - Common misconceptions debunked

4. EMOTIONAL HOOKS
   - Nostalgia triggers
   - Achievement associations (what pros use, what won tournaments)
   - Underdog stories
   - Community inside jokes or references

OUTPUT REQUIREMENTS:
- Rate emotional weight (low/medium/high) based on shareability potential
- Include usage context (when/how to use this fact in content)
- Be truthful - if uncertain, say "reportedly" or "allegedly"
- Focus on facts that CREATE EMOTION, not just information`;
  }

  getUserPrompt(context: AgentContext): string {
    const { contentIdea, videoTitle, creatorName, vertical, products, heroProducts } = context;

    return `Uncover the stories and fun facts for this creator's content:

VIDEO: "${videoTitle}" by ${creatorName}
VERTICAL: ${vertical}

CONTENT IDEA:
Title: ${contentIdea.idea_title}
Summary: ${contentIdea.idea_summary}

HERO PRODUCTS:
${formatHeroProductsForPrompt(heroProducts)}

ALL PRODUCTS:
${formatProductsForPrompt(products, 12)}

CREATOR STORY (what we know):
${contentIdea.why_interesting_to_creator || 'Not available'}

AUDIENCE INTEREST:
${contentIdea.why_interesting_to_audience || 'Not available'}

Dig deep and find:
1. Creator facts - personal stories, journey, why they use this gear
2. Product history - when it was made, who used it, why it matters
3. "Did you know" facts that would surprise viewers
4. Surprising facts that challenge expectations
5. Emotional hooks that create connection

Return JSON:
{
  "creatorFacts": [
    {
      "fact": "The story or fact about the creator",
      "source": "How we know this (from video, from bio, inferred)",
      "emotionalWeight": "low|medium|high",
      "usageContext": "When to use this in content (hook, middle, cta)"
    }
  ],
  "productHistory": [
    {
      "fact": "Historical fact about a product",
      "yearRelevant": 2020,
      "verifiable": true
    }
  ],
  "didYouKnow": [
    "Short, punchy fact that would make someone say 'wait, really?'"
  ],
  "surprisingFacts": [
    "Counterintuitive or unexpected facts about the products/creator"
  ],
  "emotionalHooks": [
    "Statements designed to create emotional connection"
  ]
}`;
  }

  async execute(context: AgentContext): Promise<AgentResult<FunFactsExpertOutput>> {
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

      const parsed = JSON.parse(content) as FunFactsExpertOutput;
      const tokenUsage = response.usage?.total_tokens || 0;

      // Validate and default required fields
      if (!parsed.creatorFacts || !Array.isArray(parsed.creatorFacts)) {
        parsed.creatorFacts = [];
      }
      if (!parsed.productHistory || !Array.isArray(parsed.productHistory)) {
        parsed.productHistory = [];
      }
      if (!parsed.didYouKnow || !Array.isArray(parsed.didYouKnow)) {
        parsed.didYouKnow = [];
      }
      if (!parsed.surprisingFacts || !Array.isArray(parsed.surprisingFacts)) {
        parsed.surprisingFacts = [];
      }
      if (!parsed.emotionalHooks || !Array.isArray(parsed.emotionalHooks)) {
        parsed.emotionalHooks = [];
      }

      return {
        success: true,
        data: parsed,
        tokenUsage,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error('[FunFactsExpert] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - startTime,
      };
    }
  }
}

// Factory function
export function createFunFactsExpert(config?: Partial<LLMConfig>): FunFactsExpertAgent {
  return new FunFactsExpertAgent(config);
}

export { FunFactsExpertAgent };
