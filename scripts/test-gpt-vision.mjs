#!/usr/bin/env node

/**
 * Test GPT-4 Vision Integration
 *
 * This script tests the vision API with a sample base64 image.
 * Run: node scripts/test-gpt-vision.mjs
 */

import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '../.env.local') });

// Sample camping gear image (small base64 for testing)
// This is a 1x1 pixel transparent PNG - replace with actual test image
const SAMPLE_IMAGE = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function testVisionAPI() {
  console.log('🔍 Testing GPT-4 Vision Integration...\n');

  try {
    // Import the AI function (using dynamic import for ESM)
    const { identifyProductsInImage } = await import('../lib/ai.ts');

    console.log('✅ OpenAI client loaded successfully');
    console.log('📸 Testing with sample image...\n');

    // Test 1: Basic product identification
    console.log('Test 1: Basic product identification');
    console.log('─'.repeat(50));

    const result = await identifyProductsInImage(SAMPLE_IMAGE);

    console.log('\n📊 Results:');
    console.log(`  - Products found: ${result.products.length}`);
    console.log(`  - Total confidence: ${result.totalConfidence}%`);
    console.log(`  - Processing time: ${result.processingTime}ms`);

    if (result.warnings && result.warnings.length > 0) {
      console.log(`\n⚠️  Warnings:`);
      result.warnings.forEach(w => console.log(`  - ${w}`));
    }

    if (result.products.length > 0) {
      console.log('\n🎯 Identified Products:');
      result.products.forEach((product, i) => {
        console.log(`\n  ${i + 1}. ${product.name}`);
        console.log(`     Brand: ${product.brand || 'Unknown'}`);
        console.log(`     Category: ${product.category}`);
        console.log(`     Confidence: ${product.confidence}%`);
        if (product.estimatedPrice) {
          console.log(`     Price: ${product.estimatedPrice}`);
        }
        if (product.color) {
          console.log(`     Color: ${product.color}`);
        }
        if (product.specifications && product.specifications.length > 0) {
          console.log(`     Specs: ${product.specifications.join(', ')}`);
        }
      });
    }

    // Test 2: With context
    console.log('\n\nTest 2: Product identification with context');
    console.log('─'.repeat(50));

    const contextResult = await identifyProductsInImage(SAMPLE_IMAGE, {
      bagType: 'camping',
      expectedCategories: ['camping', 'hiking', 'outdoor'],
    });

    console.log(`\n📊 Results with context:`);
    console.log(`  - Products found: ${contextResult.products.length}`);
    console.log(`  - Total confidence: ${contextResult.totalConfidence}%`);
    console.log(`  - Processing time: ${contextResult.processingTime}ms`);

    console.log('\n✅ All vision tests passed!');
    console.log('\n💡 Next steps:');
    console.log('  1. Replace SAMPLE_IMAGE with real product photos');
    console.log('  2. Test with camping gear, golf equipment, etc.');
    console.log('  3. Verify accuracy of product identification');
    console.log('  4. Monitor API costs and response times');

  } catch (error) {
    console.error('\n❌ Vision test failed:', error.message);

    if (error.message.includes('API key')) {
      console.log('\n💡 Fix: Ensure OPENAI_API_KEY is set in .env.local');
    } else if (error.message.includes('rate limit')) {
      console.log('\n💡 Fix: Wait a moment and try again');
    } else if (error.message.includes('Invalid image')) {
      console.log('\n💡 Fix: Check image format and size');
    }

    process.exit(1);
  }
}

// Run the test
testVisionAPI();
