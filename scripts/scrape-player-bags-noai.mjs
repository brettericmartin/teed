#!/usr/bin/env node
/**
 * In The Golf Bag - Player Bag Scraper (NO AI VERSION)
 *
 * Scrapes EVERY player bag from inthegolfbag.com using regex parsing.
 * No OpenAI API calls - much faster and no rate limits.
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env.local') });

const LIBRARY_PATH = resolve(__dirname, '..', 'lib', 'productLibrary', 'data', 'golf.json');
const PROGRESS_PATH = resolve(__dirname, '..', 'lib', 'productLibrary', 'data', 'scrape-progress-noai.json');

// Known brand names for parsing
const KNOWN_BRANDS = [
  'TaylorMade', 'Callaway', 'Titleist', 'Ping', 'Cobra', 'Mizuno', 'Srixon', 'Cleveland',
  'Bridgestone', 'Wilson', 'PXG', 'Scotty Cameron', 'Odyssey', 'Bettinardi', 'Tour Edge',
  'Fujikura', 'Graphite Design', 'Mitsubishi', 'Project X', 'True Temper', 'Nippon',
  'KBS', 'Aldila', 'UST Mamiya', 'SuperStroke', 'Golf Pride', 'Lamkin', 'IOMIC',
  'Vokey', 'Mack Daddy', 'Jaws', 'SM9', 'SM10', 'Hi-Toe', 'RTX',
];

// Category detection patterns
const CATEGORY_PATTERNS = {
  'drivers': /driver/i,
  'fairway-woods': /fairway|wood|[35]w|7w/i,
  'hybrids': /hybrid|rescue/i,
  'irons': /iron|[4-9]i|pw/i,
  'wedges': /wedge|lob|sand|gap|[456][0-9]°/i,
  'putters': /putter|spider|newport|squareback|mallet|blade/i,
  'golf-balls': /pro\s*v1|tp5|chrome soft|tour\s*b|z-star|ball/i,
};

// Track unique products
const seenProducts = new Map();

/**
 * Load existing library
 */
function loadLibrary() {
  if (existsSync(LIBRARY_PATH)) {
    return JSON.parse(readFileSync(LIBRARY_PATH, 'utf-8'));
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

/**
 * Save library
 */
function saveLibrary(library) {
  library.productCount = library.brands.reduce((sum, b) => sum + b.products.length, 0);
  library.variantCount = library.brands.reduce((sum, b) =>
    sum + b.products.reduce((pSum, p) => pSum + (p.variants?.length || 0), 0), 0);
  library.lastUpdated = new Date().toISOString();

  writeFileSync(LIBRARY_PATH, JSON.stringify(library, null, 2));
  console.log(`\n[SAVED] ${library.productCount} products, ${library.variantCount} variants`);
}

/**
 * Load/save progress
 */
function loadProgress() {
  if (existsSync(PROGRESS_PATH)) {
    return JSON.parse(readFileSync(PROGRESS_PATH, 'utf-8'));
  }
  return { processedPlayers: [] };
}

function saveProgress(progress) {
  writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2));
}

/**
 * Fetch player URLs from a page
 */
async function fetchPlayerUrls(pageNum) {
  const url = pageNum === 1
    ? 'https://inthegolfbag.com/players/'
    : `https://inthegolfbag.com/players/page/${pageNum}/`;

  console.log(`\nFetching page ${pageNum}...`);

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.log(`  Page ${pageNum} returned ${response.status}`);
      return [];
    }

    const html = await response.text();
    const playerRegex = /href="(https:\/\/(www\.)?inthegolfbag\.com\/players\/[a-z0-9-]+\/)"/gi;
    const urls = new Set();
    let match;

    while ((match = playerRegex.exec(html)) !== null) {
      const normalizedUrl = match[1].replace('www.', '');
      urls.add(normalizedUrl);
    }

    console.log(`  Found ${urls.size} player URLs`);
    return Array.from(urls);
  } catch (error) {
    console.error(`  Error fetching page ${pageNum}:`, error.message);
    return [];
  }
}

/**
 * Detect brand from product name
 */
function detectBrand(productName) {
  for (const brand of KNOWN_BRANDS) {
    if (productName.toLowerCase().includes(brand.toLowerCase())) {
      return brand;
    }
  }
  // Try first word as brand
  const firstWord = productName.split(/\s+/)[0];
  if (firstWord && firstWord.length > 2) {
    return firstWord;
  }
  return 'Unknown';
}

/**
 * Detect category from product name
 */
function detectCategory(productName) {
  for (const [category, pattern] of Object.entries(CATEGORY_PATTERNS)) {
    if (pattern.test(productName)) {
      return category;
    }
  }
  return 'other';
}

/**
 * Extract equipment from HTML using regex (NO AI)
 */
function extractEquipmentFromHtml(html) {
  const products = [];

  // Pattern 1: Products in h3 tags
  const h3Regex = /<h3[^>]*>([^<]+)<\/h3>/gi;
  let match;

  while ((match = h3Regex.exec(html)) !== null) {
    const productName = match[1].trim();

    // Skip non-product h3s
    if (
      productName.length < 5 ||
      productName.length > 100 ||
      /latest|news|related|popular|comments|share/i.test(productName)
    ) {
      continue;
    }

    const brand = detectBrand(productName);
    const category = detectCategory(productName);

    if (category !== 'other') {
      products.push({
        name: productName,
        brand: brand,
        category: category,
      });
    }
  }

  // Pattern 2: Look for product patterns in alt text
  const altRegex = /alt="([^"]+(?:driver|iron|wedge|putter|fairway|hybrid|wood|ball)[^"]*)"/gi;
  while ((match = altRegex.exec(html)) !== null) {
    const productName = match[1].trim();
    const brand = detectBrand(productName);
    const category = detectCategory(productName);

    if (category !== 'other' && !products.some(p => p.name === productName)) {
      products.push({
        name: productName,
        brand: brand,
        category: category,
      });
    }
  }

  return products;
}

/**
 * Create unique product key
 */
function productKey(brand, name) {
  return `${brand.toLowerCase()}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
}

/**
 * Create product entry (without AI enrichment)
 */
function createProductEntry(product) {
  const id = productKey(product.brand, product.name);

  return {
    id: id,
    name: product.name,
    brand: product.brand,
    category: 'golf',
    subcategory: product.category,
    releaseYear: 2024, // Default to current
    visualSignature: {
      primaryColors: ['black'],
      secondaryColors: ['silver'],
      finish: 'matte'
    },
    description: `${product.brand} ${product.name}`,
    searchKeywords: product.name.toLowerCase().split(/\s+/),
    aliases: [],
    variants: [
      { sku: id, variantName: 'Standard', colorway: 'Default', availability: 'current' }
    ],
    source: 'inthegolfbag',
    dataConfidence: 70 // Lower confidence since no AI enrichment
  };
}

/**
 * Add product to library
 */
function addToLibrary(library, product) {
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

  // Check if exists
  const existingIdx = brand.products.findIndex(p =>
    p.id === product.id || p.name.toLowerCase() === product.name.toLowerCase()
  );

  if (existingIdx >= 0) {
    return false; // Already exists
  }

  brand.products.push(product);
  return true;
}

/**
 * Main scraper
 */
async function main() {
  console.log('═'.repeat(60));
  console.log('  In The Golf Bag - Player Bag Scraper (NO AI)');
  console.log('  Fast HTML parsing - no API limits');
  console.log('═'.repeat(60));

  const library = loadLibrary();
  const progress = loadProgress();

  console.log(`\nStarting with: ${library.productCount} products`);

  // Stats
  let totalPlayers = 0;
  let totalProducts = 0;
  let newProducts = 0;

  // Collect all player URLs
  console.log('\n[PHASE 1] Collecting all player URLs...');
  const allPlayerUrls = [];

  for (let page = 1; page <= 19; page++) {
    const urls = await fetchPlayerUrls(page);
    allPlayerUrls.push(...urls);
    await new Promise(r => setTimeout(r, 300));
  }

  const uniqueUrls = [...new Set(allPlayerUrls)];
  console.log(`\nFound ${uniqueUrls.length} unique players`);

  // Filter already processed
  const toProcess = uniqueUrls.filter(url => !progress.processedPlayers.includes(url));
  console.log(`Players to process: ${toProcess.length}`);

  // Process each player
  console.log('\n[PHASE 2] Extracting equipment from player bags...');

  for (let i = 0; i < toProcess.length; i++) {
    const playerUrl = toProcess[i];
    const playerName = playerUrl.split('/players/')[1].replace(/\//g, '').replace(/-/g, ' ');

    process.stdout.write(`[${i + 1}/${toProcess.length}] ${playerName}... `);
    totalPlayers++;

    try {
      const response = await fetch(playerUrl);
      if (!response.ok) {
        console.log('fetch failed');
        continue;
      }

      const html = await response.text();
      const equipment = extractEquipmentFromHtml(html);

      console.log(`${equipment.length} items`);

      for (const item of equipment) {
        if (!item.brand || !item.name) continue;

        const key = productKey(item.brand, item.name);

        if (seenProducts.has(key)) continue;
        seenProducts.set(key, true);

        totalProducts++;

        // Check if already in library
        const existingBrand = library.brands.find(b =>
          b.name.toLowerCase() === item.brand.toLowerCase()
        );
        const exists = existingBrand?.products.some(p =>
          p.name.toLowerCase() === item.name.toLowerCase()
        );

        if (!exists) {
          const productEntry = createProductEntry(item);
          const added = addToLibrary(library, productEntry);
          if (added) {
            newProducts++;
            process.stdout.write(`    + ${item.brand} ${item.name}\n`);
          }
        }
      }

      // Mark as processed
      progress.processedPlayers.push(playerUrl);

      // Save periodically
      if (i > 0 && i % 20 === 0) {
        saveLibrary(library);
        saveProgress(progress);
      }

      // Small delay to be nice to the server
      await new Promise(r => setTimeout(r, 100));

    } catch (error) {
      console.log(`error: ${error.message}`);
    }
  }

  // Final save
  saveLibrary(library);
  saveProgress(progress);

  console.log('\n' + '═'.repeat(60));
  console.log('  Scrape Complete!');
  console.log('═'.repeat(60));
  console.log(`  Players scraped: ${totalPlayers}`);
  console.log(`  Products found: ${totalProducts}`);
  console.log(`  New products added: ${newProducts}`);
  console.log(`  Library total: ${library.productCount} products`);
}

main().catch(console.error);
