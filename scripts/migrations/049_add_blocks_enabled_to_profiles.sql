-- Migration: Add blocks_enabled flag to profiles table
-- This enables gradual migration from legacy profile to block-based profile

-- Add blocks_enabled column (defaults to false for existing profiles)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS blocks_enabled boolean NOT NULL DEFAULT false;

-- Comment on the new column
COMMENT ON COLUMN profiles.blocks_enabled IS 'When true, profile renders using profile_blocks system instead of legacy fields';

-- Index for efficient filtering (helpful for admin queries)
CREATE INDEX IF NOT EXISTS idx_profiles_blocks_enabled
  ON profiles(blocks_enabled)
  WHERE blocks_enabled = true;
