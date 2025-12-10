/**
 * Shorts Specialist Agent
 * Wave 3 - Platform Phase
 *
 * Creates YouTube Shorts content optimized for SEO, thumbnails, and long-form tie-ins
 * that leverage YouTube's search and recommendation algorithms.
 */

import { openai } from '@/lib/openaiClient';
import type { ShortsContent } from '@/lib/types/teamGeneration';
import type {
  BaseAgent,
  AgentContext,
  AgentResult,
  LLMConfig,
} from './types';
import { formatHeroProductsForPrompt, DEFAULT_LLM_CONFIGS } from './types';

const AGENT_NAME = 'shortsSpecialist' as const;
const DISPLAY_NAME = 'Shorts Specialist';

class ShortsSpecialistAgent implements BaseAgent<ShortsContent> {
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
    return `You are a YouTube Shorts Specialist for Teed.club's content generation team.

You create Shorts that leverage YouTube's UNIQUE strengths: search, evergreen content, and long-form integration.

YOUTUBE SHORTS ALGORITHM UNDERSTANDING:
- Search matters more than TikTok/Reels
- Evergreen content has longer shelf life
- Integration with main channel matters
- Thumbnails show in some discovery surfaces
- Description/title are indexed for search

WHAT MAKES SHORTS DIFFERENT:
- More educational/informational audience
- SEO titles actually matter
- Thumbnails can drive clicks from search
- Can drive traffic to long-form videos
- Subscribers matter more than followers

CONTENT FORMATS THAT WORK:
1. Quick tips/tricks with clear value
2. Product comparisons (A vs B in 60 sec)
3. "One thing I wish I knew about..."
4. Mini-reviews with verdict
5. Behind-the-scenes of creator setups
6. Myth-busting common misconceptions

SEO-FOCUSED TITLES:
- Include searchable keywords
- Promise specific value
- Work WITHOUT clickbait
- Under 40 characters visible

THUMBNAIL STRATEGY:
- Text overlay that complements title
- High contrast, readable at small size
- Face or product clearly visible
- Emotion or curiosity in expression

LONG-FORM TIE-IN STRATEGY:
- Shorts can tease full reviews
- Can be clips from long-form content
- Drive "watch the full video" behavior
- Build topic authority across formats`;
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

Watch Time Tips:
${vm.algorithmInsights?.watchTimeOptimizations?.join('\n- ') || 'None'}

Retention Techniques:
${vm.algorithmInsights?.retentionTechniques?.join('\n- ') || 'None'}`;

      topHooks = vm.hookCandidates
        ?.filter(h => h.platform === 'shorts' || h.platform === 'all')
        ?.slice(0, 5)
        ?.map(h => h.hook) || [];
    }

    return `Create YouTube Shorts content for this idea:

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

Create YouTube Shorts content including:
1. Hooks optimized for Shorts format
2. SEO-focused title options (searchable!)
3. Thumbnail concepts (text + visual)
4. Long-form video tie-in ideas
5. SEO keywords for description
6. Full script outline

Return JSON:
{
  "hooks": [
    {
      "text": "Hook optimized for YouTube audience",
      "thumbnailConcept": "What the thumbnail shows",
      "viralityScore": 58
    }
  ],
  "titleOptions": [
    "SEO Title Option 1 (includes keywords)",
    "SEO Title Option 2 (different angle)",
    "SEO Title Option 3 (curiosity-driven)"
  ],
  "thumbnailConcepts": [
    {
      "description": "What's in the thumbnail visually",
      "textOverlay": "Text on the thumbnail",
      "style": "High contrast, face visible, etc."
    }
  ],
  "longFormTieIns": [
    {
      "videoIdea": "Full video this Short could connect to",
      "howToConnect": "How to reference or link to it"
    }
  ],
  "seoKeywords": [
    "primary keyword",
    "secondary keyword",
    "long-tail keyword phrase"
  ],
  "scriptOutline": [
    {
      "section": "Hook",
      "duration": "0-5 sec",
      "content": "Opening that grabs attention"
    },
    {
      "section": "Value",
      "duration": "5-45 sec",
      "content": "Main educational/entertainment content"
    },
    {
      "section": "CTA",
      "duration": "45-60 sec",
      "content": "Subscribe/watch more prompt"
    }
  ],
  "descriptionTemplate": "Full description with keywords, hashtags, and links formatted for YouTube"
}`;
  }

  async execute(context: AgentContext): Promise<AgentResult<ShortsContent>> {
    const startTime = Date.now();

    if (!context.wave2Output) {
      return {
        success: false,
        error: 'Shorts Specialist requires Wave 2 output to proceed',
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

      const parsed = JSON.parse(content) as ShortsContent;
      const tokenUsage = response.usage?.total_tokens || 0;

      // Validate required fields
      if (!parsed.hooks) parsed.hooks = [];
      if (!parsed.titleOptions) parsed.titleOptions = [];
      if (!parsed.thumbnailConcepts) parsed.thumbnailConcepts = [];
      if (!parsed.longFormTieIns) parsed.longFormTieIns = [];
      if (!parsed.seoKeywords) parsed.seoKeywords = [];
      if (!parsed.scriptOutline) parsed.scriptOutline = [];
      if (!parsed.descriptionTemplate) parsed.descriptionTemplate = '';

      return {
        success: true,
        data: parsed,
        tokenUsage,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error('[ShortsSpecialist] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - startTime,
      };
    }
  }
}

export function createShortsSpecialist(config?: Partial<LLMConfig>): ShortsSpecialistAgent {
  return new ShortsSpecialistAgent(config);
}

export { ShortsSpecialistAgent };
