/**
 * Discovery Curation Team - Type Definitions
 *
 * Types for the automated research and curation system that discovers
 * trending gear content and creates curated bags under @teed.
 */

// ============================================================================
// Categories
// ============================================================================

export type DiscoveryCategory = 'golf' | 'tech' | 'photography' | 'edc' | 'fitness';

export type SourceType = 'youtube' | 'tiktok' | 'website' | 'rss';

// ============================================================================
// Research Agent Types
// ============================================================================

export interface ProductLink {
  url: string;
  source: string; // 'amazon', 'ebay', 'manufacturer', 'specialty', etc.
  label: string; // Display label like "Buy on Amazon"
  affiliatable: boolean;
  priority?: number;
}

export interface DiscoveredProduct {
  name: string;
  brand: string;
  description: string;
  whyNotable: string; // What makes it special/trending
  sourceLink?: string; // Affiliate link from original content (if mentioned)
  productLinks?: ProductLink[]; // Where to buy (from SmartLinkFinder)
  buyUrl?: string; // Primary purchase URL
  imageUrl?: string; // Image from source
  confidence: number; // 0-100 identification confidence
  priceRange?: string; // Approximate price if mentioned
  specs?: Record<string, string>; // Any specs mentioned
}

export interface ResearchResult {
  category: DiscoveryCategory;
  sourceType: SourceType;
  sourceUrl: string;
  sourceTitle: string;
  sourceThumbnail?: string;
  transcript?: string;
  products: DiscoveredProduct[];
  theme: string; // "Tiger Woods' 2024 Bag", "Best Budget Mirrorless"
  creatorName?: string; // Who made the content
  publishedAt?: Date;
  viewCount?: number;
  metadata?: Record<string, unknown>;
  discoveredAt: Date;
}

export interface YouTubeResearchResult extends ResearchResult {
  sourceType: 'youtube';
  videoId: string;
  channelName: string;
  channelId: string;
  duration: string;
  likeCount?: number;
  commentCount?: number;
  tags?: string[];
}

export interface TikTokResearchResult extends ResearchResult {
  sourceType: 'tiktok';
  videoId: string;
  authorUsername: string;
  hashtags: string[];
  soundName?: string;
}

export interface WebsiteResearchResult extends ResearchResult {
  sourceType: 'website' | 'rss';
  articleAuthor?: string;
  siteName: string;
}

// ============================================================================
// Curation Agent Types
// ============================================================================

export interface CuratedItem {
  customName: string;
  brand: string;
  customDescription: string; // Specs
  notes: string; // Why it's notable
  whyChosen: string; // Rich context
  photoUrl: string;
  imageSource: 'source' | 'library' | 'manufacturer' | 'google';
  links: CuratedLink[];
  catalogItemId?: string; // If matched to product library
  sourceProductId?: string; // Reference to discovered_products
}

export interface CuratedLink {
  url: string;
  kind: 'product' | 'affiliate' | 'video' | 'creator_affiliate';
  label: string;
  metadata?: Record<string, unknown>;
}

export interface CuratedBag {
  title: string;
  description: string;
  category: DiscoveryCategory;
  tags: string[];
  items: CuratedItem[];
  sourceAttribution: string; // Credit original creators
  sourceUrls: string[]; // Original content URLs
  theme: string;
}

// ============================================================================
// Gap Analysis Types
// ============================================================================

export interface LibraryGap {
  productName: string;
  brand: string;
  category: DiscoveryCategory;
  mentionCount: number;
  sourceUrls: string[];
  firstSeenAt: Date;
  lastSeenAt: Date;
}

export interface GapAnalysisReport {
  category: DiscoveryCategory;
  generatedAt: Date;
  totalGaps: number;
  topGaps: LibraryGap[];
  recommendations: string[];
}

// ============================================================================
// Discovery Run Types
// ============================================================================

export type DiscoveryRunStatus = 'running' | 'completed' | 'failed';

export interface DiscoveryRun {
  id: string;
  category: DiscoveryCategory;
  status: DiscoveryRunStatus;
  sourcesFound: number;
  sourcesProcessed: number;
  productsFound: number;
  bagsCreated: number;
  bagIds: string[];
  startedAt: Date;
  completedAt?: Date;
  errorMessage?: string;
  config: DiscoveryRunConfig;
}

export interface DiscoveryRunConfig {
  maxSources?: number; // Limit sources to process
  maxProductsPerSource?: number;
  skipExisting?: boolean; // Skip already processed sources
  dryRun?: boolean; // Don't create bags, just research
  youtubeEnabled?: boolean;
  tiktokEnabled?: boolean;
  rssEnabled?: boolean;
  minConfidence?: number; // Minimum product confidence to include
  // Deduplication settings
  skipSourcesFromLastNDays?: number; // Skip sources processed in last N days (default: 14)
  maxProductRepeatPercent?: number; // Max % of products that can be repeats (default: 30)
  skipSourcesFromLastNRuns?: number; // Skip sources from last N runs (default: 2)
}

// ============================================================================
// Category Configuration Types
// ============================================================================

export interface CategoryConfig {
  name: DiscoveryCategory;
  displayName: string;
  youtubeQueries: string[]; // For trending/popular content
  newReleaseQueries?: string[]; // Queries for new product releases
  youtubeChannels?: string[]; // Known reliable channel IDs
  tiktokHashtags: string[];
  releaseFeeds: ReleaseSource[];
  productTypes: string[];
  brandKeywords: string[]; // Common brands to look for
  bagTitleTemplate: string; // e.g., "What's Trending in {category}"
  minVideoViews: number; // Minimum views for YouTube videos
}

export interface ReleaseSource {
  name: string;
  url: string;
  type: 'rss' | 'scrape';
  selectors?: {
    title?: string;
    content?: string;
    image?: string;
    link?: string;
  };
}

// ============================================================================
// Database Types (matching schema)
// ============================================================================

export interface DbDiscoverySource {
  id: string;
  source_type: SourceType;
  source_url: string;
  source_title: string | null;
  category: DiscoveryCategory;
  transcript: string | null;
  metadata: Record<string, unknown>;
  processed_at: string | null;
  created_at: string;
}

export interface DbDiscoveredProduct {
  id: string;
  source_id: string;
  product_name: string;
  brand: string | null;
  description: string | null;
  why_notable: string | null;
  source_link: string | null;
  image_url: string | null;
  image_source: string | null;
  confidence: number;
  matched_catalog_id: string | null;
  added_to_bag_id: string | null;
  created_at: string;
}

export interface DbDiscoveryRun {
  id: string;
  category: DiscoveryCategory;
  status: DiscoveryRunStatus;
  sources_found: number;
  sources_processed: number;
  products_found: number;
  bags_created: number;
  bag_ids: string[];
  started_at: string;
  completed_at: string | null;
  error_message: string | null;
  run_config: DiscoveryRunConfig;
}

export interface DbLibraryGap {
  id: string;
  product_name: string;
  brand: string | null;
  category: DiscoveryCategory;
  mention_count: number;
  first_seen_at: string;
  last_seen_at: string;
  source_urls: string[];
  resolved: boolean;
  resolved_at: string | null;
  resolved_catalog_id: string | null;
}

// ============================================================================
// Agent Interfaces
// ============================================================================

export interface ResearchAgent {
  research(category: DiscoveryCategory, config?: DiscoveryRunConfig): Promise<ResearchResult[]>;
}

export interface CurationAgent {
  curate(research: ResearchResult[], category: DiscoveryCategory): Promise<CuratedBag[]>;
  createBag(bag: CuratedBag, teedUserId: string): Promise<string>; // Returns bag ID
}

export interface GapAnalysisAgent {
  analyze(category: DiscoveryCategory): Promise<GapAnalysisReport>;
  recordGap(product: DiscoveredProduct, sourceUrl: string, category: DiscoveryCategory): Promise<void>;
}

// ============================================================================
// Orchestrator Types
// ============================================================================

export interface DiscoveryOrchestrator {
  run(category: DiscoveryCategory, config?: DiscoveryRunConfig): Promise<DiscoveryRun>;
  getStatus(runId: string): Promise<DiscoveryRun | null>;
  getRecentRuns(category?: DiscoveryCategory, limit?: number): Promise<DiscoveryRun[]>;
}

export interface DiscoveryResult {
  run: DiscoveryRun;
  bags: CuratedBag[];
  gapReport: GapAnalysisReport;
}
