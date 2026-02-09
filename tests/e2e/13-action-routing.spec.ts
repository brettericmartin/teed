import { test, expect, Page } from '@playwright/test';
import { login, TEST_USER } from './utils/auth';
import { createBag, deleteBag, randomBagData } from './utils/testData';

/**
 * Action Routing Tests
 *
 * Verifies that every user action entry point navigates to the correct
 * destination and produces the expected UI. This catches routing bugs
 * like dead-end redirects, dropped query params, and broken callbacks.
 *
 * Reference: docs/testing/ACTION_ROUTING_REFERENCE.md
 */

test.setTimeout(60000);
test.describe.configure({ mode: 'serial' });

const PROFILE_PATH = `/u/${TEST_USER.handle}`;

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);
}

/** Expand the ProfileActionBar if it's in collapsed (pill) state */
async function expandActionBar(page: Page) {
  // The collapsed state is a small round button with a "+" icon
  // The expanded state has "Add", "Customize", "Stats" buttons
  const addButton = page.locator('button:has-text("Add")').first();
  const isExpanded = await addButton.isVisible().catch(() => false);

  if (!isExpanded) {
    // Click the collapsed pill to expand
    const collapsedPill = page.locator('button:has(svg.lucide-plus)').first();
    if (await collapsedPill.isVisible()) {
      await collapsedPill.click();
      await page.waitForTimeout(400);
    }
  }
}

/** Open the ProfileActionBar "Add" menu */
async function openAddMenu(page: Page) {
  await expandActionBar(page);
  const addButton = page.locator('button:has-text("Add")').first();
  await expect(addButton).toBeVisible({ timeout: 5000 });
  await addButton.click();
  await page.waitForTimeout(300);
}

// ---------------------------------------------------------------------------
// 1. ProfileActionBar routing (profile page, owner view)
// ---------------------------------------------------------------------------

test.describe('ProfileActionBar > Add menu routing', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await login(page);
    await page.goto(PROFILE_PATH);
    await waitForPageLoad(page);
  });

  test('New Bag navigates to /bags/new', async ({ page }) => {
    await openAddMenu(page);

    // Click "New Bag"
    await page.locator('text=New Bag').click();

    // Should navigate to the standalone bag creation page
    await page.waitForURL('**/bags/new', { timeout: 10000 });
    expect(page.url()).toContain('/bags/new');

    // The creation form should be visible
    await expect(page.locator('text=Create a New Bag, text=Create New Bag')).toBeVisible({ timeout: 5000 });
  });

  test('Add Block opens BlockPicker modal', async ({ page }) => {
    await openAddMenu(page);

    await page.locator('text=Add Block').click();
    await page.waitForTimeout(500);

    // Should stay on same page (no navigation)
    expect(page.url()).toContain(PROFILE_PATH);

    // BlockPicker modal should be visible
    await expect(
      page.locator('text=Add a Panel, text=Choose a panel, text=Add Panel')
    ).toBeVisible({ timeout: 5000 });
  });

  test('Add Link opens UniversalLinkAdder modal', async ({ page }) => {
    await openAddMenu(page);

    await page.locator('text=Add Link').click();
    await page.waitForTimeout(500);

    // Should stay on same page
    expect(page.url()).toContain(PROFILE_PATH);

    // Link adder modal should be visible
    await expect(
      page.locator('text=Add Link, text=Paste a link, text=Analyze').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Social Links opens AddSocialFlow modal', async ({ page }) => {
    await openAddMenu(page);

    await page.locator('text=Social Links').click();
    await page.waitForTimeout(500);

    // Should stay on same page
    expect(page.url()).toContain(PROFILE_PATH);

    // Social flow should be visible
    await expect(
      page.locator('text=Social, text=Connect, text=Instagram, text=Twitter').first()
    ).toBeVisible({ timeout: 5000 });
  });

  test('Stats navigates to stats page', async ({ page }) => {
    await expandActionBar(page);

    const statsButton = page.locator('button:has-text("Stats")').first();
    await expect(statsButton).toBeVisible();
    await statsButton.click();

    await page.waitForURL('**/stats', { timeout: 10000 });
    expect(page.url()).toContain('/stats');
  });
});

test.describe('ProfileActionBar > Customize menu routing', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await login(page);
    await page.goto(PROFILE_PATH);
    await waitForPageLoad(page);
  });

  test('Theme & Colors opens ThemeEditor modal', async ({ page }) => {
    await expandActionBar(page);

    const customizeButton = page.locator('button:has-text("Customize")').first();
    await expect(customizeButton).toBeVisible();
    await customizeButton.click();
    await page.waitForTimeout(300);

    await page.locator('text=Theme & Colors').click();
    await page.waitForTimeout(500);

    // Should stay on same page
    expect(page.url()).toContain(PROFILE_PATH);

    // Theme editor should be visible
    await expect(
      page.locator('text=Theme, text=Colors, text=Font').first()
    ).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// 2. /bags/new — Bag creation flow
// ---------------------------------------------------------------------------

test.describe('Bag creation page (/bags/new)', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await login(page);
  });

  test('loads creation form', async ({ page }) => {
    await page.goto('/bags/new');
    await waitForPageLoad(page);

    // Form elements should be present
    await expect(page.locator('text=Create a New Bag, text=Create New Bag')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('input#title, input[placeholder*="Golf"], input[placeholder*="curating"]')).toBeVisible();
    await expect(page.locator('button:has-text("Create")')).toBeVisible();
  });

  test('creates bag and navigates to editor', async ({ page }) => {
    await page.goto('/bags/new');
    await waitForPageLoad(page);

    const bagTitle = `Action Route Test ${Date.now()}`;

    // Fill title
    await page.fill('input#title, input[placeholder*="Golf"], input[placeholder*="curating"]', bagTitle);

    // Submit
    await page.click('button:has-text("Create")');

    // Should navigate to bag editor: /u/{handle}/{code}/edit
    await page.waitForURL(/\/u\/[^/]+\/[^/]+\/edit/, { timeout: 15000 });
    expect(page.url()).toMatch(/\/u\/[^/]+\/[^/]+\/edit/);

    // Clean up — extract code from URL and delete
    const match = page.url().match(/\/u\/[^/]+\/([^/]+)\/edit/);
    if (match) {
      await deleteBag(page, match[1]);
    }
  });

  test('pre-fills URL from query param', async ({ page }) => {
    const testUrl = 'https://www.amazon.com/dp/B0TEST123';
    await page.goto(`/bags/new?url=${encodeURIComponent(testUrl)}`);
    await waitForPageLoad(page);

    // Quick start URL should be pre-filled
    const urlInput = page.locator('input#quickStartUrl, input[placeholder*="amazon"]');
    await expect(urlInput).toHaveValue(testUrl, { timeout: 5000 });

    // Classification feedback should appear
    await expect(page.locator('text=detected')).toBeVisible({ timeout: 5000 });
  });

  test('close button goes back', async ({ page }) => {
    // Navigate to profile first so there's history
    await page.goto(PROFILE_PATH);
    await waitForPageLoad(page);

    await page.goto('/bags/new');
    await waitForPageLoad(page);

    // Click close
    await page.locator('button[aria-label="Close"], button:has(svg.lucide-x)').first().click();

    // Should go back (to profile, since that was previous page)
    await page.waitForTimeout(1000);
    expect(page.url()).not.toContain('/bags/new');
  });

  test('redirects to /login when unauthenticated', async ({ page }) => {
    // Clear auth state
    await page.context().clearCookies();
    await page.context().clearPermissions();

    await page.goto('/bags/new');

    // Should redirect to login
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });
});

// ---------------------------------------------------------------------------
// 3. /dashboard redirect behavior
// ---------------------------------------------------------------------------

test.describe('Dashboard redirect', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await login(page);
  });

  test('redirects authenticated user to /u/{handle}', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForTimeout(2000);

    // Should have redirected away from /dashboard
    const url = page.url();
    expect(url).toContain('/u/');
    expect(url).not.toMatch(/\/dashboard$/);
  });

  test('preserves ?welcome=true param through redirect', async ({ page }) => {
    await page.goto('/dashboard?welcome=true');
    await page.waitForTimeout(2000);

    // Should end up on profile with welcome param
    const url = page.url();
    expect(url).toContain('/u/');
    expect(url).toContain('welcome=true');
  });

  test('drops unknown query params through redirect', async ({ page }) => {
    await page.goto('/dashboard?action=new-bag&foo=bar');
    await page.waitForTimeout(2000);

    // Should end up on profile WITHOUT the extra params
    const url = page.url();
    expect(url).toContain('/u/');
    expect(url).not.toContain('action=new-bag');
    expect(url).not.toContain('foo=bar');
  });

  test('redirects unauthenticated user to /login', async ({ page }) => {
    await page.context().clearCookies();
    await page.context().clearPermissions();

    await page.goto('/dashboard');
    await page.waitForURL('**/login', { timeout: 10000 });
    expect(page.url()).toContain('/login');
  });
});

// ---------------------------------------------------------------------------
// 4. Profile deep-link params
// ---------------------------------------------------------------------------

test.describe('Profile deep-link params', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await login(page);
  });

  test('?action=block opens BlockPicker', async ({ page }) => {
    await page.goto(`${PROFILE_PATH}?edit=true&action=block`);
    await waitForPageLoad(page);

    // BlockPicker should auto-open
    await expect(
      page.locator('text=Add a Panel, text=Choose a panel, text=Add Panel')
    ).toBeVisible({ timeout: 10000 });
  });

  test('?action=link opens UniversalLinkAdder', async ({ page }) => {
    await page.goto(`${PROFILE_PATH}?edit=true&action=link`);
    await waitForPageLoad(page);

    // Link adder should auto-open
    await expect(
      page.locator('text=Add Link, text=Paste a link, text=Analyze').first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('?action=social opens AddSocialFlow', async ({ page }) => {
    await page.goto(`${PROFILE_PATH}?edit=true&action=social`);
    await waitForPageLoad(page);

    // Social flow should auto-open
    await expect(
      page.locator('text=Social, text=Connect, text=Instagram, text=Twitter').first()
    ).toBeVisible({ timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// 5. CommandPalette routing (Cmd+K)
// ---------------------------------------------------------------------------

test.describe('CommandPalette routing', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await login(page);
    await page.goto(PROFILE_PATH);
    await waitForPageLoad(page);
  });

  test('Cmd+K opens, "Create New Bag" navigates to /bags/new', async ({ page }) => {
    // Open command palette
    await page.keyboard.press('Meta+k');
    await page.waitForTimeout(500);

    // If Meta+K didn't work (Linux), try Ctrl+K
    const paletteVisible = await page.locator('text=Search or paste').isVisible().catch(() => false);
    if (!paletteVisible) {
      await page.keyboard.press('Control+k');
      await page.waitForTimeout(500);
    }

    // Click "Create New Bag"
    const createBagOption = page.locator('button:has-text("Create New Bag")').first();
    if (await createBagOption.isVisible()) {
      await createBagOption.click();

      await page.waitForURL('**/bags/new', { timeout: 10000 });
      expect(page.url()).toContain('/bags/new');
    }
  });

  test('Escape closes CommandPalette', async ({ page }) => {
    await page.keyboard.press('Control+k');
    await page.waitForTimeout(500);

    const palette = page.locator('text=Search or paste');
    if (await palette.isVisible()) {
      await page.keyboard.press('Escape');
      await page.waitForTimeout(300);
      await expect(palette).not.toBeVisible();
    }
  });
});

// ---------------------------------------------------------------------------
// 6. Bag editor routing
// ---------------------------------------------------------------------------

test.describe('Bag editor routing', () => {
  let bagCode: string;

  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await login(page);
    const { code } = await createBag(page, randomBagData());
    bagCode = code;
  });

  test.afterEach(async ({ page }) => {
    if (bagCode) {
      try {
        await deleteBag(page, bagCode);
      } catch {
        // Best effort cleanup
      }
    }
  });

  test('bag editor loads at /u/{handle}/{code}/edit', async ({ page }) => {
    await page.goto(`/u/${TEST_USER.handle}/${bagCode}/edit`);
    await waitForPageLoad(page);

    // Should be on the editor
    expect(page.url()).toContain(`/${bagCode}/edit`);

    // Editor controls should be visible
    await expect(
      page.locator('text=Add Item, button:has-text("Add Item")').first()
    ).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// 7. Modal dismiss behavior (cross-cutting)
// ---------------------------------------------------------------------------

test.describe('Modal dismiss behavior', () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await login(page);
    await page.goto(PROFILE_PATH);
    await waitForPageLoad(page);
  });

  test('Add menu closes on backdrop click', async ({ page }) => {
    await openAddMenu(page);

    // Menu should be visible
    await expect(page.locator('text=New Bag')).toBeVisible();

    // Click backdrop
    const backdrop = page.locator('[class*="backdrop"], [class*="bg-black"]').first();
    if (await backdrop.isVisible()) {
      await backdrop.click({ position: { x: 10, y: 10 } });
      await page.waitForTimeout(400);

      // Menu should close
      await expect(page.locator('text=New Bag')).not.toBeVisible();
    }
  });
});
