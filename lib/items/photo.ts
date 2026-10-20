/**
 * One rule for which picture an item shows.
 *
 * `bag_items` has two image columns: `custom_photo_id` (a `media_assets` row whose
 * file lives in Supabase storage) and `photo_url` (any external https URL). The
 * uploaded photo wins; the external URL is the fallback. Before 2026-10-20 the
 * Discover API, the featured strip and the Discover page ignored `photo_url`, and
 * `GET /api/bags/[code]` preferred it, so the same item could show a different
 * picture (or none) depending on the surface.
 */
export function resolveItemPhoto(
  item: { custom_photo_id?: string | null; photo_url?: string | null },
  mediaUrls: Record<string, string>
): string | null {
  if (item.custom_photo_id) {
    return mediaUrls[item.custom_photo_id] || item.photo_url || null;
  }
  return item.photo_url || null;
}
