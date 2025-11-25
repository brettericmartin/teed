-- Migration 022: Feedback Table
-- Comprehensive feedback collection for bugs, features, questions, and praise

CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who submitted (nullable for anonymous feedback)
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,

  -- Feedback classification
  type text NOT NULL CHECK (type IN ('bug', 'feature', 'question', 'praise', 'other')),
  category text CHECK (category IN ('ai', 'photos', 'sharing', 'links', 'account', 'bags', 'items', 'mobile', 'performance', 'general')),

  -- For bugs: severity level
  severity text CHECK (severity IN ('critical', 'major', 'minor', 'cosmetic')),

  -- Content
  subject text NOT NULL,
  message text NOT NULL,

  -- Auto-captured context
  page_url text,
  user_agent text,
  screen_size text,
  browser_info jsonb,            -- Parsed browser details

  -- Screenshots (stored in Supabase Storage, URLs here)
  screenshot_urls text[] DEFAULT '{}',

  -- Admin handling
  status text DEFAULT 'new' CHECK (status IN ('new', 'reviewing', 'planned', 'in_progress', 'resolved', 'wontfix', 'duplicate')),
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  admin_response text,
  assigned_to text,
  resolution_notes text,

  -- For feature requests: voting
  vote_count integer DEFAULT 0,

  -- Linked issues (optional GitHub integration)
  github_issue_url text,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  resolved_at timestamptz,

  -- Points awarded for this feedback
  points_awarded integer DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_user ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_priority ON feedback(priority);
CREATE INDEX IF NOT EXISTS idx_feedback_created ON feedback(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_votes ON feedback(vote_count DESC) WHERE type = 'feature';

-- RLS Policies
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Users can view their own feedback
CREATE POLICY "Users can view own feedback"
  ON feedback
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can submit feedback
CREATE POLICY "Authenticated users can submit feedback"
  ON feedback
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can view public feature requests (for voting)
CREATE POLICY "Anyone can view feature requests"
  ON feedback
  FOR SELECT
  TO public
  USING (type = 'feature' AND status NOT IN ('duplicate', 'wontfix'));

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_feedback_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_timestamp();

-- Comment
COMMENT ON TABLE feedback IS 'User feedback including bugs, feature requests, questions, and praise with admin workflow';
