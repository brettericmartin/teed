-- Migration 057: Beta Capacity Management Functions
-- Functions for checking and managing beta capacity

-- Get current beta capacity status (PUBLIC - for live counter)
CREATE OR REPLACE FUNCTION get_beta_capacity()
RETURNS jsonb AS $$
DECLARE
  capacity_setting jsonb;
  total_capacity integer;
  reserved_for_codes integer;
  current_beta_users integer;
  pending_applications integer;
  approved_this_week integer;
  available_slots integer;
BEGIN
  -- Get capacity settings
  SELECT value INTO capacity_setting FROM beta_settings WHERE key = 'beta_capacity';
  total_capacity := COALESCE((capacity_setting->>'total')::integer, 50);
  reserved_for_codes := COALESCE((capacity_setting->>'reserved_for_codes')::integer, 5);

  -- Count current beta users (have beta_tier set)
  SELECT COUNT(*) INTO current_beta_users
  FROM profiles
  WHERE beta_tier IS NOT NULL;

  -- Count pending applications
  SELECT COUNT(*) INTO pending_applications
  FROM beta_applications
  WHERE status = 'pending';

  -- Count approved this week
  SELECT COUNT(*) INTO approved_this_week
  FROM beta_applications
  WHERE status = 'approved'
    AND reviewed_at >= date_trunc('week', now());

  -- Calculate available (total - current users)
  available_slots := total_capacity - current_beta_users;

  RETURN jsonb_build_object(
    'total', total_capacity,
    'used', current_beta_users,
    'available', GREATEST(available_slots, 0),
    'reserved_for_codes', reserved_for_codes,
    'effective_capacity', total_capacity - reserved_for_codes,
    'pending_applications', pending_applications,
    'approved_this_week', approved_this_week,
    'is_at_capacity', available_slots <= 0,
    'percent_full', ROUND((current_beta_users::numeric / total_capacity) * 100, 1)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Check if we can accept a new beta user
CREATE OR REPLACE FUNCTION can_accept_beta_user()
RETURNS boolean AS $$
DECLARE
  capacity jsonb;
BEGIN
  capacity := get_beta_capacity();
  RETURN (capacity->>'available')::integer > 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Approve an application (with capacity check)
CREATE OR REPLACE FUNCTION approve_beta_application(
  application_id uuid,
  approving_admin_id uuid,
  assigned_tier text DEFAULT 'standard'
)
RETURNS jsonb AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reject an application
CREATE OR REPLACE FUNCTION reject_beta_application(
  application_id uuid,
  rejecting_admin_id uuid,
  rejection_reason text DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  app_record beta_applications%ROWTYPE;
BEGIN
  -- Get application
  SELECT * INTO app_record FROM beta_applications WHERE id = application_id;
  IF app_record IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Application not found');
  END IF;

  -- Update application
  UPDATE beta_applications
  SET
    status = 'rejected',
    reviewed_at = now(),
    reviewed_by = rejecting_admin_id::text,
    admin_notes = COALESCE(admin_notes || E'\n', '') || 'Rejected: ' || COALESCE(rejection_reason, 'No reason provided')
  WHERE id = application_id;

  -- Log to audit
  INSERT INTO admin_audit_log (admin_id, admin_email, admin_role, action, target_type, target_id, details)
  SELECT
    rejecting_admin_id,
    COALESCE((SELECT email FROM auth.users WHERE id = rejecting_admin_id), 'system'),
    COALESCE((SELECT admin_role FROM profiles WHERE id = rejecting_admin_id), 'system'),
    'beta.application_rejected',
    'application',
    application_id::text,
    jsonb_build_object(
      'applicant_email', app_record.email,
      'reason', rejection_reason
    );

  RETURN jsonb_build_object(
    'success', true,
    'applicant_email', app_record.email
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Batch approve top N applications by priority
CREATE OR REPLACE FUNCTION batch_approve_applications(
  count_to_approve integer,
  approving_admin_id uuid,
  assigned_tier text DEFAULT 'standard'
)
RETURNS jsonb AS $$
DECLARE
  capacity jsonb;
  available integer;
  actual_count integer;
  approved_count integer := 0;
  app_record RECORD;
  approval_result jsonb;
  results jsonb[] := '{}';
BEGIN
  -- Check capacity
  capacity := get_beta_capacity();
  available := (capacity->>'available')::integer;

  -- Limit to available slots
  actual_count := LEAST(count_to_approve, available);

  IF actual_count <= 0 THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'No slots available',
      'capacity', capacity
    );
  END IF;

  -- Get top N pending applications by priority
  FOR app_record IN
    SELECT id
    FROM beta_applications
    WHERE status = 'pending'
    ORDER BY priority_score DESC, created_at ASC
    LIMIT actual_count
  LOOP
    approval_result := approve_beta_application(app_record.id, approving_admin_id, assigned_tier);
    results := array_append(results, approval_result);
    IF (approval_result->>'success')::boolean THEN
      approved_count := approved_count + 1;
    END IF;
  END LOOP;

  RETURN jsonb_build_object(
    'success', true,
    'requested', count_to_approve,
    'available_slots', available,
    'approved_count', approved_count,
    'results', to_jsonb(results)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Auto-approval function (called after application submission if enabled)
CREATE OR REPLACE FUNCTION try_auto_approve_application(application_id uuid)
RETURNS jsonb AS $$
DECLARE
  auto_enabled boolean;
  threshold integer;
  can_approve boolean;
  app_record beta_applications%ROWTYPE;
BEGIN
  -- Check if auto-approval is enabled
  SELECT (value)::boolean INTO auto_enabled
  FROM beta_settings WHERE key = 'auto_approval_enabled';

  IF NOT COALESCE(auto_enabled, false) THEN
    RETURN jsonb_build_object('auto_approved', false, 'reason', 'Auto-approval is disabled');
  END IF;

  -- Check capacity
  can_approve := can_accept_beta_user();
  IF NOT can_approve THEN
    RETURN jsonb_build_object('auto_approved', false, 'reason', 'Beta is at capacity');
  END IF;

  -- Get threshold
  SELECT (value)::integer INTO threshold
  FROM beta_settings WHERE key = 'auto_approval_priority_threshold';
  threshold := COALESCE(threshold, 0);

  -- Get application
  SELECT * INTO app_record FROM beta_applications WHERE id = application_id;
  IF app_record IS NULL THEN
    RETURN jsonb_build_object('auto_approved', false, 'reason', 'Application not found');
  END IF;

  -- Check if meets threshold
  IF app_record.priority_score < threshold THEN
    RETURN jsonb_build_object('auto_approved', false, 'reason', 'Priority score below threshold');
  END IF;

  -- Auto-approve with system as approver
  RETURN approve_beta_application(application_id, NULL, 'standard');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update capacity setting
CREATE OR REPLACE FUNCTION update_beta_capacity(
  new_total integer,
  new_reserved integer DEFAULT NULL,
  admin_user_id uuid DEFAULT NULL
)
RETURNS jsonb AS $$
DECLARE
  old_capacity jsonb;
  new_capacity jsonb;
BEGIN
  SELECT value INTO old_capacity FROM beta_settings WHERE key = 'beta_capacity';

  new_capacity := jsonb_build_object(
    'total', new_total,
    'reserved_for_codes', COALESCE(new_reserved, (old_capacity->>'reserved_for_codes')::integer, 5)
  );

  UPDATE beta_settings
  SET value = new_capacity,
      updated_by = COALESCE(admin_user_id, auth.uid())
  WHERE key = 'beta_capacity';

  -- Log to audit
  IF admin_user_id IS NOT NULL THEN
    INSERT INTO admin_audit_log (admin_id, admin_email, admin_role, action, target_type, details)
    SELECT
      admin_user_id,
      COALESCE((SELECT email FROM auth.users WHERE id = admin_user_id), 'system'),
      COALESCE((SELECT admin_role FROM profiles WHERE id = admin_user_id), 'system'),
      'beta.capacity_changed',
      'system',
      jsonb_build_object(
        'previous', old_capacity,
        'new', new_capacity
      );
  END IF;

  RETURN jsonb_build_object(
    'success', true,
    'previous', old_capacity,
    'new', new_capacity
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comment
COMMENT ON FUNCTION get_beta_capacity() IS 'Returns live beta capacity stats for public counter';
COMMENT ON FUNCTION can_accept_beta_user() IS 'Checks if there are available beta slots';
COMMENT ON FUNCTION approve_beta_application(uuid, uuid, text) IS 'Approves an application with capacity check';
COMMENT ON FUNCTION batch_approve_applications(integer, uuid, text) IS 'Batch approve top N pending applications';
