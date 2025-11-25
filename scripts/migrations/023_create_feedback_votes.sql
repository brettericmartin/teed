-- Migration 023: Feedback Votes Table
-- Allows users to vote on feature requests

CREATE TABLE IF NOT EXISTS feedback_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The feedback being voted on
  feedback_id uuid NOT NULL REFERENCES feedback(id) ON DELETE CASCADE,

  -- Who voted
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- When
  created_at timestamptz DEFAULT now(),

  -- Each user can only vote once per feedback item
  UNIQUE(feedback_id, user_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_feedback_votes_feedback ON feedback_votes(feedback_id);
CREATE INDEX IF NOT EXISTS idx_feedback_votes_user ON feedback_votes(user_id);

-- RLS Policies
ALTER TABLE feedback_votes ENABLE ROW LEVEL SECURITY;

-- Users can see their own votes
CREATE POLICY "Users can view own votes"
  ON feedback_votes
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

-- Users can add votes
CREATE POLICY "Users can vote"
  ON feedback_votes
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Users can remove their votes
CREATE POLICY "Users can remove own votes"
  ON feedback_votes
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Trigger to update vote_count on feedback table
CREATE OR REPLACE FUNCTION update_feedback_vote_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE feedback SET vote_count = vote_count + 1 WHERE id = NEW.feedback_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE feedback SET vote_count = vote_count - 1 WHERE id = OLD.feedback_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER feedback_vote_counter
  AFTER INSERT OR DELETE ON feedback_votes
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_vote_count();

-- Comment
COMMENT ON TABLE feedback_votes IS 'User votes on feature requests with automatic count synchronization';
