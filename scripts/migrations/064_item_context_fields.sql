-- Migration: 064_item_context_fields
-- Description: Add rich context fields to bag_items for "Why I chose this" narratives,
--              specifications, comparisons, and alternative recommendations
-- Part of Phase 1: Foundation Enhancement

-- Add why_chosen field - narrative explaining the choice
ALTER TABLE bag_items
ADD COLUMN IF NOT EXISTS why_chosen TEXT;

COMMENT ON COLUMN bag_items.why_chosen IS 'Personal narrative explaining why the user chose this item. Supports rich context like "This driver replaced my Callaway because..."';

-- Add specs field - JSONB for flexible specifications
ALTER TABLE bag_items
ADD COLUMN IF NOT EXISTS specs JSONB DEFAULT '{}';

COMMENT ON COLUMN bag_items.specs IS 'Structured specifications as JSONB. Can include dimensions, weight, materials, color, size, or any item-specific attributes.';

-- Add compared_to field - what this item replaced or was compared against
ALTER TABLE bag_items
ADD COLUMN IF NOT EXISTS compared_to TEXT;

COMMENT ON COLUMN bag_items.compared_to IS 'Text describing what this item replaced or was compared against. E.g., "Replaced my Sony A7III" or "Chose over the Titleist TSR3"';

-- Add alternatives field - array of alternative item suggestions
-- Note: Using TEXT[] instead of UUID[] for flexibility (can reference external products or descriptions)
ALTER TABLE bag_items
ADD COLUMN IF NOT EXISTS alternatives TEXT[];

COMMENT ON COLUMN bag_items.alternatives IS 'Array of alternative recommendations. Can be product names, descriptions, or references to other items the creator considered.';

-- Add price_paid field - what the user actually paid (for transparency)
ALTER TABLE bag_items
ADD COLUMN IF NOT EXISTS price_paid DECIMAL(10,2);

COMMENT ON COLUMN bag_items.price_paid IS 'Optional: What the user actually paid for this item. Useful for budget comparisons and transparency.';

-- Add purchase_date field - when the item was acquired
ALTER TABLE bag_items
ADD COLUMN IF NOT EXISTS purchase_date DATE;

COMMENT ON COLUMN bag_items.purchase_date IS 'When the user purchased/acquired this item. Enables gear timeline and version history features.';

-- Create index for specs JSONB queries (if we want to search by spec values)
CREATE INDEX IF NOT EXISTS idx_bag_items_specs ON bag_items USING GIN (specs);

-- Update the updated_at trigger to track context field changes
-- (Assuming trigger already exists from previous migrations)

-- Grant necessary permissions (RLS policies already cover bag_items)
