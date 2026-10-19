/**
 * The one disclosure sentence (council canon, 2026-10-18).
 *
 * It is a code constant, not a database field, so it reads identically on the
 * List row, the item modal and /for/golf-simulators. Never paraphrase it.
 */
export const DISCLOSURE = 'Disclosure: Brett Martin runs Teed and builds StowGolf.';

/** Brands the person who runs Teed also owns, keyed by the `brand` value on an item. */
export const OWNED_BRANDS: Record<string, string> = {
  StowGolf: DISCLOSURE,
};

/** True when an item's brand is one the site owner also builds (case-insensitive). */
export function isOwnedBrand(brand: string | null | undefined): boolean {
  if (!brand) return false;
  const needle = brand.trim().toLowerCase();
  return Object.keys(OWNED_BRANDS).some((b) => b.toLowerCase() === needle);
}

/** The disclosure line for an item's brand, or null when none applies. */
export function disclosureFor(brand: string | null | undefined): string | null {
  return isOwnedBrand(brand) ? DISCLOSURE : null;
}
