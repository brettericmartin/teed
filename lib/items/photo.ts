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
/**
 * A resized copy of an image for a thumbnail slot. Makers' CDNs serve 700 to 900 KB
 * originals; /api/proxy-image?w= resizes with sharp and serves webp, cached a day.
 * Data URLs and already-proxied URLs pass through unchanged.
 */
export function thumbUrl(url: string | null | undefined, width: number): string | null {
  if (!url) return null;
  if (url.startsWith('/api/proxy-image') || url.startsWith('data:') || url.startsWith('/')) return url;
  return `/api/proxy-image?url=${encodeURIComponent(url)}&w=${width}`;
}

export function resolveItemPhoto(
  item: { custom_photo_id?: string | null; photo_url?: string | null },
  mediaUrls: Record<string, string>
): string | null {
  if (item.custom_photo_id) {
    return mediaUrls[item.custom_photo_id] || item.photo_url || null;
  }
  return item.photo_url || null;
}
