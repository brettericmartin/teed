import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateExistingUsers() {
  console.log('Starting beta migration for existing users...\n');

  // First, get all profiles without beta_tier
  const { data: profiles, error: fetchError } = await supabase
    .from('profiles')
    .select('id, handle, display_name, beta_tier, beta_approved_at')
    .is('beta_tier', null);

  if (fetchError) {
    console.error('Error fetching profiles:', fetchError);
    process.exit(1);
  }

  console.log(`Found ${profiles?.length || 0} users without beta access\n`);

  if (!profiles || profiles.length === 0) {
    console.log('All users already have beta access!');
    return;
  }

  // Update all profiles to have beta_tier = 'founder'
  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update({
      beta_tier: 'founder',
      beta_approved_at: new Date().toISOString(),
    })
    .is('beta_tier', null)
    .select('id, handle, display_name, beta_tier');

  if (updateError) {
    console.error('Error updating profiles:', updateError);
    process.exit(1);
  }

  console.log(`Successfully migrated ${updated?.length || 0} users to founder tier:\n`);

  updated?.forEach((profile) => {
    console.log(`  - ${profile.handle || profile.id} (${profile.display_name || 'No name'})`);
  });

  // Also check profiles that have a beta_tier set
  const { data: existingBeta, error: existingError } = await supabase
    .from('profiles')
    .select('id, handle, display_name, beta_tier')
    .not('beta_tier', 'is', null);

  if (!existingError && existingBeta) {
    console.log(`\nUsers already with beta access: ${existingBeta.length}`);
    existingBeta.forEach((profile) => {
      console.log(`  - ${profile.handle || profile.id} (${profile.beta_tier})`);
    });
  }

  console.log('\nMigration complete!');
}

migrateExistingUsers().catch(console.error);
