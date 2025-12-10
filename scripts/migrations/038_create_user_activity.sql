-- Migration 038: Create user_activity table for analytics
-- Tracks page views, clicks, and other user interactions

CREATE TABLE IF NOT EXISTS user_activity (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  event_data jsonb DEFAULT '{}',
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  ip_address inet,
  user_agent text,
  referrer text,
  created_at timestamptz DEFAULT now()
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_user_activity_event_type ON user_activity(event_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON user_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON user_activity(user_id) WHERE user_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_user_activity_bag_viewed ON user_activity((event_data->>'bag_id'))
  WHERE event_type = 'bag_viewed';
CREATE INDEX IF NOT EXISTS idx_user_activity_owner ON user_activity((event_data->>'owner_id'))
  WHERE event_type = 'bag_viewed';

-- RLS policies
ALTER TABLE user_activity ENABLE ROW LEVEL SECURITY;

-- Anyone can insert activity (for anonymous tracking)
CREATE POLICY "Anyone can insert activity" ON user_activity
  FOR INSERT WITH CHECK (true);

-- Only admins can read activity
CREATE POLICY "Admins can read activity" ON user_activity
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.admin_role IS NOT NULL
    )
  );

-- Users can see their own activity
CREATE POLICY "Users can see own activity" ON user_activity
  FOR SELECT USING (user_id = auth.uid());

-- Comments
COMMENT ON TABLE user_activity IS 'Tracks user interactions for analytics (page views, clicks, etc.)';
COMMENT ON COLUMN user_activity.event_type IS 'Type of event (bag_viewed, link_clicked, etc.)';
COMMENT ON COLUMN user_activity.event_data IS 'JSON payload with event-specific data';
