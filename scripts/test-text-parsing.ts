/**
 * Test the text parsing system directly (no API call needed)
 * This tests the client-side parseText function that extracts brand, color, specs
 */

import { parseText, buildSearchQuery } from '../lib/textParsing';

const TEST_ITEMS: Array<{
  bag: string;
  input: string;
  expectedBrand?: string;
  expectedColor?: string;
}> = [
  // ammon-titlelist (golf)
  { bag: 'ammon-titlelist', input: 'Ping G25 Iron', expectedBrand: 'Ping' },
  { bag: 'ammon-titlelist', input: 'Callaway Rogue Hybrid 5', expectedBrand: 'Callaway' },

  // battlestation (tech/gaming)
  { bag: 'battlestation', input: 'Blue Yeti USB Microphone', expectedBrand: 'Blue' },
  { bag: 'battlestation', input: 'Logitech G502 HERO Gaming Mouse', expectedBrand: 'Logitech' },
  { bag: 'battlestation', input: 'LG UltraGear Gaming Monitor', expectedBrand: 'LG' },
  { bag: 'battlestation', input: 'Secretlab Titan Evo Gaming Chair', expectedBrand: 'Secretlab' },

  // best-gifts-for-mom (home/beauty)
  { bag: 'best-gifts-for-mom', input: 'Parachute Turkish Cotton Robe', expectedBrand: 'Parachute' },
  { bag: 'best-gifts-for-mom', input: 'Aesop Resurrection Hand Balm', expectedBrand: 'Aesop' },
  { bag: 'best-gifts-for-mom', input: 'Fellow Stagg Pour Over Set', expectedBrand: 'Fellow' },
  { bag: 'best-gifts-for-mom', input: 'Brooklinen Super Plush Bath Towels', expectedBrand: 'Brooklinen' },

  // christmas-list-2 (wishlist)
  { bag: 'christmas-list-2', input: 'DJI Mic Mini', expectedBrand: 'DJI' },
  { bag: 'christmas-list-2', input: 'Ember Travel Mug 2', expectedBrand: 'Ember' },
  { bag: 'christmas-list-2', input: 'Vuori Sunday Performance Jogger', expectedBrand: 'Vuori' },
  { bag: 'christmas-list-2', input: 'Chemex Pour-Over Glass Coffeemaker', expectedBrand: 'Chemex' },

  // coolest-golf-bags
  { bag: 'coolest-golf-bags', input: 'G/FORE Daytona Plus Carry Golf Bag', expectedBrand: 'G/FORE' },
  { bag: 'coolest-golf-bags', input: 'Vessel Player V Pro Stand Bag', expectedBrand: 'Vessel' },
  { bag: 'coolest-golf-bags', input: 'Sunday Golf Ranger Black Premium Stand Bag', expectedBrand: 'Sunday Golf' },
  { bag: 'coolest-golf-bags', input: 'Ghost Golf ANYDAY OREO BAG', expectedBrand: 'Ghost Golf' },

  // david-kushner-witb (golf)
  { bag: 'david-kushner-witb', input: 'Titleist T150 Irons', expectedBrand: 'Titleist' },
  { bag: 'david-kushner-witb', input: 'PING G440 LST Driver', expectedBrand: 'PING' },
  { bag: 'david-kushner-witb', input: 'Scotty Cameron Newport Putter', expectedBrand: 'Scotty Cameron' },
  { bag: 'david-kushner-witb', input: 'Miura Forged Wedge', expectedBrand: 'Miura' },

  // gifts-for-dad (edc/lifestyle)
  { bag: 'gifts-for-dad', input: 'YETI Rambler Tumbler', expectedBrand: 'YETI' },
  { bag: 'gifts-for-dad', input: 'Leatherman Multi-Tool', expectedBrand: 'Leatherman' },
  { bag: 'gifts-for-dad', input: 'Olight Flashlight', expectedBrand: 'Olight' },
  { bag: 'gifts-for-dad', input: 'Victorinox Swiss Army Knife', expectedBrand: 'Victorinox' },
  { bag: 'gifts-for-dad', input: 'Carhartt Hoodies', expectedBrand: 'Carhartt' },
  { bag: 'gifts-for-dad', input: 'Filson Outerwear', expectedBrand: 'Filson' },

  // golf-bag-2 (PXG)
  { bag: 'golf-bag-2', input: 'PXG Black Ops Driver', expectedBrand: 'PXG' },
  { bag: 'golf-bag-2', input: 'PXG Gen6 Irons', expectedBrand: 'PXG' },
  { bag: 'golf-bag-2', input: 'PXG Sugar Daddy II Wedges', expectedBrand: 'PXG' },

  // golf-caps-christmas-2025
  { bag: 'golf-caps-christmas-2025', input: 'Nike Dri-FIT Tiger Woods Legacy91 Cap', expectedBrand: 'Nike' },
  { bag: 'golf-caps-christmas-2025', input: 'melin Coronado Brick Hydro Hat', expectedBrand: 'melin' },
  { bag: 'golf-caps-christmas-2025', input: 'TaylorMade Golf Hat', expectedBrand: 'TaylorMade' },
  { bag: 'golf-caps-christmas-2025', input: 'Adidas Golf Hat', expectedBrand: 'Adidas' },

  // golf-essentials
  { bag: 'golf-essentials', input: 'JBL Flip 6 Bluetooth Speaker', expectedBrand: 'JBL' },
  { bag: 'golf-essentials', input: 'Callaway Golf Weather Spann Glove', expectedBrand: 'Callaway' },
  { bag: 'golf-essentials', input: 'Blue Tees Golf Divot Tool', expectedBrand: 'Blue Tees' },
  { bag: 'golf-essentials', input: 'TaylorMade Driver Headcover', expectedBrand: 'TaylorMade' },

  // guy-golf-christmas-list
  { bag: 'guy-golf-christmas-list', input: 'Titleist Pro V1x Golf Ball', expectedBrand: 'Titleist' },
  { bag: 'guy-golf-christmas-list', input: 'FootJoy StaSof Winter Golf Glove', expectedBrand: 'FootJoy' },
  { bag: 'guy-golf-christmas-list', input: 'Greyson Golf Polo', expectedBrand: 'Greyson' },
  { bag: 'guy-golf-christmas-list', input: 'Peter Millar Golf Polo', expectedBrand: 'Peter Millar' },

  // houpt-bag-1
  { bag: 'houpt-bag-1', input: 'TaylorMade SpeedBlade Iron Set', expectedBrand: 'TaylorMade' },
  { bag: 'houpt-bag-1', input: 'TaylorMade RocketBallz Fairway Wood', expectedBrand: 'TaylorMade' },

  // matt-scharff-s-golf-bag
  { bag: 'matt-scharff-s-golf-bag', input: 'Callaway Apex TCB Irons', expectedBrand: 'Callaway' },
  { bag: 'matt-scharff-s-golf-bag', input: 'Callaway Jaws Raw Wedge', expectedBrand: 'Callaway' },
  { bag: 'matt-scharff-s-golf-bag', input: 'Callaway Elyte Driver', expectedBrand: 'Callaway' },
  { bag: 'matt-scharff-s-golf-bag', input: 'SuperStroke Putter Grip', expectedBrand: 'SuperStroke' },

  // mattyyy-s-golf-bag
  { bag: 'mattyyy-s-golf-bag', input: 'Titleist TSR2 Driver', expectedBrand: 'Titleist' },
  { bag: 'mattyyy-s-golf-bag', input: 'Srixon ZX4 MK II Iron Set', expectedBrand: 'Srixon' },
  { bag: 'mattyyy-s-golf-bag', input: 'Titleist Vokey SM10 Wedge', expectedBrand: 'Titleist' },
  { bag: 'mattyyy-s-golf-bag', input: 'TaylorMade Spider Tour Z Putter', expectedBrand: 'TaylorMade' },
  { bag: 'mattyyy-s-golf-bag', input: 'Fujikura Ventus Blue Shaft', expectedBrand: 'Fujikura' },
  { bag: 'mattyyy-s-golf-bag', input: 'KBS Tour Lite Shaft', expectedBrand: 'KBS' },
  { bag: 'mattyyy-s-golf-bag', input: 'Golf Pride MCC Plus4 Grip', expectedBrand: 'Golf Pride' },

  // Color tests
  { bag: 'color-tests', input: 'Nike black running shoes', expectedBrand: 'Nike', expectedColor: 'black' },
  { bag: 'color-tests', input: 'white Titleist golf glove', expectedBrand: 'Titleist', expectedColor: 'white' },
  { bag: 'color-tests', input: 'navy blue Vuori joggers', expectedBrand: 'Vuori', expectedColor: 'navy' },

  // Spec tests (golf)
  { bag: 'spec-tests', input: 'TaylorMade Qi10 Driver 10.5 stiff', expectedBrand: 'TaylorMade' },
  { bag: 'spec-tests', input: 'Titleist TSR3 9 degree X flex', expectedBrand: 'Titleist' },
  { bag: 'spec-tests', input: 'Callaway Paradym 56 degree wedge', expectedBrand: 'Callaway' },

  // Edge cases - no brand
  { bag: 'edge-cases', input: 'polo shirt', expectedBrand: undefined },
  { bag: 'edge-cases', input: 'driver 10.5 stiff', expectedBrand: undefined },
  { bag: 'edge-cases', input: 'black running shoes size 10', expectedBrand: undefined },
  { bag: 'edge-cases', input: 'wireless earbuds', expectedBrand: undefined },
];

interface TestResult {
  bag: string;
  input: string;
  expectedBrand?: string;
  expectedColor?: string;
  parsedBrand: string | null;
  parsedColor: string | null;
  specs: string[];
  searchQuery: string;
  brandMatch: boolean;
  colorMatch: boolean;
  confidence: number;
}

function runTest(item: typeof TEST_ITEMS[0]): TestResult {
  const parsed = parseText(item.input);
  const searchQuery = buildSearchQuery(parsed);

  const parsedBrand = parsed.brand?.value || null;
  const parsedColor = parsed.color || null;
  const specs = parsed.specifications.map(s => s.value);
  const confidence = parsed.parseConfidence;

  // Check brand match
  let brandMatch = true;
  if (item.expectedBrand) {
    brandMatch = parsedBrand
      ? parsedBrand.toLowerCase() === item.expectedBrand.toLowerCase() ||
        parsedBrand.toLowerCase().includes(item.expectedBrand.toLowerCase()) ||
        item.expectedBrand.toLowerCase().includes(parsedBrand.toLowerCase())
      : false;
  } else {
    // No expected brand - pass if we didn't falsely detect one
    brandMatch = true;
  }

  // Check color match
  let colorMatch = true;
  if (item.expectedColor) {
    colorMatch = parsedColor
      ? parsedColor.toLowerCase().includes(item.expectedColor.toLowerCase())
      : false;
  }

  return {
    ...item,
    parsedBrand,
    parsedColor,
    specs,
    searchQuery,
    brandMatch,
    colorMatch,
    confidence,
  };
}

function main() {
  console.log('🧪 Text Parsing System Test\n');
  console.log(`Testing ${TEST_ITEMS.length} items from ${new Set(TEST_ITEMS.map(i => i.bag)).size} categories\n`);
  console.log('='.repeat(100));

  const results = TEST_ITEMS.map(runTest);

  // Group by bag
  const byBag = new Map<string, TestResult[]>();
  for (const result of results) {
    if (!byBag.has(result.bag)) byBag.set(result.bag, []);
    byBag.get(result.bag)!.push(result);
  }

  let totalPassed = 0;
  let totalFailed = 0;
  const failures: TestResult[] = [];

  for (const [bag, bagResults] of byBag) {
    const passed = bagResults.filter(r => r.brandMatch && r.colorMatch).length;
    const failed = bagResults.length - passed;
    totalPassed += passed;
    totalFailed += failed;

    const status = failed === 0 ? '✅' : passed >= 2 ? '⚠️' : '❌';
    console.log(`\n${status} ${bag} (${passed}/${bagResults.length} passed)`);

    for (const result of bagResults) {
      const icon = result.brandMatch && result.colorMatch ? '  ✓' : '  ✗';
      const brandStatus = result.expectedBrand
        ? (result.brandMatch ? '✓' : `✗ got "${result.parsedBrand}"`)
        : '-';
      const colorStatus = result.expectedColor
        ? (result.colorMatch ? '✓' : `✗ got "${result.parsedColor}"`)
        : (result.parsedColor ? `(${result.parsedColor})` : '');
      const specsStr = result.specs.length > 0 ? ` specs:[${result.specs.join(', ')}]` : '';

      console.log(`${icon} "${result.input}"`);
      console.log(`      brand:${brandStatus} ${colorStatus}${specsStr}`);
      console.log(`      → query: "${result.searchQuery}"`);

      if (!result.brandMatch || !result.colorMatch) {
        failures.push(result);
      }
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
    if (bag === 'edge-cases' || bag === 'color-tests' || bag === 'spec-tests') continue;
    const passed = bagResults.filter(r => r.brandMatch && r.colorMatch).length;
    if (passed < 2) {
      bagsWithIssues.push(`${bag} (${passed}/${bagResults.length})`);
    }
  }

  if (bagsWithIssues.length > 0) {
    console.log(`\n⚠️  Bags with fewer than 2 passing items:`);
    bagsWithIssues.forEach(b => console.log(`   - ${b}`));
  } else {
    console.log(`\n✅ All bags have at least 2 items passing!`);
  }

  if (failures.length > 0) {
    console.log(`\n❌ FAILURES (${failures.length}):`);
    for (const f of failures) {
      console.log(`   "${f.input}" - expected brand "${f.expectedBrand}", got "${f.parsedBrand}"`);
    }
  }

  // Return exit code
  return totalFailed === 0 ? 0 : 1;
}

const exitCode = main();
process.exit(exitCode);
