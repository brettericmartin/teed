import { test, expect } from '@playwright/test';
import { login, TEST_USER } from './utils/auth';
import { createBag, addItem, deleteBag, randomBagData, randomItemData } from './utils/testData';

/**
 * Link Management Tests
 * Tests adding, editing, and deleting links on items
 */

test.describe('Link Management', () => {
  let bagCode: string;
  const itemName = 'Test Item with Links';

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await login(page);

    // Create bag with one item
    const { code } = await createBag(page, randomBagData());
    bagCode = code;
    await addItem(page, bagCode, {
      custom_name: itemName,
      custom_description: 'Test item for link management',
      quantity: 1,
    });
  });

  test.afterEach(async ({ page }) => {
    if (bagCode) {
      await deleteBag(page, bagCode);
    }
  });

  test('should open link manager modal', async ({ page }) => {
    await page.goto(`/u/${TEST_USER.handle}/${bagCode}/edit`);

    // Expand item
    const itemCard = page.locator(`text=${itemName}`).locator('..').locator('..');
    await itemCard.locator('button:has-text("Add Link"), button:has-text("Manage")').first().click();

    // Modal should be visible
    await expect(page.locator('text=Manage Links, text=Add Link')).toBeVisible();
  });

  test('should add a product link', async ({ page }) => {
    await page.goto(`/u/${TEST_USER.handle}/${bagCode}/edit`);

    // Open link manager
    const itemCard = page.locator(`text=${itemName}`).locator('..').locator('..');
    await itemCard.locator('button:has-text("Add Link"), button:has-text("Manage")').first().click();

    // Click add link button in modal
    await page.click('button:has-text("+ Add Link"), button:has-text("Add Link")');

    // Fill in URL
    await page.fill('input[type="url"], input[placeholder*="url"]', 'https://www.titleist.com/drivers');

    // Select link type
    await page.selectOption('select', 'product');

    // Submit
    await page.click('button:has-text("Add Link")');

    // Link should appear in the list
    await expect(page.locator('text=titleist.com')).toBeVisible();
  });

  test('should validate URL format', async ({ page }) => {
    await page.goto(`/u/${TEST_USER.handle}/${bagCode}/edit`);

    // Open link manager
    const itemCard = page.locator(`text=${itemName}`).locator('..').locator('..');
    await itemCard.locator('button:has-text("Add Link"), button:has-text("Manage")').first().click();

    // Try to add invalid URL
    await page.click('button:has-text("+ Add Link"), button:has-text("Add Link")');
    await page.fill('input[type="url"]', 'not-a-valid-url');
    await page.click('button:has-text("Add Link")');

    // Should see error message
    await expect(page.locator('text=valid URL, text=https://')).toBeVisible();
  });

  test('should edit a link', async ({ page }) => {
    await page.goto(`/u/${TEST_USER.handle}/${bagCode}/edit`);

    // Add a link first
    const itemCard = page.locator(`text=${itemName}`).locator('..').locator('..');
    await itemCard.locator('button:has-text("Add Link"), button:has-text("Manage")').first().click();
    await page.click('button:has-text("+ Add Link")');
    await page.fill('input[type="url"]', 'https://www.example.com/product');
    await page.selectOption('select', 'product');
    await page.click('button:has-text("Add Link")');

    // Wait for link to be added
    await expect(page.locator('text=example.com')).toBeVisible();

    // Click edit
    await page.click('button:has-text("Edit")');

    // Update URL
    await page.fill('input[type="url"]', 'https://www.updated-example.com/product');

    // Save
    await page.click('button:has-text("Save")');

    // Should see updated URL
    await expect(page.locator('text=updated-example.com')).toBeVisible();
  });

  test('should delete a link', async ({ page }) => {
    await page.goto(`/u/${TEST_USER.handle}/${bagCode}/edit`);

    // Add a link first
    const itemCard = page.locator(`text=${itemName}`).locator('..').locator('..');
    await itemCard.locator('button:has-text("Add Link"), button:has-text("Manage")').first().click();
    await page.click('button:has-text("+ Add Link")');
    await page.fill('input[type="url"]', 'https://www.example.com/product');
    await page.click('button:has-text("Add Link")');

    await expect(page.locator('text=example.com')).toBeVisible();

    // Handle confirmation dialog
    page.once('dialog', dialog => dialog.accept());

    // Delete link
    await page.click('button:has-text("Delete")');

    // Link should be gone
    await expect(page.locator('text=example.com')).not.toBeVisible();
  });

  test('should display link count on item card', async ({ page }) => {
    await page.goto(`/u/${TEST_USER.handle}/${bagCode}/edit`);

    // Add two links
    const itemCard = page.locator(`text=${itemName}`).locator('..').locator('..');
    await itemCard.locator('button:has-text("Add Link")').first().click();

    // Add first link
    await page.click('button:has-text("+ Add Link")');
    await page.fill('input[type="url"]', 'https://www.example1.com');
    await page.click('button:has-text("Add Link")');

    // Add second link
    await page.click('button:has-text("+ Add Link")');
    await page.fill('input[type="url"]', 'https://www.example2.com');
    await page.click('button:has-text("Add Link")');

    // Close modal
    await page.click('button:has-text("Close"), button:has-text("×")');

    // Should see "2 links" on item card
    await expect(itemCard.locator('text=2 links')).toBeVisible();
  });

  test('should support different link types', async ({ page }) => {
    await page.goto(`/u/${TEST_USER.handle}/${bagCode}/edit`);

    const itemCard = page.locator(`text=${itemName}`).locator('..').locator('..');
    await itemCard.locator('button:has-text("Add Link")').first().click();

    const linkTypes = [
      { url: 'https://www.product.com', type: 'product' },
      { url: 'https://www.review.com', type: 'review' },
      { url: 'https://www.youtube.com/watch?v=test', type: 'video' },
    ];

    for (const link of linkTypes) {
      await page.click('button:has-text("+ Add Link")');
      await page.fill('input[type="url"]', link.url);
      await page.selectOption('select', link.type);
      await page.click('button:has-text("Add Link")');
      await page.waitForTimeout(500);
    }

    // All links should be visible with their types
    await expect(page.locator('text=Product')).toBeVisible();
    await expect(page.locator('text=Review')).toBeVisible();
    await expect(page.locator('text=Video')).toBeVisible();
  });
});
