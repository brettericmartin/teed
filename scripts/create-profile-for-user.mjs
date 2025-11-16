#!/usr/bin/env node
import pg from 'pg';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createProfile() {
  try {
    await client.connect();

    // Get the auth user
    const userResult = await client.query(`
      SELECT id, email
      FROM auth.users
      WHERE email = 'test@teed-test.com'
      ORDER BY created_at DESC
      LIMIT 1
    `);

    if (userResult.rows.length === 0) {
      console.log('❌ No user found');
      return;
    }

    const user = userResult.rows[0];
    console.log('Found user:', user.email, '(ID:', user.id + ')');

    // Check if profile already exists
    const existingProfile = await client.query(`
      SELECT id FROM profiles WHERE id = $1
    `, [user.id]);

    if (existingProfile.rows.length > 0) {
      console.log('✅ Profile already exists');
      return;
    }

    // Create profile
    await client.query(`
      INSERT INTO profiles (id, handle, display_name)
      VALUES ($1, $2, $3)
    `, [user.id, 'test-user-api', 'API Test User']);

    console.log('✅ Profile created successfully!');
    console.log('   Handle: @test-user-api');
    console.log('   Name: API Test User');

  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

createProfile();
