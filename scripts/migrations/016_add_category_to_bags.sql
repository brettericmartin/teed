-- Migration: Add category field to bags table for filtering

-- Add category column to bags
ALTER TABLE bags ADD COLUMN IF NOT EXISTS category text;

-- Add index for filtering
CREATE INDEX IF NOT EXISTS bags_category_idx ON bags(category);

-- Common categories (examples, can be extended)
-- 'golf', 'travel', 'outdoor', 'tech', 'fashion', 'fitness', 'photography', 'gaming', 'music', 'other'
