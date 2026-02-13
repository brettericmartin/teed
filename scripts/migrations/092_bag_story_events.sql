-- Migration: Add bag lifecycle events to profile story system
-- Tracks bag_created, bag_updated, bag_deleted in the profile timeline

-- 1. Update CHECK constraint on change_type to include bag lifecycle events
ALTER TABLE profile_story DROP CONSTRAINT IF EXISTS profile_story_change_type_check;
ALTER TABLE profile_story ADD CONSTRAINT profile_story_change_type_check CHECK (
  change_type IN (
    'social_link_added', 'social_link_removed', 'social_link_updated',
    'block_added', 'block_removed', 'block_updated', 'blocks_reordered',
    'bio_updated', 'display_name_updated', 'handle_updated',
    'avatar_updated', 'banner_updated',
    'theme_updated', 'theme_colors_updated', 'theme_background_updated',
    'featured_bag_added', 'featured_bag_removed', 'featured_bags_reordered',
    'bag_created', 'bag_updated', 'bag_deleted',
    'profile_created', 'major_update'
  )
);

-- 2. Update CHECK constraint on entity_type to include 'bag'
ALTER TABLE profile_story DROP CONSTRAINT IF EXISTS profile_story_entity_type_check;
ALTER TABLE profile_story ADD CONSTRAINT profile_story_entity_type_check CHECK (
  entity_type IN ('social_link', 'block', 'theme', 'featured_bag', 'profile', 'bag')
);

-- 3. Create trigger function for bag lifecycle events
CREATE OR REPLACE FUNCTION track_bag_story_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_profile_id uuid;
  v_summary text;
  v_field text;
  v_old_val jsonb;
  v_new_val jsonb;
BEGIN
  -- Get the profile_id from the bag's creator
  IF TG_OP = 'DELETE' THEN
    SELECT id INTO v_profile_id FROM creator_profiles WHERE user_id = OLD.user_id LIMIT 1;
  ELSE
    SELECT id INTO v_profile_id FROM creator_profiles WHERE user_id = NEW.user_id LIMIT 1;
  END IF;

  -- Skip if no profile found
  IF v_profile_id IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
  END IF;

  IF TG_OP = 'INSERT' THEN
    -- Bag created
    INSERT INTO profile_story (profile_id, change_type, entity_type, entity_id, change_summary, is_visible)
    VALUES (v_profile_id, 'bag_created', 'bag', NEW.id::text,
            'Created bag "' || COALESCE(NEW.title, NEW.code) || '"', true);

  ELSIF TG_OP = 'UPDATE' THEN
    -- Only track meaningful changes (not every auto-save)
    IF OLD.title IS DISTINCT FROM NEW.title
       OR OLD.description IS DISTINCT FROM NEW.description
       OR OLD.is_public IS DISTINCT FROM NEW.is_public
       OR OLD.activity IS DISTINCT FROM NEW.activity THEN

      -- Determine the most notable change
      IF OLD.is_public IS DISTINCT FROM NEW.is_public THEN
        v_summary := CASE WHEN NEW.is_public THEN 'Made bag "' || COALESCE(NEW.title, NEW.code) || '" public'
                          ELSE 'Made bag "' || COALESCE(NEW.title, NEW.code) || '" private' END;
        v_field := 'is_public';
        v_old_val := to_jsonb(OLD.is_public);
        v_new_val := to_jsonb(NEW.is_public);
      ELSIF OLD.title IS DISTINCT FROM NEW.title THEN
        v_summary := 'Renamed bag to "' || NEW.title || '"';
        v_field := 'title';
        v_old_val := to_jsonb(OLD.title);
        v_new_val := to_jsonb(NEW.title);
      ELSIF OLD.activity IS DISTINCT FROM NEW.activity THEN
        v_summary := 'Changed bag "' || COALESCE(NEW.title, NEW.code) || '" activity to "' || NEW.activity || '"';
        v_field := 'activity';
        v_old_val := to_jsonb(OLD.activity);
        v_new_val := to_jsonb(NEW.activity);
      ELSE
        v_summary := 'Refined bag "' || COALESCE(NEW.title, NEW.code) || '"';
        v_field := 'description';
      END IF;

      INSERT INTO profile_story (profile_id, change_type, entity_type, entity_id, field_changed, old_value, new_value, change_summary, is_visible)
      VALUES (v_profile_id, 'bag_updated', 'bag', NEW.id::text, v_field, v_old_val, v_new_val, v_summary, true);
    END IF;

  ELSIF TG_OP = 'DELETE' THEN
    -- Bag deleted
    INSERT INTO profile_story (profile_id, change_type, entity_type, entity_id, change_summary, is_visible)
    VALUES (v_profile_id, 'bag_deleted', 'bag', OLD.id::text,
            'Retired bag "' || COALESCE(OLD.title, OLD.code) || '"', true);
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; ELSE RETURN NEW; END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create trigger on bags table
DROP TRIGGER IF EXISTS trigger_bag_story_changes ON bags;
CREATE TRIGGER trigger_bag_story_changes
  AFTER INSERT OR UPDATE OR DELETE ON bags
  FOR EACH ROW
  EXECUTE FUNCTION track_bag_story_changes();

-- 5. Update default story_settings in creator_profiles to include new types
ALTER TABLE creator_profiles
  ALTER COLUMN story_settings
  SET DEFAULT jsonb_build_object(
    'enabled', true,
    'defaults', jsonb_build_object(
      'social_link_added', true, 'social_link_removed', true, 'social_link_updated', false,
      'block_added', true, 'block_removed', true, 'block_updated', false, 'blocks_reordered', false,
      'bio_updated', true, 'display_name_updated', true, 'handle_updated', false,
      'avatar_updated', true, 'banner_updated', true,
      'theme_updated', true, 'theme_colors_updated', false, 'theme_background_updated', false,
      'featured_bag_added', true, 'featured_bag_removed', true, 'featured_bags_reordered', false,
      'bag_created', true, 'bag_updated', true, 'bag_deleted', true,
      'profile_created', true, 'major_update', true
    ),
    'show_timestamps', true,
    'max_public_entries', 50
  );

-- 6. Backfill existing profiles with new bag defaults in story_settings
UPDATE creator_profiles
SET story_settings = jsonb_set(
  jsonb_set(
    jsonb_set(
      story_settings,
      '{defaults,bag_created}', 'true'::jsonb
    ),
    '{defaults,bag_updated}', 'true'::jsonb
  ),
  '{defaults,bag_deleted}', 'true'::jsonb
)
WHERE story_settings IS NOT NULL
  AND NOT (story_settings->'defaults' ? 'bag_created');
