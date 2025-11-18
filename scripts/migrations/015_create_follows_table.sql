-- Migration: Create follows table for user-to-user following
-- This enables the social features: follow users and see their bags in your feed

-- ============================================================================
-- 1. CREATE FOLLOWS TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS follows (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  following_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now() NOT NULL,

  -- Constraints
  CONSTRAINT no_self_follow CHECK (follower_id != following_id),
  CONSTRAINT unique_follow UNIQUE (follower_id, following_id)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS follows_follower_id_idx ON follows(follower_id);
CREATE INDEX IF NOT EXISTS follows_following_id_idx ON follows(following_id);
CREATE INDEX IF NOT EXISTS follows_created_at_idx ON follows(created_at DESC);

-- ============================================================================
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on follows table
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone can view all follows (to see follower/following counts)
CREATE POLICY "Follows are publicly viewable"
  ON follows
  FOR SELECT
  USING (true);

-- Policy 2: Users can create a follow (follow someone)
CREATE POLICY "Users can follow others"
  ON follows
  FOR INSERT
  WITH CHECK (auth.uid() = follower_id);

-- Policy 3: Users can delete their own follows (unfollow someone)
CREATE POLICY "Users can unfollow others"
  ON follows
  FOR DELETE
  USING (auth.uid() = follower_id);

-- ============================================================================
-- 3. HELPER FUNCTIONS
-- ============================================================================

-- Function to get follower count for a user
CREATE OR REPLACE FUNCTION get_follower_count(user_id uuid)
RETURNS bigint AS $$
  SELECT COUNT(*) FROM follows WHERE following_id = user_id;
$$ LANGUAGE sql STABLE;

-- Function to get following count for a user
CREATE OR REPLACE FUNCTION get_following_count(user_id uuid)
RETURNS bigint AS $$
  SELECT COUNT(*) FROM follows WHERE follower_id = user_id;
$$ LANGUAGE sql STABLE;

-- Function to check if user A follows user B
CREATE OR REPLACE FUNCTION is_following(follower uuid, following uuid)
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM follows
    WHERE follower_id = follower AND following_id = following
  );
$$ LANGUAGE sql STABLE;

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- This migration creates:
-- ✅ follows table with constraints
-- ✅ RLS policies for secure access control
-- ✅ Performance indexes
-- ✅ Helper functions for follower/following counts

-- Next steps:
-- 1. Run this migration
-- 2. Create API endpoints for follow/unfollow
-- 3. Add follow button to user profiles
-- 4. Create feed page showing followed users' bags
