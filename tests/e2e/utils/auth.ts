import { Page, expect } from '@playwright/test';

/**
 * Authentication Utility - Handles login and session management
 * for autonomous testing
 */

export interface TestUser {
  email: string;
  password: string;
  handle: string;
  displayName: string;
}

export const TEST_USER: TestUser = {
  email: 'test@teed-test.com',
  password: 'test-password',
  handle: 'test-user-api',
  displayName: 'API Test User',
};

/**
 * Login to the application
 * Note: Most tests will use the pre-authenticated storage state from global setup.
 * This function is primarily for testing the login flow itself.
 */
export async function login(page: Page, user: TestUser = TEST_USER) {
  await page.goto('/login');

  // Fill in credentials
  await page.fill('input[type="email"]', user.email);
  await page.fill('input[type="password"]', user.password);

  // Wait for the Supabase auth request to complete
  const [response] = await Promise.all([
    page.waitForResponse(
      (resp) =>
        resp.url().includes('auth/v1/token') &&
        resp.request().method() === 'POST',
      { timeout: 10000 }
    ),
    page.click('button[type="submit"]'),
  ]);

  // Check if auth request succeeded (2xx status code)
  if (!response.ok()) {
    const errorText = await response.text().catch(() => 'Unknown error');
    throw new Error(
      `Login failed - auth request returned ${response.status()}: ${errorText}`
    );
  }

  // Wait for auth cookies/storage to be set and then wait for navigation
  await page.waitForTimeout(1500);

  // Manually navigate to dashboard to ensure we're there
  await page.goto('/dashboard', { waitUntil: 'domcontentloaded' });

  // Give it a moment to settle
  await page.waitForTimeout(500);

  // Verify we're logged in by checking we're still on dashboard
  const finalUrl = page.url();
  if (!finalUrl.includes('/dashboard')) {
    throw new Error(`Login failed - redirected to ${finalUrl} instead of /dashboard`);
  }
}

/**
 * Logout from the application
 */
export async function logout(page: Page) {
  // Look for logout button/link and click it
  // Implementation depends on your UI
  await page.goto('/');
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  try {
    await page.goto('/dashboard');
    // If we can access dashboard, we're authenticated
    return page.url().includes('/dashboard');
  } catch {
    return false;
  }
}

/**
 * Get authentication state for reuse across tests
 */
export async function getAuthState(page: Page, user: TestUser = TEST_USER) {
  await login(page, user);
  return await page.context().storageState();
}
