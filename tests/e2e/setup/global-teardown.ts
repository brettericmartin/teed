import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '..', '..', '..', '.env.local') });

/**
 * Global teardown for Playwright tests
 * Cleans up test data created during tests
 */
async function globalTeardown() {
  console.log('🧹 Cleaning up test data...');

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.warn('⚠️  Missing Supabase credentials, skipping cleanup');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // Delete all bags owned by the test user that:
    // 1. Have "Test Bag" in the title, OR
    // 2. Have 0 items (empty bags from failed tests)
    const testUserId = 'a3b6d2c3-5fe7-4d0c-b19c-f6c2a1023d42'; // test_user_api

    // First, get all test user bags
    const { data: testBags, error: fetchError } = await supabase
      .from('bags')
      .select('id, title, code')
      .eq('owner_id', testUserId);

    if (fetchError) {
      console.error('Error fetching test bags:', fetchError);
      return;
    }

    if (!testBags || testBags.length === 0) {
      console.log('✅ No test bags to clean up');
      return;
    }

    // For each bag, check if it has items
    const bagsToDelete: string[] = [];

    for (const bag of testBags) {
      // Check if it's a test bag by title pattern
      if (bag.title.includes('Test Bag')) {
        bagsToDelete.push(bag.id);
        continue;
      }

      // Check if bag has no items
      const { count } = await supabase
        .from('bag_items')
        .select('*', { count: 'exact', head: true })
        .eq('bag_id', bag.id);

      if (count === 0) {
        bagsToDelete.push(bag.id);
      }
    }

    if (bagsToDelete.length === 0) {
      console.log('✅ No test bags to clean up');
      return;
    }

    // Delete the bags (cascade will handle bag_items and links)
    const { error: deleteError } = await supabase
      .from('bags')
      .delete()
      .in('id', bagsToDelete);

    if (deleteError) {
      console.error('Error deleting test bags:', deleteError);
    } else {
      console.log(`✅ Cleaned up ${bagsToDelete.length} test bags`);
    }

    // Also clean up any orphaned user_activity records from tests
    const { error: activityError } = await supabase
      .from('user_activity')
      .delete()
      .eq('user_id', testUserId);

    if (!activityError) {
      console.log('✅ Cleaned up test user activity records');
    }

  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

export default globalTeardown;
