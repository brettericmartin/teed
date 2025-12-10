-- Migration 035: Admin Role System
-- Adds role-based access control for admin operations
-- Roles: super_admin, admin, moderator (NULL = regular user)

-- ============================================================
-- Step 1: Add admin_role column to profiles
-- ============================================================
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS admin_role text
  CHECK (admin_role IS NULL OR admin_role IN ('super_admin', 'admin', 'moderator'));

-- Index for efficient admin queries
CREATE INDEX IF NOT EXISTS idx_profiles_admin_role ON profiles(admin_role)
  WHERE admin_role IS NOT NULL;

-- Add comment
COMMENT ON COLUMN profiles.admin_role IS 'Admin role: super_admin (full access), admin (most access), moderator (content moderation), NULL (regular user)';

-- ============================================================
-- Step 2: Create admin_audit_log table
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who performed the action
  admin_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  admin_email text NOT NULL,
  admin_role text NOT NULL,

  -- What action was performed
  action text NOT NULL,
  -- Action categories:
  -- 'user.role_change', 'user.ban', 'user.unban', 'user.verify'
  -- 'content.delete', 'content.hide', 'content.restore', 'content.flag'
  -- 'settings.update', 'affiliate.configure'
  -- 'admin.login', 'admin.access_denied'
  -- 'bulk.*' for bulk operations

  -- Target of the action
  target_type text, -- 'user', 'bag', 'item', 'link', 'settings', 'system'
  target_id text,   -- UUID or identifier of affected entity

  -- Details (flexible JSON)
  details jsonb DEFAULT '{}',

  -- Request context for security auditing
  ip_address text,
  user_agent text,

  -- Timestamp
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Indexes for audit queries
CREATE INDEX IF NOT EXISTS idx_audit_admin ON admin_audit_log(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON admin_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_audit_target ON admin_audit_log(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_admin_action_date ON admin_audit_log(admin_id, action, created_at DESC);

-- Comment
COMMENT ON TABLE admin_audit_log IS 'Audit trail of all admin actions for security, compliance, and debugging';

-- ============================================================
-- Step 3: RLS for admin_audit_log
-- ============================================================
ALTER TABLE admin_audit_log ENABLE ROW LEVEL SECURITY;

-- Admins can view audit logs
CREATE POLICY "Admins can view audit logs"
  ON admin_audit_log
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid()
        AND admin_role IN ('super_admin', 'admin')
    )
  );

-- Inserts happen via service role (system-level)
CREATE POLICY "Service role can insert audit logs"
  ON admin_audit_log
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- ============================================================
-- Step 4: Helper functions for admin checks
-- ============================================================

-- Check if user is any admin
CREATE OR REPLACE FUNCTION is_admin(check_user_id uuid DEFAULT auth.uid())
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = check_user_id
      AND admin_role IS NOT NULL
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Get user's admin role
CREATE OR REPLACE FUNCTION get_admin_role(check_user_id uuid DEFAULT auth.uid())
RETURNS text AS $$
DECLARE
  role text;
BEGIN
  SELECT admin_role INTO role FROM profiles WHERE id = check_user_id;
  RETURN role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Check if user has specific permission level
CREATE OR REPLACE FUNCTION has_admin_permission(
  required_role text,
  check_user_id uuid DEFAULT auth.uid()
)
RETURNS boolean AS $$
DECLARE
  user_role text;
BEGIN
  SELECT admin_role INTO user_role FROM profiles WHERE id = check_user_id;

  IF user_role IS NULL THEN
    RETURN false;
  END IF;

  -- Role hierarchy: super_admin > admin > moderator
  RETURN CASE user_role
    WHEN 'super_admin' THEN true
    WHEN 'admin' THEN required_role IN ('admin', 'moderator')
    WHEN 'moderator' THEN required_role = 'moderator'
    ELSE false
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- ============================================================
-- Step 5: Set initial super_admin
-- ============================================================
UPDATE profiles
SET admin_role = 'super_admin'
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'brett.eric.martin@gmail.com'
  LIMIT 1
);

-- Log the initial setup
INSERT INTO admin_audit_log (
  admin_id,
  admin_email,
  admin_role,
  action,
  target_type,
  details
)
SELECT
  id,
  'brett.eric.martin@gmail.com',
  'super_admin',
  'system.initial_setup',
  'system',
  jsonb_build_object(
    'reason', 'Initial admin system setup',
    'migration', '035_create_admin_roles'
  )
FROM profiles
WHERE id = (
  SELECT id FROM auth.users
  WHERE email = 'brett.eric.martin@gmail.com'
  LIMIT 1
);
