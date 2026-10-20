// Health check + keep-alive.
//
// Round-trips the database with the anon client so a paused Supabase project
// or a dead connection shows up as a 503 instead of a silently failing site.
// A daily Vercel cron (vercel.json) calls this; it also works as a manual
// check: GET /api/health -> { ok, db, checkedAt }.

import { NextResponse } from 'next/server';
import { getSupabasePublic } from '@/lib/supabasePublic';

export const dynamic = 'force-dynamic';

export async function GET() {
  const checkedAt = new Date().toISOString();
  try {
    // profiles is a public table; RLS may hide rows from the anon key, but the
    // head request still has to reach Postgres, which is the point.
    const { error } = await getSupabasePublic()
      .from('profiles')
      .select('id', { head: true, count: 'exact' });

    if (error) {
      console.error('[health] database error', error.message);
      return NextResponse.json({ ok: false, db: 'error', checkedAt }, { status: 503 });
    }
    return NextResponse.json({ ok: true, db: 'up', checkedAt });
  } catch (err) {
    console.error('[health] database unreachable', err);
    return NextResponse.json({ ok: false, db: 'unreachable', checkedAt }, { status: 503 });
  }
}
