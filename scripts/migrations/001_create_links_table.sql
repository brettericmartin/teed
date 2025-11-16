-- Migration 001: Create links table with RLS policies
-- This is a CRITICAL MVP feature

-- Create links table
CREATE TABLE IF NOT EXISTS links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bag_id uuid REFERENCES bags(id) ON DELETE CASCADE,
  bag_item_id uuid REFERENCES bag_items(id) ON DELETE CASCADE,
  kind text NOT NULL,
  url text NOT NULL,
  label text,
  metadata jsonb,
  created_at timestamptz DEFAULT now(),
  CONSTRAINT links_target_check CHECK (
    (bag_id IS NOT NULL AND bag_item_id IS NULL) OR
    (bag_id IS NULL AND bag_item_id IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_links_bag_id ON links(bag_id) WHERE bag_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_links_bag_item_id ON links(bag_item_id) WHERE bag_item_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_links_kind ON links(kind);

-- Enable RLS
ALTER TABLE links ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public bags links are viewable by everyone" ON links;
DROP POLICY IF EXISTS "Users can view their own bag links" ON links;
DROP POLICY IF EXISTS "Users can manage links for their bags" ON links;

-- RLS Policy: Public bags links are viewable by everyone
CREATE POLICY "Public bags links are viewable by everyone"
  ON links FOR SELECT
  USING (
    CASE
      WHEN bag_id IS NOT NULL THEN
        EXISTS (SELECT 1 FROM bags WHERE id = links.bag_id AND is_public = true)
      WHEN bag_item_id IS NOT NULL THEN
        EXISTS (
          SELECT 1 FROM bag_items bi
          JOIN bags b ON bi.bag_id = b.id
          WHERE bi.id = links.bag_item_id AND b.is_public = true
        )
    END
  );

-- RLS Policy: Users can view their own bag links
CREATE POLICY "Users can view their own bag links"
  ON links FOR SELECT
  USING (
    auth.uid() IN (
      SELECT owner_id FROM bags WHERE id = links.bag_id
      UNION
      SELECT b.owner_id FROM bag_items bi
      JOIN bags b ON bi.bag_id = b.id
      WHERE bi.id = links.bag_item_id
    )
  );

-- RLS Policy: Users can manage links for their bags
CREATE POLICY "Users can manage links for their bags"
  ON links FOR ALL
  USING (
    auth.uid() IN (
      SELECT owner_id FROM bags WHERE id = links.bag_id
      UNION
      SELECT b.owner_id FROM bag_items bi
      JOIN bags b ON bi.bag_id = b.id
      WHERE bi.id = links.bag_item_id
    )
  );
