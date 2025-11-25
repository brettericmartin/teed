-- Migration 027: Add Beta Fields to Profiles
-- Extends the profiles table with beta-specific columns

-- Add beta tier column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS beta_tier text
  CHECK (beta_tier IN ('founder', 'influencer', 'standard', 'friend'));

-- Add beta approval timestamp
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS beta_approved_at timestamptz;

-- Add referral tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS invited_by_id uuid REFERENCES profiles(id);

-- Add onboarding completion tracking
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz;

-- Add last active timestamp (for retention tracking)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_active_at timestamptz;

-- Add feature flags (for gradual rollouts and A/B testing)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS feature_flags jsonb DEFAULT '{}';
-- Example feature_flags:
-- {
--   "new_ai_model": true,
--   "dark_mode": false,
--   "affiliate_v2": true
-- }

-- Indexes for beta queries
CREATE INDEX IF NOT EXISTS idx_profiles_beta_tier ON profiles(beta_tier) WHERE beta_tier IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_invited_by ON profiles(invited_by_id) WHERE invited_by_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_profiles_last_active ON profiles(last_active_at DESC) WHERE beta_tier IS NOT NULL;

-- Function to update last_active_at
CREATE OR REPLACE FUNCTION update_profile_last_active(target_user_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET last_active_at = now()
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get beta user stats
CREATE OR REPLACE FUNCTION get_beta_user_stats(target_user_id uuid)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  user_profile profiles%ROWTYPE;
  user_points beta_points%ROWTYPE;
  bags_count integer;
  items_count integer;
  feedback_count integer;
  days_since_join integer;
BEGIN
  -- Get profile
  SELECT * INTO user_profile FROM profiles WHERE id = target_user_id;

  -- Get points record
  SELECT * INTO user_points FROM beta_points WHERE user_id = target_user_id;

  -- Count bags
  SELECT COUNT(*) INTO bags_count FROM bags WHERE owner_id = target_user_id;

  -- Count items across all bags
  SELECT COUNT(*) INTO items_count
  FROM bag_items bi
  JOIN bags b ON b.id = bi.bag_id
  WHERE b.owner_id = target_user_id;

  -- Count feedback
  SELECT COUNT(*) INTO feedback_count FROM feedback WHERE user_id = target_user_id;

  -- Days since joining
  days_since_join := EXTRACT(DAY FROM now() - user_profile.created_at);

  RETURN jsonb_build_object(
    'user_id', target_user_id,
    'handle', user_profile.handle,
    'display_name', user_profile.display_name,
    'beta_tier', user_profile.beta_tier,
    'joined_at', user_profile.created_at,
    'days_since_join', days_since_join,
    'last_active_at', user_profile.last_active_at,
    'onboarding_completed', user_profile.onboarding_completed_at IS NOT NULL,
    'total_points', COALESCE(user_points.total_points, 0),
    'badges', COALESCE(user_points.badges, ARRAY[]::text[]),
    'streak_days', COALESCE(user_points.streak_days, 0),
    'max_streak', COALESCE(user_points.max_streak, 0),
    'bags_created', bags_count,
    'items_added', items_count,
    'feedback_submitted', feedback_count,
    'bugs_reported', COALESCE(user_points.bugs_reported, 0),
    'features_suggested', COALESCE(user_points.features_suggested, 0),
    'referrals_joined', COALESCE(user_points.referrals_joined, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get all beta users for admin
CREATE OR REPLACE FUNCTION get_all_beta_users()
RETURNS TABLE (
  user_id uuid,
  handle text,
  display_name text,
  email text,
  beta_tier text,
  joined_at timestamptz,
  last_active_at timestamptz,
  total_points integer,
  bags_count bigint,
  feedback_count bigint,
  health_status text
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as user_id,
    p.handle,
    p.display_name,
    au.email,
    p.beta_tier,
    p.created_at as joined_at,
    p.last_active_at,
    COALESCE(bp.total_points, 0) as total_points,
    (SELECT COUNT(*) FROM bags WHERE owner_id = p.id) as bags_count,
    (SELECT COUNT(*) FROM feedback WHERE feedback.user_id = p.id) as feedback_count,
    CASE
      WHEN p.last_active_at > now() - interval '7 days' THEN 'active'
      WHEN p.last_active_at > now() - interval '14 days' THEN 'at_risk'
      WHEN p.last_active_at > now() - interval '30 days' THEN 'churning'
      ELSE 'churned'
    END as health_status
  FROM profiles p
  LEFT JOIN auth.users au ON au.id = p.id
  LEFT JOIN beta_points bp ON bp.user_id = p.id
  WHERE p.beta_tier IS NOT NULL
  ORDER BY p.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment
COMMENT ON COLUMN profiles.beta_tier IS 'Beta access tier: founder, influencer, standard, or friend';
COMMENT ON COLUMN profiles.feature_flags IS 'JSON object for feature flags and A/B testing';

-- Trigger to auto-create beta_points record when profile gets beta_tier
CREATE OR REPLACE FUNCTION create_beta_points_for_profile()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create if user has beta_tier set
  IF NEW.beta_tier IS NOT NULL THEN
    INSERT INTO beta_points (user_id, total_points, badges)
    VALUES (
      NEW.id,
      50,  -- Starting bonus for joining beta
      CASE
        WHEN NEW.beta_tier = 'founder' THEN ARRAY['founding_member']
        ELSE ARRAY[]::text[]
      END
    )
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if exists then create
DROP TRIGGER IF EXISTS create_beta_points_on_profile ON profiles;
CREATE TRIGGER create_beta_points_on_profile
  AFTER INSERT OR UPDATE OF beta_tier ON profiles
  FOR EACH ROW
  WHEN (NEW.beta_tier IS NOT NULL)
  EXECUTE FUNCTION create_beta_points_for_profile();
