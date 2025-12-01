#!/usr/bin/env node
/**
 * Clean Product Library Data
 *
 * Fixes issues with scraped data:
 * 1. Removes duplicate brand names from product names
 *    e.g., "TaylorMade Qi35 Driver" with brand="TaylorMade" -> name="Qi35 Driver"
 * 2. Fixes doubled brand in descriptions
 * 3. Normalizes product IDs
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const LIBRARY_PATH = resolve(__dirname, '..', 'lib', 'productLibrary', 'data', 'golf.json');

// Known brand patterns to strip from product names
const BRAND_PATTERNS = [
  'TaylorMade', 'Callaway', 'Titleist', 'Ping', 'Cobra', 'Mizuno', 'Srixon',
  'Cleveland', 'Bridgestone', 'Wilson', 'PXG', 'Scotty Cameron', 'Odyssey',
  'Bettinardi', 'Tour Edge', 'L.A.B.', 'LAB', 'Miura', 'Fujikura', 'Yonex',
  'Vokey', 'Vice', 'Kirkland', 'OnCore', 'Krank', 'Sub 70', 'Good Good',
  'Takomo', 'GTD', 'Adams', 'Nike', 'Toulon', 'Artisan', 'Evnroll', 'SeeMore',
  'Swag', 'Burke', 'Sik', 'Avoda', 'Maxfli', 'Vice Golf',
];

function cleanProductName(name, brand) {
  if (!name || !brand) return name;

  let cleanedName = name;

  // Remove exact brand match at start (case insensitive)
  const brandRegex = new RegExp(`^${escapeRegex(brand)}\\s+`, 'i');
  cleanedName = cleanedName.replace(brandRegex, '');

  // Also check for common brand variations
  for (const knownBrand of BRAND_PATTERNS) {
    if (knownBrand.toLowerCase() === brand.toLowerCase()) {
      const variations = [knownBrand, knownBrand.toLowerCase(), knownBrand.toUpperCase()];
      for (const variation of variations) {
        const varRegex = new RegExp(`^${escapeRegex(variation)}\\s+`, 'i');
        cleanedName = cleanedName.replace(varRegex, '');
      }
    }
  }

  return cleanedName.trim();
}

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function cleanDescription(description, brand) {
  if (!description || !brand) return description;

  // Fix doubled brand names like "TaylorMade TaylorMade Qi35 Driver"
  const doubledBrandRegex = new RegExp(`${escapeRegex(brand)}\\s+${escapeRegex(brand)}`, 'gi');
  return description.replace(doubledBrandRegex, brand);
}

function generateCleanId(brand, name) {
  const cleanBrand = brand.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-');
  return `${cleanBrand}-${cleanName}`.replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function main() {
  console.log('═'.repeat(60));
  console.log('  Product Library Data Cleaner');
  console.log('═'.repeat(60));

  const library = JSON.parse(readFileSync(LIBRARY_PATH, 'utf-8'));

  let totalProducts = 0;
  let cleanedProducts = 0;
  let cleanedDescriptions = 0;
  let cleanedIds = 0;

  for (const brand of library.brands) {
    console.log(`\n[${brand.name}] Processing ${brand.products.length} products...`);

    for (const product of brand.products) {
      totalProducts++;

      // Clean product name
      const originalName = product.name;
      const cleanedName = cleanProductName(originalName, brand.name);

      if (cleanedName !== originalName) {
        console.log(`  ✓ "${originalName}" → "${cleanedName}"`);
        product.name = cleanedName;
        cleanedProducts++;
      }

      // Clean description
      if (product.description) {
        const originalDesc = product.description;
        const cleanedDesc = cleanDescription(originalDesc, brand.name);

        // Also clean the product name from description
        const nameInDesc = cleanProductName(cleanedDesc, brand.name);
        product.description = nameInDesc !== cleanedDesc ? nameInDesc : cleanedDesc;

        if (product.description !== originalDesc) {
          cleanedDescriptions++;
        }
      }

      // Generate clean ID
      const cleanId = generateCleanId(brand.name, product.name);
      if (cleanId !== product.id) {
        product.id = cleanId;
        cleanedIds++;

        // Update variant SKUs too
        if (product.variants) {
          for (const variant of product.variants) {
            variant.sku = cleanId;
          }
        }
      }

      // Ensure brand field matches parent
      product.brand = brand.name;
    }
  }

  // Update counts
  library.productCount = library.brands.reduce((sum, b) => sum + b.products.length, 0);
  library.variantCount = library.brands.reduce((sum, b) =>
    sum + b.products.reduce((pSum, p) => pSum + (p.variants?.length || 0), 0), 0);
  library.lastUpdated = new Date().toISOString();

  // Save
  writeFileSync(LIBRARY_PATH, JSON.stringify(library, null, 2));

  console.log('\n' + '═'.repeat(60));
  console.log('  Cleaning Complete!');
  console.log('═'.repeat(60));
  console.log(`  Total products: ${totalProducts}`);
  console.log(`  Names cleaned: ${cleanedProducts}`);
  console.log(`  Descriptions cleaned: ${cleanedDescriptions}`);
  console.log(`  IDs regenerated: ${cleanedIds}`);
  console.log(`  Library saved: ${library.productCount} products`);
}

main();
