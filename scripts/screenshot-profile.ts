import { chromium } from 'playwright';
import path from 'path';

async function takeScreenshots() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();

  const baseUrl = process.env.BASE_URL || 'http://localhost:3000';
  const screenshotsDir = path.join(process.cwd(), 'screenshots');

  console.log('📸 Taking screenshots of the new ProfileActionBar...\n');

  // Profile page
  console.log('1. Loading profile page...');
  await page.goto(`${baseUrl}/u/teed`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000); // Wait for animations

  // Screenshot of the profile with action bar
  await page.screenshot({
    path: path.join(screenshotsDir, 'profile-action-bar.png'),
    fullPage: false,
  });
  console.log('   ✓ Saved: profile-action-bar.png');

  // Click the Add button to expand
  console.log('2. Clicking Add button...');
  try {
    await page.click('button:has-text("Add")');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(screenshotsDir, 'profile-add-menu-open.png'),
      fullPage: false,
    });
    console.log('   ✓ Saved: profile-add-menu-open.png');

    // Close by clicking backdrop
    await page.click('.fixed.inset-0.bg-black\\/20', { force: true });
    await page.waitForTimeout(300);
  } catch (e) {
    console.log('   ⚠ Could not interact with Add button (may need login)');
  }

  // Click Customize button
  console.log('3. Clicking Customize button...');
  try {
    await page.click('button:has-text("Customize")');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(screenshotsDir, 'profile-customize-menu-open.png'),
      fullPage: false,
    });
    console.log('   ✓ Saved: profile-customize-menu-open.png');

    await page.click('.fixed.inset-0.bg-black\\/20', { force: true });
    await page.waitForTimeout(300);
  } catch (e) {
    console.log('   ⚠ Could not interact with Customize button');
  }

  // Click Analyze button
  console.log('4. Clicking Analyze button...');
  try {
    await page.click('button:has-text("Analyze")');
    await page.waitForTimeout(500);
    await page.screenshot({
      path: path.join(screenshotsDir, 'profile-analyze-menu-open.png'),
      fullPage: false,
    });
    console.log('   ✓ Saved: profile-analyze-menu-open.png');
  } catch (e) {
    console.log('   ⚠ Could not interact with Analyze button');
  }

  // Mobile viewport
  console.log('5. Mobile viewport...');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${baseUrl}/u/teed`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(1000);
  await page.screenshot({
    path: path.join(screenshotsDir, 'profile-action-bar-mobile.png'),
    fullPage: false,
  });
  console.log('   ✓ Saved: profile-action-bar-mobile.png');

  await browser.close();
  console.log('\n✅ Screenshots complete! Check the screenshots/ folder.');
}

takeScreenshots().catch(console.error);
