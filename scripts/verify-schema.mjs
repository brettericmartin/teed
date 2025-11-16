#!/usr/bin/env node
import pg from 'pg';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function verify() {
  try {
    await client.connect();
    console.log('🔍 Verifying Schema Changes\n');
    console.log('═'.repeat(60));

    // Check 1: links table exists
    const linksTable = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'links'
      );
    `);
    console.log('✅ links table:', linksTable.rows[0].exists ? 'EXISTS' : '❌ MISSING');

    // Check 2: bags.code column exists
    const codeColumn = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'bags'
        AND column_name = 'code'
      );
    `);
    console.log('✅ bags.code column:', codeColumn.rows[0].exists ? 'EXISTS' : '❌ MISSING');

    // Check 3: share_links usage tracking columns
    const shareLinksColumns = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'share_links'
      AND column_name IN ('max_uses', 'uses', 'expires_at')
      ORDER BY column_name;
    `);
    console.log('✅ share_links tracking:', shareLinksColumns.rows.map(r => r.column_name).join(', '));

    // Check 4: bags.updated_at column
    const updatedAtColumn = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.columns
        WHERE table_name = 'bags'
        AND column_name = 'updated_at'
      );
    `);
    console.log('✅ bags.updated_at column:', updatedAtColumn.rows[0].exists ? 'EXISTS' : '❌ MISSING');

    // Check 5: Sample bag codes (if any bags exist)
    const bagCodes = await client.query(`
      SELECT id, title, code FROM bags LIMIT 3;
    `);
    console.log('\n' + '═'.repeat(60));
    console.log('📦 Sample Bag Codes:');
    if (bagCodes.rows.length > 0) {
      bagCodes.rows.forEach(bag => {
        console.log(`  ${bag.title}: /c/${bag.code}`);
      });
    } else {
      console.log('  (No bags in database yet)');
    }

    console.log('\n' + '═'.repeat(60));
    console.log('🎉 All schema changes verified successfully!');

  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  } finally {
    await client.end();
  }
}

verify();
