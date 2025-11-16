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

async function verifyTestUser() {
  try {
    await client.connect();

    // Check if test user exists
    const userResult = await client.query(`
      SELECT id, email, email_confirmed_at, created_at
      FROM auth.users
      WHERE email = 'test@teed-test.com'
    `);

    if (userResult.rows.length === 0) {
      console.log('❌ Test user does NOT exist');
      console.log('\nRun: node scripts/create-test-user.mjs');
    } else {
      const user = userResult.rows[0];
      console.log('✅ Test user EXISTS');
      console.log('   Email:', user.email);
      console.log('   ID:', user.id);
      console.log('   Confirmed:', user.email_confirmed_at ? 'Yes' : 'No');
      console.log('   Created:', user.created_at);

      // Check profile
      const profileResult = await client.query(`
        SELECT id, handle, display_name
        FROM profiles
        WHERE id = $1
      `, [user.id]);

      if (profileResult.rows.length > 0) {
        console.log('\n✅ Profile EXISTS');
        console.log('   Handle:', profileResult.rows[0].handle);
        console.log('   Name:', profileResult.rows[0].display_name);
      } else {
        console.log('\n❌ Profile does NOT exist');
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await client.end();
  }
}

verifyTestUser();
