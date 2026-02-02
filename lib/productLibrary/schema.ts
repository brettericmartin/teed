/**
 * Product Library Schema
 *
 * Comprehensive type definitions for the SKU-level product catalog
 * used for text and photo identification across all categories.
 */

// =============================================================================
// Core Types
// =============================================================================

export type Category =
  // Sports & Recreation
  | 'golf'
  | 'tennis'
  | 'basketball'
  | 'soccer'
  | 'sports'
  | 'cycling'
  | 'running'
  | 'snow'
  | 'surf'
  | 'motorcycle'
  // Fitness & Wellness
  | 'fitness'
  | 'activewear'
  | 'athletic'
  | 'wearables'
  | 'supplements'
  // Tech & Electronics
  | 'tech'
  | 'audio'
  | 'gaming'
  | 'streaming'
  | 'photography'
  // Fashion & Apparel
  | 'fashion'
  | 'apparel'
  | 'footwear'
  | 'eyewear'
  | 'bags'
  | 'watches'
  // Beauty & Personal Care
  | 'beauty'
  | 'makeup'
  | 'skincare'
  | 'haircare'
  | 'grooming'
  // Home & Living
  | 'home'
  | 'kitchen'
  | 'bedding'
  | 'office'
  // Outdoor & Adventure
  | 'outdoor'
  | 'travel'
  | 'edc'
  // Hobbies & Entertainment
  | 'music'
  | 'hobbies'
  | 'art'
  | 'books'
  // Food & Beverage
  | 'coffee'
  | 'food'
  | 'spirits'
  // Automotive
  | 'automotive'
  // Family
  | 'baby'
  | 'kids'
  | 'pet'
  // Health
  | 'health'
  // General
  | 'retail'
  | 'other';

export type Availability = 'current' | 'discontinued' | 'limited';

export type PatternType =
  | 'solid'
  | 'striped'
  | 'plaid'
  | 'camo'
  | 'gradient'
  | 'geometric'
  | 'chevron'
  | 'heathered'
  | 'carbon-weave'
  | 'checkered'
  | 'floral'
  | 'other';

export type FinishType =
  | 'matte'
  | 'glossy'
  | 'metallic'
  | 'satin'
  | 'textured'
  | 'brushed';

// =============================================================================
// Visual Identification
// =============================================================================

export interface VisualSignature {
  /** Primary colors of the product */
  primaryColors: string[];
  /** Secondary/accent colors */
  secondaryColors?: string[];
  /** Brand's official colorway name (e.g., "Stealth Black", "Pure Platinum") */
  colorwayName?: string;
  /** Pattern types present on the product */
  patterns: PatternType[];
  /** Surface finish */
  finish?: FinishType;
  /** Design elements that help identify the product */
  designCues: string[];
  /** Unique features that distinguish this product from others */
  distinguishingFeatures: string[];
  /** Logo placement and style */
  logoPlacement?: string;
}

export interface ReferenceImages {
  /** Primary product image URL */
  primary: string;
  /** Additional angle shots */
  angles?: string[];
  /** Lifestyle/in-use images */
  lifestyle?: string[];
  /** Close-up detail shots */
  details?: string[];
}

// =============================================================================
// Product Variant
// =============================================================================

export interface ProductVariant {
  /** SKU or product code if available */
  sku?: string;
  /** Human-readable variant name (e.g., "10.5° Stiff Shaft", "Size M Black") */
  variantName: string;
  /** Variant-specific specifications */
  specifications: Record<string, string>;
  /** Colorway for this specific variant */
  colorway?: string;
  /** Current availability status */
  availability: Availability;
  /** MSRP for this variant if different from base */
  price?: number;
  /** Reference image for this specific variant */
  imageUrl?: string;
}

// =============================================================================
// Product
// =============================================================================

export interface Product {
  /** Unique identifier (generated) */
  id: string;
  /** Product name (e.g., "Qi10 Max Driver") */
  name: string;
  /** Brand name */
  brand: string;
  /** Primary category */
  category: Category;
  /** Subcategory (e.g., "drivers", "irons", "phones", "laptops") */
  subcategory?: string;
  /** Year the product was released */
  releaseYear: number;
  /** Base MSRP in USD */
  msrp?: number;

  // Identification Data
  /** Visual characteristics for photo identification */
  visualSignature: VisualSignature;
  /** Reference images for matching */
  referenceImages: ReferenceImages;

  // Specifications
  /** Category-specific specifications */
  specifications: Record<string, string | string[] | number | boolean>;
  /** Model number if available */
  modelNumber?: string;

  // Variants
  /** All SKU-level variants */
  variants: ProductVariant[];

  // Search & Matching
  /** Keywords for text-based search */
  searchKeywords: string[];
  /** Common misspellings or alternate names */
  aliases?: string[];

  // Affiliate & Commerce
  /** Affiliate links for this product */
  affiliateLinks?: string[];
  /** Direct product page URL */
  productUrl?: string;

  // Metadata
  /** Product description */
  description?: string;
  /** Key features/selling points */
  features?: string[];
  /** Date this record was last updated */
  lastUpdated: string;
  /** Data source for this product */
  source: 'api' | 'scrape' | 'ai' | 'manual';
  /** Confidence in data accuracy (0-100) */
  dataConfidence: number;
}

// =============================================================================
// Brand Catalog
// =============================================================================

export interface BrandCatalog {
  /** Official brand name */
  name: string;
  /** Alternative names/spellings */
  aliases: string[];
  /** Brand's signature colors */
  signatureColors?: string[];
  /** Brand's headquarters country */
  country?: string;
  /** Brand's official website */
  website?: string;
  /** All products from this brand */
  products: Product[];
  /** Last time this brand's data was refreshed */
  lastUpdated: string;
}

// =============================================================================
// Product Library
// =============================================================================

export interface ProductLibrary {
  /** Category this library covers */
  category: Category;
  /** Schema version for migrations */
  schemaVersion: string;
  /** When this library was last updated */
  lastUpdated: string;
  /** All brands in this category */
  brands: BrandCatalog[];
  /** Total product count */
  productCount: number;
  /** Total variant/SKU count */
  variantCount: number;
}

// =============================================================================
// Category-Specific Specification Types
// =============================================================================

export interface GolfSpecifications {
  clubType: 'driver' | 'fairway' | 'hybrid' | 'iron' | 'wedge' | 'putter' | 'complete-set';
  loft?: string;
  shaft?: string;
  flex?: 'ladies' | 'senior' | 'regular' | 'stiff' | 'x-stiff';
  length?: string;
  headWeight?: string;
  adjustability?: boolean;
  technology?: string[];
  handedness?: 'right' | 'left' | 'both';
}

export interface TechSpecifications {
  productType: 'phone' | 'laptop' | 'tablet' | 'headphones' | 'speaker' | 'watch' | 'camera' | 'accessory';
  screenSize?: string;
  storage?: string;
  ram?: string;
  processor?: string;
  battery?: string;
  connectivity?: string[];
  os?: string;
  resolution?: string;
}

export interface FashionSpecifications {
  garmentType: 'jacket' | 'pants' | 'shirt' | 'shoes' | 'hat' | 'accessories' | 'dress' | 'shorts';
  material?: string;
  fit?: 'slim' | 'regular' | 'relaxed' | 'oversized';
  sizes?: string[];
  gender?: 'mens' | 'womens' | 'unisex' | 'kids';
  care?: string;
  collection?: string;
  season?: string;
}

export interface OutdoorSpecifications {
  productType: 'tent' | 'sleeping-bag' | 'backpack' | 'stove' | 'water-filter' | 'clothing' | 'footwear' | 'accessories';
  capacity?: string;
  weight?: string;
  dimensions?: string;
  season?: '3-season' | '4-season' | 'summer';
  waterproof?: boolean;
  material?: string;
}

export interface MakeupSpecifications {
  productType: 'lipstick' | 'foundation' | 'eyeshadow' | 'mascara' | 'blush' | 'concealer' | 'primer' | 'setting-spray' | 'skincare';
  shade?: string;
  shadeFamily?: string;
  finish?: 'matte' | 'satin' | 'glossy' | 'dewy' | 'shimmer';
  coverage?: 'sheer' | 'light' | 'medium' | 'full';
  size?: string;
  ingredients?: string[];
}

// =============================================================================
// Search & Match Types
// =============================================================================

export interface SearchQuery {
  /** Text query */
  query?: string;
  /** Filter by category */
  category?: Category;
  /** Filter by brand */
  brand?: string;
  /** Filter by release year range */
  yearRange?: { min: number; max: number };
  /** Filter by price range */
  priceRange?: { min: number; max: number };
  /** Visual signature to match */
  visualSignature?: Partial<VisualSignature>;
  /** Maximum results */
  limit?: number;
}

export interface SearchResult {
  /** The matched product */
  product: Product;
  /** Match confidence (0-100) */
  confidence: number;
  /** Why this matched */
  matchReasons: string[];
  /** Specific variant that matched, if applicable */
  matchedVariant?: ProductVariant;
}

// =============================================================================
// Agent Types
// =============================================================================

export interface AgentTask {
  id: string;
  type: 'category-lead' | 'brand-agent' | 'enrichment';
  category: Category;
  brand?: string;
  status: 'pending' | 'in-progress' | 'completed' | 'failed';
  progress: number;
  startedAt?: string;
  completedAt?: string;
  error?: string;
  productsCollected: number;
}

export interface OrchestratorState {
  /** Current phase of execution */
  phase: 'infrastructure' | 'collection' | 'enrichment' | 'validation' | 'complete';
  /** All active and completed tasks */
  tasks: AgentTask[];
  /** Overall progress (0-100) */
  overallProgress: number;
  /** Start time */
  startedAt: string;
  /** Completion time if finished */
  completedAt?: string;
  /** Products collected across all categories */
  totalProducts: number;
  /** Variants collected */
  totalVariants: number;
}
