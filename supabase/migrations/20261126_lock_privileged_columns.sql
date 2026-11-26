-- Applied to project jvljmfdroozexzodqupg through the Supabase MCP on 2026-11-26
-- as migration "lock_privileged_columns". Kept here for the record.
--
-- Problem: the profiles UPDATE policy only checks auth.uid() = id, and the
-- anon/authenticated roles can update every column. Any signed-in user could
-- PATCH their own profile with admin_role = 'super_admin' (lib/adminAuth.ts
-- trusts that column), or set is_verified, badges, beta_tier, total_* etc.
-- The bags owner policy has the same gap for is_featured, is_spotlight,
-- is_hidden and the flag columns.
--
-- Fix: BEFORE triggers that keep those columns unchanged whenever the write
-- comes straight from a browser or user session (roles anon/authenticated).
-- Service-role API routes and SECURITY DEFINER functions (owned by postgres)
-- are unaffected, so admin tools, stats and approvals keep working.
-- Values are kept rather than raising an error, so a normal profile or bag
-- save can never fail because of this.
--
-- Invite redemption used to set beta_tier from the browser; claim_invite_code
-- now sets it server-side from the code itself.

CREATE OR REPLACE FUNCTION public.protect_profile_privileged_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    NEW.admin_role       := OLD.admin_role;
    NEW.is_verified      := OLD.is_verified;
    NEW.badges           := OLD.badges;
    NEW.feature_flags    := OLD.feature_flags;
    NEW.beta_tier        := OLD.beta_tier;
    NEW.beta_approved_at := OLD.beta_approved_at;
    NEW.invited_by_id    := OLD.invited_by_id;
    NEW.total_views      := OLD.total_views;
    NEW.total_bags       := OLD.total_bags;
    NEW.total_followers  := OLD.total_followers;
    NEW.stats_updated_at := OLD.stats_updated_at;
    NEW.created_at       := OLD.created_at;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_privileged_columns ON public.profiles;
CREATE TRIGGER protect_profile_privileged_columns
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.protect_profile_privileged_columns();

CREATE OR REPLACE FUNCTION public.protect_bag_moderation_columns()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF current_user IN ('anon', 'authenticated') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.is_featured  := false;
      NEW.featured_at  := NULL;
      NEW.is_spotlight := false;
      NEW.is_flagged   := false;
      NEW.flag_reason  := NULL;
      NEW.is_hidden    := false;
    ELSE
      NEW.is_featured  := OLD.is_featured;
      NEW.featured_at  := OLD.featured_at;
      NEW.is_spotlight := OLD.is_spotlight;
      NEW.is_flagged   := OLD.is_flagged;
      NEW.flag_reason  := OLD.flag_reason;
      NEW.is_hidden    := OLD.is_hidden;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_bag_moderation_columns ON public.bags;
CREATE TRIGGER protect_bag_moderation_columns
  BEFORE INSERT OR UPDATE ON public.bags
  FOR EACH ROW EXECUTE FUNCTION public.protect_bag_moderation_columns();

-- PostgREST never issues TRUNCATE, so this only removes an unused grant.
REVOKE TRUNCATE ON public.profiles, public.bags FROM anon, authenticated;

-- Invite redemption: set the tier from the code, server-side.
CREATE OR REPLACE FUNCTION public.claim_invite_code(invite_code text, claiming_user_id uuid DEFAULT NULL::uuid, claiming_email text DEFAULT NULL::text, client_ip text DEFAULT NULL::text, client_user_agent text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  code_record beta_invite_codes%ROWTYPE;
  result jsonb;
  usage_result text;
BEGIN
  -- Find the code (case-insensitive)
  SELECT * INTO code_record FROM beta_invite_codes WHERE UPPER(code) = UPPER(invite_code);

  IF code_record IS NULL THEN
    INSERT INTO beta_code_usages (code_id, code, user_id, user_email, ip_address, user_agent, result, error_message)
    VALUES (NULL, invite_code, claiming_user_id, claiming_email, client_ip, client_user_agent, 'invalid', 'Code not found');
    RETURN jsonb_build_object('valid', false, 'error', 'Invalid invite code');
  END IF;

  IF code_record.is_revoked THEN
    INSERT INTO beta_code_usages (code_id, code, user_id, user_email, ip_address, user_agent, result, error_message)
    VALUES (code_record.id, invite_code, claiming_user_id, claiming_email, client_ip, client_user_agent, 'revoked', 'Code has been revoked');
    RETURN jsonb_build_object('valid', false, 'error', 'This invite code is no longer active');
  END IF;

  IF code_record.expires_at IS NOT NULL AND code_record.expires_at < now() THEN
    INSERT INTO beta_code_usages (code_id, code, user_id, user_email, ip_address, user_agent, result, error_message)
    VALUES (code_record.id, invite_code, claiming_user_id, claiming_email, client_ip, client_user_agent, 'expired', 'Code expired');
    RETURN jsonb_build_object('valid', false, 'error', 'This invite code has expired');
  END IF;

  IF code_record.current_uses >= code_record.max_uses THEN
    INSERT INTO beta_code_usages (code_id, code, user_id, user_email, ip_address, user_agent, result, error_message)
    VALUES (code_record.id, invite_code, claiming_user_id, claiming_email, client_ip, client_user_agent, 'max_uses', 'Max uses reached');
    RETURN jsonb_build_object('valid', false, 'error', 'This invite code has reached its maximum uses');
  END IF;

  UPDATE beta_invite_codes
  SET current_uses = current_uses + 1,
      first_claimed_at = COALESCE(first_claimed_at, now()),
      claimed_by = COALESCE(claimed_by, claiming_user_id),
      claimed_at = CASE WHEN max_uses = 1 THEN now() ELSE claimed_at END
  WHERE id = code_record.id;

  INSERT INTO beta_code_usages (code_id, code, user_id, user_email, ip_address, user_agent, result)
  VALUES (code_record.id, invite_code, claiming_user_id, claiming_email, client_ip, client_user_agent, 'success');

  -- Give the claiming account the code's tier. Only for the signed-in user
  -- themselves, or for a brand-new account (signup without a session yet,
  -- e.g. when email confirmation is on) that has no tier.
  IF claiming_user_id IS NOT NULL AND (
       claiming_user_id = auth.uid()
       OR (auth.uid() IS NULL AND EXISTS (
             SELECT 1 FROM profiles
             WHERE id = claiming_user_id
               AND beta_tier IS NULL
               AND created_at > now() - interval '30 minutes'))
     ) THEN
    UPDATE profiles
    SET beta_tier = code_record.tier,
        beta_approved_at = now(),
        invited_by_id = code_record.created_by_id
    WHERE id = claiming_user_id;
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'code_id', code_record.id,
    'tier', code_record.tier,
    'created_by_id', code_record.created_by_id,
    'campaign', code_record.campaign,
    'remaining_uses', code_record.max_uses - code_record.current_uses - 1
  );
END;
$function$;
