export {};
/**
 * Debug script for YouTube pipeline - diagnose why products are missed.
 * Usage: npx tsx scripts/debug-youtube-pipeline.ts
 */

import { fetchYouTubeTranscript, formatTimestamp } from '../lib/contentIdeas/transcript';
import { runVideoPipeline } from '../lib/videoPipeline';
import type { PipelineEvent, DraftProduct } from '../lib/videoPipeline/types';

const VIDEO_URL = 'https://www.youtube.com/watch?v=FseNrxffbCc';
const VIDEO_ID = 'FseNrxffbCc';

const EXPECTED_PRODUCTS = [
  'Callaway Opus SP Wedges',
  'Callaway Apex TCB Irons',
  'Callaway Apex UT Utility Irons',
  'Callaway Triple Diamond 3 Wood',
  'Callaway AI One 7T Milled Putter',
  'Callaway Chrome Tour Triple Diamond Balls',
];

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  STAGE 1: Check Raw Transcript');
  console.log('═══════════════════════════════════════════════════════\n');

  const result = await fetchYouTubeTranscript(VIDEO_ID);
  if (!result.success || result.segments.length === 0) {
    console.log('NO TRANSCRIPT FOUND:', result.error);
    return;
  }
  const segments = result.segments;
  console.log(`Transcript entries: ${segments.length}`);

  // Build timestamped version
  const timestamped = segments.map(e => {
    const ts = formatTimestamp(e.offset);
    return `[${ts}] ${e.text}`;
  }).join('\n');

  console.log(`Full transcript length: ${timestamped.length} chars`);
  console.log(`8K truncation cuts at: ~${Math.round((8000 / timestamped.length) * 100)}% through\n`);

  // Search for key product terms
  const keywords = ['opus', 'wedge', 'tcb', 'apex', 'utility', 'triple diamond', 'putter', 'ai one', 'chrome tour', '3 wood', 'fairway', 'iron'];

  console.log('=== KEYWORD MATCHES IN TRANSCRIPT ===');
  for (const entry of segments) {
    const text = entry.text.toLowerCase();
    for (const kw of keywords) {
      if (text.includes(kw)) {
        const ts = formatTimestamp(entry.offset);
        console.log(`  [${ts}] ${entry.text}  (matched: ${kw})`);
        break; // Only print once per entry
      }
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  STAGE 2: Run Full Pipeline');
  console.log('═══════════════════════════════════════════════════════\n');

  const startTime = Date.now();
  let products: DraftProduct[] = [];

  for await (const event of runVideoPipeline(VIDEO_URL)) {
    switch (event.type) {
      case 'stage_started':
        console.log(`\n▶ ${event.stage}: ${event.message}`);
        break;
      case 'stage_completed':
        console.log(`  ✅ ${event.message} (${((event.durationMs || 0) / 1000).toFixed(1)}s)`);
        break;
      case 'stage_skipped':
        console.log(`  ⏭ ${event.stage}: ${event.reason}`);
        break;
      case 'stage_failed':
        console.log(`  ❌ ${event.stage}: ${event.error}`);
        break;
      case 'pipeline_complete':
        products = event.result.draftBag.products;
        console.log(`\n═══ Pipeline complete in ${((Date.now() - startTime) / 1000).toFixed(1)}s ═══`);
        console.log(`  Stats: ${JSON.stringify(event.result.stats, null, 2)}`);
        break;
      case 'pipeline_error':
        console.error(`\n💥 Pipeline error: ${event.error}`);
        return;
    }
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  RESULTS');
  console.log('═══════════════════════════════════════════════════════\n');

  for (const p of products) {
    const sources = p.sources.join('+');
    const hasFrame = p.videoFrameUrl ? '🎬' : '  ';
    const hasImage = p.productImageUrl ? '🖼️' : '  ';
    console.log(`  [${p.confidence}%] [${sources}] ${p.brand || '???'} — ${p.name}`);
    console.log(`    ${hasFrame} frame  ${hasImage} image  context: "${(p.description || '').slice(0, 60)}"`);
  }

  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  EXPECTED PRODUCT CHECK');
  console.log('═══════════════════════════════════════════════════════\n');

  let found = 0;
  for (const expected of EXPECTED_PRODUCTS) {
    const expLower = expected.toLowerCase();
    const expWords = expLower.split(/\s+/).filter(w => w.length > 2);

    const match = products.find(p => {
      const pFull = `${p.brand || ''} ${p.name}`.toLowerCase();
      return expWords.filter(w => pFull.includes(w)).length >= 2;
    });

    if (match) {
      found++;
      console.log(`  ✅ ${expected}`);
      console.log(`     → ${match.brand || '?'} ${match.name} [${match.sources.join('+')}]`);
    } else {
      console.log(`  ❌ ${expected} — NOT FOUND`);
    }
  }

  console.log(`\n  Result: ${found}/${EXPECTED_PRODUCTS.length} expected products found`);
}

main().catch(console.error);
