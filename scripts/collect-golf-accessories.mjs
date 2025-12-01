#!/usr/bin/env node
/**
 * Golf Accessories Collection Script
 *
 * Collects rangefinders, balls, tees, divot tools, and other golf accessories
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env.local') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Golf accessory categories and brands
const ACCESSORY_CATEGORIES = [
  {
    subcategory: 'rangefinders',
    brands: ['Bushnell', 'Garmin', 'Blue Tees', 'Precision Pro', 'Callaway', 'Nikon', 'Leupold', 'Voice Caddie', 'Shot Scope', 'GolfBuddy'],
    description: 'Golf rangefinders and GPS devices'
  },
  {
    subcategory: 'golf-balls',
    brands: ['Vice Golf', 'Kirkland Signature', 'Titleist', 'Callaway', 'TaylorMade', 'Bridgestone', 'Srixon', 'Mizuno', 'Cut Golf', 'Snell Golf', 'OnCore', 'Maxfli'],
    description: 'Golf balls - premium, mid-range, and value'
  },
  {
    subcategory: 'golf-tees',
    brands: ['Pride Golf Tee', 'Zero Friction', 'Martini Golf', 'Brush-T', 'PTS Precision', 'Evolve Golf', 'Lignum Tee', 'GreenKeepers', '4 Yards More'],
    description: 'Golf tees - wood, plastic, performance'
  },
  {
    subcategory: 'divot-tools',
    brands: ['Pitchfix', 'Titleist', 'Callaway', 'Scotty Cameron', 'PGA Tour', 'Odyssey', 'Seamus Golf', 'G/FORE'],
    description: 'Divot repair tools and ball markers'
  },
  {
    subcategory: 'golf-gloves',
    brands: ['FootJoy', 'Titleist', 'Callaway', 'TaylorMade', 'Mizuno', 'Under Armour', 'G/FORE', 'Bionic', 'Zero Friction', 'Vice Golf'],
    description: 'Golf gloves - leather, synthetic, all-weather'
  },
  {
    subcategory: 'golf-bags',
    brands: ['Titleist', 'Callaway', 'TaylorMade', 'Ping', 'Sun Mountain', 'Ogio', 'Vessel', 'Jones Sports', 'Mackenzie Golf', 'Stitch Golf'],
    description: 'Golf bags - stand, cart, staff, travel'
  },
  {
    subcategory: 'training-aids',
    brands: ['Orange Whip', 'SuperSpeed Golf', 'Lag Shot', 'SKLZ', 'PuttOut', 'Eyeline Golf', 'Pressure Putt', 'Blast Motion', 'Arccos', 'SkyTrak'],
    description: 'Golf training aids and practice equipment'
  },
  {
    subcategory: 'golf-apparel',
    brands: ['Travis Mathew', 'Peter Millar', 'Greyson', 'G/FORE', 'Bad Birdie', 'Nike Golf', 'Adidas Golf', 'Puma Golf', 'FootJoy', 'Under Armour Golf'],
    description: 'Golf apparel - shirts, pants, outerwear'
  }
];

async function collectAccessoryProducts(subcategory, brand, description) {
  const systemPrompt = `You are a golf equipment specialist. Collect ALL products from ${brand} in the ${subcategory} category.

SCOPE: Every ${brand} ${description} product from 2019-2024.

OUTPUT: Valid JSON only:
{
  "products": [
    {
      "id": "brand-product-slug",
      "name": "Product Name",
      "brand": "${brand}",
      "category": "golf",
      "subcategory": "${subcategory}",
      "releaseYear": 2024,
      "msrp": 299,
      "visualSignature": {
        "primaryColors": ["black"],
        "secondaryColors": ["red"],
        "patterns": ["solid"],
        "finish": "matte",
        "designCues": ["design elements"],
        "distinguishingFeatures": ["unique features"],
        "logoPlacement": "front"
      },
      "specifications": {},
      "modelNumber": "MODEL123",
      "variants": [
        {"sku": "sku-code", "variantName": "Variant", "colorway": "Color", "availability": "current"}
      ],
      "searchKeywords": ["keywords"],
      "aliases": ["nicknames"],
      "source": "ai",
      "dataConfidence": 85
    }
  ]
}

TARGET: 5-20 products with ALL variants/colorways. Be thorough!`;

  const userPrompt = `List ALL ${brand} ${description} products from 2019-2024. Include every model, every colorway, and every variant.`;

  try {
    const result = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      max_tokens: 8192,
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const content = result.choices[0]?.message?.content || '{"products":[]}';
    const parsed = JSON.parse(content);
    return parsed.products || [];
  } catch (error) {
    console.error(`  Error collecting ${brand}: ${error.message}`);
    return [];
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

  // Recalculate counts
  library.productCount = library.brands.reduce((sum, b) => sum + b.products.length, 0);
  library.variantCount = library.brands.reduce((sum, b) =>
    sum + b.products.reduce((pSum, p) => pSum + (p.variants?.length || 0), 0), 0);
  library.lastUpdated = new Date().toISOString();

  writeFileSync(libraryPath, JSON.stringify(library, null, 2));
  console.log(`[Library] Saved: ${library.productCount} products, ${library.variantCount} variants`);
}

async function addProductsToBrand(library, brandName, products) {
  let brand = library.brands.find(b => b.name.toLowerCase() === brandName.toLowerCase());

  if (!brand) {
    brand = {
      name: brandName,
      aliases: [],
      products: [],
      lastUpdated: new Date().toISOString()
    };
    library.brands.push(brand);
  }

  // Add new products (avoid duplicates by ID)
  const existingIds = new Set(brand.products.map(p => p.id));
  for (const product of products) {
    if (!existingIds.has(product.id)) {
      brand.products.push({
        ...product,
        lastUpdated: new Date().toISOString()
      });
    }
  }

  brand.lastUpdated = new Date().toISOString();
}

async function main() {
  console.log('═'.repeat(50));
  console.log('  Golf Accessories Collection');
  console.log('═'.repeat(50));

  const library = await loadGolfLibrary();
  console.log(`\nStarting with: ${library.productCount} products\n`);

  for (const category of ACCESSORY_CATEGORIES) {
    console.log(`\n▶ ${category.subcategory.toUpperCase()}`);
    console.log(`  Brands: ${category.brands.join(', ')}`);

    for (const brand of category.brands) {
      process.stdout.write(`  → ${brand}... `);

      const products = await collectAccessoryProducts(
        category.subcategory,
        brand,
        category.description
      );

      if (products.length > 0) {
        await addProductsToBrand(library, brand, products);
        console.log(`${products.length} products`);
      } else {
        console.log('0 products');
      }

      // Rate limit pause
      await new Promise(r => setTimeout(r, 500));
    }

    // Save after each category
    await saveGolfLibrary(library);
  }

  console.log('\n' + '═'.repeat(50));
  console.log('  Collection Complete!');
  console.log('═'.repeat(50));
  console.log(`  Total products: ${library.productCount}`);
  console.log(`  Total variants: ${library.variantCount}`);
  console.log(`  Brands: ${library.brands.length}`);
}

main().catch(console.error);
