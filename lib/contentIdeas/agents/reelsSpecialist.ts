/**
 * Reels Specialist Agent
 * Wave 3 - Platform Phase
 *
 * Creates Instagram Reels content with aesthetic direction, visual concepts,
 * carousel ideas, and caption templates optimized for Instagram's algorithm.
 */

import { openai } from '@/lib/openaiClient';
import type { ReelsContent } from '@/lib/types/teamGeneration';
import type {
  BaseAgent,
  AgentContext,
  AgentResult,
  LLMConfig,
} from './types';
import { formatHeroProductsForPrompt, DEFAULT_LLM_CONFIGS } from './types';

const AGENT_NAME = 'reelsSpecialist' as const;
const DISPLAY_NAME = 'Reels Specialist';

class ReelsSpecialistAgent implements BaseAgent<ReelsContent> {
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
    return `You are a Reels Specialist for Teed.club's content generation team.

You create AESTHETIC, VISUALLY-DRIVEN content for Instagram Reels.

INSTAGRAM REELS ALGORITHM UNDERSTANDING:
- Visual quality matters more than on TikTok
- Shares to Stories boost visibility significantly
- Saves indicate high-value content
- Cover image choice affects feed performance
- Cross-posting from TikTok is penalized

WHAT MAKES REELS DIFFERENT:
- Audience expects higher production value
- Aesthetic/vibe matters - Instagram is aspirational
- Educational content performs better than pure entertainment
- Product showcases work well on Instagram
- Carousel posts can complement Reels for discovery

CONTENT FORMATS THAT WORK:
1. Cinematic product reveals (slow-mo, good lighting)
2. "My Setup" tours with personality
3. Tips/tricks with on-screen text
4. Before/after transformations
5. Day-in-the-life with gear featured

VISUAL CONSIDERATIONS:
- Clean backgrounds, good lighting
- Product close-ups with nice depth of field
- Consistent color grading/filter
- On-screen text should be readable and styled
- Cover image should be thumb-stopping

HASHTAG STRATEGY:
- 5-10 relevant hashtags
- Mix of discovery (#gearreview) and community (#cameragear)
- Location tags if relevant
- No spam tags

CAROUSEL COMPANION STRATEGY:
- Static carousel can drive discovery
- Slide 1: Hook image
- Slides 2-5: Value/details
- Last slide: CTA to Reel`;
  }

  getUserPrompt(context: AgentContext): string {
    const { contentIdea, videoTitle, creatorName, vertical, heroProducts, wave2Output } = context;

    let viralityInsights = '';
    let topHooks: string[] = [];
    if (wave2Output?.viralityManager) {
      const vm = wave2Output.viralityManager;
      viralityInsights = `
Primary Angle: ${vm.recommendedPrimaryAngle || 'Not specified'}

Top Content Angles:
${vm.contentAngles?.slice(0, 3).map(a => `- ${a.angle} (${a.viralityScore}/100)`).join('\n') || 'None'}

Shareability Factors:
${vm.algorithmInsights?.shareabilityFactors?.join('\n- ') || 'None'}

Engagement Triggers:
${vm.algorithmInsights?.engagementTriggers?.join('\n- ') || 'None'}`;

      topHooks = vm.hookCandidates
        ?.filter(h => h.platform === 'reels' || h.platform === 'all')
        ?.slice(0, 5)
        ?.map(h => h.hook) || [];
    }

    return `Create Instagram Reels content for this idea:

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

TOP HOOKS:
${topHooks.map((h, i) => `${i + 1}. "${h}"`).join('\n') || 'None provided'}

═══════════════════════════════════════
YOUR TASK
═══════════════════════════════════════

Create Instagram-optimized content including:
1. Visually-focused hooks with concepts
2. Aesthetic direction for the Reel
3. Visual concepts and shot ideas
4. Carousel ideas that complement the Reel
5. Caption templates with personality
6. Hashtag strategy (5-10 tags)
7. Cover image concepts

Return JSON:
{
  "hooks": [
    {
      "text": "Hook text with visual concept",
      "visualConcept": "What the viewer sees during this hook",
      "viralityScore": 60
    }
  ],
  "aestheticDirection": "Overall vibe/aesthetic for this content (e.g., 'clean minimal with warm tones', 'moody cinematic', 'bright and energetic')",
  "visualConcepts": [
    "Shot idea 1: Description of what to film",
    "Shot idea 2: Visual moment that would look great"
  ],
  "carouselIdeas": [
    {
      "title": "Carousel concept title",
      "slides": [
        "Slide 1: Hook image - what it shows",
        "Slide 2: Detail/value point",
        "Slide 3: More information",
        "Slide 4: CTA"
      ]
    }
  ],
  "captionTemplates": [
    "Caption with personality, emojis where natural, line breaks for readability"
  ],
  "hashtags": ["hashtag1", "hashtag2", "hashtag3"],
  "coverImageConcepts": [
    "Cover image idea 1: What it shows, why it stops scrollers",
    "Cover image idea 2: Alternative concept"
  ],
  "scriptOutline": [
    {
      "section": "Hook",
      "duration": "0-3 sec",
      "content": "What to say",
      "visualNote": "What's on screen"
    },
    {
      "section": "Setup",
      "duration": "3-10 sec",
      "content": "Context",
      "visualNote": "Visual approach"
    },
    {
      "section": "Value",
      "duration": "10-45 sec",
      "content": "Main content",
      "visualNote": "Key shots"
    },
    {
      "section": "CTA",
      "duration": "45-60 sec",
      "content": "Call to action",
      "visualNote": "End frame"
    }
  ]
}`;
  }

  async execute(context: AgentContext): Promise<AgentResult<ReelsContent>> {
    const startTime = Date.now();

    if (!context.wave2Output) {
      return {
        success: false,
        error: 'Reels Specialist requires Wave 2 output to proceed',
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

      const parsed = JSON.parse(content) as ReelsContent;
      const tokenUsage = response.usage?.total_tokens || 0;

      // Validate required fields
      if (!parsed.hooks) parsed.hooks = [];
      if (!parsed.aestheticDirection) parsed.aestheticDirection = '';
      if (!parsed.visualConcepts) parsed.visualConcepts = [];
      if (!parsed.carouselIdeas) parsed.carouselIdeas = [];
      if (!parsed.captionTemplates) parsed.captionTemplates = [];
      if (!parsed.hashtags) parsed.hashtags = [];
      if (!parsed.coverImageConcepts) parsed.coverImageConcepts = [];
      if (!parsed.scriptOutline) parsed.scriptOutline = [];

      return {
        success: true,
        data: parsed,
        tokenUsage,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error('[ReelsSpecialist] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - startTime,
      };
    }
  }
}

export function createReelsSpecialist(config?: Partial<LLMConfig>): ReelsSpecialistAgent {
  return new ReelsSpecialistAgent(config);
}

export { ReelsSpecialistAgent };
