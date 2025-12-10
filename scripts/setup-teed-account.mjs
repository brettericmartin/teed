import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function setupTeedAccount() {
  // First, find all profiles
  const { data: allProfiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .limit(10);

  if (profileError) {
    console.error('Error finding profiles:', profileError);
    return;
  }

  console.log('All profiles:');
  allProfiles.forEach(p => {
    console.log('  - ' + p.handle + ' (' + p.id + ') - ' + (p.display_name || 'no display name'));
  });

  // Check if @teed handle exists
  const teedProfile = allProfiles.find(p => p.handle === 'teed');

  if (teedProfile) {
    console.log('\n@teed account already exists:', teedProfile.id);
    return teedProfile;
  }

  // Find a profile to update (prefer testuser or first one)
  const targetProfile = allProfiles.find(p => p.handle === 'testuser') || allProfiles[0];

  if (!targetProfile) {
    console.log('No profiles found to update');
    return null;
  }

  console.log('\nUpdating profile ' + targetProfile.handle + ' to @teed...');

  const { data: updated, error: updateError } = await supabase
    .from('profiles')
    .update({
      handle: 'teed',
      display_name: 'Teed',
      bio: 'Curated creator gear. What your favorite creators actually use.'
    })
    .eq('id', targetProfile.id)
    .select()
    .single();

  if (updateError) {
    console.error('Error updating profile:', updateError);
    return null;
  }

  console.log('Updated to @teed:', updated);
  return updated;
}

setupTeedAccount();
