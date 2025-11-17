import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';
import pg from 'pg';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const { Pool } = pg;

// Parse the connection string
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

async function runMigration() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
  });

  try {
    console.log('🔄 Connecting to database...');
    const client = await pool.connect();

    try {
      console.log('✅ Connected to database');
      console.log('📖 Reading migration file...');

      const migrationPath = join(__dirname, 'migrations', '009_username_scoped_codes.sql');
      const migrationSQL = readFileSync(migrationPath, 'utf8');

      console.log('🚀 Running username-scoped codes migration...');
      await client.query(migrationSQL);

      console.log('✅ Migration completed successfully!');
      console.log('');
      console.log('Changes made:');
      console.log('  - Dropped global unique constraint on bags.code');
      console.log('  - Added composite unique constraint on (owner_id, code)');
      console.log('  - Updated generate_bag_code() function for per-user uniqueness');
      console.log('  - Handled any duplicate codes by adding suffixes');
      console.log('');
      console.log('🎯 Bag codes are now unique per user!');
      console.log('   New URL structure: /u/[handle]/[code]');

      // Run verification query
      console.log('');
      console.log('🔍 Verifying migration...');
      const result = await client.query(`
        SELECT owner_id, code, COUNT(*)
        FROM bags
        GROUP BY owner_id, code
        HAVING COUNT(*) > 1
      `);

      if (result.rows.length === 0) {
        console.log('✅ Verification passed: No duplicate codes within users');
      } else {
        console.log('⚠️  Warning: Found duplicate codes:');
        console.table(result.rows);
      }
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('❌ Migration failed:');
    console.error(error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

runMigration();
