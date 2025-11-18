import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function fixProductionSchema() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL not found in .env.local');
    process.exit(1);
  }

  const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Connected to database');

    // Check if photo_url column exists
    const checkPhotoUrl = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'bag_items'
      AND column_name = 'photo_url';
    `);

    if (checkPhotoUrl.rows.length === 0) {
      console.log('📝 Adding photo_url column...');
      await client.query(`
        ALTER TABLE bag_items
        ADD COLUMN photo_url TEXT;
      `);
      console.log('✅ Added photo_url column');
    } else {
      console.log('✓ photo_url column already exists');
    }

    // Check if is_featured column exists
    const checkFeatured = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'bag_items'
      AND column_name = 'is_featured';
    `);

    if (checkFeatured.rows.length === 0) {
      console.log('📝 Adding is_featured column...');
      await client.query(`
        ALTER TABLE bag_items
        ADD COLUMN is_featured BOOLEAN DEFAULT false NOT NULL;
      `);
      console.log('✅ Added is_featured column');
    } else {
      console.log('✓ is_featured column already exists');
    }

    // Check if featured_position column exists
    const checkPosition = await client.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'bag_items'
      AND column_name = 'featured_position';
    `);

    if (checkPosition.rows.length === 0) {
      console.log('📝 Adding featured_position column...');
      await client.query(`
        ALTER TABLE bag_items
        ADD COLUMN featured_position INTEGER;
      `);
      console.log('✅ Added featured_position column');
    } else {
      console.log('✓ featured_position column already exists');
    }

    console.log('\n✅ Production schema fixed successfully!');

  } catch (error) {
    console.error('❌ Error fixing schema:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixProductionSchema();
