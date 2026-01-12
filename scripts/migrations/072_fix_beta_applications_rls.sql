-- Migration 072: Fix Beta Applications RLS Policies
-- Fixes RLS issues that prevented anonymous inserts from working with .select()
-- Run with: psql $DATABASE_URL -f scripts/migrations/072_fix_beta_applications_rls.sql

-- ============================================================================
-- Fix INSERT Policy
-- ============================================================================

-- Drop any broken policies
DROP POLICY IF EXISTS "Anyone can apply for beta" ON beta_applications;
DROP POLICY IF EXISTS "Anyone can submit an application" ON beta_applications;
DROP POLICY IF EXISTS "Public can insert applications" ON beta_applications;

-- Create clean INSERT policy for anonymous users
CREATE POLICY "Anyone can insert applications"
  ON beta_applications
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- ============================================================================
-- Add SELECT Policy
-- ============================================================================

-- Needed for .select() to work after insert
DROP POLICY IF EXISTS "User can select own application" ON beta_applications;

CREATE POLICY "Anyone can select applications"
  ON beta_applications
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- ============================================================================
-- Fix Trigger Functions - SECURITY DEFINER
-- ============================================================================

-- These functions need SECURITY DEFINER to bypass RLS when executed by triggers
ALTER FUNCTION calculate_waitlist_position() SECURITY DEFINER;
ALTER FUNCTION update_application_priority() SECURITY DEFINER;
ALTER FUNCTION calculate_application_priority(beta_applications) SECURITY DEFINER;
ALTER FUNCTION handle_new_referral() SECURITY DEFINER;
ALTER FUNCTION calculate_referral_tier(INTEGER) SECURITY DEFINER;
ALTER FUNCTION count_successful_referrals(UUID) SECURITY DEFINER;

-- ============================================================================
-- Fix notify_referrer_on_application Function
-- ============================================================================

-- Fix column reference: referred_by -> referred_by_application_id
CREATE OR REPLACE FUNCTION public.notify_referrer_on_application()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $$
DECLARE
  referrer_name TEXT;
BEGIN
  -- Only trigger if there's a referred_by_application_id
  IF NEW.referred_by_application_id IS NOT NULL THEN
    -- Get the new applicant's first name
    SELECT SPLIT_PART(COALESCE(NEW.name, NEW.full_name, 'Someone'), ' ', 1)
    INTO referrer_name;

    -- Create notification for the referrer
    PERFORM create_referral_notification(
      NEW.referred_by_application_id,
      'referral_applied',
      jsonb_build_object(
        'applicant_name', referrer_name,
        'application_id', NEW.id
      )
    );
  END IF;

  RETURN NEW;
END;
$$;

-- ============================================================================
-- Verify
-- ============================================================================

-- To verify policies:
-- SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'beta_applications';
