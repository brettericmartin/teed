/**
 * Comprehensive Identification System Test
 * Tests at least 2 items from each bag to ensure high confidence identification
 */

import { parseText, buildSearchQuery } from '../lib/textParsing';

// Test items from each bag - using custom_name as input (simulating what user would type)
const TEST_ITEMS: Array<{
  bag: string;
  input: string;
  expectedBrand?: string;
}> = [
  // ammon-titlelist (golf)
  { bag: 'ammon-titlelist', input: 'Ping G25 Iron', expectedBrand: 'Ping' },
  { bag: 'ammon-titlelist', input: 'Callaway Rogue Hybrid 5', expectedBrand: 'Callaway' },

  // battlestation (tech/gaming)
  { bag: 'battlestation', input: 'Blue Yeti USB Microphone', expectedBrand: 'Blue' },
  { bag: 'battlestation', input: 'Logitech G502 HERO Gaming Mouse', expectedBrand: 'Logitech' },
  { bag: 'battlestation', input: 'LG UltraGear Gaming Monitor', expectedBrand: 'LG' },

  // best-gifts-for-mom (home/beauty)
  { bag: 'best-gifts-for-mom', input: 'Parachute Turkish Cotton Robe', expectedBrand: 'Parachute' },
  { bag: 'best-gifts-for-mom', input: 'Aesop Resurrection Hand Balm', expectedBrand: 'Aesop' },
  { bag: 'best-gifts-for-mom', input: 'Fellow Stagg Pour Over Set', expectedBrand: 'Fellow' },

  // christmas-list-2 (wishlist)
  { bag: 'christmas-list-2', input: 'DJI Mic Mini', expectedBrand: 'DJI' },
  { bag: 'christmas-list-2', input: 'Ember Travel Mug 2', expectedBrand: 'Ember' },
  { bag: 'christmas-list-2', input: 'Vuori Sunday Performance Jogger', expectedBrand: 'Vuori' },

  // coolest-golf-bags
  { bag: 'coolest-golf-bags', input: 'G/FORE Daytona Plus Carry Golf Bag', expectedBrand: 'G/FORE' },
  { bag: 'coolest-golf-bags', input: 'Vessel Player V Pro Stand Bag', expectedBrand: 'Vessel' },
  { bag: 'coolest-golf-bags', input: 'Sunday Golf Ranger Black Premium Stand Bag', expectedBrand: 'Sunday Golf' },

  // david-kushner-witb (golf)
  { bag: 'david-kushner-witb', input: 'Titleist T150 Irons', expectedBrand: 'Titleist' },
  { bag: 'david-kushner-witb', input: 'PING G440 LST Driver', expectedBrand: 'PING' },
  { bag: 'david-kushner-witb', input: 'Scotty Cameron Newport Putter', expectedBrand: 'Scotty Cameron' },

  // gifts-for-dad (edc/lifestyle)
  { bag: 'gifts-for-dad', input: 'YETI Rambler Tumbler', expectedBrand: 'YETI' },
  { bag: 'gifts-for-dad', input: 'Leatherman Multi-Tool', expectedBrand: 'Leatherman' },
  { bag: 'gifts-for-dad', input: 'Olight Flashlight', expectedBrand: 'Olight' },
  { bag: 'gifts-for-dad', input: 'Victorinox Swiss Army Knife', expectedBrand: 'Victorinox' },

  // golf-bag-2 (PXG)
  { bag: 'golf-bag-2', input: 'PXG Black Ops Driver', expectedBrand: 'PXG' },
  { bag: 'golf-bag-2', input: 'PXG Gen6 Irons', expectedBrand: 'PXG' },

  // golf-caps-christmas-2025
  { bag: 'golf-caps-christmas-2025', input: 'Nike Dri-FIT Tiger Woods Legacy91 Cap', expectedBrand: 'Nike' },
  { bag: 'golf-caps-christmas-2025', input: 'melin Coronado Brick Hydro Hat', expectedBrand: 'melin' },
  { bag: 'golf-caps-christmas-2025', input: 'TaylorMade Golf Hat', expectedBrand: 'TaylorMade' },

  // golf-essentials
  { bag: 'golf-essentials', input: 'JBL Flip 6 Bluetooth Speaker', expectedBrand: 'JBL' },
  { bag: 'golf-essentials', input: 'Callaway Golf Weather Spann Glove', expectedBrand: 'Callaway' },
  { bag: 'golf-essentials', input: 'Blue Tees Golf Divot Tool', expectedBrand: 'Blue Tees' },

  // guy-golf-christmas-list-by-emilie
  { bag: 'guy-golf-christmas-list', input: 'Titleist Pro V1x Golf Ball', expectedBrand: 'Titleist' },
  { bag: 'guy-golf-christmas-list', input: 'FootJoy StaSof Winter Golf Glove', expectedBrand: 'FootJoy' },
  { bag: 'guy-golf-christmas-list', input: 'Greyson Golf Polo', expectedBrand: 'Greyson' },

  // houpt-bag-1
  { bag: 'houpt-bag-1', input: 'TaylorMade SpeedBlade Iron Set', expectedBrand: 'TaylorMade' },
  { bag: 'houpt-bag-1', input: 'TaylorMade RocketBallz Fairway Wood', expectedBrand: 'TaylorMade' },

  // matt-scharff-s-golf-bag
  { bag: 'matt-scharff-s-golf-bag', input: 'Callaway Apex TCB Irons', expectedBrand: 'Callaway' },
  { bag: 'matt-scharff-s-golf-bag', input: 'Callaway Jaws Raw Wedge', expectedBrand: 'Callaway' },
  { bag: 'matt-scharff-s-golf-bag', input: 'Callaway Elyte Driver', expectedBrand: 'Callaway' },

  // mattyyy-s-golf-bag
  { bag: 'mattyyy-s-golf-bag', input: 'Titleist TSR2 Driver', expectedBrand: 'Titleist' },
  { bag: 'mattyyy-s-golf-bag', input: 'Srixon ZX4 MK II Iron Set', expectedBrand: 'Srixon' },
  { bag: 'mattyyy-s-golf-bag', input: 'Titleist Vokey SM10 Wedge', expectedBrand: 'Titleist' },
  { bag: 'mattyyy-s-golf-bag', input: 'TaylorMade Spider Tour Z Putter', expectedBrand: 'TaylorMade' },

  // Additional edge cases
  { bag: 'edge-cases', input: 'polo shirt', expectedBrand: undefined }, // ambiguous
  { bag: 'edge-cases', input: 'driver 10.5 stiff', expectedBrand: undefined }, // no brand
  { bag: 'edge-cases', input: 'black running shoes size 10', expectedBrand: undefined }, // generic
];

interface TestResult {
  bag: string;
  input: string;
  expectedBrand?: string;
  parsedBrand: string | null;
  identifiedBrand: string;
  identifiedName: string;
  confidence: number;
  passed: boolean;
  error?: string;
}

async function testIdentification(item: typeof TEST_ITEMS[0]): Promise<TestResult> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  try {
    // First, test the local parsing
    const parsed = parseText(item.input);
    const parsedBrand = parsed.brand?.value || null;

    // Call the enrich-item API
    const response = await fetch(`${baseUrl}/api/ai/enrich-item`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ input: item.input }),
    });

    if (!response.ok) {
      return {
        ...item,
        parsedBrand,
        identifiedBrand: '',
        identifiedName: '',
        confidence: 0,
        passed: false,
        error: `API error: ${response.status}`,
      };
    }

    const data = await response.json();

    const identifiedBrand = data.enriched?.brand || '';
    const identifiedName = data.enriched?.custom_name || '';
    const confidence = data.confidence || 0;

    // Check if passed - brand matches (if expected) and confidence >= 75%
    let passed = confidence >= 0.75;
    if (item.expectedBrand && passed) {
      passed = identifiedBrand.toLowerCase().includes(item.expectedBrand.toLowerCase()) ||
               item.expectedBrand.toLowerCase().includes(identifiedBrand.toLowerCase());
    }

    return {
      ...item,
      parsedBrand,
      identifiedBrand,
      identifiedName,
      confidence,
      passed,
    };
  } catch (error) {
    return {
      ...item,
      parsedBrand: null,
      identifiedBrand: '',
      identifiedName: '',
      confidence: 0,
      passed: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function runTests() {
  console.log('🧪 Running Comprehensive Identification Tests\n');
  console.log(`Testing ${TEST_ITEMS.length} items from ${new Set(TEST_ITEMS.map(i => i.bag)).size} bags\n`);
  console.log('='.repeat(100));

  const results: TestResult[] = [];

  // Run tests in batches to avoid overwhelming the API
  const batchSize = 5;
  for (let i = 0; i < TEST_ITEMS.length; i += batchSize) {
    const batch = TEST_ITEMS.slice(i, i + batchSize);
    const batchResults = await Promise.all(batch.map(testIdentification));
    results.push(...batchResults);

    // Progress indicator
    console.log(`Progress: ${Math.min(i + batchSize, TEST_ITEMS.length)}/${TEST_ITEMS.length}`);
  }

  console.log('\n' + '='.repeat(100));
  console.log('\n📊 RESULTS BY BAG\n');

  // Group by bag
  const byBag = new Map<string, TestResult[]>();
  for (const result of results) {
    const bag = result.bag;
    if (!byBag.has(bag)) byBag.set(bag, []);
    byBag.get(bag)!.push(result);
  }

  let totalPassed = 0;
  let totalFailed = 0;

  for (const [bag, bagResults] of byBag) {
    const passed = bagResults.filter(r => r.passed).length;
    const failed = bagResults.filter(r => !r.passed).length;
    totalPassed += passed;
    totalFailed += failed;

    const status = failed === 0 ? '✅' : passed >= 2 ? '⚠️' : '❌';
    console.log(`\n${status} ${bag} (${passed}/${bagResults.length} passed)`);

    for (const result of bagResults) {
      const icon = result.passed ? '  ✓' : '  ✗';
      const conf = `${Math.round(result.confidence * 100)}%`;
      const brandMatch = result.expectedBrand
        ? (result.identifiedBrand.toLowerCase().includes(result.expectedBrand.toLowerCase()) ? '✓' : '✗')
        : '-';

      console.log(`${icon} "${result.input}"`);
      console.log(`      → ${result.identifiedBrand} ${result.identifiedName} [${conf}] brand:${brandMatch}`);
      if (result.error) console.log(`      ERROR: ${result.error}`);
    }
  }

  console.log('\n' + '='.repeat(100));
  console.log('\n📈 SUMMARY\n');
  console.log(`Total: ${results.length} items`);
  console.log(`Passed: ${totalPassed} (${Math.round(totalPassed / results.length * 100)}%)`);
  console.log(`Failed: ${totalFailed} (${Math.round(totalFailed / results.length * 100)}%)`);

  // Check if at least 2 items from each bag passed
  const bagsWithIssues: string[] = [];
  for (const [bag, bagResults] of byBag) {
    const passed = bagResults.filter(r => r.passed).length;
    if (passed < 2 && bag !== 'edge-cases') {
      bagsWithIssues.push(`${bag} (${passed}/${bagResults.length})`);
    }
  }

  if (bagsWithIssues.length > 0) {
    console.log(`\n⚠️  Bags with fewer than 2 passing items:`);
    bagsWithIssues.forEach(b => console.log(`   - ${b}`));
  } else {
    console.log(`\n✅ All bags have at least 2 items passing!`);
  }

  // Average confidence
  const avgConfidence = results.reduce((sum, r) => sum + r.confidence, 0) / results.length;
  console.log(`\nAverage confidence: ${Math.round(avgConfidence * 100)}%`);

  // Return exit code
  const successRate = totalPassed / results.length;
  return successRate >= 0.80 ? 0 : 1;
}

runTests()
  .then(exitCode => process.exit(exitCode))
  .catch(err => {
    console.error('Test runner failed:', err);
    process.exit(1);
  });
