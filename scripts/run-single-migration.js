const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

require('dotenv').config({ path: '.env.local' });

async function runMigration(migrationFile) {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const sql = fs.readFileSync(migrationFile, 'utf8');
    console.log('Running migration:', path.basename(migrationFile));
    await pool.query(sql);
    console.log('Migration completed:', path.basename(migrationFile));
  } catch (err) {
    console.error('Migration failed:', err.message);
    throw err;
  } finally {
    await pool.end();
  }
}

async function main() {
  const migrations = process.argv.slice(2);
  for (const migration of migrations) {
    await runMigration(migration);
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
