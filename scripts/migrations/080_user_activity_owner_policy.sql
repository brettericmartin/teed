-- Migration 080: Add RLS policy for bag owners to see activity on their bags
-- This allows creators to see views, clicks, etc. on bags they own

-- Drop existing policy if it exists (in case of re-run)
DROP POLICY IF EXISTS "Bag owners can see activity on their bags" ON user_activity;

-- Create policy allowing bag owners to see activity related to their bags
-- Activity events store owner_id in event_data JSONB field
CREATE POLICY "Bag owners can see activity on their bags" ON user_activity
  FOR SELECT USING (
    -- User can see activity where they are the bag owner (stored in event_data)
    (event_data->>'owner_id')::uuid = auth.uid()
    OR
    -- Or where the bag_id belongs to one of their bags
    EXISTS (
      SELECT 1 FROM bags
      WHERE bags.id = (user_activity.event_data->>'bag_id')::uuid
      AND bags.owner_id = auth.uid()
    )
  );

-- Add index to speed up the owner_id lookup in event_data
CREATE INDEX IF NOT EXISTS idx_user_activity_owner_id ON user_activity((event_data->>'owner_id'));

COMMENT ON POLICY "Bag owners can see activity on their bags" ON user_activity
  IS 'Allows creators to see analytics for bags they own';
