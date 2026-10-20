// Fill `image_url` for component products that have none, from the maker's own
// page (direct_url, then fallback_url): Open Graph image, twitter:image, or the
// first JSON-LD Product image. Each candidate is GET-checked for 200 and an
// image content-type before it is written. Never overwrites an existing
// image_url. Usage:
//   node scripts/fill-component-images.mjs [category ...]
// Writes content/components/<category>.json in place and prints a summary.

import fs from 'node:fs';
import path from 'node:path';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const TIMEOUT = 15_000;

async function get(url, accept) {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    return await fetch(url, { headers: { 'User-Agent': UA, Accept: accept }, redirect: 'follow', signal: controller.signal });
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }
}

function resolve(candidate, base) {
  try {
    return new URL(candidate.replace(/&amp;/g, '&').trim(), base).toString();
  } catch {
    return null;
  }
}

function candidatesFrom(html, base) {
  const out = [];
  const push = (m) => {
    if (!m) return;
    const u = resolve(m, base);
    if (u && /^https:\/\//i.test(u) && !out.includes(u)) out.push(u);
  };
  for (const re of [
    /<meta\s+[^>]*property=["']og:image(?::secure_url)?["'][^>]*content=["']([^"']+)["']/gi,
    /<meta\s+[^>]*content=["']([^"']+)["'][^>]*property=["']og:image(?::secure_url)?["']/gi,
    /<meta\s+[^>]*name=["']twitter:image(?::src)?["'][^>]*content=["']([^"']+)["']/gi,
    /<meta\s+[^>]*content=["']([^"']+)["'][^>]*name=["']twitter:image(?::src)?["']/gi,
  ]) {
    for (const m of html.matchAll(re)) push(m[1]);
  }
  for (const m of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const json = JSON.parse(m[1]);
      const nodes = Array.isArray(json) ? json : json['@graph'] ? json['@graph'] : [json];
      for (const n of nodes) {
        const t = String(n?.['@type'] ?? '');
        if (!/Product/i.test(t)) continue;
        const img = n.image;
        const list = Array.isArray(img) ? img : img ? [img] : [];
        for (const i of list) push(typeof i === 'string' ? i : i?.url || i?.contentUrl);
      }
    } catch {
      /* not JSON */
    }
  }
  return out;
}

async function isImage(url) {
  const res = await get(url, 'image/avif,image/webp,image/*,*/*;q=0.8');
  if (!res || res.status !== 200) return false;
  const type = (res.headers.get('content-type') || '').toLowerCase();
  return type.startsWith('image/');
}

async function findImage(pageUrl) {
  if (!pageUrl || !/^https?:\/\//i.test(pageUrl)) return null;
  const res = await get(pageUrl, 'text/html,application/xhtml+xml');
  if (!res || res.status !== 200) return { error: res ? `page ${res.status}` : 'page unreachable' };
  const html = await res.text();
  for (const c of candidatesFrom(html, res.url || pageUrl)) {
    if (await isImage(c)) return { image: c };
  }
  return { error: 'no og/twitter/ld image' };
}

const categories = process.argv.slice(2).length
  ? process.argv.slice(2)
  : ['turf', 'enclosures', 'hitting-mats', 'projectors', 'computers', 'launch-monitors'];

for (const c of categories) {
  const file = path.join('content', 'components', `${c}.json`);
  const data = JSON.parse(fs.readFileSync(file, 'utf8'));
  const entries = [...(data.products || []), ...(data.software || [])];
  let filled = 0;
  const misses = [];
  for (const p of entries) {
    if (p.image_url && /^https:\/\//i.test(p.image_url)) continue;
    let found = null;
    let lastErr = '';
    for (const u of [p.direct_url, p.fallback_url, p.read_url]) {
      if (!u) continue;
      const r = await findImage(u);
      if (r?.image) {
        found = r.image;
        break;
      }
      lastErr = r?.error || lastErr;
    }
    if (found) {
      p.image_url = found;
      filled++;
      console.log(`  + ${c}: ${p.brand} ${p.name} <- ${found.slice(0, 90)}`);
    } else {
      misses.push(`${p.brand} ${p.name} (${lastErr || 'no page url'})`);
    }
  }
  fs.writeFileSync(file, JSON.stringify(data, null, 2) + '\n');
  console.log(`${c}: filled ${filled}, still missing ${misses.length}${misses.length ? ': ' + misses.join('; ') : ''}`);
}
