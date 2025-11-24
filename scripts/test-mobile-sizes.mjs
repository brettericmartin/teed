import { chromium } from 'playwright';

async function testMobileSizes() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const sizes = [
    { name: 'iphone-se', width: 375, height: 667 },
    { name: 'iphone-14', width: 390, height: 844 },
    { name: 'iphone-14-pro-max', width: 430, height: 932 },
    { name: 'pixel-7', width: 412, height: 915 },
    { name: 'galaxy-s21', width: 360, height: 800 },
  ];

  for (const size of sizes) {
    await page.setViewportSize({ width: size.width, height: size.height });
    await page.goto('http://localhost:3000');
    await page.waitForTimeout(1500);
    await page.screenshot({ path: `/tmp/hero-${size.name}.png` });
    console.log(`Saved ${size.name} (${size.width}x${size.height})`);
  }

  await page.waitForTimeout(2000);
  await browser.close();
}

testMobileSizes().catch(console.error);
