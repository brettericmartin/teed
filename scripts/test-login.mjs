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

async function testLogin() {
  console.log('🔐 Testing Login\n');

  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'test@teed-test.com',
    password: 'test-password',
  });

  if (error) {
    console.log('❌ Login failed');
    console.log('   Error:', error.message);
    console.log('   Code:', error.status);
  } else {
    console.log('✅ Login successful!');
    console.log('   User ID:', data.user.id);
    console.log('   Email:', data.user.email);
    console.log('   Session exists:', !!data.session);
  }
}

testLogin();
