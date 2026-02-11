import { test, expect } from '@playwright/test';

// This test runs without auth state — fresh browser
test.use({ storageState: { cookies: [], origins: [] } });

const TEST_EMAIL = `testsignup_${Date.now()}@test.com`;
const TEST_PASSWORD = 'testpass123';
const TEST_HANDLE = `signup_${Date.now().toString(36)}`;
const TEST_NAME = 'Signup Test User';

test.describe('Signup Flow: Account → Onboarding Survey', () => {
  test('full signup flow creates account, shows survey on dashboard, completes survey', async ({ page }) => {
    test.setTimeout(120_000);

    // ============================================================
    // Step 1: Create account on /signup
    // ============================================================
    await page.goto('/signup');
    await expect(page.getByRole('heading', { name: 'Join Teed' })).toBeVisible();

    await page.fill('input[placeholder="Alex Johnson"]', TEST_NAME);
    await page.fill('input[placeholder="alex@example.com"]', TEST_EMAIL);
    await page.fill('input[placeholder="At least 6 characters"]', TEST_PASSWORD);
    await page.fill('input[placeholder="Confirm your password"]', TEST_PASSWORD);
    await page.fill('input[placeholder="your_handle"]', TEST_HANDLE);

    // Wait for handle availability check
    await expect(page.locator('text=Handle is available!')).toBeVisible({ timeout: 5000 });

    // Submit signup form
    const createBtn = page.locator('button:has-text("Create Account")');
    await expect(createBtn).toBeEnabled();
    await createBtn.click();

    // Wait for account creation
    await expect(page.locator('text=Creating account...')).toBeVisible({ timeout: 5000 });

    // ============================================================
    // Step 2: Should land on /dashboard with OnboardingSurvey
    // ============================================================
    await page.waitForURL(/\/dashboard/, { timeout: 30000 });
    await expect(page.locator('text=One more step')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('text=Step 1 of 3')).toBeVisible();

    // ============================================================
    // Step 3: Fill survey step 1 - Who You Are
    // ============================================================
    await page.click('text=Serious Hobbyist');
    await page.click('text=Tech & Gadgets');
    await page.click('text=Under 1,000');
    await page.click('text=YouTube');

    const continueBtn = page.locator('button:has-text("Continue")');
    await expect(continueBtn).toBeEnabled();
    await continueBtn.click();

    // ============================================================
    // Step 4: Fill survey step 2 - Monetization
    // ============================================================
    await expect(page.locator('text=Do you currently use affiliate links?')).toBeVisible();

    await page.click('text=Want to start');
    await page.click('text=$100-500/month');
    await page.click('button:has-text("Nothing yet")');

    await page.click('button:has-text("Continue")');

    // ============================================================
    // Step 5: Fill survey step 3 - Your Needs
    // ============================================================
    await expect(page.locator('text=What frustrates you')).toBeVisible();

    await page.click('button:has-text("Too time-consuming")');
    await page.click('text=Basic tracking');
    await page.click('text=This week');

    // Submit survey
    const completeBtn = page.locator('button:has-text("Complete Setup")');
    await expect(completeBtn).toBeEnabled();
    await completeBtn.click();

    // Wait for submission
    await expect(page.locator('text=Finishing up...')).toBeVisible({ timeout: 5000 });

    // ============================================================
    // Step 6: Verify redirect after survey completion
    // ============================================================
    // Should redirect to either /u/[handle] (auto-approved) or /dashboard (pending)
    await page.waitForURL(/\/(u\/|dashboard)/, { timeout: 30000 });

    const finalUrl = page.url();
    const isApproved = finalUrl.includes(`/u/${TEST_HANDLE}`);
    const isPending = finalUrl.includes('/dashboard');

    console.log(`Survey submitted. Final URL: ${finalUrl}`);
    console.log(`Auto-approved: ${isApproved}`);

    if (isApproved) {
      // Should be on profile page
      expect(finalUrl).toContain(`/u/${TEST_HANDLE}`);
    } else if (isPending) {
      // Should show BetaGate (not survey again)
      // The survey should NOT appear again since application now exists
      await expect(page.locator('text=One more step')).not.toBeVisible({ timeout: 5000 });
    }

    // ============================================================
    // Step 7: Sign out and sign back in
    // ============================================================
    await page.evaluate(async () => {
      await fetch('/api/auth/signout', { method: 'POST' });
    });

    await page.goto('/login');
    await expect(page.locator('text=Sign in to continue')).toBeVisible();

    await page.fill('input#email', TEST_EMAIL);
    await page.fill('input#password', TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Should reach dashboard or profile, NOT the survey again
    await page.waitForURL(/\/(u\/|dashboard)/, { timeout: 15000 });
    const loginUrl = page.url();
    console.log(`After re-login, URL: ${loginUrl}`);

    // If approved, should be at profile. If pending, dashboard with BetaGate.
    if (isApproved) {
      expect(loginUrl).toContain(`/u/${TEST_HANDLE}`);
    } else {
      expect(loginUrl).toContain('/dashboard');
      // Should NOT show survey again (application exists)
      await expect(page.locator('text=One more step')).not.toBeVisible({ timeout: 5000 });
    }

    console.log('✓ Full signup flow test passed!');
    console.log(`  Email: ${TEST_EMAIL}`);
    console.log(`  Handle: @${TEST_HANDLE}`);
    console.log(`  Auto-approved: ${isApproved}`);
  });

  test('signup without survey: dashboard shows survey on sign-in', async ({ page }) => {
    test.setTimeout(60_000);

    const email = `testnosurv_${Date.now()}@test.com`;
    const handle = `nosurv_${Date.now().toString(36)}`;

    // Create account via /signup
    await page.goto('/signup');
    await page.fill('input[placeholder="Alex Johnson"]', 'No Survey User');
    await page.fill('input[placeholder="alex@example.com"]', email);
    await page.fill('input[placeholder="At least 6 characters"]', 'testpass123');
    await page.fill('input[placeholder="Confirm your password"]', 'testpass123');
    await page.fill('input[placeholder="your_handle"]', handle);

    await expect(page.locator('text=Handle is available!')).toBeVisible({ timeout: 5000 });
    await page.click('button:has-text("Create Account")');

    // Wait for redirect to dashboard
    await page.waitForURL(/\/dashboard/, { timeout: 30000 });
    await expect(page.locator('text=One more step')).toBeVisible({ timeout: 10000 });

    // Sign out WITHOUT completing survey
    await page.evaluate(async () => {
      await fetch('/api/auth/signout', { method: 'POST' });
    });

    // Sign back in
    await page.goto('/login');
    await page.fill('input#email', email);
    await page.fill('input#password', 'testpass123');
    await page.click('button[type="submit"]');

    // Dashboard should show survey again (no application exists)
    await page.waitForURL(/\/dashboard/, { timeout: 15000 });
    await expect(page.locator('text=One more step')).toBeVisible({ timeout: 10000 });

    console.log('✓ Sign-in without survey correctly shows survey on dashboard');
  });
});
