-- Migration 059: Referral Tiers and Demand Mechanics
-- Adds referral tier system, approval odds, deadline support, and reciprocal rewards

-- ============================================
-- PART 1: Schema Additions
-- ============================================

-- Add deadline field to beta_settings
INSERT INTO beta_settings (key, value, description)
VALUES (
  'founding_cohort_deadline',
  to_jsonb(now() + interval '30 days'),
  'Deadline for founding cohort applications'
)
ON CONFLICT (key) DO NOTHING;

-- Add referral tier settings
INSERT INTO beta_settings (key, value, description)
VALUES (
  'referral_tiers',
  '{
    "tier_1": {"referrals": 1, "position_boost": 10, "name": "Engaged"},
    "tier_2": {"referrals": 3, "position_boost": 30, "name": "Connector"},
    "tier_3": {"referrals": 5, "instant_approval": true, "name": "Champion"},
    "tier_4": {"referrals": 10, "extra_invites": 5, "name": "Legend"}
  }'::jsonb,
  'Referral tier rewards and thresholds'
)
ON CONFLICT (key) DO NOTHING;

-- Add referee priority bonus setting
INSERT INTO beta_settings (key, value, description)
VALUES (
  'referee_priority_bonus',
  '5'::jsonb,
  'Priority score bonus for referred applicants'
)
ON CONFLICT (key) DO NOTHING;

-- Add columns to beta_applications for referral tracking
ALTER TABLE beta_applications
  ADD COLUMN IF NOT EXISTS successful_referrals INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS referral_tier INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS approval_odds_percent INTEGER,
  ADD COLUMN IF NOT EXISTS referred_by_application_id UUID REFERENCES beta_applications(id),
  ADD COLUMN IF NOT EXISTS auto_approved BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS auto_approval_reason TEXT;

-- Index for referral tracking
CREATE INDEX IF NOT EXISTS idx_beta_applications_referred_by_app
  ON beta_applications(referred_by_application_id) WHERE referred_by_application_id IS NOT NULL;

-- ============================================
-- PART 2: Referral Tracking Functions
-- ============================================

-- Count successful referrals for an application
CREATE OR REPLACE FUNCTION count_successful_referrals(app_id UUID)
RETURNS INTEGER AS $$
DECLARE
  ref_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO ref_count
  FROM beta_applications
  WHERE referred_by_application_id = app_id
    AND status IN ('pending', 'approved', 'waitlisted');

  RETURN COALESCE(ref_count, 0);
END;
$$ LANGUAGE plpgsql;

-- Calculate referral tier from successful referrals
CREATE OR REPLACE FUNCTION calculate_referral_tier(successful_refs INTEGER)
RETURNS INTEGER AS $$
BEGIN
  IF successful_refs >= 10 THEN
    RETURN 4; -- Legend
  ELSIF successful_refs >= 5 THEN
    RETURN 3; -- Champion
  ELSIF successful_refs >= 3 THEN
    RETURN 2; -- Connector
  ELSIF successful_refs >= 1 THEN
    RETURN 1; -- Engaged
  ELSE
    RETURN 0; -- No tier
  END IF;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Get referral tier info
CREATE OR REPLACE FUNCTION get_referral_tier_info(tier INTEGER)
RETURNS JSONB AS $$
BEGIN
  RETURN CASE tier
    WHEN 4 THEN jsonb_build_object(
      'tier', 4,
      'name', 'Legend',
      'badge_color', 'gold',
      'benefits', ARRAY['Lifetime premium features', 'Extra invites when approved', 'Beta council access']
    )
    WHEN 3 THEN jsonb_build_object(
      'tier', 3,
      'name', 'Champion',
      'badge_color', 'purple',
      'benefits', ARRAY['Instant approval (no review)', 'Founding Member badge', 'Priority support']
    )
    WHEN 2 THEN jsonb_build_object(
      'tier', 2,
      'name', 'Connector',
      'badge_color', 'blue',
      'benefits', ARRAY['+30 position boost', 'Connector badge', 'Early feature access']
    )
    WHEN 1 THEN jsonb_build_object(
      'tier', 1,
      'name', 'Engaged',
      'badge_color', 'green',
      'benefits', ARRAY['+10 position boost', 'Priority in review queue']
    )
    ELSE jsonb_build_object(
      'tier', 0,
      'name', 'Standard',
      'badge_color', 'gray',
      'benefits', ARRAY['Standard review process']
    )
  END;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- PART 3: Approval Odds Calculation
-- ============================================

-- Calculate approval odds as a percentage
CREATE OR REPLACE FUNCTION calculate_approval_odds(app_row beta_applications)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER;
  max_possible_score INTEGER := 110; -- Max from all scoring criteria
  percentile NUMERIC;
  total_pending INTEGER;
  better_than INTEGER;
  capacity JSONB;
  available_slots INTEGER;
  odds INTEGER;
BEGIN
  score := COALESCE(app_row.priority_score, 0);

  -- Add referral tier bonus to effective score
  score := score + (COALESCE(app_row.referral_tier, 0) * 10);

  -- Get capacity info
  capacity := get_beta_capacity();
  available_slots := GREATEST((capacity->>'available')::INTEGER, 1);

  -- Count pending applications with lower scores
  SELECT COUNT(*) INTO total_pending
  FROM beta_applications WHERE status = 'pending';

  SELECT COUNT(*) INTO better_than
  FROM beta_applications
  WHERE status = 'pending'
    AND COALESCE(priority_score, 0) < score;

  IF total_pending > 0 THEN
    -- Percentile-based odds, weighted by available slots
    percentile := (better_than::NUMERIC / total_pending) * 100;

    -- Adjust for capacity scarcity
    IF total_pending <= available_slots THEN
      -- Everyone who applies has high odds
      odds := LEAST(90 + (percentile * 0.1)::INTEGER, 99);
    ELSE
      -- Competition mode: top percentile gets best odds
      odds := LEAST(GREATEST((percentile * 0.95)::INTEGER, 5), 95);
    END IF;
  ELSE
    -- First applicant
    odds := 95;
  END IF;

  -- Champion tier (5+ referrals) = 100% (instant approval)
  IF app_row.referral_tier >= 3 THEN
    odds := 100;
  END IF;

  RETURN odds;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 4: Enhanced Priority Scoring with Referral Bonus
-- ============================================

-- Updated priority score calculation with reciprocal referral bonus
CREATE OR REPLACE FUNCTION calculate_application_priority(app_row beta_applications)
RETURNS INTEGER AS $$
DECLARE
  score INTEGER := 0;
  survey JSONB;
  referee_bonus INTEGER := 5;
BEGIN
  survey := COALESCE(app_row.survey_responses, '{}'::jsonb);

  -- Audience size scoring (up to 40 points)
  score := score + CASE COALESCE(survey->>'audience_size', app_row.follower_range)
    WHEN '50k+' THEN 40
    WHEN '100k+' THEN 40
    WHEN '10k-50k' THEN 30
    WHEN '10k-100k' THEN 30
    WHEN '1k-10k' THEN 20
    WHEN '1K-10K' THEN 20
    WHEN 'under_1k' THEN 10
    WHEN '0-1k' THEN 10
    ELSE 5
  END;

  -- Affiliate status scoring (up to 25 points)
  score := score + CASE survey->>'affiliate_status'
    WHEN 'actively' THEN 25
    WHEN 'sometimes' THEN 15
    WHEN 'want_to_start' THEN 10
    ELSE 0
  END;

  -- Creator type scoring (up to 20 points)
  score := score + CASE survey->>'creator_type'
    WHEN 'professional_creator' THEN 20
    WHEN 'brand_ambassador' THEN 15
    WHEN 'serious_hobbyist' THEN 10
    WHEN 'building_audience' THEN 5
    ELSE 0
  END;

  -- Usage intent (up to 15 points)
  score := score + CASE survey->>'usage_intent'
    WHEN 'immediately' THEN 15
    WHEN 'this_week' THEN 10
    WHEN 'explore_first' THEN 5
    ELSE 0
  END;

  -- Referral bonus (came via invite code) - 10 points
  IF app_row.referred_by_code IS NOT NULL THEN
    score := score + 10;
  END IF;

  -- Reciprocal referee bonus (referred by another applicant) - 5 points
  IF app_row.referred_by_application_id IS NOT NULL THEN
    SELECT COALESCE((value)::INTEGER, 5) INTO referee_bonus
    FROM beta_settings WHERE key = 'referee_priority_bonus';
    score := score + referee_bonus;
  END IF;

  -- Early application bonus (first 100)
  IF app_row.waitlist_position IS NOT NULL AND app_row.waitlist_position <= 100 THEN
    score := score + GREATEST(10 - (app_row.waitlist_position / 10), 0);
  END IF;

  -- Referral tier bonus (rewarding referrers)
  score := score + (COALESCE(app_row.referral_tier, 0) * 5);

  RETURN score;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- ============================================
-- PART 5: Auto-Approval for Champion Tier
-- ============================================

-- Check and process auto-approval for referral champions
CREATE OR REPLACE FUNCTION check_referral_auto_approval(app_id UUID)
RETURNS JSONB AS $$
DECLARE
  app_record beta_applications%ROWTYPE;
  successful_refs INTEGER;
  tier INTEGER;
  can_approve BOOLEAN;
  approval_result JSONB;
BEGIN
  SELECT * INTO app_record FROM beta_applications WHERE id = app_id;

  IF app_record IS NULL THEN
    RETURN jsonb_build_object('auto_approved', FALSE, 'reason', 'Application not found');
  END IF;

  IF app_record.status != 'pending' THEN
    RETURN jsonb_build_object('auto_approved', FALSE, 'reason', 'Application not pending');
  END IF;

  -- Count successful referrals
  successful_refs := count_successful_referrals(app_id);
  tier := calculate_referral_tier(successful_refs);

  -- Update the application's referral stats
  UPDATE beta_applications
  SET successful_referrals = successful_refs,
      referral_tier = tier
  WHERE id = app_id;

  -- Check if Champion tier (5+ referrals)
  IF tier >= 3 THEN
    -- Check capacity
    can_approve := can_accept_beta_user();

    IF NOT can_approve THEN
      RETURN jsonb_build_object(
        'auto_approved', FALSE,
        'reason', 'Champion tier reached but beta is at capacity',
        'tier', tier,
        'successful_referrals', successful_refs
      );
    END IF;

    -- Auto-approve!
    UPDATE beta_applications
    SET status = 'approved',
        reviewed_at = NOW(),
        reviewed_by = 'system:referral_champion',
        auto_approved = TRUE,
        auto_approval_reason = 'Reached Champion tier with ' || successful_refs || ' successful referrals'
    WHERE id = app_id;

    -- Generate invite code
    approval_result := approve_beta_application(app_id, NULL, 'founder');

    RETURN jsonb_build_object(
      'auto_approved', TRUE,
      'reason', 'Champion tier reached - instant approval',
      'tier', tier,
      'successful_referrals', successful_refs,
      'approval_result', approval_result
    );
  END IF;

  RETURN jsonb_build_object(
    'auto_approved', FALSE,
    'reason', 'Not yet at Champion tier',
    'tier', tier,
    'successful_referrals', successful_refs,
    'referrals_until_champion', 5 - successful_refs
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- PART 6: Trigger to Update Referrer on New Application
-- ============================================

-- When a new application comes in with a referral, update the referrer's stats
CREATE OR REPLACE FUNCTION handle_new_referral()
RETURNS TRIGGER AS $$
DECLARE
  referrer_app_id UUID;
  auto_approve_result JSONB;
BEGIN
  -- If this application was referred by another application
  IF NEW.referred_by_application_id IS NOT NULL THEN
    referrer_app_id := NEW.referred_by_application_id;

    -- Update referrer's stats
    UPDATE beta_applications
    SET successful_referrals = count_successful_referrals(referrer_app_id),
        referral_tier = calculate_referral_tier(count_successful_referrals(referrer_app_id))
    WHERE id = referrer_app_id;

    -- Check if referrer should be auto-approved
    auto_approve_result := check_referral_auto_approval(referrer_app_id);

    -- Log if auto-approved
    IF (auto_approve_result->>'auto_approved')::BOOLEAN THEN
      RAISE NOTICE 'Referrer % auto-approved via Champion tier', referrer_app_id;
    END IF;
  END IF;

  -- Calculate this application's odds
  NEW.approval_odds_percent := calculate_approval_odds(NEW);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS on_new_referral ON beta_applications;
CREATE TRIGGER on_new_referral
  AFTER INSERT ON beta_applications
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_referral();

-- ============================================
-- PART 7: API Helper Functions
-- ============================================

-- Get comprehensive referral stats for an application
CREATE OR REPLACE FUNCTION get_referral_stats(app_id UUID)
RETURNS JSONB AS $$
DECLARE
  app_record beta_applications%ROWTYPE;
  successful_refs INTEGER;
  tier INTEGER;
  tier_info JSONB;
  next_tier_info JSONB;
  refs_until_next INTEGER;
BEGIN
  SELECT * INTO app_record FROM beta_applications WHERE id = app_id;

  IF app_record IS NULL THEN
    RETURN jsonb_build_object('error', 'Application not found');
  END IF;

  successful_refs := count_successful_referrals(app_id);
  tier := calculate_referral_tier(successful_refs);
  tier_info := get_referral_tier_info(tier);

  -- Calculate referrals until next tier
  refs_until_next := CASE tier
    WHEN 0 THEN 1 - successful_refs
    WHEN 1 THEN 3 - successful_refs
    WHEN 2 THEN 5 - successful_refs
    WHEN 3 THEN 10 - successful_refs
    ELSE 0
  END;

  IF tier < 4 THEN
    next_tier_info := get_referral_tier_info(tier + 1);
  ELSE
    next_tier_info := NULL;
  END IF;

  RETURN jsonb_build_object(
    'application_id', app_id,
    'successful_referrals', successful_refs,
    'current_tier', tier_info,
    'next_tier', next_tier_info,
    'referrals_until_next_tier', GREATEST(refs_until_next, 0),
    'referrals_until_instant_approval', GREATEST(5 - successful_refs, 0),
    'has_instant_approval', tier >= 3,
    'referral_link', '/apply?ref=' || app_id::TEXT
  );
END;
$$ LANGUAGE plpgsql;

-- Get approval path suggestions
CREATE OR REPLACE FUNCTION get_approval_path(app_id UUID)
RETURNS JSONB AS $$
DECLARE
  app_record beta_applications%ROWTYPE;
  current_odds INTEGER;
  suggestions JSONB[];
  survey JSONB;
  refs INTEGER;
BEGIN
  SELECT * INTO app_record FROM beta_applications WHERE id = app_id;

  IF app_record IS NULL THEN
    RETURN jsonb_build_object('error', 'Application not found');
  END IF;

  current_odds := calculate_approval_odds(app_record);
  survey := COALESCE(app_record.survey_responses, '{}'::jsonb);
  refs := count_successful_referrals(app_id);

  suggestions := ARRAY[]::JSONB[];

  -- Suggest referrals if not at Champion tier
  IF refs < 5 THEN
    suggestions := array_append(suggestions, jsonb_build_object(
      'action', 'Refer ' || (5 - refs) || ' friends',
      'impact', 'Instant approval (skip review)',
      'priority', 1,
      'icon', 'users'
    ));
  END IF;

  IF refs < 1 THEN
    suggestions := array_append(suggestions, jsonb_build_object(
      'action', 'Refer 1 friend',
      'impact', '+10 position boost',
      'priority', 2,
      'icon', 'user-plus'
    ));
  END IF;

  RETURN jsonb_build_object(
    'application_id', app_id,
    'current_odds', current_odds,
    'current_score', app_record.priority_score,
    'suggestions', to_jsonb(suggestions)
  );
END;
$$ LANGUAGE plpgsql;

-- Get deadline info
CREATE OR REPLACE FUNCTION get_beta_deadline()
RETURNS JSONB AS $$
DECLARE
  deadline TIMESTAMPTZ;
  now_ts TIMESTAMPTZ := NOW();
  days_remaining INTEGER;
  hours_remaining INTEGER;
  is_urgent BOOLEAN;
BEGIN
  -- Value is stored as jsonb, need to extract text and cast
  SELECT (value #>> '{}')::TIMESTAMPTZ INTO deadline
  FROM beta_settings WHERE key = 'founding_cohort_deadline';

  IF deadline IS NULL THEN
    RETURN jsonb_build_object('has_deadline', FALSE);
  END IF;

  days_remaining := EXTRACT(DAY FROM (deadline - now_ts))::INTEGER;
  hours_remaining := EXTRACT(EPOCH FROM (deadline - now_ts))::INTEGER / 3600;
  is_urgent := days_remaining <= 3;

  RETURN jsonb_build_object(
    'has_deadline', TRUE,
    'deadline', deadline,
    'days_remaining', GREATEST(days_remaining, 0),
    'hours_remaining', GREATEST(hours_remaining, 0),
    'is_expired', deadline < now_ts,
    'is_urgent', is_urgent,
    'message', CASE
      WHEN deadline < now_ts THEN 'Founding cohort has closed'
      WHEN days_remaining = 0 THEN 'Final hours to apply!'
      WHEN days_remaining = 1 THEN '1 day left to apply'
      WHEN days_remaining <= 3 THEN days_remaining || ' days left'
      WHEN days_remaining <= 7 THEN 'Closes this week'
      ELSE 'Founding cohort open'
    END
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 8: Recent Approvals for Social Proof
-- ============================================

-- Get recent approvals for social proof feed
CREATE OR REPLACE FUNCTION get_recent_approvals(limit_count INTEGER DEFAULT 5)
RETURNS JSONB AS $$
DECLARE
  approvals JSONB[];
  approval_record RECORD;
BEGIN
  approvals := ARRAY[]::JSONB[];

  FOR approval_record IN
    SELECT
      ba.id,
      ba.name,
      ba.survey_responses,
      ba.reviewed_at as approved_at
    FROM beta_applications ba
    WHERE ba.status = 'approved'
      AND ba.reviewed_at IS NOT NULL
    ORDER BY ba.reviewed_at DESC
    LIMIT limit_count
  LOOP
    approvals := array_append(approvals, jsonb_build_object(
      'first_name', split_part(COALESCE(approval_record.name, 'Anonymous'), ' ', 1),
      'creator_type', COALESCE(approval_record.survey_responses->>'creator_type', 'creator'),
      'niche', COALESCE(approval_record.survey_responses->>'primary_niche', 'general'),
      'audience_size', COALESCE(approval_record.survey_responses->>'audience_size', 'unknown'),
      'approved_at', approval_record.approved_at
    ));
  END LOOP;

  RETURN jsonb_build_object(
    'approvals', to_jsonb(approvals),
    'count', array_length(approvals, 1)
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- PART 9: Update Existing Applications
-- ============================================

-- Backfill referral stats for existing applications
DO $$
DECLARE
  app_record RECORD;
BEGIN
  FOR app_record IN SELECT id FROM beta_applications WHERE status = 'pending'
  LOOP
    UPDATE beta_applications
    SET
      successful_referrals = count_successful_referrals(app_record.id),
      referral_tier = calculate_referral_tier(count_successful_referrals(app_record.id))
    WHERE id = app_record.id;
  END LOOP;
END $$;

-- Recalculate all approval odds
UPDATE beta_applications
SET approval_odds_percent = calculate_approval_odds(beta_applications.*)
WHERE status = 'pending';

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON FUNCTION count_successful_referrals(UUID) IS 'Counts successful referrals (pending/approved/waitlisted) for an application';
COMMENT ON FUNCTION calculate_referral_tier(INTEGER) IS 'Returns referral tier (0-4) based on successful referral count';
COMMENT ON FUNCTION get_referral_tier_info(INTEGER) IS 'Returns tier name, badge color, and benefits for display';
COMMENT ON FUNCTION calculate_approval_odds(beta_applications) IS 'Calculates approval odds as a percentage (0-100)';
COMMENT ON FUNCTION check_referral_auto_approval(UUID) IS 'Checks if application should be auto-approved via Champion tier';
COMMENT ON FUNCTION get_referral_stats(UUID) IS 'Returns comprehensive referral stats for an application';
COMMENT ON FUNCTION get_approval_path(UUID) IS 'Returns suggestions for improving approval odds';
COMMENT ON FUNCTION get_beta_deadline() IS 'Returns founding cohort deadline info';
COMMENT ON FUNCTION get_recent_approvals(INTEGER) IS 'Returns recent approvals for social proof feed';
