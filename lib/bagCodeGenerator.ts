/**
 * Bag Code Generator
 *
 * Generates unique, URL-friendly bag codes based on the title.
 */

import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Generate a unique bag code from a title.
 * Checks for existing codes and adds suffixes as needed.
 */
export async function generateUniqueBagCode(
  supabase: SupabaseClient,
  title?: string
): Promise<string> {
  // Generate base code from title
  let baseCode = (title || 'my-bag')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') // Remove leading/trailing hyphens
    .substring(0, 50); // Limit length

  if (!baseCode) {
    baseCode = 'bag';
  }

  // Check for existing codes globally (bags_code_key is a global unique constraint)
  let code = baseCode;
  let suffix = 2;

  while (true) {
    const { data: existingBag } = await supabase
      .from('bags')
      .select('id')
      .eq('code', code)
      .maybeSingle();

    if (!existingBag) {
      // Code is unique globally
      break;
    }

    // Code exists, try with suffix
    code = `${baseCode}-${suffix}`;
    suffix++;

    if (suffix > 100) {
      // Fallback to random suffix
      code = `${baseCode}-${Date.now().toString(36)}`;
      break;
    }
  }

  return code;
}
