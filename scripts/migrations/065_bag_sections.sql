-- Migration 065: Bag Sections
-- Adds support for organizing items within bags into sections/categories
-- Part of Phase 1: Foundation Enhancement

-- Create bag_sections table
CREATE TABLE IF NOT EXISTS bag_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bag_id UUID NOT NULL REFERENCES bags(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    sort_index INTEGER NOT NULL DEFAULT 0,
    collapsed_by_default BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT bag_sections_unique_name_per_bag UNIQUE (bag_id, name)
);

-- Add section_id to bag_items
ALTER TABLE bag_items ADD COLUMN IF NOT EXISTS section_id UUID REFERENCES bag_sections(id) ON DELETE SET NULL;

-- Create index for section lookups
CREATE INDEX IF NOT EXISTS idx_bag_sections_bag_id ON bag_sections(bag_id);
CREATE INDEX IF NOT EXISTS idx_bag_items_section_id ON bag_items(section_id);

-- Add RLS policies for bag_sections
ALTER TABLE bag_sections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view sections for bags they own or public bags
CREATE POLICY "Users can view bag sections" ON bag_sections
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bags
            WHERE bags.id = bag_sections.bag_id
            AND (bags.is_public = true OR bags.owner_id = auth.uid())
        )
    );

-- Policy: Users can insert sections for bags they own
CREATE POLICY "Users can create bag sections" ON bag_sections
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM bags
            WHERE bags.id = bag_sections.bag_id
            AND bags.owner_id = auth.uid()
        )
    );

-- Policy: Users can update sections for bags they own
CREATE POLICY "Users can update bag sections" ON bag_sections
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM bags
            WHERE bags.id = bag_sections.bag_id
            AND bags.owner_id = auth.uid()
        )
    );

-- Policy: Users can delete sections for bags they own
CREATE POLICY "Users can delete bag sections" ON bag_sections
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM bags
            WHERE bags.id = bag_sections.bag_id
            AND bags.owner_id = auth.uid()
        )
    );

-- Trigger to update bag's updated_at when sections change
CREATE OR REPLACE FUNCTION update_bag_timestamp_on_section_change()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE bags SET updated_at = NOW() WHERE id = COALESCE(NEW.bag_id, OLD.bag_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_bag_on_section_change ON bag_sections;
CREATE TRIGGER trigger_update_bag_on_section_change
    AFTER INSERT OR UPDATE OR DELETE ON bag_sections
    FOR EACH ROW
    EXECUTE FUNCTION update_bag_timestamp_on_section_change();

-- Comment explaining the feature
COMMENT ON TABLE bag_sections IS 'Allows organizing items within a bag into named sections/categories';
COMMENT ON COLUMN bag_sections.collapsed_by_default IS 'If true, section shows collapsed in public view initially';
COMMENT ON COLUMN bag_items.section_id IS 'Optional section this item belongs to. NULL means unsectioned/general';
