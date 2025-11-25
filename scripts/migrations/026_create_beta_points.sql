-- Migration 026: Beta Points & Gamification Table
-- Tracks points, badges, and engagement for beta testers

CREATE TABLE IF NOT EXISTS beta_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- One record per user
  user_id uuid UNIQUE NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Points summary
  total_points integer DEFAULT 0,

  -- Activity counters (for leaderboard categories)
  bugs_reported integer DEFAULT 0,
  bugs_validated integer DEFAULT 0,    -- Bugs confirmed as real
  features_suggested integer DEFAULT 0,
  features_shipped integer DEFAULT 0,  -- Suggestions that were implemented
  surveys_completed integer DEFAULT 0,
  referrals_made integer DEFAULT 0,
  referrals_joined integer DEFAULT 0,  -- Referrals who actually joined
  bags_created integer DEFAULT 0,
  items_added integer DEFAULT 0,
  ai_uses integer DEFAULT 0,

  -- Engagement tracking
  streak_days integer DEFAULT 0,
  max_streak integer DEFAULT 0,
  last_active_date date,

  -- Badges earned (array of badge IDs)
  badges text[] DEFAULT '{}',
  -- Badge IDs:
  -- 'founding_member', 'bug_hunter', 'visionary', 'shutterbug',
  -- 'on_fire', 'curator_pro', 'ambassador', 'promoter',
  -- 'early_bird', 'power_user', 'feedback_champion'

  -- Rewards redeemed
  rewards_claimed jsonb DEFAULT '[]',
  -- Example: [{ "reward_id": "pro_year", "claimed_at": "2024-11-24", "points_spent": 500 }]

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Index
CREATE INDEX IF NOT EXISTS idx_beta_points_user ON beta_points(user_id);
CREATE INDEX IF NOT EXISTS idx_beta_points_total ON beta_points(total_points DESC);
CREATE INDEX IF NOT EXISTS idx_beta_points_streak ON beta_points(streak_days DESC);

-- RLS Policies
ALTER TABLE beta_points ENABLE ROW LEVEL SECURITY;

-- Users can view all points (for leaderboard)
CREATE POLICY "Anyone can view beta points"
  ON beta_points
  FOR SELECT
  TO authenticated
  USING (true);

-- Only system can modify (via functions)
-- No direct insert/update policies for users

-- Note: Trigger to auto-create beta_points will be added after profiles migration
-- This is handled in 027_add_beta_fields_to_profiles.sql

-- Function to award points
CREATE OR REPLACE FUNCTION award_beta_points(
  target_user_id uuid,
  points integer,
  reason text,
  counter_field text DEFAULT NULL
)
RETURNS integer AS $$
DECLARE
  new_total integer;
BEGIN
  -- Update points and optionally increment a counter
  IF counter_field IS NOT NULL THEN
    EXECUTE format(
      'UPDATE beta_points SET total_points = total_points + $1, %I = %I + 1, updated_at = now() WHERE user_id = $2 RETURNING total_points',
      counter_field, counter_field
    ) INTO new_total USING points, target_user_id;
  ELSE
    UPDATE beta_points
    SET total_points = total_points + points, updated_at = now()
    WHERE user_id = target_user_id
    RETURNING total_points INTO new_total;
  END IF;

  RETURN COALESCE(new_total, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to award a badge
CREATE OR REPLACE FUNCTION award_badge(target_user_id uuid, badge_id text)
RETURNS boolean AS $$
DECLARE
  already_has boolean;
BEGIN
  -- Check if already has badge
  SELECT badge_id = ANY(badges) INTO already_has
  FROM beta_points
  WHERE user_id = target_user_id;

  IF already_has THEN
    RETURN false;
  END IF;

  -- Award the badge
  UPDATE beta_points
  SET badges = array_append(badges, badge_id), updated_at = now()
  WHERE user_id = target_user_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to update streak
CREATE OR REPLACE FUNCTION update_user_streak(target_user_id uuid)
RETURNS integer AS $$
DECLARE
  current_streak integer;
  last_date date;
  today date := CURRENT_DATE;
BEGIN
  SELECT streak_days, last_active_date INTO current_streak, last_date
  FROM beta_points
  WHERE user_id = target_user_id;

  IF last_date IS NULL OR last_date < today - 1 THEN
    -- Streak broken or first activity
    current_streak := 1;
  ELSIF last_date = today - 1 THEN
    -- Consecutive day
    current_streak := current_streak + 1;
  END IF;
  -- If last_date = today, don't change streak

  UPDATE beta_points
  SET
    streak_days = current_streak,
    max_streak = GREATEST(max_streak, current_streak),
    last_active_date = today,
    updated_at = now()
  WHERE user_id = target_user_id;

  RETURN current_streak;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get leaderboard
CREATE OR REPLACE FUNCTION get_beta_leaderboard(limit_count integer DEFAULT 10)
RETURNS TABLE (
  rank bigint,
  user_id uuid,
  handle text,
  display_name text,
  total_points integer,
  badges text[],
  streak_days integer
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY bp.total_points DESC) as rank,
    bp.user_id,
    p.handle,
    p.display_name,
    bp.total_points,
    bp.badges,
    bp.streak_days
  FROM beta_points bp
  JOIN profiles p ON p.id = bp.user_id
  ORDER BY bp.total_points DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment
COMMENT ON TABLE beta_points IS 'Gamification system for beta testers with points, badges, streaks, and leaderboards';
