/**
 * Bag Analyzer Types
 *
 * Types for the bag analysis and recommendation system.
 */

export type AnalysisDimension =
  | 'completeness'
  | 'seo'
  | 'organization'
  | 'monetization'
  | 'quality'
  | 'engagement';

export type IssueLevel = 'critical' | 'warning' | 'suggestion' | 'info';

export interface AnalysisIssue {
  id: string;
  dimension: AnalysisDimension;
  level: IssueLevel;
  title: string;
  description: string;
  recommendation: string;
  impact: number; // 1-10 scale
  effort: 'easy' | 'medium' | 'hard';
}

export interface DimensionScore {
  dimension: AnalysisDimension;
  score: number; // 0-100
  maxScore: number;
  label: string;
  description: string;
  issues: AnalysisIssue[];
}

export interface CompletenessAnalysis {
  hasTitle: boolean;
  hasMeaningfulDescription: boolean;
  descriptionLength: number;
  hasCoverPhoto: boolean;
  hasMetaDescription: boolean;
  metaDescriptionLength: number;
  itemCount: number;
  itemsWithPhotos: number;
  itemsWithDescriptions: number;
  itemsWithBrands: number;
  hasSections: boolean;
  sectionCount: number;
  hasTags: boolean;
  tagCount: number;
  hasCategory: boolean;
}

export interface SEOAnalysis {
  titleLength: number;
  titleHasKeywords: boolean;
  metaDescriptionLength: number;
  metaDescriptionOptimal: boolean; // 120-160 chars
  tagCount: number;
  tagsOptimal: boolean; // 3-7 tags
  hasCategory: boolean;
  categoryMatches: boolean; // category matches content
  urlSlugOptimal: boolean;
  descriptionHasKeywords: boolean;
}

export interface OrganizationAnalysis {
  hasSections: boolean;
  sectionCount: number;
  averageItemsPerSection: number;
  hasFeaturedItems: boolean;
  featuredItemCount: number;
  itemsAreSorted: boolean;
  hasLogicalGrouping: boolean;
}

export interface MonetizationAnalysis {
  totalItems: number;
  itemsWithAffiliateLinks: number;
  affiliateLinkCoverage: number; // percentage
  hasAmazonLinks: boolean;
  hasDirectLinks: boolean;
  linksAreFresh: boolean; // no broken links
  potentialRevenue: 'low' | 'medium' | 'high';
}

export interface QualityAnalysis {
  averageItemDescriptionLength: number;
  itemsWithBrandInfo: number;
  itemsWithPriceInfo: number;
  itemsWithPhotos: number;
  photoQuality: 'poor' | 'fair' | 'good' | 'excellent';
  uniqueItems: number; // non-generic items
  totalItems: number;
}

export interface EngagementAnalysis {
  hasFeaturedItems: boolean;
  featuredItemCount: number;
  hasHeroItem: boolean;
  visualAppeal: 'poor' | 'fair' | 'good' | 'excellent';
  storyPotential: number; // 0-100
  shareability: number; // 0-100
}

export interface MissingItem {
  name: string;
  category: string;
  reason: string;
  priority: 'essential' | 'recommended' | 'optional';
}

export interface BagAnalysisInput {
  bagId?: string;
  bagCode?: string;
  userId: string;
  includeAIAnalysis?: boolean;
}

export interface BagAnalysisResult {
  bagId: string;
  bagCode: string;
  bagTitle: string;
  overallScore: number; // 0-100
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  dimensions: DimensionScore[];
  topIssues: AnalysisIssue[];
  quickWins: AnalysisIssue[];
  missingItems: MissingItem[];
  strengths: string[];
  analyzedAt: Date;
}

export interface BagData {
  id: string;
  code: string;
  title: string;
  description: string | null;
  category: string | null;
  tags: string[] | null;
  meta_description: string | null;
  cover_photo_id: string | null;
  hero_item_id: string | null;
  is_complete: boolean;
  is_public: boolean;
  created_at: string;
  updated_at: string;
  items: BagItemData[];
  sections: BagSectionData[];
}

export interface BagItemData {
  id: string;
  name: string;
  brand: string | null;
  custom_description: string | null;
  photo_url: string | null;
  is_featured: boolean;
  featured_position: number | null;
  sort_index: number;
  section_id: string | null;
  links: BagItemLinkData[];
}

export interface BagItemLinkData {
  id: string;
  url: string;
  link_type: 'product' | 'affiliate' | 'video' | 'review' | 'other';
  is_affiliate: boolean;
}

export interface BagSectionData {
  id: string;
  name: string;
  description: string | null;
  sort_index: number;
}
