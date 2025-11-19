import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '..', '.env.local') });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function clearAutoLinks() {
  console.log('🗑️  Deleting auto-generated links...');

  const { data, error } = await supabase
    .from('links')
    .delete()
    .eq('is_auto_generated', true);

  if (error) {
    console.error('❌ Error deleting links:', error);
    return;
  }

  console.log('✅ Auto-generated links cleared!');
  console.log('Now you can test Fill Links again with the new affiliate integration.');
}

clearAutoLinks();
