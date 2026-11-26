CREATE OR REPLACE FUNCTION public.award_beta_points(target_user_id uuid, points integer, reason text, counter_field text DEFAULT NULL::text)
 RETURNS integer
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
      DECLARE
        new_total integer;
      BEGIN
        -- Signed-in callers may only award their own feedback points.
        -- Server code (no signed-in user) is unrestricted, as before.
        IF auth.uid() IS NOT NULL THEN
          IF target_user_id IS DISTINCT FROM auth.uid() THEN
            RAISE EXCEPTION 'Can only award points to yourself' USING ERRCODE = '42501';
          END IF;
          IF points IS NULL OR points < 0 OR points > 30 THEN
            RAISE EXCEPTION 'Points out of range' USING ERRCODE = '22023';
          END IF;
        END IF;
        IF counter_field IS NOT NULL
           AND counter_field NOT IN ('bugs_reported', 'features_suggested') THEN
          RAISE EXCEPTION 'Unknown counter' USING ERRCODE = '22023';
        END IF;

        IF counter_field IS NOT NULL THEN
          EXECUTE format(
            'UPDATE beta_points SET total_points = total_points + $1, %I = %I + 1, updated_at = now() WHERE user_id = $2 RETURNING total_points',
            counter_field, counter_field
          ) INTO new_total USING points, target_user_id;
        ELSE
          UPDATE beta_points
          SET total_points = total_points + points, updated_at = now()
          WHERE user_id = target_user_id
          RETURNING total_points INTO new_total;
        END IF;
        RETURN COALESCE(new_total, 0);
      END;
      $function$;
