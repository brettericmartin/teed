// Team Generation Types for Multi-Agent Content Generation

// ============================================
// WAVE 1: Research Phase - Agent Outputs
// ============================================

export interface ProductAnalysis {
  productName: string;
  specifications: Record<string, string>;
  uniqueFeatures: string[];
  competitorComparison: {
    competitor: string;
    advantage: string;
    disadvantage: string;
  }[];
  pricePositioning: 'budget' | 'mid-range' | 'premium' | 'luxury';
  targetAudience: string;
  bestUseCases: string[];
}

export interface ProductDetailsExpertOutput {
  heroProductAnalysis: ProductAnalysis[];
  technicalHighlights: string[];
  keySellingPoints: string[];
}

export interface CreatorFact {
  fact: string;
  source: string;
  emotionalWeight: 'low' | 'medium' | 'high';
  usageContext: string;
}

export interface ProductHistoryFact {
  fact: string;
  yearRelevant?: number;
  verifiable: boolean;
}

export interface FunFactsExpertOutput {
  creatorFacts: CreatorFact[];
  productHistory: ProductHistoryFact[];
  didYouKnow: string[];
  surprisingFacts: string[];
  emotionalHooks: string[];
}

export interface Wave1Output {
  productDetails: ProductDetailsExpertOutput;
  funFacts: FunFactsExpertOutput;
}

// ============================================
// WAVE 2: Strategy Phase - Agent Outputs
// ============================================

export interface HookCandidate {
  hook: string;
  score: number; // 0-100
  reasoning: string;
  trendFit: string[];
  platform: 'tiktok' | 'reels' | 'shorts' | 'all';
  style: 'shock' | 'curiosity' | 'educational' | 'emotional' | 'controversy' | 'transformation';
}

export interface ContentAngle {
  angle: string;
  viralityScore: number; // 0-100
  reasoning: string;
  bestPlatform: 'tiktok' | 'reels' | 'shorts' | 'all';
}

export interface TrendAlignment {
  trend: string;
  fitScore: number; // 0-100
  howToLeverage: string;
}

export interface AlgorithmInsights {
  watchTimeOptimizations: string[];
  engagementTriggers: string[];
  shareabilityFactors: string[];
  retentionTechniques: string[];
}

export interface ViralityManagerOutput {
  hookCandidates: HookCandidate[];
  contentAngles: ContentAngle[];
  trendAlignments: TrendAlignment[];
  algorithmInsights: AlgorithmInsights;
  recommendedPrimaryAngle: string;
  overallViralityAssessment: {
    score: number;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
  };
  // Optimized title and summary recommendations
  recommendedTitle?: string;
  recommendedSummary?: string;
}

export interface Wave2Output {
  viralityManager: ViralityManagerOutput;
}

// ============================================
// WAVE 3: Platform Specialists - Agent Outputs
// ============================================

export interface TikTokContent {
  hooks: {
    text: string;
    viralityScore: number;
    timing: string;
  }[];
  trendIntegrations: {
    trend: string;
    howToUse: string;
    soundSuggestion?: string;
  }[];
  hashtags: string[];
  soundSuggestions: string[];
  formatSuggestions: string[];
  scriptOutline: {
    section: string;
    duration: string;
    content: string;
  }[];
  captionTemplates: string[];
}

export interface ReelsContent {
  hooks: {
    text: string;
    visualConcept: string;
    viralityScore: number;
  }[];
  aestheticDirection: string;
  visualConcepts: string[];
  carouselIdeas: {
    title: string;
    slides: string[];
  }[];
  captionTemplates: string[];
  hashtags: string[];
  coverImageConcepts: string[];
  scriptOutline: {
    section: string;
    duration: string;
    content: string;
    visualNote: string;
  }[];
}

export interface ShortsContent {
  hooks: {
    text: string;
    thumbnailConcept: string;
    viralityScore: number;
  }[];
  titleOptions: string[];
  thumbnailConcepts: {
    description: string;
    textOverlay: string;
    style: string;
  }[];
  longFormTieIns: {
    videoIdea: string;
    howToConnect: string;
  }[];
  seoKeywords: string[];
  scriptOutline: {
    section: string;
    duration: string;
    content: string;
  }[];
  descriptionTemplate: string;
}

export interface PhotoQualityAssessment {
  itemId: string;
  itemName: string;
  currentPhotoUrl?: string;
  quality: 'good' | 'needs_improvement' | 'missing';
  recommendation: string;
  suggestedSearchQuery?: string;
}

export interface DescriptionImprovement {
  itemId: string;
  itemName: string;
  currentDescription?: string;
  suggestedDescription: string;
  reasoning: string;
}

export interface LinkAssessment {
  itemId: string;
  itemName: string;
  hasAffiliateLink: boolean;
  currentLinks: string[];
  missingLinkTypes: string[];
  searchQuery: string;
}

export interface ItemSuggestion {
  productName: string;
  brand: string;
  reasoning: string;
  mentionedInVideo: boolean;
  searchQuery: string;
  estimatedPrice?: string;
  category?: string;
}

export interface BagQAOutput {
  overallScore: number; // 0-100
  bagSummary: {
    totalItems: number;
    itemsWithPhotos: number;
    itemsWithDescriptions: number;
    itemsWithAffiliateLinks: number;
  };
  photoQualityAssessment: PhotoQualityAssessment[];
  descriptionImprovements: DescriptionImprovement[];
  linkAssessment: LinkAssessment[];
  itemSuggestions: ItemSuggestion[];
  prioritizedActions: {
    priority: 'high' | 'medium' | 'low';
    action: string;
    impact: string;
  }[];
}

export interface Wave3Output {
  tiktok: TikTokContent;
  reels: ReelsContent;
  shorts: ShortsContent;
  bagQA?: BagQAOutput; // Only present if bag exists
}

// ============================================
// Final Merged Output
// ============================================

export interface MergedHook {
  hook: string;
  viralityScore: number;
  platforms: ('tiktok' | 'reels' | 'shorts')[];
  style: string;
  reasoning: string;
  trendFit: string[];
}

export interface TeamGenerationOutput {
  // Merged content
  topHooks: MergedHook[];
  recommendedAngle: string;

  // Optimized title and summary for the content idea
  recommendedTitle?: string;
  recommendedSummary?: string;

  // Platform-specific content
  platformContent: {
    tiktok: TikTokContent;
    reels: ReelsContent;
    shorts: ShortsContent;
  };

  // Research data
  productInsights: ProductDetailsExpertOutput;
  funFacts: FunFactsExpertOutput;

  // Strategy data
  viralityAnalysis: ViralityManagerOutput;

  // Bag improvements (if applicable)
  bagQA?: BagQAOutput;

  // Metadata
  generatedAt: string;
  tokenUsage: {
    wave1: number;
    wave2: number;
    wave3: number;
    total: number;
  };
}

// ============================================
// Stream Events for Real-time Updates
// ============================================

export type AgentName =
  | 'productDetailsExpert'
  | 'funFactsExpert'
  | 'viralityManager'
  | 'tiktokSpecialist'
  | 'reelsSpecialist'
  | 'shortsSpecialist'
  | 'bagQAAgent';

export type AgentStatus = 'pending' | 'running' | 'completed' | 'failed' | 'skipped';

export interface AgentProgress {
  name: AgentName;
  displayName: string;
  status: AgentStatus;
  wave: 1 | 2 | 3;
  startedAt?: string;
  completedAt?: string;
  error?: string;
}

export type StreamEvent =
  | { type: 'generation_start'; progress: number; totalAgents: number }
  | { type: 'wave_start'; wave: 1 | 2 | 3; progress: number; agents: string[] }
  | { type: 'agent_start'; agent: AgentName; displayName: string; progress: number }
  | { type: 'agent_progress'; agent: AgentName; message: string; progress: number }
  | { type: 'agent_complete'; agent: AgentName; data: unknown; progress: number }
  | { type: 'agent_failed'; agent: AgentName; error: string; progress: number }
  | { type: 'agent_skipped'; agent: AgentName; reason: string; progress: number }
  | { type: 'wave_complete'; wave: 1 | 2 | 3; progress: number }
  | { type: 'merging'; progress: number }
  | { type: 'final'; data: TeamGenerationOutput; progress: 100 }
  | { type: 'error'; error: string; progress: number };

// ============================================
// Database Types
// ============================================

export type TeamGenerationStatus = 'pending' | 'running' | 'completed' | 'failed';

export interface TeamGenerationRecord {
  id: string;
  content_idea_id: string;
  status: TeamGenerationStatus;
  current_wave: number;
  progress_percent: number;
  wave1_output: Wave1Output | null;
  wave2_output: Wave2Output | null;
  wave3_output: Wave3Output | null;
  final_output: TeamGenerationOutput | null;
  token_usage: {
    wave1?: number;
    wave2?: number;
    wave3?: number;
    total?: number;
  };
  started_at: string | null;
  completed_at: string | null;
  error_message: string | null;
  created_at: string;
}

// ============================================
// Agent Configuration
// ============================================

export interface AgentConfig {
  name: AgentName;
  displayName: string;
  wave: 1 | 2 | 3;
  description: string;
  dependsOn: AgentName[];
  optional: boolean;
}

export const AGENT_CONFIGS: AgentConfig[] = [
  {
    name: 'productDetailsExpert',
    displayName: 'Product Details Expert',
    wave: 1,
    description: 'Analyzes technical specs, features, and market positioning',
    dependsOn: [],
    optional: false,
  },
  {
    name: 'funFactsExpert',
    displayName: 'Fun Facts Expert',
    wave: 1,
    description: 'Discovers creator lore, product history, and emotional hooks',
    dependsOn: [],
    optional: false,
  },
  {
    name: 'viralityManager',
    displayName: 'Virality Manager',
    wave: 2,
    description: 'Scores hooks, identifies trends, and optimizes for algorithms',
    dependsOn: ['productDetailsExpert', 'funFactsExpert'],
    optional: false,
  },
  {
    name: 'tiktokSpecialist',
    displayName: 'TikTok Specialist',
    wave: 3,
    description: 'Creates TikTok-native content with trends and sounds',
    dependsOn: ['viralityManager'],
    optional: false,
  },
  {
    name: 'reelsSpecialist',
    displayName: 'Reels Specialist',
    wave: 3,
    description: 'Designs aesthetic hooks and visual concepts for Instagram',
    dependsOn: ['viralityManager'],
    optional: false,
  },
  {
    name: 'shortsSpecialist',
    displayName: 'Shorts Specialist',
    wave: 3,
    description: 'Optimizes for YouTube SEO and thumbnail strategy',
    dependsOn: ['viralityManager'],
    optional: false,
  },
  {
    name: 'bagQAAgent',
    displayName: 'Bag QA Agent',
    wave: 3,
    description: 'Reviews linked Teed bag for quality improvements',
    dependsOn: ['viralityManager'],
    optional: true, // Only runs if bag exists
  },
];

// Helper to get agents by wave
export function getAgentsByWave(wave: 1 | 2 | 3): AgentConfig[] {
  return AGENT_CONFIGS.filter(a => a.wave === wave);
}

// Helper to calculate progress percentage
export function calculateProgress(
  completedAgents: AgentName[],
  currentAgent?: AgentName,
  hasBag?: boolean
): number {
  const totalAgents = hasBag ? 7 : 6;
  const completedCount = completedAgents.length;
  const currentProgress = currentAgent ? 0.5 : 0;
  return Math.round(((completedCount + currentProgress) / totalAgents) * 100);
}
