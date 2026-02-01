/**
 * Shared types for Public Bag View components
 *
 * These types define the shape of items as they come from the API
 * and are displayed in the bag view.
 */

import type { ItemType, TimingPeriod, PricingModel, PricingPeriod } from './itemTypes';

export interface ItemLink {
  id: string;
  url: string;
  kind: string;
  label: string | null;
  metadata: any;
  is_auto_generated?: boolean;
}

export interface ItemSpecs {
  [key: string]: string | number | boolean | string[] | undefined;
  // Software/Service specs
  pricing_model?: PricingModel;
  price_amount?: number;
  price_period?: PricingPeriod;
  platforms?: string[];
  category?: string;
  free_tier_available?: boolean;
  url?: string;
  // Supplement specs
  dosage?: string;
  serving_size?: string;
  timing?: TimingPeriod[];
  frequency?: string;
  form?: string;
  stack_notes?: string;
}

export interface BagViewItem {
  id: string;
  custom_name: string | null;
  brand: string | null;
  custom_description: string | null;
  notes: string | null;
  quantity: number;
  sort_index: number;
  photo_url: string | null;
  promo_codes: string | null;
  is_featured: boolean;
  // Item type
  item_type?: ItemType;
  // Context fields (Phase 1)
  why_chosen: string | null;
  specs: ItemSpecs;
  compared_to: string | null;
  alternatives: string[] | null;
  price_paid: number | null;
  purchase_date: string | null;
  links: ItemLink[];
}

export interface BagViewBag {
  id: string;
  code: string;
  title: string;
  description: string | null;
  is_public: boolean;
  is_complete?: boolean;
  completed_at?: string | null;
  hero_item_id: string | null;
  cover_photo_id: string | null;
  cover_photo_url: string | null;
  cover_photo_aspect: string | null;
  created_at: string;
  tags?: string[];
  category?: string;
  // Version history fields
  version_number?: number;
  update_count?: number;
  last_major_update?: string | null;
}
