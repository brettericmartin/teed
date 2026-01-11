/**
 * Universal Link Adder Type Definitions
 */

import type { EmbedPlatform } from '@/lib/embeds/parseEmbedUrl';
import type { LinkClassification } from '@/lib/links/classifyUrl';

/**
 * Processed item ready for review
 */
export interface ProcessedEmbed {
  index: number;
  url: string;
  platform: EmbedPlatform;
  title?: string;
  selected: boolean;
}

export interface ProcessedSocial {
  index: number;
  url: string;
  platform: string;
  username: string;
  displayName: string;
  selected: boolean;
}

export interface ProcessedProduct {
  index: number;
  url: string;
  // Product identification result from scraping
  productName: string;
  brand: string | null;
  description: string | null;
  confidence: number;
  status: 'success' | 'partial' | 'failed';
  // Photo options
  photos: ProductPhotoOption[];
  selectedPhotoIndex: number;
  // Selected for import
  selected: boolean;
}

export interface ProductPhotoOption {
  url: string;
  source: 'og' | 'meta' | 'json-ld' | 'google' | 'amazon';
  isPrimary: boolean;
}

/**
 * Universal Link Save Request
 */
export interface UniversalLinkSaveRequest {
  profileId: string;

  // Embeds to add as blocks
  embeds: Array<{
    url: string;
    platform: EmbedPlatform;
    title?: string;
  }>;

  // Social profiles to add to social_links
  socialLinks: Record<string, string>; // platform -> url/username

  // Products to add to a bag
  products: {
    bagCode: string;  // existing bag code or 'new'
    newBagTitle?: string;  // if creating new bag
    selections: ProductSelection[];
  } | null;
}

export interface ProductSelection {
  index: number;
  purchaseUrl: string;
  item: {
    custom_name: string;
    custom_description: string | null;
    brand: string | null;
  };
  selectedPhotoUrl: string;
}

/**
 * Universal Link Save Response
 */
export interface UniversalLinkSaveResponse {
  success: boolean;

  // Results by type
  embedsAdded: number;
  socialLinksAdded: number;
  productsAdded: number;

  // Details
  newBagCode?: string;  // if new bag was created
  errors: string[];
}

/**
 * SSE Stream Events for processing
 */
export type UniversalLinkStreamEvent =
  | { type: 'classification_complete'; embeds: ProcessedEmbed[]; social: ProcessedSocial[]; productCount: number }
  | { type: 'product_started'; index: number; url: string }
  | { type: 'product_stage_update'; index: number; stage: ProductProcessingStage }
  | { type: 'product_completed'; index: number; result: ProcessedProduct }
  | { type: 'batch_progress'; completed: number; total: number }
  | { type: 'complete'; embeds: ProcessedEmbed[]; social: ProcessedSocial[]; products: ProcessedProduct[] }
  | { type: 'error'; message: string };

export type ProductProcessingStage =
  | 'parsing'
  | 'fetching'
  | 'detecting'
  | 'analyzing'
  | 'imaging';

/**
 * Modal step state
 */
export type UniversalLinkStep =
  | 'input'          // Step 1: Paste URLs
  | 'processing'     // Step 2: Classification + product processing
  | 'review'         // Step 3: Review by type
  | 'destination';   // Step 4: Choose destination for products

/**
 * Review tab selection
 */
export type ReviewTab = 'embeds' | 'social' | 'products';

/**
 * Bag for destination selection
 */
export interface BagOption {
  id: string;
  code: string;
  title: string;
  itemCount: number;
  updatedAt: string;
}
