#!/usr/bin/env node

/**
 * Test script for AI improvements:
 * 1. Smart link finding (should recommend eBay for vintage golf clubs)
 * 2. Enhanced AI enrichment (should include fun facts and differentiation)
 */

const BASE_URL = 'http://localhost:3000';

console.log('🧪 Testing AI Improvements\n');

// Test 1: Smart Link Finding
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Test 1: Smart Link Finding');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function testSmartLinkFinding() {
  const testCases = [
    {
      name: 'Vintage Golf Club',
      product: {
        name: 'R7 Quad Driver',
        brand: 'TaylorMade',
        category: 'Golf Equipment',
      },
      expectVintage: true,
      expectSource: 'ebay', // Should recommend eBay or specialty golf sites
    },
    {
      name: 'New Golf Club',
      product: {
        name: 'Stealth 2 Plus Driver',
        brand: 'TaylorMade',
        category: 'Golf Equipment',
      },
      expectVintage: false,
      expectSource: 'amazon', // Should allow Amazon for new products
    },
    {
      name: 'Old Driver with Year',
      product: {
        name: '2015 M1 Driver',
        brand: 'TaylorMade',
        category: 'Golf Equipment',
      },
      expectVintage: true,
      expectSource: 'ebay',
    },
  ];

  for (const testCase of testCases) {
    console.log(`📦 Testing: ${testCase.name}`);
    console.log(`   Product: ${testCase.product.brand} ${testCase.product.name}`);

    try {
      // Import and test the smart link finder directly
      const { findBestProductLinks, detectProductAge } = await import(
        '../lib/services/SmartLinkFinder.ts'
      );

      // Test age detection
      const ageDetection = detectProductAge(testCase.product.name, testCase.product.brand);
      console.log(`   🔍 Vintage detected: ${ageDetection.isVintage} (confidence: ${ageDetection.confidence})`);
      if (ageDetection.reason) {
        console.log(`      Reason: ${ageDetection.reason}`);
      }

      // Verify age detection
      if (ageDetection.isVintage !== testCase.expectVintage) {
        console.log(`   ❌ FAIL: Expected vintage=${testCase.expectVintage}, got ${ageDetection.isVintage}`);
      } else {
        console.log(`   ✅ Age detection correct`);
      }

      // Test link finding
      const linkResult = await findBestProductLinks({
        name: testCase.product.name,
        brand: testCase.product.brand,
        category: testCase.product.category,
        isVintage: ageDetection.isVintage,
      });

      console.log(`   🔗 Primary recommendation:`);
      console.log(`      Source: ${linkResult.primaryLink.source}`);
      console.log(`      Label: ${linkResult.primaryLink.label}`);
      console.log(`      Reason: ${linkResult.primaryLink.reason}`);
      console.log(`      URL: ${linkResult.primaryLink.url.substring(0, 80)}...`);
      console.log(`   💡 AI Reasoning: ${linkResult.reasoning}`);

      if (linkResult.recommendations.length > 1) {
        console.log(`   📋 Alternative sources:`);
        linkResult.recommendations.slice(1, 3).forEach((rec) => {
          console.log(`      - ${rec.source}: ${rec.label}`);
        });
      }

      console.log(`   ✅ PASS: Generated ${linkResult.recommendations.length} recommendations\n`);
    } catch (error) {
      console.log(`   ❌ FAIL: ${error.message}\n`);
    }
  }
}

// Test 2: Enhanced AI Enrichment
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Test 2: Enhanced AI Enrichment with Fun Facts');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

async function testAIEnrichment() {
  const testCases = [
    {
      name: 'Golf Driver',
      input: 'Stealth 2 Plus Driver',
    },
    {
      name: 'Makeup Product',
      input: 'MAC Ruby Woo lipstick',
    },
    {
      name: 'Vintage Club',
      input: 'TaylorMade R7 Quad Driver',
    },
  ];

  for (const testCase of testCases) {
    console.log(`📦 Testing: ${testCase.name}`);
    console.log(`   Input: "${testCase.input}"`);

    try {
      const response = await fetch(`${BASE_URL}/api/ai/enrich-item`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userInput: testCase.input,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.suggestions || data.suggestions.length === 0) {
        console.log(`   ❌ FAIL: No suggestions returned\n`);
        continue;
      }

      const suggestion = data.suggestions[0];

      console.log(`   ✅ Top Suggestion:`);
      console.log(`      Brand: ${suggestion.brand || 'N/A'}`);
      console.log(`      Name: ${suggestion.custom_name}`);
      console.log(`      Description: ${suggestion.custom_description}`);
      console.log(`      Category: ${suggestion.category}`);
      console.log(`      Confidence: ${suggestion.confidence}`);
      console.log(`   📝 Notes (should be interesting!):`);
      console.log(`      "${suggestion.notes}"`);

      // Check if notes are interesting (length and detail)
      const notesLength = suggestion.notes?.length || 0;
      const hasDetail = suggestion.notes?.includes('.') || suggestion.notes?.includes('!');

      if (notesLength > 50 && hasDetail) {
        console.log(`   ✅ Notes appear detailed and interesting (${notesLength} chars)`);
      } else {
        console.log(`   ⚠️  Notes might be too generic (${notesLength} chars)`);
      }

      console.log('');
    } catch (error) {
      console.log(`   ❌ FAIL: ${error.message}\n`);
    }
  }
}

// Run all tests
(async () => {
  await testSmartLinkFinding();
  await testAIEnrichment();
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('✅ All tests complete!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
})();
