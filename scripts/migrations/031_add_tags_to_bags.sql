-- Migration 031: Add Tags to Bags
-- Allows users to tag their bags with keywords for better discoverability

-- Add tags column (array of text values stored as JSONB)
ALTER TABLE bags ADD COLUMN IF NOT EXISTS tags jsonb DEFAULT '[]';

-- Add constraint to ensure tags is always an array
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'tags_is_array' AND conrelid = 'bags'::regclass
  ) THEN
    ALTER TABLE bags ADD CONSTRAINT tags_is_array
      CHECK (jsonb_typeof(tags) = 'array');
  END IF;
END $$;

-- Create index for tag searching using GIN (Generalized Inverted Index)
-- This allows efficient searching of tags using jsonb operators
CREATE INDEX IF NOT EXISTS idx_bags_tags ON bags USING GIN (tags);

-- Index for category + public status (common filter combination)
CREATE INDEX IF NOT EXISTS idx_bags_category_public ON bags(category, is_public);

-- Function to search bags by tags
CREATE OR REPLACE FUNCTION search_bags_by_tags(tag_array text[])
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  category text,
  tags jsonb,
  owner_id uuid,
  code text,
  is_public boolean,
  created_at timestamptz
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    b.id,
    b.title,
    b.description,
    b.category,
    b.tags,
    b.owner_id,
    b.code,
    b.is_public,
    b.created_at
  FROM bags b
  WHERE b.is_public = true
    AND b.tags ?| tag_array  -- ?| operator checks if any array element exists in jsonb
  ORDER BY b.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- Comments
COMMENT ON COLUMN bags.tags IS 'Array of tag strings for categorization and search';
COMMENT ON FUNCTION search_bags_by_tags IS 'Search public bags that have any of the specified tags';

-- Example tags structure:
-- ["golf-clubs", "taylormade", "complete-set", "beginner-friendly"]
-- ["travel-essentials", "carry-on", "international"]
-- ["camping", "hiking", "backpacking", "lightweight"]
