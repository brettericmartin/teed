/**
 * TikTok Specialist Agent
 * Wave 3 - Platform Phase
 *
 * Creates TikTok-native content with trend integrations, sounds, hashtags,
 * and format suggestions optimized for the TikTok algorithm.
 */

import { openai } from '@/lib/openaiClient';
import type { TikTokContent } from '@/lib/types/teamGeneration';
import type {
  BaseAgent,
  AgentContext,
  AgentResult,
  LLMConfig,
} from './types';
import { formatHeroProductsForPrompt, DEFAULT_LLM_CONFIGS } from './types';

const AGENT_NAME = 'tiktokSpecialist' as const;
const DISPLAY_NAME = 'TikTok Specialist';

class TikTokSpecialistAgent implements BaseAgent<TikTokContent> {
  name = AGENT_NAME;
  displayName = DISPLAY_NAME;
  wave = 3 as const;

  private config: LLMConfig;

  constructor(config?: Partial<LLMConfig>) {
    this.config = {
      ...DEFAULT_LLM_CONFIGS.creative,
      ...config,
    };
  }

  getSystemPrompt(): string {
    return `You are a TikTok Specialist for Teed.club's content generation team.

You create NATIVE TikTok content that feels like it belongs on the platform.

TIKTOK ALGORITHM UNDERSTANDING:
- First 1-3 seconds determine if someone keeps watching
- Watch time percentage matters more than total views
- Comments boost visibility more than likes
- Shares are the ultimate engagement signal
- Sounds can make or break content

CONTENT FORMATS THAT WORK:
1. Story hooks ("I had no idea this $40 thing would...")
2. Controversy/opinion ("This is why I'll never buy...")
3. Educational reveals ("The real reason pros use...")
4. Transformation ("Before I found this vs after...")
5. Response/stitch format ("Replying to @user who asked...")

SOUND STRATEGY:
- Original audio works best for story content
- Trending sounds work for quick cuts/montages
- Don't force a sound that doesn't fit

HASHTAG STRATEGY:
- 3-5 hashtags max
- Mix broad (#tech) with niche (#golfgear)
- Don't use #fyp or #viral (spam signals)
- Community-specific tags perform best

SCRIPT STRUCTURE (for 30-60 sec):
- Hook: 0-3 sec (pattern interrupt)
- Setup: 3-10 sec (why should I care)
- Value: 10-40 sec (the meat)
- Payoff: 40-55 sec (satisfying conclusion)
- CTA: 55-60 sec (optional, don't be pushy)`;
  }

  getUserPrompt(context: AgentContext): string {
    const { contentIdea, videoTitle, creatorName, vertical, heroProducts, wave2Output } = context;

    // Extract Virality Manager insights
    let viralityInsights = '';
    let topHooks: string[] = [];
    if (wave2Output?.viralityManager) {
      const vm = wave2Output.viralityManager;
      viralityInsights = `
Primary Angle: ${vm.recommendedPrimaryAngle || 'Not specified'}

Top Content Angles:
${vm.contentAngles?.slice(0, 3).map(a => `- ${a.angle} (${a.viralityScore}/100)`).join('\n') || 'None'}

Watch Time Tips:
${vm.algorithmInsights?.watchTimeOptimizations?.join('\n- ') || 'None'}

Engagement Triggers:
${vm.algorithmInsights?.engagementTriggers?.join('\n- ') || 'None'}

Trend Alignments:
${vm.trendAlignments?.slice(0, 3).map(t => `- ${t.trend}: ${t.howToLeverage}`).join('\n') || 'None'}`;

      topHooks = vm.hookCandidates
        ?.filter(h => h.platform === 'tiktok' || h.platform === 'all')
        ?.slice(0, 5)
        ?.map(h => h.hook) || [];
    }

    return `Create TikTok-native content for this idea:

VIDEO: "${videoTitle}" by ${creatorName}
VERTICAL: ${vertical}

CONTENT IDEA:
Title: ${contentIdea.idea_title}
Summary: ${contentIdea.idea_summary}

HERO PRODUCTS:
${formatHeroProductsForPrompt(heroProducts)}

═══════════════════════════════════════
VIRALITY MANAGER GUIDANCE
═══════════════════════════════════════
${viralityInsights}

TOP HOOKS FROM VIRALITY MANAGER:
${topHooks.map((h, i) => `${i + 1}. "${h}"`).join('\n') || 'None provided'}

═══════════════════════════════════════
YOUR TASK
═══════════════════════════════════════

Create TikTok-optimized content including:
1. Platform-native hooks with virality scores
2. Trend integrations that feel natural
3. Sound/music suggestions
4. Hashtag strategy (3-5 max, no #fyp)
5. Format suggestions (stitches, duets, POV, etc.)
6. Full script outline with timing

Return JSON:
{
  "hooks": [
    {
      "text": "Hook text optimized for TikTok",
      "viralityScore": 65,
      "timing": "0-3 seconds"
    }
  ],
  "trendIntegrations": [
    {
      "trend": "Current TikTok trend",
      "howToUse": "How to naturally integrate",
      "soundSuggestion": "Suggested sound/audio if applicable"
    }
  ],
  "hashtags": ["techtoker", "gearreview", "productname"],
  "soundSuggestions": [
    "Original audio - storytelling works best",
    "Alternative: [trending sound name] for quick cuts"
  ],
  "formatSuggestions": [
    "POV: You just discovered...",
    "Stitch format responding to common question"
  ],
  "scriptOutline": [
    {
      "section": "Hook",
      "duration": "0-3 sec",
      "content": "What to say/show"
    },
    {
      "section": "Setup",
      "duration": "3-10 sec",
      "content": "Why this matters"
    },
    {
      "section": "Value",
      "duration": "10-40 sec",
      "content": "The main content"
    },
    {
      "section": "Payoff",
      "duration": "40-55 sec",
      "content": "Satisfying conclusion"
    }
  ],
  "captionTemplates": [
    "Caption with personality that matches the video vibe"
  ]
}`;
  }

  async execute(context: AgentContext): Promise<AgentResult<TikTokContent>> {
    const startTime = Date.now();

    if (!context.wave2Output) {
      return {
        success: false,
        error: 'TikTok Specialist requires Wave 2 output to proceed',
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

      const parsed = JSON.parse(content) as TikTokContent;
      const tokenUsage = response.usage?.total_tokens || 0;

      // Validate and default required fields
      if (!parsed.hooks || !Array.isArray(parsed.hooks)) {
        parsed.hooks = [];
      }
      if (!parsed.trendIntegrations || !Array.isArray(parsed.trendIntegrations)) {
        parsed.trendIntegrations = [];
      }
      if (!parsed.hashtags || !Array.isArray(parsed.hashtags)) {
        parsed.hashtags = [];
      }
      if (!parsed.soundSuggestions || !Array.isArray(parsed.soundSuggestions)) {
        parsed.soundSuggestions = [];
      }
      if (!parsed.formatSuggestions || !Array.isArray(parsed.formatSuggestions)) {
        parsed.formatSuggestions = [];
      }
      if (!parsed.scriptOutline || !Array.isArray(parsed.scriptOutline)) {
        parsed.scriptOutline = [];
      }
      if (!parsed.captionTemplates || !Array.isArray(parsed.captionTemplates)) {
        parsed.captionTemplates = [];
      }

      return {
        success: true,
        data: parsed,
        tokenUsage,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error('[TikTokSpecialist] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - startTime,
      };
    }
  }
}

export function createTikTokSpecialist(config?: Partial<LLMConfig>): TikTokSpecialistAgent {
  return new TikTokSpecialistAgent(config);
}

export { TikTokSpecialistAgent };
