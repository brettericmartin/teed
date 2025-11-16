import { chromium, FullConfig } from '@playwright/test';

/**
 * Global setup for Playwright tests
 * Authenticates once and saves the session state for all tests to reuse
 */
async function globalSetup(config: FullConfig) {
  const { baseURL } = config.projects[0].use;

  console.log('🔐 Setting up authentication for tests...');

  // Create a browser and page
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to login page
  await page.goto(`${baseURL}/login`);

  // Fill in test credentials
  await page.fill('input[type="email"]', 'test@teed-test.com');
  await page.fill('input[type="password"]', 'test-password');

  // Submit and wait for auth response
  const [response] = await Promise.all([
    page.waitForResponse(
      (resp) =>
        resp.url().includes('auth/v1/token') &&
        resp.request().method() === 'POST',
      { timeout: 10000 }
    ),
    page.click('button[type="submit"]'),
  ]);

  if (!response.ok()) {
    await browser.close();
    throw new Error(`Authentication failed: ${response.status()}`);
  }

  console.log('✅ Auth request succeeded');

  // Wait for the client-side redirect to dashboard (window.location.href)
  // This triggers a full page load which goes through middleware and sets cookies
  console.log('⏳ Waiting for automatic redirect to dashboard...');
  try {
    await page.waitForURL('**/dashboard', { timeout: 10000 });
    console.log('✅ Automatically redirected to dashboard');
  } catch (error) {
    console.warn('⚠️  No automatic redirect, trying manual navigation...');

    // If no redirect happened, wait for localStorage and try manual navigation
    await page.waitForTimeout(2000);

    // Trigger a full page reload to force cookie sync
    await page.goto(`${baseURL}/dashboard`, { waitUntil: 'load' });
    await page.waitForTimeout(1500);

    const currentUrl = page.url();
    if (currentUrl.includes('/login')) {
      await browser.close();
      throw new Error('Authentication failed - unable to access dashboard after login');
    }
  }

  console.log('✅ Successfully authenticated and on dashboard');

  // Save the authenticated state (includes both cookies and localStorage)
  await context.storageState({ path: 'playwright/.auth/user.json' });

  await browser.close();

  console.log('✅ Auth state saved to playwright/.auth/user.json');
}

export default globalSetup;
