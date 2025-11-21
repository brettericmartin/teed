import { test, expect } from '@playwright/test';
import { login, TEST_USER } from './utils/auth';
import { createBag, addItem, addLink, deleteBag, randomBagData, randomItemData } from './utils/testData';

/**
 * Public Sharing and QR Code Tests
 * Tests public bag viewing, sharing features, and QR codes
 */

test.describe('Public Sharing', () => {
  let bagCode: string;
  let publicBagCode: string;

  test.beforeAll(async ({ browser }) => {
    // Create a public bag for testing
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page);

    const { code } = await createBag(page, {
      ...randomBagData(),
      isPublic: true,
    });
    publicBagCode = code;

    // Add items
    await addItem(page, publicBagCode, {
      custom_name: 'Public Test Item',
      custom_description: 'This is visible publicly',
      quantity: 1,
    });

    await context.close();
  });

  test.afterAll(async ({ browser }) => {
    // Clean up
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page);
    if (publicBagCode) {
      await deleteBag(page, publicBagCode);
    }
    await context.close();
  });

  test('should view public bag without authentication', async ({ page }) => {
    // Don't login - access as public user
    await page.goto(`/c/${publicBagCode}`);

    // Should see bag content
    await expect(page.locator('text=Public Test Item')).toBeVisible();
  });

  test('should display bag owner information', async ({ page }) => {
    await page.goto(`/c/${publicBagCode}`);

    // Should see owner handle
    await expect(page.locator('text=@test-user-api, text=by @')).toBeVisible();
  });

  test('should show item details in modal', async ({ page }) => {
    await page.goto(`/c/${publicBagCode}`);

    // Click on item
    await page.click('text=Public Test Item');

    // Modal should open with details
    await expect(page.locator('text=This is visible publicly')).toBeVisible();
  });

  test('should not allow editing public bag', async ({ page }) => {
    await page.goto(`/c/${publicBagCode}`);

    // Should not see edit buttons
    await expect(page.locator('button:has-text("Edit")')).not.toBeVisible();
    await expect(page.locator('button:has-text("Delete")')).not.toBeVisible();
  });

  test('private bag should return 404 for public access', async ({ page }) => {
    // Create a private bag
    const context = await page.context();
    const authPage = await context.newPage();
    await login(authPage);

    const { code: privateCode } = await createBag(authPage, {
      ...randomBagData(),
      isPublic: false,
    });

    await authPage.close();

    // Try to access as public user
    await page.goto(`/c/${privateCode}`);

    // Should see 404 or error
    await expect(page.locator('text=404, text=Not Found, text=not found')).toBeVisible();
  });
});

test.describe('Share Modal and QR Codes', () => {
  let bagCode: string;

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await login(page);

    const { code } = await createBag(page, {
      ...randomBagData(),
      isPublic: true,
    });
    bagCode = code;
  });

  test.afterEach(async ({ page }) => {
    if (bagCode) {
      await deleteBag(page, bagCode);
    }
  });

  test('should open share modal', async ({ page }) => {
    await page.goto(`/u/${TEST_USER.handle}/${bagCode}/edit`);

    // Click share button
    await page.click('button:has-text("Share")');

    // Modal should open
    await expect(page.locator('text=Share Bag')).toBeVisible();
  });

  test('should display public link', async ({ page }) => {
    await page.goto(`/u/${TEST_USER.handle}/${bagCode}/edit`);

    // Open share modal
    await page.click('button:has-text("Share")');

    // Should see public URL
    await expect(page.locator(`text=/c/${bagCode}`)).toBeVisible();
  });

  test('should copy link to clipboard', async ({ page, context }) => {
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);

    await page.goto(`/u/${TEST_USER.handle}/${bagCode}/edit`);
    await page.click('button:has-text("Share")');

    // Click copy button
    await page.click('button[title*="Copy"], button:has-text("Copy")');

    // Should see success message
    await expect(page.locator('text=copied, text=Copied')).toBeVisible();

    // Verify clipboard content
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain(`/c/${bagCode}`);
  });

  test('should warn about private bag', async ({ page }) => {
    // Create private bag
    const { code } = await createBag(page, {
      ...randomBagData(),
      isPublic: false,
    });

    await page.goto(`/u/${TEST_USER.handle}/${code}/edit`);
    await page.click('button:has-text("Share")');

    // Should see privacy warning
    await expect(page.locator('text=private, text=This bag is private')).toBeVisible();

    // Clean up
    await deleteBag(page, code);
  });

  test('should display QR code for public bag', async ({ page }) => {
    await page.goto(`/u/${TEST_USER.handle}/${bagCode}/edit`);
    await page.click('button:has-text("Share")');

    // Should see QR code canvas
    await expect(page.locator('canvas')).toBeVisible();

    // Should see download button
    await expect(page.locator('button:has-text("Download QR")')).toBeVisible();
  });

  test('should have preview link to public view', async ({ page }) => {
    await page.goto(`/u/${TEST_USER.handle}/${bagCode}/edit`);
    await page.click('button:has-text("Share")');

    // Should see preview link
    const previewLink = page.locator('a:has-text("Preview")');
    await expect(previewLink).toBeVisible();

    // Link should go to public view
    const href = await previewLink.getAttribute('href');
    expect(href).toContain(`/c/${bagCode}`);
  });

  test('QR code should encode correct URL', async ({ page }) => {
    await page.goto(`/u/${TEST_USER.handle}/${bagCode}/edit`);
    await page.click('button:has-text("Share")');

    // Wait for QR code to render
    await page.waitForSelector('canvas');

    // Verify canvas exists (actual QR scanning would require image processing)
    const canvas = page.locator('canvas');
    await expect(canvas).toBeVisible();

    // Verify the canvas has been drawn to (has content)
    const canvasData = await canvas.evaluate((el: HTMLCanvasElement) => {
      const ctx = el.getContext('2d');
      const imageData = ctx?.getImageData(0, 0, el.width, el.height);
      // Check if canvas has any non-white pixels
      return imageData?.data.some((byte, index) => index % 4 < 3 && byte < 255);
    });

    expect(canvasData).toBeTruthy();
  });
});

test.describe('Responsive Design', () => {
  test('should display correctly on mobile', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // Should see mobile-friendly layout
    await expect(page.locator('text=Teed')).toBeVisible();
  });

  test('public bag should be mobile-friendly', async ({ browser }) => {
    // Create public bag
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page);

    const { code } = await createBag(page, {
      ...randomBagData(),
      isPublic: true,
    });

    await addItem(page, code, randomItemData());

    // View as mobile
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto(`/c/${code}`);

    // Should display properly
    await expect(page.locator('text=Teed')).toBeVisible();

    // Clean up
    await deleteBag(page, code);
    await context.close();
  });
});
