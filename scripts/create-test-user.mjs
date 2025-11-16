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

async function createTestUser() {
  console.log('👤 Creating Test User for API Testing\n');
  console.log('════════════════════════════════════════════════════════════');

  try {
    await client.connect();
    console.log('✅ Connected to database\n');

    const testEmail = 'test@teed-test.com';
    const testPassword = 'test-password';
    const testHandle = 'test-user-api';
    const testDisplayName = 'API Test User';

    // Check if user already exists
    const existingUser = await client.query(
      `SELECT id, email FROM auth.users WHERE email = $1`,
      [testEmail]
    );

    if (existingUser.rows.length > 0) {
      console.log(`⚠️  User already exists: ${testEmail}`);
      console.log(`   User ID: ${existingUser.rows[0].id}`);

      // Check if profile exists
      const existingProfile = await client.query(
        `SELECT id, handle FROM profiles WHERE id = $1`,
        [existingUser.rows[0].id]
      );

      if (existingProfile.rows.length > 0) {
        console.log(`✅ Profile exists: @${existingProfile.rows[0].handle}`);
      } else {
        console.log('   Creating profile for existing user...');
        await client.query(
          `INSERT INTO profiles (id, handle, display_name)
           VALUES ($1, $2, $3)`,
          [existingUser.rows[0].id, testHandle, testDisplayName]
        );
        console.log(`✅ Created profile: @${testHandle}`);
      }

      console.log('\n════════════════════════════════════════════════════════════');
      console.log('✅ Test user is ready!');
      console.log(`\n   Email: ${testEmail}`);
      console.log(`   Password: ${testPassword}`);
      console.log(`   Handle: @${testHandle}\n`);
      return;
    }

    // Create auth user
    console.log('Creating auth user...');
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
        $1,
        crypt($2, gen_salt('bf')),
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
    `, [testEmail, testPassword]);

    const authUser = authUserResult.rows[0];
    console.log(`✅ Created auth user: ${authUser.email}`);

    // Create profile
    console.log('Creating profile...');
    await client.query(`
      INSERT INTO profiles (id, handle, display_name)
      VALUES ($1, $2, $3)
    `, [authUser.id, testHandle, testDisplayName]);

    console.log(`✅ Created profile: @${testHandle}`);

    console.log('\n════════════════════════════════════════════════════════════');
    console.log('🎉 Test user created successfully!\n');
    console.log('   You can now run the API tests with:');
    console.log('   npm run test:api\n');
    console.log('   Credentials:');
    console.log(`   Email: ${testEmail}`);
    console.log(`   Password: ${testPassword}\n`);

  } catch (error) {
    console.error('\n❌ Failed to create test user:');
    console.error(error.message);
    console.error('\nFull error:');
    console.error(error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

createTestUser();
