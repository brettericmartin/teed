import { chromium } from '@playwright/test';

async function testProfileNavigation() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    console.log('🔐 Logging in...');

    // Navigate to login page
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    // Fill in login form
    await page.fill('input[type="email"]', 'brett.eric.martin@gmail.com');
    await page.fill('input[type="password"]', 'Crimson11!');

    // Click sign in button
    await page.click('button[type="submit"]');
    await page.waitForLoadState('networkidle');

    console.log('✅ Logged in successfully');
    console.log('📍 Current URL:', page.url());

    // Wait a moment for the page to settle
    await page.waitForTimeout(1000);

    // Take screenshot of dashboard
    await page.screenshot({ path: '/tmp/dashboard-logged-in.png', fullPage: true });
    console.log('📸 Dashboard screenshot saved');

    // Check if Navigation component exists and has the dropdown
    const profileButton = await page.locator('nav button[aria-haspopup="true"]').first();
    const exists = await profileButton.count() > 0;
    console.log('🔍 Profile dropdown button exists:', exists);

    // Test clicking the @ link in dashboard
    console.log('\n🔍 Testing @ link in dashboard...');
    const atLink = await page.locator('a:has-text("@brett")').first();
    const atLinkExists = await atLink.count() > 0;

    if (atLinkExists) {
      const href = await atLink.getAttribute('href');
      console.log('📍 @ link href:', href);

      console.log('🖱️  Clicking @ link...');
      await atLink.click();
      await page.waitForLoadState('networkidle');
      await page.waitForTimeout(1000);

      console.log('📍 Profile page URL:', page.url());

      // Take screenshot of profile page
      await page.screenshot({ path: '/tmp/profile-page.png', fullPage: true });
      console.log('📸 Profile page screenshot saved');

      // Check for 404 error
      const pageText = await page.textContent('body');
      if (pageText.includes('404')) {
        console.error('❌ Got 404 error on profile page!');
        console.log('Page content:', pageText.substring(0, 500));
      } else {
        console.log('✅ Profile page loaded successfully!');

        // Check for key profile elements
        const hasHandle = pageText.includes('@brett');
        const hasDisplayName = pageText.includes('Brett');
        const hasBagsSection = pageText.includes('Public Bags');

        console.log('  - Has handle: ', hasHandle);
        console.log('  - Has display name: ', hasDisplayName);
        console.log('  - Has bags section: ', hasBagsSection);
      }
    } else {
      console.log('❌ No @ link found in dashboard');
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    await page.screenshot({ path: '/tmp/error-state.png', fullPage: true });
  } finally {
    await browser.close();
  }
}

testProfileNavigation().catch(console.error);
