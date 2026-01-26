/**
 * Quick test script to verify timeline is displaying on bags and profiles
 * Uses Playwright to check the UI
 */
const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:3000';

// Test bags with known history data
const TEST_BAGS = [
  { code: 'mattyyy-s-golf-bag', title: "Mattyyy's Golf Bag", handle: 'teed' },
  { code: 'gifts-for-dad', title: 'Gifts for Dad', handle: 'teed' },
  { code: 'peter-mckinnon-camera-bag', title: "Peter McKinnon's Camera Bag 2025", handle: 'teed' },
];

// Test profiles with Story blocks
const TEST_PROFILES = [
  { handle: 'teed' },
];

async function testBagTimeline(page, bag) {
  const url = `${BASE_URL}/u/${bag.handle}/${bag.code}`;
  console.log(`\n🔍 Testing bag: ${bag.title}`);
  console.log(`   URL: ${url}`);

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for the page to load
    await page.waitForTimeout(2000);

    // Check for "The Story" section
    const storySection = await page.locator('text=The Story').first();
    const storySectionExists = await storySection.isVisible().catch(() => false);

    // Scroll to story section first
    const storyHeading = await page.locator('h3:has-text("The Story")').first();
    if (await storyHeading.isVisible().catch(() => false)) {
      await storyHeading.scrollIntoViewIfNeeded();
      await page.waitForTimeout(500);
    }

    // Check for timeline items or empty state
    const addedItemsText = await page.locator('text=/Added \\d+ items/').first();
    const createdBagText = await page.locator('text=Created this bag').first();
    const timelineItems = (await addedItemsText.isVisible().catch(() => false) ? 1 : 0) +
                         (await createdBagText.isVisible().catch(() => false) ? 1 : 0);
    const emptyState = await page.locator('text=/story begins|no changes/i').isVisible().catch(() => false);

    // Also check for "The Story So Far" section
    const storySoFarSection = await page.locator('text=The Story So Far').first();
    const storySoFarExists = await storySoFarSection.isVisible().catch(() => false);

    if (storySectionExists || storySoFarExists) {
      console.log(`   ✅ Story section found`);
      if (timelineItems > 0) {
        console.log(`   ✅ Timeline has ${timelineItems} visible entries`);
      } else if (emptyState) {
        console.log(`   ⚠️  Timeline shows empty state (data may be loading)`);
      } else {
        console.log(`   ⚠️  Timeline section present but no entries visible`);
      }
    } else {
      console.log(`   ❌ Story section NOT found`);
    }

    // Take a screenshot for verification
    const screenshotPath = `/tmp/timeline-test-${bag.code}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`   📸 Screenshot: ${screenshotPath}`);

    return storySectionExists || storySoFarExists;
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    return false;
  }
}

async function testProfileTimeline(page, profile) {
  const url = `${BASE_URL}/u/${profile.handle}`;
  console.log(`\n🔍 Testing profile: @${profile.handle}`);
  console.log(`   URL: ${url}`);

  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });

    // Wait for the page to load
    await page.waitForTimeout(2000);

    // Check for Story block
    const storyBlock = await page.locator('text=The Story').first();
    const storyExists = await storyBlock.isVisible().catch(() => false);

    if (storyExists) {
      console.log(`   ✅ Story block found on profile`);
    } else {
      console.log(`   ⚠️  Story block not visible (may need to scroll)`);
    }

    // Take a screenshot
    const screenshotPath = `/tmp/timeline-test-profile-${profile.handle}.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`   📸 Screenshot: ${screenshotPath}`);

    return storyExists;
  } catch (err) {
    console.log(`   ❌ Error: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Timeline Display Tests');
  console.log('='.repeat(50));

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 }
  });
  const page = await context.newPage();

  let bagsPassed = 0;
  let bagsFailed = 0;

  // Test bags
  console.log('\n📦 TESTING BAG TIMELINES');
  console.log('-'.repeat(50));

  for (const bag of TEST_BAGS) {
    const passed = await testBagTimeline(page, bag);
    if (passed) bagsPassed++; else bagsFailed++;
  }

  // Test profiles
  console.log('\n👤 TESTING PROFILE STORY BLOCKS');
  console.log('-'.repeat(50));

  let profilesPassed = 0;
  let profilesFailed = 0;

  for (const profile of TEST_PROFILES) {
    const passed = await testProfileTimeline(page, profile);
    if (passed) profilesPassed++; else profilesFailed++;
  }

  await browser.close();

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(50));
  console.log(`\n📦 Bags: ${bagsPassed}/${TEST_BAGS.length} passed`);
  console.log(`👤 Profiles: ${profilesPassed}/${TEST_PROFILES.length} passed`);

  if (bagsFailed === 0 && profilesFailed === 0) {
    console.log('\n✅ ALL TESTS PASSED!');
  } else {
    console.log(`\n⚠️  Some tests failed. Check the output above.`);
  }
}

main().catch(console.error);
