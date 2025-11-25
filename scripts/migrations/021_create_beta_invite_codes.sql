-- Migration 021: Beta Invite Codes Table
-- Manages invite codes for beta access with tracking

CREATE TABLE IF NOT EXISTS beta_invite_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The actual invite code (e.g., 'GOLF2024', 'FRIEND-ABC123')
  code text UNIQUE NOT NULL,

  -- Who created this code (admin or existing user for referrals)
  created_by_id uuid REFERENCES profiles(id) ON DELETE SET NULL,

  -- Link to application if this was generated for a specific applicant
  application_id uuid REFERENCES beta_applications(id) ON DELETE SET NULL,

  -- Beta tier determines features/priority
  tier text DEFAULT 'standard' CHECK (tier IN ('founder', 'influencer', 'standard', 'friend')),

  -- Usage limits
  max_uses integer DEFAULT 1,
  current_uses integer DEFAULT 0,

  -- Optional expiration
  expires_at timestamptz,

  -- Tracking
  created_at timestamptz DEFAULT now(),
  first_claimed_at timestamptz,

  -- Optional notes
  notes text
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_beta_invite_codes_code ON beta_invite_codes(code);
CREATE INDEX IF NOT EXISTS idx_beta_invite_codes_created_by ON beta_invite_codes(created_by_id);
CREATE INDEX IF NOT EXISTS idx_beta_invite_codes_application ON beta_invite_codes(application_id);
CREATE INDEX IF NOT EXISTS idx_beta_invite_codes_tier ON beta_invite_codes(tier);

-- RLS Policies
ALTER TABLE beta_invite_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can check if a code is valid (needed for redemption)
CREATE POLICY "Anyone can validate invite codes"
  ON beta_invite_codes
  FOR SELECT
  TO public
  USING (true);

-- Function to validate and claim an invite code
CREATE OR REPLACE FUNCTION claim_invite_code(invite_code text)
RETURNS jsonb AS $$
DECLARE
  code_record beta_invite_codes%ROWTYPE;
  result jsonb;
BEGIN
  -- Find the code
  SELECT * INTO code_record
  FROM beta_invite_codes
  WHERE code = invite_code;

  -- Check if code exists
  IF code_record IS NULL THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid invite code');
  END IF;

  -- Check if expired
  IF code_record.expires_at IS NOT NULL AND code_record.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This invite code has expired');
  END IF;

  -- Check if maxed out
  IF code_record.current_uses >= code_record.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'error', 'This invite code has reached its maximum uses');
  END IF;

  -- Increment usage
  UPDATE beta_invite_codes
  SET
    current_uses = current_uses + 1,
    first_claimed_at = COALESCE(first_claimed_at, now())
  WHERE id = code_record.id;

  -- Return success with tier info
  RETURN jsonb_build_object(
    'valid', true,
    'tier', code_record.tier,
    'created_by_id', code_record.created_by_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to generate a random invite code
CREATE OR REPLACE FUNCTION generate_invite_code(prefix text DEFAULT 'TEED')
RETURNS text AS $$
DECLARE
  new_code text;
  exists_check boolean;
BEGIN
  LOOP
    -- Generate code like TEED-ABC123
    new_code := prefix || '-' || upper(substr(md5(random()::text), 1, 6));

    -- Check if it already exists
    SELECT EXISTS(SELECT 1 FROM beta_invite_codes WHERE code = new_code) INTO exists_check;

    -- If unique, return it
    IF NOT exists_check THEN
      RETURN new_code;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Comment
COMMENT ON TABLE beta_invite_codes IS 'Invite codes for beta access with tier-based permissions and usage tracking';
