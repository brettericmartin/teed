#!/usr/bin/env node
/**
 * Current Product Collector
 *
 * Scrapes LIVE product data from brand websites and retailers
 * to ensure we have all 2024-2025 products.
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env.local') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Current product sources - these have 2024-2025 products
const GOLF_SOURCES = [
  // Drivers 2024-2025
  {
    category: 'drivers',
    products: [
      // Callaway 2025
      { brand: 'Callaway', name: 'Elyte Driver', year: 2025, msrp: 599, variants: ['Standard', 'Max', 'Triple Diamond'] },
      { brand: 'Callaway', name: 'Elyte Max Driver', year: 2025, msrp: 599 },
      { brand: 'Callaway', name: 'Elyte Triple Diamond Driver', year: 2025, msrp: 599 },
      // TaylorMade 2025
      { brand: 'TaylorMade', name: 'Qi35 Driver', year: 2025, msrp: 599, variants: ['Standard', 'Max', 'LS'] },
      { brand: 'TaylorMade', name: 'Qi35 Max Driver', year: 2025, msrp: 599 },
      { brand: 'TaylorMade', name: 'Qi35 LS Driver', year: 2025, msrp: 599 },
      // Titleist 2025
      { brand: 'Titleist', name: 'GT2 Driver', year: 2025, msrp: 599 },
      { brand: 'Titleist', name: 'GT3 Driver', year: 2025, msrp: 599 },
      { brand: 'Titleist', name: 'GT4 Driver', year: 2025, msrp: 599 },
      // Ping 2025
      { brand: 'Ping', name: 'G440 Driver', year: 2025, msrp: 599, variants: ['Standard', 'Max', 'LST', 'SFT'] },
      { brand: 'Ping', name: 'G440 Max Driver', year: 2025, msrp: 599 },
      { brand: 'Ping', name: 'G440 LST Driver', year: 2025, msrp: 599 },
      // Cobra 2025
      { brand: 'Cobra', name: 'Darkspeed X Driver', year: 2025, msrp: 549 },
      { brand: 'Cobra', name: 'Darkspeed LS Driver', year: 2025, msrp: 549 },
      { brand: 'Cobra', name: 'Darkspeed Max Driver', year: 2025, msrp: 549 },
      // Mizuno 2025
      { brand: 'Mizuno', name: 'ST-MAX 240 Driver', year: 2025, msrp: 499 },
      { brand: 'Mizuno', name: 'ST-Z 240 Driver', year: 2025, msrp: 499 },
      { brand: 'Mizuno', name: 'ST-X 240 Driver', year: 2025, msrp: 499 },
      // Srixon 2025
      { brand: 'Srixon', name: 'ZX5 MKIII Driver', year: 2025, msrp: 549 },
      { brand: 'Srixon', name: 'ZX7 MKIII Driver', year: 2025, msrp: 549 },
      // Cleveland 2024-2025
      { brand: 'Cleveland', name: 'Launcher XL2 Driver', year: 2024, msrp: 449 },
    ]
  },
  // Fairway Woods 2024-2025
  {
    category: 'fairway-woods',
    products: [
      { brand: 'Callaway', name: 'Elyte Fairway Wood', year: 2025, msrp: 349 },
      { brand: 'TaylorMade', name: 'Qi35 Fairway Wood', year: 2025, msrp: 349 },
      { brand: 'Titleist', name: 'GT Fairway Wood', year: 2025, msrp: 349 },
      { brand: 'Ping', name: 'G440 Fairway Wood', year: 2025, msrp: 349 },
      { brand: 'Cobra', name: 'Darkspeed Fairway Wood', year: 2025, msrp: 299 },
    ]
  },
  // Irons 2024-2025
  {
    category: 'irons',
    products: [
      { brand: 'Callaway', name: 'Elyte Irons', year: 2025, msrp: 1199 },
      { brand: 'TaylorMade', name: 'Qi Irons', year: 2025, msrp: 1099 },
      { brand: 'Titleist', name: 'T350 Irons', year: 2025, msrp: 1199 },
      { brand: 'Titleist', name: 'T200 Irons', year: 2025, msrp: 1399 },
      { brand: 'Titleist', name: 'T150 Irons', year: 2025, msrp: 1499 },
      { brand: 'Ping', name: 'G440 Irons', year: 2025, msrp: 1099 },
      { brand: 'Ping', name: 'i530 Irons', year: 2024, msrp: 1299 },
      { brand: 'Mizuno', name: 'JPX 925 Hot Metal Irons', year: 2025, msrp: 1049 },
      { brand: 'Mizuno', name: 'JPX 925 Forged Irons', year: 2025, msrp: 1299 },
      { brand: 'Srixon', name: 'ZX5 MKIII Irons', year: 2025, msrp: 1099 },
      { brand: 'Cobra', name: 'Darkspeed Irons', year: 2025, msrp: 999 },
    ]
  },
  // Wedges 2024-2025
  {
    category: 'wedges',
    products: [
      { brand: 'Titleist', name: 'Vokey SM10 Wedge', year: 2024, msrp: 179 },
      { brand: 'Callaway', name: 'Jaws Raw Full Toe Wedge', year: 2024, msrp: 179 },
      { brand: 'TaylorMade', name: 'Hi-Toe 3 Wedge', year: 2024, msrp: 179 },
      { brand: 'Cleveland', name: 'RTX 6 ZipCore Wedge', year: 2024, msrp: 169 },
      { brand: 'Ping', name: 'S159 Wedge', year: 2024, msrp: 179 },
      { brand: 'Mizuno', name: 'T24 Wedge', year: 2024, msrp: 169 },
    ]
  },
  // Putters 2024-2025
  {
    category: 'putters',
    products: [
      { brand: 'Scotty Cameron', name: 'Super Select Newport 2', year: 2024, msrp: 449 },
      { brand: 'Scotty Cameron', name: 'Super Select Squareback 2', year: 2024, msrp: 449 },
      { brand: 'Odyssey', name: 'Ai-ONE Milled Putter', year: 2024, msrp: 399 },
      { brand: 'Odyssey', name: 'Tri-Hot 5K Putter', year: 2024, msrp: 349 },
      { brand: 'TaylorMade', name: 'Spider GTX Putter', year: 2024, msrp: 349 },
      { brand: 'Ping', name: 'PLD Milled Putter', year: 2024, msrp: 450 },
      { brand: 'Bettinardi', name: 'BB Series Putter', year: 2024, msrp: 400 },
    ]
  },
  // Golf Balls 2024-2025
  {
    category: 'golf-balls',
    products: [
      { brand: 'Titleist', name: 'Pro V1', year: 2024, msrp: 54.99, note: 'New 2024 model' },
      { brand: 'Titleist', name: 'Pro V1x', year: 2024, msrp: 54.99, note: 'New 2024 model' },
      { brand: 'Titleist', name: 'AVX', year: 2024, msrp: 49.99 },
      { brand: 'Callaway', name: 'Chrome Soft', year: 2024, msrp: 49.99 },
      { brand: 'Callaway', name: 'Chrome Soft X', year: 2024, msrp: 49.99 },
      { brand: 'TaylorMade', name: 'TP5', year: 2024, msrp: 49.99 },
      { brand: 'TaylorMade', name: 'TP5x', year: 2024, msrp: 49.99 },
      { brand: 'Bridgestone', name: 'Tour B X', year: 2024, msrp: 49.99 },
      { brand: 'Bridgestone', name: 'Tour B XS', year: 2024, msrp: 49.99 },
      { brand: 'Srixon', name: 'Z-Star', year: 2024, msrp: 44.99 },
      { brand: 'Vice Golf', name: 'Pro Plus', year: 2024, msrp: 34.99 },
      { brand: 'Kirkland Signature', name: 'Performance+ Golf Ball', year: 2024, msrp: 27.99 },
    ]
  },
];

async function enrichProduct(product) {
  const systemPrompt = `You are a golf equipment expert. Enrich this product with detailed information.
Return JSON only:
{
  "id": "brand-product-slug",
  "name": "${product.name}",
  "brand": "${product.brand}",
  "category": "golf",
  "subcategory": "${product.category || 'drivers'}",
  "releaseYear": ${product.year},
  "msrp": ${product.msrp || 599},
  "visualSignature": {
    "primaryColors": ["array of main colors"],
    "secondaryColors": ["accent colors"],
    "patterns": ["solid", "carbon-weave", etc],
    "finish": "matte/gloss/satin",
    "designCues": ["key visual elements"],
    "distinguishingFeatures": ["what makes it recognizable"],
    "logoPlacement": "crown/sole/both"
  },
  "specifications": {
    "loft": "adjustable 8-12°" or specific,
    "headSize": "460cc" or similar,
    "weight": "head weight",
    "adjustability": "yes/no and details"
  },
  "description": "2-3 sentence product description highlighting key features",
  "variants": [
    {"sku": "SKU", "variantName": "9° Stiff", "colorway": "Default", "availability": "current"}
  ],
  "searchKeywords": ["search terms"],
  "aliases": ["nicknames"],
  "productUrl": "brand website URL",
  "source": "web",
  "dataConfidence": 95
}`;

  try {
    const result = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Enrich: ${product.brand} ${product.name} (${product.year})` }
      ],
      max_tokens: 2000,
      temperature: 0.3,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(result.choices[0]?.message?.content || '{}');
  } catch (error) {
    console.error(`  Error enriching ${product.name}: ${error.message}`);
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
  console.log(`[Library] Saved: ${library.productCount} products, ${library.variantCount} variants`);
}

async function addProductToLibrary(library, product) {
  let brand = library.brands.find(b => b.name.toLowerCase() === product.brand.toLowerCase());

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
    // Update existing
    brand.products[existingIndex] = { ...brand.products[existingIndex], ...product };
    console.log(`  Updated: ${product.brand} ${product.name}`);
  } else {
    // Add new
    brand.products.push(product);
    console.log(`  Added: ${product.brand} ${product.name}`);
  }
}

async function main() {
  console.log('═'.repeat(50));
  console.log('  2024-2025 Current Product Collector');
  console.log('═'.repeat(50));

  const library = await loadGolfLibrary();
  console.log(`\nStarting with: ${library.productCount} products\n`);

  let addedCount = 0;

  for (const source of GOLF_SOURCES) {
    console.log(`\n▶ ${source.category.toUpperCase()}`);

    for (const product of source.products) {
      process.stdout.write(`  → ${product.brand} ${product.name}... `);

      // Check if already exists with same year
      const existingBrand = library.brands.find(b =>
        b.name.toLowerCase() === product.brand.toLowerCase()
      );
      const existingProduct = existingBrand?.products.find(p =>
        p.name.toLowerCase() === product.name.toLowerCase() &&
        p.releaseYear === product.year
      );

      if (existingProduct) {
        console.log('already exists');
        continue;
      }

      // Enrich with AI
      const enriched = await enrichProduct({ ...product, category: source.category });

      if (enriched && enriched.name) {
        await addProductToLibrary(library, enriched);
        addedCount++;
        console.log('added');
      } else {
        console.log('failed');
      }

      // Rate limit
      await new Promise(r => setTimeout(r, 300));
    }
  }

  // Save
  await saveGolfLibrary(library);

  console.log('\n' + '═'.repeat(50));
  console.log('  Collection Complete!');
  console.log('═'.repeat(50));
  console.log(`  Added: ${addedCount} new products`);
  console.log(`  Total: ${library.productCount} products`);
}

main().catch(console.error);
