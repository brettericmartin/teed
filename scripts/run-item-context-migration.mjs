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

async function runMigration() {
  try {
    console.log('📝 Running Item Context Fields Migration (064)...\n');
    await client.connect();

    // Define new columns
    const newColumns = [
      { name: 'why_chosen', type: 'TEXT', comment: 'Personal narrative explaining why the user chose this item' },
      { name: 'specs', type: 'JSONB DEFAULT \'{}\'', comment: 'Structured specifications as JSONB' },
      { name: 'compared_to', type: 'TEXT', comment: 'What this item replaced or was compared against' },
      { name: 'alternatives', type: 'TEXT[]', comment: 'Array of alternative recommendations' },
      { name: 'price_paid', type: 'DECIMAL(10,2)', comment: 'What the user actually paid for this item' },
      { name: 'purchase_date', type: 'DATE', comment: 'When the user purchased/acquired this item' },
    ];

    // Check which columns exist
    const existingResult = await client.query(`
      SELECT column_name FROM information_schema.columns
      WHERE table_name = 'bag_items'
    `);
    const existingColumns = existingResult.rows.map(r => r.column_name);

    // Add each column if it doesn't exist
    for (const col of newColumns) {
      if (existingColumns.includes(col.name)) {
        console.log(`✅ ${col.name} column already exists`);
      } else {
        console.log(`Adding ${col.name} column...`);
        await client.query(`ALTER TABLE bag_items ADD COLUMN ${col.name} ${col.type}`);
        await client.query(`COMMENT ON COLUMN bag_items.${col.name} IS '${col.comment}'`);
        console.log(`✅ ${col.name} column added successfully!`);
      }
    }

    // Create GIN index for specs JSONB if it doesn't exist
    const indexResult = await client.query(`
      SELECT indexname FROM pg_indexes
      WHERE tablename = 'bag_items' AND indexname = 'idx_bag_items_specs'
    `);

    if (indexResult.rows.length === 0) {
      console.log('\nCreating GIN index for specs column...');
      await client.query('CREATE INDEX idx_bag_items_specs ON bag_items USING GIN (specs)');
      console.log('✅ Index created successfully!');
    } else {
      console.log('\n✅ specs GIN index already exists');
    }

    // Show current column structure
    const columnsResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'bag_items'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 bag_items columns after migration:');
    columnsResult.rows.forEach(row => {
      const isNew = newColumns.some(c => c.name === row.column_name);
      const marker = isNew ? '🆕' : '  ';
      console.log(`${marker} • ${row.column_name} (${row.data_type})`);
    });

    console.log('\n✨ Migration 064 completed successfully!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
