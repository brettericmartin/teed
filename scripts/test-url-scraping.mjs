import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const BASE_URL = process.env.NEXTAUTH_URL || 'http://localhost:3000';

// Test URLs from different retailers
const testUrls = [
  {
    name: 'Amazon - Golf Driver',
    url: 'https://www.amazon.com/TaylorMade-Stealth-Driver-Right-Handed-Regular/dp/B09R9Y1234',
  },
  {
    name: 'PGA Superstore',
    url: 'https://www.pgatoursuperstore.com/titleist-tsi3-driver/1234567.html',
  },
  {
    name: 'Sephora - Makeup',
    url: 'https://www.sephora.com/product/fenty-beauty-gloss-bomb-universal-lip-luminizer-P42715803',
  },
  {
    name: 'Generic Product Page',
    url: 'https://example.com/products/test-item',
  },
];

async function testUrlScraping(url, name) {
  console.log(`\n🔍 Testing: ${name}`);
  console.log(`URL: ${url}`);

  try {
    const response = await fetch(`${BASE_URL}/api/scrape-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      console.log(`❌ Failed: ${response.status} ${response.statusText}`);
      const errorData = await response.json().catch(() => ({}));
      console.log('Error:', errorData);
      return false;
    }

    const data = await response.json();
    console.log('✅ Success!');
    console.log('Title:', data.title || '(none)');
    console.log('Description:', data.description ? `${data.description.substring(0, 100)}...` : '(none)');
    console.log('Image:', data.image ? 'Yes' : 'No');
    console.log('Price:', data.price || '(none)');
    console.log('Domain:', data.domain);

    return true;
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return false;
  }
}

async function runTests() {
  console.log('🧪 URL Scraping Tests');
  console.log('====================\n');
  console.log(`Testing against: ${BASE_URL}`);

  let passed = 0;
  let failed = 0;

  for (const test of testUrls) {
    const success = await testUrlScraping(test.url, test.name);
    if (success) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log('\n📊 Test Summary');
  console.log('===============');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`Total: ${testUrls.length}`);
}

runTests();
