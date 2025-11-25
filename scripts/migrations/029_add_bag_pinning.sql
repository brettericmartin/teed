-- Migration 029: Add Bag Pinning
-- Allows users to pin important bags to the top

-- Add pinning columns to bags table
ALTER TABLE bags ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;
ALTER TABLE bags ADD COLUMN IF NOT EXISTS pinned_at timestamptz;

-- Index for efficient querying of pinned bags
CREATE INDEX IF NOT EXISTS idx_bags_owner_pinned ON bags(owner_id, is_pinned DESC, pinned_at DESC NULLS LAST);

-- Add constraint to limit pinned bags per user (enforced at application level)
-- Users can have a maximum of 3 pinned bags

-- Function to toggle bag pin status
CREATE OR REPLACE FUNCTION toggle_bag_pin(bag_id_param uuid, user_id_param uuid)
RETURNS jsonb AS $$
DECLARE
  current_status boolean;
  pinned_count integer;
  result jsonb;
BEGIN
  -- Get current pin status
  SELECT is_pinned INTO current_status
  FROM bags
  WHERE id = bag_id_param AND owner_id = user_id_param;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'Bag not found or unauthorized');
  END IF;

  IF current_status THEN
    -- Unpin the bag
    UPDATE bags
    SET is_pinned = false, pinned_at = NULL
    WHERE id = bag_id_param AND owner_id = user_id_param;

    RETURN jsonb_build_object(
      'success', true,
      'is_pinned', false,
      'message', 'Bag unpinned'
    );
  ELSE
    -- Check if user already has 3 pinned bags
    SELECT COUNT(*) INTO pinned_count
    FROM bags
    WHERE owner_id = user_id_param AND is_pinned = true;

    IF pinned_count >= 3 THEN
      RETURN jsonb_build_object(
        'error', 'Maximum of 3 pinned bags allowed',
        'pinned_count', pinned_count
      );
    END IF;

    -- Pin the bag
    UPDATE bags
    SET is_pinned = true, pinned_at = now()
    WHERE id = bag_id_param AND owner_id = user_id_param;

    RETURN jsonb_build_object(
      'success', true,
      'is_pinned', true,
      'message', 'Bag pinned'
    );
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Comments
COMMENT ON COLUMN bags.is_pinned IS 'Whether this bag is pinned by the owner';
COMMENT ON COLUMN bags.pinned_at IS 'Timestamp when the bag was pinned';
COMMENT ON FUNCTION toggle_bag_pin IS 'Toggle pin status for a bag (max 3 pinned per user)';
