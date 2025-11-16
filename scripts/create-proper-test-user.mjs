#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createProperTestUser() {
  console.log('👤 Creating Test User via Supabase Auth\n');

  const testEmail = 'test@teed-test.com';
  const testPassword = 'test-password';

  try {
    // First, try to sign up
    console.log('Attempting to sign up...');
    const { data, error } = await supabase.auth.signUp({
      email: testEmail,
      password: testPassword,
      options: {
        data: {
          handle: 'test-user-api',
          display_name: 'API Test User'
        }
      }
    });

    if (error) {
      if (error.message.includes('already registered')) {
        console.log('✅ User already exists');
        console.log('\nTrying to sign in to verify credentials...');

        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: testEmail,
          password: testPassword,
        });

        if (signInError) {
          console.log('❌ Sign in failed:', signInError.message);
          console.log('\n💡 The password might need to be reset.');
          console.log('   User exists but password doesn\'t match.');
        } else {
          console.log('✅ Sign in successful!');
          console.log('   User ID:', signInData.user.id);
          console.log('   Email:', signInData.user.email);
        }
      } else {
        console.error('❌ Signup error:', error.message);
      }
    } else {
      console.log('✅ User created successfully!');
      console.log('   User ID:', data.user.id);
      console.log('   Email:', data.user.email);
    }

    console.log('\n📝 Test Credentials:');
    console.log('   Email: test@teed-test.com');
    console.log('   Password: test-password');

  } catch (err) {
    console.error('Error:', err.message);
  }
}

createProperTestUser();
