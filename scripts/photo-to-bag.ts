/**
 * Photo-to-Bag: Full end-to-end pipeline.
 *
 * 1. Vision pipeline (enumerate → crop → visual search → identify → validate)
 * 2. Create bag in Supabase under @teed
 * 3. Insert bag items
 * 4. Find and verify links for each item (Google Search → curl verify)
 * 5. Insert links
 *
 * Usage:
 *   set -a && source .env.local && set +a && \
 *   npx tsx scripts/photo-to-bag.ts <image-path> --title "Bag Title" [--bag-type tech] [--min-confidence 50] [--max-items 30]
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import { execSync } from 'child_process';
import OpenAI from 'openai';

// ── Config ──────────────────────────────────────────────────────────

const TEED_USER_ID = '2c3e503a-78ce-4a8d-ae37-60b4a16d916e';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// ── Arg parsing ─────────────────────────────────────────────────────

function usage(): never {
  console.error('Usage: npx tsx scripts/photo-to-bag.ts <image-path> --title "Title" [options]');
  console.error('');
  console.error('Options:');
  console.error('  --title <title>          Bag title (required)');
  console.error('  --bag-type <type>        Category hint (e.g. tech, golf, kitchen)');
  console.error('  --min-confidence <N>     Minimum confidence to include (default: 50)');
  console.error('  --max-items <N>          Max items to process (default: unlimited)');
  console.error('  --dry-run                Run pipeline only, don\'t create bag');
  process.exit(1);
}

function parseArgs() {
  const args = process.argv.slice(2);
  if (args.length === 0) usage();

  let imagePath = '';
  let title = '';
  let bagType: string | undefined;
  let minConfidence = 50;
  let maxItems: number | undefined;
  let dryRun = false;

  let i = 0;
  while (i < args.length) {
    const arg = args[i];
    if (arg === '--title' && i + 1 < args.length) {
      title = args[++i];
    } else if (arg === '--bag-type' && i + 1 < args.length) {
      bagType = args[++i];
    } else if (arg === '--min-confidence' && i + 1 < args.length) {
      minConfidence = parseInt(args[++i], 10);
    } else if (arg === '--max-items' && i + 1 < args.length) {
      maxItems = parseInt(args[++i], 10);
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (!arg.startsWith('--')) {
      imagePath = arg;
    } else {
      console.error(`Unknown option: ${arg}`);
      usage();
    }
    i++;
  }

  if (!imagePath) {
    console.error('Error: image path is required');
    usage();
  }
  if (!title && !dryRun) {
    console.error('Error: --title is required (unless --dry-run)');
    usage();
  }

  return { imagePath, title, bagType, minConfidence, maxItems, dryRun };
}

// ── Link finding ────────────────────────────────────────────────────

interface FoundLink {
  url: string;
  kind: string;
  label: string;
  tier: number;
}

/** Verify a URL is live (non-404) via curl */
function verifyUrl(url: string): boolean {
  try {
    const result = execSync(
      `curl -sS -o /dev/null -w "%{http_code}" -L --max-time 8 ${JSON.stringify(url)}`,
      { timeout: 12000, encoding: 'utf-8' }
    ).trim();
    const code = parseInt(result, 10);
    // 200, 301, 302, 403 = valid (403 = bot protection, still works in browser)
    return code >= 200 && code < 500 && code !== 404;
  } catch {
    return false;
  }
}

/**
 * Scrape the og:image from a URL's HTML.
 * Returns the image URL or null if not found / fetch fails.
 */
function scrapeOgImage(url: string): string | null {
  try {
    const html = execSync(
      `curl -sS -L --max-time 6 -r 0-15360 ${JSON.stringify(url)}`,
      { timeout: 10000, encoding: 'utf-8', maxBuffer: 20 * 1024 }
    );

    // Try og:image (both attribute orderings)
    const ogMatch = html.match(/property="og:image"\s+content="([^"]{0,500})"/i)
      || html.match(/content="([^"]{0,500})"\s+property="og:image"/i);
    if (ogMatch?.[1]) return ogMatch[1];

    // Fallback: first product-looking <img> with src containing "product" or "dp/"
    const imgMatch = html.match(/<img[^>]+src="(https?:\/\/[^"]+(?:product|\/dp\/)[^"]*)"/i);
    if (imgMatch?.[1]) return imgMatch[1];

    return null;
  } catch {
    return null;
  }
}

/**
 * Visually compare the original crop against the product image on a candidate link page.
 * Scrapes og:image from the URL, sends both to GPT-4o for a quick same-product check.
 * Returns false if the page product is clearly different from the crop.
 * If no og:image or comparison fails → benefit of the doubt (true).
 */
async function validateLinkRelevance(
  url: string,
  cropBase64: string,
  productName: string
): Promise<boolean> {
  const ogImage = scrapeOgImage(url);
  if (!ogImage) {
    // Can't get a product image — benefit of the doubt
    return true;
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: cropBase64, detail: 'low' } },
            { type: 'image_url', image_url: { url: ogImage, detail: 'low' } },
            {
              type: 'text',
              text: `IMAGE 1: A cropped photo of "${productName}" from a desk/room scene.
IMAGE 2: A product image from a shopping page.

Are these the SAME type of product (same general category, form factor, and appearance)?
They do NOT need to be the exact same brand/model — just clearly the same kind of thing
(e.g., both are mice, both are speakers, both are keyboards).

Answer ONLY "yes" or "no".`,
            },
          ],
        },
      ],
      max_tokens: 10,
      temperature: 0,
    });

    const answer = (response.choices[0]?.message?.content || '').trim().toLowerCase();
    const isMatch = answer.startsWith('yes');

    if (!isMatch) {
      console.log(`  [relevance] REJECTED: "${url}" — og:image doesn't match crop (answer: ${answer})`);
    }
    return isMatch;
  } catch (error) {
    // API error — benefit of the doubt
    console.warn(`  [relevance] Compare failed for ${url}:`, error instanceof Error ? error.message : error);
    return true;
  }
}

/** Run a Google Custom Search query, return top results */
async function googleSearch(query: string): Promise<Array<{ title: string; link: string; displayLink: string }>> {
  const apiKey = process.env.GOOGLE_SEARCH_API_KEY;
  const cx = process.env.GOOGLE_SEARCH_ENGINE_ID;
  if (!apiKey || !cx) return [];

  try {
    const params = new URLSearchParams({
      key: apiKey,
      cx,
      q: query,
      num: '5',
      gl: 'us',
      lr: 'lang_en',
    });

    const resp = await fetch(`https://www.googleapis.com/customsearch/v1?${params}`);
    if (!resp.ok) return [];

    const data = await resp.json();
    return (data.items || []).map((item: any) => ({
      title: item.title || '',
      link: item.link || '',
      displayLink: item.displayLink || '',
    }));
  } catch {
    return [];
  }
}

/** Extract clean domain label from a URL */
function domainLabel(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, '');
    // Use friendly names for common domains
    const friendly: Record<string, string> = {
      'amazon.com': 'Amazon',
      'bestbuy.com': 'Best Buy',
      'bhphotovideo.com': 'B&H Photo',
      'newegg.com': 'Newegg',
      'walmart.com': 'Walmart',
      'target.com': 'Target',
      'adorama.com': 'Adorama',
    };
    return friendly[host] || host;
  } catch {
    return url;
  }
}

/** Guess the manufacturer domain from a brand name */
function guessBrandDomain(brand: string): string {
  const slug = brand.toLowerCase().replace(/[^a-z0-9]/g, '');
  const known: Record<string, string> = {
    apple: 'apple.com',
    logitech: 'logitech.com',
    keychron: 'keychron.com',
    razer: 'razer.com',
    corsair: 'corsair.com',
    benq: 'benq.com',
    samsung: 'samsung.com',
    dell: 'dell.com',
    lg: 'lg.com',
    sony: 'sony.com',
    ikea: 'ikea.com',
    amazon: 'amazon.com',
    elgato: 'elgato.com',
    sonos: 'sonos.com',
    steelcase: 'steelcase.com',
    hermanmiller: 'hermanmiller.com',
    secretlab: 'secretlab.com',
    nvidia: 'nvidia.com',
    msi: 'msi.com',
    asus: 'asus.com',
    anker: 'anker.com',
    ugreen: 'ugreen.com',
    google: 'store.google.com',
    microsoft: 'microsoft.com',
  };
  return known[slug] || `${slug}.com`;
}

/** 4-tier link search for a product */
async function findLink(
  brand: string | undefined,
  model: string | undefined,
  label: string,
  webProductUrl: string | undefined,
  cropBase64: string
): Promise<FoundLink | null> {
  const productName = [brand, model].filter(Boolean).join(' ') || label;

  // Tier 1: Pipeline's webProductUrl
  if (webProductUrl) {
    console.log(`  [link] Tier 1: checking pipeline URL ${webProductUrl}`);
    if (verifyUrl(webProductUrl) && await validateLinkRelevance(webProductUrl, cropBase64, productName)) {
      return { url: webProductUrl, kind: 'product', label: domainLabel(webProductUrl), tier: 1 };
    }
    console.log(`  [link] Tier 1: dead or irrelevant`);
  }

  // Tier 2: Manufacturer site
  if (brand) {
    const domain = guessBrandDomain(brand);
    console.log(`  [link] Tier 2: searching site:${domain} "${model || label}"`);
    const results = await googleSearch(`site:${domain} ${model || label}`);
    for (const r of results) {
      if (verifyUrl(r.link) && await validateLinkRelevance(r.link, cropBase64, productName)) {
        return { url: r.link, kind: 'product', label: domainLabel(r.link), tier: 2 };
      }
    }
  }

  // Tier 3: Amazon
  console.log(`  [link] Tier 3: searching Amazon for "${productName}"`);
  const amazonResults = await googleSearch(`site:amazon.com "${productName}"`);
  for (const r of amazonResults) {
    if (r.link.includes('/dp/') || r.link.includes('/gp/')) {
      if (verifyUrl(r.link) && await validateLinkRelevance(r.link, cropBase64, productName)) {
        return { url: r.link, kind: 'retailer', label: 'Amazon', tier: 3 };
      }
    }
  }

  // Tier 4: Best retailer
  console.log(`  [link] Tier 4: general search for "${productName}" buy`);
  const retailResults = await googleSearch(`"${productName}" buy`);
  for (const r of retailResults) {
    // Skip social media, reviews, forums
    const skip = ['reddit.com', 'youtube.com', 'facebook.com', 'twitter.com', 'tiktok.com', 'quora.com'];
    if (skip.some(d => r.displayLink.includes(d))) continue;
    if (verifyUrl(r.link) && await validateLinkRelevance(r.link, cropBase64, productName)) {
      return { url: r.link, kind: 'retailer', label: domainLabel(r.link), tier: 4 };
    }
  }

  console.log(`  [link] No verified link found for "${productName}"`);
  return null;
}

// ── Main ────────────────────────────────────────────────────────────

interface PipelineItem {
  id: number;
  label: string;
  category: string;
  brand?: string;
  model?: string;
  color?: string;
  confidence: number;
  validationVerdict: string;
  webProductUrl?: string;
  referenceImageUrl?: string;
  notes?: string;
  cropBase64: string;
}

async function main() {
  const { imagePath, title, bagType, minConfidence, maxItems, dryRun } = parseArgs();
  const startTime = Date.now();

  // ── Load image ──────────────────────────────────────────────────
  const absPath = path.resolve(imagePath);
  if (!fs.existsSync(absPath)) {
    console.error(`File not found: ${absPath}`);
    process.exit(1);
  }

  const buffer = fs.readFileSync(absPath);
  const ext = path.extname(absPath).toLowerCase();
  const mimeMap: Record<string, string> = {
    '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
    '.webp': 'image/webp', '.heic': 'image/heic',
  };
  const mimeType = mimeMap[ext] || 'image/jpeg';
  const imageBase64 = `data:${mimeType};base64,${buffer.toString('base64')}`;

  console.log(`\n📷 Loaded image: ${absPath} (${(buffer.length / 1024).toFixed(0)}KB)`);
  console.log(`   Options: bagType=${bagType ?? 'auto'}, minConfidence=${minConfidence}, maxItems=${maxItems ?? 'unlimited'}`);

  // ── Stage A: Vision Pipeline ────────────────────────────────────
  console.log('\n═══ Stage A: Vision Pipeline ═══\n');

  const { identifyItemsInPhoto } = await import('../lib/visionPipeline/index');
  const result = await identifyItemsInPhoto(imageBase64, {
    bagType,
    maxItems,
    noTimeout: true,
  });

  // Filter & map to clean items
  const items: PipelineItem[] = result.items
    .filter((item) => {
      const conf = item.corrected?.confidence ?? item.confidence;
      return conf >= minConfidence;
    })
    .sort((a, b) => {
      const confA = a.corrected?.confidence ?? a.confidence;
      const confB = b.corrected?.confidence ?? b.confidence;
      return confB - confA;
    })
    .map((item) => ({
      id: item.id,
      label: item.label,
      category: item.category,
      brand: (item.corrected?.brand ?? item.brand) ?? undefined,
      model: (item.corrected?.model ?? item.model) ?? undefined,
      color: (item.corrected?.color ?? item.color) ?? undefined,
      confidence: item.corrected?.confidence ?? item.confidence,
      validationVerdict: item.validation.verdict,
      webProductUrl: item.webDetection?.matchingPages[0]?.url ?? undefined,
      referenceImageUrl: item.validation.referenceImageUrl ?? undefined,
      notes: item.identificationNotes || undefined,
      cropBase64: item.cropBase64,
    }));

  const pipelineMs = result.stats.stageTimings.total;

  console.log(`\n═══ Vision Results ═══`);
  console.log(`Detected: ${result.stats.totalDetected} | Identified: ${result.stats.totalIdentified} | Verified: ${result.stats.totalVerified} | Included: ${items.length} | Time: ${(pipelineMs / 1000).toFixed(1)}s\n`);

  items.forEach((item, i) => {
    const verdict = item.validationVerdict === 'verified' ? '✓' : item.validationVerdict === 'mismatch' ? '✗' : '?';
    const name = [item.brand, item.model].filter(Boolean).join(' ') || item.label;
    console.log(`  ${i + 1}. [${verdict}] ${name} (${item.confidence}%) - ${item.label}`);
  });

  if (items.length === 0) {
    console.log('\nNo products identified with sufficient confidence. Exiting.');
    process.exit(0);
  }

  if (dryRun) {
    console.log('\n--dry-run: Skipping bag creation.');
    console.log(JSON.stringify({ items, stats: { totalDetected: result.stats.totalDetected, totalIdentified: result.stats.totalIdentified, totalVerified: result.stats.totalVerified, totalIncluded: items.length, pipelineTimeMs: pipelineMs } }, null, 2));
    process.exit(0);
  }

  // ── Quality Gate: Filter out low-quality identifications ────────
  console.log('\n═══ Quality Gate ═══\n');

  const beforeCount = items.length;
  const qualityItems = items.filter((item) => {
    // Reject validation mismatches
    if (item.validationVerdict === 'mismatch') {
      console.log(`  ✗ Rejected (mismatch): ${[item.brand, item.model].filter(Boolean).join(' ') || item.label}`);
      return false;
    }
    // Reject brandless items below 60% confidence
    if (!item.brand && item.confidence < 60) {
      console.log(`  ✗ Rejected (no brand, ${item.confidence}% < 60%): ${item.label}`);
      return false;
    }
    // Reject brand-only (no model) below 70% confidence
    if (item.brand && !item.model && item.confidence < 70) {
      console.log(`  ✗ Rejected (brand-only, ${item.confidence}% < 70%): ${item.brand} ${item.label}`);
      return false;
    }
    return true;
  });

  // Replace items with filtered list
  items.length = 0;
  items.push(...qualityItems);

  console.log(`\n  Kept ${items.length}/${beforeCount} items after quality gate`);

  if (items.length === 0) {
    console.log('\nNo products passed quality gate. Exiting.');
    process.exit(0);
  }

  // ── Stage B: Create Bag ─────────────────────────────────────────
  console.log('\n═══ Stage B: Create Bag ═══\n');

  const brandSet = new Set(items.map(i => i.brand).filter(Boolean) as string[]);
  const catSet = new Set(items.map(i => i.category).filter(Boolean));
  const tags = [...brandSet, ...catSet].map(t => t.toLowerCase()).slice(0, 15);

  const category = bagType || (catSet.size > 0 ? [...catSet][0] : 'other');

  const topItems = items.slice(0, 3).map(i => [i.brand, i.model].filter(Boolean).join(' ') || i.label);
  const othersCount = Math.max(0, items.length - 3);
  const description = othersCount > 0
    ? `Featuring ${topItems.join(', ')}, and ${othersCount} other product${othersCount > 1 ? 's' : ''}.`
    : `Featuring ${topItems.join(' and ')}.`;

  console.log(`Title: ${title}`);
  console.log(`Category: ${category}`);
  console.log(`Description: ${description}`);
  console.log(`Tags: ${tags.join(', ')}`);

  const { data: bag, error: bagError } = await supabase
    .from('bags')
    .insert({
      owner_id: TEED_USER_ID,
      title,
      description,
      is_public: true,
      category,
      tags,
    })
    .select('id, code')
    .single();

  if (bagError || !bag) {
    console.error('Failed to create bag:', bagError);
    process.exit(1);
  }

  console.log(`\n✅ Bag created: id=${bag.id}, code=${bag.code}`);

  // ── Stage C: Insert Items ───────────────────────────────────────
  console.log('\n═══ Stage C: Insert Items ═══\n');

  const itemIds: Array<{ dbId: string; item: PipelineItem }> = [];

  for (let idx = 0; idx < items.length; idx++) {
    const item = items[idx];
    const customName = [item.brand, item.model].filter(Boolean).join(' ') || item.label;

    const { data: inserted, error: itemError } = await supabase
      .from('bag_items')
      .insert({
        bag_id: bag.id,
        custom_name: customName,
        brand: item.brand || null,
        custom_description: item.notes || null,
        sort_index: idx,
      })
      .select('id, custom_name')
      .single();

    if (itemError || !inserted) {
      console.error(`  Failed to insert item "${customName}":`, itemError);
      continue;
    }

    itemIds.push({ dbId: inserted.id, item });
    console.log(`  ${idx + 1}. ${inserted.custom_name} → ${inserted.id}`);
  }

  console.log(`\n✅ ${itemIds.length}/${items.length} items inserted`);

  // ── Stage D: Find & Insert Links ────────────────────────────────
  console.log('\n═══ Stage D: Find & Verify Links ═══\n');

  let linksFound = 0;
  let linksFailed = 0;

  for (const { dbId, item } of itemIds) {
    const name = [item.brand, item.model].filter(Boolean).join(' ') || item.label;
    console.log(`\n🔗 Finding link for: ${name}`);

    const link = await findLink(item.brand, item.model, item.label, item.webProductUrl, item.cropBase64);

    if (link) {
      const { error: linkError } = await supabase
        .from('links')
        .insert({
          bag_item_id: dbId,
          url: link.url,
          kind: link.kind,
          label: link.label,
        });

      if (linkError) {
        console.error(`  ❌ Failed to insert link: ${linkError.message}`);
        linksFailed++;
      } else {
        console.log(`  ✅ Tier ${link.tier}: ${link.label} → ${link.url}`);
        linksFound++;
      }
    } else {
      linksFailed++;
    }
  }

  // ── Final Report ────────────────────────────────────────────────
  const totalMs = Date.now() - startTime;

  console.log('\n' + '═'.repeat(50));
  console.log('  Photo Bag Created');
  console.log('═'.repeat(50));
  console.log(`  Title:    ${title}`);
  console.log(`  Code:     ${bag.code}`);
  console.log(`  URL:      https://teed.club/u/teed/${bag.code}`);
  console.log(`  Items:    ${itemIds.length} products`);
  console.log(`  Links:    ${linksFound} verified, ${linksFailed} missing`);
  console.log(`  Time:     ${(totalMs / 1000).toFixed(0)}s (pipeline: ${(pipelineMs / 1000).toFixed(0)}s, links: ${((totalMs - pipelineMs) / 1000).toFixed(0)}s)`);
  console.log('═'.repeat(50));
}

main().catch((err) => {
  console.error('Pipeline failed:', err);
  process.exit(1);
});
