-- Migration 069: Bag Meta Description
-- Adds SEO meta description field to bags
-- DOCTRINE: Permanent value without engagement pressure; professional presentation

-- Add meta_description for SEO optimization
ALTER TABLE bags ADD COLUMN IF NOT EXISTS meta_description TEXT;

-- Add comment for documentation
COMMENT ON COLUMN bags.meta_description IS 'SEO-optimized meta description for social sharing and search engines (max 160 chars recommended)';

SELECT 'Migration 069 complete: Bag meta_description added' AS status;
