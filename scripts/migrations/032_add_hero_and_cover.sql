-- Migration: Add hero_item_id and cover_photo_id to bags
-- These enable:
-- 1. Hero Item: Single item designated as the "hero piece" with visual highlighting
-- 2. Cover Photo: Optional cover image for the entire bag

-- Add hero_item_id to bags table (FK to bag_items)
-- ON DELETE SET NULL ensures if the hero item is deleted, we just clear the reference
ALTER TABLE bags ADD COLUMN IF NOT EXISTS hero_item_id UUID REFERENCES bag_items(id) ON DELETE SET NULL;

-- Add cover_photo_id to bags table (FK to media_assets)
-- ON DELETE SET NULL ensures if the media asset is deleted, we just clear the reference
ALTER TABLE bags ADD COLUMN IF NOT EXISTS cover_photo_id UUID REFERENCES media_assets(id) ON DELETE SET NULL;

-- Create indexes for efficient lookups
CREATE INDEX IF NOT EXISTS idx_bags_hero_item_id ON bags(hero_item_id) WHERE hero_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_bags_cover_photo_id ON bags(cover_photo_id) WHERE cover_photo_id IS NOT NULL;
