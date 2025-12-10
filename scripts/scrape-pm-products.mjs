import { config } from 'dotenv';
config({ path: '.env.local' });

import * as cheerio from 'cheerio';

// Peter McKinnon's product links from the video description
const productLinks = [
  { key: 'camera-bag', url: 'https://bit.ly/3OrFZz2', label: 'Camera Bag' },
  { key: 'daily-camera', url: 'https://amzn.to/3ykrRQG', label: 'Daily Camera' },
  { key: 'most-used-lens', url: 'https://amzn.to/33OBc5g', label: 'Most Used Lens' },
  { key: 'portrait-lens', url: 'https://amzn.to/3fnJ6rJ', label: 'Portrait Lens' },
  { key: 'telephoto-lens', url: 'https://amzn.to/3bsPZqL', label: 'Telephoto Lens' },
  { key: 'lighting', url: 'https://bit.ly/4gySTsW', label: 'Lighting' },
  { key: 'vlog-mic', url: 'https://amzn.to/3bAiIdk', label: 'Vlog Mic' },
  { key: 'vnd-filters', url: 'http://bit.ly/PMVND_EDII', label: 'VND Filters Edition II' },
  { key: 'helix-mag-lock', url: 'https://bit.ly/HelixMagLock', label: 'Helix Mag Lock' },
  { key: 'pm-vnd', url: 'https://bit.ly/pmvnd', label: 'PM VND' },
  { key: 'recon-matte-box', url: 'https://bit.ly/ReconVNDMatteBox', label: 'RECON Matte Box' },
  { key: 'drone', url: 'https://amzn.to/33NJjzl', label: 'Drone' },
  { key: 'jaw-clamp', url: 'https://amzn.to/3wbjepV', label: 'Jaw Clamp' },
  { key: 'airtags', url: 'https://amzn.to/3wdBy1w', label: 'AirTags' },
  { key: 'filter-case', url: 'https://amzn.to/3hxZcSg', label: 'Filter Case' },
  { key: 'tripod', url: 'https://amzn.to/3eTpXyX', label: 'Tripod' },
  { key: 'gimbal', url: 'https://amzn.to/3op361j', label: 'Gimbal' },
];

async function resolveRedirect(url) {
  try {
    const response = await fetch(url, {
      method: 'HEAD',
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });
    return response.url;
  } catch (e) {
    console.error(`Failed to resolve ${url}:`, e.message);
    return url;
  }
}

async function scrapeUrl(url) {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
      },
      redirect: 'follow',
    });

    if (!response.ok) {
      return { error: `HTTP ${response.status}`, finalUrl: response.url };
    }

    const html = await response.text();
    const $ = cheerio.load(html);

    // Extract metadata
    const title =
      $('meta[property="og:title"]').attr('content') ||
      $('meta[name="twitter:title"]').attr('content') ||
      $('#productTitle').text().trim() ||
      $('h1').first().text().trim() ||
      $('title').text().trim();

    const description =
      $('meta[property="og:description"]').attr('content') ||
      $('meta[name="description"]').attr('content') ||
      $('#productDescription').text().trim().slice(0, 300);

    let image =
      $('meta[property="og:image"]').attr('content') ||
      $('meta[name="twitter:image"]').attr('content') ||
      $('#landingImage').attr('src') ||
      $('#imgBlkFront').attr('src') ||
      $('img[data-a-dynamic-image]').first().attr('src');

    // Make image URL absolute
    if (image && !image.startsWith('http')) {
      image = new URL(image, response.url).href;
    }

    // Extract price
    let price = null;
    const priceSelectors = [
      '.a-price .a-offscreen',
      '.a-price-whole',
      '#priceblock_ourprice',
      '#priceblock_dealprice',
      '.a-color-price',
      'span[data-a-color="price"]',
      '.price',
    ];

    for (const sel of priceSelectors) {
      const priceText = $(sel).first().text().trim();
      if (priceText && priceText.includes('$')) {
        price = priceText;
        break;
      }
    }

    // Try to extract brand
    let brand = null;
    const brandSelectors = [
      '#bylineInfo',
      '.po-brand .po-break-word',
      'a#bylineInfo',
      '[data-csa-c-type="brand"]',
    ];

    for (const sel of brandSelectors) {
      const brandText = $(sel).first().text().trim();
      if (brandText) {
        brand = brandText.replace(/^Visit the |Brand: | Store$/g, '').trim();
        break;
      }
    }

    return {
      finalUrl: response.url,
      title: title?.replace(/\s+/g, ' ').trim(),
      description: description?.replace(/\s+/g, ' ').trim(),
      image,
      price,
      brand,
      domain: new URL(response.url).hostname.replace('www.', ''),
    };
  } catch (e) {
    console.error(`Failed to scrape ${url}:`, e.message);
    return { error: e.message };
  }
}

async function main() {
  console.log('Scraping Peter McKinnon product links...\n');

  const results = [];

  for (const product of productLinks) {
    console.log(`\n🔗 ${product.label}`);
    console.log(`   Original: ${product.url}`);

    // First resolve the short URL
    const resolvedUrl = await resolveRedirect(product.url);
    console.log(`   Resolved: ${resolvedUrl.slice(0, 80)}...`);

    // Then scrape the page
    const scraped = await scrapeUrl(resolvedUrl);

    if (scraped.error) {
      console.log(`   ❌ Error: ${scraped.error}`);
      results.push({ ...product, resolvedUrl, error: scraped.error });
    } else {
      console.log(`   ✅ Title: ${scraped.title?.slice(0, 60)}...`);
      console.log(`   Brand: ${scraped.brand || 'Unknown'}`);
      console.log(`   Price: ${scraped.price || 'N/A'}`);
      console.log(`   Image: ${scraped.image ? '✓' : '✗'}`);

      results.push({
        ...product,
        resolvedUrl,
        scraped,
      });
    }

    // Small delay between requests
    await new Promise(r => setTimeout(r, 500));
  }

  // Output summary as JSON
  console.log('\n\n=== SCRAPED DATA (JSON) ===\n');
  console.log(JSON.stringify(results, null, 2));
}

main();
