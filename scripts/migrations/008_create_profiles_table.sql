-- Migration: Create profiles table with auto-creation trigger
-- This migration documents the profiles table that powers user profiles on Teed.
-- The table is linked to Supabase Auth and auto-creates a profile when users sign up.

-- ============================================================================
-- 1. CREATE PROFILES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  handle text NOT NULL UNIQUE,
  display_name text NOT NULL,
  avatar_url text,
  bio text,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL,

  -- Constraints
  CONSTRAINT handle_length CHECK (char_length(handle) >= 3 AND char_length(handle) <= 30),
  CONSTRAINT handle_format CHECK (handle ~ '^[a-z0-9_]+$'),
  CONSTRAINT display_name_length CHECK (char_length(display_name) >= 1 AND char_length(display_name) <= 50),
  CONSTRAINT bio_length CHECK (bio IS NULL OR char_length(bio) <= 500)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS profiles_handle_idx ON profiles(handle);
CREATE INDEX IF NOT EXISTS profiles_created_at_idx ON profiles(created_at DESC);

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- 2. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy 1: Anyone can view all profiles (public read)
CREATE POLICY "Profiles are publicly viewable"
  ON profiles
  FOR SELECT
  USING (true);

-- Policy 2: Users can insert their own profile (only during signup via trigger)
CREATE POLICY "Users can create their own profile"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Policy 3: Users can update their own profile only
CREATE POLICY "Users can update their own profile"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 4: Users can delete their own profile (account deletion)
CREATE POLICY "Users can delete their own profile"
  ON profiles
  FOR DELETE
  USING (auth.uid() = id);

-- ============================================================================
-- 3. AUTO-CREATE PROFILE TRIGGER FUNCTION
-- ============================================================================

-- Function to automatically create a profile when a new user signs up
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Insert a new profile for the user
  INSERT INTO public.profiles (id, handle, display_name, bio, avatar_url)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'handle', 'user_' || substr(NEW.id::text, 1, 8)),
    COALESCE(NEW.raw_user_meta_data->>'display_name', SPLIT_PART(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'bio',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to call the function when a new user is created in auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================================
-- 4. STORAGE BUCKET FOR AVATARS (if not exists)
-- ============================================================================

-- Note: Storage buckets must be created via Supabase Dashboard or Storage API
-- This is a reference for the bucket configuration:
--
-- Bucket name: avatars
-- Public: true (read access)
-- File size limit: 2MB
-- Allowed MIME types: image/jpeg, image/png, image/webp, image/gif
--
-- Storage policies to create via Dashboard:
-- 1. Public read: SELECT for all authenticated and anon users
-- 2. Authenticated write to own folder: INSERT for auth.uid() = owner
-- 3. Authenticated delete own files: DELETE for auth.uid() = owner
--
-- Example file path: avatars/{user_id}/avatar.png

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- This migration creates:
-- ✅ profiles table with constraints
-- ✅ RLS policies for secure access control
-- ✅ Auto-profile creation trigger on signup
-- ✅ Updated_at timestamp trigger
-- ✅ Performance indexes

-- Next steps:
-- 1. Run this migration: node scripts/run-profile-migration.mjs
-- 2. Create avatars bucket in Supabase Dashboard
-- 3. Set up avatar storage policies in Dashboard
-- 4. Test profile auto-creation by signing up a new user
