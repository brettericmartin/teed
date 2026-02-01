-- Migration: 088_item_type_extension
-- Description: Add item_type column to bag_items for unified item type system
-- Supports: physical_product, software, service, supplement, consumable
-- Part of: Unified Item Type Foundation

-- Add item_type column with default for backward compatibility
ALTER TABLE bag_items
ADD COLUMN IF NOT EXISTS item_type TEXT DEFAULT 'physical_product';

COMMENT ON COLUMN bag_items.item_type IS 'Discriminator for item type: physical_product (default), software, service, supplement, consumable. Type-specific data stored in specs JSONB column.';

-- Add constraint for valid types
-- Using DO block to handle case where constraint already exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'chk_item_type'
  ) THEN
    ALTER TABLE bag_items
    ADD CONSTRAINT chk_item_type CHECK (
      item_type IN (
        'physical_product',  -- Default: physical gear
        'software',          -- Apps, tools (Creator Tools)
        'service',           -- Subscriptions (Creator Tools)
        'supplement',        -- Supplements (Biohacking)
        'consumable'         -- Future: food, drinks
      )
    );
  END IF;
END $$;

-- Index for filtering by item type
CREATE INDEX IF NOT EXISTS idx_bag_items_item_type ON bag_items(item_type);

-- Composite index for efficient queries filtering by bag and type
CREATE INDEX IF NOT EXISTS idx_bag_items_bag_type ON bag_items(bag_id, item_type);
