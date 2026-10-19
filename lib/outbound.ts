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

/** `ref` is built for people: A-Z, 0-9 and hyphen only, uppercased, max 24 chars. */
export function teedRefCode(bagCode: string): string {
  const cleaned = bagCode.toUpperCase().replace(/[^A-Z0-9-]/g, '');
  return `TEED-${cleaned}`.slice(0, 24);
}

export function stowgolfUrl(
  path: string,
  bagCode: string,
  medium: 'bag' | 'for-page' = 'bag'
): string {
  const url = new URL(path.startsWith('/') ? path : `/${path}`, STOWGOLF_ORIGIN);
  url.searchParams.set('utm_source', 'teed');
  url.searchParams.set('utm_medium', medium);
  url.searchParams.set('utm_campaign', bagCode);
  url.searchParams.set('ref', teedRefCode(bagCode));
  return url.toString();
}
