import { NextResponse } from 'next/server';
import type { SupabaseClient, User } from '@supabase/supabase-js';

type AuthSuccess = { user: User; error?: never };
type AuthFailure = { user?: never; error: NextResponse };

/**
 * Extracts the repeated auth check pattern from API routes.
 *
 * Usage:
 *   const auth = await requireAuth(supabase);
 *   if (auth.error) return auth.error;
 *   const { user } = auth;
 */
export async function requireAuth(
  supabase: SupabaseClient
): Promise<AuthSuccess | AuthFailure> {
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    };
  }

  return { user };
}
