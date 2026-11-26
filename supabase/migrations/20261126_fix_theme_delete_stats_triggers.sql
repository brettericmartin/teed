-- Applied to project jvljmfdroozexzodqupg through the Supabase MCP on 2026-11-26
-- as migration "fix_theme_delete_stats_triggers". Kept here for the record.
--
-- Three small fixes to existing functions, each a targeted text replacement so
-- the rest of each function stays exactly as it was:
--
-- 1. Theme saves failed: track_profile_theme_story_changes did
--    `changed_fields := changed_fields || 'colors'`, which Postgres reads as
--    array || array and fails on 'colors' ("malformed array literal").
--    Now array_append.
-- 2. Deleting a bag that has items failed: deleting the bag cascades to its
--    items, whose BEFORE DELETE history trigger then inserted a row pointing at
--    the bag that was already gone (item_version_history_bag_id_fkey). The
--    trigger now skips the history row when the bag itself is being deleted;
--    that bag's history is removed with it (ON DELETE CASCADE) anyway.
-- 3. update_profile_stats always failed: it counted follows.followed_id, but the
--    column is following_id, so bag, view and follower counts never refreshed.

DO $mig$
DECLARE
  d text;
  d2 text;
BEGIN
  d := pg_get_functiondef('public.track_profile_theme_story_changes()'::regprocedure);
  d2 := regexp_replace(d, 'changed_fields\s*:=\s*changed_fields\s*\|\|\s*''(colors|background|style)''',
                          'changed_fields := array_append(changed_fields, ''\1'')', 'g');
  IF d2 = d THEN RAISE EXCEPTION 'theme function: pattern not found'; END IF;
  EXECUTE d2;

  d := pg_get_functiondef('public.track_item_changes()'::regprocedure);
  d2 := regexp_replace(d, 'ELSIF\s+TG_OP\s*=\s*''DELETE''\s+THEN',
                          E'ELSIF TG_OP = ''DELETE'' THEN\n    -- Bag itself is being deleted: its history goes with it, so skip.\n    IF NOT EXISTS (SELECT 1 FROM bags WHERE id = OLD.bag_id) THEN RETURN OLD; END IF;');
  IF d2 = d THEN RAISE EXCEPTION 'item function: pattern not found'; END IF;
  EXECUTE d2;

  d := pg_get_functiondef('public.update_profile_stats(uuid)'::regprocedure);
  d2 := regexp_replace(d, 'followed_id\s*=\s*target_user_id', 'following_id = target_user_id');
  IF d2 = d THEN RAISE EXCEPTION 'stats function: pattern not found'; END IF;
  EXECUTE d2;
END
$mig$;
