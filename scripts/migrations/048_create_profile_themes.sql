-- Migration: Create profile_themes table for per-profile theming
-- Enables color and background customization (no font customization yet)

-- Create profile_themes table (one theme per profile)
CREATE TABLE IF NOT EXISTS profile_themes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,

  -- Color customization
  primary_color text NOT NULL DEFAULT '#7A9770',      -- Teed Green default
  accent_color text NOT NULL DEFAULT '#CFE3E8',       -- Sky blue accent
  background_color text NOT NULL DEFAULT '#F9F5EE',   -- Soft off-white
  text_color text NOT NULL DEFAULT '#1F3A2E',         -- Deep evergreen

  -- Background customization
  background_type text NOT NULL DEFAULT 'solid',
  background_gradient_start text,
  background_gradient_end text,
  background_gradient_direction text DEFAULT 'to-bottom', -- 'to-bottom', 'to-right', 'to-br'
  background_image_url text,

  -- Card styling
  card_style text NOT NULL DEFAULT 'elevated',
  border_radius text NOT NULL DEFAULT 'xl',

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Constraints
  CONSTRAINT valid_background_type CHECK (
    background_type IN ('solid', 'gradient', 'image')
  ),
  CONSTRAINT valid_card_style CHECK (
    card_style IN ('elevated', 'flat', 'outlined')
  ),
  CONSTRAINT valid_border_radius CHECK (
    border_radius IN ('none', 'sm', 'md', 'lg', 'xl', '2xl', 'full')
  ),
  CONSTRAINT valid_gradient_direction CHECK (
    background_gradient_direction IN ('to-bottom', 'to-top', 'to-right', 'to-left', 'to-br', 'to-bl', 'to-tr', 'to-tl')
  )
);

-- Index for efficient lookups by profile
CREATE INDEX IF NOT EXISTS idx_profile_themes_profile_id
  ON profile_themes(profile_id);

-- Enable Row Level Security
ALTER TABLE profile_themes ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own theme
CREATE POLICY "Users can view own profile theme"
  ON profile_themes
  FOR SELECT
  USING (profile_id = auth.uid());

-- Anyone can view themes for public profiles (for rendering themed public views)
CREATE POLICY "Anyone can view themes for public profiles"
  ON profile_themes
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_themes.profile_id
    )
  );

-- Users can insert their own theme
CREATE POLICY "Users can insert own profile theme"
  ON profile_themes
  FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- Users can update their own theme
CREATE POLICY "Users can update own profile theme"
  ON profile_themes
  FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Users can delete their own theme
CREATE POLICY "Users can delete own profile theme"
  ON profile_themes
  FOR DELETE
  USING (profile_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_profile_themes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS trigger_profile_themes_updated_at ON profile_themes;
CREATE TRIGGER trigger_profile_themes_updated_at
  BEFORE UPDATE ON profile_themes
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_themes_updated_at();

-- Comments
COMMENT ON TABLE profile_themes IS 'Per-profile theming configuration (colors, backgrounds, card styles)';
COMMENT ON COLUMN profile_themes.primary_color IS 'Primary brand color for buttons, links, accents';
COMMENT ON COLUMN profile_themes.accent_color IS 'Secondary highlight color';
COMMENT ON COLUMN profile_themes.background_type IS 'Type of background: solid, gradient, or image';
COMMENT ON COLUMN profile_themes.card_style IS 'Card appearance: elevated (shadows), flat (no shadows), outlined (borders)';
COMMENT ON COLUMN profile_themes.border_radius IS 'Border radius size for cards and buttons';
