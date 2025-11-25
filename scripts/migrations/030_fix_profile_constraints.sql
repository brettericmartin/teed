-- Migration 030: Fix Missing Profile Constraints
-- This migration adds the missing constraints that were defined but never applied

-- First, fix the invalid handles (replace hyphens with underscores)
UPDATE profiles
SET handle = REPLACE(handle, '-', '_')
WHERE handle ~ '-';

-- Now add the missing constraints
-- Note: These were in the original migration but never actually applied

-- 1. Handle length constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'handle_length' AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT handle_length
    CHECK (char_length(handle) >= 3 AND char_length(handle) <= 30);
    RAISE NOTICE 'Added handle_length constraint';
  ELSE
    RAISE NOTICE 'handle_length constraint already exists';
  END IF;
END $$;

-- 2. Handle format constraint (lowercase alphanumeric + underscore only)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'handle_format' AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT handle_format
    CHECK (handle ~ '^[a-z0-9_]+$');
    RAISE NOTICE 'Added handle_format constraint';
  ELSE
    RAISE NOTICE 'handle_format constraint already exists';
  END IF;
END $$;

-- 3. Display name length constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'display_name_length' AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT display_name_length
    CHECK (char_length(display_name) >= 1 AND char_length(display_name) <= 50);
    RAISE NOTICE 'Added display_name_length constraint';
  ELSE
    RAISE NOTICE 'display_name_length constraint already exists';
  END IF;
END $$;

-- 4. Bio length constraint
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bio_length' AND conrelid = 'profiles'::regclass
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT bio_length
    CHECK (bio IS NULL OR char_length(bio) <= 500);
    RAISE NOTICE 'Added bio_length constraint';
  ELSE
    RAISE NOTICE 'bio_length constraint already exists';
  END IF;
END $$;

-- Verify all constraints are in place
SELECT
  CASE
    WHEN COUNT(*) = 4 THEN '✅ All handle and profile constraints are now in place'
    ELSE '❌ Some constraints are still missing'
  END as status,
  COUNT(*) as constraint_count
FROM pg_constraint
WHERE conrelid = 'profiles'::regclass
  AND conname IN ('handle_length', 'handle_format', 'display_name_length', 'bio_length');
