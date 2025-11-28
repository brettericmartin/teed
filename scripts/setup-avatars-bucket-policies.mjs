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

async function setupPolicies() {
  console.log('Setting up RLS policies for avatars bucket...');

  // Use the REST API to execute SQL for storage policies
  // Storage policies are in storage.objects table

  const policies = [
    {
      name: 'Avatar images are publicly accessible',
      definition: `CREATE POLICY "Avatar images are publicly accessible"
        ON storage.objects FOR SELECT
        USING (bucket_id = 'avatars');`
    },
    {
      name: 'Users can upload their own avatar',
      definition: `CREATE POLICY "Users can upload their own avatar"
        ON storage.objects FOR INSERT
        WITH CHECK (
          bucket_id = 'avatars'
          AND (storage.foldername(name))[1] = auth.uid()::text
        );`
    },
    {
      name: 'Users can update their own avatar',
      definition: `CREATE POLICY "Users can update their own avatar"
        ON storage.objects FOR UPDATE
        USING (
          bucket_id = 'avatars'
          AND (storage.foldername(name))[1] = auth.uid()::text
        );`
    },
    {
      name: 'Users can delete their own avatar',
      definition: `CREATE POLICY "Users can delete their own avatar"
        ON storage.objects FOR DELETE
        USING (
          bucket_id = 'avatars'
          AND (storage.foldername(name))[1] = auth.uid()::text
        );`
    }
  ];

  for (const policy of policies) {
    console.log(`Creating policy: ${policy.name}`);
    const { error } = await supabase.rpc('exec_sql', { sql: policy.definition });

    if (error) {
      // Check if policy already exists
      if (error.message?.includes('already exists')) {
        console.log(`  Policy "${policy.name}" already exists, skipping`);
      } else {
        console.error(`  Error creating policy: ${error.message}`);
      }
    } else {
      console.log(`  Policy "${policy.name}" created successfully`);
    }
  }

  console.log('Done!');
}

setupPolicies();
