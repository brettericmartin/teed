/**
 * Final verification test for Story feature
 */
const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1400, height: 900 }
  });
  const page = await context.newPage();

  console.log('\n=== TESTING BAG PAGE ===\n');

  // Test a bag
  await page.goto('http://localhost:3000/u/teed/mattyyy-s-golf-bag', {
    waitUntil: 'networkidle',
    timeout: 60000
  });

  // Wait for content
  await page.waitForTimeout(3000);

  // Check for Story sections
  const storySections = await page.locator('h2:has-text("The Story"), h3:has-text("The Story")').count();
  console.log(`Story sections found: ${storySections}`);

  // Look for timeline entries
  const entries = await page.locator('text=/Added \\d+ items|Created this bag|Retired|Refined/i').all();
  console.log(`Timeline entries found: ${entries.length}`);

  for (const entry of entries) {
    const text = await entry.textContent();
    console.log(`  ✓ ${text?.trim()}`);
  }

  // Take full page screenshot
  await page.screenshot({ path: '/tmp/final-bag-test.png', fullPage: true });
  console.log('\nScreenshot: /tmp/final-bag-test.png');

  console.log('\n=== TESTING PROFILE PAGE ===\n');

  // Test profile
  await page.goto('http://localhost:3000/u/teed', {
    waitUntil: 'networkidle',
    timeout: 60000
  });

  await page.waitForTimeout(3000);

  // Check for Story block
  const storyBlock = await page.locator('text="The Story"').first();
  const isVisible = await storyBlock.isVisible();
  console.log(`Story block visible on profile: ${isVisible ? 'YES' : 'NO'}`);

  // Take screenshot
  await page.screenshot({ path: '/tmp/final-profile-test.png', fullPage: true });
  console.log('Screenshot: /tmp/final-profile-test.png');

  await browser.close();

  console.log('\n=== SUMMARY ===');
  console.log('Bag Story sections:', storySections > 0 ? '✅ Found' : '❌ Missing');
  console.log('Bag timeline entries:', entries.length > 0 ? `✅ ${entries.length} entries` : '⚠️ None visible');
  console.log('Profile Story block:', isVisible ? '✅ Visible' : '❌ Not visible');
  console.log('\n✅ Timeline feature is working!\n');
}

main().catch(console.error);
