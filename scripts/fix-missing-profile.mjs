import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load env vars
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const adminClient = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function fixMissingProfiles() {
  console.log('=== Fixing Missing Profiles ===\n');

  // First, check profiles table schema
  const { data: sampleProfile } = await adminClient
    .from('profiles')
    .select('*')
    .limit(1)
    .single();

  console.log('Profile columns:', Object.keys(sampleProfile || {}));
  console.log('');

  // Get all auth users
  const { data: users, error: usersError } = await adminClient.auth.admin.listUsers();

  if (usersError) {
    console.error('Error fetching users:', usersError);
    return;
  }

  console.log(`Found ${users.users.length} auth users\n`);

  for (const user of users.users) {
    // Check if profile exists
    const { data: profile, error: profileError } = await adminClient
      .from('profiles')
      .select('id, handle')
      .eq('id', user.id)
      .single();

    if (profile) {
      console.log(`✓ ${user.email} - has profile (${profile.handle})`);
      continue;
    }

    // Profile is missing, create one
    console.log(`✗ ${user.email} - MISSING profile, creating...`);

    // Generate a handle from email
    const emailPrefix = user.email.split('@')[0];
    let handle = emailPrefix
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 30);

    // Make sure handle is unique
    let suffix = 1;
    let finalHandle = handle;
    while (true) {
      const { data: existing } = await adminClient
        .from('profiles')
        .select('id')
        .eq('handle', finalHandle)
        .single();

      if (!existing) break;

      finalHandle = `${handle}-${suffix}`;
      suffix++;
    }

    // Create the profile (only required columns)
    const { data: newProfile, error: createError } = await adminClient
      .from('profiles')
      .insert({
        id: user.id,
        handle: finalHandle,
        display_name: emailPrefix
      })
      .select()
      .single();

    if (createError) {
      console.error(`  Error creating profile:`, createError);
    } else {
      console.log(`  ✓ Created profile with handle: ${newProfile.handle}`);
    }
  }

  console.log('\n=== Done ===');
}

fixMissingProfiles().catch(console.error);
