import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing SUPABASE env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: { persistSession: false }
});

async function createAvatarsBucket() {
  console.log('Creating avatars bucket...');

  // Check if bucket exists
  const { data: buckets, error: listError } = await supabase.storage.listBuckets();

  if (listError) {
    console.error('Error listing buckets:', listError);
    process.exit(1);
  }

  console.log('Existing buckets:', buckets.map(b => b.name));

  const avatarsBucket = buckets.find(b => b.name === 'avatars');

  if (avatarsBucket) {
    console.log('Avatars bucket already exists');
    return;
  }

  // Create the bucket
  const { data, error } = await supabase.storage.createBucket('avatars', {
    public: true,
    fileSizeLimit: 2 * 1024 * 1024, // 2MB
    allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
  });

  if (error) {
    console.error('Error creating bucket:', error);
    process.exit(1);
  }

  console.log('Avatars bucket created successfully:', data);
}

createAvatarsBucket();
