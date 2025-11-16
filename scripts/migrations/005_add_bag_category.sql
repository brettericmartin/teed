-- Migration: Add category field to bags table
-- Purpose: Enable bag categorization and AI-powered recommendations
-- Date: 2025-11-15

-- Add category column
ALTER TABLE bags
ADD COLUMN IF NOT EXISTS category VARCHAR(50);

-- Add index for category filtering
CREATE INDEX IF NOT EXISTS idx_bags_category ON bags(category);

-- Add category to public bags view for browsing
-- (No changes needed to RLS policies - category inherits from table)

-- Common categories:
-- camping, hiking, golf, travel, sports, backpacking,
-- photography, fishing, cycling, climbing, emergency, other
