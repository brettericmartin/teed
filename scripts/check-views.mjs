import pg from 'pg';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    
    // Check if table exists and has records
    const result = await client.query(`
      SELECT 
        event_type,
        event_data->>'bag_id' as bag_id,
        event_data->>'owner_id' as owner_id,
        created_at
      FROM user_activity 
      WHERE event_type = 'bag_viewed'
      ORDER BY created_at DESC
      LIMIT 10
    `);
    
    console.log('Recent bag views:', result.rows.length);
    console.log(JSON.stringify(result.rows, null, 2));
    
    // Count total views per owner
    const ownerViews = await client.query(`
      SELECT 
        event_data->>'owner_id' as owner_id,
        COUNT(*) as view_count
      FROM user_activity 
      WHERE event_type = 'bag_viewed' AND event_data->>'owner_id' IS NOT NULL
      GROUP BY event_data->>'owner_id'
    `);
    
    console.log('\nViews by owner:', ownerViews.rows);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

run();
