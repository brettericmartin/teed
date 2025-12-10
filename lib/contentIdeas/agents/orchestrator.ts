/**
 * Team Generation Orchestrator
 *
 * Manages wave-based execution of all agents:
 * - Wave 1 (Parallel): Product Details Expert + Fun Facts Expert
 * - Wave 2 (Sequential): Virality Manager
 * - Wave 3 (Parallel): TikTok + Reels + Shorts Specialists + Bag QA (optional)
 */

import type { ContentIdea, ExtractedProduct } from '@/lib/types/contentIdeas';
import type {
  Wave1Output,
  Wave2Output,
  Wave3Output,
  TeamGenerationOutput,
  StreamEvent,
  AgentName,
} from '@/lib/types/teamGeneration';
import type { AgentContext, BagItem, ProgressCallback } from './types';

import { createProductDetailsExpert } from './productDetailsExpert';
import { createFunFactsExpert } from './funFactsExpert';
import { createViralityManager } from './viralityManager';
import { createTikTokSpecialist } from './tiktokSpecialist';
import { createReelsSpecialist } from './reelsSpecialist';
import { createShortsSpecialist } from './shortsSpecialist';
import { createBagQAAgent } from './bagQAAgent';
import { mergeOutputs } from './merger';

// ============================================
// Types
// ============================================

export interface OrchestratorConfig {
  onProgress?: (event: StreamEvent) => void;
  feedback?: string; // User feedback for revision
}

export interface OrchestratorResult {
  success: boolean;
  output?: TeamGenerationOutput;
  error?: string;
  wave1Output?: Wave1Output;
  wave2Output?: Wave2Output;
  wave3Output?: Wave3Output;
  tokenUsage: {
    wave1: number;
    wave2: number;
    wave3: number;
    total: number;
  };
}

export interface BagData {
  id: string;
  code: string;
  name: string;
  items: BagItem[];
  coverImageUrl?: string;
}

// ============================================
// Orchestrator
// ============================================

export async function runTeamGeneration(
  contentIdea: ContentIdea,
  products: ExtractedProduct[],
  bag?: BagData,
  config?: OrchestratorConfig
): Promise<OrchestratorResult> {
  const onProgress = config?.onProgress || (() => {});

  // Initialize context
  const heroProducts = products
    .filter(p => p.isHeroCandidate)
    .sort((a, b) => (b.heroScore || 0) - (a.heroScore || 0))
    .slice(0, 5);

  // Extract video info from source metadata
  const youtube = contentIdea.source_metadata?.youtube;
  const videoTitle = youtube?.title || contentIdea.idea_title || '';
  const videoDescription = youtube?.description || '';

  const baseContext: AgentContext = {
    contentIdea,
    videoTitle,
    videoDescription,
    creatorName: contentIdea.source_channel_name || 'Unknown Creator',
    vertical: contentIdea.vertical || 'tech',
    products,
    heroProducts,
    bag,
    feedback: config?.feedback,
  };

  const tokenUsage = {
    wave1: 0,
    wave2: 0,
    wave3: 0,
    total: 0,
  };

  const hasBag = !!bag && bag.items.length > 0;
  const totalAgents = hasBag ? 7 : 6;

  // Send generation start event
  onProgress({
    type: 'generation_start',
    progress: 0,
    totalAgents,
  });

  try {
    // ═══════════════════════════════════════════════════════════════
    // WAVE 1: Research Phase (Parallel)
    // ═══════════════════════════════════════════════════════════════

    onProgress({
      type: 'wave_start',
      wave: 1,
      progress: 5,
      agents: ['productDetailsExpert', 'funFactsExpert'],
    });

    const wave1Result = await runWave1(baseContext, onProgress);

    if (!wave1Result.productDetails && !wave1Result.funFacts) {
      return {
        success: false,
        error: 'Wave 1 failed: Both research agents failed',
        tokenUsage,
      };
    }

    tokenUsage.wave1 = wave1Result.tokenUsage;

    onProgress({
      type: 'wave_complete',
      wave: 1,
      progress: 30,
    });

    // ═══════════════════════════════════════════════════════════════
    // WAVE 2: Strategy Phase (Sequential)
    // ═══════════════════════════════════════════════════════════════

    onProgress({
      type: 'wave_start',
      wave: 2,
      progress: 32,
      agents: ['viralityManager'],
    });

    const contextWithWave1: AgentContext = {
      ...baseContext,
      wave1Output: wave1Result,
    };

    const wave2Result = await runWave2(contextWithWave1, onProgress);

    if (!wave2Result.viralityManager) {
      return {
        success: false,
        error: 'Wave 2 failed: Virality Manager failed',
        wave1Output: wave1Result,
        tokenUsage,
      };
    }

    tokenUsage.wave2 = wave2Result.tokenUsage;

    onProgress({
      type: 'wave_complete',
      wave: 2,
      progress: 50,
    });

    // ═══════════════════════════════════════════════════════════════
    // WAVE 3: Platform Phase (Parallel)
    // ═══════════════════════════════════════════════════════════════

    const wave3Agents = ['tiktokSpecialist', 'reelsSpecialist', 'shortsSpecialist'];
    if (hasBag) wave3Agents.push('bagQAAgent');

    onProgress({
      type: 'wave_start',
      wave: 3,
      progress: 52,
      agents: wave3Agents,
    });

    const contextWithWave2: AgentContext = {
      ...contextWithWave1,
      wave2Output: wave2Result,
    };

    const wave3Result = await runWave3(contextWithWave2, hasBag, onProgress);

    tokenUsage.wave3 = wave3Result.tokenUsage;
    tokenUsage.total = tokenUsage.wave1 + tokenUsage.wave2 + tokenUsage.wave3;

    onProgress({
      type: 'wave_complete',
      wave: 3,
      progress: 90,
    });

    // ═══════════════════════════════════════════════════════════════
    // MERGE OUTPUTS
    // ═══════════════════════════════════════════════════════════════

    onProgress({
      type: 'merging',
      progress: 92,
    });

    const finalOutput = mergeOutputs(wave1Result, wave2Result, wave3Result, tokenUsage);

    onProgress({
      type: 'final',
      data: finalOutput,
      progress: 100,
    });

    return {
      success: true,
      output: finalOutput,
      wave1Output: wave1Result,
      wave2Output: wave2Result,
      wave3Output: wave3Result,
      tokenUsage,
    };
  } catch (error) {
    console.error('[Orchestrator] Fatal error:', error);
    onProgress({
      type: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      progress: 0,
    });

    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      tokenUsage,
    };
  }
}

// ============================================
// Wave Runners
// ============================================

interface Wave1Result extends Wave1Output {
  tokenUsage: number;
}

async function runWave1(
  context: AgentContext,
  onProgress: (event: StreamEvent) => void
): Promise<Wave1Result> {
  const productDetailsAgent = createProductDetailsExpert();
  const funFactsAgent = createFunFactsExpert();

  let tokenUsage = 0;

  // Start both agents
  onProgress({
    type: 'agent_start',
    agent: 'productDetailsExpert',
    displayName: 'Product Details Expert',
    progress: 10,
  });

  onProgress({
    type: 'agent_start',
    agent: 'funFactsExpert',
    displayName: 'Fun Facts Expert',
    progress: 10,
  });

  // Run in parallel
  const [productDetailsResult, funFactsResult] = await Promise.all([
    productDetailsAgent.execute(context),
    funFactsAgent.execute(context),
  ]);

  // Report Product Details result
  if (productDetailsResult.success && productDetailsResult.data) {
    onProgress({
      type: 'agent_complete',
      agent: 'productDetailsExpert',
      data: productDetailsResult.data,
      progress: 20,
    });
    tokenUsage += productDetailsResult.tokenUsage || 0;
  } else {
    onProgress({
      type: 'agent_failed',
      agent: 'productDetailsExpert',
      error: productDetailsResult.error || 'Unknown error',
      progress: 20,
    });
  }

  // Report Fun Facts result
  if (funFactsResult.success && funFactsResult.data) {
    onProgress({
      type: 'agent_complete',
      agent: 'funFactsExpert',
      data: funFactsResult.data,
      progress: 28,
    });
    tokenUsage += funFactsResult.tokenUsage || 0;
  } else {
    onProgress({
      type: 'agent_failed',
      agent: 'funFactsExpert',
      error: funFactsResult.error || 'Unknown error',
      progress: 28,
    });
  }

  return {
    productDetails: productDetailsResult.data || {
      heroProductAnalysis: [],
      technicalHighlights: [],
      keySellingPoints: [],
    },
    funFacts: funFactsResult.data || {
      creatorFacts: [],
      productHistory: [],
      didYouKnow: [],
      surprisingFacts: [],
      emotionalHooks: [],
    },
    tokenUsage,
  };
}

interface Wave2Result extends Wave2Output {
  tokenUsage: number;
}

async function runWave2(
  context: AgentContext,
  onProgress: (event: StreamEvent) => void
): Promise<Wave2Result> {
  const viralityAgent = createViralityManager();

  onProgress({
    type: 'agent_start',
    agent: 'viralityManager',
    displayName: 'Virality Manager',
    progress: 35,
  });

  const result = await viralityAgent.execute(context);

  if (result.success && result.data) {
    onProgress({
      type: 'agent_complete',
      agent: 'viralityManager',
      data: result.data,
      progress: 48,
    });
  } else {
    onProgress({
      type: 'agent_failed',
      agent: 'viralityManager',
      error: result.error || 'Unknown error',
      progress: 48,
    });
  }

  return {
    viralityManager: result.data || {
      hookCandidates: [],
      contentAngles: [],
      trendAlignments: [],
      algorithmInsights: {
        watchTimeOptimizations: [],
        engagementTriggers: [],
        shareabilityFactors: [],
        retentionTechniques: [],
      },
      recommendedPrimaryAngle: '',
      overallViralityAssessment: {
        score: 50,
        strengths: [],
        weaknesses: [],
        recommendations: [],
      },
    },
    tokenUsage: result.tokenUsage || 0,
  };
}

interface Wave3Result extends Wave3Output {
  tokenUsage: number;
}

async function runWave3(
  context: AgentContext,
  hasBag: boolean,
  onProgress: (event: StreamEvent) => void
): Promise<Wave3Result> {
  const tiktokAgent = createTikTokSpecialist();
  const reelsAgent = createReelsSpecialist();
  const shortsAgent = createShortsSpecialist();
  const bagQAAgent = createBagQAAgent();

  let tokenUsage = 0;

  // Start platform agents
  onProgress({
    type: 'agent_start',
    agent: 'tiktokSpecialist',
    displayName: 'TikTok Specialist',
    progress: 55,
  });

  onProgress({
    type: 'agent_start',
    agent: 'reelsSpecialist',
    displayName: 'Reels Specialist',
    progress: 55,
  });

  onProgress({
    type: 'agent_start',
    agent: 'shortsSpecialist',
    displayName: 'Shorts Specialist',
    progress: 55,
  });

  if (hasBag) {
    onProgress({
      type: 'agent_start',
      agent: 'bagQAAgent',
      displayName: 'Bag QA Agent',
      progress: 55,
    });
  } else {
    onProgress({
      type: 'agent_skipped',
      agent: 'bagQAAgent',
      reason: 'No bag linked to content idea',
      progress: 55,
    });
  }

  // Run all Wave 3 agents in parallel
  // Separate platform agents from bag QA to avoid type issues
  const platformPromises = [
    tiktokAgent.execute(context),
    reelsAgent.execute(context),
    shortsAgent.execute(context),
  ] as const;

  const bagQAPromise = hasBag ? bagQAAgent.execute(context) : null;

  const [tiktokResult, reelsResult, shortsResult] = await Promise.all(platformPromises);
  const bagQAResult = bagQAPromise ? await bagQAPromise : null;

  // Report TikTok result
  if (tiktokResult.success && tiktokResult.data) {
    onProgress({
      type: 'agent_complete',
      agent: 'tiktokSpecialist',
      data: tiktokResult.data,
      progress: 70,
    });
    tokenUsage += tiktokResult.tokenUsage || 0;
  } else {
    onProgress({
      type: 'agent_failed',
      agent: 'tiktokSpecialist',
      error: tiktokResult.error || 'Unknown error',
      progress: 70,
    });
  }

  // Report Reels result
  if (reelsResult.success && reelsResult.data) {
    onProgress({
      type: 'agent_complete',
      agent: 'reelsSpecialist',
      data: reelsResult.data,
      progress: 78,
    });
    tokenUsage += reelsResult.tokenUsage || 0;
  } else {
    onProgress({
      type: 'agent_failed',
      agent: 'reelsSpecialist',
      error: reelsResult.error || 'Unknown error',
      progress: 78,
    });
  }

  // Report Shorts result
  if (shortsResult.success && shortsResult.data) {
    onProgress({
      type: 'agent_complete',
      agent: 'shortsSpecialist',
      data: shortsResult.data,
      progress: 85,
    });
    tokenUsage += shortsResult.tokenUsage || 0;
  } else {
    onProgress({
      type: 'agent_failed',
      agent: 'shortsSpecialist',
      error: shortsResult.error || 'Unknown error',
      progress: 85,
    });
  }

  // Report Bag QA result
  if (hasBag && bagQAResult) {
    if (bagQAResult.success && bagQAResult.data) {
      onProgress({
        type: 'agent_complete',
        agent: 'bagQAAgent',
        data: bagQAResult.data,
        progress: 88,
      });
      tokenUsage += bagQAResult.tokenUsage || 0;
    } else {
      onProgress({
        type: 'agent_failed',
        agent: 'bagQAAgent',
        error: bagQAResult.error || 'Unknown error',
        progress: 88,
      });
    }
  }

  // Default empty content structures
  const emptyTikTok = {
    hooks: [],
    trendIntegrations: [],
    hashtags: [],
    soundSuggestions: [],
    formatSuggestions: [],
    scriptOutline: [],
    captionTemplates: [],
  };

  const emptyReels = {
    hooks: [],
    aestheticDirection: '',
    visualConcepts: [],
    carouselIdeas: [],
    captionTemplates: [],
    hashtags: [],
    coverImageConcepts: [],
    scriptOutline: [],
  };

  const emptyShorts = {
    hooks: [],
    titleOptions: [],
    thumbnailConcepts: [],
    longFormTieIns: [],
    seoKeywords: [],
    scriptOutline: [],
    descriptionTemplate: '',
  };

  return {
    tiktok: (tiktokResult.data as typeof emptyTikTok) || emptyTikTok,
    reels: (reelsResult.data as typeof emptyReels) || emptyReels,
    shorts: (shortsResult.data as typeof emptyShorts) || emptyShorts,
    bagQA: hasBag && bagQAResult?.success ? bagQAResult.data : undefined,
    tokenUsage,
  };
}
