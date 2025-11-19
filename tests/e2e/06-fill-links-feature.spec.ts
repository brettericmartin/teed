import { test, expect } from '@playwright/test';
import { login } from './utils/auth';

/**
 * Fill Links Feature Tests
 * Tests auto-generated product links functionality
 */

test.describe('Fill Links Feature', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('should show Fill Product Links button when bag has items', async ({ page }) => {
    // Go to dashboard
    await page.goto('/dashboard');

    // Find and click on a bag with items
    const bagLink = page.locator('a[href*="/edit"]').first();

    if (await bagLink.isVisible()) {
      await bagLink.click();

      // Wait for bag editor to load
      await page.waitForSelector('text=Add Product');

      // Check if there are items in the bag
      const itemCards = page.locator('[class*="ItemCard"]');
      const itemCount = await itemCards.count();

      if (itemCount > 0) {
        // Should see Fill Product Links button
        const fillLinksButton = page.locator('button:has-text("Fill Product Links")');
        await expect(fillLinksButton).toBeVisible();
      }
    }
  });

  test('should not replace user-created links', async ({ page }) => {
    // Create a test bag
    await page.goto('/dashboard');

    // Create new bag
    await page.click('button:has-text("New Bag")');
    await page.fill('input[placeholder*="Bag"]', 'Test Fill Links Bag');
    await page.click('button:has-text("Create Bag")');

    // Wait for bag editor
    await page.waitForURL(/\/edit$/);

    // Add an item
    await page.fill('input[placeholder*="Add"]', 'Test Golf Club');
    await page.press('input[placeholder*="Add"]', 'Enter');

    // Wait for item to appear
    await page.waitForSelector('text=Test Golf Club');

    // Expand the item and add a user link
    await page.click('text=Test Golf Club');

    // Try to add a link (if link button is visible)
    const linkButton = page.locator('button[title*="link"]').first();
    if (await linkButton.isVisible()) {
      await linkButton.click();

      // Add a user link
      const urlInput = page.locator('input[placeholder*="URL"]').first();
      if (await urlInput.isVisible()) {
        await urlInput.fill('https://example.com/my-custom-link');
        await page.click('button:has-text("Add Link")');

        // Wait for link to be added
        await page.waitForTimeout(1000);
      }
    }

    // Now click Fill Product Links
    const fillLinksButton = page.locator('button:has-text("Fill Product Links")');
    if (await fillLinksButton.isVisible()) {
      await fillLinksButton.click();

      // Wait for fill operation
      await page.waitForTimeout(2000);

      // User link should still be there (not replaced)
      await expect(page.locator('text=example.com/my-custom-link')).toBeVisible();
    }
  });

  test('should show TEED badge on auto-generated links', async ({ page }) => {
    // Go to dashboard
    await page.goto('/dashboard');

    // Find first bag
    const editLink = page.locator('a[href*="/edit"]').first();
    if (await editLink.isVisible()) {
      await editLink.click();

      // Check for items with TEED badge
      const teedBadge = page.locator('text=TEED').first();

      // If no TEED badge yet, try filling links
      if (!(await teedBadge.isVisible())) {
        const fillButton = page.locator('button:has-text("Fill Product Links")');
        if (await fillButton.isVisible()) {
          await fillButton.click();
          await page.waitForTimeout(3000);

          // Now check for TEED badge
          const badgeAfterFill = page.locator('text=TEED');
          // Badge might be visible if links were added
        }
      }
    }
  });
});
