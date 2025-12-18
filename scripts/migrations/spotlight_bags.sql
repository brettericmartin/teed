-- Add is_spotlight column to bags table
-- Only one bag per category should be spotlight at a time

ALTER TABLE bags ADD COLUMN IF NOT EXISTS is_spotlight BOOLEAN DEFAULT false;

-- Create index for efficient spotlight queries
CREATE INDEX IF NOT EXISTS idx_bags_spotlight ON bags(is_spotlight) WHERE is_spotlight = true;

-- Create index for category + spotlight queries
CREATE INDEX IF NOT EXISTS idx_bags_category_spotlight ON bags(category, is_spotlight) WHERE is_spotlight = true;

-- Function to ensure only one spotlight per category
CREATE OR REPLACE FUNCTION ensure_single_spotlight_per_category()
RETURNS TRIGGER AS $$
BEGIN
  -- If setting a bag as spotlight, remove spotlight from other bags in same category
  IF NEW.is_spotlight = true AND (OLD.is_spotlight IS NULL OR OLD.is_spotlight = false) THEN
    UPDATE bags
    SET is_spotlight = false
    WHERE category = NEW.category
      AND id != NEW.id
      AND is_spotlight = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to enforce single spotlight per category
DROP TRIGGER IF EXISTS trigger_single_spotlight_per_category ON bags;
CREATE TRIGGER trigger_single_spotlight_per_category
  BEFORE UPDATE ON bags
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_spotlight_per_category();
