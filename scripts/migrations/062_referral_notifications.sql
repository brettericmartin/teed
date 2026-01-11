-- Migration 062: Referral Notifications
-- Creates table and functions for real-time referral notifications

-- ═══════════════════════════════════════════════════════════════════
-- Table: Referral Notifications
-- Stores notifications for referral events
-- ═══════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS referral_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_application_id UUID NOT NULL REFERENCES beta_applications(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'referral_applied',      -- Someone applied using your link
    'referral_approved',     -- Someone you referred got approved
    'tier_unlocked',         -- You reached a new tier
    'instant_approval',      -- You've unlocked instant approval
    'position_improved'      -- Your position improved
  )),
  data JSONB DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_referral_notifications_recipient
  ON referral_notifications(recipient_application_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_referral_notifications_unread
  ON referral_notifications(recipient_application_id)
  WHERE read_at IS NULL;

-- ═══════════════════════════════════════════════════════════════════
-- Function: Get Notifications for Application
-- Returns recent notifications for an application
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION get_referral_notifications(
  app_id UUID,
  limit_count INTEGER DEFAULT 20,
  unread_only BOOLEAN DEFAULT false
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  data JSONB,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    rn.id,
    rn.type,
    rn.data,
    rn.read_at,
    rn.created_at
  FROM referral_notifications rn
  WHERE rn.recipient_application_id = app_id
    AND (NOT unread_only OR rn.read_at IS NULL)
  ORDER BY rn.created_at DESC
  LIMIT limit_count;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- Function: Mark Notifications as Read
-- Marks notifications as read for an application
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION mark_notifications_read(
  app_id UUID,
  notification_ids UUID[] DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  updated_count INTEGER;
BEGIN
  IF notification_ids IS NULL THEN
    -- Mark all as read
    UPDATE referral_notifications
    SET read_at = now()
    WHERE recipient_application_id = app_id
      AND read_at IS NULL;
  ELSE
    -- Mark specific notifications as read
    UPDATE referral_notifications
    SET read_at = now()
    WHERE recipient_application_id = app_id
      AND id = ANY(notification_ids)
      AND read_at IS NULL;
  END IF;

  GET DIAGNOSTICS updated_count = ROW_COUNT;
  RETURN updated_count;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- Function: Create Notification
-- Helper to create a notification
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION create_referral_notification(
  recipient_id UUID,
  notification_type TEXT,
  notification_data JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO referral_notifications (recipient_application_id, type, data)
  VALUES (recipient_id, notification_type, notification_data)
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- ═══════════════════════════════════════════════════════════════════
-- Trigger: Notify Referrer When Someone Applies
-- Automatically creates notification when a referral applies
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION notify_referrer_on_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  referrer_name TEXT;
BEGIN
  -- Only trigger if there's a referred_by
  IF NEW.referred_by IS NOT NULL THEN
    -- Get the new applicant's first name
    SELECT SPLIT_PART(COALESCE(NEW.name, NEW.full_name, 'Someone'), ' ', 1)
    INTO referrer_name;

    -- Create notification for the referrer
    PERFORM create_referral_notification(
      NEW.referred_by,
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

DROP TRIGGER IF EXISTS trigger_notify_referrer_on_application ON beta_applications;
CREATE TRIGGER trigger_notify_referrer_on_application
  AFTER INSERT ON beta_applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_referrer_on_application();

-- ═══════════════════════════════════════════════════════════════════
-- Trigger: Notify on Tier Change
-- Notifies user when they reach a new referral tier
-- ═══════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION notify_on_tier_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  tier_name TEXT;
BEGIN
  -- Only trigger if tier changed and increased
  IF OLD.referral_tier IS DISTINCT FROM NEW.referral_tier
     AND COALESCE(NEW.referral_tier, 0) > COALESCE(OLD.referral_tier, 0) THEN

    -- Get tier name
    tier_name := CASE NEW.referral_tier
      WHEN 1 THEN 'Engaged'
      WHEN 2 THEN 'Connector'
      WHEN 3 THEN 'Champion'
      WHEN 4 THEN 'Legend'
      ELSE 'Standard'
    END;

    -- Create tier notification
    PERFORM create_referral_notification(
      NEW.id,
      'tier_unlocked',
      jsonb_build_object(
        'tier', NEW.referral_tier,
        'tier_name', tier_name,
        'referral_count', NEW.successful_referrals
      )
    );

    -- If they hit Champion tier (5 referrals), also notify about instant approval
    IF NEW.referral_tier >= 3 AND COALESCE(OLD.referral_tier, 0) < 3 THEN
      PERFORM create_referral_notification(
        NEW.id,
        'instant_approval',
        jsonb_build_object(
          'referral_count', NEW.successful_referrals
        )
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_notify_on_tier_change ON beta_applications;
CREATE TRIGGER trigger_notify_on_tier_change
  AFTER UPDATE OF referral_tier ON beta_applications
  FOR EACH ROW
  EXECUTE FUNCTION notify_on_tier_change();

-- ═══════════════════════════════════════════════════════════════════
-- Grant permissions
-- ═══════════════════════════════════════════════════════════════════

GRANT SELECT, INSERT, UPDATE ON referral_notifications TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_referral_notifications(UUID, INTEGER, BOOLEAN) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION mark_notifications_read(UUID, UUID[]) TO authenticated, anon;
GRANT EXECUTE ON FUNCTION create_referral_notification(UUID, TEXT, JSONB) TO authenticated, anon;

COMMENT ON TABLE referral_notifications IS 'Stores notifications for referral events';
COMMENT ON FUNCTION get_referral_notifications(UUID, INTEGER, BOOLEAN) IS 'Returns notifications for an application';
COMMENT ON FUNCTION mark_notifications_read(UUID, UUID[]) IS 'Marks notifications as read';
