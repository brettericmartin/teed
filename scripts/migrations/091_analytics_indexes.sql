-- Performance indexes for admin analytics queries
-- These support the common query pattern of filtering by event_type + time range

-- Composite index on user_activity for event_type + created_at
CREATE INDEX IF NOT EXISTS idx_user_activity_event_type_created
  ON user_activity (event_type, created_at DESC);

-- Index on profiles.last_active_at for user health segment queries
CREATE INDEX IF NOT EXISTS idx_profiles_last_active_at
  ON profiles (last_active_at DESC)
  WHERE last_active_at IS NOT NULL;

-- Index on follows.created_at for follower trend queries
CREATE INDEX IF NOT EXISTS idx_follows_following_created
  ON follows (following_id, created_at DESC);
