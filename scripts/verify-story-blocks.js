const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function verify() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    // Count story blocks
    const storyBlocks = await pool.query(`
      SELECT COUNT(*) as count
      FROM profile_blocks
      WHERE block_type = 'story'
    `);
    console.log('\n📊 Story Blocks Added:', storyBlocks.rows[0].count);

    // Get sample of profiles with story blocks
    const sample = await pool.query(`
      SELECT p.handle, pb.grid_y, pb.sort_order
      FROM profile_blocks pb
      JOIN profiles p ON p.id = pb.profile_id
      WHERE pb.block_type = 'story'
      LIMIT 5
    `);
    console.log('\n📊 Sample Story Block Locations:');
    console.table(sample.rows);

    // Get some bags with history data
    const bags = await pool.query(`
      SELECT DISTINCT b.code, b.title,
             COUNT(ivh.id) as history_count,
             p.handle as owner_handle
      FROM bags b
      JOIN profiles p ON p.id = b.owner_id
      LEFT JOIN item_version_history ivh ON ivh.bag_id = b.id
      WHERE b.is_public = true
      GROUP BY b.code, b.title, p.handle
      HAVING COUNT(ivh.id) > 0
      ORDER BY history_count DESC
      LIMIT 5
    `);
    console.log('\n📊 Bags with History (for testing):');
    console.table(bags.rows);

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await pool.end();
  }
}

verify();
