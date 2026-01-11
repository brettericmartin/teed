import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAdminApi } from '@/lib/withAdmin';

export const dynamic = 'force-dynamic';

// GET current capacity and settings
export async function GET(request: NextRequest) {
  const result = await withAdminApi('admin');
  if ('error' in result) return result.error;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Get capacity
  const { data: capacity, error: capacityError } = await supabase.rpc('get_beta_capacity');

  if (capacityError) {
    console.error('Error fetching capacity:', capacityError);
    return NextResponse.json(
      { error: 'Failed to fetch capacity' },
      { status: 500 }
    );
  }

  // Get all beta settings
  const { data: settings, error: settingsError } = await supabase
    .from('beta_settings')
    .select('key, value, updated_at');

  if (settingsError) {
    console.error('Error fetching settings:', settingsError);
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }

  // Convert to object
  const settingsMap = Object.fromEntries(
    settings?.map(s => [s.key, s.value]) || []
  );

  return NextResponse.json({
    capacity,
    settings: settingsMap,
    raw_settings: settings,
  });
}

// POST to update capacity (super_admin only)
export async function POST(request: NextRequest) {
  const result = await withAdminApi('super_admin');
  if ('error' in result) return result.error;
  const { admin } = result;

  const body = await request.json();
  const { total_capacity, reserved_for_codes } = body;

  if (total_capacity !== undefined && (total_capacity < 1 || total_capacity > 10000)) {
    return NextResponse.json(
      { error: 'Total capacity must be between 1 and 10000' },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Call the update capacity function
  const { data, error } = await supabase.rpc('update_beta_capacity', {
    new_total: total_capacity,
    new_reserved: reserved_for_codes ?? null,
    admin_user_id: admin.id,
  });

  if (error) {
    console.error('Error updating capacity:', error);
    return NextResponse.json(
      { error: 'Failed to update capacity', details: error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({
    success: true,
    previous: data?.previous,
    new: data?.new,
  });
}

// PATCH to update individual settings (super_admin only)
export async function PATCH(request: NextRequest) {
  const result = await withAdminApi('super_admin');
  if ('error' in result) return result.error;

  const body = await request.json();
  const { key, value } = body;

  if (!key) {
    return NextResponse.json(
      { error: 'Setting key is required' },
      { status: 400 }
    );
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Upsert the setting
  const { error } = await supabase
    .from('beta_settings')
    .upsert(
      {
        key,
        value,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );

  if (error) {
    console.error('Error updating setting:', error);
    return NextResponse.json(
      { error: 'Failed to update setting' },
      { status: 500 }
    );
  }

  return NextResponse.json({ success: true, key, value });
}
