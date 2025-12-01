#!/usr/bin/env node
/**
 * Product Library Builder
 *
 * Interactive script to build out the product library using AI agents.
 * Run with: node scripts/build-product-library.mjs [category] [brand]
 *
 * Examples:
 *   node scripts/build-product-library.mjs golf             # Build all golf brands
 *   node scripts/build-product-library.mjs golf TaylorMade  # Build specific brand
 *   node scripts/build-product-library.mjs --status         # Show library status
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = join(__dirname, '..');
const DATA_DIR = join(PROJECT_ROOT, 'lib', 'productLibrary', 'data');

// Import orchestrator configs
const CATEGORY_CONFIGS = {
  golf: {
    category: 'golf',
    priorityBrands: [
      'TaylorMade',
      'Titleist',
      'Callaway',
      'Ping',
      'Cobra',
      'Cleveland',
      'Mizuno',
      'Srixon',
      'Bridgestone',
      'Wilson',
    ],
    subcategories: ['drivers', 'fairways', 'hybrids', 'irons', 'wedges', 'putters', 'bags', 'balls'],
  },
  tech: {
    category: 'tech',
    priorityBrands: [
      'Apple',
      'Samsung',
      'Sony',
      'Bose',
      'Microsoft',
      'Google',
      'Dell',
      'Lenovo',
      'JBL',
      'Sonos',
    ],
    subcategories: ['phones', 'laptops', 'tablets', 'headphones', 'speakers', 'watches', 'cameras'],
  },
  fashion: {
    category: 'fashion',
    priorityBrands: [
      'Nike',
      'Adidas',
      'Lululemon',
      'Patagonia',
      'The North Face',
      "Arc'teryx",
      'Under Armour',
      'New Balance',
      'ASICS',
      'Allbirds',
    ],
    subcategories: ['jackets', 'pants', 'shirts', 'shoes', 'accessories', 'athletic'],
  },
  outdoor: {
    category: 'outdoor',
    priorityBrands: [
      'REI Co-op',
      'The North Face',
      'Osprey',
      'MSR',
      'Big Agnes',
      'Kelty',
      'Black Diamond',
      'Nemo',
      'Sea to Summit',
      'Gregory',
    ],
    subcategories: ['tents', 'sleeping-bags', 'backpacks', 'stoves', 'water-filters', 'clothing'],
  },
};

// Load existing library
function loadLibrary(category) {
  const filePath = join(DATA_DIR, `${category}.json`);
  if (!existsSync(filePath)) {
    return {
      category,
      schemaVersion: '1.0.0',
      lastUpdated: new Date().toISOString(),
      brands: [],
      productCount: 0,
      variantCount: 0,
    };
  }
  return JSON.parse(readFileSync(filePath, 'utf-8'));
}

// Save library
function saveLibrary(library) {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  library.lastUpdated = new Date().toISOString();
  library.productCount = library.brands.reduce(
    (sum, brand) => sum + brand.products.length,
    0
  );
  library.variantCount = library.brands.reduce(
    (sum, brand) =>
      sum +
      brand.products.reduce((pSum, product) => pSum + (product.variants?.length || 0), 0),
    0
  );

  const filePath = join(DATA_DIR, `${library.category}.json`);
  writeFileSync(filePath, JSON.stringify(library, null, 2), 'utf-8');
  console.log(`Saved ${library.category}: ${library.productCount} products, ${library.variantCount} variants`);
}

// Show library status
function showStatus() {
  console.log('\n=== Product Library Status ===\n');

  for (const category of Object.keys(CATEGORY_CONFIGS)) {
    const library = loadLibrary(category);
    const config = CATEGORY_CONFIGS[category];

    console.log(`${category.toUpperCase()}`);
    console.log(`  Brands in library: ${library.brands.length}/${config.priorityBrands.length}`);
    console.log(`  Products: ${library.productCount}`);
    console.log(`  Variants: ${library.variantCount}`);
    console.log(`  Last updated: ${library.lastUpdated || 'Never'}`);

    // Show which brands are missing
    const existingBrands = new Set(library.brands.map(b => b.name.toLowerCase()));
    const missingBrands = config.priorityBrands.filter(
      b => !existingBrands.has(b.toLowerCase())
    );
    if (missingBrands.length > 0) {
      console.log(`  Missing brands: ${missingBrands.join(', ')}`);
    }
    console.log();
  }
}

// Generate agent prompt for a brand
function generateBrandPrompt(category, brandName) {
  const config = CATEGORY_CONFIGS[category];
  if (!config) {
    throw new Error(`Unknown category: ${category}`);
  }

  return `You are a product research agent. Generate a comprehensive product catalog for ${brandName} in the ${category} category.

REQUIREMENTS:
- Include products released from 2020-2024
- Cover subcategories: ${config.subcategories.join(', ')}
- Each product needs complete visual signature data for photo identification
- Include all major colorways as variants

OUTPUT FORMAT (JSON):
{
  "name": "${brandName}",
  "aliases": ["alternate names"],
  "signatureColors": ["brand signature colors"],
  "website": "official url",
  "products": [
    {
      "id": "unique-slug-id",
      "name": "Product Name",
      "brand": "${brandName}",
      "category": "${category}",
      "subcategory": "subcategory",
      "releaseYear": 2024,
      "msrp": 499,
      "visualSignature": {
        "primaryColors": ["main colors"],
        "secondaryColors": ["accent colors"],
        "colorwayName": "Official colorway name",
        "patterns": ["solid", "gradient", etc],
        "finish": "matte|glossy|metallic|etc",
        "designCues": ["visual features that identify this product"],
        "distinguishingFeatures": ["unique aspects vs similar products"],
        "logoPlacement": "where logo appears"
      },
      "specifications": {
        "key": "value specifications"
      },
      "variants": [
        {
          "sku": "product-code",
          "variantName": "Variant description",
          "specifications": {"variant specs"},
          "colorway": "Colorway name",
          "availability": "current|discontinued"
        }
      ],
      "searchKeywords": ["search terms"],
      "productUrl": "product page url",
      "description": "brief description",
      "features": ["key features"],
      "lastUpdated": "${new Date().toISOString()}",
      "source": "ai",
      "dataConfidence": 85
    }
  ],
  "lastUpdated": "${new Date().toISOString()}"
}

Be thorough and accurate. Include at least 5-10 products with their colorway variants.`;
}

// Main entry point
async function main() {
  const args = process.argv.slice(2);

  if (args.includes('--status') || args.includes('-s')) {
    showStatus();
    return;
  }

  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
Product Library Builder

Usage:
  node scripts/build-product-library.mjs [category] [brand]
  node scripts/build-product-library.mjs --status

Commands:
  <category>           Build all brands for a category
  <category> <brand>   Build specific brand
  --status, -s         Show library status
  --help, -h           Show this help

Categories: ${Object.keys(CATEGORY_CONFIGS).join(', ')}

Examples:
  node scripts/build-product-library.mjs golf
  node scripts/build-product-library.mjs golf Callaway
  node scripts/build-product-library.mjs --status

The generated prompts can be used with Claude or GPT-4 to generate product data.
Copy the output to the AI and paste the JSON response back.
`);
    return;
  }

  const category = args[0];
  const brand = args[1];

  if (!category) {
    console.log('Usage: node scripts/build-product-library.mjs <category> [brand]');
    console.log('Use --status to see current library state');
    return;
  }

  if (!CATEGORY_CONFIGS[category]) {
    console.log(`Unknown category: ${category}`);
    console.log(`Available: ${Object.keys(CATEGORY_CONFIGS).join(', ')}`);
    return;
  }

  const config = CATEGORY_CONFIGS[category];

  if (brand) {
    // Generate prompt for specific brand
    console.log(`\n=== Brand Agent Prompt for ${brand} ===\n`);
    console.log(generateBrandPrompt(category, brand));
    console.log('\n=== Copy the above prompt to Claude/GPT-4 ===\n');
  } else {
    // Show brands to build
    const library = loadLibrary(category);
    const existingBrands = new Set(library.brands.map(b => b.name.toLowerCase()));
    const missingBrands = config.priorityBrands.filter(
      b => !existingBrands.has(b.toLowerCase())
    );

    console.log(`\n=== ${category.toUpperCase()} Category ===\n`);
    console.log(`Priority brands: ${config.priorityBrands.length}`);
    console.log(`Already in library: ${existingBrands.size}`);
    console.log(`Missing: ${missingBrands.length}`);

    if (missingBrands.length > 0) {
      console.log(`\nBrands to build:`);
      missingBrands.forEach((b, i) => console.log(`  ${i + 1}. ${b}`));
      console.log(`\nRun: node scripts/build-product-library.mjs ${category} "${missingBrands[0]}"`);
    } else {
      console.log('\nAll priority brands are in the library!');
    }
  }
}

main().catch(console.error);
