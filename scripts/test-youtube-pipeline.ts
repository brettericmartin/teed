/**
 * Test the video-to-bag pipeline against a specific YouTube video.
 * Prints each stage's results for debugging.
 *
 * Usage: set -a && source .env.local && set +a && npx tsx scripts/test-youtube-pipeline.ts [url]
 */

import { runVideoPipeline } from '../lib/videoPipeline';
import type { PipelineEvent, DraftProduct } from '../lib/videoPipeline/types';

const DEFAULT_URL = 'https://www.youtube.com/watch?v=FseNrxffbCc';
const videoUrl = process.argv[2] || DEFAULT_URL;

// Expected products for the default test video
const EXPECTED_PRODUCTS = [
  { brand: 'Callaway', name: 'Opus SP', category: 'wedge' },
  { brand: 'Callaway', name: 'Apex TCB', category: 'iron' },
  { brand: 'Callaway', name: 'Apex UT', category: 'utility iron' },
  { brand: 'Callaway', name: 'Elyte Triple Diamond', category: 'driver' },
  { brand: 'Callaway', name: 'Elyte Triple Diamond', category: 'fairway wood' },
  { brand: 'Callaway', name: 'AI ONE Milled 7T', category: 'putter' },
  { brand: 'Callaway', name: 'Chrome Tour Triple Diamond', category: 'ball' },
];

async function main() {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  Testing Video Pipeline`);
  console.log(`  URL: ${videoUrl}`);
  console.log(`${'═'.repeat(70)}\n`);

  const products: DraftProduct[] = [];
  let totalDurationMs = 0;

  for await (const event of runVideoPipeline(videoUrl)) {
    logEvent(event);

    if (event.type === 'product_found') {
      products.push(event.product);
    }
    if (event.type === 'pipeline_complete') {
      totalDurationMs = event.result.stats.totalDurationMs;
    }
    if (event.type === 'pipeline_error') {
      console.error(`\n❌ PIPELINE ERROR: ${event.error}\n`);
      process.exit(1);
    }
  }

  // Print results summary
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  RESULTS — ${products.length} products found (${(totalDurationMs / 1000).toFixed(1)}s)`);
  console.log(`${'═'.repeat(70)}\n`);

  for (const p of products) {
    const sources = p.sources.join('+');
    const hasFrame = p.videoFrameUrl ? '🖼️' : '  ';
    const hasImage = p.productImageUrl ? '📷' : '  ';
    const hasLink = p.purchaseLinks.length > 0 ? '🔗' : '  ';
    console.log(
      `  ${hasFrame}${hasImage}${hasLink} [${p.confidence}%] ${p.brand || '?'} — ${p.name}` +
      `  (${p.category || '?'}) [${sources}]` +
      (p.timestamp ? ` @${p.timestamp}` : ''),
    );
  }

  // Match against expected products
  if (videoUrl.includes('FseNrxffbCc')) {
    console.log(`\n${'─'.repeat(70)}`);
    console.log('  EXPECTED PRODUCT MATCHING');
    console.log(`${'─'.repeat(70)}\n`);

    let found = 0;
    let missing = 0;

    for (const expected of EXPECTED_PRODUCTS) {
      const match = products.find(p => {
        const pName = `${p.brand || ''} ${p.name}`.toLowerCase();
        const eName = `${expected.brand} ${expected.name}`.toLowerCase();

        // Check for substring match or significant word overlap
        if (pName.includes(eName) || eName.includes(pName)) return true;

        const pWords = new Set(pName.split(/\s+/).filter(w => w.length > 2));
        const eWords = new Set(eName.split(/\s+/).filter(w => w.length > 2));
        const overlap = [...eWords].filter(w => pWords.has(w)).length;
        return overlap >= 2;
      });

      if (match) {
        found++;
        console.log(`  ✅ ${expected.brand} ${expected.name} (${expected.category})`);
        console.log(`     → Matched: "${match.brand} ${match.name}" [${match.sources.join('+')}] ${match.confidence}%`);
      } else {
        missing++;
        console.log(`  ❌ ${expected.brand} ${expected.name} (${expected.category}) — NOT FOUND`);
      }
    }

    console.log(`\n  Score: ${found}/${EXPECTED_PRODUCTS.length} expected products found`);
    if (missing > 0) {
      console.log(`  Missing: ${missing} products need investigation`);
    } else {
      console.log(`  🎉 ALL EXPECTED PRODUCTS FOUND!`);
    }
  }

  console.log('');
}

function logEvent(event: PipelineEvent) {
  switch (event.type) {
    case 'stage_started':
      console.log(`  ⏳ [${event.stage}] ${event.message}`);
      break;
    case 'stage_completed':
      console.log(`  ✅ [${event.stage}] ${event.message} (${((event.durationMs || 0) / 1000).toFixed(1)}s)`);
      break;
    case 'stage_failed':
      console.log(`  ❌ [${event.stage}] ${event.error}`);
      break;
    case 'stage_skipped':
      console.log(`  ⏭️  [${event.stage}] ${event.reason}`);
      break;
    case 'metadata_ready':
      console.log(`  📺 "${event.metadata.title}" by ${event.metadata.channelName} (${event.metadata.durationSeconds}s)`);
      break;
    case 'pipeline_complete':
      console.log(`  🏁 Pipeline complete: ${event.result.stats.totalProducts} products in ${(event.result.stats.totalDurationMs / 1000).toFixed(1)}s`);
      break;
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
