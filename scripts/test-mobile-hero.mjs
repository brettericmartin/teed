import { chromium } from 'playwright';

async function testMobileHero() {
  const browser = await chromium.launch({ headless: false });

  // Test mobile viewport (iPhone 14 Pro)
  const page = await browser.newPage();
  await page.setViewportSize({ width: 393, height: 852 });
  await page.goto('http://localhost:3000');

  await page.waitForTimeout(2000);

  // Take screenshot of mobile hero
  await page.screenshot({ path: '/tmp/hero-mobile-top.png' });
  console.log('Saved mobile hero screenshot to /tmp/hero-mobile-top.png');

  // Scroll down a bit
  await page.evaluate(() => window.scrollBy(0, 300));
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/hero-mobile-scroll.png' });
  console.log('Saved mobile scrolled screenshot to /tmp/hero-mobile-scroll.png');

  // Also test tablet
  await page.setViewportSize({ width: 768, height: 1024 });
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(500);
  await page.screenshot({ path: '/tmp/hero-tablet.png' });
  console.log('Saved tablet screenshot to /tmp/hero-tablet.png');

  await page.waitForTimeout(3000);
  await browser.close();
}

testMobileHero().catch(console.error);
