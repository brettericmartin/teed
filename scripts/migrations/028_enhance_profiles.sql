-- Migration 028: Enhance Profiles for Public Pages
-- Adds social links, banner image, and profile stats

-- Add banner/cover image
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS banner_url text;

-- Add social media links (stored as JSONB for flexibility)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS social_links jsonb DEFAULT '{}';
-- Example social_links structure:
-- {
--   "instagram": "username",
--   "twitter": "handle",
--   "youtube": "channel_url",
--   "tiktok": "username",
--   "website": "https://example.com",
--   "twitch": "username"
-- }

-- Add profile stats cache (updated periodically)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_views integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_bags integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_followers integer DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stats_updated_at timestamptz;

-- Add verification/badge system
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS badges jsonb DEFAULT '[]';
-- Example badges: ["creator", "early_adopter", "verified", "top_contributor"]

-- Indexes for queries
CREATE INDEX IF NOT EXISTS idx_profiles_verified ON profiles(is_verified) WHERE is_verified = true;
CREATE INDEX IF NOT EXISTS idx_profiles_total_views ON profiles(total_views DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_total_followers ON profiles(total_followers DESC);

-- Function to update profile stats
CREATE OR REPLACE FUNCTION update_profile_stats(target_user_id uuid)
RETURNS void AS $$
DECLARE
  bag_count integer;
  view_count integer;
  follower_count integer;
BEGIN
  -- Count bags
  SELECT COUNT(*) INTO bag_count
  FROM bags
  WHERE owner_id = target_user_id;

  -- Count total views across all bags
  SELECT COALESCE(SUM(views_count), 0)::integer INTO view_count
  FROM (
    SELECT COUNT(*) as views_count
    FROM user_activity
    WHERE event_type = 'bag_viewed'
      AND (event_data->>'owner_id')::uuid = target_user_id
    GROUP BY event_data->>'bag_id'
  ) bag_views;

  -- Count followers
  SELECT COUNT(*) INTO follower_count
  FROM follows
  WHERE followed_id = target_user_id;

  -- Update profile
  UPDATE profiles
  SET
    total_bags = bag_count,
    total_views = view_count,
    total_followers = follower_count,
    stats_updated_at = now()
  WHERE id = target_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get enhanced profile data
CREATE OR REPLACE FUNCTION get_profile_with_stats(profile_handle text)
RETURNS jsonb AS $$
DECLARE
  result jsonb;
  profile_data profiles%ROWTYPE;
  public_bags_count integer;
  recent_bags jsonb;
BEGIN
  -- Get profile
  SELECT * INTO profile_data
  FROM profiles
  WHERE handle = profile_handle;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Profile not found');
  END IF;

  -- Count public bags
  SELECT COUNT(*) INTO public_bags_count
  FROM bags
  WHERE owner_id = profile_data.id AND is_public = true;

  -- Get 3 most recent public bags
  SELECT jsonb_agg(
    jsonb_build_object(
      'id', id,
      'code', code,
      'title', title,
      'description', description,
      'created_at', created_at,
      'item_count', (SELECT COUNT(*) FROM bag_items WHERE bag_id = bags.id)
    )
  ) INTO recent_bags
  FROM (
    SELECT * FROM bags
    WHERE owner_id = profile_data.id AND is_public = true
    ORDER BY created_at DESC
    LIMIT 3
  ) recent;

  RETURN jsonb_build_object(
    'id', profile_data.id,
    'handle', profile_data.handle,
    'display_name', profile_data.display_name,
    'bio', profile_data.bio,
    'avatar_url', profile_data.avatar_url,
    'banner_url', profile_data.banner_url,
    'social_links', profile_data.social_links,
    'is_verified', profile_data.is_verified,
    'badges', profile_data.badges,
    'stats', jsonb_build_object(
      'total_bags', profile_data.total_bags,
      'public_bags', public_bags_count,
      'total_views', profile_data.total_views,
      'total_followers', profile_data.total_followers,
      'member_since', profile_data.created_at
    ),
    'recent_bags', COALESCE(recent_bags, '[]'::jsonb)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add validation constraints
ALTER TABLE profiles ADD CONSTRAINT banner_url_format CHECK (
  banner_url IS NULL OR banner_url ~ '^https?://'
);

ALTER TABLE profiles ADD CONSTRAINT social_links_is_object CHECK (
  jsonb_typeof(social_links) = 'object'
);

ALTER TABLE profiles ADD CONSTRAINT badges_is_array CHECK (
  jsonb_typeof(badges) = 'array'
);

-- Comments
COMMENT ON COLUMN profiles.banner_url IS 'URL to banner/cover image for profile page';
COMMENT ON COLUMN profiles.social_links IS 'Social media links as JSON object (instagram, twitter, youtube, etc.)';
COMMENT ON COLUMN profiles.total_views IS 'Cached total views across all bags';
COMMENT ON COLUMN profiles.total_bags IS 'Cached total number of bags created';
COMMENT ON COLUMN profiles.total_followers IS 'Cached follower count';
COMMENT ON COLUMN profiles.is_verified IS 'Verified creator/influencer badge';
COMMENT ON COLUMN profiles.badges IS 'Array of badge identifiers (creator, early_adopter, etc.)';
