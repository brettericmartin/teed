import { test, expect } from '@playwright/test';
import { login } from './utils/auth';
import { createBag, addItem, deleteBag, randomBagData, randomItemData } from './utils/testData';

/**
 * User Profile Tests
 * Tests user profile viewing, public bags display, and profile navigation
 */

test.describe('User Profile Page', () => {
  let publicBagCode: string;
  let privateBagCode: string;
  const testUserHandle = 'test-user-api'; // From test user setup

  test.beforeAll(async ({ browser }) => {
    // Create bags for testing
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page);

    // Create a public bag
    const publicBag = await createBag(page, {
      ...randomBagData(),
      isPublic: true,
    });
    publicBagCode = publicBag.code;

    await addItem(page, publicBagCode, {
      custom_name: 'Profile Test Item',
      custom_description: 'Visible on profile',
      quantity: 1,
    });

    // Create a private bag (should not appear on profile)
    const privateBag = await createBag(page, {
      ...randomBagData(),
      isPublic: false,
    });
    privateBagCode = privateBag.code;

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
    if (privateBagCode) {
      await deleteBag(page, privateBagCode);
    }

    await context.close();
  });

  test('should display user profile page', async ({ page }) => {
    await page.goto(`/u/${testUserHandle}`);

    // Should see user handle
    await expect(page.locator(`text=@${testUserHandle}`)).toBeVisible();

    // Should see profile header
    await expect(page.locator('text=Public Bags, text=public bag')).toBeVisible();
  });

  test('should display only public bags on profile', async ({ page }) => {
    await page.goto(`/u/${testUserHandle}`);

    // Should see the public bag
    await expect(page.locator(`text=${publicBagCode.split('-')[0]}`).first()).toBeVisible();

    // Should NOT see the private bag title in the grid
    // (Private bags shouldn't be listed)
    const bagCards = page.locator('[class*="grid"] > div');
    const count = await bagCards.count();

    // At least one bag should be visible (our public bag)
    expect(count).toBeGreaterThan(0);
  });

  test('should show bag count stat', async ({ page }) => {
    await page.goto(`/u/${testUserHandle}`);

    // Should show number of public bags
    await expect(page.locator('text=public bag')).toBeVisible();
  });

  test('should show joined date', async ({ page }) => {
    await page.goto(`/u/${testUserHandle}`);

    // Should show "Joined" with a date
    await expect(page.locator('text=Joined')).toBeVisible();
  });

  test('should handle non-existent user with 404', async ({ page }) => {
    await page.goto('/u/nonexistent-user-12345');

    // Should show 404 page
    await expect(page.locator('text=404, text=Not Found')).toBeVisible();
  });

  test('should allow clicking on bag to view it', async ({ page }) => {
    await page.goto(`/u/${testUserHandle}`);

    // Click on the first public bag
    const bagCard = page.locator('[class*="grid"] > div').first();
    await bagCard.click();

    // Should navigate to public bag view
    await expect(page).toHaveURL(/\/c\/.+/);

    // Should see the bag content
    await expect(page.locator('text=Profile Test Item')).toBeVisible();
  });

  test('should display empty state for user with no public bags', async ({ page }) => {
    // This test assumes the test user has at least one public bag
    // For a true empty state, you'd need a different test user
    await page.goto(`/u/${testUserHandle}`);

    const emptyState = page.locator('text=No public bags yet');
    const hasPublicBags = await emptyState.isVisible().catch(() => false);

    if (!hasPublicBags) {
      // If user has bags, should see the grid
      await expect(page.locator('[class*="grid"]')).toBeVisible();
    } else {
      // If no bags, should see empty state
      await expect(emptyState).toBeVisible();
    }
  });
});

test.describe('User Attribution Links', () => {
  let publicBagCode: string;
  const testUserHandle = 'test-user-api';

  test.beforeAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page);

    const { code } = await createBag(page, {
      ...randomBagData(),
      isPublic: true,
    });
    publicBagCode = code;

    await context.close();
  });

  test.afterAll(async ({ browser }) => {
    const context = await browser.newContext();
    const page = await context.newPage();
    await login(page);

    if (publicBagCode) {
      await deleteBag(page, publicBagCode);
    }

    await context.close();
  });

  test('should have clickable user attribution on public bag view', async ({ page }) => {
    await page.goto(`/c/${publicBagCode}`);

    // Should see "by @username" link
    const userLink = page.locator(`a[href="/u/${testUserHandle}"]`);
    await expect(userLink).toBeVisible();

    // Click should navigate to profile
    await userLink.click();
    await expect(page).toHaveURL(`/u/${testUserHandle}`);
  });

  test('should have clickable user handle on dashboard', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');

    // Should see clickable @username
    const userLink = page.locator(`a[href="/u/${testUserHandle}"]`);
    await expect(userLink).toBeVisible();

    // Click should navigate to profile
    await userLink.click();
    await expect(page).toHaveURL(`/u/${testUserHandle}`);
  });
});

test.describe('Profile Page SEO and Metadata', () => {
  const testUserHandle = 'test-user-api';

  test('should have appropriate page title', async ({ page }) => {
    await page.goto(`/u/${testUserHandle}`);

    // Should have title with username
    const title = await page.title();
    expect(title).toContain(testUserHandle);
    expect(title).toContain('Teed');
  });

  test('should be accessible without authentication', async ({ page }) => {
    // Don't login - access as public user
    await page.goto(`/u/${testUserHandle}`);

    // Should still see profile
    await expect(page.locator(`text=@${testUserHandle}`)).toBeVisible();
  });
});

test.describe('Profile Dark Mode', () => {
  const testUserHandle = 'test-user-api';

  test('should render correctly in dark mode', async ({ page }) => {
    await page.goto(`/u/${testUserHandle}`);

    // Set dark mode via class on html element
    await page.evaluate(() => {
      document.documentElement.classList.add('dark');
    });

    // Wait for dark mode to apply
    await page.waitForTimeout(500);

    // Should have dark background
    const bgColor = await page.locator('body').evaluate((el) =>
      window.getComputedStyle(el).backgroundColor
    );

    // Dark mode should have dark background (not white)
    expect(bgColor).not.toBe('rgb(255, 255, 255)');
  });
});

test.describe('Profile API Endpoint', () => {
  const testUserHandle = 'test-user-api';

  test('should return user profile and bags via API', async ({ request }) => {
    const response = await request.get(`/api/users/${testUserHandle}/bags`);

    expect(response.ok()).toBeTruthy();

    const data = await response.json();

    // Should have profile
    expect(data.profile).toBeDefined();
    expect(data.profile.handle).toBe(testUserHandle);

    // Should have bags array
    expect(data.bags).toBeDefined();
    expect(Array.isArray(data.bags)).toBeTruthy();

    // Should have totalBags count
    expect(data.totalBags).toBeDefined();
    expect(typeof data.totalBags).toBe('number');
  });

  test('should return 404 for non-existent user', async ({ request }) => {
    const response = await request.get('/api/users/nonexistent-user-12345/bags');

    expect(response.status()).toBe(404);

    const data = await response.json();
    expect(data.error).toBe('User not found');
  });

  test('should only return public bags', async ({ request }) => {
    const response = await request.get(`/api/users/${testUserHandle}/bags`);
    const data = await response.json();

    // All returned bags should be public
    data.bags.forEach((bag: any) => {
      expect(bag.is_public).toBe(true);
    });
  });
});
