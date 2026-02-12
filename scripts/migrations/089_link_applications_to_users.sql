-- Migration 089: Link beta applications to auth users
-- When the apply form creates an account, we store user_id on the application.
-- The approve function is updated to also set profiles.beta_tier.

-- 1. Add user_id column to beta_applications
ALTER TABLE beta_applications
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_beta_applications_user_id
  ON beta_applications(user_id) WHERE user_id IS NOT NULL;

-- 2. RLS policy: authenticated users can read their own application
CREATE POLICY "Users can view own application"
  ON beta_applications FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- 3. Update approve_beta_application() to also set profiles.beta_tier
CREATE OR REPLACE FUNCTION approve_beta_application(
  application_id uuid,
  approving_admin_id uuid,
  assigned_tier text DEFAULT 'standard'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  app_record beta_applications%ROWTYPE;
  new_code text;
  new_code_id uuid;
  can_approve boolean;
BEGIN
  -- Check capacity
  can_approve := can_accept_beta_user();
  IF NOT can_approve THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Beta is at capacity. Increase capacity or waitlist this application.'
    );
  END IF;

  -- Get application
  SELECT * INTO app_record FROM beta_applications WHERE id = application_id;
  IF app_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Application not found');
  END IF;

  IF app_record.status = 'approved' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Application already approved');
  END IF;

  -- Generate invite code for this application
  new_code := generate_invite_code('BETA');

  INSERT INTO beta_invite_codes (code, created_by_id, application_id, tier, max_uses, campaign, notes)
  VALUES (new_code, approving_admin_id, application_id, assigned_tier, 1, 'application_approval',
          'Auto-generated for application ' || application_id::text)
  RETURNING id INTO new_code_id;

  -- Update application
  UPDATE beta_applications
  SET
    status = 'approved',
    reviewed_at = now(),
    reviewed_by = approving_admin_id::text,
    approved_by = approving_admin_id,
    invited_at = now()
  WHERE id = application_id;

  -- If the application has a linked user, set their profile beta_tier
  IF app_record.user_id IS NOT NULL THEN
    UPDATE profiles
    SET beta_tier = assigned_tier, beta_approved_at = now()
    WHERE id = app_record.user_id;
  END IF;

  -- Log to audit
  INSERT INTO admin_audit_log (admin_id, admin_email, admin_role, action, target_type, target_id, details)
  SELECT
    approving_admin_id,
    COALESCE((SELECT email FROM auth.users WHERE id = approving_admin_id), 'system'),
    COALESCE((SELECT admin_role FROM profiles WHERE id = approving_admin_id), 'system'),
    'beta.application_approved',
    'application',
    application_id::text,
    jsonb_build_object(
      'applicant_email', app_record.email,
      'assigned_tier', assigned_tier,
      'invite_code', new_code
    );

  RETURN jsonb_build_object(
    'success', true,
    'invite_code', new_code,
    'code_id', new_code_id,
    'tier', assigned_tier,
    'applicant_email', app_record.email
  );
END;
$$;
