/**
 * TEMPORARY, preview deployments only: runs link identification on a list of
 * links so bulk add can be tested without a bag. Removed before merging.
 */
import { NextRequest, NextResponse } from 'next/server';
import { identifyProduct } from '@/lib/linkIdentification';

export const maxDuration = 300;
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  if (process.env.VERCEL_ENV !== 'preview') {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }
  const sp = request.nextUrl.searchParams;
  const diagAsin = sp.get('diag');
  if (diagAsin && /^[A-Z0-9]{10}$/.test(diagAsin)) {
    const probe = async (label: string, url: string, init: RequestInit = {}) => {
      const t = Date.now();
      try {
        const r = await fetch(url, { ...init, signal: AbortSignal.timeout(12000) });
        const body = await r.text();
        const title = body.match(/<title>([^<]{0,160})/i)?.[1] || null;
        return { label, status: r.status, len: body.length, ms: Date.now() - t, title, head: title ? null : body.slice(0, 300).replace(/AIza[\w-]+/g, '[key]') };
      } catch (e) {
        return { label, error: e instanceof Error ? e.message : String(e), ms: Date.now() - t };
      }
    };
    const ua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
    const key = process.env.GOOGLE_SEARCH_API_KEY || '';
    const cx = process.env.GOOGLE_SEARCH_ENGINE_ID || '';
    const results = await Promise.all([
      probe('amazon_mobile', `https://www.amazon.com/dp/${diagAsin}`, { headers: { 'User-Agent': ua, Accept: 'text/html', 'Accept-Language': 'en-US,en;q=0.9' } }),
      probe('amazon_desktop', `https://www.amazon.com/dp/${diagAsin}`, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36', Accept: 'text/html', 'Accept-Language': 'en-US,en;q=0.9' } }),
      probe('amazon_aw', `https://www.amazon.com/gp/aw/d/${diagAsin}`, { headers: { 'User-Agent': ua, Accept: 'text/html' } }),
      probe('jina', `https://r.jina.ai/https://www.amazon.com/dp/${diagAsin}`, { headers: { Accept: 'application/json' } }),
      probe('cse_web', `https://www.googleapis.com/customsearch/v1?key=${key}&cx=${cx}&q=${diagAsin}&num=3`),
    ]);
    return NextResponse.json({ hasKey: !!key, hasCx: !!cx, results });
  }
  const urls = sp.getAll('u').slice(0, 25);
  const hintList = sp.getAll("h");
  const skipFirecrawl = sp.get('firecrawl') === '0';
  const skipLibrary = sp.get('library') === '0';
  const started = Date.now();
  const out: unknown[] = [];
  for (let i = 0; i < urls.length; i += 5) {
    const batch = urls.slice(i, i + 5);
    const results = await Promise.all(
      batch.map(async (u) => {
        try {
          const r = await identifyProduct(u, { fetchTimeout: 5000, earlyExitConfidence: 0.85, skipFirecrawl, skipLibrary, hint: hintList[urls.indexOf(u)] || null });
          return {
            url: u,
            name: r.fullName,
            brand: r.brand,
            confidence: r.confidence,
            status: r.confidence >= 0.7 ? 'success' : r.confidence >= 0.4 ? 'partial' : 'failed',
            source: r.primarySource,
            sources: r.sources.join('>'),
            image: r.imageUrl ? r.imageUrl.slice(0, 80) : null,
            resolved: r.resolvedUrl || null,
            reason: r.failureReason || null,
            ms: r.processingTimeMs,
          };
        } catch (e) {
          return { url: u, error: e instanceof Error ? e.message : String(e) };
        }
      })
    );
    out.push(...results);
  }
  return NextResponse.json({ skipFirecrawl, skipLibrary, totalMs: Date.now() - started, results: out });
}
