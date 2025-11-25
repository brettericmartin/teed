-- Migration 024: User Activity Tracking Table
-- Tracks user events for analytics, retention measurement, and engagement scoring

CREATE TABLE IF NOT EXISTS user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who performed the action
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,

  -- Event classification
  event_type text NOT NULL,
  -- Event types:
  -- Authentication: 'login', 'logout', 'signup'
  -- Bags: 'bag_created', 'bag_updated', 'bag_deleted', 'bag_viewed', 'bag_shared'
  -- Items: 'item_added', 'item_updated', 'item_deleted'
  -- Photos: 'photo_uploaded', 'photo_deleted'
  -- AI: 'ai_identify_started', 'ai_identify_completed', 'ai_identify_failed'
  -- Links: 'link_added', 'link_clicked', 'affiliate_clicked'
  -- Engagement: 'feedback_submitted', 'survey_completed', 'feature_voted'
  -- Onboarding: 'onboarding_started', 'onboarding_step', 'onboarding_completed'
  -- Beta: 'beta_hub_visited', 'leaderboard_viewed', 'reward_claimed'

  -- Flexible event data
  event_data jsonb DEFAULT '{}',
  -- Example event_data:
  -- bag_created: { bag_id: '...', category: 'golf' }
  -- ai_identify_completed: { items_found: 5, confidence: 85 }
  -- onboarding_step: { step: 3, step_name: 'first_bag' }

  -- Session tracking (for grouping related events)
  session_id text,

  -- Context
  page_url text,
  referrer text,

  -- Device info
  device_type text CHECK (device_type IN ('desktop', 'mobile', 'tablet', 'unknown')),
  browser text,
  os text,

  -- Timestamp
  created_at timestamptz DEFAULT now()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_user_activity_user ON user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON user_activity(event_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created ON user_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_session ON user_activity(session_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_date ON user_activity(user_id, created_at DESC);

-- Composite index for retention queries (using cast instead of DATE function for immutability)
CREATE INDEX IF NOT EXISTS idx_user_activity_retention ON user_activity(user_id, (created_at::date));

-- RLS Policies
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Users can view their own activity
CREATE POLICY "Users can view own activity"
  ON user_activity
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can insert their own activity
CREATE POLICY "Users can track own activity"
  ON user_activity
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Function to get daily active users for a date range
CREATE OR REPLACE FUNCTION get_daily_active_users(start_date date, end_date date)
RETURNS TABLE (activity_date date, active_users bigint) AS $$
BEGIN
  RETURN QUERY
  SELECT
    DATE(created_at) as activity_date,
    COUNT(DISTINCT user_id) as active_users
  FROM user_activity
  WHERE DATE(created_at) BETWEEN start_date AND end_date
  GROUP BY DATE(created_at)
  ORDER BY activity_date;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to calculate retention cohorts
CREATE OR REPLACE FUNCTION get_retention_cohort(cohort_start date, days_to_check integer[])
RETURNS TABLE (day_number integer, retained_users bigint, retention_rate numeric) AS $$
DECLARE
  total_users bigint;
BEGIN
  -- Get total users who signed up on cohort_start
  SELECT COUNT(DISTINCT user_id) INTO total_users
  FROM user_activity
  WHERE event_type = 'signup'
    AND DATE(created_at) = cohort_start;

  IF total_users = 0 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT
    d.day as day_number,
    COUNT(DISTINCT ua.user_id) as retained_users,
    ROUND(COUNT(DISTINCT ua.user_id)::numeric / total_users * 100, 2) as retention_rate
  FROM unnest(days_to_check) as d(day)
  LEFT JOIN user_activity ua ON
    DATE(ua.created_at) = cohort_start + d.day
    AND ua.user_id IN (
      SELECT DISTINCT user_id
      FROM user_activity
      WHERE event_type = 'signup'
        AND DATE(created_at) = cohort_start
    )
  GROUP BY d.day
  ORDER BY d.day;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment
COMMENT ON TABLE user_activity IS 'Event tracking for analytics, retention, and engagement scoring';
