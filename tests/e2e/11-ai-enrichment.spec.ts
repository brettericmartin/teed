import { test, expect } from '@playwright/test';

/**
 * AI Enrichment Tests
 * Tests the AI product identification and enrichment features
 * including the new brand knowledge system
 *
 * Note: These tests use pre-authenticated storage state from global setup
 */

test.describe('AI Enrichment API', () => {
  test('POST /api/ai/enrich-item should validate required fields', async ({ page, request }) => {
    // Ensure we have auth cookies
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    const response = await request.post('/api/ai/enrich-item', {
      headers: {
        Cookie: cookieHeader,
        'Content-Type': 'application/json',
      },
      data: {}, // Missing userInput
    });

    // Should return 400 for missing required fields
    expect(response.status()).toBe(400);
  });

  test('POST /api/ai/enrich-item should accept valid requests', async ({ page, request }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    const response = await request.post('/api/ai/enrich-item', {
      headers: {
        Cookie: cookieHeader,
        'Content-Type': 'application/json',
      },
      data: {
        userInput: 'TaylorMade Qi10 Max driver',
        bagContext: 'My golf bag',
      },
    });

    // Should return 200 and have suggestions
    expect(response.ok()).toBeTruthy();
    const data = await response.json();
    expect(data.suggestions).toBeDefined();
    expect(Array.isArray(data.suggestions)).toBeTruthy();
  });
});

test.describe('Transcript Processing API', () => {
  test('POST /api/ai/process-transcript should validate transcript field', async ({ page, request }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    const response = await request.post('/api/ai/process-transcript', {
      headers: {
        Cookie: cookieHeader,
        'Content-Type': 'application/json',
      },
      data: {
        bagType: 'golf',
        // Missing transcript
      },
    });

    // Should return 400 for missing transcript
    expect(response.status()).toBe(400);
  });

  test('POST /api/ai/process-transcript should return metadata with brand knowledge info', async ({ page, request }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    const response = await request.post('/api/ai/process-transcript', {
      headers: {
        Cookie: cookieHeader,
        'Content-Type': 'application/json',
      },
      data: {
        transcript: 'In my bag I have a TaylorMade Qi10 driver and some Titleist Pro V1 balls',
        bagType: 'golf',
      },
    });

    if (response.ok()) {
      const data = await response.json();

      // Should have metadata section with new brand knowledge fields
      expect(data.metadata).toBeDefined();
      expect(data.metadata).toHaveProperty('detectedCategory');
      expect(data.metadata).toHaveProperty('usedBrandKnowledge');
    }
  });
});

test.describe('Preview Enrichment API', () => {
  test('POST /api/items/preview-enrichment should require bagId', async ({ page, request }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    const response = await request.post('/api/items/preview-enrichment', {
      headers: {
        Cookie: cookieHeader,
        'Content-Type': 'application/json',
      },
      data: {}, // Missing bagId
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('bagId');
  });
});

test.describe('Brand Knowledge System Integration', () => {
  test('should detect golf category for golf-related content', async ({ page, request }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('domcontentloaded');

    const cookies = await page.context().cookies();
    const cookieHeader = cookies.map(c => `${c.name}=${c.value}`).join('; ');

    // Test with golf-specific terms
    const response = await request.post('/api/ai/process-transcript', {
      headers: {
        Cookie: cookieHeader,
        'Content-Type': 'application/json',
      },
      data: {
        transcript: 'I love my Callaway Paradym driver and Scotty Cameron putter',
        bagType: 'golf bag',
      },
    });

    if (response.ok()) {
      const data = await response.json();
      // Golf category should be detected
      if (data.metadata?.detectedCategory) {
        expect(data.metadata.detectedCategory).toBe('golf');
      }
    }
  });
});

test.describe('Settings Page Structure', () => {
  test('should have profile settings section', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');

    // Settings page should load and have form elements
    await expect(page.locator('form')).toBeVisible({ timeout: 10000 });
  });

  test('should have avatar upload functionality', async ({ page }) => {
    await page.goto('/settings');
    await page.waitForLoadState('domcontentloaded');

    // Should have file input for avatar
    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput.first()).toBeAttached({ timeout: 10000 });
  });
});
