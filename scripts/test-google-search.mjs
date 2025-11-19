// Test Google Custom Search API
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env.local
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
const searchEngineId = process.env.GOOGLE_SEARCH_ENGINE_ID;

console.log('Environment check:');
console.log('API Key exists:', !!apiKey);
console.log('API Key length:', apiKey?.length || 0);
console.log('Search Engine ID exists:', !!searchEngineId);
console.log('Search Engine ID length:', searchEngineId?.length || 0);
console.log('API Key (first 10 chars):', apiKey?.substring(0, 10));
console.log('Search Engine ID:', searchEngineId);
console.log('---');

if (!apiKey || !searchEngineId) {
  console.error('Missing environment variables!');
  process.exit(1);
}

// Test search
const query = 'Nike Air Max 90 shoes';
console.log(`Testing search for: "${query}"`);

const searchParams = new URLSearchParams({
  key: apiKey,
  cx: searchEngineId,
  q: query,
  searchType: 'image',
  num: '3',
  imgSize: 'medium',
  imgType: 'photo',
  safe: 'active',
});

const url = `https://www.googleapis.com/customsearch/v1?${searchParams.toString()}`;
console.log('Request URL (without key):', url.replace(apiKey, 'HIDDEN'));

try {
  const response = await fetch(url);

  console.log('Response status:', response.status);
  console.log('Response statusText:', response.statusText);

  const data = await response.json();

  if (!response.ok) {
    console.error('Error response:', JSON.stringify(data, null, 2));
    process.exit(1);
  }

  console.log('Success!');
  console.log('Search metadata:', data.searchInformation);
  console.log('Number of results:', data.items?.length || 0);

  if (data.items) {
    console.log('\nFirst 3 image URLs:');
    data.items.slice(0, 3).forEach((item, i) => {
      console.log(`${i + 1}. ${item.link}`);
    });
  }

} catch (error) {
  console.error('Fetch error:', error.message);
  process.exit(1);
}
