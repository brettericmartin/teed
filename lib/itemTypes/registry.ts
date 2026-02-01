/**
 * Item Type Registry
 *
 * Configuration for each item type including:
 * - UI labels, icons, descriptions
 * - Form field definitions
 * - Default values
 */

import type {
  ItemType,
  PricingModel,
  PricingPeriod,
  Platform,
  SoftwareCategory,
  TimingPeriod,
  SupplementCategory,
  SupplementForm,
} from '@/lib/types/itemTypes';

// =============================================================================
// Form Field Types
// =============================================================================

export type FieldType = 'text' | 'number' | 'select' | 'multiselect' | 'textarea' | 'url';

export interface SelectOption {
  value: string;
  label: string;
}

export interface FormField {
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  required?: boolean;
  options?: SelectOption[];
  helpText?: string;
  group?: string; // For grouping related fields in UI
}

// =============================================================================
// Item Type Configuration
// =============================================================================

export interface ItemTypeConfig {
  value: ItemType;
  label: string;
  icon: string; // Emoji or icon name
  description: string;
  fields: FormField[];
  defaultSpecs: Record<string, unknown>;
}

// =============================================================================
// Option Data
// =============================================================================

export const PRICING_MODEL_OPTIONS: SelectOption[] = [
  { value: 'subscription', label: 'Subscription' },
  { value: 'one_time', label: 'One-time Purchase' },
  { value: 'freemium', label: 'Freemium' },
  { value: 'free', label: 'Free' },
];

export const PRICING_PERIOD_OPTIONS: SelectOption[] = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' },
  { value: 'lifetime', label: 'Lifetime' },
];

export const PLATFORM_OPTIONS: SelectOption[] = [
  { value: 'web', label: 'Web' },
  { value: 'mac', label: 'macOS' },
  { value: 'windows', label: 'Windows' },
  { value: 'linux', label: 'Linux' },
  { value: 'ios', label: 'iOS' },
  { value: 'android', label: 'Android' },
];

export const SOFTWARE_CATEGORY_OPTIONS: SelectOption[] = [
  { value: 'design', label: 'Design' },
  { value: 'video', label: 'Video' },
  { value: 'audio', label: 'Audio' },
  { value: 'writing', label: 'Writing' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'development', label: 'Development' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'analytics', label: 'Analytics' },
  { value: 'communication', label: 'Communication' },
  { value: 'storage', label: 'Storage' },
  { value: 'ai', label: 'AI Tools' },
  { value: 'other', label: 'Other' },
];

export const TIMING_OPTIONS: SelectOption[] = [
  { value: 'morning', label: 'Morning' },
  { value: 'afternoon', label: 'Afternoon' },
  { value: 'evening', label: 'Evening' },
  { value: 'with_food', label: 'With Food' },
  { value: 'empty_stomach', label: 'Empty Stomach' },
  { value: 'before_bed', label: 'Before Bed' },
  { value: 'pre_workout', label: 'Pre-Workout' },
  { value: 'post_workout', label: 'Post-Workout' },
];

export const SUPPLEMENT_CATEGORY_OPTIONS: SelectOption[] = [
  { value: 'sleep', label: 'Sleep' },
  { value: 'energy', label: 'Energy' },
  { value: 'cognition', label: 'Cognition' },
  { value: 'recovery', label: 'Recovery' },
  { value: 'immunity', label: 'Immunity' },
  { value: 'longevity', label: 'Longevity' },
  { value: 'gut_health', label: 'Gut Health' },
  { value: 'stress', label: 'Stress' },
  { value: 'vitamins', label: 'Vitamins' },
  { value: 'minerals', label: 'Minerals' },
  { value: 'amino_acids', label: 'Amino Acids' },
  { value: 'other', label: 'Other' },
];

export const SUPPLEMENT_FORM_OPTIONS: SelectOption[] = [
  { value: 'capsule', label: 'Capsule' },
  { value: 'tablet', label: 'Tablet' },
  { value: 'powder', label: 'Powder' },
  { value: 'liquid', label: 'Liquid' },
  { value: 'gummy', label: 'Gummy' },
  { value: 'softgel', label: 'Softgel' },
  { value: 'spray', label: 'Spray' },
  { value: 'patch', label: 'Patch' },
];

// =============================================================================
// Item Type Registry
// =============================================================================

export const ITEM_TYPE_REGISTRY: Record<ItemType, ItemTypeConfig> = {
  physical_product: {
    value: 'physical_product',
    label: 'Physical Product',
    icon: 'Package',
    description: 'Physical gear, equipment, or products',
    fields: [
      // Physical products use the generic specs field
      // No predefined fields - users can add custom specs
    ],
    defaultSpecs: {},
  },

  software: {
    value: 'software',
    label: 'Software',
    icon: 'Monitor',
    description: 'Apps, tools, and desktop software',
    fields: [
      {
        key: 'pricing_model',
        label: 'Pricing Model',
        type: 'select',
        required: true,
        options: PRICING_MODEL_OPTIONS,
        group: 'pricing',
      },
      {
        key: 'price_amount',
        label: 'Price',
        type: 'number',
        placeholder: '9.99',
        helpText: 'Leave empty if free',
        group: 'pricing',
      },
      {
        key: 'price_period',
        label: 'Billing Period',
        type: 'select',
        options: PRICING_PERIOD_OPTIONS,
        group: 'pricing',
      },
      {
        key: 'platforms',
        label: 'Platforms',
        type: 'multiselect',
        required: true,
        options: PLATFORM_OPTIONS,
        group: 'details',
      },
      {
        key: 'category',
        label: 'Category',
        type: 'select',
        options: SOFTWARE_CATEGORY_OPTIONS,
        group: 'details',
      },
      {
        key: 'free_tier_available',
        label: 'Free Tier Available',
        type: 'select',
        options: [
          { value: 'true', label: 'Yes' },
          { value: 'false', label: 'No' },
        ],
        group: 'pricing',
      },
      {
        key: 'url',
        label: 'Website URL',
        type: 'url',
        placeholder: 'https://example.com',
        group: 'details',
      },
    ],
    defaultSpecs: {
      pricing_model: 'subscription',
      platforms: [],
    },
  },

  service: {
    value: 'service',
    label: 'Service',
    icon: 'Cloud',
    description: 'Online services and subscriptions',
    fields: [
      {
        key: 'pricing_model',
        label: 'Pricing Model',
        type: 'select',
        required: true,
        options: PRICING_MODEL_OPTIONS,
        group: 'pricing',
      },
      {
        key: 'price_amount',
        label: 'Price',
        type: 'number',
        placeholder: '9.99',
        helpText: 'Leave empty if free',
        group: 'pricing',
      },
      {
        key: 'price_period',
        label: 'Billing Period',
        type: 'select',
        options: PRICING_PERIOD_OPTIONS,
        group: 'pricing',
      },
      {
        key: 'category',
        label: 'Category',
        type: 'select',
        options: SOFTWARE_CATEGORY_OPTIONS,
        group: 'details',
      },
      {
        key: 'url',
        label: 'Website URL',
        type: 'url',
        placeholder: 'https://example.com',
        group: 'details',
      },
    ],
    defaultSpecs: {
      pricing_model: 'subscription',
    },
  },

  supplement: {
    value: 'supplement',
    label: 'Supplement',
    icon: 'Pill',
    description: 'Vitamins, supplements, and health products',
    fields: [
      {
        key: 'category',
        label: 'Category',
        type: 'select',
        required: true,
        options: SUPPLEMENT_CATEGORY_OPTIONS,
        group: 'classification',
      },
      {
        key: 'form',
        label: 'Form',
        type: 'select',
        options: SUPPLEMENT_FORM_OPTIONS,
        group: 'classification',
      },
      {
        key: 'dosage',
        label: 'Dosage',
        type: 'text',
        placeholder: '500mg',
        group: 'dosage',
      },
      {
        key: 'serving_size',
        label: 'Serving Size',
        type: 'text',
        placeholder: '2 capsules',
        group: 'dosage',
      },
      {
        key: 'frequency',
        label: 'Frequency',
        type: 'text',
        placeholder: 'Daily, 2x daily, etc.',
        group: 'dosage',
      },
      {
        key: 'timing',
        label: 'When to Take',
        type: 'multiselect',
        options: TIMING_OPTIONS,
        group: 'dosage',
      },
      {
        key: 'stack_notes',
        label: 'Stack Notes',
        type: 'textarea',
        placeholder: 'Notes about combining with other supplements...',
        helpText: 'Synergies, conflicts, or stacking recommendations',
        group: 'notes',
      },
    ],
    defaultSpecs: {
      timing: [],
      category: 'other',
    },
  },

  consumable: {
    value: 'consumable',
    label: 'Consumable',
    icon: 'Coffee',
    description: 'Food, beverages, and consumable products',
    fields: [
      {
        key: 'category',
        label: 'Category',
        type: 'select',
        options: [
          { value: 'food', label: 'Food' },
          { value: 'beverage', label: 'Beverage' },
          { value: 'snack', label: 'Snack' },
          { value: 'other', label: 'Other' },
        ],
        group: 'details',
      },
      {
        key: 'serving_size',
        label: 'Serving Size',
        type: 'text',
        placeholder: '1 cup, 2 oz, etc.',
        group: 'details',
      },
    ],
    defaultSpecs: {},
  },
};

// =============================================================================
// Helper Functions
// =============================================================================

/**
 * Get configuration for an item type
 */
export function getItemTypeConfig(itemType: ItemType): ItemTypeConfig {
  return ITEM_TYPE_REGISTRY[itemType] || ITEM_TYPE_REGISTRY.physical_product;
}

/**
 * Get all item types as options for a select
 */
export function getItemTypeOptions(): SelectOption[] {
  return Object.values(ITEM_TYPE_REGISTRY).map((config) => ({
    value: config.value,
    label: config.label,
  }));
}

/**
 * Get fields for an item type
 */
export function getFieldsForItemType(itemType: ItemType): FormField[] {
  return getItemTypeConfig(itemType).fields;
}

/**
 * Get fields grouped by their group property
 */
export function getGroupedFields(itemType: ItemType): Record<string, FormField[]> {
  const fields = getFieldsForItemType(itemType);
  const groups: Record<string, FormField[]> = {};

  for (const field of fields) {
    const group = field.group || 'general';
    if (!groups[group]) {
      groups[group] = [];
    }
    groups[group].push(field);
  }

  return groups;
}

/**
 * Get default specs for an item type
 */
export function getDefaultSpecsForType(itemType: ItemType): Record<string, unknown> {
  return { ...getItemTypeConfig(itemType).defaultSpecs };
}
