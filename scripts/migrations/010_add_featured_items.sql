-- Migration 010: Add featured item support for bag cards
-- Allows marking up to 8 items as "featured" to display on bag preview cards

ALTER TABLE bag_items
  ADD COLUMN is_featured boolean DEFAULT false NOT NULL,
  ADD COLUMN featured_position integer;

-- Add comment for documentation
COMMENT ON COLUMN bag_items.is_featured IS 'Whether this item should appear in the featured items grid on bag cards (max 8 per bag)';
COMMENT ON COLUMN bag_items.featured_position IS 'Display order for featured items (1-8). Null if not featured.';

-- Create index for efficient featured item queries
CREATE INDEX idx_bag_items_featured ON bag_items(bag_id, is_featured, featured_position)
  WHERE is_featured = true;

-- Add constraint to ensure featured_position is between 1 and 8 when set
ALTER TABLE bag_items
  ADD CONSTRAINT chk_featured_position
  CHECK (featured_position IS NULL OR (featured_position >= 1 AND featured_position <= 8));
