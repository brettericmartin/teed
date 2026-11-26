/**
 * POST /api/account/delete
 *
 * Deletes the signed-in person's account and everything in it: bags, items,
 * links, photos, follows, saved bags and the sign-in itself. The person must
 * type their handle to confirm. Admin accounts are refused here, so the site
 * can't lose its last admin by accident.
 *
 * Order matters: a few tables point at a person or their bags without
 * cascading (analytics, bags copied from theirs, invite and admin records).
 * Those references are cleared first, then the photos in storage, then the
 * sign-in, which removes the profile and, through it, the bags and items.
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import { getSupabaseAdmin } from '@/lib/supabaseAdmin';
import type { SupabaseClient } from '@supabase/supabase-js';

export const maxDuration = 60;

const BUCKETS = ['item-photos', 'avatars'];

// Columns that point at a person without cascading, used only for admin work
const ADMIN_REFERENCES: [string, string][] = [
  ['beta_applications', 'approved_by'],
  ['content_ideas', 'validated_by_admin_id'],
  ['content_search_queries', 'updated_by_admin_id'],
  ['content_search_queries', 'created_by_admin_id'],
  ['extraction_feedback', 'admin_id'],
  ['unrecognized_domains', 'reviewed_by'],
  ['beta_settings', 'updated_by'],
  ['discovered_products', 'reviewed_by'],
  ['strategic_proposals', 'decided_by'],
];

async function listAllFiles(admin: SupabaseClient, bucket: string, prefix: string): Promise<string[]> {
  const out: string[] = [];
  const queue = [prefix];
  while (queue.length) {
    const dir = queue.shift() as string;
    for (let offset = 0; ; offset += 1000) {
      const { data, error } = await admin.storage.from(bucket).list(dir, { limit: 1000, offset });
      if (error || !data || data.length === 0) break;
      for (const entry of data) {
        const path = `${dir}/${entry.name}`;
        // Folders come back without an id
        if (entry.id) out.push(path);
        else queue.push(path);
      }
      if (data.length < 1000) break;
    }
  }
  return out;
}

async function step(name: string, run: () => PromiseLike<{ error: { message: string } | null }>) {
  const { error } = await run();
  if (error) throw new Error(`${name}: ${error.message}`);
}

export async function POST(request: NextRequest) {
  const supabase = await createServerSupabase();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { confirmHandle?: string } = {};
  try {
    body = await request.json();
  } catch {}

  const admin = getSupabaseAdmin();
  const userId = user.id;

  const { data: profile } = await admin
    .from('profiles')
    .select('handle, admin_role')
    .eq('id', userId)
    .single();

  if (!profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }
  if (profile.admin_role) {
    return NextResponse.json(
      { error: 'Admin accounts can’t be deleted from settings. Remove the admin role first.' },
      { status: 403 }
    );
  }
  const typed = (body.confirmHandle || '').trim().replace(/^@/, '').toLowerCase();
  if (!typed || typed !== String(profile.handle).toLowerCase()) {
    return NextResponse.json({ error: 'Type your handle exactly to confirm.' }, { status: 400 });
  }

  try {
    const { data: bags } = await admin.from('bags').select('id').eq('owner_id', userId);
    const bagIds = (bags || []).map((b) => b.id as string);
    let itemIds: string[] = [];
    if (bagIds.length) {
      const { data: items } = await admin.from('bag_items').select('id').in('bag_id', bagIds);
      itemIds = (items || []).map((i) => i.id as string);
    }

    // 1. References that don't cascade
    await step('analytics actor', () => admin.from('analytics_events').update({ actor_id: null }).eq('actor_id', userId));
    for (let i = 0; i < bagIds.length; i += 200) {
      const chunk = bagIds.slice(i, i + 200);
      await step('analytics bags', () => admin.from('analytics_events').delete().in('bag_id', chunk));
      await step('copied bags', () => admin.from('bags').update({ parent_bag_id: null }).in('parent_bag_id', chunk).neq('owner_id', userId));
    }
    for (let i = 0; i < itemIds.length; i += 200) {
      const chunk = itemIds.slice(i, i + 200);
      await step('analytics items', () => admin.from('analytics_events').delete().in('bag_item_id', chunk));
    }
    await step('copied from', () => admin.from('bags').update({ derived_from_owner_id: null }).eq('derived_from_owner_id', userId));
    await step('invited people', () => admin.from('profiles').update({ invited_by_id: null }).eq('invited_by_id', userId));
    await step('share origin', () => admin.from('share_links').update({ origin_creator_id: null }).eq('origin_creator_id', userId));
    await step('invite claimed', () => admin.from('beta_invite_codes').update({ claimed_by: null }).eq('claimed_by', userId));
    await step('invite revoked', () => admin.from('beta_invite_codes').update({ revoked_by: null }).eq('revoked_by', userId));
    await step('corrections', () => admin.from('identification_corrections').update({ user_id: null }).eq('user_id', userId));
    // Admin-only records (admins can't reach this route, but keep the order safe)
    for (const [table, column] of ADMIN_REFERENCES) {
      await step(`${table}.${column}`, () => admin.from(table).update({ [column]: null }).eq(column, userId));
    }

    // Photos they uploaded; another person's item can point at one, so unhook those first
    const { data: media } = await admin.from('media_assets').select('id').eq('owner_id', userId);
    const mediaIds = (media || []).map((m) => m.id as string);
    for (let i = 0; i < mediaIds.length; i += 200) {
      const chunk = mediaIds.slice(i, i + 200);
      const others = bagIds.length
        ? admin.from('bag_items').update({ custom_photo_id: null }).in('custom_photo_id', chunk).not('bag_id', 'in', `(${bagIds.join(',')})`)
        : admin.from('bag_items').update({ custom_photo_id: null }).in('custom_photo_id', chunk);
      await step('photos used elsewhere', () => others);
    }

    // Bags go before the sign-in: their delete trigger writes to the profile's history,
    // which needs the profile to still exist. Items, links and saves cascade.
    if (bagIds.length) {
      await step('own bag parents', () => admin.from('bags').update({ parent_bag_id: null }).eq('owner_id', userId));
      await step('bags', () => admin.from('bags').delete().eq('owner_id', userId));
    }

    // 2. Photos in storage (every path starts with the person's id)
    for (const bucket of BUCKETS) {
      const files = await listAllFiles(admin, bucket, userId);
      for (let i = 0; i < files.length; i += 100) {
        const { error } = await admin.storage.from(bucket).remove(files.slice(i, i + 100));
        if (error) throw new Error(`storage ${bucket}: ${error.message}`);
      }
    }

    // 3. The sign-in; the profile, follows and history go with it
    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) throw new Error(`auth: ${deleteError.message}`);

    // 4. Photo records, now that nothing points at them
    for (let i = 0; i < mediaIds.length; i += 200) {
      const chunk = mediaIds.slice(i, i + 200);
      await step('media', () => admin.from('media_assets').delete().in('id', chunk));
    }
  } catch (err) {
    console.error('[account/delete] failed for', userId, err);
    return NextResponse.json(
      { error: 'We couldn’t finish deleting your account. Please try again, or send us feedback and we’ll do it for you.' },
      { status: 500 }
    );
  }

  // Clear the session cookies on this browser
  await supabase.auth.signOut().catch(() => {});
  console.log('[account/delete] deleted', userId);
  return NextResponse.json({ deleted: true });
}
