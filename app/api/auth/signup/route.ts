import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  let body: {
    email: string;
    password: string;
    name: string;
    handle: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { email, password, name, handle } = body;

  // 1. Validate input
  if (!email || !password || !name || !handle) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'Password must be at least 8 characters' }, { status: 400 });
  }
  if (!/^[a-z0-9_]{3,30}$/.test(handle)) {
    return NextResponse.json({ error: 'Invalid handle format' }, { status: 400 });
  }

  // 2. Check handle availability
  const { data: existingHandle } = await supabase
    .from('profiles')
    .select('id')
    .eq('handle', handle.toLowerCase())
    .maybeSingle();

  if (existingHandle) {
    return NextResponse.json({ error: 'Handle is already taken' }, { status: 409 });
  }

  // 3. Create auth user (handle_new_user trigger auto-creates profile)
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: email.toLowerCase(),
    password,
    email_confirm: true,
    user_metadata: {
      handle: handle.toLowerCase(),
      display_name: name,
    },
  });

  if (authError) {
    if (authError.message?.includes('already been registered') || authError.message?.includes('already exists')) {
      return NextResponse.json(
        { error: 'An account with this email already exists. Try signing in instead.' },
        { status: 409 }
      );
    }
    console.error('Auth user creation error:', authError);
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 });
  }

  return NextResponse.json({
    userId: authData.user.id,
    handle: handle.toLowerCase(),
  });
}
