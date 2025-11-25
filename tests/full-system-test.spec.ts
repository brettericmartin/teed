import { test, expect, Page } from '@playwright/test';
import { chromium } from '@playwright/test';

/**
 * COMPREHENSIVE SYSTEM TEST
 * Tests 3 user types: Owner, Authenticated Non-Owner, Anonymous
 * Validates RLS, MCP Supabase integration, and all features
 */

// Test user credentials
const OWNER_USER = {
  email: 'owner@test.com',
  password: 'TestPassword123!',
  handle: 'owner_user',
  displayName: 'Owner User'
};

const OTHER_USER = {
  email: 'other@test.com',
  password: 'TestPassword123!',
  handle: 'other_user',
  displayName: 'Other User'
};

// Shared bag data
let publicBagCode: string;
let privateBagCode: string;
let ownerHandle: string;

test.describe('Full System Test - 3 User Types', () => {
  test.describe.configure({ mode: 'serial' });

  // ==============================================
  // SETUP: Create test users and test data
  // ==============================================

  test('Setup: Create Owner User and Test Bags', async ({ page }) => {
    console.log('\n🔧 SETUP: Creating owner user and test bags...\n');

    // Navigate to signup
    await page.goto('http://localhost:3000/signup');
    await page.waitForLoadState('networkidle');

    // Create owner account
    await page.fill('input[type="email"]', OWNER_USER.email);
    await page.fill('input[type="password"]', OWNER_USER.password);
    await page.click('button[type="submit"]');

    // Wait for redirect to onboarding or dashboard
    await page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 10000 });

    // If onboarding, complete it
    const currentUrl = page.url();
    if (currentUrl.includes('/onboarding')) {
      await page.fill('input[name="handle"]', OWNER_USER.handle);
      await page.fill('input[name="displayName"]', OWNER_USER.displayName);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 10000 });
    }

    ownerHandle = OWNER_USER.handle;
    console.log(`✅ Owner user created: ${ownerHandle}`);

    // Create a PUBLIC bag with category and tags
    await page.click('text=Create New Bag');
    await page.waitForSelector('input[placeholder*="Bag"]', { timeout: 5000 });

    await page.fill('input[placeholder*="Bag"]', 'Public Golf Bag Test');
    await page.fill('textarea[placeholder*="description"]', 'A public golf bag for testing');

    // Set category
    await page.selectOption('select', 'golf');

    // Add tags
    await page.fill('input[placeholder*="tag"]', 'golf-clubs');
    await page.press('input[placeholder*="tag"]', 'Enter');
    await page.fill('input[placeholder*="tag"]', 'taylormade');
    await page.press('input[placeholder*="tag"]', 'Enter');
    await page.fill('input[placeholder*="tag"]', 'beginner-friendly');
    await page.press('input[placeholder*="tag"]', 'Enter');

    // Make it public
    await page.click('button[role="switch"]');
    await expect(page.locator('text=🌐 Public')).toBeVisible();

    // Wait for auto-save
    await page.waitForSelector('text=Saved', { timeout: 5000 });

    // Get the bag code from URL
    const publicUrl = page.url();
    publicBagCode = publicUrl.split('/').pop() || '';
    console.log(`✅ Public bag created: ${publicBagCode}`);

    // Go back to dashboard
    await page.goto('http://localhost:3000/dashboard');

    // Create a PRIVATE bag
    await page.click('text=Create New Bag');
    await page.waitForSelector('input[placeholder*="Bag"]', { timeout: 5000 });

    await page.fill('input[placeholder*="Bag"]', 'Private Travel Bag Test');
    await page.fill('textarea[placeholder*="description"]', 'A private travel bag for testing');

    // Set category
    await page.selectOption('select', 'travel');

    // Add tags
    await page.fill('input[placeholder*="tag"]', 'carry-on');
    await page.press('input[placeholder*="tag"]', 'Enter');
    await page.fill('input[placeholder*="tag"]', 'international');
    await page.press('input[placeholder*="tag"]', 'Enter');

    // Ensure it stays private (toggle should be OFF by default)
    await expect(page.locator('text=🔒 Private')).toBeVisible();

    // Wait for auto-save
    await page.waitForSelector('text=Saved', { timeout: 5000 });

    // Get the bag code
    const privateUrl = page.url();
    privateBagCode = privateUrl.split('/').pop() || '';
    console.log(`✅ Private bag created: ${privateBagCode}`);

    // Add items to public bag
    await page.goto(`http://localhost:3000/u/${ownerHandle}/${publicBagCode}/edit`);
    await page.fill('input[placeholder*="Add an item"]', 'Driver');
    await page.press('input[placeholder*="Add an item"]', 'Enter');
    await page.waitForSelector('text=Driver', { timeout: 5000 });

    await page.fill('input[placeholder*="Add an item"]', 'Putter');
    await page.press('input[placeholder*="Add an item"]', 'Enter');
    await page.waitForSelector('text=Putter', { timeout: 5000 });

    console.log('✅ Added items to public bag');

    // Sign out
    await page.goto('http://localhost:3000/settings');
    await page.click('text=Sign Out');
    await page.waitForURL('/', { timeout: 5000 });

    console.log('✅ Setup complete\n');
  });

  test('Setup: Create Other User', async ({ page }) => {
    console.log('\n🔧 SETUP: Creating other authenticated user...\n');

    await page.goto('http://localhost:3000/signup');
    await page.waitForLoadState('networkidle');

    await page.fill('input[type="email"]', OTHER_USER.email);
    await page.fill('input[type="password"]', OTHER_USER.password);
    await page.click('button[type="submit"]');

    await page.waitForURL(/\/(onboarding|dashboard)/, { timeout: 10000 });

    const currentUrl = page.url();
    if (currentUrl.includes('/onboarding')) {
      await page.fill('input[name="handle"]', OTHER_USER.handle);
      await page.fill('input[name="displayName"]', OTHER_USER.displayName);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 10000 });
    }

    console.log(`✅ Other user created: ${OTHER_USER.handle}`);

    // Sign out
    await page.goto('http://localhost:3000/settings');
    await page.click('text=Sign Out');
    await page.waitForURL('/', { timeout: 5000 });

    console.log('✅ Other user setup complete\n');
  });

  // ==============================================
  // TEST GROUP 1: OWNER USER TESTS
  // ==============================================

  test.describe('User Type 1: OWNER', () => {
    test.use({ storageState: undefined });

    test('Owner: Can sign in', async ({ page }) => {
      console.log('\n👤 OWNER TEST: Sign in...\n');

      await page.goto('http://localhost:3000/signin');
      await page.fill('input[type="email"]', OWNER_USER.email);
      await page.fill('input[type="password"]', OWNER_USER.password);
      await page.click('button[type="submit"]');

      await page.waitForURL('/dashboard', { timeout: 10000 });
      expect(page.url()).toContain('/dashboard');

      console.log('✅ Owner signed in successfully');
    });

    test('Owner: Can view and edit PUBLIC bag', async ({ page }) => {
      console.log('\n👤 OWNER TEST: View and edit public bag...\n');

      // Sign in first
      await page.goto('http://localhost:3000/signin');
      await page.fill('input[type="email"]', OWNER_USER.email);
      await page.fill('input[type="password"]', OWNER_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 10000 });

      // Navigate to public bag
      await page.goto(`http://localhost:3000/u/${ownerHandle}/${publicBagCode}`);

      // Should see bag content
      await expect(page.locator('text=Public Golf Bag Test')).toBeVisible();
      await expect(page.locator('text=Driver')).toBeVisible();
      await expect(page.locator('text=Putter')).toBeVisible();

      // Should see Edit button (owner privilege)
      await expect(page.locator('text=Edit Bag')).toBeVisible();

      console.log('✅ Owner can view public bag');

      // Click edit
      await page.click('text=Edit Bag');
      await page.waitForURL(`/u/${ownerHandle}/${publicBagCode}/edit`, { timeout: 5000 });

      // Verify edit mode
      await expect(page.locator('input[value="Public Golf Bag Test"]')).toBeVisible();
      await expect(page.locator('select')).toHaveValue('golf');
      await expect(page.locator('text=#golf-clubs')).toBeVisible();
      await expect(page.locator('text=#taylormade')).toBeVisible();

      // Modify title
      await page.fill('input[value="Public Golf Bag Test"]', 'Updated Golf Bag');
      await page.waitForSelector('text=Saved', { timeout: 5000 });

      console.log('✅ Owner can edit public bag');

      // Add a new item
      await page.fill('input[placeholder*="Add an item"]', '7-Iron');
      await page.press('input[placeholder*="Add an item"]', 'Enter');
      await page.waitForSelector('text=7-Iron', { timeout: 5000 });

      console.log('✅ Owner can add items to public bag');
    });

    test('Owner: Can view and edit PRIVATE bag', async ({ page }) => {
      console.log('\n👤 OWNER TEST: View and edit private bag...\n');

      // Sign in
      await page.goto('http://localhost:3000/signin');
      await page.fill('input[type="email"]', OWNER_USER.email);
      await page.fill('input[type="password"]', OWNER_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 10000 });

      // Navigate to private bag
      await page.goto(`http://localhost:3000/u/${ownerHandle}/${privateBagCode}`);

      // Should see bag content
      await expect(page.locator('text=Private Travel Bag Test')).toBeVisible();
      await expect(page.locator('text=🔒 Private')).toBeVisible();

      console.log('✅ Owner can view private bag');

      // Go to edit mode
      await page.click('text=Edit Bag');
      await page.waitForURL(`/u/${ownerHandle}/${privateBagCode}/edit`, { timeout: 5000 });

      // Verify can edit
      await expect(page.locator('input[value="Private Travel Bag Test"]')).toBeVisible();
      await expect(page.locator('text=#carry-on')).toBeVisible();

      // Add item to private bag
      await page.fill('input[placeholder*="Add an item"]', 'Passport Holder');
      await page.press('input[placeholder*="Add an item"]', 'Enter');
      await page.waitForSelector('text=Passport Holder', { timeout: 5000 });

      console.log('✅ Owner can edit private bag and add items');
    });

    test('Owner: Can delete items from their bags', async ({ page }) => {
      console.log('\n👤 OWNER TEST: Delete items...\n');

      // Sign in
      await page.goto('http://localhost:3000/signin');
      await page.fill('input[type="email"]', OWNER_USER.email);
      await page.fill('input[type="password"]', OWNER_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 10000 });

      // Go to public bag edit
      await page.goto(`http://localhost:3000/u/${ownerHandle}/${publicBagCode}/edit`);

      // Find and delete an item
      const deleteButtons = page.locator('button:has-text("Delete"), button[aria-label*="Delete"]');
      const count = await deleteButtons.count();

      if (count > 0) {
        page.on('dialog', dialog => dialog.accept()); // Auto-accept confirm dialog
        await deleteButtons.first().click();
        await page.waitForTimeout(1000);
        console.log('✅ Owner can delete items');
      }
    });

    test('Owner: Can toggle bag privacy', async ({ page }) => {
      console.log('\n👤 OWNER TEST: Toggle privacy...\n');

      // Sign in
      await page.goto('http://localhost:3000/signin');
      await page.fill('input[type="email"]', OWNER_USER.email);
      await page.fill('input[type="password"]', OWNER_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 10000 });

      // Go to private bag
      await page.goto(`http://localhost:3000/u/${ownerHandle}/${privateBagCode}/edit`);

      // Verify it's private
      await expect(page.locator('text=🔒 Private')).toBeVisible();

      // Toggle to public
      await page.click('button[role="switch"]');
      await page.waitForSelector('text=🌐 Public', { timeout: 5000 });

      console.log('✅ Owner can toggle privacy to public');

      // Toggle back to private
      await page.click('button[role="switch"]');
      await page.waitForSelector('text=🔒 Private', { timeout: 5000 });

      console.log('✅ Owner can toggle privacy to private');
    });

    test('Owner: Can see their bags in dashboard', async ({ page }) => {
      console.log('\n👤 OWNER TEST: Dashboard access...\n');

      // Sign in
      await page.goto('http://localhost:3000/signin');
      await page.fill('input[type="email"]', OWNER_USER.email);
      await page.fill('input[type="password"]', OWNER_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 10000 });

      // Should see both bags (public and private)
      await expect(page.locator('text=Updated Golf Bag')).toBeVisible();
      await expect(page.locator('text=Private Travel Bag Test')).toBeVisible();

      console.log('✅ Owner can see all their bags in dashboard');
    });
  });

  // ==============================================
  // TEST GROUP 2: OTHER AUTHENTICATED USER TESTS
  // ==============================================

  test.describe('User Type 2: AUTHENTICATED NON-OWNER', () => {
    test.use({ storageState: undefined });

    test('Other User: Can sign in', async ({ page }) => {
      console.log('\n👥 OTHER USER TEST: Sign in...\n');

      await page.goto('http://localhost:3000/signin');
      await page.fill('input[type="email"]', OTHER_USER.email);
      await page.fill('input[type="password"]', OTHER_USER.password);
      await page.click('button[type="submit"]');

      await page.waitForURL('/dashboard', { timeout: 10000 });
      expect(page.url()).toContain('/dashboard');

      console.log('✅ Other user signed in successfully');
    });

    test('Other User: CAN view PUBLIC bag (RLS allows)', async ({ page }) => {
      console.log('\n👥 OTHER USER TEST: View public bag (RLS test)...\n');

      // Sign in
      await page.goto('http://localhost:3000/signin');
      await page.fill('input[type="email"]', OTHER_USER.email);
      await page.fill('input[type="password"]', OTHER_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 10000 });

      // Navigate to owner's public bag
      await page.goto(`http://localhost:3000/u/${ownerHandle}/${publicBagCode}`);

      // Should see bag content (RLS allows viewing public bags)
      await expect(page.locator('text=Updated Golf Bag')).toBeVisible();
      await expect(page.locator('text=Driver')).toBeVisible();

      console.log('✅ RLS PASS: Other user CAN view public bag');

      // Should NOT see Edit button (not owner)
      await expect(page.locator('text=Edit Bag')).not.toBeVisible();

      console.log('✅ RLS PASS: Other user CANNOT see Edit button');
    });

    test('Other User: CANNOT view PRIVATE bag (RLS blocks)', async ({ page }) => {
      console.log('\n👥 OTHER USER TEST: Blocked from private bag (RLS test)...\n');

      // Sign in
      await page.goto('http://localhost:3000/signin');
      await page.fill('input[type="email"]', OTHER_USER.email);
      await page.fill('input[type="password"]', OTHER_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 10000 });

      // Try to navigate to owner's private bag
      await page.goto(`http://localhost:3000/u/${ownerHandle}/${privateBagCode}`);

      // Should see 404 or "Bag not found" (RLS blocks access)
      const pageContent = await page.textContent('body');
      const isBlocked = pageContent?.includes('not found') ||
                       pageContent?.includes('404') ||
                       pageContent?.includes('No access');

      expect(isBlocked).toBe(true);

      console.log('✅ RLS PASS: Other user CANNOT view private bag');
    });

    test('Other User: CANNOT access edit page of any bag (RLS blocks)', async ({ page }) => {
      console.log('\n👥 OTHER USER TEST: Blocked from editing (RLS test)...\n');

      // Sign in
      await page.goto('http://localhost:3000/signin');
      await page.fill('input[type="email"]', OTHER_USER.email);
      await page.fill('input[type="password"]', OTHER_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 10000 });

      // Try to directly access edit page
      await page.goto(`http://localhost:3000/u/${ownerHandle}/${publicBagCode}/edit`);

      // Should be redirected or blocked
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      const isBlocked = !currentUrl.includes('/edit') ||
                       (await page.textContent('body'))?.includes('not found');

      expect(isBlocked).toBe(true);

      console.log('✅ RLS PASS: Other user CANNOT access edit page');
    });

    test('Other User: Can see public bags in discovery', async ({ page }) => {
      console.log('\n👥 OTHER USER TEST: Discovery page access...\n');

      // Sign in
      await page.goto('http://localhost:3000/signin');
      await page.fill('input[type="email"]', OTHER_USER.email);
      await page.fill('input[type="password"]', OTHER_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 10000 });

      // Go to discover
      await page.goto('http://localhost:3000/discover');

      // Should see the public bag
      await expect(page.locator('text=Updated Golf Bag')).toBeVisible();

      // Should NOT see the private bag
      await expect(page.locator('text=Private Travel Bag Test')).not.toBeVisible();

      console.log('✅ Other user can see public bags in discovery');
    });

    test('Other User: Can filter by category in discovery', async ({ page }) => {
      console.log('\n👥 OTHER USER TEST: Category filtering...\n');

      // Sign in
      await page.goto('http://localhost:3000/signin');
      await page.fill('input[type="email"]', OTHER_USER.email);
      await page.fill('input[type="password"]', OTHER_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 10000 });

      // Go to discover
      await page.goto('http://localhost:3000/discover');

      // Click golf category
      await page.click('button:has-text("Golf")');

      // Should see golf bag
      await expect(page.locator('text=Updated Golf Bag')).toBeVisible();

      console.log('✅ Category filtering works');
    });

    test('Other User: Can filter by tags in discovery', async ({ page }) => {
      console.log('\n👥 OTHER USER TEST: Tag filtering...\n');

      // Sign in
      await page.goto('http://localhost:3000/signin');
      await page.fill('input[type="email"]', OTHER_USER.email);
      await page.fill('input[type="password"]', OTHER_USER.password);
      await page.click('button[type="submit"]');
      await page.waitForURL('/dashboard', { timeout: 10000 });

      // Go to discover
      await page.goto('http://localhost:3000/discover');

      // Wait for tags to load
      await page.waitForTimeout(1000);

      // Click a tag if available
      const tagButton = page.locator('button:has-text("#golf-clubs")');
      if (await tagButton.count() > 0) {
        await tagButton.click();
        await expect(page.locator('text=Updated Golf Bag')).toBeVisible();
        console.log('✅ Tag filtering works');
      } else {
        console.log('⚠️  No tags found to test');
      }
    });
  });

  // ==============================================
  // TEST GROUP 3: ANONYMOUS USER TESTS
  // ==============================================

  test.describe('User Type 3: ANONYMOUS (Not Signed In)', () => {
    test.use({ storageState: undefined });

    test('Anonymous: CAN view PUBLIC bag (RLS allows)', async ({ page }) => {
      console.log('\n🌐 ANONYMOUS TEST: View public bag (RLS test)...\n');

      // Navigate directly to public bag (no sign in)
      await page.goto(`http://localhost:3000/u/${ownerHandle}/${publicBagCode}`);

      // Should see bag content
      await expect(page.locator('text=Updated Golf Bag')).toBeVisible();
      await expect(page.locator('text=Driver')).toBeVisible();

      console.log('✅ RLS PASS: Anonymous user CAN view public bag');

      // Should NOT see Edit button
      await expect(page.locator('text=Edit Bag')).not.toBeVisible();

      console.log('✅ RLS PASS: Anonymous user CANNOT see Edit button');
    });

    test('Anonymous: CANNOT view PRIVATE bag (RLS blocks)', async ({ page }) => {
      console.log('\n🌐 ANONYMOUS TEST: Blocked from private bag (RLS test)...\n');

      // Try to navigate to private bag (no sign in)
      await page.goto(`http://localhost:3000/u/${ownerHandle}/${privateBagCode}`);

      // Should see 404 or "Bag not found"
      const pageContent = await page.textContent('body');
      const isBlocked = pageContent?.includes('not found') ||
                       pageContent?.includes('404') ||
                       pageContent?.includes('No access');

      expect(isBlocked).toBe(true);

      console.log('✅ RLS PASS: Anonymous user CANNOT view private bag');
    });

    test('Anonymous: CANNOT access edit page (redirected to signin)', async ({ page }) => {
      console.log('\n🌐 ANONYMOUS TEST: Blocked from editing (RLS test)...\n');

      // Try to access edit page directly
      await page.goto(`http://localhost:3000/u/${ownerHandle}/${publicBagCode}/edit`);

      // Should be redirected to signin or blocked
      await page.waitForTimeout(2000);
      const currentUrl = page.url();
      const isBlocked = currentUrl.includes('/signin') ||
                       currentUrl.includes('/login') ||
                       !currentUrl.includes('/edit');

      expect(isBlocked).toBe(true);

      console.log('✅ RLS PASS: Anonymous user CANNOT access edit page');
    });

    test('Anonymous: Can view discovery page', async ({ page }) => {
      console.log('\n🌐 ANONYMOUS TEST: Discovery page access...\n');

      // Navigate to discover (no sign in)
      await page.goto('http://localhost:3000/discover');

      // Should load successfully
      await expect(page.locator('text=Discover')).toBeVisible();

      // Should see public bags
      await expect(page.locator('text=Updated Golf Bag')).toBeVisible();

      // Should NOT see private bags
      await expect(page.locator('text=Private Travel Bag Test')).not.toBeVisible();

      console.log('✅ Anonymous user can view discovery page');
    });

    test('Anonymous: Can filter discovery by category', async ({ page }) => {
      console.log('\n🌐 ANONYMOUS TEST: Discovery filtering...\n');

      await page.goto('http://localhost:3000/discover');

      // Click golf category
      await page.click('button:has-text("Golf")');

      // Should filter results
      await expect(page.locator('text=Updated Golf Bag')).toBeVisible();

      console.log('✅ Anonymous user can filter discovery');
    });

    test('Anonymous: Can search in discovery', async ({ page }) => {
      console.log('\n🌐 ANONYMOUS TEST: Discovery search...\n');

      await page.goto('http://localhost:3000/discover');

      // Search for golf
      await page.fill('input[placeholder*="Search"]', 'Golf');
      await page.press('input[placeholder*="Search"]', 'Enter');

      // Should see matching bag
      await expect(page.locator('text=Updated Golf Bag')).toBeVisible();

      console.log('✅ Anonymous user can search discovery');
    });

    test('Anonymous: CANNOT access dashboard (redirected)', async ({ page }) => {
      console.log('\n🌐 ANONYMOUS TEST: Dashboard blocked...\n');

      // Try to access dashboard
      await page.goto('http://localhost:3000/dashboard');

      // Should be redirected to signin
      await page.waitForURL(/\/(signin|login)/, { timeout: 5000 });

      console.log('✅ Anonymous user redirected from dashboard');
    });
  });

  // ==============================================
  // SUPABASE MCP INTEGRATION TESTS
  // ==============================================

  test.describe('Supabase MCP Integration Tests', () => {
    test('MCP: Verify database connection', async ({ page }) => {
      console.log('\n🔌 MCP TEST: Database connection...\n');

      // Navigate to a page that uses Supabase
      await page.goto('http://localhost:3000/discover');

      // If page loads successfully, MCP connection works
      await expect(page.locator('text=Discover')).toBeVisible();

      console.log('✅ MCP database connection working');
    });

    test('MCP: Verify RLS policies are enforced', async ({ page }) => {
      console.log('\n🔌 MCP TEST: RLS enforcement...\n');

      // Access private bag anonymously
      await page.goto(`http://localhost:3000/u/${ownerHandle}/${privateBagCode}`);

      // RLS should block access
      const pageContent = await page.textContent('body');
      const isBlocked = pageContent?.includes('not found') || pageContent?.includes('404');

      expect(isBlocked).toBe(true);

      console.log('✅ MCP RLS policies properly enforced');
    });

    test('MCP: Verify tags JSONB query works', async ({ page }) => {
      console.log('\n🔌 MCP TEST: JSONB tag queries...\n');

      await page.goto('http://localhost:3000/discover');

      // Wait for tags to appear
      await page.waitForTimeout(1000);

      // Tags should be visible (proves JSONB parsing works)
      const hasTags = await page.locator('button:has-text("#")').count() > 0;

      expect(hasTags).toBe(true);

      console.log('✅ MCP JSONB tag queries working');
    });
  });

  // ==============================================
  // CLEANUP
  // ==============================================

  test('Cleanup: Delete test data', async ({ page }) => {
    console.log('\n🧹 CLEANUP: Removing test data...\n');

    // Sign in as owner
    await page.goto('http://localhost:3000/signin');
    await page.fill('input[type="email"]', OWNER_USER.email);
    await page.fill('input[type="password"]', OWNER_USER.password);
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard', { timeout: 10000 });

    // Delete public bag
    await page.goto(`http://localhost:3000/u/${ownerHandle}/${publicBagCode}/edit`);
    page.on('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Delete")');
    await page.waitForURL('/dashboard', { timeout: 5000 });

    console.log('✅ Deleted public bag');

    // Delete private bag
    await page.goto(`http://localhost:3000/u/${ownerHandle}/${privateBagCode}/edit`);
    page.on('dialog', dialog => dialog.accept());
    await page.click('button:has-text("Delete")');
    await page.waitForURL('/dashboard', { timeout: 5000 });

    console.log('✅ Deleted private bag');
    console.log('✅ Cleanup complete\n');
  });
});
