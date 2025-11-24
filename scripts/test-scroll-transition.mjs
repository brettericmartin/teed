import { chromium } from 'playwright';

async function testScrollTransition() {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto('http://localhost:3000');

  // Wait for page to load
  await page.waitForTimeout(2000);

  console.log('Starting scroll test...');

  // Scroll slowly to observe the transition
  const scrollSteps = 50;
  const totalScroll = 3500; // Scroll past the hero section
  const stepSize = totalScroll / scrollSteps;

  for (let i = 0; i < scrollSteps; i++) {
    await page.evaluate((step) => {
      window.scrollBy(0, step);
    }, stepSize);

    // Get current scroll position and hero state
    const state = await page.evaluate(() => {
      const heroSection = document.querySelector('section');
      const rect = heroSection?.getBoundingClientRect();
      return {
        scrollY: window.scrollY,
        heroBottom: rect?.bottom,
        heroHeight: heroSection?.offsetHeight
      };
    });

    console.log(`Scroll: ${Math.round(state.scrollY)}px, Hero bottom: ${Math.round(state.heroBottom)}px`);

    // Take screenshots at key transition points
    if (state.heroBottom < 300 && state.heroBottom > 0) {
      await page.screenshot({ path: `/tmp/scroll-transition-${i}.png` });
      console.log(`Screenshot saved at transition point ${i}`);
    }

    await page.waitForTimeout(100);
  }

  console.log('Scroll test complete. Check /tmp for screenshots.');

  // Keep browser open for manual inspection
  await page.waitForTimeout(5000);
  await browser.close();
}

testScrollTransition().catch(console.error);
