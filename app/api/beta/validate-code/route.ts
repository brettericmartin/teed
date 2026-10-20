import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import type { CodeClaimResult, InviteCodeValidation } from '@/lib/types/beta';

/**
 * POST /api/beta/validate-code
 *
 * Validates an invite code without claiming it.
 * Used by the landing page to check if a code is valid before redirecting to signup.
 *
 * Body: { code: string }
 * Response: { valid: boolean, tier?: string, error?: string }
 */
export async function POST(request: NextRequest) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json(
        { valid: false, error: 'Please enter an invite code' },
        { status: 400 }
      );
    }

    const supabase = await createServerSupabase();

    // Validate through the SECURITY DEFINER RPC (exact, case-insensitive match).
    // It returns flags + tier only, never the row, so beta_invite_codes needs
    // no public SELECT policy. Zero rows = unknown code.
    const { data, error } = await supabase
      .rpc('validate_invite_code', { p_code: code.trim() })
      .maybeSingle();
    const codeRecord = data as InviteCodeValidation | null;

    if (error || !codeRecord) {
      return NextResponse.json({
        valid: false,
        error: 'Invalid invite code',
      });
    }

    // Check if revoked
    if (codeRecord.is_revoked) {
      return NextResponse.json({
        valid: false,
        error: 'This invite code is no longer active',
      });
    }

    // Check if expired
    if (codeRecord.is_expired) {
      return NextResponse.json({
        valid: false,
        error: 'This invite code has expired',
      });
    }

    // Check if maxed out / already claimed
    if (codeRecord.is_claimed) {
      return NextResponse.json({
        valid: false,
        error: 'This invite code has reached its maximum uses',
      });
    }

    // Code is valid!
    return NextResponse.json({
      valid: true,
      tier: codeRecord.tier,
    });
  } catch (error) {
    console.error('Error validating code:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to validate code' },
      { status: 500 }
    );
  }
}
