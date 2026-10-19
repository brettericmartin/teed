import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let cached: SupabaseClient | null = null;

/**
 * Lazily constructed anon-key Supabase client for server-side reads of public
 * data (public bags/profiles, OG images, feeds, sitemap). Subject to RLS.
 *
 * Built on first call rather than at module scope so a build with no env
 * (Vercel preview "collect page data") cannot throw "supabaseKey is required".
 * For the browser client use `@/lib/supabaseClient`; for a request-scoped
 * authed client use `createServerSupabase` from `@/lib/serverSupabase`.
 */
export function getSupabasePublic(): SupabaseClient {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url) throw new Error('NEXT_PUBLIC_SUPABASE_URL is not set');
  if (!key) throw new Error('NEXT_PUBLIC_SUPABASE_ANON_KEY is not set');

  cached = createClient(url, key);
  return cached;
}
