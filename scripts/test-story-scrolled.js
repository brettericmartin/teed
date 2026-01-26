/**
 * Take screenshots of the Story sections with scrolling
 */
const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();

  // Test a bag
  console.log('Testing bag page...');
  await page.goto('http://localhost:3000/u/teed/mattyyy-s-golf-bag', {
    waitUntil: 'networkidle',
    timeout: 60000
  });

  // Wait for content to load
  await page.waitForTimeout(3000);

  // Scroll to "The Story" section
  const storySection = await page.locator('text=The Story').first();
  if (await storySection.isVisible()) {
    await storySection.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1000);

    // Take screenshot of the Story area
    const boundingBox = await storySection.boundingBox();
    if (boundingBox) {
      await page.screenshot({
        path: '/tmp/story-section-bag.png',
        clip: {
          x: 0,
          y: Math.max(0, boundingBox.y - 100),
          width: 1280,
          height: 800
        }
      });
      console.log('Screenshot saved: /tmp/story-section-bag.png');
    }
  }

  // Also take full page screenshot
  await page.screenshot({ path: '/tmp/bag-full.png', fullPage: true });
  console.log('Full page saved: /tmp/bag-full.png');

  // Check for timeline content
  const timelineContent = await page.locator('text=/Added|Created|Retired/i').all();
  console.log(`Found ${timelineContent.length} timeline entries on the page`);

  // Print what we found
  for (const item of timelineContent.slice(0, 5)) {
    const text = await item.textContent();
    console.log(`  - ${text?.trim().substring(0, 50)}`);
  }

  await browser.close();
  console.log('Done!');
}

main().catch(console.error);
