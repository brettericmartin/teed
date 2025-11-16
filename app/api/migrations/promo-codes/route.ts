import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json(
      { error: 'Missing Supabase credentials' },
      { status: 500 }
    );
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  // Run the migration
  const { data, error } = await supabase.rpc('exec_sql', {
    query: 'ALTER TABLE bag_items ADD COLUMN IF NOT EXISTS promo_codes text;'
  });

  if (error) {
    // If RPC doesn't work, try a workaround - insert a test row to trigger column creation
    console.log('RPC failed, trying alternative...');

    // Check if column exists by trying to select it
    const { error: checkError } = await supabase
      .from('bag_items')
      .select('promo_codes')
      .limit(1);

    if (checkError && checkError.message.includes('does not exist')) {
      return NextResponse.json({
        success: false,
        error: 'Cannot add column via API. Please run this SQL manually in Supabase Dashboard:',
        sql: 'ALTER TABLE bag_items ADD COLUMN promo_codes text;',
        instructions: 'Go to https://supabase.com/dashboard/project/jvljmfdroozexzodqupg/sql/new'
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Column already exists!'
    });
  }

  return NextResponse.json({
    success: true,
    message: 'Migration completed successfully!'
  });
}
