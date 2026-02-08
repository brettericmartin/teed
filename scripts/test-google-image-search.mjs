/**
 * Test Google Custom Search API for product image fetching
 * Run: npx tsx scripts/test-google-image-search.mjs
 */

import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables
config({ path: resolve(process.cwd(), '.env.local') });

const API_KEY = process.env.GOOGLE_SEARCH_API_KEY;
const SEARCH_ENGINE_ID = process.env.GOOGLE_SEARCH_ENGINE_ID;

console.log('\n🔍 Testing Google Custom Search API for Product Images\n');
console.log('═'.repeat(60));

// Check if API keys are configured
if (!API_KEY || API_KEY === 'YOUR_API_KEY_HERE') {
  console.error('\n❌ GOOGLE_SEARCH_API_KEY not configured in .env.local');
  console.log('\n📋 Setup Instructions:');
  console.log('1. Go to: https://console.cloud.google.com/apis/credentials');
  console.log('2. Create API Key');
  console.log('3. Update .env.local with: GOOGLE_SEARCH_API_KEY=your-key-here\n');
  process.exit(1);
}

if (!SEARCH_ENGINE_ID || SEARCH_ENGINE_ID === 'YOUR_SEARCH_ENGINE_ID_HERE') {
  console.error('\n❌ GOOGLE_SEARCH_ENGINE_ID not configured in .env.local');
  console.log('\n📋 Setup Instructions:');
  console.log('1. Go to: https://programmablesearchengine.google.com/controlpanel/create');
  console.log('2. Create search engine');
  console.log('3. Update .env.local with: GOOGLE_SEARCH_ENGINE_ID=your-id-here\n');
  process.exit(1);
}

console.log('✅ API Key configured');
console.log('✅ Search Engine ID configured\n');

// Test searches
const testProducts = [
  { name: 'TaylorMade SIM2 Max Driver', brand: 'TaylorMade' },
  { name: 'Titleist Pro V1x Golf Balls', brand: 'Titleist' },
  { name: 'REI Co-op Half Dome SL 2+ Tent', brand: 'REI' },
];

async function searchProductImage(productName, brand) {
  const query = brand ? `${brand} ${productName}` : productName;

  const searchParams = new URLSearchParams({
    key: API_KEY,
    cx: SEARCH_ENGINE_ID,
    q: query,
    searchType: 'image',
    num: '3',
    imgSize: 'large',
    imgType: 'photo',
    safe: 'active',
    fileType: 'jpg,png',
  });

  const response = await fetch(
    `https://www.googleapis.com/customsearch/v1?${searchParams.toString()}`
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(JSON.stringify(error, null, 2));
  }

  return await response.json();
}

// Run tests
console.log('🧪 Running Test Searches...\n');

for (const product of testProducts) {
  try {
    console.log(`\nSearching: ${product.brand} ${product.name}`);
    console.log('─'.repeat(60));

    const result = await searchProductImage(product.name, product.brand);

    if (result.items && result.items.length > 0) {
      console.log(`✅ Found ${result.items.length} images`);
      console.log(`📸 Top result: ${result.items[0].link}`);
      console.log(`🌐 Source: ${result.items[0].displayLink}`);
      console.log(`📏 Size: ${result.items[0].image?.width}x${result.items[0].image?.height}`);
    } else {
      console.log('⚠️  No images found');
    }
  } catch (error) {
    console.error('❌ Error:', error.message);

    if (error.message.includes('quotaExceeded')) {
      console.log('\n⚠️  Daily quota exceeded (100 free searches/day)');
      console.log('💰 Upgrade at: https://console.cloud.google.com/apis/api/customsearch.googleapis.com/quotas');
    }
  }
}

console.log('\n' + '═'.repeat(60));
console.log('\n✅ Test complete!\n');
console.log('💡 Next steps:');
console.log('   1. Try uploading a photo in the app');
console.log('   2. Product images will appear automatically in the review modal\n');
