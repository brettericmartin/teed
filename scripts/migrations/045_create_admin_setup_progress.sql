-- Migration: 045_create_admin_setup_progress
-- Description: Create table to track admin setup wizard progress (e.g., ChatGPT GPT setup)

-- Create admin_setup_progress table
CREATE TABLE IF NOT EXISTS admin_setup_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guide_type TEXT NOT NULL,
  step_id TEXT NOT NULL,
  is_completed BOOLEAN DEFAULT FALSE,
  notes TEXT,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(guide_type, step_id)
);

-- Add comment for documentation
COMMENT ON TABLE admin_setup_progress IS 'Tracks progress through admin setup wizards (ChatGPT GPT, affiliate programs, etc.)';
COMMENT ON COLUMN admin_setup_progress.guide_type IS 'Type of setup guide (e.g., chatgpt_gpt, affiliate_amazon)';
COMMENT ON COLUMN admin_setup_progress.step_id IS 'Unique identifier for the step within the guide (e.g., 1.1, 2.3)';
COMMENT ON COLUMN admin_setup_progress.is_completed IS 'Whether this step has been marked as completed';
COMMENT ON COLUMN admin_setup_progress.notes IS 'User notes or questions about this step';
COMMENT ON COLUMN admin_setup_progress.completed_at IS 'When the step was marked as completed';

-- Create index for faster lookups by guide type
CREATE INDEX IF NOT EXISTS idx_admin_setup_progress_guide_type ON admin_setup_progress(guide_type);

-- Enable RLS
ALTER TABLE admin_setup_progress ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Only admins can access this table
-- Note: We use a permissive policy that allows service role access
-- Admin access is enforced at the API layer
CREATE POLICY "Service role can manage admin_setup_progress"
  ON admin_setup_progress
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_admin_setup_progress_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER admin_setup_progress_updated_at
  BEFORE UPDATE ON admin_setup_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_setup_progress_updated_at();
