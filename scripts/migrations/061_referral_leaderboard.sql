-- Migration 061: Referral Leaderboard
-- Creates function to get top referrers for public leaderboard

-- ═══════════════════════════════════════════════════════════════════
-- Function: Get Referral Leaderboard
-- Returns top referrers with their stats (for public display)
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_referral_leaderboard(limit_count INTEGER DEFAULT 10)
RETURNS TABLE (
  rank BIGINT,
  application_id UUID,
  first_name TEXT,
  referral_count INTEGER,
  referral_tier INTEGER,
  tier_name TEXT,
  has_custom_code BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY ba.successful_referrals DESC, ba.created_at ASC) as rank,
    ba.id as application_id,
    -- Only show first name for privacy
    SPLIT_PART(COALESCE(ba.name, ba.full_name, 'Anonymous'), ' ', 1) as first_name,
    COALESCE(ba.successful_referrals, 0) as referral_count,
    COALESCE(ba.referral_tier, 0) as referral_tier,
    CASE COALESCE(ba.referral_tier, 0)
      WHEN 0 THEN 'Standard'
      WHEN 1 THEN 'Engaged'
      WHEN 2 THEN 'Connector'
      WHEN 3 THEN 'Champion'
      WHEN 4 THEN 'Legend'
      ELSE 'Standard'
    END as tier_name,
    (ba.custom_referral_code IS NOT NULL) as has_custom_code
  FROM beta_applications ba
  WHERE ba.successful_referrals > 0
    AND ba.status IN ('pending', 'approved', 'waitlisted')
  ORDER BY ba.successful_referrals DESC, ba.created_at ASC
  LIMIT limit_count;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- Function: Get User's Leaderboard Position
-- Returns user's rank and surrounding context
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_leaderboard_position(app_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_rank INTEGER;
  user_referrals INTEGER;
  user_tier INTEGER;
  total_with_referrals INTEGER;
  result JSONB;
BEGIN
  -- Get user's referral count
  SELECT COALESCE(successful_referrals, 0), COALESCE(referral_tier, 0)
  INTO user_referrals, user_tier
  FROM beta_applications
  WHERE id = app_id;

  IF user_referrals IS NULL THEN
    RETURN jsonb_build_object(
      'found', false,
      'error', 'Application not found'
    );
  END IF;

  -- Calculate rank (count how many have more referrals)
  SELECT COUNT(*) + 1
  INTO user_rank
  FROM beta_applications
  WHERE successful_referrals > user_referrals
    AND status IN ('pending', 'approved', 'waitlisted');

  -- Count total with any referrals
  SELECT COUNT(*)
  INTO total_with_referrals
  FROM beta_applications
  WHERE successful_referrals > 0
    AND status IN ('pending', 'approved', 'waitlisted');

  RETURN jsonb_build_object(
    'found', true,
    'rank', user_rank,
    'referrals', user_referrals,
    'tier', user_tier,
    'tier_name', CASE user_tier
      WHEN 0 THEN 'Standard'
      WHEN 1 THEN 'Engaged'
      WHEN 2 THEN 'Connector'
      WHEN 3 THEN 'Champion'
      WHEN 4 THEN 'Legend'
      ELSE 'Standard'
    END,
    'total_participants', total_with_referrals,
    'percentile', CASE
      WHEN total_with_referrals > 0 THEN
        ROUND(((total_with_referrals - user_rank + 1)::NUMERIC / total_with_referrals) * 100)
      ELSE 0
    END
  );
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- Grant permissions
-- ═══════════════════════════════════════════════════════════════════

GRANT EXECUTE ON FUNCTION get_referral_leaderboard(INTEGER) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_leaderboard_position(UUID) TO authenticated, anon;

COMMENT ON FUNCTION get_referral_leaderboard(INTEGER) IS 'Returns top referrers for public leaderboard display';
COMMENT ON FUNCTION get_leaderboard_position(UUID) IS 'Returns a specific application''s leaderboard position and context';
