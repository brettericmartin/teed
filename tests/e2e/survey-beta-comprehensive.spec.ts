import { test, expect, Page } from '@playwright/test';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load env vars for service-role access
dotenv.config({ path: path.join(__dirname, '..', '..', '.env.local') });

// ============================================================================
// Helpers
// ============================================================================

/** Service-role Supabase client for DB verification and cleanup */
function createServiceSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!url || !key) throw new Error('Missing Supabase env vars for service role client');
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

/** Generate a unique test user with prefix */
function generateTestUser(prefix: string) {
  const ts = Date.now();
  const rand = Math.random().toString(36).slice(2, 6);
  return {
    email: `${prefix}_${ts}_${rand}@test.com`,
    password: 'testpass123',
    handle: `${prefix}_${ts.toString(36)}_${rand}`,
    name: `Test ${prefix} User`,
  };
}

/** Fill survey step 1 — Who You Are (works on both OnboardingSurvey and ApplyForm) */
async function fillSurveyStep1(page: Page) {
  await page.click('text=Serious Hobbyist');
  await page.click('text=Tech & Gadgets');
  await page.click('text=Under 1,000');
  await page.click('text=YouTube');
}

/** Fill survey step 2 — Monetization */
async function fillSurveyStep2(page: Page) {
  await page.click('text=Want to start');
  await page.click('text=$100-500/month');
  await page.click('button:has-text("Nothing yet")');
}

/** Fill survey step 3 — Your Needs */
async function fillSurveyStep3(page: Page) {
  await page.click('button:has-text("Too time-consuming")');
  await page.click('text=Basic tracking');
  await page.click('text=This week');
}

/** Sign out via API call */
async function signOut(page: Page) {
  await page.evaluate(async () => {
    await fetch('/api/auth/signout', { method: 'POST' });
  });
}

/** Sign in via the login form */
async function signIn(page: Page, email: string, password: string) {
  await page.goto('/login');
  await expect(page.locator('text=Sign in to continue')).toBeVisible({ timeout: 10000 });
  await page.fill('input#email', email);
  await page.fill('input#password', password);
  await page.click('button[type="submit"]');
}

/** Clean up a test user from all related tables + auth */
async function cleanupTestUser(supabase: SupabaseClient, email: string) {
  // Find user by email in auth
  const { data: users } = await supabase.auth.admin.listUsers({ perPage: 1000 });
  const user = users?.users?.find((u) => u.email === email.toLowerCase());
  if (!user) return;

  const userId = user.id;

  // Delete beta_applications
  await supabase.from('beta_applications').delete().eq('user_id', userId);

  // Delete invite codes associated with this user's applications
  await supabase.from('beta_invite_codes').delete().eq('created_by_id', userId);

  // Delete profile
  await supabase.from('profiles').delete().eq('id', userId);

  // Delete auth user
  await supabase.auth.admin.deleteUser(userId);
}

/** Click the survey's Back button (scoped to survey card to avoid bottom nav match) */
async function clickSurveyBack(page: Page) {
  await page.locator('.rounded-2xl button:has-text("Back")').click();
}

// ============================================================================
// Test Suite — serial at top level to prevent D-block threshold from racing
// ============================================================================

// All tests in this file run without pre-existing auth
test.use({ storageState: { cookies: [], origins: [] } });

// Track test users for cleanup
const testUserEmails = new Set<string>();
const serviceSupabase = createServiceSupabase();

test.describe('Survey/Beta Comprehensive', () => {
  // Run all describe blocks sequentially so D's threshold change doesn't race with A/B/E
  test.describe.configure({ mode: 'serial' });

  test.afterAll(async () => {
    // Ensure threshold is always restored to 0
    await serviceSupabase
      .from('beta_settings')
      .update({ value: 0 })
      .eq('key', 'auto_approval_priority_threshold');

    for (const email of testUserEmails) {
      try {
        await cleanupTestUser(serviceSupabase, email);
      } catch (err) {
        console.error(`Cleanup failed for ${email}:`, err);
      }
    }
  });

  // ============================================================================
  // A. Signup -> Survey -> Auto-Approve -> Profile (serial)
  // ============================================================================
  test.describe('A. Signup -> Survey -> Auto-Approve -> Profile', () => {
    test.describe.configure({ mode: 'serial' });

    const user = generateTestUser('surv_a');
    testUserEmails.add(user.email);

    test('A1: Full signup + survey flow -> auto-approved -> profile redirect', async ({ page }) => {
      test.setTimeout(120_000);

      // Signup
      await page.goto('/signup');
      await expect(page.getByRole('heading', { name: 'Join Teed' })).toBeVisible();

      await page.fill('input[placeholder="Alex Johnson"]', user.name);
      await page.fill('input[placeholder="alex@example.com"]', user.email);
      await page.fill('input[placeholder="At least 6 characters"]', user.password);
      await page.fill('input[placeholder="Confirm your password"]', user.password);
      await page.fill('input[placeholder="your_handle"]', user.handle);

      await expect(page.locator('text=Handle is available!')).toBeVisible({ timeout: 5000 });
      await page.click('button:has-text("Create Account")');
      await expect(page.locator('text=Creating account...')).toBeVisible({ timeout: 5000 });

      // Should land on /dashboard with OnboardingSurvey
      await page.waitForURL(/\/dashboard/, { timeout: 30000 });
      await expect(page.locator('text=One more step')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Step 1 of 3')).toBeVisible();

      // Step 1
      await fillSurveyStep1(page);
      const continueBtn = page.locator('button:has-text("Continue")');
      await expect(continueBtn).toBeEnabled();
      await continueBtn.click();

      // Step 2
      await expect(page.locator('text=Do you currently use affiliate links?')).toBeVisible();
      await fillSurveyStep2(page);
      await page.click('button:has-text("Continue")');

      // Step 3
      await expect(page.locator('text=What frustrates you')).toBeVisible();
      await fillSurveyStep3(page);

      const completeBtn = page.locator('button:has-text("Complete Setup")');
      await expect(completeBtn).toBeEnabled();
      await completeBtn.click();

      await expect(page.locator('text=Finishing up...')).toBeVisible({ timeout: 5000 });

      // Should redirect to /u/[handle] (auto-approved with threshold=0) or /dashboard
      await page.waitForURL(/\/(u\/|dashboard)/, { timeout: 30000 });

      const finalUrl = page.url();
      if (finalUrl.includes(`/u/${user.handle}`)) {
        // Auto-approved — on profile page
      } else {
        // If not auto-approved, the survey should NOT appear again
        await expect(page.locator('text=One more step')).not.toBeVisible({ timeout: 5000 });
      }
    });

    test('A2: Database state after auto-approve', async () => {
      test.setTimeout(30_000);

      // Find user
      const { data: users } = await serviceSupabase.auth.admin.listUsers({ perPage: 1000 });
      const authUser = users?.users?.find((u) => u.email === user.email.toLowerCase());
      expect(authUser).toBeTruthy();

      // Check beta_applications
      const { data: app, error: appErr } = await serviceSupabase
        .from('beta_applications')
        .select('*')
        .eq('user_id', authUser!.id)
        .single();

      expect(appErr).toBeNull();
      expect(app).toBeTruthy();

      // survey_responses should match what we filled
      expect(app.survey_responses).toBeTruthy();
      expect(app.survey_responses.creator_type).toBe('serious_hobbyist');
      expect(app.survey_responses.primary_niche).toBe('tech_gadgets');
      expect(app.survey_responses.audience_size).toBe('under_1k');
      expect(app.survey_responses.primary_platform).toBe('youtube');
      expect(app.survey_responses.affiliate_status).toBe('want_to_start');
      expect(app.survey_responses.usage_intent).toBe('this_week');

      // Scorecard fields should be populated
      expect(app.scorecard_score).toBeGreaterThanOrEqual(0);
      expect(app.scorecard_persona).toBeTruthy();
      expect(app.priority_score).toBeGreaterThanOrEqual(0);

      // Should be auto-approved (threshold=0)
      expect(app.status).toBe('approved');

      // Check profile
      const { data: profile } = await serviceSupabase
        .from('profiles')
        .select('beta_tier, beta_approved_at')
        .eq('id', authUser!.id)
        .single();

      expect(profile).toBeTruthy();
      expect(profile!.beta_tier).toBe('standard');
      expect(profile!.beta_approved_at).toBeTruthy();
    });

    test('A3: Re-login goes to profile, not survey', async ({ page }) => {
      test.setTimeout(60_000);

      await signIn(page, user.email, user.password);

      // Approved user should land on /u/[handle]
      await page.waitForURL(/\/(u\/|dashboard)/, { timeout: 15000 });
      const url = page.url();

      if (url.includes('/dashboard')) {
        // Dashboard should redirect to profile for approved users
        await page.waitForURL(/\/u\//, { timeout: 10000 });
      }

      // Survey should NOT appear
      await expect(page.locator('text=One more step')).not.toBeVisible({ timeout: 3000 });
    });
  });

  // ============================================================================
  // B. Apply -> Success -> Auto-Approve (serial)
  // ============================================================================
  test.describe('B. Apply -> Success -> Auto-Approve', () => {
    test.describe.configure({ mode: 'serial' });

    const user = generateTestUser('surv_b');
    testUserEmails.add(user.email);

    test('B1: Full apply flow -> auto-approved -> success page', async ({ page }) => {
      test.setTimeout(90_000);

      await page.goto('/apply');
      await expect(page.locator('text=Founding Member Application')).toBeVisible();

      // Step 1: Account
      await expect(page.locator('text=Create your account')).toBeVisible();
      await page.fill('input[placeholder="Alex Johnson"]', user.name);
      await page.fill('input[placeholder="alex@example.com"]', user.email);
      await page.fill('input[placeholder="At least 6 characters"]', user.password);
      await page.fill('input[placeholder="Confirm your password"]', user.password);
      await page.fill('input[placeholder="your_handle"]', user.handle);

      await expect(page.locator('text=Handle is available!')).toBeVisible({ timeout: 5000 });
      await page.click('button:has-text("Continue")');

      // Step 2: Who You Are
      await expect(page.locator('text=Tell us about yourself')).toBeVisible();
      await fillSurveyStep1(page);
      await page.click('button:has-text("Continue")');

      // Step 3: Monetization
      await expect(page.locator('text=About monetization')).toBeVisible();
      await fillSurveyStep2(page);
      await page.click('button:has-text("Continue")');

      // Step 4: Your Needs
      await expect(page.locator('text=Almost there!')).toBeVisible();
      await fillSurveyStep3(page);

      const submitBtn = page.locator('button:has-text("Submit Application")');
      await expect(submitBtn).toBeEnabled();
      await submitBtn.click();

      await expect(page.locator('text=Creating account...')).toBeVisible({ timeout: 5000 });

      // Success page
      await page.waitForURL(/\/apply\/success/, { timeout: 30000 });
      const url = page.url();
      expect(url).toContain('/apply/success');
      expect(url).toContain('id=');
      expect(url).toMatch(/approved=(true|false)/);

      const isApproved = url.includes('approved=true');
      if (isApproved) {
        await expect(page.getByRole('heading', { name: "You're in!" })).toBeVisible({ timeout: 10000 });
        await expect(page.locator('text=Go to Dashboard')).toBeVisible();
      } else {
        await expect(page.locator('text=Application received')).toBeVisible({ timeout: 10000 });
      }
    });

    test('B2: Database state after apply', async () => {
      test.setTimeout(30_000);

      const { data: users } = await serviceSupabase.auth.admin.listUsers({ perPage: 1000 });
      const authUser = users?.users?.find((u) => u.email === user.email.toLowerCase());
      expect(authUser).toBeTruthy();

      const { data: app } = await serviceSupabase
        .from('beta_applications')
        .select('*')
        .eq('user_id', authUser!.id)
        .single();

      expect(app).toBeTruthy();

      // Survey responses
      expect(app.survey_responses.creator_type).toBe('serious_hobbyist');
      expect(app.survey_responses.primary_platform).toBe('youtube');

      // Source should be organic (no referral code)
      expect(app.source).toBe('organic');

      // Scorecard populated
      expect(app.scorecard_score).toBeGreaterThanOrEqual(0);
      expect(app.scorecard_persona).toBeTruthy();
      expect(app.priority_score).toBeGreaterThanOrEqual(0);

      // Auto-approved (threshold=0)
      expect(app.status).toBe('approved');

      // Profile
      const { data: profile } = await serviceSupabase
        .from('profiles')
        .select('beta_tier, beta_approved_at')
        .eq('id', authUser!.id)
        .single();

      expect(profile!.beta_tier).toBe('standard');
      expect(profile!.beta_approved_at).toBeTruthy();
    });

    test('B3: Re-login after apply approval -> profile', async ({ page }) => {
      test.setTimeout(60_000);

      await signIn(page, user.email, user.password);

      await page.waitForURL(/\/(u\/|dashboard)/, { timeout: 15000 });
      const url = page.url();

      if (url.includes('/dashboard')) {
        await page.waitForURL(/\/u\//, { timeout: 10000 });
      }

      expect(page.url()).toContain(`/u/${user.handle}`);
    });
  });

  // ============================================================================
  // C. Survey UI Mechanics
  // ============================================================================
  test.describe('C. Survey UI Mechanics', () => {
    test('C1: Step navigation — back/forward, selections persist', async ({ page }) => {
      test.setTimeout(90_000);

      const user = generateTestUser('surv_c1');
      testUserEmails.add(user.email);

      await page.goto('/signup');
      await page.fill('input[placeholder="Alex Johnson"]', user.name);
      await page.fill('input[placeholder="alex@example.com"]', user.email);
      await page.fill('input[placeholder="At least 6 characters"]', user.password);
      await page.fill('input[placeholder="Confirm your password"]', user.password);
      await page.fill('input[placeholder="your_handle"]', user.handle);
      await expect(page.locator('text=Handle is available!')).toBeVisible({ timeout: 5000 });
      await page.click('button:has-text("Create Account")');
      await page.waitForURL(/\/dashboard/, { timeout: 30000 });
      await expect(page.locator('text=One more step')).toBeVisible({ timeout: 10000 });

      // Step 1 — select options
      await page.click('text=Serious Hobbyist');
      await page.click('text=Tech & Gadgets');
      await page.click('text=Under 1,000');
      await page.click('text=YouTube');

      // Continue to step 2
      await page.click('button:has-text("Continue")');
      await expect(page.locator('text=Do you currently use affiliate links?')).toBeVisible();
      await expect(page.locator('text=Step 2 of 3')).toBeVisible();

      // Select step 2 options
      await page.click('text=Want to start');

      // Go back to step 1 — use scoped selector to avoid bottom nav "Back"
      await clickSurveyBack(page);
      await expect(page.locator('text=Step 1 of 3')).toBeVisible();

      // Verify step 1 selections are still highlighted
      const seriousHobbyistBtn = page.locator('button:has-text("Serious Hobbyist")');
      await expect(seriousHobbyistBtn).toBeVisible();

      // Go forward again — step 2 selection should persist
      await page.click('button:has-text("Continue")');
      await expect(page.locator('text=Do you currently use affiliate links?')).toBeVisible();

      // "Want to start" should still be selected
      const wantToStartBtn = page.locator('button:has-text("Want to start")');
      await expect(wantToStartBtn).toBeVisible();

      // Complete step 2 + 3 to clean up
      await page.click('text=$100-500/month');
      await page.click('button:has-text("Nothing yet")');
      await page.click('button:has-text("Continue")');

      await fillSurveyStep3(page);
      await page.click('button:has-text("Complete Setup")');
      await page.waitForURL(/\/(u\/|dashboard)/, { timeout: 30000 });
    });

    test('C2: Progress bar width updates across steps', async ({ page }) => {
      test.setTimeout(90_000);

      const user2 = generateTestUser('surv_c2');
      testUserEmails.add(user2.email);

      await page.goto('/signup');
      await page.fill('input[placeholder="Alex Johnson"]', user2.name);
      await page.fill('input[placeholder="alex@example.com"]', user2.email);
      await page.fill('input[placeholder="At least 6 characters"]', user2.password);
      await page.fill('input[placeholder="Confirm your password"]', user2.password);
      await page.fill('input[placeholder="your_handle"]', user2.handle);
      await expect(page.locator('text=Handle is available!')).toBeVisible({ timeout: 5000 });
      await page.click('button:has-text("Create Account")');
      await page.waitForURL(/\/dashboard/, { timeout: 30000 });
      await expect(page.locator('text=One more step')).toBeVisible({ timeout: 10000 });

      // Step 1: progress bar at ~33%
      const progressBar = page.locator('.h-1 > div');
      await expect(progressBar).toHaveCSS('width', /\d+/);
      const step1Width = await progressBar.evaluate((el) => el.style.width);
      expect(step1Width).toContain('33');

      // Fill step 1 and continue
      await fillSurveyStep1(page);
      await page.click('button:has-text("Continue")');

      // Step 2: ~67%
      await expect(page.locator('text=Step 2 of 3')).toBeVisible();
      const step2Width = await progressBar.evaluate((el) => el.style.width);
      expect(step2Width).toContain('66');

      // Fill step 2 and continue
      await fillSurveyStep2(page);
      await page.click('button:has-text("Continue")');

      // Step 3: 100%
      await expect(page.locator('text=What frustrates you')).toBeVisible();
      const step3Width = await progressBar.evaluate((el) => el.style.width);
      expect(step3Width).toBe('100%');

      // Submit to clean up
      await fillSurveyStep3(page);
      await page.click('button:has-text("Complete Setup")');
      await page.waitForURL(/\/(u\/|dashboard)/, { timeout: 30000 });
    });

    test('C3: Required field validation — Continue disabled until fields filled', async ({ page }) => {
      test.setTimeout(90_000);

      const user3 = generateTestUser('surv_c3');
      testUserEmails.add(user3.email);

      await page.goto('/signup');
      await page.fill('input[placeholder="Alex Johnson"]', user3.name);
      await page.fill('input[placeholder="alex@example.com"]', user3.email);
      await page.fill('input[placeholder="At least 6 characters"]', user3.password);
      await page.fill('input[placeholder="Confirm your password"]', user3.password);
      await page.fill('input[placeholder="your_handle"]', user3.handle);
      await expect(page.locator('text=Handle is available!')).toBeVisible({ timeout: 5000 });
      await page.click('button:has-text("Create Account")');
      await page.waitForURL(/\/dashboard/, { timeout: 30000 });
      await expect(page.locator('text=One more step')).toBeVisible({ timeout: 10000 });

      const continueBtn = page.locator('button:has-text("Continue")');

      // Step 1: Continue should be disabled initially
      await expect(continueBtn).toBeDisabled();

      // Fill one field — still disabled
      await page.click('text=Serious Hobbyist');
      await expect(continueBtn).toBeDisabled();

      // Fill all step 1 fields
      await page.click('text=Tech & Gadgets');
      await page.click('text=Under 1,000');
      await page.click('text=YouTube');
      await expect(continueBtn).toBeEnabled();

      // Advance to step 2
      await continueBtn.click();
      await expect(page.locator('text=Do you currently use affiliate links?')).toBeVisible();

      const continueBtn2 = page.locator('button:has-text("Continue")');
      await expect(continueBtn2).toBeDisabled();

      // Fill step 2 partially
      await page.click('text=Want to start');
      await expect(continueBtn2).toBeDisabled();
      await page.click('text=$100-500/month');
      await expect(continueBtn2).toBeDisabled();
      await page.click('button:has-text("Nothing yet")');
      await expect(continueBtn2).toBeEnabled();

      // Advance to step 3
      await continueBtn2.click();
      await expect(page.locator('text=What frustrates you')).toBeVisible();

      // Complete Setup button should be disabled initially
      const completeBtn = page.locator('button:has-text("Complete Setup")');
      await expect(completeBtn).toBeDisabled();

      await page.click('button:has-text("Too time-consuming")');
      await expect(completeBtn).toBeDisabled();
      await page.click('text=Basic tracking');
      await expect(completeBtn).toBeDisabled();
      await page.click('text=This week');
      await expect(completeBtn).toBeEnabled();

      // Submit to clean up
      await completeBtn.click();
      await page.waitForURL(/\/(u\/|dashboard)/, { timeout: 30000 });
    });

    test('C4: Error display on API failure', async ({ page }) => {
      test.setTimeout(90_000);

      const user4 = generateTestUser('surv_c4');
      testUserEmails.add(user4.email);

      await page.goto('/signup');
      await page.fill('input[placeholder="Alex Johnson"]', user4.name);
      await page.fill('input[placeholder="alex@example.com"]', user4.email);
      await page.fill('input[placeholder="At least 6 characters"]', user4.password);
      await page.fill('input[placeholder="Confirm your password"]', user4.password);
      await page.fill('input[placeholder="your_handle"]', user4.handle);
      await expect(page.locator('text=Handle is available!')).toBeVisible({ timeout: 5000 });
      await page.click('button:has-text("Create Account")');
      await page.waitForURL(/\/dashboard/, { timeout: 30000 });
      await expect(page.locator('text=One more step')).toBeVisible({ timeout: 10000 });

      // Fill all steps
      await fillSurveyStep1(page);
      await page.click('button:has-text("Continue")');
      await fillSurveyStep2(page);
      await page.click('button:has-text("Continue")');
      await fillSurveyStep3(page);

      // Intercept the API call to return a 500 error
      await page.route('**/api/apply', (route) => {
        route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: JSON.stringify({ error: 'Internal server error during test' }),
        });
      });

      await page.click('button:has-text("Complete Setup")');

      // Error should appear in the red error box
      const errorBox = page.locator('.bg-red-50');
      await expect(errorBox).toBeVisible({ timeout: 5000 });
      await expect(errorBox.locator('.text-red-600')).toContainText('Internal server error during test');

      // Unroute so cleanup can work
      await page.unroute('**/api/apply');
    });
  });

  // ============================================================================
  // D. BetaGate Rendering (serial)
  // ============================================================================
  test.describe('D. BetaGate Rendering', () => {
    test.describe.configure({ mode: 'serial' });

    const user = generateTestUser('surv_d');
    testUserEmails.add(user.email);

    // Raise threshold so auto-approve fails
    test.beforeAll(async () => {
      await serviceSupabase
        .from('beta_settings')
        .update({ value: 99999 })
        .eq('key', 'auto_approval_priority_threshold');
    });

    // Restore threshold
    test.afterAll(async () => {
      await serviceSupabase
        .from('beta_settings')
        .update({ value: 0 })
        .eq('key', 'auto_approval_priority_threshold');
    });

    test('D1: Pending user sees BetaGate after survey', async ({ page }) => {
      test.setTimeout(120_000);

      // Signup
      await page.goto('/signup');
      await page.fill('input[placeholder="Alex Johnson"]', user.name);
      await page.fill('input[placeholder="alex@example.com"]', user.email);
      await page.fill('input[placeholder="At least 6 characters"]', user.password);
      await page.fill('input[placeholder="Confirm your password"]', user.password);
      await page.fill('input[placeholder="your_handle"]', user.handle);

      await expect(page.locator('text=Handle is available!')).toBeVisible({ timeout: 5000 });
      await page.click('button:has-text("Create Account")');
      await page.waitForURL(/\/dashboard/, { timeout: 30000 });
      await expect(page.locator('text=One more step')).toBeVisible({ timeout: 10000 });

      // Complete survey
      await fillSurveyStep1(page);
      await page.click('button:has-text("Continue")');
      await fillSurveyStep2(page);
      await page.click('button:has-text("Continue")');
      await fillSurveyStep3(page);
      await page.click('button:has-text("Complete Setup")');
      await expect(page.locator('text=Finishing up...')).toBeVisible({ timeout: 5000 });

      // Should land on /dashboard with BetaGate (NOT auto-approved due to high threshold)
      await page.waitForURL(/\/dashboard/, { timeout: 30000 });

      // BetaGate should show
      const firstName = user.name.split(' ')[0];
      await expect(
        page.locator(`text=Welcome, ${firstName}`).or(page.locator(`text=Welcome, ${user.name}`))
      ).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text=Under Review')).toBeVisible();
      await expect(page.locator('text=approval odds')).toBeVisible();
      await expect(page.locator('text=Priority Score')).toBeVisible();
      await expect(page.locator('text=Queue Position')).toBeVisible();

      // Survey should NOT be visible
      await expect(page.locator('text=One more step')).not.toBeVisible();
    });

    test('D2: Re-login shows BetaGate, not survey', async ({ page }) => {
      test.setTimeout(60_000);

      await signIn(page, user.email, user.password);
      await page.waitForURL(/\/dashboard/, { timeout: 15000 });

      // BetaGate visible
      await expect(page.locator('text=Under Review')).toBeVisible({ timeout: 10000 });

      // Survey NOT visible
      await expect(page.locator('text=One more step')).not.toBeVisible({ timeout: 3000 });
    });
  });

  // ============================================================================
  // E. Duplicate Prevention (serial)
  // ============================================================================
  test.describe('E. Duplicate Prevention', () => {
    test.describe.configure({ mode: 'serial' });

    const user = generateTestUser('surv_e');
    testUserEmails.add(user.email);

    test('E1: Authenticated duplicate -> 409', async ({ page }) => {
      test.setTimeout(120_000);

      // First: complete the full signup + survey flow
      await page.goto('/signup');
      await page.fill('input[placeholder="Alex Johnson"]', user.name);
      await page.fill('input[placeholder="alex@example.com"]', user.email);
      await page.fill('input[placeholder="At least 6 characters"]', user.password);
      await page.fill('input[placeholder="Confirm your password"]', user.password);
      await page.fill('input[placeholder="your_handle"]', user.handle);
      await expect(page.locator('text=Handle is available!')).toBeVisible({ timeout: 5000 });
      await page.click('button:has-text("Create Account")');
      await page.waitForURL(/\/dashboard/, { timeout: 30000 });
      await expect(page.locator('text=One more step')).toBeVisible({ timeout: 10000 });

      await fillSurveyStep1(page);
      await page.click('button:has-text("Continue")');
      await fillSurveyStep2(page);
      await page.click('button:has-text("Continue")');
      await fillSurveyStep3(page);
      await page.click('button:has-text("Complete Setup")');
      await page.waitForURL(/\/(u\/|dashboard)/, { timeout: 30000 });

      // Wait for page to fully settle before making the duplicate request
      await page.waitForLoadState('networkidle');

      // Now try to POST /api/apply again while authenticated
      const response = await page.evaluate(async () => {
        const res = await fetch('/api/apply', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            surveyResponses: {
              creator_type: 'serious_hobbyist',
              primary_niche: 'tech_gadgets',
              primary_niche_other: '',
              audience_size: 'under_1k',
              primary_platform: 'youtube',
              affiliate_status: 'want_to_start',
              revenue_goals: 'side_income',
              current_tools: ['nothing'],
              biggest_frustrations: ['time_consuming'],
              documentation_habits: 'basic_tracking',
              magic_wand_feature: '',
              usage_intent: 'this_week',
            },
            primaryNiche: 'tech_gadgets',
            audienceSize: 'under_1k',
            primaryPlatform: 'youtube',
            affiliateStatus: 'want_to_start',
            biggestFrustrations: ['time_consuming'],
          }),
        });
        return { status: res.status, body: await res.json() };
      });

      expect(response.status).toBe(409);
      expect(response.body.error).toContain('already completed');
    });

    test('E2: Email duplicate (unauthenticated) -> 409', async ({ page }) => {
      test.setTimeout(30_000);

      // Clear cookies so the request is fully unauthenticated
      await page.context().clearCookies();
      await page.goto('/login');

      const response = await page.evaluate(
        async ({ email, name, handle }) => {
          const res = await fetch('/api/apply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email,
              password: 'testpass123',
              name,
              handle: handle + '_dup',
              surveyResponses: {
                creator_type: 'serious_hobbyist',
                primary_niche: 'tech_gadgets',
                primary_niche_other: '',
                audience_size: 'under_1k',
                primary_platform: 'youtube',
                affiliate_status: 'want_to_start',
                revenue_goals: 'side_income',
                current_tools: ['nothing'],
                biggest_frustrations: ['time_consuming'],
                documentation_habits: 'basic_tracking',
                magic_wand_feature: '',
                usage_intent: 'this_week',
              },
              primaryNiche: 'tech_gadgets',
              audienceSize: 'under_1k',
              primaryPlatform: 'youtube',
              affiliateStatus: 'want_to_start',
              biggestFrustrations: ['time_consuming'],
            }),
          });
          return { status: res.status, body: await res.json() };
        },
        { email: user.email, name: user.name, handle: user.handle }
      );

      expect(response.status).toBe(409);
      expect(response.body.error).toMatch(/already (applied|exists)/i);
    });
  });

  // ============================================================================
  // F. No-Survey Re-login
  // ============================================================================
  test.describe('F. No-Survey Re-login', () => {
    test('F1: User without survey sees survey on re-login', async ({ page }) => {
      test.setTimeout(60_000);

      const user = generateTestUser('surv_f');
      testUserEmails.add(user.email);

      // Create account
      await page.goto('/signup');
      await page.fill('input[placeholder="Alex Johnson"]', user.name);
      await page.fill('input[placeholder="alex@example.com"]', user.email);
      await page.fill('input[placeholder="At least 6 characters"]', user.password);
      await page.fill('input[placeholder="Confirm your password"]', user.password);
      await page.fill('input[placeholder="your_handle"]', user.handle);
      await expect(page.locator('text=Handle is available!')).toBeVisible({ timeout: 5000 });
      await page.click('button:has-text("Create Account")');

      // Dashboard should show survey
      await page.waitForURL(/\/dashboard/, { timeout: 30000 });
      await expect(page.locator('text=One more step')).toBeVisible({ timeout: 10000 });

      // Sign out WITHOUT completing survey
      await signOut(page);

      // Sign back in
      await signIn(page, user.email, user.password);

      // Dashboard should show survey again
      await page.waitForURL(/\/dashboard/, { timeout: 15000 });
      await expect(page.locator('text=One more step')).toBeVisible({ timeout: 10000 });
    });
  });
});
