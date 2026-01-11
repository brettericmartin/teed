-- Migration 063: Application Status Tokens
-- Creates table for magic link status checking

-- ═══════════════════════════════════════════════════════════════════
-- Table: Application Status Tokens
-- Stores tokens for applicants to check their status
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS application_status_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  application_id UUID NOT NULL REFERENCES beta_applications(id) ON DELETE CASCADE UNIQUE,
  token TEXT UNIQUE NOT NULL DEFAULT encode(gen_random_bytes(16), 'hex'),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient token lookup
CREATE INDEX IF NOT EXISTS idx_status_tokens_token ON application_status_tokens(token);

-- ═══════════════════════════════════════════════════════════════════
-- Function: Get or Create Status Token
-- Returns existing token or creates one for an application
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_or_create_status_token(app_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result_token TEXT;
BEGIN
  -- Try to get existing token
  SELECT token INTO result_token
  FROM application_status_tokens
  WHERE application_id = app_id;

  -- If no token exists, create one
  IF result_token IS NULL THEN
    INSERT INTO application_status_tokens (application_id)
    VALUES (app_id)
    RETURNING token INTO result_token;
  END IF;

  RETURN result_token;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- Function: Get Application Status by Token
-- Returns application status info for a given token
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_application_status_by_token(status_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  app_record RECORD;
  position_in_queue INTEGER;
  total_pending INTEGER;
  priority_score INTEGER;
  approval_odds INTEGER;
  result JSONB;
BEGIN
  -- Get the application
  SELECT
    ba.id,
    ba.status,
    ba.email,
    SPLIT_PART(COALESCE(ba.name, ba.full_name, 'Applicant'), ' ', 1) as first_name,
    ba.creator_type,
    ba.successful_referrals,
    ba.referral_tier,
    ba.priority_boost,
    ba.created_at
  INTO app_record
  FROM application_status_tokens ast
  JOIN beta_applications ba ON ba.id = ast.application_id
  WHERE ast.token = status_token;

  IF app_record IS NULL THEN
    RETURN jsonb_build_object('found', false, 'error', 'Invalid status token');
  END IF;

  -- Calculate position in queue (only if pending)
  IF app_record.status = 'pending' THEN
    SELECT COUNT(*) + 1 INTO position_in_queue
    FROM beta_applications
    WHERE status = 'pending'
      AND (
        COALESCE(priority_boost, 0) > COALESCE(app_record.priority_boost, 0)
        OR (
          COALESCE(priority_boost, 0) = COALESCE(app_record.priority_boost, 0)
          AND created_at < app_record.created_at
        )
      );

    SELECT COUNT(*) INTO total_pending
    FROM beta_applications
    WHERE status = 'pending';
  END IF;

  -- Calculate priority score (0-100)
  priority_score := COALESCE(app_record.priority_boost, 0) * 10
    + COALESCE(app_record.successful_referrals, 0) * 15;
  IF priority_score > 100 THEN priority_score := 100; END IF;

  -- Calculate approval odds based on priority and referrals
  approval_odds := 30 + priority_score / 2
    + COALESCE(app_record.successful_referrals, 0) * 10;
  IF approval_odds > 95 THEN approval_odds := 95; END IF;
  IF COALESCE(app_record.successful_referrals, 0) >= 5 THEN
    approval_odds := 100; -- Instant approval threshold
  END IF;

  RETURN jsonb_build_object(
    'found', true,
    'application_id', app_record.id,
    'status', app_record.status,
    'first_name', app_record.first_name,
    'creator_type', app_record.creator_type,
    'position_in_queue', position_in_queue,
    'total_pending', total_pending,
    'priority_score', priority_score,
    'approval_odds', approval_odds,
    'referrals', COALESCE(app_record.successful_referrals, 0),
    'referral_tier', COALESCE(app_record.referral_tier, 0),
    'referrals_for_instant', GREATEST(0, 5 - COALESCE(app_record.successful_referrals, 0)),
    'applied_at', app_record.created_at
  );
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- Trigger: Auto-create status token on application
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION auto_create_status_token()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO application_status_tokens (application_id)
  VALUES (NEW.id)
  ON CONFLICT (application_id) DO NOTHING;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_auto_create_status_token ON beta_applications;
CREATE TRIGGER trigger_auto_create_status_token
  AFTER INSERT ON beta_applications
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_status_token();

-- ═══════════════════════════════════════════════════════════════════
-- Backfill: Create tokens for existing applications
-- ═══════════════════════════════════════════════════════════════════

INSERT INTO application_status_tokens (application_id)
SELECT id FROM beta_applications
WHERE id NOT IN (SELECT application_id FROM application_status_tokens)
ON CONFLICT (application_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════════════
-- Grant permissions
-- ═══════════════════════════════════════════════════════════════════

GRANT SELECT ON application_status_tokens TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_or_create_status_token(UUID) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_application_status_by_token(TEXT) TO authenticated, anon;

COMMENT ON TABLE application_status_tokens IS 'Tokens for applicants to check their application status';
COMMENT ON FUNCTION get_application_status_by_token(TEXT) IS 'Returns application status info for a given token';
