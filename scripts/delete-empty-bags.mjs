// Delete all bags that have no items
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function deleteEmptyBags() {
  try {
    console.log('Finding bags with no items...');

    // Get all bags with their item counts
    const { data: bags, error: bagsError } = await supabase
      .from('bags')
      .select(`
        id,
        code,
        title,
        created_at,
        items:bag_items(id)
      `);

    if (bagsError) {
      throw bagsError;
    }

    console.log(`Found ${bags.length} total bags`);

    // Filter bags with no items
    const emptyBags = bags.filter(bag => !bag.items || bag.items.length === 0);

    console.log(`Found ${emptyBags.length} empty bags`);

    if (emptyBags.length === 0) {
      console.log('No empty bags to delete');
      return;
    }

    console.log('\nEmpty bags:');
    emptyBags.forEach(bag => {
      console.log(`- ${bag.title || 'Untitled'} (${bag.code}) - created ${new Date(bag.created_at).toLocaleDateString()}`);
    });

    console.log(`\nDeleting ${emptyBags.length} empty bags...`);

    const bagIds = emptyBags.map(b => b.id);

    // Delete empty bags
    const { error: deleteError } = await supabase
      .from('bags')
      .delete()
      .in('id', bagIds);

    if (deleteError) {
      throw deleteError;
    }

    console.log(`✅ Successfully deleted ${emptyBags.length} empty bags`);

  } catch (error) {
    console.error('Error deleting empty bags:', error);
    process.exit(1);
  }
}

deleteEmptyBags();
