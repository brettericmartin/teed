import { chromium } from '@playwright/test';

async function analyzeLayout() {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext({
    storageState: 'playwright/.auth/user.json'
  });
  const page = await context.newPage();

  console.log('📸 Taking screenshots of key pages...\n');

  // Dashboard
  await page.goto('http://localhost:3000/dashboard');
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: '/tmp/dashboard-analysis.png', fullPage: true });
  console.log('✅ Dashboard screenshot saved');

  // Find a bag to analyze
  const bagLinks = await page.locator('a[href*="/edit"]').all();
  if (bagLinks.length > 0) {
    await bagLinks[0].click();
    await page.waitForLoadState('networkidle');
    await page.screenshot({ path: '/tmp/bag-editor-analysis.png', fullPage: true });
    console.log('✅ Bag editor screenshot saved');
  }

  console.log('\n📊 Analysis complete! Screenshots saved to /tmp/');

  await browser.close();
}

analyzeLayout().catch(console.error);
