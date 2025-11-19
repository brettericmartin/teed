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

async function checkFeaturedItems() {
  try {
    await client.connect();

    console.log('🔍 Checking featured items in "My side table setup" bag...\n');

    // Get the bag
    const bagResult = await client.query(`
      SELECT id, code, title FROM bags
      WHERE code = 'my-side-table-setup'
      LIMIT 1
    `);

    if (bagResult.rows.length === 0) {
      console.log('❌ Bag not found');
      return;
    }

    const bag = bagResult.rows[0];
    console.log(`✅ Found bag: ${bag.title} (${bag.code})\n`);

    // Get all items in the bag
    const itemsResult = await client.query(`
      SELECT
        id,
        custom_name,
        custom_photo_id,
        is_featured,
        featured_position,
        sort_index
      FROM bag_items
      WHERE bag_id = $1
      ORDER BY sort_index
    `, [bag.id]);

    console.log(`📦 Total items: ${itemsResult.rows.length}\n`);

    const featuredItems = itemsResult.rows.filter(item => item.is_featured);
    console.log(`⭐ Featured items: ${featuredItems.length}\n`);

    if (featuredItems.length > 0) {
      console.log('Featured items details:');
      for (const item of featuredItems) {
        const hasPhoto = item.custom_photo_id ? '📸 Has photo' : '❌ No photo';
        console.log(`  - ${item.custom_name} (position: ${item.featured_position || 'unset'}) ${hasPhoto}`);

        // Check if photo exists in media_assets
        if (item.custom_photo_id) {
          const photoResult = await client.query(`
            SELECT url FROM media_assets WHERE id = $1
          `, [item.custom_photo_id]);

          if (photoResult.rows.length > 0) {
            console.log(`    Photo URL: ${photoResult.rows[0].url}`);
          } else {
            console.log(`    ⚠️  Photo ID exists but no media asset found!`);
          }
        }
      }
    }

    console.log('\n📋 All items:');
    itemsResult.rows.forEach((item, index) => {
      const featured = item.is_featured ? '⭐' : '  ';
      const photo = item.custom_photo_id ? '📸' : '  ';
      console.log(`  ${featured} ${photo} ${index + 1}. ${item.custom_name}`);
    });

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    await client.end();
  }
}

checkFeaturedItems();
