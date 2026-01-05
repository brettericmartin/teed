#!/usr/bin/env node
import pg from 'pg';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ Missing DATABASE_URL in .env.local');
  process.exit(1);
}

console.log('🚀 Running Block Width Migration');
console.log('═'.repeat(60));

const client = new Client({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigration() {
  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Check if column already exists
    console.log('🔍 Checking if width column exists...');
    const checkResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'profile_blocks' AND column_name = 'width'
    `);

    if (checkResult.rows.length > 0) {
      console.log('✅ Width column already exists, skipping migration\n');
      return;
    }

    console.log('📄 Adding width column to profile_blocks...\n');

    // Add the column
    await client.query(`
      ALTER TABLE profile_blocks
      ADD COLUMN IF NOT EXISTS width text NOT NULL DEFAULT 'full'
    `);
    console.log('   ✅ Added width column\n');

    // Add the constraint (check if it exists first)
    try {
      await client.query(`
        ALTER TABLE profile_blocks
        ADD CONSTRAINT valid_block_width CHECK (width IN ('full', 'half'))
      `);
      console.log('   ✅ Added valid_block_width constraint\n');
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('   ℹ️  Constraint already exists\n');
      } else {
        throw error;
      }
    }

    // Add comment
    await client.query(`
      COMMENT ON COLUMN profile_blocks.width IS 'Block width: full (100%) or half (50%) for side-by-side layouts'
    `);
    console.log('   ✅ Added column comment\n');

    console.log('═'.repeat(60));
    console.log('🎉 Block width migration complete!');
    console.log('\nChanges:');
    console.log('  • Added width column to profile_blocks');
    console.log('  • Default value: "full"');
    console.log('  • Allowed values: "full", "half"');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
