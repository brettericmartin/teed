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
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Monitor network requests
  const requests = [];
  page.on('request', request => {
    if (request.url().includes('/api/')) {
      requests.push({
        method: request.method(),
        url: request.url(),
        postData: request.postData()
      });
      console.log(`📤 ${request.method()} ${request.url()}`);
    }
  });

  page.on('response', async response => {
    if (response.url().includes('/api/')) {
      const status = response.status();
      console.log(`📥 ${status} ${response.url()}`);
      if (status >= 400) {
        const body = await response.text().catch(() => 'Could not read body');
        console.log('  Error body:', body);
      }
    }
  });

  // Monitor console logs
  page.on('console', msg => {
    const type = msg.type();
    if (type === 'error' || type === 'warning') {
      console.log(`🖥️  Console ${type}:`, msg.text());
    }
  });

  try {
    await dbClient.connect();

    console.log('🌐 Navigating to bag editor...');
    await page.goto('http://localhost:3000/u/test-user-api/my-side-table-setup/edit');

    // Wait for page to load
    await page.waitForLoadState('networkidle');
    console.log('✅ Page loaded\n');

    // Find all star buttons
    console.log('🔍 Looking for star buttons...');
    const starButtons = await page.locator('button[title*="featured" i]').all();
    console.log(`Found ${starButtons.length} star buttons\n`);

    if (starButtons.length === 0) {
      console.log('❌ No star buttons found! Checking page structure...');
      const html = await page.content();
      console.log('Page title:', await page.title());

      // Take screenshot
      await page.screenshot({ path: 'debug-no-stars.png' });
      console.log('📸 Screenshot saved to debug-no-stars.png');
      return;
    }

    // Get initial state from database
    console.log('📊 Checking initial database state...');
    const beforeResult = await dbClient.query(`
      SELECT id, custom_name, is_featured
      FROM bag_items
      WHERE bag_id = (SELECT id FROM bags WHERE code = 'my-side-table-setup')
      ORDER BY sort_index
      LIMIT 3
    `);

    console.log('Before clicking:');
    beforeResult.rows.forEach(row => {
      console.log(`  - ${row.custom_name}: ${row.is_featured ? '⭐ Featured' : '  Not featured'}`);
    });
    console.log('');

    // Click the first star button
    const firstItem = beforeResult.rows[0];
    console.log(`🖱️  Clicking star for "${firstItem.custom_name}"...`);

    await starButtons[0].click();
    console.log('✅ Click executed\n');

    // Wait a bit for the request to complete
    await page.waitForTimeout(2000);

    // Check database after click
    console.log('📊 Checking database after click...');
    const afterResult = await dbClient.query(`
      SELECT id, custom_name, is_featured
      FROM bag_items
      WHERE id = $1
    `, [firstItem.id]);

    const afterItem = afterResult.rows[0];
    console.log(`After clicking: ${afterItem.custom_name} - ${afterItem.is_featured ? '⭐ Featured' : '  Not featured'}`);

    if (firstItem.is_featured !== afterItem.is_featured) {
      console.log('✅ SUCCESS! Database was updated');
    } else {
      console.log('❌ FAIL! Database was NOT updated');
    }

    // Check if UI updated
    console.log('\n🎨 Checking UI state...');
    const buttonClass = await starButtons[0].getAttribute('class');
    console.log('Button classes:', buttonClass);

    const hasAmberBg = buttonClass?.includes('amber-3') || buttonClass?.includes('amber-4');
    console.log(`Has amber background: ${hasAmberBg ? 'Yes' : 'No'}`);

    // Take screenshot
    await page.screenshot({ path: 'debug-after-click.png' });
    console.log('\n📸 Screenshot saved to debug-after-click.png');

    console.log('\n📋 Network requests made:');
    requests.forEach(req => {
      console.log(`  ${req.method} ${req.url}`);
      if (req.postData) {
        console.log(`    Body:`, req.postData);
      }
    });

  } catch (error) {
    console.error('❌ Error:', error);
    await page.screenshot({ path: 'debug-error.png' });
  } finally {
    await dbClient.end();
    await browser.close();
  }
}

console.log('🐛 Starting star button debug session...\n');
debugStarClick();
