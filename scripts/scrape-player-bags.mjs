#!/usr/bin/env node
/**
 * In The Golf Bag - Player Bag Scraper
 *
 * Scrapes EVERY player bag from inthegolfbag.com to build
 * a comprehensive library of current golf equipment.
 *
 * Site has ~19 pages of players, each with detailed equipment specs.
 */

import { config } from 'dotenv';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import { readFileSync, writeFileSync, existsSync } from 'fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, '..', '.env.local') });

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const LIBRARY_PATH = resolve(__dirname, '..', 'lib', 'productLibrary', 'data', 'golf.json');
const PROGRESS_PATH = resolve(__dirname, '..', 'lib', 'productLibrary', 'data', 'scrape-progress.json');

// Track unique products we've seen
const seenProducts = new Map(); // key: "brand-product" -> product data

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
 * Load/save progress for resuming
 */
function loadProgress() {
  if (existsSync(PROGRESS_PATH)) {
    return JSON.parse(readFileSync(PROGRESS_PATH, 'utf-8'));
  }
  return { lastPage: 0, processedPlayers: [] };
}

function saveProgress(progress) {
  writeFileSync(PROGRESS_PATH, JSON.stringify(progress, null, 2));
}

/**
 * Fetch player URLs from a page
 */
async function fetchPlayerUrls(pageNum) {
  // Site doesn't use www - use inthegolfbag.com directly
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

    // Extract player URLs - both with and without www
    const playerRegex = /href="(https:\/\/(www\.)?inthegolfbag\.com\/players\/[a-z0-9-]+\/)"/gi;
    const urls = new Set();
    let match;

    while ((match = playerRegex.exec(html)) !== null) {
      // Normalize to non-www version
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
 * Extract equipment from a player's bag using AI
 */
async function extractEquipment(playerUrl, playerName) {
  try {
    const response = await fetch(playerUrl);
    if (!response.ok) return [];

    const html = await response.text();

    // Use AI to extract equipment
    const result = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Use mini for cost efficiency
      messages: [
        {
          role: 'system',
          content: `You are a golf equipment expert. Extract ALL equipment from this player's bag.

For EACH item, provide:
- brand: The manufacturer (TaylorMade, Titleist, Callaway, Ping, etc.)
- name: Product name (e.g., "Qi10 Driver", "Pro V1", "Vokey SM10")
- category: One of: drivers, fairway-woods, hybrids, irons, wedges, putters, golf-balls, utility-irons
- year: Release year if known (estimate based on product line)
- specs: Any specs mentioned (loft, shaft, etc.)

Return JSON array ONLY:
[
  {"brand": "TaylorMade", "name": "Qi10 Driver", "category": "drivers", "year": 2024, "specs": "9°"},
  {"brand": "Titleist", "name": "Pro V1", "category": "golf-balls", "year": 2024}
]

Extract EVERY product mentioned. Include clubs, balls, shafts brands, grips if specified.`
        },
        {
          role: 'user',
          content: `Player: ${playerName}\n\nHTML (truncated):\n${html.slice(0, 40000)}`
        }
      ],
      max_tokens: 2000,
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const content = result.choices[0]?.message?.content || '{"items":[]}';
    const parsed = JSON.parse(content);
    const items = parsed.items || parsed.equipment || parsed || [];

    return Array.isArray(items) ? items : [];
  } catch (error) {
    console.error(`  Error extracting from ${playerName}:`, error.message);
    return [];
  }
}

/**
 * Create a unique product key
 */
function productKey(brand, name) {
  return `${brand.toLowerCase()}-${name.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
}

/**
 * Enrich a product with full details
 */
async function enrichProduct(product) {
  const prompt = `Create product library entry for: ${product.brand} ${product.name}
Category: ${product.category}
Year: ${product.year || 2024}

Return JSON:
{
  "id": "brand-product-slug-year",
  "name": "${product.name}",
  "brand": "${product.brand}",
  "category": "golf",
  "subcategory": "${product.category}",
  "releaseYear": ${product.year || 2024},
  "msrp": estimated_retail_price,
  "visualSignature": {
    "primaryColors": ["main colors"],
    "secondaryColors": ["accent colors"],
    "patterns": ["solid" or "carbon-weave"],
    "finish": "matte/gloss/satin",
    "designCues": ["key visual features"],
    "distinguishingFeatures": ["unique identifiers"],
    "logoPlacement": "crown/sole"
  },
  "description": "2-3 sentence product description",
  "searchKeywords": ["search terms", "abbreviations"],
  "aliases": ["common nicknames"],
  "variants": [
    {"sku": "SKU", "variantName": "spec variant", "colorway": "Default", "availability": "current"}
  ],
  "productUrl": "brand website URL",
  "source": "inthegolfbag",
  "dataConfidence": 90
}`;

  try {
    const result = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    return JSON.parse(result.choices[0]?.message?.content || '{}');
  } catch (error) {
    console.error(`  Error enriching ${product.name}:`, error.message);
    return null;
  }
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
    // Update if newer
    if ((product.releaseYear || 0) >= (brand.products[existingIdx].releaseYear || 0)) {
      brand.products[existingIdx] = { ...brand.products[existingIdx], ...product };
    }
    return false;
  } else {
    brand.products.push(product);
    return true;
  }
}

/**
 * Main scraper
 */
async function main() {
  console.log('═'.repeat(60));
  console.log('  In The Golf Bag - Player Bag Scraper');
  console.log('  Scraping every player bag for equipment data');
  console.log('═'.repeat(60));

  const library = loadLibrary();
  const progress = loadProgress();

  console.log(`\nStarting with: ${library.productCount} products`);
  console.log(`Resuming from page: ${progress.lastPage + 1}`);

  // Stats
  let totalPlayers = 0;
  let totalProducts = 0;
  let newProducts = 0;

  // Collect all player URLs first
  console.log('\n[PHASE 1] Collecting all player URLs...');
  const allPlayerUrls = [];

  for (let page = 1; page <= 19; page++) {
    const urls = await fetchPlayerUrls(page);
    allPlayerUrls.push(...urls);
    await new Promise(r => setTimeout(r, 500)); // Rate limit
  }

  console.log(`\nFound ${allPlayerUrls.length} total player URLs`);

  // Dedupe
  const uniqueUrls = [...new Set(allPlayerUrls)];
  console.log(`Unique players: ${uniqueUrls.length}`);

  // Filter already processed
  const toProcess = uniqueUrls.filter(url => !progress.processedPlayers.includes(url));
  console.log(`Players to process: ${toProcess.length}`);

  // Process each player
  console.log('\n[PHASE 2] Extracting equipment from player bags...');

  for (let i = 0; i < toProcess.length; i++) {
    const playerUrl = toProcess[i];
    const playerName = playerUrl.split('/players/')[1].replace(/\//g, '').replace(/-/g, ' ');

    process.stdout.write(`\n[${i + 1}/${toProcess.length}] ${playerName}... `);
    totalPlayers++;

    // Extract equipment
    const equipment = await extractEquipment(playerUrl, playerName);
    console.log(`${equipment.length} items`);

    // Process each item
    for (const item of equipment) {
      if (!item.brand || !item.name) continue;

      const key = productKey(item.brand, item.name);

      // Skip if already seen this run
      if (seenProducts.has(key)) {
        continue;
      }

      totalProducts++;
      process.stdout.write(`    → ${item.brand} ${item.name}... `);

      // Check if already in library
      const existingBrand = library.brands.find(b =>
        b.name.toLowerCase() === item.brand.toLowerCase()
      );
      const exists = existingBrand?.products.some(p =>
        p.name.toLowerCase() === item.name.toLowerCase()
      );

      if (exists) {
        console.log('exists');
        seenProducts.set(key, true);
        continue;
      }

      // Enrich
      const enriched = await enrichProduct(item);

      if (enriched && enriched.name) {
        const added = addToLibrary(library, enriched);
        if (added) {
          newProducts++;
          console.log('ADDED');
        } else {
          console.log('updated');
        }
        seenProducts.set(key, enriched);
      } else {
        console.log('failed');
      }

      // Rate limit
      await new Promise(r => setTimeout(r, 200));
    }

    // Mark player as processed
    progress.processedPlayers.push(playerUrl);

    // Save periodically
    if (i > 0 && i % 10 === 0) {
      saveLibrary(library);
      saveProgress(progress);
    }
  }

  // Final save
  saveLibrary(library);
  progress.lastPage = 19;
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
