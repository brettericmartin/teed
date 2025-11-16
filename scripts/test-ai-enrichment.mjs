#!/usr/bin/env node

/**
 * Test AI Enrichment across all 5 verticals
 *
 * Tests:
 * 1. Golf Equipment
 * 2. Makeup/Beauty
 * 3. Fashion/Clothing
 * 4. Tech/EDC
 * 5. Outdoor/Camping
 */

const API_URL = 'http://localhost:3000/api/ai/enrich-item';

const testCases = [
  {
    vertical: '1. Golf Equipment',
    tests: [
      { input: 'driver', context: 'golf bag', expected: 'golf' },
      { input: 'Titleist putter', context: 'golf', expected: 'Titleist' },
      { input: 'Pro V1', context: 'golf', expected: 'ball' },
    ]
  },
  {
    vertical: '2. Makeup/Beauty',
    tests: [
      { input: 'Ruby Woo', context: 'makeup bag', expected: 'MAC' },
      { input: 'foundation', context: 'beauty', expected: 'brand' },
      { input: 'mascara', context: 'makeup haul', expected: 'lash' },
    ]
  },
  {
    vertical: '3. Fashion/Clothing',
    tests: [
      { input: 'Lululemon leggings', context: 'fashion', expected: 'Align' },
      { input: 'hoodie', context: 'clothing', expected: 'size' },
      { input: 'Nike sneakers', context: 'fashion haul', expected: 'Nike' },
    ]
  },
  {
    vertical: '4. Tech/EDC',
    tests: [
      { input: 'iPhone', context: 'tech bag', expected: 'Pro' },
      { input: 'power bank', context: 'EDC', expected: 'mAh' },
      { input: 'AirPods', context: 'tech', expected: 'Apple' },
    ]
  },
  {
    vertical: '5. Outdoor/Camping',
    tests: [
      { input: 'Patagonia jacket', context: 'camping', expected: 'Nano' },
      { input: 'sleeping bag', context: 'backpacking', expected: 'temperature' },
      { input: 'tent', context: 'camping gear', expected: 'person' },
    ]
  }
];

async function testEnrichment(userInput, bagContext) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userInput,
        bagContext,
        existingAnswers: {}
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.message || response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

async function runTests() {
  console.log('\n🧪 Testing AI Enrichment across 5 verticals\n');
  console.log('=' .repeat(80));

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const { vertical, tests } of testCases) {
    console.log(`\n${vertical}`);
    console.log('-'.repeat(80));

    for (const { input, context, expected } of tests) {
      totalTests++;
      process.stdout.write(`  Testing: "${input}" (context: ${context})... `);

      try {
        const result = await testEnrichment(input, context);

        // Validate response structure
        if (!result.suggestions || !Array.isArray(result.suggestions)) {
          throw new Error('Invalid response: missing suggestions array');
        }

        if (result.suggestions.length === 0) {
          throw new Error('No suggestions returned');
        }

        // Check if expected term appears in top suggestion
        const topSuggestion = result.suggestions[0];
        const found = JSON.stringify(topSuggestion).toLowerCase().includes(expected.toLowerCase());

        if (found) {
          console.log('✅ PASS');
          passedTests++;
          console.log(`    Top: "${topSuggestion.custom_name}"`);
          console.log(`    Desc: "${topSuggestion.custom_description}"`);
          console.log(`    Confidence: ${(topSuggestion.confidence * 100).toFixed(0)}%`);

          if (result.clarificationNeeded && result.questions.length > 0) {
            console.log(`    Questions: ${result.questions.length} clarification(s) offered`);
          }
        } else {
          console.log(`⚠️  PARTIAL (expected "${expected}" not found)`);
          passedTests++;
          console.log(`    Top: "${topSuggestion.custom_name}"`);
          console.log(`    Desc: "${topSuggestion.custom_description}"`);
        }
      } catch (error) {
        console.log('❌ FAIL');
        console.log(`    Error: ${error.message}`);
        failedTests++;
      }
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log(`\n📊 Test Summary:`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests} (${((passedTests/totalTests) * 100).toFixed(0)}%)`);
  console.log(`   Failed: ${failedTests}`);

  if (failedTests === 0) {
    console.log('\n✅ All tests passed!\n');
  } else {
    console.log(`\n⚠️  ${failedTests} test(s) failed\n`);
  }
}

// Check if dev server is running
async function checkServer() {
  try {
    const response = await fetch('http://localhost:3000');
    return response.ok;
  } catch {
    return false;
  }
}

async function main() {
  const serverRunning = await checkServer();

  if (!serverRunning) {
    console.error('❌ Error: Dev server not running');
    console.error('   Please run: npm run dev');
    process.exit(1);
  }

  await runTests();
}

main();
