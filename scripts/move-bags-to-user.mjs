import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve } from 'path';

// Load env vars from .env.local
const envPath = resolve(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length > 0) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

async function moveBags() {
  // Find the API Test User with handle test-user-api
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, handle, display_name');

  if (profileError) {
    console.error('Error fetching profiles:', profileError);
    return;
  }

  console.log('All users:');
  profiles.forEach(p => console.log(`  - ${p.handle} (${p.display_name}) - ${p.id}`));

  // Find source and target users
  const sourceUser = profiles.find(p => p.display_name === 'Test User');
  const targetUser = profiles.find(p => p.handle === 'test-user-api' || p.display_name === 'API Test User');

  if (!sourceUser) {
    console.error('Could not find source user "Test User"');
    return;
  }

  if (!targetUser) {
    console.error('Could not find target user with handle "test-user-api"');
    return;
  }

  console.log(`\nMoving bags from "${sourceUser.display_name}" to "${targetUser.handle}"...`);

  // Get all bags from source user
  const { data: bags, error: bagsError } = await supabase
    .from('bags')
    .select('id, title')
    .eq('owner_id', sourceUser.id);

  if (bagsError) {
    console.error('Error fetching bags:', bagsError);
    return;
  }

  console.log(`Found ${bags.length} bags to move:`);
  bags.forEach(b => console.log(`  - ${b.title}`));

  // Update ownership
  const { error: updateError } = await supabase
    .from('bags')
    .update({ owner_id: targetUser.id })
    .eq('owner_id', sourceUser.id);

  if (updateError) {
    console.error('Error updating bags:', updateError);
    return;
  }

  console.log(`\nSuccessfully moved ${bags.length} bags to ${targetUser.handle}!`);
}

moveBags().catch(console.error);
