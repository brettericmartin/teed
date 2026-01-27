import { test, expect } from '@playwright/test';

/**
 * Mobile Layout View Mode Tests (No Auth Required)
 *
 * Tests the mobile/desktop layout rendering in view mode
 * to verify the sorting and display logic works correctly.
 */

const TEST_PROFILE_URL = '/u/teed';
const DESKTOP_VIEWPORT = { width: 1280, height: 720 };
const MOBILE_VIEWPORT = { width: 375, height: 667 };

// These tests don't need authentication
test.use({ storageState: { cookies: [], origins: [] } });

test.setTimeout(45000);

// Helper to navigate with retry
async function gotoWithRetry(page: Page, url: string, options = {}) {
  try {
    await page.goto(url, { waitUntil: 'load', timeout: 30000, ...options });
  } catch (e) {
    // Retry once if navigation fails
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000, ...options });
  }
}

test.describe('Mobile Layout - View Mode', () => {
  test('blocks stack vertically on mobile viewport', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(TEST_PROFILE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const blocks = page.locator('.block-content');
    const blockCount = await blocks.count();

    expect(blockCount).toBeGreaterThan(0);

    if (blockCount > 1) {
      const block1 = blocks.nth(0);
      const block2 = blocks.nth(1);

      const box1 = await block1.boundingBox();
      const box2 = await block2.boundingBox();

      if (box1 && box2) {
        // Second block should be below first (stacked vertically)
        expect(box2.y).toBeGreaterThan(box1.y);
        console.log(`Block 1 Y: ${box1.y}, Block 2 Y: ${box2.y}`);
      }
    }
  });

  test('grid layout is used on desktop viewport', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(TEST_PROFILE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const gridLayout = page.locator('.react-grid-layout');
    const hasGrid = await gridLayout.count();

    expect(hasGrid).toBeGreaterThan(0);
  });

  test('no react-grid-layout on mobile viewport', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(TEST_PROFILE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const gridLayout = page.locator('.react-grid-layout');
    const hasGrid = await gridLayout.count();

    // On mobile, should NOT have react-grid-layout (uses flex column instead)
    expect(hasGrid).toBe(0);
  });

  test('mobile uses flex column layout', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(TEST_PROFILE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Look for flex column container
    const flexCol = page.locator('.flex.flex-col');
    const hasFlexCol = await flexCol.count();

    expect(hasFlexCol).toBeGreaterThan(0);
  });

  test('CSS custom properties are defined', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(TEST_PROFILE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const navHeight = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--mobile-nav-height').trim();
    });

    expect(navHeight).toBe('56px');
  });

  test('page loads without critical JS errors', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(TEST_PROFILE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(3000);

    // Filter out known non-critical errors
    const criticalErrors = errors.filter(
      (err) =>
        !err.includes('favicon') &&
        !err.includes('analytics') &&
        !err.includes('gtag') &&
        !err.includes('Failed to load resource') &&
        !err.includes('HMR') &&
        !err.includes('hydrat') // Hydration warnings
    );

    expect(criticalErrors).toHaveLength(0);
  });
});

test.describe('Desktop Layout - View Mode', () => {
  test('blocks display correctly on desktop', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(TEST_PROFILE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const blocks = page.locator('.block-content');
    const blockCount = await blocks.count();

    expect(blockCount).toBeGreaterThan(0);

    // Check blocks have non-zero dimensions
    for (let i = 0; i < Math.min(blockCount, 3); i++) {
      const block = blocks.nth(i);
      const box = await block.boundingBox();

      if (box) {
        expect(box.width).toBeGreaterThan(0);
        expect(box.height).toBeGreaterThan(0);
      }
    }
  });

  test('react-grid-item class is used for blocks', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(TEST_PROFILE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    const gridItems = page.locator('.react-grid-item');
    const itemCount = await gridItems.count();

    expect(itemCount).toBeGreaterThan(0);
  });
});

test.describe('Responsive Transitions', () => {
  test('layout changes from grid to stack when resizing to mobile', async ({ page }) => {
    // Start at desktop
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(TEST_PROFILE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Verify grid layout exists
    let gridLayout = page.locator('.react-grid-layout');
    let hasGrid = await gridLayout.count();
    expect(hasGrid).toBeGreaterThan(0);

    // Resize to mobile
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.waitForTimeout(1500);

    // Grid should be gone
    gridLayout = page.locator('.react-grid-layout');
    hasGrid = await gridLayout.count();
    expect(hasGrid).toBe(0);

    // Should have stacked layout
    const blocks = page.locator('.block-content');
    const blockCount = await blocks.count();

    if (blockCount > 1) {
      const box1 = await blocks.nth(0).boundingBox();
      const box2 = await blocks.nth(1).boundingBox();

      if (box1 && box2) {
        expect(box2.y).toBeGreaterThan(box1.y);
      }
    }
  });
});
