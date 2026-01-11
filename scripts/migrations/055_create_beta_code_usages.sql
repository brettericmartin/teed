-- Migration 055: Create Beta Code Usages Table
-- Tracks every invite code redemption attempt for analytics and security

CREATE TABLE IF NOT EXISTS beta_code_usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Which code was attempted
  code_id uuid REFERENCES beta_invite_codes(id) ON DELETE SET NULL,
  code text NOT NULL, -- Denormalized for easier querying even if code deleted

  -- Who used it
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  user_email text, -- Captured at time of use (in case user deleted later)

  -- Context
  application_id uuid REFERENCES beta_applications(id) ON DELETE SET NULL,
  ip_address text,
  user_agent text,

  -- Result of the attempt
  result text NOT NULL CHECK (result IN ('success', 'expired', 'max_uses', 'revoked', 'invalid', 'error')),
  error_message text,

  -- Timestamp
  created_at timestamptz DEFAULT now()
);

-- Indexes for analytics queries
CREATE INDEX IF NOT EXISTS idx_code_usages_code ON beta_code_usages(code_id);
CREATE INDEX IF NOT EXISTS idx_code_usages_code_text ON beta_code_usages(code);
CREATE INDEX IF NOT EXISTS idx_code_usages_user ON beta_code_usages(user_id);
CREATE INDEX IF NOT EXISTS idx_code_usages_created ON beta_code_usages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_code_usages_result ON beta_code_usages(result);

-- RLS
ALTER TABLE beta_code_usages ENABLE ROW LEVEL SECURITY;

-- Admins can view all code usages
CREATE POLICY "Admins can view code usages"
  ON beta_code_usages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
      AND admin_role IS NOT NULL
    )
  );

-- System/authenticated users can insert (for logging attempts)
CREATE POLICY "Authenticated users can log code usages"
  ON beta_code_usages FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow anon inserts for public code validation attempts
CREATE POLICY "Anyone can log code usage attempts"
  ON beta_code_usages FOR INSERT
  TO anon
  WITH CHECK (true);

-- Comment
COMMENT ON TABLE beta_code_usages IS 'Audit log of all invite code redemption attempts (success and failure)';
