import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkProfile() {
  const email = 'brett.eric.martin@gmail.com';

  console.log('🔍 Looking for user with email:', email);

  // Find the user
  const { data: { users }, error: userError } = await supabase.auth.admin.listUsers();

  if (userError) {
    console.error('Error listing users:', userError);
    return;
  }

  const user = users.find(u => u.email === email);

  if (!user) {
    console.log('❌ User not found');
    return;
  }

  console.log('✅ User found:', user.id, user.email);
  console.log('   Created:', user.created_at);
  console.log('   Metadata:', JSON.stringify(user.user_metadata, null, 2));

  // Check for profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  if (profileError) {
    console.log('❌ Profile error:', profileError.message);
    console.log('   Code:', profileError.code);

    if (profileError.code === 'PGRST116') {
      console.log('\n🔧 Profile does not exist! Creating one now...');

      // Create profile from user metadata
      const handle = user.user_metadata?.handle || user.email.split('@')[0].replace(/[^a-z0-9_]/g, '_');
      const displayName = user.user_metadata?.display_name || user.email.split('@')[0];

      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          handle: handle,
          display_name: displayName,
          bio: user.user_metadata?.bio || null
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating profile:', createError);
      } else {
        console.log('✅ Profile created:', newProfile);
      }
    }
  } else {
    console.log('✅ Profile found:', profile);
  }
}

checkProfile();
