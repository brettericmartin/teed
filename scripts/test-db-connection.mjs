#!/usr/bin/env node
import pg from 'pg';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

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

const client = new Client({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

async function testDatabaseConnection() {
  console.log('🧪 Testing Database Connections\n');
  console.log('════════════════════════════════════════════════════════════');

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    // Test 0: Get or create a test profile
    console.log('📝 Test 0: Finding existing profile or creating test user...');

    // First try to find an existing profile
    let profileResult = await client.query('SELECT id, handle FROM profiles LIMIT 1');

    let testProfile;
    if (profileResult.rows.length > 0) {
      testProfile = profileResult.rows[0];
      console.log(`✅ Using existing profile: ${testProfile.handle}`);
    } else {
      // If no profiles exist, create a test auth user first
      console.log('   No existing profiles found. Creating test user in auth.users...');
      const authUserResult = await client.query(`
        INSERT INTO auth.users (
          instance_id,
          id,
          aud,
          role,
          email,
          encrypted_password,
          email_confirmed_at,
          recovery_sent_at,
          last_sign_in_at,
          raw_app_meta_data,
          raw_user_meta_data,
          created_at,
          updated_at,
          confirmation_token,
          email_change,
          email_change_token_new,
          recovery_token
        ) VALUES (
          '00000000-0000-0000-0000-000000000000',
          gen_random_uuid(),
          'authenticated',
          'authenticated',
          'test-' || floor(random() * 10000)::text || '@teed-test.com',
          crypt('test-password', gen_salt('bf')),
          now(),
          now(),
          now(),
          '{"provider":"email","providers":["email"]}',
          '{}',
          now(),
          now(),
          '',
          '',
          '',
          ''
        )
        RETURNING id, email;
      `);

      const authUser = authUserResult.rows[0];
      console.log(`   ✅ Created auth user: ${authUser.email}`);

      // Now create the profile
      profileResult = await client.query(`
        INSERT INTO profiles (id, handle, display_name)
        VALUES ($1, 'test-user-' || floor(random() * 10000)::text, 'Test User')
        RETURNING id, handle;
      `, [authUser.id]);

      testProfile = profileResult.rows[0];
      testProfile.authUserId = authUser.id;  // Save for cleanup
      testProfile.isNewUser = true;
      console.log(`   ✅ Created profile: ${testProfile.handle}`);
    }

    // Test 1: Create a test bag with code
    console.log('\n📝 Test 1: Creating test bag with code...');
    const bagResult = await client.query(`
      INSERT INTO bags (owner_id, title, description, code, is_public)
      VALUES (
        $1,
        'Test Camping Kit',
        'Testing database connections',
        'test-camping-kit-' || floor(random() * 1000)::text,
        true
      )
      RETURNING id, code, title;
    `, [testProfile.id]);

    const testBag = bagResult.rows[0];
    console.log(`✅ Created bag: ${testBag.title} (code: ${testBag.code})`);

    // Test 2: Create a test item
    console.log('\n📝 Test 2: Creating test item...');
    const itemResult = await client.query(`
      INSERT INTO bag_items (bag_id, custom_name, notes, sort_index)
      VALUES ($1, 'Test Sleeping Bag', 'For testing database connections', 1)
      RETURNING id, custom_name;
    `, [testBag.id]);

    const testItem = itemResult.rows[0];
    console.log(`✅ Created item: ${testItem.custom_name}`);

    // Test 3: Attach a test link
    console.log('\n📝 Test 3: Attaching test link...');
    const linkResult = await client.query(`
      INSERT INTO links (bag_item_id, url, kind, label)
      VALUES ($1, 'https://www.rei.com/product/12345', 'purchase', 'REI Test Link')
      RETURNING id, url, kind;
    `, [testItem.id]);

    const testLink = linkResult.rows[0];
    console.log(`✅ Created link: ${testLink.kind} - ${testLink.url}`);

    // Test 4: Query the complete structure
    console.log('\n📝 Test 4: Querying complete structure...');
    const queryResult = await client.query(`
      SELECT
        b.id as bag_id,
        b.code,
        b.title as bag_title,
        bi.id as item_id,
        bi.custom_name as item_name,
        l.id as link_id,
        l.url,
        l.kind as link_kind
      FROM bags b
      LEFT JOIN bag_items bi ON b.id = bi.bag_id
      LEFT JOIN links l ON bi.id = l.bag_item_id
      WHERE b.id = $1;
    `, [testBag.id]);

    console.log(`✅ Query returned ${queryResult.rows.length} row(s)`);
    console.log('   Data structure verified with JOINs working correctly');

    // Test 5: Clean up - Delete test data
    console.log('\n📝 Test 5: Cleaning up test data...');

    // Delete link (should cascade, but being explicit)
    await client.query('DELETE FROM links WHERE id = $1', [testLink.id]);
    console.log('✅ Deleted test link');

    // Delete item
    await client.query('DELETE FROM bag_items WHERE id = $1', [testItem.id]);
    console.log('✅ Deleted test item');

    // Delete bag
    await client.query('DELETE FROM bags WHERE id = $1', [testBag.id]);
    console.log('✅ Deleted test bag');

    // Delete test profile (only if we created it)
    if (testProfile.isNewUser) {
      await client.query('DELETE FROM profiles WHERE id = $1', [testProfile.id]);
      console.log('✅ Deleted test profile');

      // Delete auth user too
      await client.query('DELETE FROM auth.users WHERE id = $1', [testProfile.authUserId]);
      console.log('✅ Deleted test auth user');
    } else {
      console.log('✅ Skipped profile deletion (used existing profile)');
    }

    // Verify cleanup
    const cleanupCheck = await client.query(`
      SELECT COUNT(*) FROM bags WHERE id = $1
      UNION ALL
      SELECT COUNT(*) FROM bag_items WHERE id = $2
      UNION ALL
      SELECT COUNT(*) FROM links WHERE id = $3;
    `, [testBag.id, testItem.id, testLink.id]);

    const totalRemaining = cleanupCheck.rows.reduce((sum, row) => sum + parseInt(row.count), 0);

    if (totalRemaining === 0) {
      console.log('✅ All test data cleaned up successfully');
    } else {
      console.log('⚠️  Warning: Some test data may still exist');
    }

    console.log('\n════════════════════════════════════════════════════════════');
    console.log('🎉 All database connection tests passed!\n');

  } catch (error) {
    console.error('\n❌ Database connection test failed:');
    console.error('Error:', error.message);
    console.error('\nFull error:');
    console.error(error);

    if (error.message && error.message.includes('No profiles found')) {
      console.log('\n💡 Tip: Create a profile first or modify the test to use a specific profile_id');
    }

    process.exit(1);
  } finally {
    await client.end();
  }
}

testDatabaseConnection();
