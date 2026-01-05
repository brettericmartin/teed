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

console.log('🚀 Running Grid Layout Migration (051 + 052)');
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

    // Check if grid columns already exist
    console.log('🔍 Checking if grid_x column exists...');
    const checkResult = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'profile_blocks' AND column_name = 'grid_x'
    `);

    if (checkResult.rows.length > 0) {
      console.log('ℹ️  Grid columns already exist, checking data migration...\n');
    } else {
      console.log('📄 Adding grid layout columns to profile_blocks...\n');

      // Add the columns
      await client.query(`
        ALTER TABLE profile_blocks
        ADD COLUMN IF NOT EXISTS grid_x integer DEFAULT 0,
        ADD COLUMN IF NOT EXISTS grid_y integer DEFAULT 0,
        ADD COLUMN IF NOT EXISTS grid_w integer DEFAULT 12,
        ADD COLUMN IF NOT EXISTS grid_h integer DEFAULT 2
      `);
      console.log('   ✅ Added grid_x, grid_y, grid_w, grid_h columns\n');

      // Add constraints (using DO block to handle if exists)
      console.log('   Adding constraints...');

      try {
        await client.query(`
          ALTER TABLE profile_blocks
          ADD CONSTRAINT valid_grid_x CHECK (grid_x >= 0 AND grid_x < 12)
        `);
        console.log('   ✅ Added valid_grid_x constraint');
      } catch (e) {
        if (e.message.includes('already exists')) {
          console.log('   ℹ️  valid_grid_x constraint already exists');
        } else {
          throw e;
        }
      }

      try {
        await client.query(`
          ALTER TABLE profile_blocks
          ADD CONSTRAINT valid_grid_w CHECK (grid_w >= 1 AND grid_w <= 12)
        `);
        console.log('   ✅ Added valid_grid_w constraint');
      } catch (e) {
        if (e.message.includes('already exists')) {
          console.log('   ℹ️  valid_grid_w constraint already exists');
        } else {
          throw e;
        }
      }

      try {
        await client.query(`
          ALTER TABLE profile_blocks
          ADD CONSTRAINT valid_grid_h CHECK (grid_h >= 1)
        `);
        console.log('   ✅ Added valid_grid_h constraint');
      } catch (e) {
        if (e.message.includes('already exists')) {
          console.log('   ℹ️  valid_grid_h constraint already exists');
        } else {
          throw e;
        }
      }

      // Add index
      await client.query(`
        CREATE INDEX IF NOT EXISTS idx_profile_blocks_grid_position
        ON profile_blocks (profile_id, grid_y, grid_x)
      `);
      console.log('   ✅ Added grid position index\n');
    }

    // Run data migration - convert width values to grid coordinates
    console.log('📄 Migrating existing width values to grid coordinates...\n');

    // Check how many blocks need migration
    const countResult = await client.query(`
      SELECT COUNT(*) as count FROM profile_blocks WHERE grid_w = 12 AND width = 'half'
    `);
    const needsMigration = parseInt(countResult.rows[0].count) > 0;

    if (needsMigration || true) {  // Always run to ensure data is consistent
      // Convert full-width blocks
      const fullResult = await client.query(`
        UPDATE profile_blocks
        SET grid_w = 12, grid_x = 0
        WHERE (width = 'full' OR width IS NULL) AND grid_w != 12
        RETURNING id
      `);
      console.log(`   ✅ Updated ${fullResult.rowCount} full-width blocks to grid_w=12\n`);

      // Convert half-width blocks with alternating left/right positioning
      const halfResult = await client.query(`
        WITH half_width_blocks AS (
          SELECT
            id,
            profile_id,
            sort_order,
            ROW_NUMBER() OVER (PARTITION BY profile_id ORDER BY sort_order) as position_in_profile
          FROM profile_blocks
          WHERE width = 'half'
        )
        UPDATE profile_blocks pb
        SET
          grid_w = 6,
          grid_x = CASE
            WHEN hwb.position_in_profile % 2 = 1 THEN 0
            ELSE 6
          END
        FROM half_width_blocks hwb
        WHERE pb.id = hwb.id AND (pb.grid_w != 6)
        RETURNING pb.id
      `);
      console.log(`   ✅ Updated ${halfResult.rowCount} half-width blocks to grid_w=6\n`);

      // Set grid_y based on sort_order (only for blocks that haven't been positioned)
      const yResult = await client.query(`
        UPDATE profile_blocks
        SET grid_y = sort_order * 2
        WHERE grid_y = 0 AND sort_order > 0
        RETURNING id
      `);
      console.log(`   ✅ Set grid_y for ${yResult.rowCount} blocks based on sort_order\n`);

      // Set default heights based on block type
      console.log('   Setting default heights by block type...');
      await client.query(`UPDATE profile_blocks SET grid_h = 3 WHERE block_type = 'header' AND grid_h = 2`);
      await client.query(`UPDATE profile_blocks SET grid_h = 2 WHERE block_type = 'bio' AND grid_h != 2`);
      await client.query(`UPDATE profile_blocks SET grid_h = 2 WHERE block_type = 'social_links' AND grid_h != 2`);
      await client.query(`UPDATE profile_blocks SET grid_h = 4 WHERE block_type = 'embed' AND grid_h = 2`);
      await client.query(`UPDATE profile_blocks SET grid_h = 4 WHERE block_type = 'featured_bags' AND grid_h = 2`);
      await client.query(`UPDATE profile_blocks SET grid_h = 1 WHERE block_type = 'custom_text' AND grid_h = 2`);
      await client.query(`UPDATE profile_blocks SET grid_h = 1 WHERE block_type = 'spacer' AND grid_h = 2`);
      await client.query(`UPDATE profile_blocks SET grid_h = 1 WHERE block_type = 'divider' AND grid_h = 2`);
      await client.query(`UPDATE profile_blocks SET grid_h = 3 WHERE block_type = 'destinations' AND grid_h = 2`);
      console.log('   ✅ Set block heights by type\n');
    } else {
      console.log('   ℹ️  No data migration needed\n');
    }

    // Show summary
    const summary = await client.query(`
      SELECT
        COUNT(*) as total,
        COUNT(CASE WHEN grid_w = 12 THEN 1 END) as full_width,
        COUNT(CASE WHEN grid_w = 6 THEN 1 END) as half_width,
        COUNT(CASE WHEN grid_w < 6 THEN 1 END) as other_width
      FROM profile_blocks
    `);

    console.log('═'.repeat(60));
    console.log('🎉 Grid layout migration complete!');
    console.log('\nBlock Summary:');
    console.log(`  • Total blocks: ${summary.rows[0].total}`);
    console.log(`  • Full-width (12 cols): ${summary.rows[0].full_width}`);
    console.log(`  • Half-width (6 cols): ${summary.rows[0].half_width}`);
    console.log(`  • Other widths: ${summary.rows[0].other_width}`);
    console.log('\nNew Columns:');
    console.log('  • grid_x: Column position (0-11)');
    console.log('  • grid_y: Row position');
    console.log('  • grid_w: Width in columns (1-12)');
    console.log('  • grid_h: Height in rows');

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigration();
