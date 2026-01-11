-- Migration 056: Enhance Beta Invite Codes
-- Adds revocation, campaign tracking, and claimed_by fields

-- Add is_revoked flag (soft disable)
ALTER TABLE beta_invite_codes
  ADD COLUMN IF NOT EXISTS is_revoked boolean DEFAULT false;

-- Add revocation tracking
ALTER TABLE beta_invite_codes
  ADD COLUMN IF NOT EXISTS revoked_at timestamptz;

ALTER TABLE beta_invite_codes
  ADD COLUMN IF NOT EXISTS revoked_by uuid REFERENCES profiles(id);

ALTER TABLE beta_invite_codes
  ADD COLUMN IF NOT EXISTS revoke_reason text;

-- Add campaign/purpose tracking for analytics
ALTER TABLE beta_invite_codes
  ADD COLUMN IF NOT EXISTS campaign text;
-- Examples: 'launch_party', 'influencer_outreach', 'friend_referral', 'partner_xyz'

-- Add claimed_by for single-use codes (who used it)
ALTER TABLE beta_invite_codes
  ADD COLUMN IF NOT EXISTS claimed_by uuid REFERENCES profiles(id);

ALTER TABLE beta_invite_codes
  ADD COLUMN IF NOT EXISTS claimed_at timestamptz;

-- Index for campaign analytics
CREATE INDEX IF NOT EXISTS idx_beta_codes_campaign
  ON beta_invite_codes(campaign) WHERE campaign IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_beta_codes_revoked
  ON beta_invite_codes(is_revoked) WHERE is_revoked = true;

CREATE INDEX IF NOT EXISTS idx_beta_codes_claimed_by
  ON beta_invite_codes(claimed_by) WHERE claimed_by IS NOT NULL;

-- Enhanced claim function with usage logging
CREATE OR REPLACE FUNCTION claim_invite_code(
  invite_code text,
  claiming_user_id uuid DEFAULT NULL,
  claiming_email text DEFAULT NULL,
  client_ip text DEFAULT NULL,
  client_user_agent text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  code_record beta_invite_codes%ROWTYPE;
  result jsonb;
  usage_result text;
BEGIN
  -- Find the code (case-insensitive)
  SELECT * INTO code_record
  FROM beta_invite_codes
  WHERE UPPER(code) = UPPER(invite_code);

  -- Validate code exists
  IF code_record IS NULL THEN
    -- Log failed attempt
    INSERT INTO beta_code_usages (code_id, code, user_id, user_email, ip_address, user_agent, result, error_message)
    VALUES (NULL, invite_code, claiming_user_id, claiming_email, client_ip, client_user_agent, 'invalid', 'Code not found');

    RETURN jsonb_build_object('valid', false, 'error', 'Invalid invite code');
  END IF;

  -- Check if revoked
  IF code_record.is_revoked THEN
    INSERT INTO beta_code_usages (code_id, code, user_id, user_email, ip_address, user_agent, result, error_message)
    VALUES (code_record.id, invite_code, claiming_user_id, claiming_email, client_ip, client_user_agent, 'revoked', 'Code has been revoked');

    RETURN jsonb_build_object('valid', false, 'error', 'This invite code is no longer active');
  END IF;

  -- Check if expired
  IF code_record.expires_at IS NOT NULL AND code_record.expires_at < now() THEN
    INSERT INTO beta_code_usages (code_id, code, user_id, user_email, ip_address, user_agent, result, error_message)
    VALUES (code_record.id, invite_code, claiming_user_id, claiming_email, client_ip, client_user_agent, 'expired', 'Code expired');

    RETURN jsonb_build_object('valid', false, 'error', 'This invite code has expired');
  END IF;

  -- Check if maxed out
  IF code_record.current_uses >= code_record.max_uses THEN
    INSERT INTO beta_code_usages (code_id, code, user_id, user_email, ip_address, user_agent, result, error_message)
    VALUES (code_record.id, invite_code, claiming_user_id, claiming_email, client_ip, client_user_agent, 'max_uses', 'Max uses reached');

    RETURN jsonb_build_object('valid', false, 'error', 'This invite code has reached its maximum uses');
  END IF;

  -- Success! Update code usage
  UPDATE beta_invite_codes
  SET
    current_uses = current_uses + 1,
    first_claimed_at = COALESCE(first_claimed_at, now()),
    claimed_by = COALESCE(claimed_by, claiming_user_id),
    claimed_at = CASE WHEN max_uses = 1 THEN now() ELSE claimed_at END
  WHERE id = code_record.id;

  -- Log successful usage
  INSERT INTO beta_code_usages (code_id, code, user_id, user_email, ip_address, user_agent, result)
  VALUES (code_record.id, invite_code, claiming_user_id, claiming_email, client_ip, client_user_agent, 'success');

  -- Return success with tier info
  RETURN jsonb_build_object(
    'valid', true,
    'code_id', code_record.id,
    'tier', code_record.tier,
    'created_by_id', code_record.created_by_id,
    'campaign', code_record.campaign,
    'remaining_uses', code_record.max_uses - code_record.current_uses - 1
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to revoke a code
CREATE OR REPLACE FUNCTION revoke_invite_code(
  target_code_id uuid,
  revoking_admin_id uuid,
  reason text DEFAULT NULL
)
RETURNS boolean AS $$
BEGIN
  UPDATE beta_invite_codes
  SET
    is_revoked = true,
    revoked_at = now(),
    revoked_by = revoking_admin_id,
    revoke_reason = reason
  WHERE id = target_code_id;

  RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment
COMMENT ON COLUMN beta_invite_codes.is_revoked IS 'Soft-disable flag for revoking codes without deleting';
COMMENT ON COLUMN beta_invite_codes.campaign IS 'Campaign/source tag for analytics (e.g., influencer_outreach)';
COMMENT ON COLUMN beta_invite_codes.claimed_by IS 'User who claimed this code (for single-use codes)';
