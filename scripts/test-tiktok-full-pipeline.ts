export {};
/**
 * Full end-to-end TikTok pipeline test — simulates the actual API route.
 * Runs ALL stages including image enrichment, then compares to ground truth.
 *
 * Usage: npx tsx scripts/test-tiktok-full-pipeline.ts
 */

import { runVideoPipeline } from '../lib/videoPipeline';
import type { PipelineEvent, DraftProduct } from '../lib/videoPipeline/types';

const TIKTOK_URL = 'https://www.tiktok.com/t/ZP897tCDD/';

// Ground truth from the actual bag
const GROUND_TRUTH = [
  { name: 'Weight Stack Pin', brand: 'CZPZLLBNHH' },
  { name: 'Sport Mouth Guard', brand: 'Generic' },
  { name: 'Lifting Straps', brand: 'Gymreapers' },
  { name: 'Wrist Wraps', brand: 'Gymreapers' },
  { name: 'Elbow Wraps', brand: 'Gymreapers' },
  { name: 'Ankle/Wrist Cuffs', brand: 'Lights Mountain' },
  { name: 'GASP 27oz Shaker', brand: 'GASP' },
  { name: 'Klout Aminos EAA & BCAA', brand: 'Klout' },
  { name: 'Gatorade Sports Drink', brand: 'Gatorade' },
  { name: 'Knee Sleeves', brand: 'Gymreapers' },
  { name: 'AirPods Pro 2nd Gen', brand: 'Apple' },
  { name: 'Phone Tripod', brand: 'Liphisy' },
];

async function main() {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  FULL PIPELINE TEST: trstnn.lifts TikTok');
  console.log('═══════════════════════════════════════════════════════\n');

  const startTime = Date.now();
  let products: DraftProduct[] = [];

  for await (const event of runVideoPipeline(TIKTOK_URL)) {
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

  // Show all products
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  PIPELINE OUTPUT');
  console.log('═══════════════════════════════════════════════════════\n');

  for (const p of products) {
    const hasFrame = p.videoFrameUrl ? '🎬' : '  ';
    const hasImage = p.productImageUrl ? '🖼️' : '  ';
    const hasLinks = p.purchaseLinks.length > 0 ? '🔗' : '  ';
    console.log(`  [${p.confidence}%] ${p.brand || '???'} — ${p.name}`);
    console.log(`    ${hasFrame} frame  ${hasImage} product image  ${hasLinks} links`);
    if (p.productImageUrl) console.log(`    Image: ${p.productImageUrl.slice(0, 80)}...`);
    console.log();
  }

  // Compare to ground truth
  console.log('═══════════════════════════════════════════════════════');
  console.log('  GROUND TRUTH COMPARISON');
  console.log('═══════════════════════════════════════════════════════\n');

  let matchCount = 0;
  for (const gt of GROUND_TRUTH) {
    const match = products.find(p => {
      const pFull = `${p.brand || ''} ${p.name}`.toLowerCase();
      const gtLower = `${gt.brand} ${gt.name}`.toLowerCase();
      const gtWords = gtLower.replace(/[()\/&]/g, ' ').split(/\s+/).filter(w => w.length > 2);
      return gtWords.some(w => pFull.includes(w));
    });

    if (match) {
      matchCount++;
      const brandMatch = match.brand && gt.brand.toLowerCase() !== 'generic' && gt.brand.toLowerCase() !== 'czpzllbnhh'
        ? (match.brand.toLowerCase().includes(gt.brand.toLowerCase()) ? '✅brand' : `❌brand(got:${match.brand})`)
        : '—';
      const imageStatus = match.productImageUrl ? '✅img' : (match.videoFrameUrl ? '🎬frame' : '❌img');
      console.log(`  ✅ ${gt.brand} ${gt.name}`);
      console.log(`     → ${match.brand || '?'} ${match.name} | ${brandMatch} ${imageStatus}`);
    } else {
      console.log(`  ❌ ${gt.brand} ${gt.name} — NOT FOUND`);
    }
  }

  const pct = Math.round((matchCount / GROUND_TRUTH.length) * 100);
  console.log(`\n  Result: ${matchCount}/${GROUND_TRUTH.length} items found (${pct}%)`);
  console.log(`  Target: 75% (${Math.ceil(GROUND_TRUTH.length * 0.75)}/${GROUND_TRUTH.length})`);
  console.log(`  ${pct >= 75 ? '✅ TARGET MET' : '❌ Below target'}`);
}

main().catch(console.error);
