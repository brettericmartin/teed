/**
 * Content Ideas (Social Media Manager) Types
 * Type definitions for the content idea machine feature
 */

// ═══════════════════════════════════════════════════════════════════
// Enums and Constants
// ═══════════════════════════════════════════════════════════════════

// Staged workflow statuses
export type ContentIdeaStatus =
  // Stage 1: Discovery (lightweight, no LLM)
  | 'discovered'        // Found via YouTube scan, basic metadata only
  | 'new'               // Legacy, treat as 'discovered'

  // Stage 2: Screening (admin selection)
  | 'screening'         // In screening queue for admin review
  | 'selected'          // Admin selected for full generation
  | 'skipped'           // Admin passed on this one

  // Stage 3: Generation (full LLM pipeline)
  | 'generating'        // Currently running LLM generation
  | 'generated'         // Full content generated, ready for review

  // Stage 4: Final review & publish
  | 'in_review'         // Final review before approval
  | 'approved'          // Approved for use
  | 'archived'          // Archived (done or no longer relevant)
  | 'rejected';         // Rejected

// Workflow stages for UI
export type WorkflowStage = 'discovery' | 'screening' | 'generation' | 'review';

export const STATUS_TO_STAGE: Record<ContentIdeaStatus, WorkflowStage> = {
  discovered: 'discovery',
  new: 'discovery',
  screening: 'screening',
  selected: 'screening',
  skipped: 'screening',
  generating: 'generation',
  generated: 'generation',
  in_review: 'review',
  approved: 'review',
  archived: 'review',
  rejected: 'review',
};

export const STAGE_DISPLAY_NAMES: Record<WorkflowStage, string> = {
  discovery: 'Discovery',
  screening: 'Screening',
  generation: 'Generation',
  review: 'Review',
};

export type ContentVertical =
  | 'golf'
  | 'camera'
  | 'makeup'
  | 'desk'
  | 'tech'
  | 'edc'
  | 'fitness'
  | 'music'
  | 'art'
  | 'gaming'
  | 'travel'
  | 'food'
  | 'fashion'
  | 'other';

export type SourcePlatform = 'youtube' | 'tiktok' | 'instagram' | 'twitter';

export const VERTICAL_DISPLAY_NAMES: Record<ContentVertical, string> = {
  golf: 'Golf',
  camera: 'Camera & Photo',
  makeup: 'Makeup & Beauty',
  desk: 'Desk Setup',
  tech: 'Tech & Gadgets',
  edc: 'EDC',
  fitness: 'Fitness',
  music: 'Music',
  art: 'Art & Creative',
  gaming: 'Gaming',
  travel: 'Travel',
  food: 'Food & Kitchen',
  fashion: 'Fashion',
  other: 'Other',
};

export const VERTICAL_SEARCH_QUERIES: Record<ContentVertical, string[]> = {
  golf: ["what's in the bag golf", 'WITB golf', 'pro golfer bag', 'golf bag setup'],
  camera: ["what's in my camera bag", 'camera gear', 'photography kit', 'filmmaker setup'],
  makeup: ["what's in my makeup bag", 'everyday makeup', 'makeup collection', 'beauty bag'],
  desk: ['desk setup', 'workspace tour', 'home office setup', 'desk tour'],
  tech: ['tech setup', 'everyday carry tech', 'gadget collection', 'tech bag'],
  edc: ['everyday carry', 'EDC', 'pocket dump', 'EDC gear'],
  fitness: ['gym bag essentials', 'workout gear', 'fitness equipment', 'home gym setup'],
  music: ['studio setup', 'music gear', 'guitar collection', 'producer setup'],
  art: ['art supplies', 'drawing setup', 'artist studio tour', 'art materials'],
  gaming: ['gaming setup', 'gaming room tour', 'gaming gear', 'gaming desk'],
  travel: ['travel essentials', 'packing list', 'travel gear', 'carry on packing'],
  food: ['kitchen essentials', 'cooking gear', 'kitchen setup', 'chef tools'],
  fashion: ['wardrobe essentials', 'closet tour', 'fashion haul', 'style essentials'],
  other: ['setup tour', 'gear collection', 'essentials'],
};

export const STATUS_DISPLAY_NAMES: Record<ContentIdeaStatus, string> = {
  // Discovery
  discovered: 'Discovered',
  new: 'New',
  // Screening
  screening: 'Screening',
  selected: 'Selected',
  skipped: 'Skipped',
  // Generation
  generating: 'Generating...',
  generated: 'Generated',
  // Review
  in_review: 'In Review',
  approved: 'Approved',
  archived: 'Archived',
  rejected: 'Rejected',
};

export const STATUS_COLORS: Record<ContentIdeaStatus, string> = {
  // Discovery - blue
  discovered: 'bg-blue-100 text-blue-800',
  new: 'bg-blue-100 text-blue-800',
  // Screening - purple
  screening: 'bg-purple-100 text-purple-800',
  selected: 'bg-indigo-100 text-indigo-800',
  skipped: 'bg-gray-100 text-gray-500',
  // Generation - amber
  generating: 'bg-amber-100 text-amber-800 animate-pulse',
  generated: 'bg-amber-100 text-amber-800',
  // Review - green/red
  in_review: 'bg-cyan-100 text-cyan-800',
  approved: 'bg-green-100 text-green-800',
  archived: 'bg-gray-100 text-gray-800',
  rejected: 'bg-red-100 text-red-800',
};

// ═══════════════════════════════════════════════════════════════════
// Source Metadata Types
// ═══════════════════════════════════════════════════════════════════

export interface YouTubeVideoMetadata {
  videoId: string;
  title: string;
  description: string;
  channelId: string;
  channelTitle: string;
  publishedAt: string;
  thumbnails: {
    default?: { url: string; width: number; height: number };
    medium?: { url: string; width: number; height: number };
    high?: { url: string; width: number; height: number };
    maxres?: { url: string; width: number; height: number };
  };
  statistics?: {
    viewCount: string;
    likeCount?: string;
    commentCount?: string;
  };
  duration?: string;
  tags?: string[];
}

export interface ExtractedLink {
  url: string;
  domain: string;
  label?: string;
  anchorText?: string;
  isAffiliate: boolean;
  affiliateType?: 'amazon' | 'shareasale' | 'cj' | 'impact' | 'skimlinks' | 'other';
  productHint?: string; // extracted product name from context
}

export interface SourceMetadata {
  // YouTube-specific
  youtube?: YouTubeVideoMetadata;

  // Extracted from description
  extractedLinks?: ExtractedLink[];

  // Raw API response for debugging
  rawResponse?: unknown;

  // Processing metadata
  processedAt?: string;
  extractionVersion?: string;
}

// ═══════════════════════════════════════════════════════════════════
// Content Generation Types
// ═══════════════════════════════════════════════════════════════════

export interface HookOption {
  hook: string;
  platform: 'tiktok' | 'reels' | 'shorts' | 'all';
  style: 'curiosity' | 'controversy' | 'story' | 'question' | 'reveal' | 'comparison';
  focusItemId?: string; // catalog_item or bag_item UUID
}

export interface LongFormOutline {
  intro: string;
  creatorStory: string;
  heroBreakdown: string;
  comparison?: string;
  demonstration?: string;
  bagContext: string; // how this fits into a full Teed bag/setup
  cta: string;
  estimatedDurationMinutes?: number;
}

export interface ShortFormIdea {
  hook: string;
  narrative: string;
  durationSeconds: number;
  onScreenText?: string[];
  focusItemId?: string;
  beatType: 'story' | 'tip' | 'comparison' | 'reaction' | 'reveal';
  platform?: 'tiktok' | 'reels' | 'shorts';
}

export type ContentTag =
  | 'sentimental'
  | 'tour-pro'
  | 'budget'
  | 'retro'
  | 'high-tech'
  | 'underrated'
  | 'viral'
  | 'trending'
  | 'classic'
  | 'unique'
  | 'discontinued'
  | 'rare'
  | 'custom'
  | 'diy'
  | 'sponsored'
  | 'celebrity'
  // Roundup/collection tags
  | 'roundup'
  | 'deals'
  | 'gift-guide'
  | 'premium'
  | 'curated'
  | 'collection'
  | 'best-of'
  | 'comparison'
  | 'seasonal';

// ═══════════════════════════════════════════════════════════════════
// Extraction Metadata Types
// ═══════════════════════════════════════════════════════════════════

export interface ExtractionMetadata {
  // Content type detection
  contentType?: 'single_hero' | 'roundup' | 'comparison';
  contentTypeSignals?: {
    titleSignals: string[];
    transcriptSignals: string[];
    detectedType: string;
    confidence: number;
  };
  // Extraction sources used
  extractionSources?: {
    description: boolean;
    transcript: boolean;
    frames: boolean;
  };
  transcriptAvailable?: boolean;
  framesAnalyzed?: number;
  // Validation metadata
  objectValidationAt?: string;
  objectValidationNotes?: string;
  productValidationAt?: string;
  productValidationNotes?: string;
  validationComplete?: boolean;
  // Extraction timestamp
  extractedAt?: string;
}

// ═══════════════════════════════════════════════════════════════════
// Main Content Idea Type
// ═══════════════════════════════════════════════════════════════════

export interface ContentIdea {
  id: string;

  // Source info
  source_platform: SourcePlatform;
  source_url: string;
  source_channel_name: string | null;
  source_creator_handle: string | null;
  source_published_at: string | null;
  source_metadata: SourceMetadata;

  // Connection into Teed
  primary_bag_id: string | null;
  primary_catalog_item_id: string | null;
  hero_catalog_item_ids: string[];
  hero_bag_item_ids: string[];

  // Story & angle
  vertical: ContentVertical | null;
  idea_title: string | null;
  idea_summary: string | null;
  why_interesting_to_creator: string | null;
  why_interesting_to_audience: string | null;

  // Content assets
  hook_options: HookOption[];
  long_form_outline: LongFormOutline | null;
  short_form_ideas: ShortFormIdea[];
  tags: ContentTag[];

  // Affiliate and ethics
  affiliate_notes: string | null;
  has_creator_affiliate: boolean;

  // Workflow
  status: ContentIdeaStatus;
  created_by_admin_id: string | null;
  reviewed_at: string | null;
  approved_at: string | null;

  // Staged workflow
  discovered_at: string | null;
  screened_at: string | null;
  generated_at: string | null;
  screened_by_admin_id: string | null;
  screening_notes: string | null;
  extracted_products: ExtractedProduct[];

  // Unified extraction (multi-source)
  extraction_metadata?: ExtractionMetadata;
  validated_products?: ExtractedProduct[];
  validation_status?: 'pending' | 'object_validated' | 'product_validated' | 'completed';
  validated_at?: string;
  validated_by_admin_id?: string;

  // Timestamps
  created_at: string;
  updated_at: string;
}

// ═══════════════════════════════════════════════════════════════════
// API Request/Response Types
// ═══════════════════════════════════════════════════════════════════

export interface CreateContentIdeaRequest {
  source_platform: SourcePlatform;
  source_url: string;
  source_channel_name?: string;
  source_creator_handle?: string;
  source_published_at?: string;
  source_metadata?: SourceMetadata;
  vertical?: ContentVertical;
}

export interface UpdateContentIdeaRequest {
  idea_title?: string;
  idea_summary?: string;
  why_interesting_to_creator?: string;
  why_interesting_to_audience?: string;
  hook_options?: HookOption[];
  long_form_outline?: LongFormOutline;
  short_form_ideas?: ShortFormIdea[];
  tags?: ContentTag[];
  affiliate_notes?: string;
  status?: ContentIdeaStatus;
  primary_bag_id?: string | null;
  primary_catalog_item_id?: string | null;
  hero_catalog_item_ids?: string[];
  hero_bag_item_ids?: string[];
}

export interface ContentIdeasListResponse {
  ideas: ContentIdea[];
  total: number;
  page: number;
  pageSize: number;
}

export interface ContentIdeasFilters {
  status?: ContentIdeaStatus;
  vertical?: ContentVertical;
  hasCreatorAffiliate?: boolean;
  search?: string;
  dateFrom?: string;
  dateTo?: string;
  page?: number;
  pageSize?: number;
}

// ═══════════════════════════════════════════════════════════════════
// Ingestion Types
// ═══════════════════════════════════════════════════════════════════

export interface RefreshWeeklyIdeasRequest {
  verticals?: ContentVertical[];
  maxVideosPerVertical?: number;
  daysBack?: number;
  skipExisting?: boolean;
}

export interface RefreshWeeklyIdeasResponse {
  success: boolean;
  videosProcessed: number;
  ideasCreated: number;
  ideasUpdated: number;
  errors: Array<{
    videoUrl: string;
    error: string;
  }>;
  byVertical: Record<
    ContentVertical,
    {
      videosFound: number;
      ideasCreated: number;
    }
  >;
}

// ═══════════════════════════════════════════════════════════════════
// Staged Workflow Types
// ═══════════════════════════════════════════════════════════════════

/** Stage 1: Discovery - lightweight scan, no LLM */
export interface DiscoverVideosRequest {
  verticals?: ContentVertical[];
  maxVideosPerVertical?: number;
  daysBack?: number;
  skipExisting?: boolean;
  minViews?: number; // Minimum view count to filter small channels (default: 10000)
}

export interface DiscoverVideosResponse {
  success: boolean;
  videosDiscovered: number;
  byVertical: Record<ContentVertical, number>;
  errors: Array<{ videoUrl: string; error: string }>;
}

/** Stage 2: Screening - admin selects candidates */
export interface ScreenIdeasRequest {
  ideaIds: string[];
  action: 'select' | 'skip';
  notes?: string;
}

export interface ScreenIdeasResponse {
  success: boolean;
  processed: number;
  selected: number;
  skipped: number;
}

/** Stage 3: Generation - full LLM pipeline on selected items */
export interface GenerateContentRequest {
  ideaIds: string[];
  options?: {
    skipProductExtraction?: boolean;
    skipHooks?: boolean;
    skipLongForm?: boolean;
    skipShortForm?: boolean;
  };
}

export interface GenerateContentResponse {
  success: boolean;
  generated: number;
  failed: number;
  results: Array<{
    ideaId: string;
    success: boolean;
    error?: string;
  }>;
}

/** Workflow stage counts for UI */
export interface WorkflowStageCounts {
  discovery: number;  // discovered status
  screening: number;  // screening + selected statuses
  generation: number; // generating + generated statuses
  review: number;     // in_review + approved + archived + rejected
  total: number;
}

export interface ExtractedProduct {
  name: string;
  brand?: string;
  category?: string;
  modelNumber?: string;
  estimatedPrice?: string;
  mentionContext?: string; // context from where it was mentioned in video
  isHeroCandidate: boolean;
  heroScore?: number; // 0-100, based on story/novelty/viral potential
  storySignals?: string[]; // e.g., "creator mentioned personal story", "vintage/discontinued"
  matchedCatalogItemId?: string;
  links?: ExtractedLink[]; // Affiliate/purchase links associated with this product
}

// ═══════════════════════════════════════════════════════════════════
// LLM Generation Types
// ═══════════════════════════════════════════════════════════════════

export interface GenerateIdeaInput {
  contentIdea: ContentIdea;
  mappedProducts: ExtractedProduct[];
  videoTitle: string;
  videoDescription: string;
  creatorName: string;
}

export interface GenerateIdeaOutput {
  idea_title: string;
  idea_summary: string;
  why_interesting_to_creator: string;
  why_interesting_to_audience: string;
  tags: ContentTag[];
  affiliate_notes: string;
  has_creator_affiliate: boolean;
  hero_catalog_item_ids: string[];
}

export interface GenerateHooksInput {
  contentIdea: ContentIdea;
  heroProducts: ExtractedProduct[];
}

export interface GenerateHooksOutput {
  hook_options: HookOption[];
  long_form_outline: LongFormOutline;
}

export interface GenerateShortFormInput {
  longFormOutline: LongFormOutline;
  heroProducts: ExtractedProduct[];
  vertical: ContentVertical;
}

export interface GenerateShortFormOutput {
  short_form_ideas: ShortFormIdea[];
}

// ═══════════════════════════════════════════════════════════════════
// Admin Dashboard Types
// ═══════════════════════════════════════════════════════════════════

export interface ContentIdeaForAdmin extends ContentIdea {
  // Joined data for display
  primaryBag?: {
    id: string;
    code: string;
    title: string;
    owner: {
      id: string;
      handle: string;
      display_name: string;
    };
  };
  primaryCatalogItem?: {
    id: string;
    brand: string;
    model: string;
    category: string;
    image_url: string | null;
  };
  heroCatalogItems?: Array<{
    id: string;
    brand: string;
    model: string;
    category: string;
    image_url: string | null;
  }>;
  createdByAdmin?: {
    id: string;
    handle: string;
    display_name: string;
  };
}

export interface ContentIdeasStats {
  total: number;
  byStatus: Record<ContentIdeaStatus, number>;
  byVertical: Record<ContentVertical, number>;
  withCreatorAffiliate: number;
  thisWeek: number;
  pendingReview: number;
}

// ═══════════════════════════════════════════════════════════════════
// Affiliate Detection Types
// ═══════════════════════════════════════════════════════════════════

export const AFFILIATE_DOMAINS = [
  'amzn.to',
  'amazon.com/gp/product',
  'amazon.com/dp/',
  'a.co',
  'shareasale.com',
  'rstyle.me',
  'shopstyle.it',
  'go.magik.ly',
  'howl.me',
  'rstyle.me',
  'prf.hn',
  'bit.ly',
  'linktr.ee',
  'beacons.ai',
  'stan.store',
  'geni.us',
  'kit.co',
] as const;

export const AFFILIATE_PARAMS = [
  'tag=',
  'ref=',
  'affid=',
  'aff_id=',
  'affiliate=',
  'partner=',
  'utm_source=affiliate',
  'subid=',
] as const;

export function isAffiliateLinkUrl(url: string): boolean {
  const lowerUrl = url.toLowerCase();

  // Check for known affiliate domains
  for (const domain of AFFILIATE_DOMAINS) {
    if (lowerUrl.includes(domain)) {
      return true;
    }
  }

  // Check for affiliate parameters
  for (const param of AFFILIATE_PARAMS) {
    if (lowerUrl.includes(param)) {
      return true;
    }
  }

  return false;
}

export function getAffiliateDomain(url: string): ExtractedLink['affiliateType'] {
  const lowerUrl = url.toLowerCase();

  if (lowerUrl.includes('amazon') || lowerUrl.includes('amzn') || lowerUrl.includes('a.co')) {
    return 'amazon';
  }
  if (lowerUrl.includes('shareasale')) {
    return 'shareasale';
  }
  if (lowerUrl.includes('cj.com') || lowerUrl.includes('commission-junction')) {
    return 'cj';
  }
  if (lowerUrl.includes('impact.com') || lowerUrl.includes('prf.hn')) {
    return 'impact';
  }
  if (lowerUrl.includes('skimlinks') || lowerUrl.includes('go.skimresources')) {
    return 'skimlinks';
  }

  return 'other';
}

// ═══════════════════════════════════════════════════════════════════
// Search Query Types (for dynamic trend management)
// ═══════════════════════════════════════════════════════════════════

export type SearchQueryType = 'evergreen' | 'event' | 'product_launch' | 'creator' | 'trending';

export interface SearchQuery {
  id: string;
  query: string;
  vertical: ContentVertical;
  query_type: SearchQueryType;
  priority: number;
  is_active: boolean;
  starts_at: string | null;
  expires_at: string | null;
  notes: string | null;
  source: string | null;
  last_used_at: string | null;
  videos_found: number;
  created_by_admin_id: string | null;
  updated_by_admin_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateSearchQueryRequest {
  query: string;
  vertical: ContentVertical;
  query_type?: SearchQueryType;
  priority?: number;
  is_active?: boolean;
  starts_at?: string;
  expires_at?: string;
  notes?: string;
  source?: string;
}

export interface UpdateSearchQueryRequest {
  query?: string;
  vertical?: ContentVertical;
  query_type?: SearchQueryType;
  priority?: number;
  is_active?: boolean;
  starts_at?: string | null;
  expires_at?: string | null;
  notes?: string | null;
}

export const QUERY_TYPE_DISPLAY_NAMES: Record<SearchQueryType, string> = {
  evergreen: 'Evergreen',
  event: 'Event',
  product_launch: 'Product Launch',
  creator: 'Creator',
  trending: 'Trending',
};

export const QUERY_TYPE_COLORS: Record<SearchQueryType, string> = {
  evergreen: 'bg-green-100 text-green-800',
  event: 'bg-blue-100 text-blue-800',
  product_launch: 'bg-purple-100 text-purple-800',
  creator: 'bg-amber-100 text-amber-800',
  trending: 'bg-pink-100 text-pink-800',
};

// AI Trend Suggestion Types
export interface TrendSuggestion {
  query: string;
  vertical: ContentVertical;
  query_type: SearchQueryType;
  reason: string;
  priority: number;
  expires_at?: string;
}

export interface SuggestTrendsRequest {
  verticals?: ContentVertical[];
}

export interface SuggestTrendsResponse {
  suggestions: TrendSuggestion[];
  generated_at: string;
}
