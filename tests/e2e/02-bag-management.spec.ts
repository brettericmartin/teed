import { test, expect } from '@playwright/test';
import { login } from './utils/auth';
import { createBag, addItem, deleteBag, randomBagData, randomItemData } from './utils/testData';

/**
 * Bag Management CRUD Tests
 * Tests creating, reading, updating, and deleting bags
 */

test.describe('Bag Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await login(page);
  });

  test('should display empty dashboard for new user', async ({ page }) => {
    await page.goto('/dashboard');

    // Should see empty state or create new bag button
    await expect(
      page.locator('text=Create New Bag, text=Create Your First Bag, button:has-text("Create")')
    ).toBeVisible();
  });

  test('should create a new bag', async ({ page }) => {
    const bagData = randomBagData();
    const { code } = await createBag(page, bagData);

    // Should be on bag editor page
    await expect(page).toHaveURL(`/bags/${code}/edit`);

    // Should see bag title
    await expect(page.locator(`input[value="${bagData.title}"]`)).toBeVisible();

    // Clean up
    await deleteBag(page, code);
  });

  test('should display created bag in dashboard', async ({ page }) => {
    const bagData = randomBagData();
    const { code } = await createBag(page, bagData);

    // Go back to dashboard
    await page.goto('/dashboard');

    // Should see the bag in the list
    await expect(page.locator(`text=${bagData.title}`)).toBeVisible();

    // Clean up
    await page.click(`text=${bagData.title}`);
    await deleteBag(page, code);
  });

  test('should update bag title with auto-save', async ({ page }) => {
    const bagData = randomBagData();
    const { code } = await createBag(page, bagData);

    // Update title
    const newTitle = `Updated ${bagData.title}`;
    await page.fill('input[value]', newTitle);

    // Wait for auto-save
    await expect(page.locator('text=Saving..., text=Saved')).toBeVisible({ timeout: 2000 });

    // Reload page to verify save
    await page.reload();
    await expect(page.locator(`input[value="${newTitle}"]`)).toBeVisible();

    // Clean up
    await deleteBag(page, code);
  });

  test('should update bag description', async ({ page }) => {
    const bagData = randomBagData();
    const { code } = await createBag(page, bagData);

    // Update description
    const newDescription = 'This is an updated description for testing';
    await page.fill('textarea', newDescription);

    // Wait for auto-save
    await page.waitForTimeout(1000);

    // Reload and verify
    await page.reload();
    await expect(page.locator(`textarea:has-text("${newDescription}")`)).toBeVisible();

    // Clean up
    await deleteBag(page, code);
  });

  test('should toggle bag privacy', async ({ page }) => {
    const bagData = { ...randomBagData(), isPublic: false };
    const { code } = await createBag(page, bagData);

    // Find privacy toggle
    const toggle = page.locator('button[role="switch"]').first();

    // Toggle to public
    await toggle.click();

    // Should see "Public" text
    await expect(page.locator('text=Public')).toBeVisible();

    // Wait for auto-save
    await page.waitForTimeout(1000);

    // Reload and verify
    await page.reload();
    await expect(page.locator('text=Public')).toBeVisible();

    // Clean up
    await deleteBag(page, code);
  });

  test('should delete a bag', async ({ page }) => {
    const bagData = randomBagData();
    const { code } = await createBag(page, bagData);

    // Delete bag
    await deleteBag(page, code);

    // Should be back on dashboard
    await expect(page).toHaveURL('/dashboard');

    // Bag should not be in list
    await expect(page.locator(`text=${bagData.title}`)).not.toBeVisible();
  });
});

test.describe('Item Management', () => {
  let bagCode: string;

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await login(page);

    // Create a test bag
    const { code } = await createBag(page, randomBagData());
    bagCode = code;
  });

  test.afterEach(async ({ page }) => {
    // Clean up test bag
    if (bagCode) {
      await deleteBag(page, bagCode);
    }
  });

  test('should display empty state for bag with no items', async ({ page }) => {
    await page.goto(`/bags/${bagCode}/edit`);

    // Should see empty state or add item button
    await expect(page.locator('text=Add Item, text=No items')).toBeVisible();
  });

  test('should add an item to bag', async ({ page }) => {
    const itemData = randomItemData();
    await addItem(page, bagCode, itemData);

    // Item should be visible
    await expect(page.locator(`text=${itemData.custom_name}`)).toBeVisible();
  });

  test('should display item details', async ({ page }) => {
    const itemData = {
      custom_name: 'Test Golf Club',
      custom_description: 'A great club for testing',
      quantity: 2,
    };
    await addItem(page, bagCode, itemData);

    // Expand item to see details
    const itemCard = page.locator(`text=${itemData.custom_name}`).locator('..').locator('..');
    await itemCard.locator('button').first().click();

    // Should see description
    await expect(page.locator(`text=${itemData.custom_description}`)).toBeVisible();
  });

  test('should edit an item', async ({ page }) => {
    const itemData = randomItemData();
    await addItem(page, bagCode, itemData);

    // Find item and click edit
    const itemCard = page.locator(`text=${itemData.custom_name}`).locator('..').locator('..');
    await itemCard.locator('button[title="Edit"]').click();

    // Update name
    const newName = `Updated ${itemData.custom_name}`;
    await page.fill('input[value]', newName);

    // Save
    await page.click('button[title="Save"]');

    // Should see updated name
    await expect(page.locator(`text=${newName}`)).toBeVisible();
  });

  test('should delete an item', async ({ page }) => {
    const itemData = randomItemData();
    await addItem(page, bagCode, itemData);

    // Find item and click delete
    const itemCard = page.locator(`text=${itemData.custom_name}`).locator('..').locator('..');

    // Handle confirmation dialog
    page.once('dialog', dialog => dialog.accept());

    await itemCard.locator('button[title="Delete"]').click();

    // Item should be gone
    await expect(page.locator(`text=${itemData.custom_name}`)).not.toBeVisible();
  });

  test('should add multiple items', async ({ page }) => {
    const items = [randomItemData(), randomItemData(), randomItemData()];

    for (const itemData of items) {
      await addItem(page, bagCode, itemData);
    }

    // All items should be visible
    for (const itemData of items) {
      await expect(page.locator(`text=${itemData.custom_name}`)).toBeVisible();
    }
  });
});
