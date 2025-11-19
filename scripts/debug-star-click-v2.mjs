#!/usr/bin/env node

import { chromium } from 'playwright';
import pg from 'pg';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const dbClient = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function debugStarClick() {
  const browser = await chromium.launch({ headless: false, slowMo: 500 });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Monitor network requests
  const apiRequests = [];
  page.on('request', request => {
    if (request.url().includes('/api/items/')) {
      const data = {
        method: request.method(),
        url: request.url(),
        postData: request.postData()
      };
      apiRequests.push(data);
      console.log(`📤 ${data.method} ${data.url}`);
      if (data.postData) {
        console.log(`   Body: ${data.postData}`);
      }
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/items/')) {
      const status = response.status();
      console.log(`📥 ${status} ${response.url()}`);
    }
  });

  // Monitor console errors
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log(`🖥️  Console error:`, msg.text());
    }
  });

  page.on('pageerror', error => {
    console.log(`🖥️  Page error:`, error.message);
  });

  try {
    await dbClient.connect();

    console.log('🌐 Navigating to login page...');
    await page.goto('http://localhost:3000/login');
    await page.waitForLoadState('networkidle');

    // Login
    console.log('🔐 Logging in...');
    await page.fill('input[type="email"]', 'test@teed-test.com');
    await page.fill('input[type="password"]', 'test-password');
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    console.log('✅ Logged in\n');

    console.log('🌐 Navigating to bag editor...');
    await page.goto('http://localhost:3000/u/test-user-api/my-side-table-setup/edit');
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded\n');

    // Wait for items to load
    await page.waitForSelector('.space-y-4', { timeout: 5000 });

    // Find item cards
    console.log('🔍 Looking for item cards...');
    const itemCards = await page.locator('[class*="bg-"][class*="border"][class*="rounded"]').filter({ has: page.locator('h3') }).all();
    console.log(`Found ${itemCards.length} item cards\n`);

    // Look for any button with Star icon (using SVG)
    console.log('🔍 Looking for star buttons (by SVG)...');
    const starButtons = await page.locator('button:has(svg)').all();
    console.log(`Found ${starButtons.length} buttons with SVG icons\n`);

    // Get button titles
    for (let i = 0; i < Math.min(5, starButtons.length); i++) {
      const title = await starButtons[i].getAttribute('title');
      const ariaLabel = await starButtons[i].getAttribute('aria-label');
      console.log(`  Button ${i + 1}: title="${title}" aria-label="${ariaLabel}"`);
    }

    // Get initial state from database
    console.log('\n📊 Checking initial database state...');
    const beforeResult = await dbClient.query(`
      SELECT id, custom_name, is_featured
      FROM bag_items
      WHERE bag_id = (SELECT id FROM bags WHERE code = 'my-side-table-setup')
      ORDER BY sort_index
      LIMIT 1
    `);

    const firstItem = beforeResult.rows[0];
    console.log(`First item: ${firstItem.custom_name} - ${firstItem.is_featured ? '⭐ Featured' : '  Not featured'}\n`);

    // Find the star button for first item - look for button with "featured" in title or aria-label
    const targetButton = await page.locator('button').filter({
      has: page.locator('svg')
    }).filter(button =>
      button.getAttribute('title').then(t => t?.toLowerCase().includes('featured')) ||
      button.getAttribute('aria-label').then(a => a?.toLowerCase().includes('featured'))
    ).first();

    const buttonExists = await targetButton.count();
    if (buttonExists === 0) {
      console.log('❌ Could not find star button!\n');

      // Debug: show all buttons
      console.log('All buttons on page:');
      const allButtons = await page.locator('button').all();
      for (let i = 0; i < Math.min(10, allButtons.length); i++) {
        const text = await allButtons[i].textContent();
        const title = await allButtons[i].getAttribute('title');
        console.log(`  ${i + 1}. text="${text?.trim()}" title="${title}"`);
      }

      await page.screenshot({ path: 'debug-no-stars.png', fullPage: true });
      console.log('\n📸 Screenshot saved to debug-no-stars.png');
      return;
    }

    console.log('🖱️  Clicking star button...');
    await targetButton.click();
    console.log('✅ Click executed\n');

    // Wait for network request
    await page.waitForTimeout(2000);

    // Check database after click
    console.log('📊 Checking database after click...');
    const afterResult = await dbClient.query(`
      SELECT id, custom_name, is_featured
      FROM bag_items
      WHERE id = $1
    `, [firstItem.id]);

    const afterItem = afterResult.rows[0];
    console.log(`After clicking: ${afterItem.custom_name} - ${afterItem.is_featured ? '⭐ Featured' : '  Not featured'}\n`);

    if (firstItem.is_featured !== afterItem.is_featured) {
      console.log('✅ SUCCESS! Database was updated');
    } else {
      console.log('❌ FAIL! Database was NOT updated');
    }

    console.log('\n📋 API requests made:');
    apiRequests.forEach(req => {
      console.log(`  ${req.method} ${req.url}`);
      if (req.postData) {
        console.log(`    Body:`, req.postData);
      }
    });

    if (apiRequests.length === 0) {
      console.log('  ⚠️  NO API REQUESTS MADE!');
    }

    // Take screenshot
    await page.screenshot({ path: 'debug-after-click.png', fullPage: true });
    console.log('\n📸 Screenshot saved to debug-after-click.png');

    // Keep browser open for inspection
    console.log('\n⏸️  Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await page.screenshot({ path: 'debug-error.png', fullPage: true });
  } finally {
    await dbClient.end();
    await browser.close();
  }
}

console.log('🐛 Starting star button debug session (v2)...\n');
debugStarClick();
