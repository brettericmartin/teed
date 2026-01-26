const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function checkSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const result = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'profile_blocks'
      ORDER BY ordinal_position
    `);
    console.log('\n📊 profile_blocks schema:');
    console.table(result.rows);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

checkSchema();
