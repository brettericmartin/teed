#!/usr/bin/env npx tsx
/**
 * Identification System Test Script
 *
 * Tests the enrich-item API against real items from bags on the site.
 * Types ~80% of each item's name and checks if the system recognizes it.
 */

import 'dotenv/config';

const API_URL = 'http://localhost:3000/api/ai/enrich-item';

interface TestCase {
  bag: string;
  category: string;
  originalName: string;
  originalBrand: string | null;
  testInput: string; // ~80% of the name
}

// Test cases from real bags - at least 2 per category
const TEST_CASES: TestCase[] = [
  // ========== GOLF EQUIPMENT ==========
  {
    bag: "Mattyyy's Golf Bag",
    category: 'Golf - Drivers',
    originalName: 'TSR2 Driver',
    originalBrand: 'Titleist',
    testInput: 'Titleist TSR2 Dr', // ~80%
  },
  {
    bag: "Mattyyy's Golf Bag",
    category: 'Golf - Drivers',
    originalName: 'SIM2 Max Fairway 3-Wood',
    originalBrand: 'TaylorMade',
    testInput: 'TaylorMade SIM2 Max Fairwa', // ~80%
  },
  {
    bag: "Mattyyy's Golf Bag",
    category: 'Golf - Irons',
    originalName: 'ZX4 MK II Iron Set',
    originalBrand: 'Srixon',
    testInput: 'Srixon ZX4 MK II Iro', // ~80%
  },
  {
    bag: "Mattyyy's Golf Bag",
    category: 'Golf - Wedges',
    originalName: 'Vokey SM10 Wedge',
    originalBrand: 'Titleist',
    testInput: 'Titleist Vokey SM10', // ~80%
  },
  {
    bag: "Mattyyy's Golf Bag",
    category: 'Golf - Putters',
    originalName: 'Spider Tour Z Putter',
    originalBrand: 'TaylorMade',
    testInput: 'TaylorMade Spider Tour Z', // ~80%
  },
  {
    bag: "Mattyyy's Golf Bag",
    category: 'Golf - Shafts',
    originalName: 'HZRDUS Black 4G Shaft',
    originalBrand: 'Project X',
    testInput: 'Project X HZRDUS Black', // ~80%
  },

  // ========== GOLF APPAREL ==========
  {
    bag: 'Golf Caps - Christmas 2025',
    category: 'Golf - Hats',
    originalName: 'Dri-FIT Tiger Woods Legacy91 Cap',
    originalBrand: 'Nike',
    testInput: 'Nike Dri-FIT Tiger Woods Legacy', // ~80%
  },
  {
    bag: 'Golf Caps - Christmas 2025',
    category: 'Golf - Hats',
    originalName: 'Melin Coronado Brick Hydro Black Gum',
    originalBrand: 'melin',
    testInput: 'Melin Coronado Brick Hydro Bla', // ~80%
  },

  // ========== TECH/GAMING ==========
  {
    bag: 'Battlestation',
    category: 'Tech - Mouse',
    originalName: 'Logitech G502 HERO Gaming Mouse',
    originalBrand: 'Logitech',
    testInput: 'Logitech G502 HERO Gaming', // ~80%
  },
  {
    bag: 'Battlestation',
    category: 'Tech - Keyboard',
    originalName: 'Logitech G915 TKL Wireless Mechanical Gaming Keyboard',
    originalBrand: 'Logitech',
    testInput: 'Logitech G915 TKL Wireless Mechanical Gam', // ~80%
  },
  {
    bag: 'Battlestation',
    category: 'Tech - Monitor',
    originalName: 'LG UltraGear Gaming Monitor',
    originalBrand: 'LG',
    testInput: 'LG UltraGear Gaming Mon', // ~80%
  },
  {
    bag: 'Battlestation',
    category: 'Tech - Audio',
    originalName: 'Blue Yeti USB Microphone',
    originalBrand: 'Blue',
    testInput: 'Blue Yeti USB Micropho', // ~80%
  },

  // ========== CAMERA/PHOTOGRAPHY ==========
  {
    bag: "MKBHD's Studio Setup",
    category: 'Photography - Camera',
    originalName: 'EOS R5',
    originalBrand: 'Canon',
    testInput: 'Canon EOS R', // ~80%
  },
  {
    bag: "MKBHD's Studio Setup",
    category: 'Photography - Camera',
    originalName: 'V-RAPTOR 8K VV',
    originalBrand: 'RED',
    testInput: 'RED V-RAPTOR 8K', // ~80%
  },
  {
    bag: "Peter McKinnon's Camera Bag 2025",
    category: 'Photography - Lens',
    originalName: 'RF 15-35mm F2.8 L IS USM',
    originalBrand: 'Canon',
    testInput: 'Canon RF 15-35mm F2.8', // ~80%
  },
  {
    bag: "Peter McKinnon's Camera Bag 2025",
    category: 'Photography - Lens',
    originalName: 'RF 70-200mm F2.8 L IS USM',
    originalBrand: 'Canon',
    testInput: 'Canon RF 70-200mm F2.8', // ~80%
  },
  {
    bag: "MKBHD's Studio Setup",
    category: 'Photography - Lighting',
    originalName: 'SkyPanel S60-C',
    originalBrand: 'ARRI',
    testInput: 'ARRI SkyPanel S60', // ~80%
  },
  {
    bag: "MKBHD's Studio Setup",
    category: 'Photography - Audio',
    originalName: 'MKH 416 Shotgun Microphone',
    originalBrand: 'Sennheiser',
    testInput: 'Sennheiser MKH 416 Shotgun', // ~80%
  },

  // ========== HOME/LIFESTYLE ==========
  {
    bag: 'Best Gifts for Mom',
    category: 'Home - Bath',
    originalName: 'Turkish Cotton Robe',
    originalBrand: 'Parachute',
    testInput: 'Parachute Turkish Cotton', // ~80%
  },
  {
    bag: 'Best Gifts for Mom',
    category: 'Home - Bath',
    originalName: 'Brooklinen Super Plush Bath Towels',
    originalBrand: 'Brooklinen',
    testInput: 'Brooklinen Super Plush Bath', // ~80%
  },
  {
    bag: 'Best Gifts for Mom',
    category: 'Home - Beauty',
    originalName: 'Resurrection Hand Balm',
    originalBrand: 'Aesop',
    testInput: 'Aesop Resurrection Hand', // ~80%
  },
  {
    bag: 'Best Gifts for Mom',
    category: 'Home - Coffee',
    originalName: 'Fellow Stagg Xf Pour Over Set',
    originalBrand: 'Fellow',
    testInput: 'Fellow Stagg Xf Pour Over', // ~80%
  },

  // ========== EDC ==========
  {
    bag: 'Gifts for Dad',
    category: 'EDC - Knife',
    originalName: 'Victorinox Swiss Army Knife™ and Tools',
    originalBrand: 'Victorinox',
    testInput: 'Victorinox Swiss Army Kni', // ~80%
  },
  {
    bag: 'Gifts for Dad',
    category: 'EDC - Multi-tool',
    originalName: 'Leatherman Multi-Tools',
    originalBrand: 'Leatherman',
    testInput: 'Leatherman Multi-Too', // ~80%
  },
  {
    bag: 'Gifts for Dad',
    category: 'EDC - Flashlight',
    originalName: 'Flashlights',
    originalBrand: 'Olight Store',
    testInput: 'Olight Flashligh', // ~80%
  },

  // ========== DRINKWARE ==========
  {
    bag: 'Gifts for Dad',
    category: 'Drinkware',
    originalName: 'YETI Drinkware',
    originalBrand: 'YETI',
    testInput: 'YETI Drinkwa', // ~80%
  },
  {
    bag: 'Gifts for Dad',
    category: 'Drinkware',
    originalName: 'Temperature Control Smart Mug',
    originalBrand: 'Ember',
    testInput: 'Ember Temperature Control Smar', // ~80%
  },

  // ========== OFFICE/FURNITURE ==========
  {
    bag: "MKBHD's Studio Setup",
    category: 'Office - Chair',
    originalName: 'Embody Chair',
    originalBrand: 'Herman Miller',
    testInput: 'Herman Miller Embody Cha', // ~80%
  },
  {
    bag: 'Battlestation',
    category: 'Office - Chair',
    originalName: 'Secretlab Titan Evo 2022 Gaming Chair',
    originalBrand: 'Secretlab',
    testInput: 'Secretlab Titan Evo 2022 Gami', // ~80%
  },
];

interface TestResult {
  testCase: TestCase;
  success: boolean;
  confidence: number;
  matchedName: string | null;
  matchedBrand: string | null;
  searchTier: string;
  error?: string;
}

async function runTest(testCase: TestCase): Promise<TestResult> {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userInput: testCase.testInput,
      }),
    });

    if (!response.ok) {
      return {
        testCase,
        success: false,
        confidence: 0,
        matchedName: null,
        matchedBrand: null,
        searchTier: 'error',
        error: `HTTP ${response.status}`,
      };
    }

    const data = await response.json();
    const suggestions = data.suggestions || [];
    const topSuggestion = suggestions[0];

    if (!topSuggestion) {
      return {
        testCase,
        success: false,
        confidence: 0,
        matchedName: null,
        matchedBrand: null,
        searchTier: data.searchTier || 'none',
        error: 'No suggestions returned',
      };
    }

    // Check if matched
    const matchedName = topSuggestion.custom_name;
    const matchedBrand = topSuggestion.brand;
    const confidence = topSuggestion.confidence;

    // Determine success - check if the result is reasonably similar
    const originalLower = testCase.originalName.toLowerCase();
    const matchedLower = matchedName.toLowerCase();

    // Success if:
    // 1. Brand matches (if we have one) AND
    // 2. Name contains key words from original OR confidence > 0.7
    const brandMatches =
      !testCase.originalBrand ||
      !matchedBrand ||
      matchedBrand.toLowerCase() === testCase.originalBrand.toLowerCase() ||
      matchedBrand.toLowerCase().includes(testCase.originalBrand.toLowerCase()) ||
      testCase.originalBrand.toLowerCase().includes(matchedBrand.toLowerCase());

    // Extract key words (3+ chars, not common words)
    const keyWords = originalLower
      .split(/\s+/)
      .filter(w => w.length >= 3)
      .filter(w => !['the', 'and', 'for', 'with'].includes(w));

    const keyWordMatchCount = keyWords.filter(kw =>
      matchedLower.includes(kw) || kw.includes(matchedLower.split(' ')[0])
    ).length;

    const nameRelevance = keyWordMatchCount / Math.max(keyWords.length, 1);

    const success = brandMatches && (nameRelevance >= 0.5 || confidence >= 0.7);

    return {
      testCase,
      success,
      confidence,
      matchedName,
      matchedBrand,
      searchTier: data.searchTier || 'unknown',
    };
  } catch (error: any) {
    return {
      testCase,
      success: false,
      confidence: 0,
      matchedName: null,
      matchedBrand: null,
      searchTier: 'error',
      error: error.message,
    };
  }
}

async function main() {
  console.log('='.repeat(80));
  console.log('IDENTIFICATION SYSTEM TEST');
  console.log('Testing with ~80% of item names from real bags');
  console.log('='.repeat(80));
  console.log();

  const results: TestResult[] = [];
  let passed = 0;
  let failed = 0;

  // Group by category for output
  const byCategory = new Map<string, TestCase[]>();
  for (const tc of TEST_CASES) {
    const cases = byCategory.get(tc.category) || [];
    cases.push(tc);
    byCategory.set(tc.category, cases);
  }

  for (const [category, cases] of byCategory) {
    console.log(`\n${'─'.repeat(60)}`);
    console.log(`CATEGORY: ${category}`);
    console.log('─'.repeat(60));

    for (const testCase of cases) {
      process.stdout.write(`  Testing: "${testCase.testInput}" ... `);

      const result = await runTest(testCase);
      results.push(result);

      if (result.success) {
        passed++;
        console.log(`✅ PASS (${(result.confidence * 100).toFixed(0)}%)`);
        console.log(`       → ${result.matchedBrand || ''} ${result.matchedName}`);
      } else {
        failed++;
        console.log(`❌ FAIL`);
        if (result.error) {
          console.log(`       Error: ${result.error}`);
        } else {
          console.log(`       Expected: ${testCase.originalBrand} ${testCase.originalName}`);
          console.log(`       Got: ${result.matchedBrand || '(no brand)'} ${result.matchedName || '(no match)'}`);
          console.log(`       Confidence: ${(result.confidence * 100).toFixed(0)}%`);
        }
      }

      // Small delay to avoid rate limiting
      await new Promise(r => setTimeout(r, 200));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`Total tests: ${TEST_CASES.length}`);
  console.log(`Passed: ${passed} (${((passed / TEST_CASES.length) * 100).toFixed(1)}%)`);
  console.log(`Failed: ${failed} (${((failed / TEST_CASES.length) * 100).toFixed(1)}%)`);

  // Search tier breakdown
  const tierCounts = new Map<string, number>();
  for (const r of results) {
    tierCounts.set(r.searchTier, (tierCounts.get(r.searchTier) || 0) + 1);
  }
  console.log('\nSearch Tier Distribution:');
  for (const [tier, count] of tierCounts) {
    console.log(`  ${tier}: ${count} (${((count / results.length) * 100).toFixed(0)}%)`);
  }

  // Average confidence
  const avgConfidence =
    results.filter(r => r.confidence > 0).reduce((sum, r) => sum + r.confidence, 0) /
    results.filter(r => r.confidence > 0).length;
  console.log(`\nAverage Confidence: ${(avgConfidence * 100).toFixed(1)}%`);

  // Failed tests detail
  if (failed > 0) {
    console.log('\n' + '─'.repeat(60));
    console.log('FAILED TESTS:');
    console.log('─'.repeat(60));
    for (const r of results.filter(r => !r.success)) {
      console.log(`\n  Input: "${r.testCase.testInput}"`);
      console.log(`  Expected: ${r.testCase.originalBrand} ${r.testCase.originalName}`);
      console.log(`  Got: ${r.matchedBrand || ''} ${r.matchedName || '(no match)'}`);
      console.log(`  Tier: ${r.searchTier}, Confidence: ${(r.confidence * 100).toFixed(0)}%`);
    }
  }

  console.log('\n' + '='.repeat(80));

  // Exit with code based on success rate
  const successRate = passed / TEST_CASES.length;
  if (successRate >= 0.8) {
    console.log('✅ SUCCESS: Identification system is working well (≥80% pass rate)');
    process.exit(0);
  } else {
    console.log('❌ NEEDS IMPROVEMENT: Pass rate is below 80%');
    process.exit(1);
  }
}

main().catch(console.error);
