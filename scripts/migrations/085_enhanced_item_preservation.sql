-- Migration 085: Enhanced Item Preservation for Timeline Story
-- Store full item snapshot when deleted (currently only name/photo via trigger)
-- Track when notes are edited

-- Add item_snapshot column to store richer data for deleted items
ALTER TABLE item_version_history
ADD COLUMN IF NOT EXISTS item_snapshot JSONB;

-- Track when notes are edited
ALTER TABLE item_version_history
ADD COLUMN IF NOT EXISTS note_updated_at TIMESTAMPTZ;

-- Add is_visible column if not exists (for visibility toggle feature)
ALTER TABLE item_version_history
ADD COLUMN IF NOT EXISTS is_visible BOOLEAN DEFAULT true;

-- Update the track_item_changes function to capture richer snapshots on DELETE
CREATE OR REPLACE FUNCTION track_item_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Track new item added with full snapshot
        INSERT INTO item_version_history (item_id, bag_id, change_type, new_value, item_snapshot)
        VALUES (
            NEW.id,
            NEW.bag_id,
            'added',
            jsonb_build_object(
                'custom_name', NEW.custom_name,
                'photo_url', NEW.photo_url
            ),
            jsonb_build_object(
                'custom_name', NEW.custom_name,
                'photo_url', NEW.photo_url,
                'brand', NEW.brand,
                'custom_description', NEW.custom_description,
                'why_chosen', NEW.why_chosen
            )
        );

        -- Update bag version tracking
        UPDATE bags
        SET update_count = update_count + 1,
            last_major_update = NOW()
        WHERE id = NEW.bag_id;

        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        -- Track updates to key fields
        IF OLD.custom_name IS DISTINCT FROM NEW.custom_name THEN
            INSERT INTO item_version_history (item_id, bag_id, change_type, field_changed, old_value, new_value)
            VALUES (NEW.id, NEW.bag_id, 'updated', 'custom_name', to_jsonb(OLD.custom_name), to_jsonb(NEW.custom_name));
        END IF;

        IF OLD.why_chosen IS DISTINCT FROM NEW.why_chosen THEN
            INSERT INTO item_version_history (item_id, bag_id, change_type, field_changed, old_value, new_value)
            VALUES (NEW.id, NEW.bag_id, 'updated', 'why_chosen', to_jsonb(OLD.why_chosen), to_jsonb(NEW.why_chosen));
        END IF;

        IF OLD.photo_url IS DISTINCT FROM NEW.photo_url THEN
            INSERT INTO item_version_history (item_id, bag_id, change_type, field_changed, old_value, new_value)
            VALUES (NEW.id, NEW.bag_id, 'updated', 'photo_url', to_jsonb(OLD.photo_url), to_jsonb(NEW.photo_url));
        END IF;

        -- Track if item was replaced by another
        IF NEW.replaced_item_id IS NOT NULL AND OLD.replaced_item_id IS NULL THEN
            INSERT INTO item_version_history (item_id, bag_id, change_type, change_note, old_value)
            VALUES (
                NEW.id,
                NEW.bag_id,
                'replaced',
                NEW.replacement_reason,
                jsonb_build_object('replaced_item_id', NEW.replaced_item_id)
            );
        END IF;

        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        -- Track item removal with FULL snapshot for preservation
        INSERT INTO item_version_history (item_id, bag_id, change_type, old_value, item_snapshot)
        VALUES (
            OLD.id,
            OLD.bag_id,
            'removed',
            jsonb_build_object(
                'custom_name', OLD.custom_name,
                'photo_url', OLD.photo_url
            ),
            -- Capture full snapshot so removed items can still be displayed
            jsonb_build_object(
                'custom_name', OLD.custom_name,
                'photo_url', OLD.photo_url,
                'brand', OLD.brand,
                'custom_description', OLD.custom_description,
                'why_chosen', OLD.why_chosen,
                'specs', OLD.specs,
                'compared_to', OLD.compared_to,
                'price_paid', OLD.price_paid
            )
        );

        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- RLS policy for updating item_version_history (for notes/visibility)
CREATE POLICY item_version_history_update_owner ON item_version_history
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM bags
            WHERE bags.id = item_version_history.bag_id
            AND bags.owner_id = auth.uid()
        )
    );

-- Index for faster lookups by item_id (including NULL for deleted items)
CREATE INDEX IF NOT EXISTS idx_item_version_history_item_id_nullable
ON item_version_history(item_id)
WHERE item_id IS NOT NULL;
