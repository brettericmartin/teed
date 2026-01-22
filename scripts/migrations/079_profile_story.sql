-- Migration 079: Profile Story System
-- Tracks changes to profiles for "The Story" timeline feature
-- Follows pattern established in Migration 066 (bag version history)

-- ============================================================================
-- Profile Story Table
-- ============================================================================

CREATE TABLE IF NOT EXISTS profile_story (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

    -- Change classification
    change_type TEXT NOT NULL CHECK (change_type IN (
        -- Social links
        'social_link_added',
        'social_link_removed',
        'social_link_updated',

        -- Profile blocks
        'block_added',
        'block_removed',
        'block_updated',
        'blocks_reordered',

        -- Profile metadata
        'bio_updated',
        'display_name_updated',
        'handle_updated',
        'avatar_updated',
        'banner_updated',

        -- Theme changes
        'theme_updated',
        'theme_colors_updated',
        'theme_background_updated',

        -- Featured bags
        'featured_bag_added',
        'featured_bag_removed',
        'featured_bags_reordered',

        -- General
        'profile_created',
        'major_update'
    )),

    -- Change details
    entity_type TEXT CHECK (entity_type IN ('social_link', 'block', 'theme', 'featured_bag', 'profile')),
    entity_id TEXT, -- ID of the specific entity changed (e.g., block ID, platform name)
    field_changed TEXT, -- Which field was changed (e.g., 'url', 'config', 'primary_color')
    old_value JSONB, -- Previous value
    new_value JSONB, -- New value

    -- Human-readable summary
    change_summary TEXT, -- Auto-generated or custom summary (e.g., "Added Instagram link")
    change_note TEXT, -- User-provided note about the change

    -- Visibility control (per-event override)
    is_visible BOOLEAN NOT NULL DEFAULT TRUE,

    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE profile_story IS 'Tracks changes to profiles for "The Story" timeline display';
COMMENT ON COLUMN profile_story.change_type IS 'Type of change: social_link_*, block_*, bio_updated, theme_*, etc.';
COMMENT ON COLUMN profile_story.entity_type IS 'Category of entity changed: social_link, block, theme, featured_bag, profile';
COMMENT ON COLUMN profile_story.entity_id IS 'ID of specific changed entity (block UUID, platform name, etc.)';
COMMENT ON COLUMN profile_story.is_visible IS 'Per-event visibility override (user can hide specific events)';

-- ============================================================================
-- Story Settings - Add JSONB column to profiles table
-- ============================================================================

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS story_settings JSONB NOT NULL DEFAULT '{
    "enabled": true,
    "defaults": {
        "social_link_added": true,
        "social_link_removed": true,
        "social_link_updated": false,
        "block_added": true,
        "block_removed": true,
        "block_updated": false,
        "blocks_reordered": false,
        "bio_updated": true,
        "display_name_updated": true,
        "handle_updated": false,
        "avatar_updated": true,
        "banner_updated": true,
        "theme_updated": true,
        "theme_colors_updated": false,
        "theme_background_updated": false,
        "featured_bag_added": true,
        "featured_bag_removed": true,
        "featured_bags_reordered": false,
        "profile_created": true,
        "major_update": true
    },
    "show_timestamps": true,
    "max_public_entries": 50
}';

COMMENT ON COLUMN profiles.story_settings IS 'JSONB config for profile story: enabled, per-action-type visibility defaults, display settings';

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_profile_story_profile_id
    ON profile_story(profile_id);

CREATE INDEX IF NOT EXISTS idx_profile_story_created_at
    ON profile_story(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_profile_story_change_type
    ON profile_story(change_type);

CREATE INDEX IF NOT EXISTS idx_profile_story_visible
    ON profile_story(profile_id, is_visible)
    WHERE is_visible = TRUE;

-- Composite index for efficient timeline queries
CREATE INDEX IF NOT EXISTS idx_profile_story_timeline
    ON profile_story(profile_id, created_at DESC, is_visible);

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE profile_story ENABLE ROW LEVEL SECURITY;

-- Anyone can view visible story entries for any profile (public timeline)
CREATE POLICY "profile_story_select_public"
    ON profile_story
    FOR SELECT
    USING (
        is_visible = TRUE
        AND EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = profile_story.profile_id
        )
    );

-- Owners can view ALL their story entries (including hidden)
CREATE POLICY "profile_story_select_owner"
    ON profile_story
    FOR SELECT
    USING (profile_id = auth.uid());

-- Only the system/owner can insert story entries
CREATE POLICY "profile_story_insert_owner"
    ON profile_story
    FOR INSERT
    WITH CHECK (profile_id = auth.uid());

-- Owners can update visibility of their story entries
CREATE POLICY "profile_story_update_owner"
    ON profile_story
    FOR UPDATE
    USING (profile_id = auth.uid())
    WITH CHECK (profile_id = auth.uid());

-- Owners can delete their story entries
CREATE POLICY "profile_story_delete_owner"
    ON profile_story
    FOR DELETE
    USING (profile_id = auth.uid());

-- ============================================================================
-- Trigger Function: Auto-track Profile Changes
-- ============================================================================

CREATE OR REPLACE FUNCTION track_profile_story_changes()
RETURNS TRIGGER AS $$
DECLARE
    platform TEXT;
    old_platforms TEXT[];
    new_platforms TEXT[];
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Track bio changes
        IF OLD.bio IS DISTINCT FROM NEW.bio THEN
            INSERT INTO profile_story (profile_id, change_type, entity_type, field_changed, old_value, new_value, change_summary)
            VALUES (
                NEW.id,
                'bio_updated',
                'profile',
                'bio',
                to_jsonb(OLD.bio),
                to_jsonb(NEW.bio),
                'Updated bio'
            );
        END IF;

        -- Track display_name changes
        IF OLD.display_name IS DISTINCT FROM NEW.display_name THEN
            INSERT INTO profile_story (profile_id, change_type, entity_type, field_changed, old_value, new_value, change_summary)
            VALUES (
                NEW.id,
                'display_name_updated',
                'profile',
                'display_name',
                to_jsonb(OLD.display_name),
                to_jsonb(NEW.display_name),
                'Changed display name to "' || COALESCE(NEW.display_name, '') || '"'
            );
        END IF;

        -- Track handle changes
        IF OLD.handle IS DISTINCT FROM NEW.handle THEN
            INSERT INTO profile_story (profile_id, change_type, entity_type, field_changed, old_value, new_value, change_summary)
            VALUES (
                NEW.id,
                'handle_updated',
                'profile',
                'handle',
                to_jsonb(OLD.handle),
                to_jsonb(NEW.handle),
                'Changed handle to @' || COALESCE(NEW.handle, '')
            );
        END IF;

        -- Track avatar changes
        IF OLD.avatar_url IS DISTINCT FROM NEW.avatar_url THEN
            INSERT INTO profile_story (profile_id, change_type, entity_type, field_changed, old_value, new_value, change_summary)
            VALUES (
                NEW.id,
                'avatar_updated',
                'profile',
                'avatar_url',
                to_jsonb(OLD.avatar_url),
                to_jsonb(NEW.avatar_url),
                CASE
                    WHEN NEW.avatar_url IS NULL THEN 'Removed avatar'
                    WHEN OLD.avatar_url IS NULL THEN 'Added avatar'
                    ELSE 'Updated avatar'
                END
            );
        END IF;

        -- Track banner changes
        IF OLD.banner_url IS DISTINCT FROM NEW.banner_url THEN
            INSERT INTO profile_story (profile_id, change_type, entity_type, field_changed, old_value, new_value, change_summary)
            VALUES (
                NEW.id,
                'banner_updated',
                'profile',
                'banner_url',
                to_jsonb(OLD.banner_url),
                to_jsonb(NEW.banner_url),
                CASE
                    WHEN NEW.banner_url IS NULL THEN 'Removed banner'
                    WHEN OLD.banner_url IS NULL THEN 'Added banner'
                    ELSE 'Updated banner'
                END
            );
        END IF;

        -- Track social_links changes (detect adds/removes/updates)
        IF OLD.social_links IS DISTINCT FROM NEW.social_links THEN
            -- Get platform keys
            old_platforms := ARRAY(SELECT jsonb_object_keys(COALESCE(OLD.social_links, '{}'::jsonb)));
            new_platforms := ARRAY(SELECT jsonb_object_keys(COALESCE(NEW.social_links, '{}'::jsonb)));

            -- Check each platform in new links
            FOREACH platform IN ARRAY new_platforms LOOP
                IF NOT platform = ANY(old_platforms) THEN
                    -- Platform was added
                    INSERT INTO profile_story (profile_id, change_type, entity_type, entity_id, old_value, new_value, change_summary)
                    VALUES (
                        NEW.id,
                        'social_link_added',
                        'social_link',
                        platform,
                        NULL,
                        NEW.social_links->platform,
                        'Added ' || INITCAP(platform) || ' link'
                    );
                ELSIF OLD.social_links->platform IS DISTINCT FROM NEW.social_links->platform THEN
                    -- Platform was updated
                    INSERT INTO profile_story (profile_id, change_type, entity_type, entity_id, old_value, new_value, change_summary)
                    VALUES (
                        NEW.id,
                        'social_link_updated',
                        'social_link',
                        platform,
                        OLD.social_links->platform,
                        NEW.social_links->platform,
                        'Updated ' || INITCAP(platform) || ' link'
                    );
                END IF;
            END LOOP;

            -- Check for removed platforms
            FOREACH platform IN ARRAY old_platforms LOOP
                IF NOT platform = ANY(new_platforms) THEN
                    INSERT INTO profile_story (profile_id, change_type, entity_type, entity_id, old_value, new_value, change_summary)
                    VALUES (
                        NEW.id,
                        'social_link_removed',
                        'social_link',
                        platform,
                        OLD.social_links->platform,
                        NULL,
                        'Retired ' || INITCAP(platform) || ' link'
                    );
                END IF;
            END LOOP;
        END IF;

        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        -- Track profile creation
        INSERT INTO profile_story (profile_id, change_type, entity_type, change_summary)
        VALUES (
            NEW.id,
            'profile_created',
            'profile',
            'Created profile'
        );
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for profile changes
DROP TRIGGER IF EXISTS track_profile_story_changes_trigger ON profiles;
CREATE TRIGGER track_profile_story_changes_trigger
    AFTER INSERT OR UPDATE ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION track_profile_story_changes();

-- ============================================================================
-- Trigger Function: Auto-track Profile Block Changes
-- ============================================================================

CREATE OR REPLACE FUNCTION track_profile_block_story_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO profile_story (profile_id, change_type, entity_type, entity_id, new_value, change_summary)
        VALUES (
            NEW.profile_id,
            'block_added',
            'block',
            NEW.id::TEXT,
            jsonb_build_object(
                'block_type', NEW.block_type,
                'config', NEW.config
            ),
            'Added ' || REPLACE(NEW.block_type, '_', ' ') || ' block'
        );
        RETURN NEW;

    ELSIF TG_OP = 'UPDATE' THEN
        -- Track config/visibility changes (not just sort order changes)
        IF OLD.config IS DISTINCT FROM NEW.config OR OLD.is_visible IS DISTINCT FROM NEW.is_visible THEN
            INSERT INTO profile_story (profile_id, change_type, entity_type, entity_id, old_value, new_value, change_summary)
            VALUES (
                NEW.profile_id,
                'block_updated',
                'block',
                NEW.id::TEXT,
                jsonb_build_object(
                    'config', OLD.config,
                    'is_visible', OLD.is_visible
                ),
                jsonb_build_object(
                    'config', NEW.config,
                    'is_visible', NEW.is_visible
                ),
                'Refined ' || REPLACE(NEW.block_type, '_', ' ') || ' block'
            );
        END IF;
        RETURN NEW;

    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO profile_story (profile_id, change_type, entity_type, entity_id, old_value, change_summary)
        VALUES (
            OLD.profile_id,
            'block_removed',
            'block',
            OLD.id::TEXT,
            jsonb_build_object(
                'block_type', OLD.block_type,
                'config', OLD.config
            ),
            'Retired ' || REPLACE(OLD.block_type, '_', ' ') || ' block'
        );
        RETURN OLD;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for block changes
DROP TRIGGER IF EXISTS track_profile_block_story_changes_trigger ON profile_blocks;
CREATE TRIGGER track_profile_block_story_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON profile_blocks
    FOR EACH ROW
    EXECUTE FUNCTION track_profile_block_story_changes();

-- ============================================================================
-- Trigger Function: Auto-track Theme Changes
-- ============================================================================

CREATE OR REPLACE FUNCTION track_profile_theme_story_changes()
RETURNS TRIGGER AS $$
DECLARE
    changed_fields TEXT[];
    summary_text TEXT;
    change_type_val TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO profile_story (profile_id, change_type, entity_type, new_value, change_summary)
        VALUES (
            NEW.profile_id,
            'theme_updated',
            'theme',
            to_jsonb(NEW),
            'Customized profile theme'
        );
        RETURN NEW;

    ELSIF TG_OP = 'UPDATE' THEN
        changed_fields := ARRAY[]::TEXT[];

        -- Detect what category of changes occurred
        IF OLD.primary_color IS DISTINCT FROM NEW.primary_color
           OR OLD.accent_color IS DISTINCT FROM NEW.accent_color
           OR OLD.text_color IS DISTINCT FROM NEW.text_color THEN
            changed_fields := changed_fields || 'colors';
        END IF;

        IF OLD.background_type IS DISTINCT FROM NEW.background_type
           OR OLD.background_color IS DISTINCT FROM NEW.background_color
           OR OLD.background_gradient_start IS DISTINCT FROM NEW.background_gradient_start
           OR OLD.background_gradient_end IS DISTINCT FROM NEW.background_gradient_end
           OR OLD.background_image_url IS DISTINCT FROM NEW.background_image_url THEN
            changed_fields := changed_fields || 'background';
        END IF;

        IF OLD.card_style IS DISTINCT FROM NEW.card_style
           OR OLD.border_radius IS DISTINCT FROM NEW.border_radius THEN
            changed_fields := changed_fields || 'style';
        END IF;

        IF array_length(changed_fields, 1) > 0 THEN
            summary_text := 'Refined theme ' || array_to_string(changed_fields, ', ');

            -- Determine specific change type
            IF 'colors' = ANY(changed_fields) AND array_length(changed_fields, 1) = 1 THEN
                change_type_val := 'theme_colors_updated';
            ELSIF 'background' = ANY(changed_fields) AND array_length(changed_fields, 1) = 1 THEN
                change_type_val := 'theme_background_updated';
            ELSE
                change_type_val := 'theme_updated';
            END IF;

            INSERT INTO profile_story (
                profile_id,
                change_type,
                entity_type,
                old_value,
                new_value,
                change_summary
            )
            VALUES (
                NEW.profile_id,
                change_type_val,
                'theme',
                jsonb_build_object(
                    'primary_color', OLD.primary_color,
                    'accent_color', OLD.accent_color,
                    'background_type', OLD.background_type,
                    'background_color', OLD.background_color,
                    'card_style', OLD.card_style,
                    'border_radius', OLD.border_radius
                ),
                jsonb_build_object(
                    'primary_color', NEW.primary_color,
                    'accent_color', NEW.accent_color,
                    'background_type', NEW.background_type,
                    'background_color', NEW.background_color,
                    'card_style', NEW.card_style,
                    'border_radius', NEW.border_radius
                ),
                summary_text
            );
        END IF;

        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for theme changes
DROP TRIGGER IF EXISTS track_profile_theme_story_changes_trigger ON profile_themes;
CREATE TRIGGER track_profile_theme_story_changes_trigger
    AFTER INSERT OR UPDATE ON profile_themes
    FOR EACH ROW
    EXECUTE FUNCTION track_profile_theme_story_changes();

-- ============================================================================
-- Helper Function: Get Profile Story Timeline
-- ============================================================================

CREATE OR REPLACE FUNCTION get_profile_story_timeline(
    p_profile_id UUID,
    p_limit INTEGER DEFAULT 50,
    p_offset INTEGER DEFAULT 0,
    p_include_hidden BOOLEAN DEFAULT FALSE
)
RETURNS TABLE (
    id UUID,
    change_type TEXT,
    entity_type TEXT,
    entity_id TEXT,
    change_summary TEXT,
    created_at TIMESTAMPTZ,
    is_visible BOOLEAN,
    old_value JSONB,
    new_value JSONB
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ps.id,
        ps.change_type,
        ps.entity_type,
        ps.entity_id,
        ps.change_summary,
        ps.created_at,
        ps.is_visible,
        ps.old_value,
        ps.new_value
    FROM profile_story ps
    WHERE ps.profile_id = p_profile_id
      AND (p_include_hidden OR ps.is_visible = TRUE)
    ORDER BY ps.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION get_profile_story_timeline(UUID, INTEGER, INTEGER, BOOLEAN) TO authenticated;

-- ============================================================================
-- Also add is_visible column to item_version_history for bag story support
-- ============================================================================

ALTER TABLE item_version_history
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN NOT NULL DEFAULT TRUE;

CREATE INDEX IF NOT EXISTS idx_item_version_history_visible
    ON item_version_history(bag_id, is_visible)
    WHERE is_visible = TRUE;

-- Add update policy for item_version_history visibility
CREATE POLICY item_version_history_update_owner ON item_version_history
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM bags
            WHERE bags.id = item_version_history.bag_id
            AND bags.owner_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM bags
            WHERE bags.id = item_version_history.bag_id
            AND bags.owner_id = auth.uid()
        )
    );

-- Add story_settings to creator_settings for bag story as well
-- (using same column for consistency)
-- Already added above

-- ============================================================================
-- Enable the existing bag item history trigger from Migration 066
-- ============================================================================

ALTER TABLE bag_items ENABLE TRIGGER track_item_changes_trigger;

-- ============================================================================
-- Migration Complete
-- ============================================================================

SELECT 'Migration 079: Profile Story System created successfully' AS status;
