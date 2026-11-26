/**
 * Amazon link helpers: which hosts are Amazon, the ASIN in a link, short links
 * (a.co, amzn.to) resolved to the product page, and cleaning Amazon page titles.
 *
 * Why this exists: bulk add used to miss the ASIN in /gp/product/ links and in
 * short links whose product page Amazon refused, then asked the AI to guess a
 * product from the bare ID, which invented unrelated products.
 */

const AMAZON_HOST = /(^|\.)amazon\.(com|ca|com\.mx|com\.br|co\.uk|de|fr|it|es|nl|se|pl|com\.be|ie|com\.tr|ae|sa|eg|in|sg|com\.au|co\.jp|cn)$/i;
const AMAZON_SHORT_HOSTS = ['a.co', 'amzn.to', 'amzn.com', 'amzn.eu', 'amzn.asia'];

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return '';
  }
}

export function isAmazonHost(host: string): boolean {
  return AMAZON_HOST.test(host.toLowerCase());
}

export function isAmazonShortHost(host: string): boolean {
  const h = host.toLowerCase().replace(/^www\./, '');
  return AMAZON_SHORT_HOSTS.some((d) => h === d || h.endsWith('.' + d));
}

export function isAmazonUrl(url: string): boolean {
  const h = hostOf(url);
  return isAmazonHost(h) || isAmazonShortHost(h);
}

/** The 10-character ASIN in an Amazon product link, upper-cased, or null. */
export function extractAsin(url: string): string | null {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (!isAmazonHost(parsed.hostname)) return null;
  const path = decodeURIComponent(parsed.pathname);
  const m = path.match(
    /\/(?:dp|gp\/product|gp\/aw\/d|gp\/offer-listing|exec\/obidos\/(?:ASIN|tg\/detail\/-)|o\/ASIN|product-reviews|d)\/([A-Z0-9]{10})(?=[/?#]|$)/i
  );
  if (m) return m[1].toUpperCase();
  const q = parsed.searchParams.get('asin') || parsed.searchParams.get('ASIN');
  if (q && /^[A-Z0-9]{10}$/i.test(q)) return q.toUpperCase();
  return null;
}

/** https://www.amazon.<tld>/dp/<ASIN>: one address per product, for reads and caches. */
export function canonicalAmazonUrl(url: string, asin: string): string {
  const host = hostOf(url);
  const base = isAmazonHost(host) ? host.replace(/^(smile|m)\./, 'www.') : 'www.amazon.com';
  const h = base.startsWith('www.') ? base : `www.${base}`;
  return `https://${h}/dp/${asin}`;
}

/**
 * Follows an Amazon short link (a.co, amzn.to) to the product page address
 * without reading any page. Only Amazon hosts are ever requested.
 * Returns the last Amazon address reached, or null.
 */
export async function resolveAmazonShortLink(url: string, maxHops = 5): Promise<string | null> {
  let current = url;
  for (let hop = 0; hop < maxHops; hop++) {
    const host = hostOf(current);
    if (!isAmazonShortHost(host) && !isAmazonHost(host)) return null;
    if (isAmazonHost(host) && extractAsin(current)) return current;
    let res: Response;
    try {
      res = await fetch(current, {
        method: 'GET',
        redirect: 'manual',
        signal: AbortSignal.timeout(5000),
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
          Accept: 'text/html,application/xhtml+xml',
        },
      });
    } catch {
      return isAmazonHost(host) ? current : null;
    }
    // The body is never needed
    res.body?.cancel().catch(() => {});
    const location = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && location) {
      try {
        current = new URL(location, current).href;
      } catch {
        return null;
      }
      continue;
    }
    return isAmazonHost(host) ? current : null;
  }
  return isAmazonHost(hostOf(current)) ? current : null;
}

/** "Amazon.com: Foo Bar : Sports & Outdoors" -> "Foo Bar". */
export function cleanAmazonTitle(title: string | null | undefined): string | null {
  if (!title) return null;
  let t = title
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/^\s*Amazon(\.[a-z.]+)?\s*[:|]\s*/i, '')
    .replace(/\s*[:|-]\s*Amazon\.[a-z.]+.*$/i, '')
    .trim();
  // Trailing " : Category & Category" that Amazon appends to page titles
  t = t.replace(/\s+:\s+[A-Z][\w,&' -]{2,60}$/, '').trim();
  return t || null;
}

/** Titles that come from error, robot-check or store pages rather than a product. */
export function isJunkTitle(title: string | null | undefined): boolean {
  if (!title) return true;
  const t = title.trim().toLowerCase();
  if (t.length < 4) return true;
  return [
    'page not found',
    'not found',
    'robot check',
    'sorry',
    'tut uns leid',
    'something went wrong',
    'access denied',
    'captcha',
    'are you a human',
    'just a moment',
    'service unavailable',
    'amazon.com',
    'amazon.co.uk',
    'amazon sign-in',
    '404',
    'error page',
  ].some((junk) => t === junk || t.startsWith(junk + '!') || t.startsWith(junk + ' ') || t.startsWith(junk + ':') || t === junk + '.');
}

/**
 * Last free source for an Amazon title: a Google web search for the ASIN,
 * using the same search engine the image search uses. Only results on an
 * Amazon page for that same ASIN count.
 */
export async function searchAmazonTitleByAsin(
  asin: string
): Promise<{ title: string; image: string | null } | null> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;
  if (!apiKey || !cx) return null;
  try {
    const params = new URLSearchParams({ key: apiKey, cx, q: asin, num: '5', safe: 'active' });
    const res = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`, {
      signal: AbortSignal.timeout(6000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    type Item = {
      link?: string;
      title?: string;
      pagemap?: { metatags?: Array<Record<string, string>>; cse_image?: Array<{ src?: string }> };
    };
    const items: Item[] = data.items || [];
    for (const item of items) {
      if (!item.link) continue;
      let host = '';
      try {
        host = new URL(item.link).hostname;
      } catch {
        continue;
      }
      if (!isAmazonHost(host)) continue;
      if (extractAsin(item.link) !== asin && !item.link.toUpperCase().includes(asin)) continue;
      const meta = item.pagemap?.metatags?.[0] || {};
      const raw = meta['og:title'] || meta['title'] || item.title || '';
      const title = cleanAmazonTitle(raw.replace(/\s*(\.\.\.|…)\s*$/, ''));
      if (!title || isJunkTitle(title)) continue;
      const image = item.pagemap?.cse_image?.[0]?.src || meta['og:image'] || null;
      return { title, image: image && image.startsWith('https://') ? image : null };
    }
  } catch {
    // ignore
  }
  return null;
}
