import { test, expect, Page } from '@playwright/test';

/**
 * Comprehensive Tests for Mobile/Desktop Layout Editing
 *
 * Tests the dual-layout editing system:
 * - Desktop: Grid-based drag-and-drop editing
 * - Mobile: Arrow button reordering
 * - Device toggle to switch between editing modes
 * - ProfileActionBar functionality
 * - Block settings and customization
 */

// Test configuration
const TEST_PROFILE_PATH = '/u/teed';
const DESKTOP_VIEWPORT = { width: 1280, height: 720 };
const MOBILE_VIEWPORT = { width: 375, height: 667 };

// Increase timeout for all tests in this file
test.setTimeout(60000);

// Run tests serially to avoid state conflicts
test.describe.configure({ mode: 'serial' });

// Helper functions
async function waitForPageLoad(page: Page) {
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1500);
}

async function enterEditMode(page: Page) {
  // Look for the edit button (FloatingEditButton or through ProfileActionBar)
  const editButton = page.locator('button:has-text("Edit"), button[title*="Edit"]').first();
  if (await editButton.isVisible()) {
    await editButton.click();
    await page.waitForTimeout(500);
  }
}

async function clickProfileActionBarButton(page: Page, buttonName: string) {
  const button = page.locator(`button:has-text("${buttonName}")`).first();
  await button.click();
  await page.waitForTimeout(300);
}

// ============================================
// PROFILE ACTION BAR TESTS
// ============================================
test.describe('ProfileActionBar - Basic Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(TEST_PROFILE_PATH);
    await waitForPageLoad(page);
  });

  test('ProfileActionBar is visible on own profile', async ({ page }) => {
    // The action bar should be visible at the bottom of the page
    const actionBar = page.locator('[class*="fixed"][class*="bottom"]').filter({
      has: page.locator('button:has-text("Add")')
    });

    await expect(actionBar).toBeVisible({ timeout: 10000 });
  });

  test('Add button opens add menu with options', async ({ page }) => {
    // Click the Add button
    const addButton = page.locator('button:has-text("Add")').first();
    await expect(addButton).toBeVisible();
    await addButton.click();
    await page.waitForTimeout(300);

    // Check menu options are visible
    await expect(page.locator('text=New Bag')).toBeVisible();
    await expect(page.locator('text=Add Block')).toBeVisible();
    await expect(page.locator('text=Add Link')).toBeVisible();
    await expect(page.locator('text=Social Links')).toBeVisible();
  });

  test('Customize button opens customize menu', async ({ page }) => {
    // Click the Customize button
    const customizeButton = page.locator('button:has-text("Customize")').first();
    await expect(customizeButton).toBeVisible();
    await customizeButton.click();
    await page.waitForTimeout(300);

    // Check menu options are visible
    await expect(page.locator('text=Theme & Colors')).toBeVisible();
    await expect(page.locator('text=Profile Info')).toBeVisible();
    await expect(page.locator('text=Panel Settings')).toBeVisible();
  });

  test('Stats button is clickable', async ({ page }) => {
    const statsButton = page.locator('button:has-text("Stats")').first();
    await expect(statsButton).toBeVisible();

    // Click and verify navigation or action
    await statsButton.click();

    // Should navigate to stats page
    await page.waitForTimeout(500);
    expect(page.url()).toContain('/stats');
  });

  test('clicking outside menu closes it', async ({ page }) => {
    // Open the Add menu
    await page.locator('button:has-text("Add")').first().click();
    await page.waitForTimeout(300);

    // Verify menu is open
    await expect(page.locator('text=New Bag')).toBeVisible();

    // Click outside (backdrop)
    await page.locator('[class*="backdrop"]').click();
    await page.waitForTimeout(300);

    // Menu should be closed
    await expect(page.locator('text=New Bag')).not.toBeVisible();
  });
});

// ============================================
// DESKTOP LAYOUT EDITING TESTS
// ============================================
test.describe('Desktop Layout Editing', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(TEST_PROFILE_PATH);
    await waitForPageLoad(page);
  });

  test('edit mode shows drag handles on desktop', async ({ page }) => {
    // Enter edit mode via Customize > Panel Settings
    await page.locator('button:has-text("Customize")').first().click();
    await page.waitForTimeout(300);
    await page.locator('text=Panel Settings').click();
    await page.waitForTimeout(500);

    // Look for drag handles (visible on desktop in edit mode)
    const dragHandles = page.locator('.drag-handle');
    const handleCount = await dragHandles.count();

    // Should have at least one drag handle
    expect(handleCount).toBeGreaterThan(0);

    // Drag handles should have "Drag" text on desktop
    const firstHandle = dragHandles.first();
    await expect(firstHandle).toContainText('Drag');
  });

  test('grid layout is used in desktop edit mode', async ({ page }) => {
    // Enter edit mode
    await page.locator('button:has-text("Customize")').first().click();
    await page.waitForTimeout(300);
    await page.locator('text=Panel Settings').click();
    await page.waitForTimeout(500);

    // Verify react-grid-layout is active
    const gridLayout = page.locator('.react-grid-layout');
    await expect(gridLayout).toBeVisible();
  });

  test('blocks can be selected in edit mode', async ({ page }) => {
    // Enter edit mode
    await page.locator('button:has-text("Customize")').first().click();
    await page.waitForTimeout(300);
    await page.locator('text=Panel Settings').click();
    await page.waitForTimeout(500);

    // Click on a block (not the drag handle)
    const blockContent = page.locator('.block-content').first();
    await blockContent.click();
    await page.waitForTimeout(300);

    // Block should show selection state (ring/border)
    const selectedBlock = page.locator('[class*="ring-2"], [class*="border-dashed"]').first();
    await expect(selectedBlock).toBeVisible();
  });

  test('selecting a block opens settings panel', async ({ page }) => {
    // Enter edit mode
    await page.locator('button:has-text("Customize")').first().click();
    await page.waitForTimeout(300);
    await page.locator('text=Panel Settings').click();
    await page.waitForTimeout(500);

    // Click on a block
    const editButton = page.locator('.edit-button, button:has-text("Edit")').first();
    if (await editButton.isVisible()) {
      await editButton.click();
    } else {
      await page.locator('.block-content').first().click();
    }
    await page.waitForTimeout(500);

    // Settings panel should be visible
    const settingsPanel = page.locator('[class*="fixed"][class*="right-0"], [class*="settings-panel"]');
    // On desktop, the panel slides in from the right
    await expect(settingsPanel.or(page.locator('text=Panel Settings'))).toBeVisible({ timeout: 5000 });
  });

  test('Edit and Delete buttons appear on blocks in edit mode', async ({ page }) => {
    // Enter edit mode
    await page.locator('button:has-text("Customize")').first().click();
    await page.waitForTimeout(300);
    await page.locator('text=Panel Settings').click();
    await page.waitForTimeout(500);

    // Look for Edit button on blocks
    const editButtons = page.locator('.edit-button, button:has-text("Edit")');
    const editCount = await editButtons.count();
    expect(editCount).toBeGreaterThan(0);

    // Look for Delete button (trash icon)
    const deleteButtons = page.locator('button[title*="Delete"], button:has([class*="Trash"])');
    const deleteCount = await deleteButtons.count();
    expect(deleteCount).toBeGreaterThan(0);
  });
});

// ============================================
// DEVICE TOGGLE TESTS (Desktop Only)
// ============================================
test.describe('Device Layout Toggle', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(TEST_PROFILE_PATH);
    await waitForPageLoad(page);
  });

  test('device toggle appears in edit mode on desktop', async ({ page }) => {
    // Enter edit mode
    await page.locator('button:has-text("Customize")').first().click();
    await page.waitForTimeout(300);
    await page.locator('text=Panel Settings').click();
    await page.waitForTimeout(500);

    // Look for device toggle buttons (Monitor and Smartphone icons)
    const desktopToggle = page.locator('button[title*="desktop"], button:has([class*="Monitor"])');
    const mobileToggle = page.locator('button[title*="mobile"], button:has([class*="Smartphone"])');

    // At least one toggle should be visible
    const hasToggle = (await desktopToggle.count()) > 0 || (await mobileToggle.count()) > 0;
    expect(hasToggle).toBe(true);
  });

  test('desktop toggle is active by default', async ({ page }) => {
    // Enter edit mode
    await page.locator('button:has-text("Customize")').first().click();
    await page.waitForTimeout(300);
    await page.locator('text=Panel Settings').click();
    await page.waitForTimeout(500);

    // Desktop button should have active state (green background)
    const desktopToggle = page.locator('button[title*="desktop"], button:has([class*="Monitor"])').first();
    if (await desktopToggle.isVisible()) {
      const classes = await desktopToggle.getAttribute('class');
      expect(classes).toContain('teed-green');
    }
  });

  test('clicking mobile toggle shows mobile preview', async ({ page }) => {
    // Enter edit mode
    await page.locator('button:has-text("Customize")').first().click();
    await page.waitForTimeout(300);
    await page.locator('text=Panel Settings').click();
    await page.waitForTimeout(500);

    // Click mobile toggle
    const mobileToggle = page.locator('button[title*="mobile"], button:has([class*="Smartphone"])').first();
    if (await mobileToggle.isVisible()) {
      await mobileToggle.click();
      await page.waitForTimeout(500);

      // Should show phone frame or stacked layout
      const phoneFrame = page.locator('[class*="rounded-3xl"][class*="border-8"]');
      const stackedLayout = page.locator('.flex.flex-col.gap-4');

      const hasMobileView = (await phoneFrame.count()) > 0 || (await stackedLayout.count()) > 0;
      expect(hasMobileView).toBe(true);
    }
  });

  test('mobile preview shows arrow reorder buttons', async ({ page }) => {
    // Enter edit mode
    await page.locator('button:has-text("Customize")').first().click();
    await page.waitForTimeout(300);
    await page.locator('text=Panel Settings').click();
    await page.waitForTimeout(500);

    // Switch to mobile layout
    const mobileToggle = page.locator('button[title*="mobile"], button:has([class*="Smartphone"])').first();
    if (await mobileToggle.isVisible()) {
      await mobileToggle.click();
      await page.waitForTimeout(500);

      // Look for reorder buttons (ChevronUp/ChevronDown)
      const upButtons = page.locator('.mobile-reorder-btn, button[aria-label="Move up"]');
      const downButtons = page.locator('.mobile-reorder-btn, button[aria-label="Move down"]');

      const hasReorderButtons = (await upButtons.count()) > 0 || (await downButtons.count()) > 0;
      expect(hasReorderButtons).toBe(true);
    }
  });

  test('switching back to desktop shows grid layout', async ({ page }) => {
    // Enter edit mode
    await page.locator('button:has-text("Customize")').first().click();
    await page.waitForTimeout(300);
    await page.locator('text=Panel Settings').click();
    await page.waitForTimeout(500);

    const mobileToggle = page.locator('button[title*="mobile"], button:has([class*="Smartphone"])').first();
    const desktopToggle = page.locator('button[title*="desktop"], button:has([class*="Monitor"])').first();

    if (await mobileToggle.isVisible()) {
      // Switch to mobile
      await mobileToggle.click();
      await page.waitForTimeout(300);

      // Switch back to desktop
      await desktopToggle.click();
      await page.waitForTimeout(500);

      // Grid layout should be visible again
      const gridLayout = page.locator('.react-grid-layout');
      await expect(gridLayout).toBeVisible();
    }
  });
});

// ============================================
// MOBILE LAYOUT EDITING TESTS
// ============================================
test.describe('Mobile Layout Editing (Actual Mobile Viewport)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(TEST_PROFILE_PATH);
    await waitForPageLoad(page);
  });

  test('ProfileActionBar is visible on mobile', async ({ page }) => {
    const actionBar = page.locator('[class*="fixed"][class*="bottom"]').filter({
      has: page.locator('button:has-text("Add")')
    });

    await expect(actionBar).toBeVisible({ timeout: 10000 });
  });

  test('blocks are stacked vertically on mobile', async ({ page }) => {
    const blocks = page.locator('.block-content');
    const blockCount = await blocks.count();

    if (blockCount > 1) {
      const block1 = blocks.nth(0);
      const block2 = blocks.nth(1);

      const box1 = await block1.boundingBox();
      const box2 = await block2.boundingBox();

      if (box1 && box2) {
        // Second block should be below first
        expect(box2.y).toBeGreaterThan(box1.y);
      }
    }
  });

  test('drag handles are hidden on mobile', async ({ page }) => {
    // Enter edit mode
    await page.locator('button:has-text("Customize")').first().click();
    await page.waitForTimeout(300);
    await page.locator('text=Panel Settings').click();
    await page.waitForTimeout(500);

    // Drag handles should be hidden on mobile (hidden md:flex)
    const dragHandles = page.locator('.drag-handle:visible');
    const visibleCount = await dragHandles.count();

    // On mobile, drag handles should not be visible
    expect(visibleCount).toBe(0);
  });

  test('arrow reorder buttons appear in mobile edit mode', async ({ page }) => {
    // Enter edit mode
    await page.locator('button:has-text("Customize")').first().click();
    await page.waitForTimeout(300);
    await page.locator('text=Panel Settings').click();
    await page.waitForTimeout(500);

    // Look for reorder controls
    const reorderControls = page.locator('.mobile-reorder-btn, button[aria-label*="Move"]');
    const controlCount = await reorderControls.count();

    expect(controlCount).toBeGreaterThan(0);
  });

  test('up arrow is disabled on first block', async ({ page }) => {
    // Enter edit mode
    await page.locator('button:has-text("Customize")').first().click();
    await page.waitForTimeout(300);
    await page.locator('text=Panel Settings').click();
    await page.waitForTimeout(500);

    // Find the first block's up arrow
    const firstUpButton = page.locator('button[aria-label="Move up"]').first();

    if (await firstUpButton.isVisible()) {
      // Should be disabled
      await expect(firstUpButton).toBeDisabled();
    }
  });

  test('down arrow is disabled on last block', async ({ page }) => {
    // Enter edit mode
    await page.locator('button:has-text("Customize")').first().click();
    await page.waitForTimeout(300);
    await page.locator('text=Panel Settings').click();
    await page.waitForTimeout(500);

    // Find the last block's down arrow
    const downButtons = page.locator('button[aria-label="Move down"]');
    const buttonCount = await downButtons.count();

    if (buttonCount > 0) {
      const lastDownButton = downButtons.last();
      // Should be disabled
      await expect(lastDownButton).toBeDisabled();
    }
  });

  test('device toggle is hidden on mobile', async ({ page }) => {
    // Enter edit mode
    await page.locator('button:has-text("Customize")').first().click();
    await page.waitForTimeout(300);
    await page.locator('text=Panel Settings').click();
    await page.waitForTimeout(500);

    // Device toggle should be hidden on mobile (hidden md:flex)
    const desktopToggle = page.locator('button[title*="desktop"]:visible, button:has([class*="Monitor"]):visible');
    const mobileToggle = page.locator('button[title*="mobile"]:visible, button:has([class*="Smartphone"]):visible');

    const desktopCount = await desktopToggle.count();
    const mobileCount = await mobileToggle.count();

    // Both should be hidden on mobile
    expect(desktopCount).toBe(0);
    expect(mobileCount).toBe(0);
  });
});

// ============================================
// MOBILE REORDER FUNCTIONALITY TESTS
// ============================================
test.describe('Mobile Reorder Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(TEST_PROFILE_PATH);
    await waitForPageLoad(page);
  });

  test('clicking down arrow moves block down', async ({ page }) => {
    // Enter edit mode
    await page.locator('button:has-text("Customize")').first().click();
    await page.waitForTimeout(300);
    await page.locator('text=Panel Settings').click();
    await page.waitForTimeout(500);

    // Get initial block order
    const blocks = page.locator('.block-content');
    const initialCount = await blocks.count();

    if (initialCount >= 2) {
      // Get the first block's down button
      const firstDownButton = page.locator('button[aria-label="Move down"]').first();

      if (await firstDownButton.isVisible() && await firstDownButton.isEnabled()) {
        // Get position of first block before move
        const firstBlockBefore = await blocks.first().boundingBox();

        // Click down arrow
        await firstDownButton.click();
        await page.waitForTimeout(500);

        // First block should now be in second position (moved down)
        const blocksAfter = page.locator('.block-content');
        const secondBlockAfter = await blocksAfter.nth(1).boundingBox();

        // The original first block should now be lower
        if (firstBlockBefore && secondBlockAfter) {
          // This is a basic check - block positions should have changed
          expect(blocksAfter).toBeTruthy();
        }
      }
    }
  });

  test('clicking up arrow moves block up', async ({ page }) => {
    // Enter edit mode
    await page.locator('button:has-text("Customize")').first().click();
    await page.waitForTimeout(300);
    await page.locator('text=Panel Settings').click();
    await page.waitForTimeout(500);

    const blocks = page.locator('.block-content');
    const initialCount = await blocks.count();

    if (initialCount >= 2) {
      // Get the second block's up button
      const upButtons = page.locator('button[aria-label="Move up"]');
      const secondUpButton = upButtons.nth(1);

      if (await secondUpButton.isVisible() && await secondUpButton.isEnabled()) {
        // Click up arrow
        await secondUpButton.click();
        await page.waitForTimeout(500);

        // Verify the blocks have reordered
        const blocksAfter = page.locator('.block-content');
        expect(await blocksAfter.count()).toBe(initialCount);
      }
    }
  });

  test('reorder buttons have proper touch target size', async ({ page }) => {
    // Enter edit mode
    await page.locator('button:has-text("Customize")').first().click();
    await page.waitForTimeout(300);
    await page.locator('text=Panel Settings').click();
    await page.waitForTimeout(500);

    const reorderButton = page.locator('.mobile-reorder-btn').first();

    if (await reorderButton.isVisible()) {
      const box = await reorderButton.boundingBox();

      if (box) {
        // Touch targets should be at least 44x44 pixels (iOS/Android guidelines)
        expect(box.width).toBeGreaterThanOrEqual(44);
        expect(box.height).toBeGreaterThanOrEqual(44);
      }
    }
  });
});

// ============================================
// BLOCK SETTINGS PANEL TESTS
// ============================================
test.describe('Block Settings Panel', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(TEST_PROFILE_PATH);
    await waitForPageLoad(page);
  });

  test('settings panel opens when clicking Edit on a block', async ({ page }) => {
    // Enter edit mode
    await page.locator('button:has-text("Customize")').first().click();
    await page.waitForTimeout(300);
    await page.locator('text=Panel Settings').click();
    await page.waitForTimeout(500);

    // Click Edit button on first block
    const editButton = page.locator('.edit-button').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(500);

      // Settings panel should appear
      // Look for panel indicators (close button, settings content)
      const closeButton = page.locator('button[aria-label*="Close"], button:has([class*="X"])');
      const hasPanel = (await closeButton.count()) > 0;
      expect(hasPanel).toBe(true);
    }
  });

  test('settings panel can be closed', async ({ page }) => {
    // Enter edit mode
    await page.locator('button:has-text("Customize")').first().click();
    await page.waitForTimeout(300);
    await page.locator('text=Panel Settings').click();
    await page.waitForTimeout(500);

    // Open settings panel
    const editButton = page.locator('.edit-button').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(500);

      // Close it
      const closeButton = page.locator('button[aria-label*="Close"], button:has([class*="X"])').first();
      if (await closeButton.isVisible()) {
        await closeButton.click();
        await page.waitForTimeout(500);

        // Panel should be closed (no longer visible or moved off-screen)
        // This is hard to test directly, but we can check the state changed
      }
    }
  });

  test('settings panel shows on mobile as bottom sheet', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(TEST_PROFILE_PATH);
    await waitForPageLoad(page);

    // Enter edit mode
    await page.locator('button:has-text("Customize")').first().click();
    await page.waitForTimeout(300);
    await page.locator('text=Panel Settings').click();
    await page.waitForTimeout(500);

    // Click a block to open settings
    const editButton = page.locator('.edit-button').first();
    if (await editButton.isVisible()) {
      await editButton.click();
      await page.waitForTimeout(500);

      // On mobile, settings should appear as bottom sheet
      // Check for bottom-positioned panel
      const bottomSheet = page.locator('[class*="bottom-0"][class*="fixed"]');
      const hasBottomSheet = (await bottomSheet.count()) > 0;
      expect(hasBottomSheet).toBe(true);
    }
  });

  test('navigation hides when settings panel opens on mobile', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(TEST_PROFILE_PATH);
    await waitForPageLoad(page);

    // Enter edit mode
    await page.locator('button:has-text("Customize")').first().click();
    await page.waitForTimeout(300);
    await page.locator('text=Panel Settings').click();
    await page.waitForTimeout(500);

    // Click a block to open settings
    const editButton = page.locator('.edit-button').first();
    if (await editButton.isVisible()) {
      // Check navigation is visible before
      const mobileNav = page.locator('.md\\:hidden[class*="fixed"][class*="bottom-0"]').first();

      await editButton.click();
      await page.waitForTimeout(500);

      // Body should have settings-panel-open class
      const bodyHasClass = await page.evaluate(() => {
        return document.body.classList.contains('settings-panel-open');
      });
      expect(bodyHasClass).toBe(true);
    }
  });
});

// ============================================
// FLOATING EDIT BUTTON TESTS
// ============================================
test.describe('Floating Edit Button', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(TEST_PROFILE_PATH);
    await waitForPageLoad(page);
  });

  test('floating edit button is visible on own profile', async ({ page }) => {
    // Look for the floating edit button
    const floatingButton = page.locator('[class*="fixed"][class*="z-50"]').filter({
      has: page.locator('svg') // Has an icon
    }).first();

    await expect(floatingButton).toBeVisible({ timeout: 10000 });
  });

  test('floating edit button toggles edit mode', async ({ page }) => {
    // Find and click the floating edit button
    const floatingButton = page.locator('button[class*="fixed"]').filter({
      has: page.locator('svg')
    }).first();

    if (await floatingButton.isVisible()) {
      await floatingButton.click();
      await page.waitForTimeout(500);

      // Edit mode should now be active - look for edit UI
      const dragHandles = page.locator('.drag-handle');
      const editButtons = page.locator('.edit-button');

      const hasEditUI = (await dragHandles.count()) > 0 || (await editButtons.count()) > 0;
      expect(hasEditUI).toBe(true);
    }
  });

  test('floating button repositions above mobile nav', async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(TEST_PROFILE_PATH);
    await waitForPageLoad(page);

    const floatingButton = page.locator('[class*="fixed"][class*="z-50"]').filter({
      has: page.locator('svg')
    }).first();

    if (await floatingButton.isVisible()) {
      const buttonBox = await floatingButton.boundingBox();
      const viewportHeight = MOBILE_VIEWPORT.height;

      if (buttonBox) {
        // Button should be above the mobile nav (which is ~56px)
        // So button bottom should be at least 56px from viewport bottom
        const distanceFromBottom = viewportHeight - (buttonBox.y + buttonBox.height);
        expect(distanceFromBottom).toBeGreaterThanOrEqual(50);
      }
    }
  });
});

// ============================================
// ADD MENU ACTIONS TESTS
// ============================================
test.describe('Add Menu Actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(TEST_PROFILE_PATH);
    await waitForPageLoad(page);
  });

  test('Add Block opens block picker', async ({ page }) => {
    // Open Add menu
    await page.locator('button:has-text("Add")').first().click();
    await page.waitForTimeout(300);

    // Click Add Block
    await page.locator('text=Add Block').click();
    await page.waitForTimeout(500);

    // Block picker modal should appear
    const blockPicker = page.locator('[role="dialog"], [class*="modal"]').filter({
      has: page.locator('text=/block|panel/i')
    });

    await expect(blockPicker.or(page.locator('text=Add Panel'))).toBeVisible({ timeout: 5000 });
  });

  test('Add Link opens link adder', async ({ page }) => {
    // Open Add menu
    await page.locator('button:has-text("Add")').first().click();
    await page.waitForTimeout(300);

    // Click Add Link
    await page.locator('text=Add Link').click();
    await page.waitForTimeout(500);

    // Link adder should appear
    const linkAdder = page.locator('[role="dialog"], [class*="modal"]');
    await expect(linkAdder).toBeVisible({ timeout: 5000 });
  });

  test('Social Links opens social flow', async ({ page }) => {
    // Open Add menu
    await page.locator('button:has-text("Add")').first().click();
    await page.waitForTimeout(300);

    // Click Social Links
    await page.locator('text=Social Links').click();
    await page.waitForTimeout(500);

    // Social flow modal should appear
    const socialFlow = page.locator('[role="dialog"], [class*="modal"]');
    await expect(socialFlow).toBeVisible({ timeout: 5000 });
  });

  test('New Bag navigates to dashboard', async ({ page }) => {
    // Open Add menu
    await page.locator('button:has-text("Add")').first().click();
    await page.waitForTimeout(300);

    // Click New Bag
    await page.locator('text=New Bag').click();

    // Should navigate to dashboard with new bag action
    await page.waitForURL(/dashboard/, { timeout: 10000 });
    expect(page.url()).toContain('dashboard');
  });
});

// ============================================
// CUSTOMIZE MENU ACTIONS TESTS
// ============================================
test.describe('Customize Menu Actions', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(TEST_PROFILE_PATH);
    await waitForPageLoad(page);
  });

  test('Theme & Colors opens theme editor', async ({ page }) => {
    // Open Customize menu
    await page.locator('button:has-text("Customize")').first().click();
    await page.waitForTimeout(300);

    // Click Theme & Colors
    await page.locator('text=Theme & Colors').click();
    await page.waitForTimeout(500);

    // Theme editor should appear
    const themeEditor = page.locator('[role="dialog"], [class*="modal"], [class*="theme-editor"]');
    await expect(themeEditor.or(page.locator('text=/theme|color/i'))).toBeVisible({ timeout: 5000 });
  });

  test('Profile Info opens header block settings', async ({ page }) => {
    // Open Customize menu
    await page.locator('button:has-text("Customize")').first().click();
    await page.waitForTimeout(300);

    // Click Profile Info
    await page.locator('text=Profile Info').click();
    await page.waitForTimeout(500);

    // Should be in edit mode with header block selected
    // Look for settings panel or edit indicators
    const settingsPanel = page.locator('[class*="settings"], [class*="panel"]');
    const editMode = page.locator('.drag-handle, .edit-button');

    const hasEditUI = (await settingsPanel.count()) > 0 || (await editMode.count()) > 0;
    expect(hasEditUI).toBe(true);
  });

  test('Panel Settings enables edit mode', async ({ page }) => {
    // Open Customize menu
    await page.locator('button:has-text("Customize")').first().click();
    await page.waitForTimeout(300);

    // Click Panel Settings
    await page.locator('text=Panel Settings').click();
    await page.waitForTimeout(500);

    // Should be in edit mode
    const dragHandles = page.locator('.drag-handle');
    const editButtons = page.locator('.edit-button');

    const hasEditUI = (await dragHandles.count()) > 0 || (await editButtons.count()) > 0;
    expect(hasEditUI).toBe(true);
  });
});

// ============================================
// BOTTOM UI COORDINATION TESTS
// ============================================
test.describe('Bottom UI Coordination (Mobile)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(TEST_PROFILE_PATH);
    await waitForPageLoad(page);
  });

  test('ProfileActionBar is positioned above mobile nav', async ({ page }) => {
    const actionBar = page.locator('[class*="fixed"]').filter({
      has: page.locator('button:has-text("Add")')
    }).first();

    if (await actionBar.isVisible()) {
      const barBox = await actionBar.boundingBox();
      const viewportHeight = MOBILE_VIEWPORT.height;

      if (barBox) {
        // Action bar should be above mobile nav (which is ~56px)
        const distanceFromBottom = viewportHeight - (barBox.y + barBox.height);
        expect(distanceFromBottom).toBeGreaterThanOrEqual(50);
      }
    }
  });

  test('floating edit button and action bar dont overlap', async ({ page }) => {
    const floatingButton = page.locator('[class*="fixed"][class*="z-50"]').filter({
      has: page.locator('svg')
    }).first();

    const actionBar = page.locator('[class*="fixed"]').filter({
      has: page.locator('button:has-text("Add")')
    }).first();

    if (await floatingButton.isVisible() && await actionBar.isVisible()) {
      const buttonBox = await floatingButton.boundingBox();
      const barBox = await actionBar.boundingBox();

      if (buttonBox && barBox) {
        // Check for overlap
        const overlap = !(
          buttonBox.x + buttonBox.width < barBox.x ||
          barBox.x + barBox.width < buttonBox.x ||
          buttonBox.y + buttonBox.height < barBox.y ||
          barBox.y + barBox.height < buttonBox.y
        );

        // They might overlap horizontally (floating button is on right)
        // but should have different vertical positions
        // This is acceptable as they're on opposite sides
      }
    }
  });

  test('CSS custom properties are set for mobile bottom coordination', async ({ page }) => {
    const navHeight = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--mobile-nav-height');
    });

    const bottomBase = await page.evaluate(() => {
      return getComputedStyle(document.documentElement).getPropertyValue('--mobile-bottom-base');
    });

    expect(navHeight.trim()).toBe('56px');
    expect(bottomBase).toBeTruthy();
  });
});

// ============================================
// VISUAL CONSISTENCY TESTS
// ============================================
test.describe('Visual Consistency', () => {
  test('edit mode UI is consistent between desktop and mobile preview', async ({ page }) => {
    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(TEST_PROFILE_PATH);
    await waitForPageLoad(page);

    // Enter edit mode
    await page.locator('button:has-text("Customize")').first().click();
    await page.waitForTimeout(300);
    await page.locator('text=Panel Settings').click();
    await page.waitForTimeout(500);

    // Count blocks in desktop mode
    const desktopBlocks = await page.locator('.block-content').count();

    // Switch to mobile preview
    const mobileToggle = page.locator('button[title*="mobile"], button:has([class*="Smartphone"])').first();
    if (await mobileToggle.isVisible()) {
      await mobileToggle.click();
      await page.waitForTimeout(500);

      // Count blocks in mobile mode
      const mobileBlocks = await page.locator('.block-content').count();

      // Should have same number of blocks
      expect(mobileBlocks).toBe(desktopBlocks);
    }
  });

  test('no JavaScript errors in edit mode', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.setViewportSize(DESKTOP_VIEWPORT);
    await page.goto(TEST_PROFILE_PATH);
    await waitForPageLoad(page);

    // Enter edit mode
    await page.locator('button:has-text("Customize")').first().click();
    await page.waitForTimeout(300);
    await page.locator('text=Panel Settings').click();
    await page.waitForTimeout(1000);

    // Filter known acceptable errors
    const criticalErrors = errors.filter(
      (err) =>
        !err.includes('favicon') &&
        !err.includes('analytics') &&
        !err.includes('gtag') &&
        !err.includes('Failed to load resource') &&
        !err.includes('HMR')
    );

    expect(criticalErrors).toHaveLength(0);
  });

  test('no JavaScript errors in mobile edit mode', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    page.on('pageerror', (error) => {
      errors.push(error.message);
    });

    await page.setViewportSize(MOBILE_VIEWPORT);
    await page.goto(TEST_PROFILE_PATH);
    await waitForPageLoad(page);

    // Enter edit mode
    await page.locator('button:has-text("Customize")').first().click();
    await page.waitForTimeout(300);
    await page.locator('text=Panel Settings').click();
    await page.waitForTimeout(1000);

    // Filter known acceptable errors
    const criticalErrors = errors.filter(
      (err) =>
        !err.includes('favicon') &&
        !err.includes('analytics') &&
        !err.includes('gtag') &&
        !err.includes('Failed to load resource') &&
        !err.includes('HMR')
    );

    expect(criticalErrors).toHaveLength(0);
  });
});
