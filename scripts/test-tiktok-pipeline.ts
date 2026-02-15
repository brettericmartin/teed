export {};
/**
 * Test the TikTok pipeline against the trstnn.lifts gym bag video.
 * Runs yt-dlp + ffmpeg + GPT-4o vision to identify products.
 *
 * Usage: npx tsx scripts/test-tiktok-pipeline.ts
 */

import { isTikTokUrl, fetchTikTokMetadata, downloadAndExtractFrames } from '../lib/videoPipeline/tiktokFrames';
import { analyzeTikTokFrames } from '../lib/videoPipeline/combinedAnalysis';

const TIKTOK_URL = 'https://www.tiktok.com/t/ZP897tCDD/';

// Ground truth: products manually identified in the bag
const GROUND_TRUTH = [
  'Weight Stack Pin / Gym Pin',
  'Sport Mouth Guard',
  'Lifting Straps (Gymreapers)',
  'Wrist Wraps (Gymreapers)',
  'Elbow Wraps (Gymreapers)',
  'Ankle/Wrist Cuffs',
  'GASP 27oz Shaker',
  'Klout Aminos EAA & BCAA',
  'Gatorade Sports Drink',
  'Knee Sleeves (Gymreapers)',
  'Apple AirPods Pro',
  'Phone Tripod',
];

async function main() {
  console.log('═══════════════════════════════════════════');
  console.log('  TikTok Pipeline Test: trstnn.lifts');
  console.log('═══════════════════════════════════════════\n');

  // 1. Check URL detection
  console.log(`Is TikTok URL: ${isTikTokUrl(TIKTOK_URL)}`);

  // 2. Fetch metadata
  console.log('\n--- Stage 1: Metadata ---');
  const meta = await fetchTikTokMetadata(TIKTOK_URL);
  if (!meta) {
    console.error('Failed to fetch metadata');
    return;
  }
  console.log(`  Title: ${meta.title}`);
  console.log(`  Creator: ${meta.creator}`);
  console.log(`  Duration: ${meta.duration}s`);
  console.log(`  Views: ${meta.viewCount}`);

  // 3. Download + extract frames
  console.log('\n--- Stage 4: Frame Extraction ---');
  const startExtract = Date.now();
  const frames = await downloadAndExtractFrames(TIKTOK_URL, 3, 40);
  console.log(`  Extracted ${frames.length} frames in ${Date.now() - startExtract}ms`);
  console.log(`  Frame sizes: ${frames[0]?.width}x${frames[0]?.height}`);

  // 4. Vision analysis
  console.log('\n--- Stage 4: Vision Analysis ---');
  const startVision = Date.now();
  const result = await analyzeTikTokFrames(
    frames.map(f => ({
      url: '',
      base64: f.base64,
      timestampFormatted: f.timestampFormatted,
    })),
    meta.title,
    meta.description,
    12,
  );
  console.log(`  Vision took ${Date.now() - startVision}ms`);
  console.log(`  Found ${result.products.length} products:\n`);

  // 5. Show results
  for (const p of result.products) {
    const confidence = p.confidence >= 90 ? '✅' : p.confidence >= 70 ? '🟡' : '🔴';
    console.log(`  ${confidence} [${p.confidence}%] ${p.brand || '?'} - ${p.name}`);
    console.log(`      Frame: ${p.frameTimestamp} | ${p.visualDescription?.slice(0, 80)}`);
  }

  // 6. Compare to ground truth
  console.log('\n═══════════════════════════════════════════');
  console.log('  GROUND TRUTH COMPARISON');
  console.log('═══════════════════════════════════════════\n');

  let matched = 0;
  for (const gt of GROUND_TRUTH) {
    const found = result.products.some(p => {
      const pFull = `${p.brand || ''} ${p.name}`.toLowerCase();
      const gtLower = gt.toLowerCase();
      // Check if any key words match
      const gtWords = gtLower.replace(/[()\/]/g, ' ').split(/\s+/).filter(w => w.length > 2);
      return gtWords.some(w => pFull.includes(w));
    });

    console.log(`  ${found ? '✅' : '❌'} ${gt}`);
    if (found) matched++;
  }

  const pct = Math.round((matched / GROUND_TRUTH.length) * 100);
  console.log(`\n  Result: ${matched}/${GROUND_TRUTH.length} (${pct}%)`);
  console.log(`  Target: 75% (${Math.ceil(GROUND_TRUTH.length * 0.75)}/${GROUND_TRUTH.length})`);
  console.log(`  ${pct >= 75 ? '✅ TARGET MET!' : '❌ Below target'}`);
}

main().catch(console.error);
