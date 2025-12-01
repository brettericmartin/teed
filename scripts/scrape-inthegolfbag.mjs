#!/usr/bin/env node
/**
 * In The Golf Bag Scraper
 *
 * Scrapes current golf equipment from inthegolfbag.com
 * This site tracks what tour pros actually use - so it's always current.
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env.local') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Major golf brands to scrape from inthegolfbag.com
const BRANDS = [
  'callaway',
  'taylormade',
  'titleist',
  'ping',
  'cobra',
  'mizuno',
  'srixon',
  'cleveland',
  'bridgestone',
  'pxg',
  'scottycameron',
  'odyssey',
  'wilson',
  'tour-edge',
];

async function fetchBrandProducts(brand) {
  console.log(`\nFetching ${brand} from inthegolfbag.com...`);

  try {
    const response = await fetch(`https://www.inthegolfbag.com/${brand}`);
    if (!response.ok) {
      console.log(`  Failed to fetch ${brand}: ${response.status}`);
      return [];
    }

    const html = await response.text();

    // Use AI to extract products from the HTML
    const result = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: `You are a golf equipment expert. Extract ALL product names from this HTML page.

For each product, determine:
1. Product name (e.g., "Elyte Triple Diamond Driver")
2. Category (drivers, fairway-woods, hybrids, irons, wedges, putters, golf-balls)
3. Year (estimate based on product line - Elyte=2025, Paradym Ai Smoke=2024, Paradym=2023, etc.)

Return JSON array only:
[
  {"name": "Elyte Triple Diamond Driver", "category": "drivers", "year": 2025},
  {"name": "Paradym Ai Smoke Driver", "category": "drivers", "year": 2024}
]

Be thorough - extract EVERY product mentioned.`
        },
        {
          role: 'user',
          content: `Brand: ${brand}\n\nHTML (truncated):\n${html.slice(0, 50000)}`
        }
      ],
      max_tokens: 4096,
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const content = result.choices[0]?.message?.content || '{"products":[]}';
    const parsed = JSON.parse(content);
    const products = parsed.products || parsed || [];

    console.log(`  Found ${products.length} products`);
    return products.map(p => ({
      ...p,
      brand: brand.charAt(0).toUpperCase() + brand.slice(1).replace('-', ' ')
    }));
  } catch (error) {
    console.error(`  Error fetching ${brand}:`, error.message);
    return [];
  }
}

async function enrichProduct(product) {
  const prompt = `Create product data for: ${product.brand} ${product.name}

Return JSON:
{
  "id": "brand-product-slug-year",
  "name": "${product.name}",
  "brand": "${product.brand}",
  "category": "golf",
  "subcategory": "${product.category}",
  "releaseYear": ${product.year || 2024},
  "msrp": estimated_price,
  "visualSignature": {
    "primaryColors": ["main colors"],
    "secondaryColors": ["accent colors"],
    "patterns": ["solid" or "carbon-weave" etc],
    "finish": "matte/gloss/satin",
    "designCues": ["key visual elements"],
    "distinguishingFeatures": ["what makes it recognizable"],
    "logoPlacement": "crown/sole/both"
  },
  "specifications": {
    "key": "value specs"
  },
  "description": "2-3 sentence description",
  "variants": [
    {"sku": "SKU", "variantName": "9° Stiff", "colorway": "Default", "availability": "current"}
  ],
  "searchKeywords": ["relevant search terms"],
  "aliases": ["nicknames"],
  "productUrl": "estimated brand URL",
  "source": "inthegolfbag",
  "dataConfidence": 90
}`;

  try {
    const result = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 2000,
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(result.choices[0]?.message?.content || '{}');
  } catch (error) {
    console.error(`  Error enriching ${product.name}:`, error.message);
    return null;
  }
}

async function loadGolfLibrary() {
  const libraryPath = resolve(__dirname, '..', 'lib', 'productLibrary', 'data', 'golf.json');
  if (existsSync(libraryPath)) {
    return JSON.parse(readFileSync(libraryPath, 'utf-8'));
  }
  return {
    category: 'golf',
    schemaVersion: '1.0.0',
    lastUpdated: new Date().toISOString(),
    brands: [],
    productCount: 0,
    variantCount: 0
  };
}

async function saveGolfLibrary(library) {
  const libraryPath = resolve(__dirname, '..', 'lib', 'productLibrary', 'data', 'golf.json');

  library.productCount = library.brands.reduce((sum, b) => sum + b.products.length, 0);
  library.variantCount = library.brands.reduce((sum, b) =>
    sum + b.products.reduce((pSum, p) => pSum + (p.variants?.length || 0), 0), 0);
  library.lastUpdated = new Date().toISOString();

  writeFileSync(libraryPath, JSON.stringify(library, null, 2));
  console.log(`\n[Library] Saved: ${library.productCount} products, ${library.variantCount} variants`);
}

async function addProductToLibrary(library, product) {
  let brand = library.brands.find(b =>
    b.name.toLowerCase() === product.brand.toLowerCase()
  );

  if (!brand) {
    brand = {
      name: product.brand,
      aliases: [],
      products: [],
      lastUpdated: new Date().toISOString()
    };
    library.brands.push(brand);
  }

  // Check if product already exists
  const existingIndex = brand.products.findIndex(p =>
    p.name.toLowerCase() === product.name.toLowerCase()
  );

  if (existingIndex >= 0) {
    // Update if newer
    if ((product.releaseYear || 0) >= (brand.products[existingIndex].releaseYear || 0)) {
      brand.products[existingIndex] = { ...brand.products[existingIndex], ...product };
    }
    return false;
  } else {
    brand.products.push(product);
    return true;
  }
}

async function main() {
  console.log('═'.repeat(60));
  console.log('  In The Golf Bag Scraper - Current Tour Equipment');
  console.log('═'.repeat(60));

  const library = await loadGolfLibrary();
  console.log(`\nStarting with: ${library.productCount} products\n`);

  let totalAdded = 0;
  let totalFound = 0;

  for (const brand of BRANDS) {
    const products = await fetchBrandProducts(brand);
    totalFound += products.length;

    // Enrich and add each product
    for (const product of products) {
      process.stdout.write(`  → ${product.brand} ${product.name}... `);

      // Check if already exists
      const existingBrand = library.brands.find(b =>
        b.name.toLowerCase() === product.brand.toLowerCase()
      );
      const exists = existingBrand?.products.some(p =>
        p.name.toLowerCase() === product.name.toLowerCase()
      );

      if (exists) {
        console.log('exists');
        continue;
      }

      // Enrich with AI
      const enriched = await enrichProduct(product);
      if (enriched && enriched.name) {
        const added = await addProductToLibrary(library, enriched);
        if (added) {
          totalAdded++;
          console.log('added');
        } else {
          console.log('updated');
        }
      } else {
        console.log('failed');
      }

      // Rate limit
      await new Promise(r => setTimeout(r, 200));
    }

    // Save after each brand
    await saveGolfLibrary(library);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('  Scrape Complete!');
  console.log('═'.repeat(60));
  console.log(`  Found: ${totalFound} products`);
  console.log(`  Added: ${totalAdded} new products`);
  console.log(`  Total: ${library.productCount} products`);
}

main().catch(console.error);
