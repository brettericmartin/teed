/**
 * Output Merger
 *
 * Combines outputs from all waves into a final TeamGenerationOutput.
 * Merges hooks from all sources, deduplicates, and ranks by virality.
 */

import type {
  Wave1Output,
  Wave2Output,
  Wave3Output,
  TeamGenerationOutput,
  MergedHook,
  HookCandidate,
} from '@/lib/types/teamGeneration';

interface TokenUsage {
  wave1: number;
  wave2: number;
  wave3: number;
  total: number;
}

/**
 * Merge all wave outputs into final team generation output
 */
export function mergeOutputs(
  wave1: Wave1Output,
  wave2: Wave2Output,
  wave3: Wave3Output,
  tokenUsage: TokenUsage
): TeamGenerationOutput {
  // Merge hooks from Virality Manager and platform specialists
  const mergedHooks = mergeHooks(wave2, wave3);

  return {
    // Merged content
    topHooks: mergedHooks.slice(0, 10),
    recommendedAngle: wave2.viralityManager?.recommendedPrimaryAngle || '',

    // Optimized title and summary from Virality Manager
    recommendedTitle: wave2.viralityManager?.recommendedTitle,
    recommendedSummary: wave2.viralityManager?.recommendedSummary,

    // Platform-specific content
    platformContent: {
      tiktok: wave3.tiktok,
      reels: wave3.reels,
      shorts: wave3.shorts,
    },

    // Research data
    productInsights: wave1.productDetails,
    funFacts: wave1.funFacts,

    // Strategy data
    viralityAnalysis: wave2.viralityManager,

    // Bag improvements (if applicable)
    bagQA: wave3.bagQA,

    // Metadata
    generatedAt: new Date().toISOString(),
    tokenUsage,
  };
}

/**
 * Merge hooks from all sources and rank by virality score
 */
function mergeHooks(wave2: Wave2Output, wave3: Wave3Output): MergedHook[] {
  const hookMap = new Map<string, MergedHook>();

  // Add Virality Manager hooks
  if (wave2.viralityManager?.hookCandidates) {
    for (const hook of wave2.viralityManager.hookCandidates) {
      const key = normalizeHook(hook.hook);
      if (!hookMap.has(key)) {
        hookMap.set(key, {
          hook: hook.hook,
          viralityScore: hook.score,
          platforms: hook.platform === 'all' ? ['tiktok', 'reels', 'shorts'] : [hook.platform],
          style: hook.style,
          reasoning: hook.reasoning,
          trendFit: hook.trendFit || [],
        });
      }
    }
  }

  // Add TikTok hooks
  if (wave3.tiktok?.hooks) {
    for (const hook of wave3.tiktok.hooks) {
      const key = normalizeHook(hook.text);
      if (hookMap.has(key)) {
        // Update existing hook to include TikTok platform
        const existing = hookMap.get(key)!;
        if (!existing.platforms.includes('tiktok')) {
          existing.platforms.push('tiktok');
        }
        // Take higher score
        if (hook.viralityScore > existing.viralityScore) {
          existing.viralityScore = hook.viralityScore;
        }
      } else {
        hookMap.set(key, {
          hook: hook.text,
          viralityScore: hook.viralityScore,
          platforms: ['tiktok'],
          style: 'platform-specific',
          reasoning: `TikTok-optimized (${hook.timing})`,
          trendFit: [],
        });
      }
    }
  }

  // Add Reels hooks
  if (wave3.reels?.hooks) {
    for (const hook of wave3.reels.hooks) {
      const key = normalizeHook(hook.text);
      if (hookMap.has(key)) {
        const existing = hookMap.get(key)!;
        if (!existing.platforms.includes('reels')) {
          existing.platforms.push('reels');
        }
        if (hook.viralityScore > existing.viralityScore) {
          existing.viralityScore = hook.viralityScore;
        }
        // Add visual concept to reasoning if available
        if (hook.visualConcept) {
          existing.reasoning += ` | Visual: ${hook.visualConcept}`;
        }
      } else {
        hookMap.set(key, {
          hook: hook.text,
          viralityScore: hook.viralityScore,
          platforms: ['reels'],
          style: 'visual',
          reasoning: hook.visualConcept || 'Reels-optimized',
          trendFit: [],
        });
      }
    }
  }

  // Add Shorts hooks
  if (wave3.shorts?.hooks) {
    for (const hook of wave3.shorts.hooks) {
      const key = normalizeHook(hook.text);
      if (hookMap.has(key)) {
        const existing = hookMap.get(key)!;
        if (!existing.platforms.includes('shorts')) {
          existing.platforms.push('shorts');
        }
        if (hook.viralityScore > existing.viralityScore) {
          existing.viralityScore = hook.viralityScore;
        }
      } else {
        hookMap.set(key, {
          hook: hook.text,
          viralityScore: hook.viralityScore,
          platforms: ['shorts'],
          style: 'seo',
          reasoning: hook.thumbnailConcept || 'Shorts-optimized',
          trendFit: [],
        });
      }
    }
  }

  // Convert to array and sort by score (descending)
  const mergedHooks = Array.from(hookMap.values());
  mergedHooks.sort((a, b) => b.viralityScore - a.viralityScore);

  // Boost hooks that work across multiple platforms
  for (const hook of mergedHooks) {
    if (hook.platforms.length >= 3) {
      hook.viralityScore = Math.min(100, hook.viralityScore + 5);
    } else if (hook.platforms.length === 2) {
      hook.viralityScore = Math.min(100, hook.viralityScore + 2);
    }
  }

  // Re-sort after boost
  mergedHooks.sort((a, b) => b.viralityScore - a.viralityScore);

  return mergedHooks;
}

/**
 * Normalize hook text for deduplication
 */
function normalizeHook(hook: string): string {
  return hook
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize whitespace
    .trim();
}

/**
 * Calculate overall generation quality score
 */
export function calculateQualityScore(output: TeamGenerationOutput): {
  score: number;
  breakdown: Record<string, number>;
} {
  const breakdown: Record<string, number> = {};

  // Hooks quality (0-25)
  const hooksScore = Math.min(25, output.topHooks.length * 2);
  breakdown.hooks = hooksScore;

  // Platform content quality (0-25)
  let platformScore = 0;
  if (output.platformContent.tiktok.hooks.length > 0) platformScore += 8;
  if (output.platformContent.reels.hooks.length > 0) platformScore += 8;
  if (output.platformContent.shorts.hooks.length > 0) platformScore += 9;
  breakdown.platformContent = platformScore;

  // Research quality (0-25)
  let researchScore = 0;
  if (output.productInsights.heroProductAnalysis.length > 0) researchScore += 12;
  if (output.funFacts.emotionalHooks.length > 0) researchScore += 8;
  if (output.funFacts.didYouKnow.length > 0) researchScore += 5;
  breakdown.research = Math.min(25, researchScore);

  // Strategy quality (0-25)
  let strategyScore = 0;
  if (output.viralityAnalysis.hookCandidates.length > 0) strategyScore += 10;
  if (output.viralityAnalysis.contentAngles.length > 0) strategyScore += 8;
  if (output.viralityAnalysis.algorithmInsights.watchTimeOptimizations.length > 0) strategyScore += 7;
  breakdown.strategy = Math.min(25, strategyScore);

  const totalScore = Object.values(breakdown).reduce((sum, v) => sum + v, 0);

  return {
    score: totalScore,
    breakdown,
  };
}

/**
 * Extract best content for quick display
 */
export function extractHighlights(output: TeamGenerationOutput): {
  topHook: string;
  viralityScore: number;
  primaryAngle: string;
  topFact: string;
  bagScore?: number;
} {
  const topHook = output.topHooks[0]?.hook || 'No hooks generated';
  const viralityScore = output.topHooks[0]?.viralityScore || 0;
  const primaryAngle = output.recommendedAngle || 'No angle recommended';

  // Find the most emotionally impactful fact
  const topFact =
    output.funFacts.emotionalHooks[0] ||
    output.funFacts.didYouKnow[0] ||
    output.funFacts.surprisingFacts[0] ||
    'No facts generated';

  return {
    topHook,
    viralityScore,
    primaryAngle,
    topFact,
    bagScore: output.bagQA?.overallScore,
  };
}
