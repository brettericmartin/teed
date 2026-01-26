const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function verify() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Check bag version history
    const bagHistory = await pool.query(`
      SELECT COUNT(*) as count, change_type
      FROM bag_version_history
      GROUP BY change_type
    `);
    console.log('\n📊 Bag Version History:');
    console.table(bagHistory.rows);

    // Check item version history
    const itemHistory = await pool.query(`
      SELECT COUNT(*) as count, change_type
      FROM item_version_history
      GROUP BY change_type
    `);
    console.log('\n📊 Item Version History:');
    console.table(itemHistory.rows);

    // Check trigger status
    const triggerStatus = await pool.query(`
      SELECT tgname, tgenabled
      FROM pg_trigger
      WHERE tgname = 'track_item_changes_trigger'
    `);
    console.log('\n🔧 Trigger Status:');
    console.table(triggerStatus.rows);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

verify();
