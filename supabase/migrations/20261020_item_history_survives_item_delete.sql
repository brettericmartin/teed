-- Applied to project jvljmfdroozexzodqupg through the Supabase MCP on 2026-10-20
-- as migration "item_history_survives_item_delete". Kept here for the record.
--
-- Deleting a bag item failed: track_item_changes ran AFTER DELETE and inserted an
-- item_version_history row pointing at the row that was already gone (FK violation).
-- Fix: write the 'removed' entry BEFORE the delete, and let the FK null out item_id
-- instead of cascading, so the whole history of a deleted item (added, updated,
-- removed, with its snapshot) is kept.

ALTER TABLE public.item_version_history
  DROP CONSTRAINT item_version_history_item_id_fkey,
  ADD CONSTRAINT item_version_history_item_id_fkey
    FOREIGN KEY (item_id) REFERENCES public.bag_items(id) ON DELETE SET NULL;

DROP TRIGGER IF EXISTS track_item_changes_trigger ON public.bag_items;

CREATE TRIGGER track_item_changes_trigger
  AFTER INSERT OR UPDATE ON public.bag_items
  FOR EACH ROW EXECUTE FUNCTION public.track_item_changes();

CREATE TRIGGER track_item_removal_trigger
  BEFORE DELETE ON public.bag_items
  FOR EACH ROW EXECUTE FUNCTION public.track_item_changes();
