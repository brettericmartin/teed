/**
 * Test Full Extraction Pipeline against real data
 *
 * Tests the complete analyzeUrl() function which includes:
 * - URL classification
 * - Product extraction (with structured data, scraping, etc.)
 * - oEmbed enrichment for embeds
 * - Health checking
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { analyzeUrl, quickExtractProduct } from '../lib/linkIntelligence';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface ComparisonResult {
  url: string;
  stored: {
    brand: string | null;
    productName: string | null;
    imageUrl?: string | null;
  };
  extracted: {
    brand: string | null;
    productName: string | null;
    imageUrl?: string | null;
    confidence: number;
    source: string;
    processingTimeMs: number;
  };
  matches: {
    brand: boolean;
    productName: boolean;
    hasImage: boolean;
  };
}

function normalizeForComparison(str: string | null | undefined): string {
  if (!str) return '';
  return str.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
}

function brandsMatch(stored: string | null, extracted: string | null): boolean {
  if (!stored && !extracted) return true;
  if (!stored || !extracted) return false;

  const s = normalizeForComparison(stored);
  const e = normalizeForComparison(extracted);

  // Exact match
  if (s === e) return true;

  // One contains the other
  if (s.includes(e) || e.includes(s)) return true;

  return false;
}

function productNamesMatch(stored: string | null, extracted: string | null): boolean {
  if (!stored && !extracted) return true;
  if (!stored || !extracted) return false;

  const s = normalizeForComparison(stored);
  const e = normalizeForComparison(extracted);

  // Check for significant overlap (at least 50% of words match)
  const sWords = s.split(/\s+/).filter(w => w.length > 2);
  const eWords = e.split(/\s+/).filter(w => w.length > 2);

  if (sWords.length === 0 || eWords.length === 0) return false;

  const matches = sWords.filter(w => eWords.some(ew => ew.includes(w) || w.includes(ew)));
  const matchRatio = matches.length / Math.min(sWords.length, eWords.length);

  return matchRatio >= 0.3; // At least 30% of words match
}

async function testProductLibraryExtraction(): Promise<ComparisonResult[]> {
  console.log('\n=== Testing Full Extraction on Product Library URLs ===\n');

  // Fetch sample of product library entries with URLs
  const { data: products, error } = await supabase
    .from('product_library')
    .select('url, brand, product_name, full_name, image_url, domain, confidence')
    .order('hit_count', { ascending: false })
    .limit(10);

  if (error) {
    console.error('Error fetching product library:', error);
    return [];
  }

  if (!products || products.length === 0) {
    console.log('No products found in product_library');
    return [];
  }

  console.log(`Testing ${products.length} product URLs...\n`);

  const results: ComparisonResult[] = [];

  for (const product of products) {
    console.log(`\n--- Testing: ${product.url.substring(0, 70)}... ---`);
    console.log(`Stored: brand="${product.brand || 'null'}", name="${(product.product_name || '').substring(0, 40)}"`);

    try {
      // Use quick extraction (skip AI for speed, but still do scraping)
      const startTime = Date.now();
      const extraction = await quickExtractProduct(product.url, {
        skipAi: true,
        fetchTimeout: 8000
      });
      const elapsed = Date.now() - startTime;

      console.log(`Extracted: brand="${extraction.brand || 'null'}", name="${(extraction.productName || '').substring(0, 40)}"`);
      console.log(`  Source: ${extraction.primarySource}, Confidence: ${(extraction.confidence * 100).toFixed(0)}%, Time: ${elapsed}ms`);

      const brandMatch = brandsMatch(product.brand, extraction.brand);
      const nameMatch = productNamesMatch(product.product_name, extraction.productName);
      const hasImage = !!extraction.imageUrl;

      console.log(`  Match: brand=${brandMatch ? '✓' : '✗'}, name=${nameMatch ? '✓' : '✗'}, image=${hasImage ? '✓' : '✗'}`);

      results.push({
        url: product.url,
        stored: {
          brand: product.brand,
          productName: product.product_name,
          imageUrl: product.image_url,
        },
        extracted: {
          brand: extraction.brand,
          productName: extraction.productName,
          imageUrl: extraction.imageUrl,
          confidence: extraction.confidence,
          source: extraction.primarySource,
          processingTimeMs: elapsed,
        },
        matches: {
          brand: brandMatch,
          productName: nameMatch,
          hasImage,
        },
      });
    } catch (err) {
      console.error(`  Error extracting: ${err instanceof Error ? err.message : 'Unknown error'}`);
      results.push({
        url: product.url,
        stored: {
          brand: product.brand,
          productName: product.product_name,
          imageUrl: product.image_url,
        },
        extracted: {
          brand: null,
          productName: null,
          imageUrl: null,
          confidence: 0,
          source: 'error',
          processingTimeMs: 0,
        },
        matches: {
          brand: false,
          productName: false,
          hasImage: false,
        },
      });
    }
  }

  return results;
}

async function testBagItemExtraction(): Promise<ComparisonResult[]> {
  console.log('\n=== Testing Full Extraction on Bag Item Links ===\n');

  // Fetch items with their links
  const { data: links, error } = await supabase
    .from('links')
    .select(`
      url,
      kind,
      bag_item:bag_items!bag_item_id (
        brand,
        custom_name,
        photo_url
      )
    `)
    .not('bag_item_id', 'is', null)
    .limit(10);

  if (error) {
    console.error('Error fetching links:', error);
    return [];
  }

  if (!links || links.length === 0) {
    console.log('No bag item links found');
    return [];
  }

  console.log(`Testing ${links.length} bag item URLs...\n`);

  const results: ComparisonResult[] = [];

  for (const link of links) {
    const bagItem = (link.bag_item as any)?.[0] || link.bag_item;
    const storedBrand = bagItem?.brand;
    const storedName = bagItem?.custom_name;

    console.log(`\n--- Testing: ${link.url.substring(0, 70)}... ---`);
    console.log(`Stored: brand="${storedBrand || 'null'}", name="${(storedName || '').substring(0, 40)}"`);

    try {
      const startTime = Date.now();
      const extraction = await quickExtractProduct(link.url, {
        skipAi: true,
        fetchTimeout: 8000
      });
      const elapsed = Date.now() - startTime;

      console.log(`Extracted: brand="${extraction.brand || 'null'}", name="${(extraction.productName || '').substring(0, 40)}"`);
      console.log(`  Source: ${extraction.primarySource}, Confidence: ${(extraction.confidence * 100).toFixed(0)}%, Time: ${elapsed}ms`);

      const brandMatch = brandsMatch(storedBrand, extraction.brand);
      const nameMatch = productNamesMatch(storedName, extraction.productName);
      const hasImage = !!extraction.imageUrl;

      console.log(`  Match: brand=${brandMatch ? '✓' : '✗'}, name=${nameMatch ? '✓' : '✗'}, image=${hasImage ? '✓' : '✗'}`);

      results.push({
        url: link.url,
        stored: {
          brand: storedBrand,
          productName: storedName,
          imageUrl: bagItem?.photo_url,
        },
        extracted: {
          brand: extraction.brand,
          productName: extraction.productName,
          imageUrl: extraction.imageUrl,
          confidence: extraction.confidence,
          source: extraction.primarySource,
          processingTimeMs: elapsed,
        },
        matches: {
          brand: brandMatch,
          productName: nameMatch,
          hasImage,
        },
      });
    } catch (err) {
      console.error(`  Error extracting: ${err instanceof Error ? err.message : 'Unknown error'}`);
      results.push({
        url: link.url,
        stored: {
          brand: storedBrand,
          productName: storedName,
        },
        extracted: {
          brand: null,
          productName: null,
          confidence: 0,
          source: 'error',
          processingTimeMs: 0,
        },
        matches: {
          brand: false,
          productName: false,
          hasImage: false,
        },
      });
    }
  }

  return results;
}

async function testEmbedExtraction(): Promise<void> {
  console.log('\n=== Testing Embed Extraction with oEmbed ===\n');

  const embedUrls = [
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh',
    'https://vimeo.com/148751763',
  ];

  for (const url of embedUrls) {
    console.log(`\n--- Testing: ${url} ---`);

    try {
      const result = await analyzeUrl(url, {
        skipHealth: true,
        skipOembed: false
      });

      if (result.result.type === 'embed') {
        const embed = result.result;
        console.log(`Platform: ${embed.platform}`);
        console.log(`Content ID: ${embed.contentId}`);
        console.log(`Content Type: ${embed.contentType || 'default'}`);
        if (embed.oembed) {
          console.log(`oEmbed Title: ${embed.oembed.title || 'N/A'}`);
          console.log(`oEmbed Author: ${embed.oembed.authorName || 'N/A'}`);
          console.log(`oEmbed Thumbnail: ${embed.oembed.thumbnailUrl ? '✓' : '✗'}`);
        } else {
          console.log(`oEmbed: Not available`);
        }
      }
    } catch (err) {
      console.error(`Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
  }
}

function printSummary(
  productLibResults: ComparisonResult[],
  bagItemResults: ComparisonResult[]
): void {
  console.log('\n========================================');
  console.log('EXTRACTION TEST SUMMARY');
  console.log('========================================\n');

  const allResults = [...productLibResults, ...bagItemResults];

  const brandMatches = allResults.filter(r => r.matches.brand).length;
  const nameMatches = allResults.filter(r => r.matches.productName).length;
  const hasImages = allResults.filter(r => r.matches.hasImage).length;
  const totalTime = allResults.reduce((sum, r) => sum + r.extracted.processingTimeMs, 0);
  const avgTime = allResults.length > 0 ? Math.round(totalTime / allResults.length) : 0;
  const avgConfidence = allResults.length > 0
    ? (allResults.reduce((sum, r) => sum + r.extracted.confidence, 0) / allResults.length * 100).toFixed(0)
    : 0;

  // Source distribution
  const sources: Record<string, number> = {};
  for (const r of allResults) {
    sources[r.extracted.source] = (sources[r.extracted.source] || 0) + 1;
  }

  console.log(`Total URLs tested: ${allResults.length}`);
  console.log(`  - Product Library: ${productLibResults.length}`);
  console.log(`  - Bag Items: ${bagItemResults.length}`);
  console.log('');
  console.log('Match Rates:');
  console.log(`  Brand match:   ${brandMatches}/${allResults.length} (${Math.round(brandMatches/allResults.length*100)}%)`);
  console.log(`  Name match:    ${nameMatches}/${allResults.length} (${Math.round(nameMatches/allResults.length*100)}%)`);
  console.log(`  Has image:     ${hasImages}/${allResults.length} (${Math.round(hasImages/allResults.length*100)}%)`);
  console.log('');
  console.log('Performance:');
  console.log(`  Avg time:       ${avgTime}ms`);
  console.log(`  Avg confidence: ${avgConfidence}%`);
  console.log('');
  console.log('Source Distribution:');
  for (const [source, count] of Object.entries(sources).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${source}: ${count}`);
  }

  // Show mismatches for analysis
  const mismatches = allResults.filter(r => !r.matches.brand && r.stored.brand);
  if (mismatches.length > 0) {
    console.log('\n--- Brand Mismatches (for analysis) ---');
    for (const m of mismatches.slice(0, 5)) {
      console.log(`  "${m.stored.brand}" vs "${m.extracted.brand}" @ ${m.url.substring(0, 50)}...`);
    }
  }
}

async function main() {
  console.log('========================================');
  console.log('Full Extraction Pipeline Test');
  console.log('========================================');

  // Test embed extraction first (quick)
  await testEmbedExtraction();

  // Test product library extraction
  const productLibResults = await testProductLibraryExtraction();

  // Test bag item extraction
  const bagItemResults = await testBagItemExtraction();

  // Print summary
  printSummary(productLibResults, bagItemResults);

  console.log('\n========================================');
  console.log('Test Complete');
  console.log('========================================');
}

main().catch(console.error);
