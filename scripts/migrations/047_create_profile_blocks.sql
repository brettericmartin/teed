-- Migration: Create profile_blocks table for modular profile builder
-- This enables block-based profile customization (header, bio, embeds, destinations, etc.)

-- Create profile_blocks table
CREATE TABLE IF NOT EXISTS profile_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Block identity and type
  block_type text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,

  -- Block configuration (type-specific data stored as JSONB)
  config jsonb NOT NULL DEFAULT '{}',

  -- Timestamps
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),

  -- Constraint: valid block types
  CONSTRAINT valid_block_type CHECK (
    block_type IN (
      'header',           -- Avatar, name, banner display
      'bio',              -- Bio text block
      'social_links',     -- Social platform links
      'embed',            -- YouTube, Spotify, TikTok, Twitter, Instagram, Twitch
      'destinations',     -- Explained outbound links
      'featured_bags',    -- Pinned/featured bags showcase
      'custom_text',      -- Heading or paragraph text
      'spacer',           -- Vertical spacing
      'divider'           -- Horizontal line divider
    )
  )
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_profile_blocks_profile_id
  ON profile_blocks(profile_id);

CREATE INDEX IF NOT EXISTS idx_profile_blocks_sort_order
  ON profile_blocks(profile_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_profile_blocks_type
  ON profile_blocks(block_type);

-- Enable Row Level Security
ALTER TABLE profile_blocks ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Users can view their own blocks
CREATE POLICY "Users can view own profile blocks"
  ON profile_blocks
  FOR SELECT
  USING (profile_id = auth.uid());

-- Anyone can view blocks for public profiles (visible blocks only)
CREATE POLICY "Anyone can view visible blocks for public profiles"
  ON profile_blocks
  FOR SELECT
  USING (
    is_visible = true
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = profile_blocks.profile_id
    )
  );

-- Users can insert their own blocks
CREATE POLICY "Users can insert own profile blocks"
  ON profile_blocks
  FOR INSERT
  WITH CHECK (profile_id = auth.uid());

-- Users can update their own blocks
CREATE POLICY "Users can update own profile blocks"
  ON profile_blocks
  FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());

-- Users can delete their own blocks
CREATE POLICY "Users can delete own profile blocks"
  ON profile_blocks
  FOR DELETE
  USING (profile_id = auth.uid());

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_profile_blocks_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger for auto-updating updated_at
DROP TRIGGER IF EXISTS trigger_profile_blocks_updated_at ON profile_blocks;
CREATE TRIGGER trigger_profile_blocks_updated_at
  BEFORE UPDATE ON profile_blocks
  FOR EACH ROW
  EXECUTE FUNCTION update_profile_blocks_updated_at();

-- Comment on table
COMMENT ON TABLE profile_blocks IS 'Modular blocks for profile/dashboard customization';
COMMENT ON COLUMN profile_blocks.block_type IS 'Type of block: header, bio, social_links, embed, destinations, featured_bags, custom_text, spacer, divider';
COMMENT ON COLUMN profile_blocks.config IS 'Type-specific configuration as JSONB. Structure varies by block_type.';
