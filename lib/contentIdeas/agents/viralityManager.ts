/**
 * Virality Manager Agent
 * Wave 2 - Strategy Phase
 *
 * Reviews Wave 1 outputs to score hooks, identify trends, and optimize for algorithms.
 * Provides strategic direction for Wave 3 platform specialists.
 */

import { openai } from '@/lib/openaiClient';
import type { ViralityManagerOutput, HookCandidate } from '@/lib/types/teamGeneration';
import type {
  BaseAgent,
  AgentContext,
  AgentResult,
  LLMConfig,
} from './types';
import { formatHeroProductsForPrompt, extractThemes, calculateBaseViralitySignals, DEFAULT_LLM_CONFIGS } from './types';

const AGENT_NAME = 'viralityManager' as const;
const DISPLAY_NAME = 'Virality Manager';

class ViralityManagerAgent implements BaseAgent<ViralityManagerOutput> {
  name = AGENT_NAME;
  displayName = DISPLAY_NAME;
  wave = 2 as const;

  private config: LLMConfig;

  constructor(config?: Partial<LLMConfig>) {
    this.config = {
      ...DEFAULT_LLM_CONFIGS.strategy,
      ...config,
    };
  }

  getSystemPrompt(): string {
    return `You are a Virality Manager for Teed.club's content generation team.

Your role is to analyze research outputs and develop VIRAL STRATEGY for short-form content.

WHAT MAKES YOU VALUABLE:
- You understand algorithm psychology across TikTok, Reels, and Shorts
- You score hooks based on REAL virality factors, not wishful thinking
- You identify trend opportunities that fit naturally (not forced)
- You provide actionable direction for platform specialists

VIRALITY SCORING CRITERIA (0-100):

Hook Score Components:
- Curiosity Gap (0-25): Does it make viewers NEED to watch?
- Emotional Trigger (0-25): Does it trigger shareworthy emotion?
- Platform Fit (0-25): Does it match platform culture/algorithm?
- Story Depth (0-25): Is there real substance behind the hook?

Content Angle Scoring:
- 70-100: High virality potential, prioritize this angle
- 50-69: Solid potential, worth creating
- 30-49: Niche appeal, may work for specific audiences
- 0-29: Low potential, deprioritize

TREND ALIGNMENT PRINCIPLES:
- Never force-fit trends - it always feels cringe
- Identify NATURAL overlaps between content and current trends
- Timing matters - late trend adoption hurts more than helps
- Platform-specific trends don't always cross over

ALGORITHM INSIGHTS YOU PROVIDE:
1. Watch Time Optimization: What keeps viewers to the end?
2. Engagement Triggers: What makes people comment/share?
3. Shareability Factors: What makes someone send to a friend?
4. Retention Techniques: How to reduce swipe-away rate

BE HONEST ABOUT SCORES:
- A 50-60 score is actually good for most content
- 70+ is genuinely high potential
- Not everything needs to be 80+
- Niche content with 40 score can outperform generic 60 score`;
  }

  getUserPrompt(context: AgentContext): string {
    const { contentIdea, videoTitle, creatorName, vertical, heroProducts, wave1Output, feedback } = context;

    // Get themes for trend matching
    const themes = extractThemes(contentIdea);
    const viralitySignals = calculateBaseViralitySignals(contentIdea, context.products);

    // Include feedback if provided
    const feedbackSection = feedback
      ? `
═══════════════════════════════════════
USER FEEDBACK (REVISION REQUEST)
═══════════════════════════════════════
The user has requested revisions with the following feedback:
"${feedback}"

IMPORTANT: Incorporate this feedback into your analysis and recommendations.
Adjust hooks, angles, and strategy based on what the user wants to see different.
`
      : '';

    // Format Wave 1 outputs
    let productInsights = 'Not available';
    let funFactsInsights = 'Not available';

    if (wave1Output) {
      if (wave1Output.productDetails) {
        const pd = wave1Output.productDetails;
        productInsights = `
Technical Highlights:
${pd.technicalHighlights?.join('\n- ') || 'None'}

Key Selling Points:
${pd.keySellingPoints?.join('\n- ') || 'None'}

Hero Products Analyzed: ${pd.heroProductAnalysis?.length || 0}
${pd.heroProductAnalysis?.map(p => `- ${p.productName}: ${p.targetAudience}`).join('\n') || ''}`;
      }

      if (wave1Output.funFacts) {
        const ff = wave1Output.funFacts;
        funFactsInsights = `
Creator Facts (high emotional weight):
${ff.creatorFacts?.filter(f => f.emotionalWeight === 'high').map(f => `- ${f.fact}`).join('\n') || 'None'}

Did You Know:
${ff.didYouKnow?.slice(0, 3).join('\n- ') || 'None'}

Emotional Hooks:
${ff.emotionalHooks?.slice(0, 3).join('\n- ') || 'None'}

Surprising Facts:
${ff.surprisingFacts?.slice(0, 3).join('\n- ') || 'None'}`;
      }
    }

    return `Develop viral strategy for this content:

VIDEO: "${videoTitle}" by ${creatorName}
VERTICAL: ${vertical}

CONTENT IDEA:
Title: ${contentIdea.idea_title}
Summary: ${contentIdea.idea_summary}

HERO PRODUCTS:
${formatHeroProductsForPrompt(heroProducts)}

IDENTIFIED THEMES: ${themes.join(', ') || 'None'}

BASE VIRALITY SIGNALS:
${viralitySignals.map(s => `- ${s.signal}: ${s.score}/100 - ${s.reasoning}`).join('\n') || 'None detected'}

═══════════════════════════════════════
WAVE 1 RESEARCH OUTPUT
═══════════════════════════════════════

PRODUCT DETAILS EXPERT FINDINGS:
${productInsights}

FUN FACTS EXPERT FINDINGS:
${funFactsInsights}
${feedbackSection}
═══════════════════════════════════════
YOUR TASK
═══════════════════════════════════════

1. Generate 8-12 hook candidates with honest virality scores
2. Identify 3-5 content angles ranked by potential
3. Find trend alignments that fit NATURALLY
4. Provide algorithm insights for each platform
5. Recommend the PRIMARY angle to pursue
6. Suggest an OPTIMIZED TITLE and SUMMARY for this content idea

Be HONEST with scoring. A 50-60 is actually good.

Return JSON:
{
  "hookCandidates": [
    {
      "hook": "The actual hook text (under 15 words)",
      "score": 65,
      "reasoning": "Why this score - be specific about strengths/weaknesses",
      "trendFit": ["trend1", "trend2"],
      "platform": "tiktok|reels|shorts|all",
      "style": "shock|curiosity|educational|emotional|controversy|transformation"
    }
  ],
  "contentAngles": [
    {
      "angle": "Description of the content angle",
      "viralityScore": 60,
      "reasoning": "Why this angle works or doesn't",
      "bestPlatform": "tiktok|reels|shorts|all"
    }
  ],
  "trendAlignments": [
    {
      "trend": "Current trend name/description",
      "fitScore": 55,
      "howToLeverage": "How to naturally integrate this trend"
    }
  ],
  "algorithmInsights": {
    "watchTimeOptimizations": ["Specific technique to keep viewers watching"],
    "engagementTriggers": ["What will make people comment"],
    "shareabilityFactors": ["What makes someone share this"],
    "retentionTechniques": ["How to reduce swipe-away rate"]
  },
  "recommendedPrimaryAngle": "The angle to prioritize for all platforms",
  "overallViralityAssessment": {
    "score": 58,
    "strengths": ["What makes this content strong"],
    "weaknesses": ["Honest assessment of limitations"],
    "recommendations": ["Specific actions to improve virality"]
  },
  "recommendedTitle": "An optimized, catchy title for this content idea (max 80 chars)",
  "recommendedSummary": "A compelling 1-2 sentence summary that captures the hook and value prop"
}`;
  }

  async execute(context: AgentContext): Promise<AgentResult<ViralityManagerOutput>> {
    const startTime = Date.now();

    // Validate we have Wave 1 output
    if (!context.wave1Output) {
      return {
        success: false,
        error: 'Virality Manager requires Wave 1 output to proceed',
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

      const parsed = JSON.parse(content) as ViralityManagerOutput;
      const tokenUsage = response.usage?.total_tokens || 0;

      // Validate and default required fields
      if (!parsed.hookCandidates || !Array.isArray(parsed.hookCandidates)) {
        parsed.hookCandidates = [];
      }
      if (!parsed.contentAngles || !Array.isArray(parsed.contentAngles)) {
        parsed.contentAngles = [];
      }
      if (!parsed.trendAlignments || !Array.isArray(parsed.trendAlignments)) {
        parsed.trendAlignments = [];
      }
      if (!parsed.algorithmInsights) {
        parsed.algorithmInsights = {
          watchTimeOptimizations: [],
          engagementTriggers: [],
          shareabilityFactors: [],
          retentionTechniques: [],
        };
      }
      if (!parsed.overallViralityAssessment) {
        parsed.overallViralityAssessment = {
          score: 50,
          strengths: [],
          weaknesses: [],
          recommendations: [],
        };
      }

      // Sort hooks by score descending
      parsed.hookCandidates.sort((a, b) => (b.score || 0) - (a.score || 0));

      return {
        success: true,
        data: parsed,
        tokenUsage,
        durationMs: Date.now() - startTime,
      };
    } catch (error) {
      console.error('[ViralityManager] Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        durationMs: Date.now() - startTime,
      };
    }
  }
}

// Factory function
export function createViralityManager(config?: Partial<LLMConfig>): ViralityManagerAgent {
  return new ViralityManagerAgent(config);
}

export { ViralityManagerAgent };
