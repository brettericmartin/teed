-- Migration 058: Migrate Existing Users to Beta Status
-- One-time migration to grant all current users founder tier
-- This should be run ONCE after deploying the beta system

-- Step 1: Update all profiles without beta_tier to 'founder'
-- These are the early supporters who believed in Teed before the beta system
UPDATE profiles
SET
  beta_tier = 'founder',
  beta_approved_at = COALESCE(beta_approved_at, created_at)
WHERE beta_tier IS NULL
  AND id IN (SELECT id FROM auth.users); -- Only real users, not orphaned profiles

-- Step 2: Log the migration in audit (if admin_audit_log exists)
DO $$
DECLARE
  migrated_count integer;
  super_admin_id uuid;
BEGIN
  -- Count how many were migrated
  SELECT COUNT(*) INTO migrated_count
  FROM profiles
  WHERE beta_tier = 'founder';

  -- Get a super_admin to attribute this to (or use null for system)
  SELECT id INTO super_admin_id
  FROM profiles
  WHERE admin_role = 'super_admin'
  LIMIT 1;

  -- Log the migration if audit table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'admin_audit_log') THEN
    INSERT INTO admin_audit_log (admin_id, admin_email, admin_role, action, target_type, details)
    VALUES (
      super_admin_id,
      'system@teed.club',
      'super_admin',
      'beta.users_migrated',
      'system',
      jsonb_build_object(
        'migration', '058_migrate_existing_users_to_beta',
        'users_migrated', migrated_count,
        'tier_assigned', 'founder',
        'timestamp', now()
      )
    );
  END IF;

  RAISE NOTICE 'Migrated % existing users to founder tier', migrated_count;
END $$;

-- Comment
COMMENT ON TABLE profiles IS 'User profiles - all existing users migrated to founder beta tier';
