/**
 * Zod Validation Schemas for Item Specs
 *
 * Runtime validation for type-specific specs data
 */

import { z } from 'zod';
import type { ItemType } from '@/lib/types/itemTypes';

// =============================================================================
// Enum Schemas
// =============================================================================

const pricingModelSchema = z.enum(['subscription', 'one_time', 'freemium', 'free']);

const pricingPeriodSchema = z.enum(['monthly', 'yearly', 'lifetime']);

const platformSchema = z.enum(['web', 'mac', 'windows', 'linux', 'ios', 'android']);

const softwareCategorySchema = z.enum([
  'design',
  'video',
  'audio',
  'writing',
  'productivity',
  'development',
  'marketing',
  'analytics',
  'communication',
  'storage',
  'ai',
  'other',
]);

const timingPeriodSchema = z.enum([
  'morning',
  'afternoon',
  'evening',
  'with_food',
  'empty_stomach',
  'before_bed',
  'pre_workout',
  'post_workout',
]);

const supplementCategorySchema = z.enum([
  'sleep',
  'energy',
  'cognition',
  'recovery',
  'immunity',
  'longevity',
  'gut_health',
  'stress',
  'vitamins',
  'minerals',
  'amino_acids',
  'other',
]);

const supplementFormSchema = z.enum([
  'capsule',
  'tablet',
  'powder',
  'liquid',
  'gummy',
  'softgel',
  'spray',
  'patch',
]);

// =============================================================================
// Specs Schemas
// =============================================================================

/**
 * Software specs validation
 */
export const softwareSpecsSchema = z.object({
  pricing_model: pricingModelSchema,
  price_amount: z.number().positive().optional(),
  price_period: pricingPeriodSchema.optional(),
  platforms: z.array(platformSchema).default([]),
  category: softwareCategorySchema.optional(),
  free_tier_available: z.boolean().optional(),
  url: z.string().url().optional(),
});

/**
 * Service specs validation
 */
export const serviceSpecsSchema = z.object({
  pricing_model: pricingModelSchema,
  price_amount: z.number().positive().optional(),
  price_period: pricingPeriodSchema.optional(),
  category: softwareCategorySchema.optional(),
  url: z.string().url().optional(),
});

/**
 * Supplement specs validation
 */
export const supplementSpecsSchema = z.object({
  dosage: z.string().optional(),
  serving_size: z.string().optional(),
  timing: z.array(timingPeriodSchema).default([]),
  frequency: z.string().optional(),
  category: supplementCategorySchema,
  form: supplementFormSchema.optional(),
  stack_notes: z.string().optional(),
});

/**
 * Physical product specs validation - allows any key-value pairs
 */
export const physicalProductSpecsSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean()])
);

/**
 * Consumable specs validation
 */
export const consumableSpecsSchema = z.object({
  category: z.enum(['food', 'beverage', 'snack', 'other']).optional(),
  dietary_info: z.array(z.string()).optional(),
  serving_size: z.string().optional(),
});

// =============================================================================
// Type Exports
// =============================================================================

export type SoftwareSpecsInput = z.input<typeof softwareSpecsSchema>;
export type ServiceSpecsInput = z.input<typeof serviceSpecsSchema>;
export type SupplementSpecsInput = z.input<typeof supplementSpecsSchema>;
export type PhysicalProductSpecsInput = z.input<typeof physicalProductSpecsSchema>;
export type ConsumableSpecsInput = z.input<typeof consumableSpecsSchema>;

// =============================================================================
// Schema Selector
// =============================================================================

/**
 * Get the appropriate validation schema for an item type
 */
export function getSpecsSchema(itemType: ItemType): z.ZodSchema {
  switch (itemType) {
    case 'software':
      return softwareSpecsSchema;
    case 'service':
      return serviceSpecsSchema;
    case 'supplement':
      return supplementSpecsSchema;
    case 'consumable':
      return consumableSpecsSchema;
    case 'physical_product':
    default:
      return physicalProductSpecsSchema;
  }
}

// =============================================================================
// Validation Helpers
// =============================================================================

/**
 * Validate specs for a given item type
 * Returns { success: true, data } or { success: false, error }
 */
export function validateSpecs(
  itemType: ItemType,
  specs: unknown
): { success: true; data: unknown } | { success: false; error: z.ZodError } {
  const schema = getSpecsSchema(itemType);
  const result = schema.safeParse(specs);

  if (result.success) {
    return { success: true, data: result.data };
  }

  return { success: false, error: result.error };
}

/**
 * Parse and validate specs, throwing on error
 */
export function parseSpecs(itemType: ItemType, specs: unknown): unknown {
  const schema = getSpecsSchema(itemType);
  return schema.parse(specs);
}

/**
 * Coerce string values to proper types for a given item type
 * Useful when processing form data
 */
export function coerceSpecsFromForm(
  itemType: ItemType,
  formData: Record<string, string | string[] | undefined>
): Record<string, unknown> {
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(formData)) {
    if (value === undefined || value === '') {
      continue;
    }

    // Handle arrays (multiselect)
    if (Array.isArray(value)) {
      result[key] = value;
      continue;
    }

    // Handle booleans
    if (value === 'true' || value === 'false') {
      result[key] = value === 'true';
      continue;
    }

    // Handle numbers
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && isFinite(numValue)) {
      // Check if the field is expected to be a number based on type
      if (key === 'price_amount') {
        result[key] = numValue;
        continue;
      }
    }

    // Default to string
    result[key] = value;
  }

  return result;
}

// =============================================================================
// Item Type Schema
// =============================================================================

export const itemTypeSchema = z.enum([
  'physical_product',
  'software',
  'service',
  'supplement',
  'consumable',
]);

/**
 * Validate an item type string
 */
export function isValidItemType(value: string): boolean {
  return itemTypeSchema.safeParse(value).success;
}
