-- Migration 060: Custom Referral Codes
-- Allows applicants to create memorable referral codes like "SARAH2024" instead of UUIDs

-- ═══════════════════════════════════════════════════════════════════
-- Add custom_referral_code column
-- ═══════════════════════════════════════════════════════════════════

ALTER TABLE beta_applications
  ADD COLUMN IF NOT EXISTS custom_referral_code TEXT;

-- Unique constraint (partial - only non-null values)
CREATE UNIQUE INDEX IF NOT EXISTS idx_beta_applications_custom_code
  ON beta_applications(custom_referral_code)
  WHERE custom_referral_code IS NOT NULL;

-- Index for fast lookups (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_beta_applications_custom_code_lower
  ON beta_applications(LOWER(custom_referral_code))
  WHERE custom_referral_code IS NOT NULL;

-- ═══════════════════════════════════════════════════════════════════
-- Function: Check if a custom code is available
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION check_custom_code_available(code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  normalized_code TEXT;
  exists_count INTEGER;
BEGIN
  -- Normalize: uppercase, trim whitespace
  normalized_code := UPPER(TRIM(code));

  -- Validate format: 3-20 chars, alphanumeric + underscore only
  IF normalized_code !~ '^[A-Z0-9_]{3,20}$' THEN
    RETURN jsonb_build_object(
      'available', false,
      'error', 'Code must be 3-20 characters, letters, numbers, and underscores only'
    );
  END IF;

  -- Check reserved words
  IF normalized_code IN ('TEED', 'ADMIN', 'TEST', 'BETA', 'FOUNDER', 'VIP', 'NULL', 'UNDEFINED') THEN
    RETURN jsonb_build_object(
      'available', false,
      'error', 'This code is reserved'
    );
  END IF;

  -- Check if already taken
  SELECT COUNT(*) INTO exists_count
  FROM beta_applications
  WHERE LOWER(custom_referral_code) = LOWER(normalized_code);

  IF exists_count > 0 THEN
    RETURN jsonb_build_object(
      'available', false,
      'error', 'This code is already taken'
    );
  END IF;

  -- Also check against invite codes to avoid confusion
  SELECT COUNT(*) INTO exists_count
  FROM beta_invite_codes bic
  WHERE LOWER(bic.code) = LOWER(normalized_code);

  IF exists_count > 0 THEN
    RETURN jsonb_build_object(
      'available', false,
      'error', 'This code is already in use'
    );
  END IF;

  RETURN jsonb_build_object(
    'available', true,
    'normalized_code', normalized_code
  );
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- Function: Claim a custom referral code
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION claim_custom_referral_code(app_id UUID, code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  normalized_code TEXT;
  availability JSONB;
  app_exists BOOLEAN;
  current_code TEXT;
BEGIN
  -- Check if application exists
  SELECT EXISTS(SELECT 1 FROM beta_applications WHERE id = app_id) INTO app_exists;
  IF NOT app_exists THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Application not found'
    );
  END IF;

  -- Check if they already have a custom code
  SELECT custom_referral_code INTO current_code
  FROM beta_applications WHERE id = app_id;

  IF current_code IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'You already have a custom code: ' || current_code,
      'current_code', current_code
    );
  END IF;

  -- Check availability
  availability := check_custom_code_available(code);

  IF NOT (availability->>'available')::BOOLEAN THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', availability->>'error'
    );
  END IF;

  normalized_code := availability->>'normalized_code';

  -- Claim the code
  UPDATE beta_applications
  SET
    custom_referral_code = normalized_code,
    updated_at = NOW()
  WHERE id = app_id;

  RETURN jsonb_build_object(
    'success', true,
    'code', normalized_code,
    'referral_link', '/apply?ref=' || normalized_code
  );
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- Function: Lookup application by custom code or UUID
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION lookup_referrer(ref_value TEXT)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  app_id UUID;
BEGIN
  -- First check if it's a valid UUID
  BEGIN
    app_id := ref_value::UUID;
    -- Verify the UUID exists
    IF EXISTS(SELECT 1 FROM beta_applications WHERE id = app_id) THEN
      RETURN app_id;
    END IF;
  EXCEPTION WHEN OTHERS THEN
    -- Not a UUID, continue to check custom code
    NULL;
  END;

  -- Check custom referral codes (case-insensitive)
  SELECT id INTO app_id
  FROM beta_applications
  WHERE LOWER(custom_referral_code) = LOWER(ref_value)
  LIMIT 1;

  RETURN app_id; -- Returns NULL if not found
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- Grant permissions
-- ═══════════════════════════════════════════════════════════════════

GRANT EXECUTE ON FUNCTION check_custom_code_available(TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION claim_custom_referral_code(UUID, TEXT) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION lookup_referrer(TEXT) TO authenticated, anon;
