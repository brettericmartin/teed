-- Migration 020: Beta Applications Table
-- Stores waitlist applications for the closed beta program

CREATE TABLE IF NOT EXISTS beta_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,

  -- Segmentation fields (ScoreApp pattern - collect data AND return value)
  social_platform text,            -- 'youtube', 'tiktok', 'instagram', 'twitter', 'none'
  social_handle text,
  follower_range text,             -- '0-1k', '1k-10k', '10k-100k', '100k+'

  -- Use case segmentation
  primary_use_case text NOT NULL,  -- 'golf', 'fashion', 'tech', 'travel', 'outdoor', 'gaming', 'personal'
  content_frequency text,          -- 'daily', 'weekly', 'monthly', 'rarely', 'never'
  monetization_interest boolean DEFAULT false,

  -- Open responses
  biggest_challenge text,          -- "What's your biggest challenge sharing your gear?"
  how_heard text,                  -- Referral source
  referred_by_code text,           -- Invite code if referred

  -- Admin fields
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'waitlisted', 'rejected')),
  priority_score integer DEFAULT 0,
  admin_notes text,
  reviewed_by text,

  -- Waitlist position (calculated)
  waitlist_position integer,

  -- Timestamps
  created_at timestamptz DEFAULT now(),
  reviewed_at timestamptz,
  invited_at timestamptz
);

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_beta_applications_status ON beta_applications(status);
CREATE INDEX IF NOT EXISTS idx_beta_applications_email ON beta_applications(email);
CREATE INDEX IF NOT EXISTS idx_beta_applications_priority ON beta_applications(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_beta_applications_created ON beta_applications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_beta_applications_use_case ON beta_applications(primary_use_case);

-- RLS Policies
ALTER TABLE beta_applications ENABLE ROW LEVEL SECURITY;

-- Only admins can view applications (we'll handle admin check in application code)
-- Public can insert their own application
CREATE POLICY "Anyone can submit an application"
  ON beta_applications
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Function to auto-calculate waitlist position on insert
CREATE OR REPLACE FUNCTION calculate_waitlist_position()
RETURNS TRIGGER AS $$
BEGIN
  NEW.waitlist_position := (SELECT COALESCE(MAX(waitlist_position), 0) + 1 FROM beta_applications);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_waitlist_position
  BEFORE INSERT ON beta_applications
  FOR EACH ROW
  EXECUTE FUNCTION calculate_waitlist_position();

-- Comment
COMMENT ON TABLE beta_applications IS 'Stores beta program applications with segmentation data for prioritization';
