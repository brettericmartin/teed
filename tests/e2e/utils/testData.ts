import { Page } from '@playwright/test';
import { TEST_USER } from './auth';

/**
 * Test Data Utilities - Create and manage test data
 * for autonomous testing
 */

export interface TestBag {
  title: string;
  description?: string;
  isPublic: boolean;
  code?: string;
}

export interface TestItem {
  custom_name: string;
  custom_description?: string;
  notes?: string;
  quantity: number;
}

export interface TestLink {
  url: string;
  kind: 'product' | 'review' | 'video' | 'article' | 'other';
  label?: string;
}

/**
 * Create a test bag via UI
 */
export async function createBag(
  page: Page,
  bag: TestBag
): Promise<{ code: string }> {
  // Use the canonical /bags/new page directly
  // (Note: /dashboard redirects to /u/{handle} and has no "Create New Bag" button)
  await page.goto('/bags/new');
  await page.waitForLoadState('domcontentloaded');

  // Wait for the form to load (it fetches user handle on mount)
  await page.waitForSelector('input#title, input[placeholder*="curating"], input[placeholder*="Golf"]', { timeout: 10000 });

  // Fill in the form
  await page.fill('input#title, input[placeholder*="curating"], input[placeholder*="Golf"]', bag.title);

  if (bag.description) {
    await page.fill(
      'textarea#description, textarea[placeholder*="description"]',
      bag.description
    );
  }

  // Set privacy toggle if needed
  if (!bag.isPublic) {
    // Default is public, so toggle to private
    const toggle = page.locator('button[role="switch"]').first();
    await toggle.click();
  }

  // Submit the form
  await page.click('button:has-text("Create")');

  // Wait for navigation to bag editor (URL structure: /u/[handle]/[code]/edit)
  await page.waitForURL(/\/u\/[^\/]+\/[^\/]+\/edit/, { timeout: 15000 });

  // Extract bag code from URL
  const url = page.url();
  const match = url.match(/\/u\/[^\/]+\/([^\/]+)\/edit/);
  const code = match ? match[1] : '';

  return { code };
}

/**
 * Add an item to a bag via UI
 */
export async function addItem(
  page: Page,
  bagCode: string,
  item: TestItem
): Promise<void> {
  await page.goto(`/u/${TEST_USER.handle}/${bagCode}/edit`);

  // Click "Add Item" button
  await page.click('button:has-text("Add Item")');

  // Fill in the form
  await page.fill('input[name="custom_name"], input[placeholder*="name"]', item.custom_name);

  if (item.custom_description) {
    await page.fill(
      'input[name="custom_description"], input[placeholder*="description"]',
      item.custom_description
    );
  }

  if (item.notes) {
    await page.fill(
      'textarea[name="notes"], textarea[placeholder*="notes"]',
      item.notes
    );
  }

  if (item.quantity && item.quantity > 1) {
    await page.fill('input[name="quantity"], input[type="number"]', item.quantity.toString());
  }

  // Submit the form
  await page.click('button:has-text("Add")');

  // Wait for item to appear in the list
  await page.waitForSelector(`text=${item.custom_name}`, { timeout: 5000 });
}

/**
 * Add a link to an item via UI
 */
export async function addLink(
  page: Page,
  itemName: string,
  link: TestLink
): Promise<void> {
  // Find the item and expand it
  const itemCard = page.locator(`text=${itemName}`).locator('..').locator('..');
  await itemCard.locator('button:has-text("Manage Links"), button:has-text("Add Link")').first().click();

  // Wait for modal or form to appear
  await page.waitForSelector('input[placeholder*="url"], input[type="url"]', { timeout: 5000 });

  // Fill in URL
  await page.fill('input[placeholder*="url"], input[type="url"]', link.url);

  // Select link type if specified
  if (link.kind) {
    await page.selectOption('select', link.kind);
  }

  // Submit
  await page.click('button:has-text("Add Link"), button:has-text("Save")');

  // Wait for link to be added
  await page.waitForTimeout(500);
}

/**
 * Delete a bag
 */
export async function deleteBag(page: Page, bagCode: string): Promise<void> {
  await page.goto(`/u/${TEST_USER.handle}/${bagCode}/edit`);

  // Set up dialog listener before clicking
  page.once('dialog', dialog => dialog.accept());

  // Click delete button
  await page.click('button:has-text("Delete")');

  // Wait for redirect — bag deletion navigates to /dashboard which
  // redirects to /u/{handle}, so wait for either
  await page.waitForURL(/\/(dashboard|u\/)/, { timeout: 10000 });
}

/**
 * Generate random test data
 */
export function randomBagData(isPublic: boolean = false): TestBag {
  const timestamp = Date.now();
  return {
    title: `Test Bag ${timestamp}`,
    description: `Auto-generated test bag created at ${new Date().toISOString()}`,
    isPublic,
  };
}

export function randomItemData(): TestItem {
  const items = [
    'Test Driver',
    'Test Putter',
    'Test Wedge',
    'Test Iron Set',
    'Test Golf Balls',
  ];
  const timestamp = Date.now();
  return {
    custom_name: `${items[Math.floor(Math.random() * items.length)]} ${timestamp}`,
    custom_description: 'Auto-generated test item',
    quantity: Math.floor(Math.random() * 5) + 1,
  };
}

export function randomLinkData(): TestLink {
  const links = [
    { url: 'https://www.titleist.com/golf-clubs', kind: 'product' as const },
    { url: 'https://www.youtube.com/watch?v=test', kind: 'video' as const },
    { url: 'https://www.golfdigest.com/review', kind: 'review' as const },
  ];
  return links[Math.floor(Math.random() * links.length)];
}

/**
 * Clean up all test bags (for teardown)
 */
export async function cleanupTestBags(page: Page): Promise<void> {
  await page.goto('/dashboard');

  // Find all bags with "Test" in the title
  const testBags = page.locator('[class*="bag"], [data-testid*="bag"]').filter({ hasText: 'Test' });
  const count = await testBags.count();

  for (let i = 0; i < count; i++) {
    try {
      await testBags.nth(0).click(); // Click first one (index changes as we delete)
      await deleteBag(page, page.url().match(/\/u\/[^\/]+\/([^\/]+)/)?.[1] || '');
    } catch (e) {
      // Continue if delete fails
      console.log('Failed to delete test bag:', e);
    }
  }
}
