#!/usr/bin/env node

/**
 * Test the /api/ai/find-product-image endpoint
 * Run: node scripts/test-find-product-image.mjs
 */

const API_URL = 'http://localhost:3000/api/ai/find-product-image';

const testQueries = [
  'TaylorMade Stealth 2 Plus Driver',
  'MAC Ruby Woo lipstick',
  'Patagonia Nano Puff Jacket',
  'iPhone 15 Pro',
  'REI Half Dome tent',
];

async function testFindImage(query) {
  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`API Error: ${error.error || response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    throw new Error(`Request failed: ${error.message}`);
  }
}

async function main() {
  console.log('\n🔍 Testing Find Product Image API\n');
  console.log('═'.repeat(80));

  // Check if dev server is running
  try {
    const healthCheck = await fetch('http://localhost:3000');
    if (!healthCheck.ok) {
      throw new Error('Server not responding');
    }
  } catch {
    console.error('\n❌ Error: Dev server not running');
    console.error('   Please run: npm run dev\n');
    process.exit(1);
  }

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  for (const query of testQueries) {
    totalTests++;
    console.log(`\n📸 Testing: "${query}"`);
    console.log('-'.repeat(80));

    try {
      const result = await testFindImage(query);

      if (!result.images || !Array.isArray(result.images)) {
        throw new Error('Invalid response: missing images array');
      }

      if (result.images.length === 0) {
        console.log('⚠️  No images found');
        passedTests++; // Not a failure, just no results
      } else {
        console.log(`✅ Found ${result.images.length} images`);
        console.log(`📸 First image: ${result.images[0].substring(0, 80)}...`);
        passedTests++;
      }
    } catch (error) {
      console.log('❌ FAIL');
      console.log(`   Error: ${error.message}`);
      failedTests++;
    }
  }

  // Summary
  console.log('\n' + '═'.repeat(80));
  console.log(`\n📊 Test Summary:`);
  console.log(`   Total Tests: ${totalTests}`);
  console.log(`   Passed: ${passedTests} (${((passedTests/totalTests) * 100).toFixed(0)}%)`);
  console.log(`   Failed: ${failedTests}`);

  if (failedTests === 0) {
    console.log('\n✅ All tests passed!\n');
  } else {
    console.log(`\n⚠️  ${failedTests} test(s) failed\n`);
    process.exit(1);
  }
}

main();
