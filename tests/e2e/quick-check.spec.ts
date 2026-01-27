import { test, expect } from '@playwright/test';

// Try 127.0.0.1 instead of localhost in case of DNS issues
const BASE_URL = 'http://127.0.0.1:3000';

test.setTimeout(60000);

test('homepage loads', async ({ page }) => {
  const response = await page.goto(`${BASE_URL}/`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('Homepage status:', response?.status());
  expect(response?.status()).toBeLessThan(400);
});

test('profile page loads', async ({ page }) => {
  const response = await page.goto(`${BASE_URL}/u/teed`, { waitUntil: 'domcontentloaded', timeout: 30000 });
  console.log('Profile status:', response?.status());
  console.log('Final URL:', page.url());
  expect(response?.status()).toBeLessThan(400);
});
