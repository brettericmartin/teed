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

  // Monitor all console logs
  page.on('console', msg => {
    const type = msg.type();
    const text = msg.text();

    // Log our debug messages
    if (text.includes('[BagEditorClient]')) {
      console.log(`🖥️  ${text}`);
    }

    // Log errors
    if (type === 'error') {
      console.log(`🖥️  Console error:`, text);
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

    // Get initial state from database
    console.log('📊 Checking initial database state...');
    const beforeResult = await dbClient.query(`
      SELECT id, custom_name, is_featured
      FROM bag_items
      WHERE bag_id = (SELECT id FROM bags WHERE code = 'my-side-table-setup')
      ORDER BY sort_index
      LIMIT 1
    `);

    const firstItem = beforeResult.rows[0];
    console.log(`First item: ${firstItem.custom_name} - ${firstItem.is_featured ? '⭐ Featured' : '  Not featured'}\n`);

    // Find all buttons on the first item card and check their attributes
    console.log('🔍 Looking for star button using correct selector...');

    // Use a more specific selector: find button with title containing "featured"
    const starButton = page.locator('button[title*="featured" i]').first();

    const buttonCount = await starButton.count();
    console.log(`Found ${buttonCount} buttons with "featured" in title\n`);

    if (buttonCount === 0) {
      console.log('❌ Could not find star button with title containing "featured"!\n');

      // Debug: show all buttons with their attributes
      console.log('All buttons on page:');
      const allButtons = await page.locator('button').all();
      for (let i = 0; i < Math.min(20, allButtons.length); i++) {
        const text = await allButtons[i].textContent();
        const title = await allButtons[i].getAttribute('title');
        const ariaLabel = await allButtons[i].getAttribute('aria-label');
        console.log(`  ${i + 1}. text="${text?.trim()}" title="${title}" aria-label="${ariaLabel}"`);
      }

      await page.screenshot({ path: 'debug-no-stars-v3.png', fullPage: true });
      console.log('\n📸 Screenshot saved to debug-no-stars-v3.png');
      return;
    }

    // Get button details before clicking
    const title = await starButton.getAttribute('title');
    const ariaLabel = await starButton.getAttribute('aria-label');
    const className = await starButton.getAttribute('class');
    console.log(`Star button found:`);
    console.log(`  Title: "${title}"`);
    console.log(`  Aria-label: "${ariaLabel}"`);
    console.log(`  Class: "${className}"\n`);

    console.log('🖱️  Clicking star button...');
    await starButton.click();
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

    // Check button state after click
    const classAfterClick = await starButton.getAttribute('class');
    console.log(`\n🎨 Button class after click: "${classAfterClick}"`);

    // Take screenshot
    await page.screenshot({ path: 'debug-after-click-v3.png', fullPage: true });
    console.log('\n📸 Screenshot saved to debug-after-click-v3.png');

    // Keep browser open for inspection
    console.log('\n⏸️  Keeping browser open for 10 seconds...');
    await page.waitForTimeout(10000);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await page.screenshot({ path: 'debug-error-v3.png', fullPage: true });
  } finally {
    await dbClient.end();
    await browser.close();
  }
}

console.log('🐛 Starting star button debug session (v3)...\n');
debugStarClick();
