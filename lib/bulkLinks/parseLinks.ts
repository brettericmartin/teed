/**
 * Pull product links out of pasted text.
 *
 * People paste what their phone's share sheet gives them, which is often a
 * product title followed by the link ("FINIS Tempo Trainer Pro https://a.co/d/…").
 * Only real links count: a token with http(s)://, or a bare domain with a path, such as
 * "rei.com/product/123". Plain words are never turned into links.
 */
const BARE_DOMAIN = /^(?:www\.)?[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)*\.[a-z]{2,}(?::\d+)?[/?#]\S+$/i;

function tidy(token: string): string {
  // Drop wrapping and trailing punctuation that comes with prose
  let t = token.trim().replace(/^[<("'\[]+/, '');
  t = t.replace(/[>)"'\].,;:!?]+$/, '');
  return t;
}

export function parseLinks(text: string | string[], max = 25): string[] {
  const input = Array.isArray(text) ? text.join('\n') : text;
  const tokens = input
    .split(/(?=https?:\/\/)/i) // split links pasted back to back
    .flatMap((chunk) => chunk.split(/[\s,]+/))
    .map(tidy)
    .filter(Boolean);

  const out: string[] = [];
  const seen = new Set<string>();
  for (const token of tokens) {
    let url: string;
    if (/^https?:\/\//i.test(token)) {
      url = token;
    } else if (BARE_DOMAIN.test(token)) {
      url = 'https://' + token;
    } else {
      continue;
    }
    try {
      const parsed = new URL(url);
      if (!['http:', 'https:'].includes(parsed.protocol)) continue;
      if (!parsed.hostname.includes('.')) continue;
      const key = parsed.href;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push(parsed.href);
    } catch {
      // not a link
    }
  }
  return out.slice(0, max);
}

// Words a share sheet puts around the product title
const SHARE_BOILERPLATE = [
  /check out this (?:deal|item|product)?\s*(?:on amazon)?\s*[:!-]?/gi,
  /i found this on amazon\s*[:!-]?/gi,
  /\bamazon\.[a-z.]+\s*[:|]/gi,
  /\bvia @?amazon\b/gi,
  /\bshared from\b.*$/gim,
];

/** Clean share-sheet text down to a product title, or null if it doesn't look like one. */
export function cleanShareHint(raw: string): string | null {
  let t = raw;
  for (const re of SHARE_BOILERPLATE) t = t.replace(re, ' ');
  t = t.replace(/\s+/g, ' ').replace(/^[\s:|,.\-–—]+|[\s:|,\-–—]+$/g, '').trim();
  if (t.length < 6) return null;
  const words = t.split(' ').filter((w) => /[a-z]/i.test(w));
  if (words.length < 2) return null;
  return t.slice(0, 200);
}

/**
 * Like parseLinks, but also keeps the text that came just before each link
 * on the same line(s), which a share sheet fills with the product title.
 * Returns a map from link to that title.
 */
export function shareHintsByLink(text: string, max = 25): Record<string, string> {
  const hints: Record<string, string> = {};
  const parts = text.split(/(https?:\/\/\S+)/i);
  let pending = '';
  for (const part of parts) {
    if (/^https?:\/\//i.test(part)) {
      const [url] = parseLinks(part, 1);
      const hint = cleanShareHint(pending);
      if (url && hint && !hints[url]) hints[url] = hint;
      pending = '';
      if (Object.keys(hints).length >= max) break;
    } else {
      // Only the last line before the link counts, so one link's title
      // never bleeds into the next
      const lines = part.split(/\n+/).map((l) => l.trim()).filter(Boolean);
      pending = lines.length ? lines[lines.length - 1] : '';
    }
  }
  return hints;
}
