import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local from the project root
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const testUrl = 'https://www.gfore.com/p/mens-g.112-golf-shoe/GMF000027_DNGM.html?dwvar_GMF000027_color=DNGM';

console.log('Testing AI URL Analyzer');
console.log('URL:', testUrl);
console.log('');

try {
  const response = await fetch('http://localhost:3000/api/ai/analyze-product-url', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url: testUrl }),
  });

  if (!response.ok) {
    const error = await response.json();
    console.error('Error:', error);
    process.exit(1);
  }

  const result = await response.json();

  console.log('✅ Analysis Complete');
  console.log('');
  console.log('Brand:', result.brand);
  console.log('Product:', result.productName);
  console.log('Category:', result.category);
  console.log('Color:', result.color);
  console.log('Price:', result.price);
  console.log('Confidence:', result.confidence);
  console.log('');
  console.log('Specs:', result.specs);
  console.log('');
  console.log('Reasoning:', result.reasoning);
  console.log('');
  console.log('Domain:', result.domain);
  console.log('Extracted at:', result.extracted_at);

} catch (error) {
  console.error('Test failed:', error.message);
  process.exit(1);
}
