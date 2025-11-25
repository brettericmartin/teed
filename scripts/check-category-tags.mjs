#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceKey);

console.log('🔍 Checking Category and Tags System\n');

// Check if category column exists
const { data: bags, error } = await supabase
  .from('bags')
  .select('*')
  .limit(1);

if (bags && bags.length > 0) {
  console.log('✅ Bags table columns:');
  Object.keys(bags[0]).forEach(key => {
    console.log(`  - ${key}`);
  });

  if ('category' in bags[0]) {
    console.log('\n✅ Category column exists');
  } else {
    console.log('\n❌ Category column missing');
  }

  if ('tags' in bags[0]) {
    console.log('✅ Tags column exists');
  } else {
    console.log('❌ Tags column missing');
  }
}
