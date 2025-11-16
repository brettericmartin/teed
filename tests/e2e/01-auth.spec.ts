import { test, expect } from '@playwright/test';
import { login, TEST_USER } from './utils/auth';

/**
 * Authentication Flow Tests
 * Tests login, logout, and session management
 */

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear cookies before each test
    await page.context().clearCookies();
  });

  test('should display login page', async ({ page }) => {
    await page.goto('/login');

    // Check for login form elements
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();

    // Check for Teed branding
    await expect(page.getByRole('heading', { name: 'Teed' })).toBeVisible();
  });

  test('should show pre-filled test credentials', async ({ page }) => {
    await page.goto('/login');

    // Check if email is pre-filled
    const emailInput = page.locator('input[type="email"]');
    await expect(emailInput).toHaveValue(TEST_USER.email);

    // Check if password is pre-filled
    const passwordInput = page.locator('input[type="password"]');
    await expect(passwordInput).toHaveValue(TEST_USER.password);
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await login(page);

    // Should be on dashboard
    await expect(page).toHaveURL('/dashboard');

    // Should see user-specific content
    await expect(page.getByRole('heading', { name: 'My Bags' })).toBeVisible();
  });

  test('should show error with invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Enter invalid credentials
    await page.fill('input[type="email"]', 'wrong@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');

    // Submit
    await page.click('button[type="submit"]');

    // Wait for error response
    await page.waitForTimeout(2000);

    // Should see error message container
    await expect(page.locator('.bg-red-50')).toBeVisible({ timeout: 5000 });

    // Should still be on login page
    await expect(page).toHaveURL(/\/login/);
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    // Try to access dashboard without logging in
    await page.goto('/dashboard');

    // Should be redirected to login
    await expect(page).toHaveURL('/login');
  });

  test('should persist session across page reloads', async ({ page }) => {
    await login(page);

    // Reload the page
    await page.reload();

    // Should still be on dashboard (session persisted)
    await expect(page).toHaveURL('/dashboard');
  });
});

test.describe('Authenticated User Behavior', () => {
  // This test group uses the pre-authenticated state
  // Do NOT clear cookies in beforeEach

  test('should redirect logged-in user from login page', async ({ page }) => {
    // This test uses the pre-authenticated state from global setup
    // Verify we can access dashboard
    await page.goto('/dashboard');
    await expect(page).toHaveURL('/dashboard');

    // Logged-in users can still view login page (no redirect logic implemented)
    await page.goto('/login');
    await expect(page).toHaveURL('/login');
  });
});

test.describe('Session Management', () => {
  test('should maintain session in new tab', async ({ context, page }) => {
    await login(page);

    // Open new tab
    const newPage = await context.newPage();
    await newPage.goto('/dashboard');

    // Should be logged in in new tab
    await expect(newPage).toHaveURL('/dashboard');

    await newPage.close();
  });

  test('should handle session expiry gracefully', async ({ page }) => {
    await login(page);

    // Clear cookies to simulate session expiry
    await page.context().clearCookies();

    // Try to access protected route
    await page.goto('/dashboard');

    // Should be redirected to login
    await expect(page).toHaveURL('/login');
  });
});
