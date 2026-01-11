-- Migration 066: Version History System
-- Tracks changes to bags and items for changelog badges and timeline UI

-- Bag version history - tracks major changes to bags
CREATE TABLE IF NOT EXISTS bag_version_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bag_id UUID NOT NULL REFERENCES bags(id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    change_type TEXT NOT NULL CHECK (change_type IN ('created', 'items_added', 'items_removed', 'items_updated', 'metadata_updated', 'major_update')),
    change_summary TEXT, -- Human-readable summary
    items_changed INTEGER DEFAULT 0, -- Number of items affected
    snapshot JSONB, -- Optional snapshot of bag state at this version
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT bag_version_history_version_unique UNIQUE (bag_id, version_number)
);

-- Item version history - tracks changes to individual items
CREATE TABLE IF NOT EXISTS item_version_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id UUID NOT NULL REFERENCES bag_items(id) ON DELETE CASCADE,
    bag_id UUID NOT NULL REFERENCES bags(id) ON DELETE CASCADE,
    change_type TEXT NOT NULL CHECK (change_type IN ('added', 'updated', 'replaced', 'removed', 'restored')),
    field_changed TEXT, -- Which field was changed (e.g., 'custom_name', 'why_chosen', 'photo_url')
    old_value JSONB, -- Previous value (for updates)
    new_value JSONB, -- New value (for updates)
    change_note TEXT, -- User-provided note about the change
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add last_updated tracking to bags for changelog badges
ALTER TABLE bags ADD COLUMN IF NOT EXISTS last_major_update TIMESTAMPTZ;
ALTER TABLE bags ADD COLUMN IF NOT EXISTS update_count INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bags ADD COLUMN IF NOT EXISTS version_number INTEGER NOT NULL DEFAULT 1;

-- Add tracking fields to bag_items for "Why I switched" functionality
ALTER TABLE bag_items ADD COLUMN IF NOT EXISTS replaced_item_id UUID REFERENCES bag_items(id) ON DELETE SET NULL;
ALTER TABLE bag_items ADD COLUMN IF NOT EXISTS replacement_reason TEXT; -- "Why I switched from X to Y"
ALTER TABLE bag_items ADD COLUMN IF NOT EXISTS added_at TIMESTAMPTZ DEFAULT NOW();

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_bag_version_history_bag_id ON bag_version_history(bag_id);
CREATE INDEX IF NOT EXISTS idx_bag_version_history_created_at ON bag_version_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_item_version_history_item_id ON item_version_history(item_id);
CREATE INDEX IF NOT EXISTS idx_item_version_history_bag_id ON item_version_history(bag_id);
CREATE INDEX IF NOT EXISTS idx_item_version_history_created_at ON item_version_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bags_last_major_update ON bags(last_major_update) WHERE last_major_update IS NOT NULL;

-- RLS Policies for bag_version_history
ALTER TABLE bag_version_history ENABLE ROW LEVEL SECURITY;

-- Anyone can view version history for public bags
CREATE POLICY bag_version_history_select_public ON bag_version_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bags
            WHERE bags.id = bag_version_history.bag_id
            AND bags.is_public = true
        )
    );

-- Owners can view all version history for their bags
CREATE POLICY bag_version_history_select_owner ON bag_version_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bags
            WHERE bags.id = bag_version_history.bag_id
            AND bags.owner_id = auth.uid()
        )
    );

-- Only owners can insert version history (via triggers/API)
CREATE POLICY bag_version_history_insert_owner ON bag_version_history
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM bags
            WHERE bags.id = bag_version_history.bag_id
            AND bags.owner_id = auth.uid()
        )
    );

-- RLS Policies for item_version_history
ALTER TABLE item_version_history ENABLE ROW LEVEL SECURITY;

-- Anyone can view item history for public bags
CREATE POLICY item_version_history_select_public ON item_version_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bags
            WHERE bags.id = item_version_history.bag_id
            AND bags.is_public = true
        )
    );

-- Owners can view all item history for their bags
CREATE POLICY item_version_history_select_owner ON item_version_history
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bags
            WHERE bags.id = item_version_history.bag_id
            AND bags.owner_id = auth.uid()
        )
    );

-- Only owners can insert item history
CREATE POLICY item_version_history_insert_owner ON item_version_history
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM bags
            WHERE bags.id = item_version_history.bag_id
            AND bags.owner_id = auth.uid()
        )
    );

-- Function to automatically track item changes
CREATE OR REPLACE FUNCTION track_item_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- Track new item added
        INSERT INTO item_version_history (item_id, bag_id, change_type, new_value)
        VALUES (
            NEW.id,
            NEW.bag_id,
            'added',
            jsonb_build_object(
                'custom_name', NEW.custom_name,
                'photo_url', NEW.photo_url
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
        -- Track item removal
        INSERT INTO item_version_history (item_id, bag_id, change_type, old_value)
        VALUES (
            OLD.id,
            OLD.bag_id,
            'removed',
            jsonb_build_object(
                'custom_name', OLD.custom_name,
                'photo_url', OLD.photo_url
            )
        );

        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for item changes (disabled by default to not affect existing behavior)
-- Enable when ready: ALTER TABLE bag_items ENABLE TRIGGER track_item_changes_trigger;
DROP TRIGGER IF EXISTS track_item_changes_trigger ON bag_items;
CREATE TRIGGER track_item_changes_trigger
    AFTER INSERT OR UPDATE OR DELETE ON bag_items
    FOR EACH ROW
    EXECUTE FUNCTION track_item_changes();

-- Initially disable the trigger to not affect existing workflows
ALTER TABLE bag_items DISABLE TRIGGER track_item_changes_trigger;

-- Function to create a manual version snapshot (for major updates)
CREATE OR REPLACE FUNCTION create_bag_version_snapshot(
    p_bag_id UUID,
    p_change_type TEXT DEFAULT 'major_update',
    p_change_summary TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_version_number INTEGER;
    v_snapshot JSONB;
    v_items_count INTEGER;
    v_history_id UUID;
BEGIN
    -- Get next version number
    SELECT COALESCE(MAX(version_number), 0) + 1 INTO v_version_number
    FROM bag_version_history
    WHERE bag_id = p_bag_id;

    -- Get item count
    SELECT COUNT(*) INTO v_items_count
    FROM bag_items
    WHERE bag_id = p_bag_id;

    -- Create snapshot of current state
    SELECT jsonb_build_object(
        'title', b.title,
        'description', b.description,
        'items_count', v_items_count,
        'items', (
            SELECT jsonb_agg(jsonb_build_object(
                'id', i.id,
                'custom_name', i.custom_name,
                'photo_url', i.photo_url,
                'sort_index', i.sort_index
            ))
            FROM bag_items i
            WHERE i.bag_id = p_bag_id
        )
    ) INTO v_snapshot
    FROM bags b
    WHERE b.id = p_bag_id;

    -- Insert version history record
    INSERT INTO bag_version_history (bag_id, version_number, change_type, change_summary, items_changed, snapshot)
    VALUES (p_bag_id, v_version_number, p_change_type, p_change_summary, v_items_count, v_snapshot)
    RETURNING id INTO v_history_id;

    -- Update bag version tracking
    UPDATE bags
    SET version_number = v_version_number,
        last_major_update = NOW()
    WHERE id = p_bag_id;

    RETURN v_history_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION create_bag_version_snapshot(UUID, TEXT, TEXT) TO authenticated;
