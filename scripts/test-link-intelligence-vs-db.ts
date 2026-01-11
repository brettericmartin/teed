/**
 * Test Link Intelligence library against real data in the database
 *
 * Fetches sample items from product_library and bag_items,
 * runs them through the Link Intelligence library,
 * and compares the results.
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import {
  classifyUrl,
  parseEmbedUrl,
  parseSocialProfileUrl,
  matchUrl,
  getPlatformByDomain,
} from '../lib/linkIntelligence';
import { getBrandFromDomain } from '../lib/linkIdentification/domainBrands';

// Load environment variables
config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TestResult {
  url: string;
  storedData: {
    brand?: string | null;
    productName?: string | null;
    category?: string | null;
  };
  linkIntelligence: {
    type: string;
    platform: string;
    brand?: string | null;
  };
  match: {
    brand: boolean;
    type: string;
  };
}

async function testProductLibrary(): Promise<TestResult[]> {
  console.log('\n=== Testing Product Library Entries ===\n');

  // Fetch random sample of product library entries
  const { data: products, error } = await supabase
    .from('product_library')
    .select('url, brand, product_name, category, domain, confidence')
    .order('hit_count', { ascending: false })
    .limit(30);

  if (error) {
    console.error('Error fetching product library:', error);
    return [];
  }

  if (!products || products.length === 0) {
    console.log('No products found in product_library');
    return [];
  }

  console.log(`Found ${products.length} products to test\n`);

  const results: TestResult[] = [];

  for (const product of products) {
    const classification = classifyUrl(product.url);
    const domainBrand = getBrandFromDomain(product.domain);

    const liBrand = domainBrand?.brand || null;
    const storedBrand = product.brand;

    // Check brand match (case insensitive, null-safe)
    const brandMatches =
      (!storedBrand && !liBrand) ||
      (storedBrand && liBrand && storedBrand.toLowerCase() === liBrand.toLowerCase());

    results.push({
      url: product.url,
      storedData: {
        brand: storedBrand,
        productName: product.product_name,
        category: product.category,
      },
      linkIntelligence: {
        type: classification.type,
        platform: classification.platform,
        brand: liBrand,
      },
      match: {
        brand: brandMatches,
        type: classification.type === 'product' ? 'correct' : 'mismatch',
      },
    });

    // Print result
    const brandStatus = brandMatches ? '✓' : '✗';
    const typeStatus = classification.type === 'product' ? '✓' : '✗';

    console.log(`URL: ${product.url.substring(0, 80)}...`);
    console.log(`  Stored:  brand="${storedBrand || 'null'}", name="${(product.product_name || '').substring(0, 40)}"`);
    console.log(`  LI:      type=${classification.type}, platform=${classification.platform}, brand="${liBrand || 'null'}"`);
    console.log(`  Match:   brand=${brandStatus}  type=${typeStatus}`);
    console.log('');
  }

  return results;
}

async function testBagItemLinks(): Promise<void> {
  console.log('\n=== Testing Bag Item Links ===\n');

  // Fetch items with their links
  const { data: links, error } = await supabase
    .from('links')
    .select(`
      url,
      kind,
      bag_item:bag_items!bag_item_id (
        brand,
        custom_name
      )
    `)
    .not('bag_item_id', 'is', null)
    .limit(40);

  if (error) {
    console.error('Error fetching links:', error);
    return;
  }

  if (!links || links.length === 0) {
    console.log('No bag item links found');
    return;
  }

  console.log(`Found ${links.length} links to test\n`);

  let embedMatches = 0;
  let socialMatches = 0;
  let productMatches = 0;
  let brandMatches = 0;
  let totalWithBrand = 0;

  for (const link of links) {
    const classification = classifyUrl(link.url);
    const bagItem = (link.bag_item as any)?.[0] || link.bag_item;
    const storedBrand = bagItem?.brand;

    // Get brand from Link Intelligence
    let liBrand: string | null = null;
    try {
      const url = new URL(link.url);
      const domain = url.hostname.replace('www.', '');
      const domainBrand = getBrandFromDomain(domain);
      liBrand = domainBrand?.brand || null;
    } catch {}

    // Track type distribution
    if (classification.type === 'embed') embedMatches++;
    else if (classification.type === 'social') socialMatches++;
    else if (classification.type === 'product') productMatches++;

    // Track brand match
    if (storedBrand) {
      totalWithBrand++;
      if (liBrand && storedBrand.toLowerCase().includes(liBrand.toLowerCase())) {
        brandMatches++;
      } else if (liBrand && liBrand.toLowerCase().includes(storedBrand.toLowerCase())) {
        brandMatches++;
      }
    }

    // Print result
    const itemName = bagItem?.custom_name?.substring(0, 30) || '(no name)';
    console.log(`${classification.type.padEnd(8)} | ${classification.platform.padEnd(15)} | ${itemName}`);
    if (storedBrand) {
      const match = liBrand && (storedBrand.toLowerCase().includes(liBrand.toLowerCase()) || liBrand.toLowerCase().includes(storedBrand.toLowerCase()));
      console.log(`         Brand: stored="${storedBrand}" vs LI="${liBrand || 'null'}" ${match ? '✓' : '✗'}`);
    }
  }

  console.log('\n=== Summary ===');
  console.log(`Type distribution: embed=${embedMatches}, social=${socialMatches}, product=${productMatches}`);
  console.log(`Brand matches: ${brandMatches}/${totalWithBrand} (${Math.round(brandMatches/totalWithBrand*100)}%)`);
}

async function testEmbedUrls(): Promise<void> {
  console.log('\n=== Testing Embed URL Detection ===\n');

  const testUrls = [
    // YouTube
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    'https://youtu.be/dQw4w9WgXcQ',
    'https://www.youtube.com/shorts/dQw4w9WgXcQ',

    // TikTok
    'https://www.tiktok.com/@username/video/7106594312292453675',
    'https://vm.tiktok.com/abc123',

    // Instagram
    'https://www.instagram.com/p/ABC123xyz/',
    'https://www.instagram.com/reel/ABC123xyz/',

    // Spotify
    'https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh',
    'https://open.spotify.com/album/abc123',

    // Twitter/X
    'https://twitter.com/elonmusk/status/1234567890',
    'https://x.com/username/status/1234567890',

    // Others
    'https://www.twitch.tv/videos/1234567890',
    'https://vimeo.com/123456789',
    'https://soundcloud.com/artist/track-name',
    'https://www.pinterest.com/pin/123456789',
    'https://www.reddit.com/r/programming/comments/abc123',
  ];

  let passed = 0;
  let failed = 0;

  for (const url of testUrls) {
    const classification = classifyUrl(url);
    const embed = parseEmbedUrl(url);

    const isEmbed = classification.type === 'embed';
    const status = isEmbed ? '✓' : '✗';

    if (isEmbed) passed++;
    else failed++;

    console.log(`${status} ${url.substring(0, 60).padEnd(62)} → ${classification.type} (${classification.platform})`);
    if (embed) {
      console.log(`   Embed ID: ${embed.contentId}, Type: ${embed.contentType || 'default'}`);
    }
  }

  console.log(`\nEmbed Detection: ${passed}/${testUrls.length} passed (${Math.round(passed/testUrls.length*100)}%)`);
}

async function testSocialProfiles(): Promise<void> {
  console.log('\n=== Testing Social Profile Detection ===\n');

  const testUrls = [
    // Should be social profiles
    'https://twitter.com/elonmusk',
    'https://x.com/openai',
    'https://www.instagram.com/natgeo',
    'https://www.tiktok.com/@charlidamelio',
    'https://www.youtube.com/@MrBeast',
    'https://www.linkedin.com/in/satyanadella',
    'https://github.com/anthropics',
    'https://www.twitch.tv/ninja',
    'https://linktr.ee/example',
    'https://bsky.app/profile/jay.bsky.team',

    // Should NOT be social profiles (embeds or products)
    'https://twitter.com/elonmusk/status/1234567890', // Tweet
    'https://www.instagram.com/p/ABC123/', // Post
    'https://www.youtube.com/watch?v=dQw4w9WgXcQ', // Video
  ];

  let passed = 0;
  let failed = 0;

  for (const url of testUrls) {
    const classification = classifyUrl(url);
    const social = parseSocialProfileUrl(url);

    // URLs with /status, /p/, /watch should NOT be social
    const shouldBeSocial = !url.includes('/status/') && !url.includes('/p/') && !url.includes('/watch');
    const isSocial = classification.type === 'social';

    const correct = shouldBeSocial === isSocial;
    const status = correct ? '✓' : '✗';

    if (correct) passed++;
    else failed++;

    console.log(`${status} ${url.substring(0, 55).padEnd(57)} → ${classification.type} (${classification.platform})`);
    if (social) {
      console.log(`   Username: @${social.username}`);
    }
  }

  console.log(`\nSocial Profile Detection: ${passed}/${testUrls.length} passed (${Math.round(passed/testUrls.length*100)}%)`);
}

async function main() {
  console.log('========================================');
  console.log('Link Intelligence vs Database Test');
  console.log('========================================');

  // Test embed URL detection
  await testEmbedUrls();

  // Test social profile detection
  await testSocialProfiles();

  // Test against product library
  const productResults = await testProductLibrary();

  // Calculate product library stats
  const brandCorrect = productResults.filter(r => r.match.brand).length;
  const typeCorrect = productResults.filter(r => r.match.type === 'correct').length;

  console.log('\n=== Product Library Summary ===');
  console.log(`Brand match rate: ${brandCorrect}/${productResults.length} (${Math.round(brandCorrect/productResults.length*100)}%)`);
  console.log(`Type correct rate: ${typeCorrect}/${productResults.length} (${Math.round(typeCorrect/productResults.length*100)}%)`);

  // Test against bag item links
  await testBagItemLinks();

  console.log('\n========================================');
  console.log('Test Complete');
  console.log('========================================');
}

main().catch(console.error);
