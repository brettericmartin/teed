/**
 * Test script for the new Link Identification Pipeline
 *
 * Run with: source .env.local && npx tsx scripts/test-link-identification.mjs
 */

import 'dotenv/config';

// Dynamic import for TypeScript modules
const { identifyProduct, parseProductUrl } = await import('../lib/linkIdentification/index.js');

const testUrls = [
  // G/FORE - the problematic URL
  'https://www.gfore.com/p/mens-g.112-golf-shoe/gmf000027.html?dwvar_gmf000027_color=DNGM&dwvar_gmf000027_size=7.5',

  // TaylorMade - known brand
  'https://www.taylormadegolf.com/Qi10-Max-Driver/DW-TA071.html',

  // Titleist - golf ball
  'https://www.titleist.com/product/pro-v1/T2027S.html',

  // Apple - tech
  'https://www.apple.com/shop/buy-iphone/iphone-15-pro',

  // Amazon - retailer
  'https://www.amazon.com/dp/B0CHWQG4YB',

  // REI - retailer with outdoor gear
  'https://www.rei.com/product/123456/patagonia-nano-puff-jacket',
];

async function main() {
  console.log('='.repeat(80));
  console.log('LINK IDENTIFICATION PIPELINE TEST');
  console.log('='.repeat(80));
  console.log();

  for (const url of testUrls) {
    console.log('-'.repeat(80));
    console.log(`URL: ${url}`);
    console.log('-'.repeat(80));

    // First, show URL parsing results (no network)
    console.log('\n📊 URL PARSING (No Network):');
    const parsed = parseProductUrl(url);
    console.log(`  Domain: ${parsed.domain}`);
    console.log(`  Brand: ${parsed.brand || 'Unknown'}`);
    console.log(`  Category: ${parsed.category || 'Unknown'}`);
    console.log(`  Is Retailer: ${parsed.isRetailer}`);
    console.log(`  Product Slug: ${parsed.productSlug || 'None'}`);
    console.log(`  Humanized Name: ${parsed.humanizedName || 'None'}`);
    console.log(`  Model/SKU: ${parsed.modelNumber || parsed.sku || 'None'}`);
    console.log(`  URL Confidence: ${(parsed.urlConfidence * 100).toFixed(0)}%`);

    // Now run full identification
    console.log('\n🔍 FULL IDENTIFICATION:');
    try {
      const result = await identifyProduct(url);
      console.log(`  ✅ Full Name: ${result.fullName}`);
      console.log(`  Brand: ${result.brand || 'Unknown'}`);
      console.log(`  Product: ${result.productName}`);
      console.log(`  Category: ${result.category || 'Unknown'}`);
      console.log(`  Price: ${result.price || 'Unknown'}`);
      console.log(`  Confidence: ${(result.confidence * 100).toFixed(0)}%`);
      console.log(`  Primary Source: ${result.primarySource}`);
      console.log(`  All Sources: ${result.sources.join(' → ')}`);
      console.log(`  Time: ${result.processingTimeMs}ms`);

      if (result.fetchResult?.blocked) {
        console.log(`  ⚠️  Scraping Blocked: ${result.fetchResult.reason}`);
      }
    } catch (error) {
      console.log(`  ❌ Error: ${error.message}`);
    }

    console.log();
  }

  console.log('='.repeat(80));
  console.log('TEST COMPLETE');
  console.log('='.repeat(80));
}

main().catch(console.error);
