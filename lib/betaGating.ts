import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Check if a user has beta access (approved beta_tier on their profile).
 * Returns the beta_tier if approved, or null if not.
 */
export async function checkBetaAccess(
  supabase: SupabaseClient,
  userId: string
): Promise<{ tier: string | null; approved: boolean }> {
  const { data: profile } = await supabase
    .from('profiles')
    .select('beta_tier')
    .eq('id', userId)
    .single();

  const tier = profile?.beta_tier || null;
  return { tier, approved: !!tier };
}
