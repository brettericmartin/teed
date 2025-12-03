-- Migration: Create saved_bags table for bag bookmarking
-- This enables users to save/bookmark bags for later reference

-- ============================================================================
-- 1. CREATE SAVED_BAGS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS saved_bags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  bag_id uuid NOT NULL REFERENCES bags(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,

  -- Constraints
  CONSTRAINT unique_saved_bag UNIQUE (user_id, bag_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS saved_bags_user_id_idx ON saved_bags(user_id);
CREATE INDEX IF NOT EXISTS saved_bags_bag_id_idx ON saved_bags(bag_id);
CREATE INDEX IF NOT EXISTS saved_bags_created_at_idx ON saved_bags(created_at DESC);

-- ============================================================================
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

ALTER TABLE saved_bags ENABLE ROW LEVEL SECURITY;

-- Policy 1: Users can view their own saved bags
CREATE POLICY "Users can view own saved bags"
  ON saved_bags
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy 2: Users can save bags
CREATE POLICY "Users can save bags"
  ON saved_bags
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Users can unsave bags
CREATE POLICY "Users can unsave bags"
  ON saved_bags
  FOR DELETE
  USING (auth.uid() = user_id);
