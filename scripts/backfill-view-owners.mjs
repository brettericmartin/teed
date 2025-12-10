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
    
    // Backfill owner_id from bags table
    const result = await client.query(`
      UPDATE user_activity ua
      SET event_data = event_data || jsonb_build_object('owner_id', b.owner_id::text)
      FROM bags b
      WHERE ua.event_type = 'bag_viewed'
        AND (ua.event_data->>'bag_id')::uuid = b.id
        AND ua.event_data->>'owner_id' IS NULL
      RETURNING ua.id
    `);
    
    console.log('Updated', result.rowCount, 'records with owner_id');
    
    // Now count views per owner
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
