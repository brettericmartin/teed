-- ═══════════════════════════════════════════════════════════
-- Migration 012: Create creator_settings table
-- Enables Pro features and per-user affiliate configuration
-- ═══════════════════════════════════════════════════════════

-- Create creator_settings table
CREATE TABLE IF NOT EXISTS creator_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid REFERENCES profiles(id) ON DELETE CASCADE UNIQUE NOT NULL,

  -- Feature flags
  is_pro boolean DEFAULT false NOT NULL,
  affiliate_enabled boolean DEFAULT false NOT NULL,

  -- Affiliate configuration
  amazon_associate_tag text,

  -- FTC Compliance & Privacy (Critical Addition)
  custom_disclosure_text text,
  show_disclosure boolean DEFAULT true NOT NULL,
  allow_link_tracking boolean DEFAULT true NOT NULL,

  -- Limits
  max_bags integer DEFAULT 10 NOT NULL,

  -- Customization
  custom_domain text,
  theme_preset text DEFAULT 'default',

  -- Timestamps
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- Constraints
  CHECK (max_bags > 0)
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_creator_settings_profile ON creator_settings(profile_id);
CREATE INDEX IF NOT EXISTS idx_creator_settings_pro ON creator_settings(is_pro) WHERE is_pro = true;
CREATE INDEX IF NOT EXISTS idx_creator_settings_affiliate ON creator_settings(affiliate_enabled) WHERE affiliate_enabled = true;

-- Enable RLS
ALTER TABLE creator_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own creator settings" ON creator_settings;
DROP POLICY IF EXISTS "Users can update own creator settings" ON creator_settings;
DROP POLICY IF EXISTS "Users can insert own creator settings" ON creator_settings;

-- RLS Policy: Users can view their own settings
CREATE POLICY "Users can view own creator settings"
  ON creator_settings FOR SELECT
  USING (auth.uid() = profile_id);

-- RLS Policy: Users can update their own settings
CREATE POLICY "Users can update own creator settings"
  ON creator_settings FOR UPDATE
  USING (auth.uid() = profile_id);

-- RLS Policy: Users can insert their own settings
CREATE POLICY "Users can insert own creator settings"
  ON creator_settings FOR INSERT
  WITH CHECK (auth.uid() = profile_id);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_creator_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_creator_settings_updated_at ON creator_settings;
CREATE TRIGGER trigger_update_creator_settings_updated_at
  BEFORE UPDATE ON creator_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_creator_settings_updated_at();

-- Auto-create default settings when profile is created
CREATE OR REPLACE FUNCTION auto_create_creator_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO creator_settings (profile_id)
  VALUES (NEW.id)
  ON CONFLICT (profile_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_create_creator_settings ON profiles;
CREATE TRIGGER trigger_auto_create_creator_settings
  AFTER INSERT ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION auto_create_creator_settings();

-- Backfill creator_settings for existing profiles
INSERT INTO creator_settings (profile_id)
SELECT id FROM profiles
ON CONFLICT (profile_id) DO NOTHING;

-- ═══════════════════════════════════════════════════════════
-- Migration 012 Complete
-- ═══════════════════════════════════════════════════════════

SELECT 'Migration 012: creator_settings table created successfully! ✅' AS status;
