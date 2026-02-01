/**
 * Unified Item Type System
 *
 * This module defines the type system for different item categories:
 * - physical_product: Physical gear (default, backward compatible)
 * - software: Apps, tools (Creator Tools vertical)
 * - service: Subscriptions (Creator Tools vertical)
 * - supplement: Supplements (Biohacking vertical)
 * - consumable: Food, drinks (future)
 */

// =============================================================================
// Core Item Types
// =============================================================================

export const ITEM_TYPES = [
  'physical_product',
  'software',
  'service',
  'supplement',
  'consumable',
] as const;

export type ItemType = (typeof ITEM_TYPES)[number];

// =============================================================================
// Software / Service Types (Creator Tools)
// =============================================================================

export type PricingModel = 'subscription' | 'one_time' | 'freemium' | 'free';

export type PricingPeriod = 'monthly' | 'yearly' | 'lifetime';

export type Platform = 'web' | 'mac' | 'windows' | 'ios' | 'android' | 'linux';

export type SoftwareCategory =
  | 'design'
  | 'video'
  | 'audio'
  | 'writing'
  | 'productivity'
  | 'development'
  | 'marketing'
  | 'analytics'
  | 'communication'
  | 'storage'
  | 'ai'
  | 'other';

export interface SoftwareSpecs {
  pricing_model: PricingModel;
  price_amount?: number;
  price_period?: PricingPeriod;
  platforms: Platform[];
  category?: SoftwareCategory;
  free_tier_available?: boolean;
  url?: string;
}

export interface ServiceSpecs {
  pricing_model: PricingModel;
  price_amount?: number;
  price_period?: PricingPeriod;
  category?: SoftwareCategory;
  url?: string;
}

// =============================================================================
// Supplement Types (Biohacking)
// =============================================================================

export type TimingPeriod =
  | 'morning'
  | 'afternoon'
  | 'evening'
  | 'with_food'
  | 'empty_stomach'
  | 'before_bed'
  | 'pre_workout'
  | 'post_workout';

export type SupplementCategory =
  | 'sleep'
  | 'energy'
  | 'cognition'
  | 'recovery'
  | 'immunity'
  | 'longevity'
  | 'gut_health'
  | 'stress'
  | 'vitamins'
  | 'minerals'
  | 'amino_acids'
  | 'other';

export type SupplementForm =
  | 'capsule'
  | 'tablet'
  | 'powder'
  | 'liquid'
  | 'gummy'
  | 'softgel'
  | 'spray'
  | 'patch';

export interface SupplementSpecs {
  dosage?: string; // "500mg", "2 capsules"
  serving_size?: string; // "2 capsules", "1 scoop"
  timing: TimingPeriod[];
  frequency?: string; // "daily", "2x daily", "as needed"
  category: SupplementCategory;
  form?: SupplementForm;
  stack_notes?: string; // Notes about combining with other supplements
}

// =============================================================================
// Physical Product Types (Default)
// =============================================================================

export interface PhysicalProductSpecs {
  // Generic specs - any key-value pairs
  [key: string]: string | number | boolean | undefined;
}

// =============================================================================
// Consumable Types (Future)
// =============================================================================

export interface ConsumableSpecs {
  category?: 'food' | 'beverage' | 'snack' | 'other';
  dietary_info?: string[];
  serving_size?: string;
}

// =============================================================================
// Unified Specs Type
// =============================================================================

export type ItemSpecs =
  | PhysicalProductSpecs
  | SoftwareSpecs
  | ServiceSpecs
  | SupplementSpecs
  | ConsumableSpecs;

// =============================================================================
// Extended Item Interface
// =============================================================================

/**
 * Base item fields shared across all types
 */
export interface BaseItem {
  id: string;
  bag_id: string;
  custom_name: string | null;
  custom_description: string | null;
  brand: string | null;
  notes: string | null;
  quantity: number;
  sort_index: number;
  photo_url: string | null;
  promo_codes: string | null;
  is_featured: boolean;
  featured_position: number | null;
  // Context fields
  why_chosen: string | null;
  compared_to: string | null;
  alternatives: string[] | null;
  price_paid: number | null;
  purchase_date: string | null;
  section_id: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Extended item with type-specific specs
 */
export interface ExtendedBagItem<T extends ItemSpecs = ItemSpecs> extends BaseItem {
  item_type: ItemType;
  specs: T;
}

/**
 * Type-specific item aliases for convenience
 */
export type PhysicalProductItem = ExtendedBagItem<PhysicalProductSpecs> & {
  item_type: 'physical_product';
};

export type SoftwareItem = ExtendedBagItem<SoftwareSpecs> & {
  item_type: 'software';
};

export type ServiceItem = ExtendedBagItem<ServiceSpecs> & {
  item_type: 'service';
};

export type SupplementItem = ExtendedBagItem<SupplementSpecs> & {
  item_type: 'supplement';
};

export type ConsumableItem = ExtendedBagItem<ConsumableSpecs> & {
  item_type: 'consumable';
};

// =============================================================================
// Type Guards
// =============================================================================

export function isPhysicalProduct(item: ExtendedBagItem): item is PhysicalProductItem {
  return item.item_type === 'physical_product';
}

export function isSoftware(item: ExtendedBagItem): item is SoftwareItem {
  return item.item_type === 'software';
}

export function isService(item: ExtendedBagItem): item is ServiceItem {
  return item.item_type === 'service';
}

export function isSupplement(item: ExtendedBagItem): item is SupplementItem {
  return item.item_type === 'supplement';
}

export function isConsumable(item: ExtendedBagItem): item is ConsumableItem {
  return item.item_type === 'consumable';
}

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get the default item type
 */
export function getDefaultItemType(): ItemType {
  return 'physical_product';
}

/**
 * Check if a value is a valid item type
 */
export function isValidItemType(value: string): value is ItemType {
  return ITEM_TYPES.includes(value as ItemType);
}

/**
 * Get default specs for an item type
 */
export function getDefaultSpecs(itemType: ItemType): ItemSpecs {
  switch (itemType) {
    case 'software':
      return {
        pricing_model: 'subscription',
        platforms: [],
      } as SoftwareSpecs;
    case 'service':
      return {
        pricing_model: 'subscription',
      } as ServiceSpecs;
    case 'supplement':
      return {
        timing: [],
        category: 'other',
      } as SupplementSpecs;
    case 'consumable':
      return {} as ConsumableSpecs;
    case 'physical_product':
    default:
      return {} as PhysicalProductSpecs;
  }
}
