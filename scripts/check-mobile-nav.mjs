import { chromium } from 'playwright';

async function checkMobileNav() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  // iPhone viewport
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1500);

  // Screenshot of just the header area
  await page.screenshot({ path: '/tmp/mobile-nav.png', clip: { x: 0, y: 0, width: 390, height: 80 } });
  console.log('Saved mobile nav to /tmp/mobile-nav.png');

  // Full page screenshot
  await page.screenshot({ path: '/tmp/mobile-full.png' });
  console.log('Saved full mobile page to /tmp/mobile-full.png');

  await page.waitForTimeout(2000);
  await browser.close();
}

checkMobileNav().catch(console.error);
