import { config } from 'dotenv';
config({ path: '.env.local' });

// Amazon ASINs extracted from Peter McKinnon's links
const asins = [
  { asin: 'B08C68F2DX', label: 'Daily Camera' },
  { asin: 'B07WFQYJYP', label: 'Most Used Lens' },
  { asin: 'B08MFVH7SV', label: 'Portrait Lens' },
  { asin: 'B07Z5M9M7M', label: 'Telephoto Lens' },
  { asin: 'B00YAZHRZM', label: 'Vlog Mic' },
  { asin: 'B08JGX61H7', label: 'Drone' },
  { asin: 'B01BBAW028', label: 'Jaw Clamp' },
  { asin: 'B0933BVK6T', label: 'AirTags' },
  { asin: 'B00SA6AFOC', label: 'Filter Case' },
  { asin: 'B07BL6BRX6', label: 'Tripod' },
  { asin: 'B08G4XXW7D', label: 'Gimbal' },
];

async function lookupAsin(asin) {
  // Use Amazon's public product page with different headers
  const url = `https://www.amazon.com/dp/${asin}`;

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Cache-Control': 'no-cache',
      },
    });

    const html = await response.text();

    // Try to extract product title from the page
    const titleMatch = html.match(/<span[^>]+id="productTitle"[^>]*>([^<]+)</);
    const title = titleMatch ? titleMatch[1].trim() : null;

    // Look for og:title as fallback
    const ogTitleMatch = html.match(/<meta[^>]+property="og:title"[^>]+content="([^"]+)"/);
    const ogTitle = ogTitleMatch ? ogTitleMatch[1] : null;

    // Look for image
    const imageMatch = html.match(/<img[^>]+id="landingImage"[^>]+src="([^"]+)"/);
    const image = imageMatch ? imageMatch[1] : null;

    // Alternative image extraction
    const ogImageMatch = html.match(/<meta[^>]+property="og:image"[^>]+content="([^"]+)"/);
    const ogImage = ogImageMatch ? ogImageMatch[1] : null;

    return {
      title: title || ogTitle,
      image: image || ogImage,
    };
  } catch (e) {
    return { error: e.message };
  }
}

async function main() {
  console.log('Looking up Amazon ASINs...\n');

  for (const item of asins) {
    console.log(`\n${item.label} (${item.asin})`);
    const result = await lookupAsin(item.asin);
    if (result.title) {
      console.log(`  ✅ ${result.title}`);
    } else {
      console.log(`  ❌ Could not fetch`);
    }

    // Delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 1000));
  }
}

main();
