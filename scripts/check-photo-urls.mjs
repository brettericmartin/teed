#!/usr/bin/env node

import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Missing DATABASE_URL in .env.local');
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

async function checkPhotoUrls() {
  try {
    await client.connect();

    // Get recent items with their photo_url values
    const result = await client.query(`
      SELECT id, custom_name, photo_url, custom_photo_id, created_at
      FROM bag_items
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log('📋 Recent bag_items (checking photo_url):');
    console.log('─'.repeat(80));

    result.rows.forEach(row => {
      console.log(`\n📦 ${row.custom_name}`);
      console.log(`   ID: ${row.id}`);
      console.log(`   photo_url: ${row.photo_url || '(null)'}`);
      console.log(`   custom_photo_id: ${row.custom_photo_id || '(null)'}`);
      console.log(`   created: ${row.created_at}`);
    });

  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkPhotoUrls();
