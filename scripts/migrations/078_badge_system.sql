-- Migration 078: Badge System
-- Tracks user achievements and milestones

-- ============================================================================
-- Badge Definitions (reference table)
-- ============================================================================

CREATE TABLE IF NOT EXISTS badge_definitions (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('collection', 'items', 'engagement', 'special')),
  icon TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT 'teed-green',
  requirement_type TEXT NOT NULL CHECK (requirement_type IN ('count', 'action', 'manual')),
  requirement_value INTEGER DEFAULT 1,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE badge_definitions IS 'Defines available badges and their unlock requirements';

-- ============================================================================
-- User Badges (awarded badges)
-- ============================================================================

CREATE TABLE IF NOT EXISTS user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badge_definitions(id) ON DELETE CASCADE,
  awarded_at TIMESTAMPTZ DEFAULT NOW(),
  progress_value INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',

  CONSTRAINT user_badges_unique UNIQUE (user_id, badge_id)
);

COMMENT ON TABLE user_badges IS 'Badges awarded to users';

-- ============================================================================
-- Badge Progress (track progress toward badges)
-- ============================================================================

CREATE TABLE IF NOT EXISTS badge_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badge_definitions(id) ON DELETE CASCADE,
  current_value INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),

  CONSTRAINT badge_progress_unique UNIQUE (user_id, badge_id)
);

COMMENT ON TABLE badge_progress IS 'Tracks user progress toward earning badges';

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_user_badges_user ON user_badges(user_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_badge ON user_badges(badge_id);
CREATE INDEX IF NOT EXISTS idx_user_badges_awarded ON user_badges(awarded_at DESC);

CREATE INDEX IF NOT EXISTS idx_badge_progress_user ON badge_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_badge_progress_badge ON badge_progress(badge_id);

CREATE INDEX IF NOT EXISTS idx_badge_definitions_category ON badge_definitions(category);
CREATE INDEX IF NOT EXISTS idx_badge_definitions_active ON badge_definitions(is_active) WHERE is_active = TRUE;

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE badge_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE badge_progress ENABLE ROW LEVEL SECURITY;

-- Badge definitions are public (read-only)
CREATE POLICY "Badge definitions are public"
  ON badge_definitions FOR SELECT
  USING (true);

-- Users can view their own badges
CREATE POLICY "Users can view own badges"
  ON user_badges FOR SELECT
  USING (auth.uid() = user_id);

-- Users can view others' badges (for public profiles)
CREATE POLICY "Public badge viewing"
  ON user_badges FOR SELECT
  USING (true);

-- Service role can manage badges
CREATE POLICY "Service role manages badges"
  ON user_badges FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Users can view their own progress
CREATE POLICY "Users can view own progress"
  ON badge_progress FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can manage progress
CREATE POLICY "Service role manages progress"
  ON badge_progress FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Seed Default Badges
-- ============================================================================

INSERT INTO badge_definitions (id, name, description, category, icon, color, requirement_type, requirement_value, sort_order) VALUES
  -- Collection badges
  ('first_bag', 'First Bag', 'Created your first bag', 'collection', 'package', 'teed-green', 'count', 1, 10),
  ('five_bags', 'Curator', 'Created 5 bags', 'collection', 'layers', 'sky', 'count', 5, 20),
  ('ten_bags', 'Collector', 'Created 10 bags', 'collection', 'archive', 'amber', 'count', 10, 30),
  ('twenty_bags', 'Archivist', 'Created 20 bags', 'collection', 'library', 'purple', 'count', 20, 40),

  -- Item badges
  ('first_item', 'First Pick', 'Added your first item to a bag', 'items', 'plus', 'teed-green', 'count', 1, 50),
  ('fifty_items', 'Gear Head', 'Added 50 items across all bags', 'items', 'box', 'sky', 'count', 50, 60),
  ('hundred_items', 'Equipment Expert', 'Added 100 items across all bags', 'items', 'boxes', 'amber', 'count', 100, 70),

  -- Engagement badges
  ('first_share', 'Spreader', 'Shared your first bag', 'engagement', 'share-2', 'teed-green', 'action', 1, 80),
  ('first_follower', 'Influencer', 'Gained your first follower', 'engagement', 'user-plus', 'sky', 'count', 1, 90),
  ('ten_followers', 'Tastemaker', 'Gained 10 followers', 'engagement', 'users', 'amber', 'count', 10, 100),
  ('first_embed', 'Publisher', 'Created your first embed', 'engagement', 'code', 'purple', 'action', 1, 110),

  -- Special badges
  ('early_adopter', 'Early Adopter', 'Joined during beta', 'special', 'zap', 'amber', 'manual', 1, 200),
  ('founder', 'Founder', 'Founding member of Teed', 'special', 'crown', 'purple', 'manual', 1, 210)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  requirement_type = EXCLUDED.requirement_type,
  requirement_value = EXCLUDED.requirement_value,
  sort_order = EXCLUDED.sort_order;

-- ============================================================================
-- Helper Functions
-- ============================================================================

-- Check and award badge if requirements met
CREATE OR REPLACE FUNCTION check_and_award_badge(
  p_user_id UUID,
  p_badge_id TEXT,
  p_current_value INTEGER DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_badge badge_definitions;
  v_already_awarded BOOLEAN;
  v_value INTEGER;
BEGIN
  -- Get badge definition
  SELECT * INTO v_badge FROM badge_definitions WHERE id = p_badge_id AND is_active = TRUE;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Check if already awarded
  SELECT EXISTS(
    SELECT 1 FROM user_badges WHERE user_id = p_user_id AND badge_id = p_badge_id
  ) INTO v_already_awarded;

  IF v_already_awarded THEN
    RETURN FALSE;
  END IF;

  -- Use provided value or get from progress
  v_value := COALESCE(p_current_value, (
    SELECT current_value FROM badge_progress
    WHERE user_id = p_user_id AND badge_id = p_badge_id
  ), 0);

  -- Check if requirement is met
  IF v_badge.requirement_type = 'manual' THEN
    RETURN FALSE; -- Manual badges can't be auto-awarded
  END IF;

  IF v_value >= v_badge.requirement_value THEN
    -- Award the badge
    INSERT INTO user_badges (user_id, badge_id, progress_value)
    VALUES (p_user_id, p_badge_id, v_value)
    ON CONFLICT (user_id, badge_id) DO NOTHING;

    RETURN TRUE;
  END IF;

  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update progress and check for badge
CREATE OR REPLACE FUNCTION update_badge_progress(
  p_user_id UUID,
  p_badge_id TEXT,
  p_increment INTEGER DEFAULT 1
) RETURNS BOOLEAN AS $$
DECLARE
  v_new_value INTEGER;
BEGIN
  -- Upsert progress
  INSERT INTO badge_progress (user_id, badge_id, current_value, last_updated)
  VALUES (p_user_id, p_badge_id, p_increment, NOW())
  ON CONFLICT (user_id, badge_id) DO UPDATE
  SET current_value = badge_progress.current_value + p_increment,
      last_updated = NOW()
  RETURNING current_value INTO v_new_value;

  -- Check if badge should be awarded
  RETURN check_and_award_badge(p_user_id, p_badge_id, v_new_value);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's badges with definitions
CREATE OR REPLACE FUNCTION get_user_badges(p_user_id UUID)
RETURNS TABLE (
  badge_id TEXT,
  name TEXT,
  description TEXT,
  category TEXT,
  icon TEXT,
  color TEXT,
  awarded_at TIMESTAMPTZ,
  progress_value INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    bd.id,
    bd.name,
    bd.description,
    bd.category,
    bd.icon,
    bd.color,
    ub.awarded_at,
    ub.progress_value
  FROM user_badges ub
  JOIN badge_definitions bd ON bd.id = ub.badge_id
  WHERE ub.user_id = p_user_id
  ORDER BY ub.awarded_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
