/**
 * Outbound links from Teed to stowgolf.com.
 *
 * Every exit to stowgolf.com goes through `stowgolfUrl()` so the visit and any
 * later $100 hold trace back to the Teed bag it came from:
 *   ?utm_source=teed&utm_medium=bag&utm_campaign=<bagCode>&ref=TEED-<CODE>
 * stowgolf.com stores the utm triple on the waitlist row and `ref` lands in
 * `waitlist.referred_by` and the Stripe `client_reference_id`.
 */

export const STOWGOLF_ORIGIN = 'https://stowgolf.com';

/** stowgolf.com's sanitizeRef caps the whole `ref` at 24 characters. */
export const MAX_REF_LENGTH = 24;
const REF_PREFIX = 'TEED-';

/**
 * `ref` is built for people: `TEED-` + the bag code uppercased, non [A-Z0-9-]
 * stripped, cut to 19 characters with any trailing hyphen trimmed, so the whole
 * ref is at most 24 characters. Prefer an explicit short ref in seeds.
 */
export function teedRefCode(bagCode: string): string {
  const cleaned = bagCode
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, '')
    .slice(0, MAX_REF_LENGTH - REF_PREFIX.length)
    .replace(/-+$/, '');
  return `${REF_PREFIX}${cleaned}`;
}

export function stowgolfUrl(
  path: string,
  bagCode: string,
  ref?: string,
  medium: 'bag' | 'for-page' = 'bag'
): string {
  const url = new URL(path.startsWith('/') ? path : `/${path}`, STOWGOLF_ORIGIN);
  url.searchParams.set('utm_source', 'teed');
  url.searchParams.set('utm_medium', medium);
  url.searchParams.set('utm_campaign', bagCode);
  url.searchParams.set('ref', (ref || teedRefCode(bagCode)).slice(0, MAX_REF_LENGTH));
  return url.toString();
}
