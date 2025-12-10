/**
 * Agent Types for Content Generation Team
 * Shared types and interfaces for all specialized agents
 */

import type { ContentIdea, ExtractedProduct } from '@/lib/types/contentIdeas';
import type {
  AgentName,
  Wave1Output,
  Wave2Output,
  Wave3Output,
  ProductDetailsExpertOutput,
  FunFactsExpertOutput,
  ViralityManagerOutput,
  TikTokContent,
  ReelsContent,
  ShortsContent,
  BagQAOutput,
} from '@/lib/types/teamGeneration';

// ============================================
// Agent Context - Input for All Agents
// ============================================

export interface AgentContext {
  // Content idea data
  contentIdea: ContentIdea;

  // Source video info
  videoTitle: string;
  videoDescription: string;
  creatorName: string;
  vertical: string;

  // Products identified from video
  products: ExtractedProduct[];
  heroProducts: ExtractedProduct[];

  // Linked bag info (optional)
  bag?: {
    id: string;
    code: string;
    name: string;
    items: BagItem[];
    coverImageUrl?: string;
  };

  // Previous wave outputs (for dependent agents)
  wave1Output?: Wave1Output;
  wave2Output?: Wave2Output;

  // User feedback for revision (optional)
  feedback?: string;
}

export interface BagItem {
  id: string;
  name: string;
  brand?: string;
  description?: string;
  photo_url?: string;
  links?: {
    url: string;
    label?: string;
    source_type?: string;
  }[];
  category_name?: string;
  display_order: number;
}

// ============================================
// Agent Result Types
// ============================================

export interface AgentResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  tokenUsage?: number;
  durationMs?: number;
}

// Specific agent result types
export type ProductDetailsExpertResult = AgentResult<ProductDetailsExpertOutput>;
export type FunFactsExpertResult = AgentResult<FunFactsExpertOutput>;
export type ViralityManagerResult = AgentResult<ViralityManagerOutput>;
export type TikTokSpecialistResult = AgentResult<TikTokContent>;
export type ReelsSpecialistResult = AgentResult<ReelsContent>;
export type ShortsSpecialistResult = AgentResult<ShortsContent>;
export type BagQAAgentResult = AgentResult<BagQAOutput>;

// ============================================
// Base Agent Interface
// ============================================

export interface BaseAgent<TOutput> {
  name: AgentName;
  displayName: string;
  wave: 1 | 2 | 3;

  // Execute the agent's task
  execute(context: AgentContext): Promise<AgentResult<TOutput>>;

  // Get the system prompt for this agent
  getSystemPrompt(): string;

  // Get the user prompt with context
  getUserPrompt(context: AgentContext): string;
}

// ============================================
// Agent Factory Type
// ============================================

export type AgentFactory<T> = () => BaseAgent<T>;

// ============================================
// Progress Callback Type
// ============================================

export type ProgressCallback = (
  event:
    | { type: 'agent_start'; agent: AgentName; displayName: string }
    | { type: 'agent_progress'; agent: AgentName; message: string }
    | { type: 'agent_complete'; agent: AgentName; data: unknown }
    | { type: 'agent_failed'; agent: AgentName; error: string }
    | { type: 'agent_skipped'; agent: AgentName; reason: string }
) => void;

// ============================================
// LLM Configuration
// ============================================

export interface LLMConfig {
  model: string;
  temperature: number;
  maxTokens: number;
}

// Default configurations for different agent types
export const DEFAULT_LLM_CONFIGS: Record<string, LLMConfig> = {
  research: {
    model: 'gpt-4o',
    temperature: 0.4,
    maxTokens: 2500,
  },
  strategy: {
    model: 'gpt-4o',
    temperature: 0.6,
    maxTokens: 3000,
  },
  creative: {
    model: 'gpt-4o',
    temperature: 0.8,
    maxTokens: 2500,
  },
  qa: {
    model: 'gpt-4o-mini',
    temperature: 0.3,
    maxTokens: 2000,
  },
};

// ============================================
// Retry Configuration
// ============================================

export interface RetryConfig {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
}

export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  baseDelay: 1000,
  maxDelay: 10000,
};

// ============================================
// Utility Functions
// ============================================

/**
 * Format products for prompt context
 */
export function formatProductsForPrompt(products: ExtractedProduct[], maxCount = 10): string {
  const sorted = [...products]
    .sort((a, b) => (b.heroScore || 0) - (a.heroScore || 0))
    .slice(0, maxCount);

  return sorted
    .map(
      (p, i) =>
        `${i + 1}. ${p.brand || ''} ${p.name}
   Category: ${p.category || 'Unknown'}
   Hero Score: ${p.heroScore || 0}/100
   Context: ${p.mentionContext || 'Mentioned in video'}
   Story Signals: ${p.storySignals?.join(', ') || 'None'}`
    )
    .join('\n\n');
}

/**
 * Format hero products with more detail
 */
export function formatHeroProductsForPrompt(heroProducts: ExtractedProduct[]): string {
  if (heroProducts.length === 0) {
    return 'No specific hero products identified.';
  }

  return heroProducts
    .map(
      (p, i) =>
        `HERO ${i + 1}: ${p.brand || ''} ${p.name}
   Hero Score: ${p.heroScore || 0}/100
   Why It Matters: ${p.mentionContext || 'Featured prominently'}
   Story Signals: ${p.storySignals?.join(', ') || 'N/A'}
   Price Point: ${p.estimatedPrice || 'Unknown'}`
    )
    .join('\n\n');
}

/**
 * Format bag items for prompt context
 */
export function formatBagItemsForPrompt(items: BagItem[]): string {
  if (items.length === 0) {
    return 'No items in bag.';
  }

  return items
    .map(
      (item, i) =>
        `${i + 1}. ${item.brand ? `${item.brand} ` : ''}${item.name}
   Category: ${item.category_name || 'Uncategorized'}
   Description: ${item.description || 'No description'}
   Has Photo: ${item.photo_url ? 'Yes' : 'No'}
   Links: ${item.links?.length || 0} link(s)`
    )
    .join('\n\n');
}

/**
 * Extract key themes from content idea
 */
export function extractThemes(contentIdea: ContentIdea): string[] {
  const themes: string[] = [];

  // Extract from tags
  if (contentIdea.tags) {
    themes.push(...contentIdea.tags);
  }

  // Analyze title for themes
  const titleLower = contentIdea.idea_title?.toLowerCase() || '';
  if (titleLower.includes('vintage') || titleLower.includes('retro') || titleLower.includes('classic')) {
    themes.push('nostalgia');
  }
  if (titleLower.includes('budget') || titleLower.includes('affordable') || titleLower.includes('cheap')) {
    themes.push('value');
  }
  if (titleLower.includes('pro') || titleLower.includes('tour') || titleLower.includes('professional')) {
    themes.push('professional');
  }
  if (titleLower.includes('custom') || titleLower.includes('unique') || titleLower.includes('rare')) {
    themes.push('exclusivity');
  }

  return [...new Set(themes)];
}

/**
 * Calculate estimated virality based on content signals
 */
export function calculateBaseViralitySignals(
  contentIdea: ContentIdea,
  products: ExtractedProduct[]
): { signal: string; score: number; reasoning: string }[] {
  const signals: { signal: string; score: number; reasoning: string }[] = [];

  // Story depth signal
  const hasStoryProducts = products.filter(p => (p.storySignals?.length || 0) > 0).length;
  if (hasStoryProducts > 0) {
    signals.push({
      signal: 'story_depth',
      score: Math.min(40, hasStoryProducts * 10),
      reasoning: `${hasStoryProducts} products have story signals`,
    });
  }

  // Hero clarity signal
  const highHeroScoreProducts = products.filter(p => (p.heroScore || 0) >= 70).length;
  if (highHeroScoreProducts > 0) {
    signals.push({
      signal: 'hero_clarity',
      score: Math.min(30, highHeroScoreProducts * 15),
      reasoning: `${highHeroScoreProducts} products with strong hero potential`,
    });
  }

  // Tag-based signals
  const tags = contentIdea.tags || [];
  if (tags.includes('viral') || tags.includes('trending')) {
    signals.push({
      signal: 'trend_alignment',
      score: 20,
      reasoning: 'Content tagged as trending/viral',
    });
  }
  if (tags.includes('sentimental') || tags.includes('classic')) {
    signals.push({
      signal: 'emotional_hook',
      score: 25,
      reasoning: 'Content has emotional/sentimental angle',
    });
  }
  if (tags.includes('unique') || tags.includes('rare') || tags.includes('discontinued')) {
    signals.push({
      signal: 'curiosity_factor',
      score: 20,
      reasoning: 'Rare/unique items generate curiosity',
    });
  }

  return signals;
}
