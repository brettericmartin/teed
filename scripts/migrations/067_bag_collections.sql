-- Migration 067: Bag Collections System
-- Allows creators to group bags into themed collections for better profile organization

-- Bag collections table
CREATE TABLE IF NOT EXISTS bag_collections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    owner_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    emoji TEXT, -- Optional emoji icon for the collection
    sort_index INTEGER NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT false, -- Featured collection shown prominently
    is_visible BOOLEAN NOT NULL DEFAULT true, -- Can hide collections
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT bag_collections_unique_name_per_owner UNIQUE (owner_id, name)
);

-- Junction table for bags in collections (many-to-many)
CREATE TABLE IF NOT EXISTS bag_collection_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    collection_id UUID NOT NULL REFERENCES bag_collections(id) ON DELETE CASCADE,
    bag_id UUID NOT NULL REFERENCES bags(id) ON DELETE CASCADE,
    sort_index INTEGER NOT NULL DEFAULT 0,
    added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT bag_collection_items_unique UNIQUE (collection_id, bag_id)
);

-- Related bags linking table (bag-to-bag relationships)
CREATE TABLE IF NOT EXISTS related_bags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    bag_id UUID NOT NULL REFERENCES bags(id) ON DELETE CASCADE,
    related_bag_id UUID NOT NULL REFERENCES bags(id) ON DELETE CASCADE,
    relationship_type TEXT NOT NULL DEFAULT 'related' CHECK (relationship_type IN ('related', 'sequel', 'budget_version', 'premium_version', 'alternative', 'companion')),
    description TEXT, -- Optional description of the relationship
    sort_index INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT related_bags_unique UNIQUE (bag_id, related_bag_id),
    CONSTRAINT related_bags_no_self_reference CHECK (bag_id != related_bag_id)
);

-- Indexes for efficient queries
CREATE INDEX IF NOT EXISTS idx_bag_collections_owner_id ON bag_collections(owner_id);
CREATE INDEX IF NOT EXISTS idx_bag_collections_sort_index ON bag_collections(owner_id, sort_index);
CREATE INDEX IF NOT EXISTS idx_bag_collection_items_collection_id ON bag_collection_items(collection_id);
CREATE INDEX IF NOT EXISTS idx_bag_collection_items_bag_id ON bag_collection_items(bag_id);
CREATE INDEX IF NOT EXISTS idx_related_bags_bag_id ON related_bags(bag_id);
CREATE INDEX IF NOT EXISTS idx_related_bags_related_bag_id ON related_bags(related_bag_id);

-- RLS Policies for bag_collections
ALTER TABLE bag_collections ENABLE ROW LEVEL SECURITY;

-- Anyone can view visible collections
CREATE POLICY bag_collections_select_public ON bag_collections
    FOR SELECT
    USING (is_visible = true);

-- Owners can view all their collections
CREATE POLICY bag_collections_select_owner ON bag_collections
    FOR SELECT
    USING (owner_id = auth.uid());

-- Only owners can insert collections
CREATE POLICY bag_collections_insert_owner ON bag_collections
    FOR INSERT
    WITH CHECK (owner_id = auth.uid());

-- Only owners can update their collections
CREATE POLICY bag_collections_update_owner ON bag_collections
    FOR UPDATE
    USING (owner_id = auth.uid());

-- Only owners can delete their collections
CREATE POLICY bag_collections_delete_owner ON bag_collections
    FOR DELETE
    USING (owner_id = auth.uid());

-- RLS Policies for bag_collection_items
ALTER TABLE bag_collection_items ENABLE ROW LEVEL SECURITY;

-- Anyone can view collection items for visible collections
CREATE POLICY bag_collection_items_select_public ON bag_collection_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bag_collections c
            WHERE c.id = bag_collection_items.collection_id
            AND c.is_visible = true
        )
    );

-- Owners can view all collection items
CREATE POLICY bag_collection_items_select_owner ON bag_collection_items
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bag_collections c
            WHERE c.id = bag_collection_items.collection_id
            AND c.owner_id = auth.uid()
        )
    );

-- Only owners can insert collection items
CREATE POLICY bag_collection_items_insert_owner ON bag_collection_items
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM bag_collections c
            WHERE c.id = bag_collection_items.collection_id
            AND c.owner_id = auth.uid()
        )
    );

-- Only owners can update collection items
CREATE POLICY bag_collection_items_update_owner ON bag_collection_items
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM bag_collections c
            WHERE c.id = bag_collection_items.collection_id
            AND c.owner_id = auth.uid()
        )
    );

-- Only owners can delete collection items
CREATE POLICY bag_collection_items_delete_owner ON bag_collection_items
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM bag_collections c
            WHERE c.id = bag_collection_items.collection_id
            AND c.owner_id = auth.uid()
        )
    );

-- RLS Policies for related_bags
ALTER TABLE related_bags ENABLE ROW LEVEL SECURITY;

-- Anyone can view related bags for public bags
CREATE POLICY related_bags_select_public ON related_bags
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bags b
            WHERE b.id = related_bags.bag_id
            AND b.is_public = true
        )
    );

-- Owners can view all related bags for their bags
CREATE POLICY related_bags_select_owner ON related_bags
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM bags b
            WHERE b.id = related_bags.bag_id
            AND b.owner_id = auth.uid()
        )
    );

-- Only owners can insert related bags
CREATE POLICY related_bags_insert_owner ON related_bags
    FOR INSERT
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM bags b
            WHERE b.id = related_bags.bag_id
            AND b.owner_id = auth.uid()
        )
    );

-- Only owners can update related bags
CREATE POLICY related_bags_update_owner ON related_bags
    FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM bags b
            WHERE b.id = related_bags.bag_id
            AND b.owner_id = auth.uid()
        )
    );

-- Only owners can delete related bags
CREATE POLICY related_bags_delete_owner ON related_bags
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM bags b
            WHERE b.id = related_bags.bag_id
            AND b.owner_id = auth.uid()
        )
    );

-- Update timestamp trigger for bag_collections
CREATE OR REPLACE FUNCTION update_bag_collections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS bag_collections_updated_at ON bag_collections;
CREATE TRIGGER bag_collections_updated_at
    BEFORE UPDATE ON bag_collections
    FOR EACH ROW
    EXECUTE FUNCTION update_bag_collections_updated_at();
