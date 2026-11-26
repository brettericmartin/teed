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
