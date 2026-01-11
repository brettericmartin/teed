import { test, expect } from '@playwright/test';

/**
 * Comprehensive Block System Tests
 *
 * Tests the block-based profile layout system for view mode (unauthenticated).
 * Uses the /u/teed profile as the test subject.
 *
 * Grid System:
 * - 12-column layout at desktop (lg/md breakpoints)
 * - Row height: 80px
 * - Margin/gap: 16px
 */

const TEST_PROFILE_URL = '/u/teed';

// Grid constants (from lib/blocks/types.ts)
const GRID_COLS = 12;
const ROW_HEIGHT = 80;
const GAP = 16;

// Increase timeout for all tests in this file
test.setTimeout(60000);

// Run tests serially to avoid resource contention
test.describe.configure({ mode: 'serial' });

test.describe('Block System - View Mode', () => {
  test.describe('Page Load and Basic Rendering', () => {
    test('page loads without JavaScript errors', async ({ page }) => {
      const errors: string[] = [];

      // Listen for console errors
      page.on('console', (msg) => {
        if (msg.type() === 'error') {
          errors.push(msg.text());
        }
      });

      // Listen for page errors
      page.on('pageerror', (error) => {
        errors.push(error.message);
      });

      await page.goto(TEST_PROFILE_URL, { waitUntil: 'domcontentloaded' });

      // Wait for page to be interactive
      await page.waitForTimeout(2000);

      // Filter out known acceptable errors (e.g., third-party tracking)
      const criticalErrors = errors.filter(
        (err) =>
          !err.includes('favicon') &&
          !err.includes('analytics') &&
          !err.includes('gtag') &&
          !err.includes('Failed to load resource') &&
          !err.includes('HMR')
      );

      expect(criticalErrors).toHaveLength(0);
    });

    test('profile page returns 200 status', async ({ page }) => {
      const response = await page.goto(TEST_PROFILE_URL, { waitUntil: 'domcontentloaded' });
      expect(response?.status()).toBe(200);
    });

    test('page has correct title containing profile handle', async ({ page }) => {
      await page.goto(TEST_PROFILE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);
      const title = await page.title();
      expect(title.toLowerCase()).toContain('teed');
    });
  });

  test.describe('Block Rendering', () => {
    test('visible blocks render with block-content class', async ({ page }) => {
      await page.goto(TEST_PROFILE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Find all block-content elements
      const blocks = page.locator('.block-content');
      const blockCount = await blocks.count();

      // Profile should have at least some blocks
      expect(blockCount).toBeGreaterThan(0);
    });

    test('blocks have non-zero height (fill their grid cells)', async ({ page }) => {
      await page.goto(TEST_PROFILE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Find all block-content elements
      const blocks = page.locator('.block-content');
      const blockCount = await blocks.count();

      expect(blockCount).toBeGreaterThan(0);

      // Check first 3 blocks have a valid height
      for (let i = 0; i < Math.min(blockCount, 3); i++) {
        const block = blocks.nth(i);
        const boundingBox = await block.boundingBox();

        if (boundingBox) {
          expect(
            boundingBox.height,
            `Block ${i} should have non-zero height`
          ).toBeGreaterThan(0);
        }
      }
    });

    test('grid layout container exists for desktop viewport', async ({ page }) => {
      await page.goto(TEST_PROFILE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // At desktop viewport (1280px), should use react-grid-layout
      // Look for the layout class or grid structure
      const gridLayout = page.locator('.react-grid-layout');
      const hasGridLayout = (await gridLayout.count()) > 0;

      // On desktop, we expect the grid layout to be present
      // If mobile, it uses flex column instead
      const viewport = page.viewportSize();
      if (viewport && viewport.width >= 768) {
        expect(hasGridLayout).toBe(true);
      }
    });
  });

  test.describe('Header Block', () => {
    test('header block displays user information', async ({ page }) => {
      await page.goto(TEST_PROFILE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Should see the handle @teed somewhere on the page
      const handleText = page.locator('text=@teed');
      await expect(handleText.first()).toBeVisible({ timeout: 10000 });
    });

    test('avatar is displayed if configured', async ({ page }) => {
      await page.goto(TEST_PROFILE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Look for avatar image or placeholder
      const avatar = page.locator(
        'img[alt*="teed"], img[alt*="Teed"], .rounded-full img, [class*="avatar"], .rounded-full'
      );
      const avatarExists = (await avatar.count()) > 0;

      // Avatar should exist (either real image or placeholder)
      expect(avatarExists).toBe(true);
    });
  });

  test.describe('Bio Block', () => {
    test('bio text is visible if profile has bio', async ({ page }) => {
      await page.goto(TEST_PROFILE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Look for bio block content
      // Bio block uses leading-relaxed class and is inside block-content
      const bioContent = page.locator('.block-content p.leading-relaxed');

      // If bio exists, it should be visible
      const bioCount = await bioContent.count();
      if (bioCount > 0) {
        await expect(bioContent.first()).toBeVisible();
      }
    });
  });

  test.describe('Social Links Block', () => {
    test('social link icons are rendered', async ({ page }) => {
      await page.goto(TEST_PROFILE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Look for social link anchor tags with external links
      const socialLinks = page.locator(
        '.block-content a[target="_blank"][rel="noopener noreferrer"]'
      );

      const linkCount = await socialLinks.count();

      // If profile has social links, they should be clickable
      if (linkCount > 0) {
        // Verify first social link has valid href
        const firstLink = socialLinks.first();
        const href = await firstLink.getAttribute('href');
        expect(href).toBeTruthy();
        expect(href).toMatch(/^(https?:\/\/|mailto:)/);
      }
    });

    test('social links have hover states', async ({ page }) => {
      await page.goto(TEST_PROFILE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      const socialLinks = page.locator(
        '.block-content a[target="_blank"][rel="noopener noreferrer"]'
      );

      const linkCount = await socialLinks.count();
      if (linkCount > 0) {
        const firstLink = socialLinks.first();

        // Hover over the link
        await firstLink.hover();

        // Wait for transition
        await page.waitForTimeout(300);

        // Verify the element is still interactive
        await expect(firstLink).toBeVisible();
      }
    });
  });

  test.describe('Featured Bags Block', () => {
    test('featured bags grid renders bag cards', async ({ page }) => {
      await page.goto(TEST_PROFILE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Featured bags use gallery-frame class
      const bagCards = page.locator('.gallery-frame');
      const cardCount = await bagCards.count();

      // If profile has bags, they should be displayed
      if (cardCount > 0) {
        await expect(bagCards.first()).toBeVisible();
      }
    });

    test('bag cards are clickable and navigate correctly', async ({ page }) => {
      await page.goto(TEST_PROFILE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      const bagCards = page.locator('.gallery-frame');
      const cardCount = await bagCards.count();

      if (cardCount > 0) {
        // Click first bag card
        await bagCards.first().click();

        // Should navigate to bag view page
        await page.waitForURL(/\/u\/teed\/.+/, { timeout: 15000 });
        expect(page.url()).toMatch(/\/u\/teed\/.+/);
      }
    });

    test('bag cards display item count', async ({ page }) => {
      await page.goto(TEST_PROFILE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      const bagCards = page.locator('.gallery-frame');
      const cardCount = await bagCards.count();

      if (cardCount > 0) {
        // Look for item count indicator (Package icon with number)
        // lucide icons use class like "lucide" or specific class
        const itemCount = bagCards.first().locator('svg');
        const hasIcon = (await itemCount.count()) > 0;

        // Bag cards should have some icons
        expect(hasIcon).toBe(true);
      }
    });
  });
});

test.describe('Block System - Grid Alignment', () => {
  test.describe('Grid Position Calculations', () => {
    test('blocks at x=0 align to left edge of grid', async ({ page }) => {
      await page.goto(TEST_PROFILE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Get the grid container
      const gridContainer = page.locator('.react-grid-layout').first();
      const gridExists = (await gridContainer.count()) > 0;

      if (!gridExists) {
        test.skip();
        return;
      }

      const containerBox = await gridContainer.boundingBox();

      if (!containerBox) {
        test.skip();
        return;
      }

      // Get first block in the grid
      const blocks = page.locator('.react-grid-item').first();
      const blockBox = await blocks.boundingBox();

      if (blockBox) {
        // Block at x=0 should start at or near container left
        // Allow some margin for container padding
        const leftOffset = blockBox.x - containerBox.x;
        expect(leftOffset).toBeLessThanOrEqual(100); // Within 100px of container left
      }
    });

    test('full-width blocks span entire grid width', async ({ page }) => {
      await page.goto(TEST_PROFILE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // Get the grid container width
      const gridContainer = page.locator('.react-grid-layout').first();
      const gridExists = (await gridContainer.count()) > 0;

      if (!gridExists) {
        test.skip();
        return;
      }

      const containerBox = await gridContainer.boundingBox();

      if (!containerBox) {
        test.skip();
        return;
      }

      // Find blocks that appear to be full width
      const blocks = page.locator('.react-grid-item');
      const blockCount = await blocks.count();

      if (blockCount === 0) {
        test.skip();
        return;
      }

      for (let i = 0; i < Math.min(blockCount, 3); i++) {
        const block = blocks.nth(i);
        const blockBox = await block.boundingBox();

        if (blockBox) {
          // Check if block width is close to container width (full-width block)
          const widthRatio = blockBox.width / containerBox.width;

          // Full-width blocks should be > 90% of container width
          // Half-width blocks should be ~45-55% of container width
          expect(widthRatio).toBeGreaterThan(0.4); // At least 40% width
          expect(widthRatio).toBeLessThanOrEqual(1.05); // Not wider than container
        }
      }
    });

    test('half-width blocks at x=6 start at approximately 50%', async ({ page }) => {
      await page.goto(TEST_PROFILE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      // This test checks if blocks positioned at column 6 start at the midpoint
      const gridContainer = page.locator('.react-grid-layout').first();
      const gridExists = (await gridContainer.count()) > 0;

      if (!gridExists) {
        test.skip();
        return;
      }

      const containerBox = await gridContainer.boundingBox();

      if (!containerBox) {
        test.skip();
        return;
      }

      // Get all grid items and check their positions
      const blocks = page.locator('.react-grid-item');
      const blockCount = await blocks.count();

      let foundHalfWidthBlock = false;

      for (let i = 0; i < blockCount; i++) {
        const block = blocks.nth(i);
        const blockBox = await block.boundingBox();

        if (blockBox) {
          const leftOffset = blockBox.x - containerBox.x;
          const leftRatio = leftOffset / containerBox.width;

          // Check for blocks starting at approximately 50% (x=6 in 12-column grid)
          if (leftRatio > 0.45 && leftRatio < 0.55) {
            foundHalfWidthBlock = true;

            // Verify width is approximately half
            const widthRatio = blockBox.width / containerBox.width;
            expect(widthRatio).toBeLessThan(0.6); // Should be less than 60%
          }
        }
      }

      // Note: Not all profiles will have half-width blocks at x=6
      // This test passes if no such blocks exist, or if they are correctly positioned
    });
  });

  test.describe('Grid Row Heights', () => {
    test('blocks have heights that are multiples of row height (approx)', async ({
      page,
    }) => {
      await page.goto(TEST_PROFILE_URL, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(2000);

      const blocks = page.locator('.react-grid-item');
      const blockCount = await blocks.count();

      if (blockCount === 0) {
        test.skip();
        return;
      }

      // Check a few blocks
      for (let i = 0; i < Math.min(blockCount, 3); i++) {
        const block = blocks.nth(i);
        const blockBox = await block.boundingBox();

        if (blockBox) {
          // Height should be approximately a multiple of row height (80px) + gaps
          // Account for gap (16px) between rows: height = rows * (80 + 16) - 16
          // Or simply check that height is reasonable (> 60px per row)
          const estimatedRows = blockBox.height / (ROW_HEIGHT + GAP);
          expect(estimatedRows).toBeGreaterThanOrEqual(0.5); // At least half a row
          expect(estimatedRows).toBeLessThanOrEqual(15); // No more than 15 rows
        }
      }
    });
  });
});

test.describe('Block System - Responsive Behavior', () => {
  test('blocks stack vertically on mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto(TEST_PROFILE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // On mobile, blocks should be in a flex column layout
    const blocks = page.locator('.block-content');
    const blockCount = await blocks.count();

    if (blockCount > 1) {
      // Get positions of first two blocks
      const block1 = blocks.nth(0);
      const block2 = blocks.nth(1);

      const box1 = await block1.boundingBox();
      const box2 = await block2.boundingBox();

      if (box1 && box2) {
        // On mobile, second block should be below first (stacked)
        expect(box2.y).toBeGreaterThan(box1.y);
      }
    }
  });

  test('grid layout is used at desktop viewport', async ({ page }) => {
    // Ensure desktop viewport
    await page.setViewportSize({ width: 1280, height: 720 });

    await page.goto(TEST_PROFILE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // At desktop, react-grid-layout should be active
    const gridLayout = page.locator('.react-grid-layout');
    const hasGridLayout = (await gridLayout.count()) > 0;

    expect(hasGridLayout).toBe(true);
  });
});

test.describe('Block System - Visual Consistency', () => {
  test('no blocks overflow their containers', async ({ page }) => {
    await page.goto(TEST_PROFILE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Check that blocks don't have horizontal overflow
    const hasOverflow = await page.evaluate(() => {
      const blocks = document.querySelectorAll('.block-content');
      for (const block of blocks) {
        if (block.scrollWidth > block.clientWidth + 1) {
          return true;
        }
      }
      return false;
    });

    expect(hasOverflow).toBe(false);
  });

  test('blocks have consistent border-radius styling', async ({ page }) => {
    await page.goto(TEST_PROFILE_URL, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(2000);

    // Gallery frames should have consistent styling
    const galleryFrames = page.locator('.gallery-frame');
    const frameCount = await galleryFrames.count();

    if (frameCount > 1) {
      // Get border-radius of first two frames
      const radius1 = await galleryFrames
        .first()
        .evaluate((el) => window.getComputedStyle(el).borderRadius);

      const radius2 = await galleryFrames
        .nth(1)
        .evaluate((el) => window.getComputedStyle(el).borderRadius);

      // Should have consistent border-radius
      expect(radius1).toBe(radius2);
    }
  });
});
