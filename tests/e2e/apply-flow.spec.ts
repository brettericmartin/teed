import { test, expect } from '@playwright/test';

// This test runs without auth state — fresh browser
test.use({ storageState: { cookies: [], origins: [] } });

const TEST_EMAIL = `testapply_${Date.now()}@test.com`;
const TEST_PASSWORD = 'testpass123';
const TEST_HANDLE = `tester_${Date.now().toString(36)}`;
const TEST_NAME = 'E2E Test User';

test.describe('Apply Flow: Survey → Account Creation → Sign In', () => {
  test('full apply flow creates account, submits application, and allows sign-in', async ({ page }) => {
    test.setTimeout(90_000);

    // ============================================================
    // Step 1: Fill account info on /apply
    // ============================================================
    await page.goto('/apply');
    await expect(page.locator('text=Founding Member Application')).toBeVisible();

    // Step 1: "Your Account"
    await expect(page.locator('text=Create your account')).toBeVisible();

    await page.fill('input[placeholder="Alex Johnson"]', TEST_NAME);
    await page.fill('input[placeholder="alex@example.com"]', TEST_EMAIL);
    await page.fill('input[placeholder="At least 6 characters"]', TEST_PASSWORD);
    await page.fill('input[placeholder="Confirm your password"]', TEST_PASSWORD);
    await page.fill('input[placeholder="your_handle"]', TEST_HANDLE);

    // Wait for handle availability check
    await expect(page.locator('text=Handle is available!')).toBeVisible({ timeout: 5000 });

    // Continue button should be enabled now
    const continueBtn = page.locator('button:has-text("Continue")');
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();

    // ============================================================
    // Step 2: Who You Are
    // ============================================================
    await expect(page.locator('text=Tell us about yourself')).toBeVisible();

    // Creator type
    await page.click('text=Serious Hobbyist');
    // Niche
    await page.click('text=Tech & Gadgets');
    // Audience size
    await page.click('text=Under 1,000');
    // Platform
    await page.click('text=YouTube');

    await page.click('button:has-text("Continue")');

    // ============================================================
    // Step 3: Monetization
    // ============================================================
    await expect(page.locator('text=About monetization')).toBeVisible();

    // Affiliate status
    await page.click('text=Want to start');
    // Revenue goals
    await page.click('text=$100-500/month');
    // Current tools (select one)
    await page.click('button:has-text("Nothing yet")');

    await page.click('button:has-text("Continue")');

    // ============================================================
    // Step 4: Your Needs
    // ============================================================
    await expect(page.locator('text=Almost there!')).toBeVisible();

    // Frustrations (multi-select)
    await page.click('button:has-text("Too time-consuming")');
    // Documentation habits
    await page.click('text=Basic tracking');
    // Usage intent
    await page.click('text=This week');

    // Submit
    const submitBtn = page.locator('button:has-text("Submit Application")');
    await expect(submitBtn).toBeEnabled();
    await submitBtn.click();

    // Wait for submission — button should show "Creating account..."
    await expect(page.locator('text=Creating account...')).toBeVisible({ timeout: 5000 });

    // ============================================================
    // Verify: Success page loads
    // ============================================================
    await page.waitForURL(/\/apply\/success/, { timeout: 30000 });
    const url = page.url();
    expect(url).toContain('/apply/success');
    expect(url).toContain('id=');
    expect(url).toMatch(/approved=(true|false)/);

    const isApproved = url.includes('approved=true');
    console.log(`Application submitted. Auto-approved: ${isApproved}`);
    console.log(`Success URL: ${url}`);

    if (isApproved) {
      // Should show "You're in!" heading and dashboard CTA
      await expect(page.getByRole('heading', { name: "You're in!" })).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Go to Dashboard')).toBeVisible();
    } else {
      // Should show "Application received"
      await expect(page.locator('text=Application received')).toBeVisible({ timeout: 10000 });
    }

    // ============================================================
    // Verify: Sign out and sign back in
    // ============================================================
    // Sign out via API
    await page.evaluate(async () => {
      await fetch('/api/auth/signout', { method: 'POST' });
    });

    // Go to login page
    await page.goto('/login');
    await expect(page.locator('text=Sign in to continue')).toBeVisible();

    // Fill login form
    await page.fill('input#email', TEST_EMAIL);
    await page.fill('input#password', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    if (isApproved) {
      // Approved users: /dashboard redirects to /u/[handle] via server component
      await page.waitForURL(new RegExp(`/u/${TEST_HANDLE}`), { timeout: 15000 });
      const dashUrl = page.url();
      console.log(`After login, redirected to: ${dashUrl}`);
      expect(dashUrl).toContain(`/u/${TEST_HANDLE}`);
    } else {
      // Pending users → /dashboard with BetaGate
      await page.waitForURL(/\/dashboard/, { timeout: 15000 });
      const dashUrl = page.url();
      console.log(`After login, redirected to: ${dashUrl}`);
      expect(dashUrl).toContain('/dashboard');
      await expect(page.locator(`text=Welcome, ${TEST_NAME}`).or(page.locator('text=Under Review'))).toBeVisible({ timeout: 10000 });
    }

    console.log('✓ Full apply flow test passed!');
    console.log(`  Email: ${TEST_EMAIL}`);
    console.log(`  Handle: @${TEST_HANDLE}`);
    console.log(`  Auto-approved: ${isApproved}`);
  });
});
