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
  const urls = sp.getAll('u').slice(0, 25);
  const skipFirecrawl = sp.get('firecrawl') === '0';
  const skipLibrary = sp.get('library') === '0';
  const started = Date.now();
  const out: unknown[] = [];
  for (let i = 0; i < urls.length; i += 5) {
    const batch = urls.slice(i, i + 5);
    const results = await Promise.all(
      batch.map(async (u) => {
        try {
          const r = await identifyProduct(u, { fetchTimeout: 5000, earlyExitConfidence: 0.85, skipFirecrawl, skipLibrary });
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
