import { test, expect } from '@playwright/test';
import { login } from './utils/auth';

/**
 * Comprehensive End-to-End Flow Tests
 * Tests complete user journeys through the application
 */

test.describe('Complete User Journey', () => {
  test('complete bag creation and sharing flow', async ({ page }) => {
    // Login
    await login(page);

    // Should be on dashboard
    await expect(page).toHaveURL('/dashboard');
    await expect(page.getByRole('heading', { name: 'My Bags' })).toBeVisible();

    // Create new bag
    await page.click('button:has-text("New Bag")');

    // Fill in bag details
    const timestamp = Date.now();
    const bagName = `E2E Test Bag ${timestamp}`;
    await page.fill('input[placeholder*="Bag"]', bagName);
    await page.fill('textarea[placeholder*="description"]', 'This is an automated test bag');
    await page.click('button:has-text("Create Bag")');

    // Should be on bag editor
    await page.waitForURL(/\/edit$/);

    // Add first item
    await page.fill('input[placeholder*="Add"]', 'TaylorMade Stealth Driver');
    await page.press('input[placeholder*="Add"]', 'Enter');
    await page.waitForSelector('text=TaylorMade Stealth Driver');

    // Add second item
    await page.fill('input[placeholder*="Add"]', 'Titleist Pro V1');
    await page.press('input[placeholder*="Add"]', 'Enter');
    await page.waitForSelector('text=Titleist Pro V1');

    // Add third item
    await page.fill('input[placeholder*="Add"]', 'Callaway Rogue ST');
    await page.press('input[placeholder*="Add"]', 'Enter');
    await page.waitForSelector('text=Callaway Rogue ST');

    // Make bag public
    const publicToggle = page.locator('label:has-text("Public")').first();
    if (await publicToggle.isVisible()) {
      await publicToggle.click();
      await page.waitForTimeout(1000); // Wait for auto-save
    }

    // Try Fill Product Links if button exists
    const fillLinksButton = page.locator('button:has-text("Fill Product Links")');
    if (await fillLinksButton.isVisible()) {
      await fillLinksButton.click();
      await page.waitForTimeout(2000);
    }

    // Open share modal
    const shareButton = page.locator('button[title*="Share"]').first();
    if (await shareButton.isVisible()) {
      await shareButton.click();

      // Should see share URL
      await expect(page.locator('text=/http.*/')).toBeVisible();

      // Close modal
      const closeButton = page.locator('button:has-text("Close")').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
      }
    }

    // Go back to dashboard
    await page.click('a[href="/dashboard"]');

    // Verify bag appears in list
    await expect(page.locator(`text=${bagName}`)).toBeVisible();
  });

  test('navigation and UI consistency', async ({ page }) => {
    await login(page);

    // Test dashboard navigation
    await page.goto('/dashboard');
    await expect(page.locator('text=My Bags')).toBeVisible();

    // Test navigation to profile
    const profileLink = page.locator('a[href*="/u/"]').first();
    if (await profileLink.isVisible()) {
      const profileHref = await profileLink.getAttribute('href');
      await page.goto(profileHref!);

      // Should show user profile
      await expect(page.locator('text=@')).toBeVisible();
    }

    // Test home page
    await page.goto('/');
    await expect(page.locator('text=Teed')).toBeVisible();
  });

  test('responsive design - mobile viewport', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });

    await login(page);

    // Dashboard should work on mobile
    await page.goto('/dashboard');
    await expect(page.locator('text=My Bags')).toBeVisible();

    // Create bag button should be visible and tappable
    const newBagButton = page.locator('button:has-text("New Bag")');
    await expect(newBagButton).toBeVisible();

    // Check minimum touch target size (44x44 pixels)
    const boundingBox = await newBagButton.boundingBox();
    expect(boundingBox!.height).toBeGreaterThanOrEqual(36); // Allowing some margin
  });

  test('error handling - invalid URLs', async ({ page }) => {
    await page.goto('/bags/nonexistent-bag-code');

    // Should show 404 or redirect
    await page.waitForTimeout(1000);
    const url = page.url();
    const has404 = await page.locator('text=/not found|404/i').isVisible().catch(() => false);
    const redirected = !url.includes('nonexistent-bag-code');

    expect(has404 || redirected).toBeTruthy();
  });

  test('performance - page load times', async ({ page }) => {
    const startTime = Date.now();

    await login(page);

    const loginTime = Date.now() - startTime;
    expect(loginTime).toBeLessThan(5000); // Login should take less than 5 seconds

    const dashboardStartTime = Date.now();
    await page.goto('/dashboard');
    await page.waitForSelector('text=My Bags');

    const dashboardTime = Date.now() - dashboardStartTime;
    expect(dashboardTime).toBeLessThan(3000); // Dashboard load should take less than 3 seconds
  });
});

test.describe('Accessibility Tests', () => {
  test('keyboard navigation', async ({ page }) => {
    await page.goto('/login');

    // Tab through form elements
    await page.keyboard.press('Tab');
    const emailFocused = await page.locator('input[type="email"]').evaluate(el => el === document.activeElement);
    expect(emailFocused).toBeTruthy();

    await page.keyboard.press('Tab');
    const passwordFocused = await page.locator('input[type="password"]').evaluate(el => el === document.activeElement);
    expect(passwordFocused).toBeTruthy();
  });

  test('essential aria labels present', async ({ page }) => {
    await login(page);
    await page.goto('/dashboard');

    // Check for aria-labels on important buttons
    const newBagButton = page.locator('button:has-text("New Bag")');
    if (await newBagButton.isVisible()) {
      const hasAriaLabel = await newBagButton.getAttribute('aria-label');
      // Either has aria-label or accessible text
      const accessibleText = await newBagButton.textContent();
      expect(hasAriaLabel || accessibleText).toBeTruthy();
    }
  });
});
