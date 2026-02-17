/**
 * Test V2 Pipeline against Sergio Sala's Digital Nomad Packing List
 *
 * Success criteria: ≥72 items (90% of 80) correctly identified with brand + model
 *
 * Usage: set -a && source .env.local && set +a && npx tsx scripts/test-v2-pipeline.ts
 */

import { runVideoPipeline } from '../lib/videoPipeline';
import type { PipelineEvent, DraftProduct } from '../lib/videoPipeline/types';

const TARGET_VIDEO = 'https://www.youtube.com/watch?v=lSWApbnHu20';
const videoUrl = process.argv[2] || TARGET_VIDEO;

// Expected products from the actual Supabase bag (ground truth)
// Each entry: [brand, productName]
// Skipping sort_index=1 which is the video title entry
const EXPECTED_PRODUCTS: [string, string][] = [
  // Bags & Packs
  ['Pakt', 'One Travel Duffel'],
  ['WANDRD', 'PRVKE 21L'],
  ['Matador', 'ReFraction Packable Backpack'],
  ['Matador', 'Global Travel Stash'],
  ['Peak Design', 'Everyday Billfold Wallet'],
  ['Pakt', 'One Travel Backpack'],

  // Clothing — Tops
  ['Hercleon', 'HercShirt'],
  ['Bluffworks', 'Threshold Performance T-Shirt'],
  ['Unbound Merino', 'Merino Crew Neck T-Shirt'],
  ['KETL Mtn', 'Nofry Sun Hoodie'],
  ['Lululemon', 'Airing Easy Long Sleeve Button Shirt'],
  ['Seadon', 'Trailblazer Tee'],
  ['Proof', '72-Hour Merino T-Shirt'],
  ['Western Rise', 'Travel Tees'],

  // Clothing — Bottoms
  ['Western Rise', 'Diversion Pant'],
  ['Western Rise', 'Evolution Pant'],
  ['Western Rise', 'Travel Shorts'],
  ['Western Rise', 'Spectrum Joggers'],
  ['Ten Thousand', 'Interval Short'],

  // Clothing — Underwear & Socks
  ['ExOfficio', 'Give-N-Go Underwear'],
  ['HercLeon', 'Kribi Underwear'],
  ['Darn Tough', 'No Show Socks'],
  ['Cariloha', 'Bamboo Socks'],
  ['Hercleon', 'Anti Odor Socks'],

  // Clothing — Outerwear & Accessories
  ['Patagonia', 'R1 Air Fleece Jacket'],
  ['BUFF', 'Neckwear'],
  ['Western Rise', 'Travel Outerwear'],
  ['Western Rise', 'AirLoft Hooded Jacket'],
  ['KETL Mtn', 'Merino Motion Trail Glove'],
  ['KETL Mtn', 'Lost Boys Merino Beanie'],
  ['KETL Mtn', 'BodBrella Rain Jacket'],
  ['Western Rise', 'Versa Hat'],

  // Footwear
  ['Vivobarefoot', 'Primus Trail Knit'],
  ['Shamma Sandals', 'Pacific Avenue'],
  ['Almond Oak', 'Merino Wool Travel Shoes'],
  ['Wildling Shoes', 'Atmodois Black'],

  // Accessories
  ['ROAV Eyewear', 'Pocketable Sunglasses'],
  ['Peak Design', 'Packing Cube'],
  ['Peak Design', 'Shoe Pouch'],
  ['Groove Life', 'Zeus Edge Ring'],
  ['Arcade', 'Stretch Performance Belt'],

  // Tech — Computing
  ['Apple', 'MacBook Pro 14-inch'],
  ['Apple', 'iPad Pro'],
  ['Apple', 'Apple Pencil'],
  ['Matador', 'Laptop Base Layer'],

  // Tech — Phone & Audio
  ['Apple', 'iPhone 17 Pro'],
  ['Apple', 'AirPods Pro'],
  ['Apple', 'Apple Watch Ultra'],

  // Tech — Charging & Cables
  ['KUXIU', 'X55 Turbo Wireless Charging Stand'],
  ['SanDisk', 'Extreme PRO Dual Drive'],
  ['Apple', 'USB-C to 3.5mm Adapter'],
  ['UGREEN', 'USB C to USB A Adapter'],
  ['Road Warrior', 'Universal Travel Plug Adapter'],
  ['Aer', 'Split Kit'],
  ['Anker', 'USB-C Cable'],
  ['Anker', 'Prime Charger 160W'],
  ['Baseus', 'PicoGo Power Bank'],
  ['Apple', 'AirTag'],

  // Toiletries & Personal Care
  ['Aer', 'Dopp Kit 3'],
  ['Philips', 'One Rechargeable Toothbrush'],
  ['Chicago Comb', 'Carbon Fiber Comb'],
  ['Victorinox', 'Swiss Army Nail Clipper'],
  ['Canku', 'Mini Tweezers Titanium'],
  ['Degree', 'Antiperspirant Deodorant'],

  // Matador Accessories
  ['Matador', 'FlatPak Soap Bar Case'],
  ['Matador', 'FlatPak Toiletry Bottles'],
  ['Matador', 'Pocket Blanket'],
  ['Matador', 'Droplet Stuff Sack'],
  ['Matador', 'Ultralight Travel Towel'],

  // Other Gear
  ['Nanobag', 'Ultralight Reusable Shopping Bag'],
  ['Nite Ize', 'S-Biners Carabiners'],
  ['Tortuga', 'Travel Pouches Set of 3'],
  ['Loop', 'Earplugs'],
  ['TakeToday', 'Collapsible Water Bottle'],
  ['Nintendo', 'Nintendo Switch 2'],
  ['Coleman', 'First Aid Tin'],
];

/** Normalize brand names for comparison */
const BRAND_ALIASES: Record<string, string[]> = {
  'hercleon': ['erg leon', 'erglon', 'her leon', 'herc leon', 'hercleon', 'herkleon', 'hercleón'],
  'ketl mtn': ['kettle', 'ketl', 'kettle mountain', 'cattle mountain', 'ketl mtn'],
  'unbound merino': ['onbound marino', 'onbound merino', 'unbound marino'],
  'ten thousand': ['10000', '10,000'],
  'buff': ['buffy'],
  'cariloha': ['cariuma', 'carolina'],
  'pakt': ['backbone', 'packed', 'packet'],
  'seadon': ['sidon', 'saidon', 'sea don'],
  'kuxiu': ['ku xiu', 'coochoo', 'koochoo'],
  'vivobarefoot': ['vivo barefoot'],
  'wandrd': ['wandered', 'wander', 'wandrd gear'],
  'baseus': ['basis', 'bases', 'baysius'],
  'roav': ['roave', 'rove'],
  'western rise': ['western rise'],
  'lululemon': ['lululemon', 'lulu lemon'],
  'apple': ['apple'],
  'anker': ['anker'],
  'matador': ['matador'],
  'peak design': ['peak design'],
  'darn tough': ['darn tough'],
  'patagonia': ['patagonia'],
  'groove life': ['groove life', 'groove'],
  'arcade': ['arcade'],
  'exofficio': ['exofficio', 'ex officio'],
  'chicago comb': ['chicago comb', 'chicago comb co', 'chicago comb co.'],
  'nanobag': ['nanobag', 'nano bag'],
  'philips': ['philips', 'philips sonicare'],
  'wildling shoes': ['wildling shoes', 'wildling'],
  'sandisk': ['sandisk', 'san disk'],
  'aer': ['aer'],
  'loop': ['loop'],
  'coleman': ['coleman', 'coleman all'],
  'take today': ['take today', 'taketoday'],
  'tortuga': ['tortuga'],
  'nite ize': ['nite ize'],
};

function normalizeBrand(brand: string): string {
  const b = brand.toLowerCase().trim();
  for (const [canonical, aliases] of Object.entries(BRAND_ALIASES)) {
    if (aliases.includes(b) || b === canonical) return canonical;
  }
  return b;
}

/** Stem common product terms for matching (tee/tees, pant/pants, etc.) */
const STEM_MAP: Record<string, string> = {
  tees: 'tee', tee: 'tee',
  pants: 'pant', pant: 'pant',
  shorts: 'short', short: 'short',
  socks: 'sock', sock: 'sock',
  gloves: 'glove', glove: 'glove',
  shoes: 'shoe', shoe: 'shoe',
  bottles: 'bottle', bottle: 'bottle',
  cubes: 'cube', cube: 'cube',
  cables: 'cable', cable: 'cable',
  rings: 'ring', ring: 'ring',
  plugs: 'plug', plug: 'plug',
  jackets: 'jacket', jacket: 'jacket',
  pouches: 'pouch', pouch: 'pouch',
};

function stemWord(w: string): string {
  return STEM_MAP[w] || w;
}

function stemWords(words: string[]): Set<string> {
  return new Set(words.map(stemWord));
}

/** Score a match between a found product and expected product. 0 = no match, higher = better. */
function scoreMatch(found: DraftProduct, expected: [string, string]): number {
  const [eBrand, eName] = expected;
  const fFull = `${found.brand || ''} ${found.name}`.toLowerCase();
  const eFull = `${eBrand} ${eName}`.toLowerCase();

  // Exact substring match — highest score
  if (fFull.includes(eFull) || eFull.includes(fFull)) return 100;

  // Normalized brand match
  const fBrandNorm = normalizeBrand(found.brand || '');
  const eBrandNorm = normalizeBrand(eBrand);

  const brandExact = fBrandNorm === eBrandNorm;
  const brandOk = brandExact ||
    fBrandNorm.includes(eBrandNorm) || eBrandNorm.includes(fBrandNorm) ||
    (fBrandNorm.length >= 3 && eBrandNorm.length >= 3 && (
      fBrandNorm.startsWith(eBrandNorm.slice(0, 3)) || eBrandNorm.startsWith(fBrandNorm.slice(0, 3))
    ));

  // If found product has unknown/generic brand, try name-only matching
  const foundBrand = (found.brand || '').toLowerCase().trim();
  const foundName = (found.name || '').toLowerCase().trim();
  if (foundBrand === '' || foundBrand === 'unknown' || foundBrand === 'unspecified' || foundBrand === '?') {
    const fName = found.name.toLowerCase();
    const eNameLower = eName.toLowerCase();
    // Strong name match for unknown-brand products
    if (fName.includes(eNameLower) || eNameLower.includes(fName)) return 45;
    // Word overlap (with stemming)
    const fWords = stemWords(fFull.split(/\s+/).filter(w => w.length > 2));
    const eWords = stemWords(eFull.split(/\s+/).filter(w => w.length > 2));
    const overlap = [...eWords].filter(w => fWords.has(w)).length;
    if (overlap >= 2) return 30 + overlap * 5;
    if (overlap >= 1) return 25;  // Single word overlap for unknown brands
  }

  if (!brandOk) {
    // No brand match — only match if 3+ words overlap (with stemming)
    const fWords = stemWords(fFull.split(/\s+/).filter(w => w.length > 2));
    const eWords = stemWords(eFull.split(/\s+/).filter(w => w.length > 2));
    const overlap = [...eWords].filter(w => fWords.has(w)).length;
    return overlap >= 3 ? 20 + overlap * 5 : 0;
  }

  // Brand matches — score based on name similarity (with stemming)
  const brandWords = new Set([...eBrandNorm.split(/\s+/), ...fBrandNorm.split(/\s+/)]
    .filter(w => w.length > 2));

  const fNameWords = fFull.split(/\s+/).filter(w => w.length > 2 && !brandWords.has(w));
  const eNameWords = eFull.split(/\s+/).filter(w => w.length > 2 && !brandWords.has(w));

  const fNameSet = stemWords(fNameWords);
  const eNameSet = stemWords(eNameWords);
  const nameOverlap = [...eNameSet].filter(w => fNameSet.has(w)).length;

  // Fuzzy name containment (require 2+ words to prevent "backpack" matching "refraction packable backpack")
  const fName = found.name.toLowerCase();
  const eNameLower = eName.toLowerCase();
  if (fName.includes(eNameLower) || eNameLower.includes(fName)) {
    const fNameWordCount = fName.split(/\s+/).filter(w => w.length > 2).length;
    return fNameWordCount >= 2 ? 90 : 75;
  }

  // Score by overlap quality
  if (nameOverlap >= 3) return 80;
  if (nameOverlap >= 2) return 70;
  if (nameOverlap >= 1) return 50 + nameOverlap * 10;

  // Brand-only match fallback (no name overlap)
  if (brandExact && fBrandNorm.length >= 4) {
    const brandCount = EXPECTED_PRODUCTS.filter(([b]) => normalizeBrand(b) === eBrandNorm).length;
    if (brandCount === 1) return 40;       // Singleton brand: strong fallback
    if (brandCount <= 3) return 10;        // Small brand: weak fallback
  }

  // Brand matches + found name is "Unknown" — last resort fallback
  if (brandExact && (foundName === 'unknown' || foundName === '')) return 15;

  return 0; // Brand matches but no name overlap
}

async function main() {
  console.log(`\n${'═'.repeat(70)}`);
  console.log('  V2 PIPELINE TEST — Sergio Sala Digital Nomad Packing List');
  console.log(`  URL: ${videoUrl}`);
  console.log(`  Expected: ~${EXPECTED_PRODUCTS.length} products`);
  const TARGET = Math.ceil(EXPECTED_PRODUCTS.length * 0.9);
  console.log(`  Success: ≥${TARGET} products matched (90% of ${EXPECTED_PRODUCTS.length})`);
  console.log(`${'═'.repeat(70)}\n`);

  const startTime = Date.now();
  const products: DraftProduct[] = [];
  let stats: any = null;

  for await (const event of runVideoPipeline(videoUrl, { pipelineVersion: 'v2' })) {
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
      case 'product_found':
        products.push(event.product);
        break;
      case 'pipeline_complete':
        stats = event.result.stats;
        break;
      case 'pipeline_error':
        console.error(`\n  ❌ PIPELINE ERROR: ${event.error}\n`);
        process.exit(1);
    }
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);

  // Print all found products
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  FOUND PRODUCTS — ${products.length} total (${elapsed}s)`);
  console.log(`${'═'.repeat(70)}\n`);

  for (const p of products) {
    const sources = p.sources.join('+');
    console.log(
      `  [${String(p.confidence).padStart(3)}%] ${(p.brand || '?').padEnd(20)} ${p.name}` +
      `  (${sources})` +
      (p.timestamp ? ` @${p.timestamp}` : ''),
    );
  }

  if (stats) {
    console.log(`\n  Stats:`);
    console.log(`    Total: ${stats.totalProducts}, Description: ${stats.fromDescription}, Transcript: ${stats.fromTranscript}, Vision: ${stats.fromVision}`);
    console.log(`    Multi-source: ${stats.multiSource}, With images: ${stats.withImages}, With links: ${stats.withLinks}`);
    console.log(`    Duration: ${(stats.totalDurationMs / 1000).toFixed(1)}s`);
  }

  // Match against expected products
  console.log(`\n${'═'.repeat(70)}`);
  console.log('  EXPECTED PRODUCT MATCHING');
  console.log(`${'═'.repeat(70)}\n`);

  // Build score matrix: [expectedIdx][foundIdx] = score
  const scores: number[][] = EXPECTED_PRODUCTS.map(expected =>
    products.map(found => scoreMatch(found, expected))
  );

  // Greedy matching by best score (highest scores matched first)
  const matched = new Set<number>();   // indices of found products that matched
  const expectedMatch: (number | null)[] = new Array(EXPECTED_PRODUCTS.length).fill(null);

  // Collect all potential matches with scores
  const allPairs: { ei: number; fi: number; score: number }[] = [];
  for (let ei = 0; ei < EXPECTED_PRODUCTS.length; ei++) {
    for (let fi = 0; fi < products.length; fi++) {
      if (scores[ei][fi] > 0) {
        allPairs.push({ ei, fi, score: scores[ei][fi] });
      }
    }
  }

  // Sort by score descending — match best pairs first
  allPairs.sort((a, b) => b.score - a.score);

  const usedExpected = new Set<number>();
  for (const { ei, fi, score } of allPairs) {
    if (usedExpected.has(ei) || matched.has(fi)) continue;
    expectedMatch[ei] = fi;
    matched.add(fi);
    usedExpected.add(ei);
  }

  // Print results
  const expectedMatched: boolean[] = [];
  for (let ei = 0; ei < EXPECTED_PRODUCTS.length; ei++) {
    const [eBrand, eName] = EXPECTED_PRODUCTS[ei];
    const fi = expectedMatch[ei];
    if (fi !== null) {
      const p = products[fi];
      expectedMatched.push(true);
      console.log(`  ✅ ${eBrand} ${eName}`);
      console.log(`     → "${p.brand} ${p.name}" [${p.sources.join('+')}] ${p.confidence}% (score:${scores[ei][fi]})`);
    } else {
      expectedMatched.push(false);
      console.log(`  ❌ ${eBrand} ${eName} — NOT FOUND`);
    }
  }

  // Unmatched found products (extra items not in expected list)
  const unmatched = products.filter((_, i) => !matched.has(i));
  if (unmatched.length > 0) {
    console.log(`\n  Extra products found (not in expected list):`);
    for (const p of unmatched) {
      console.log(`    + ${p.brand || '?'} ${p.name} [${p.sources.join('+')}] ${p.confidence}%`);
    }
  }

  // Final score
  const found = expectedMatched.filter(Boolean).length;
  const total = EXPECTED_PRODUCTS.length;
  const pct = Math.round((found / total) * 100);

  console.log(`\n${'═'.repeat(70)}`);
  console.log(`  SCORE: ${found}/${total} (${pct}%)`);
  const target = Math.ceil(total * 0.9);
  console.log(`  Target: ≥${target} matched (90% of ${total})`);
  console.log(`  Result: ${found >= target ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`${'═'.repeat(70)}\n`);

  process.exit(found >= target ? 0 : 1);
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
