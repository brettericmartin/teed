import { chromium } from 'playwright';

async function testDesktop() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // Test desktop viewport
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(2000);
  await page.screenshot({ path: '/tmp/hero-desktop-1440.png' });
  console.log('Saved desktop 1440x900');

  // Test larger desktop
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/hero-desktop-1920.png' });
  console.log('Saved desktop 1920x1080');

  await page.waitForTimeout(2000);
  await browser.close();
}

testDesktop().catch(console.error);
