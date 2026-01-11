import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import type { CodeClaimResult } from '@/lib/types/beta';

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

    // Look up the code (case-insensitive)
    const { data: codeRecord, error } = await supabase
      .from('beta_invite_codes')
      .select('*')
      .ilike('code', code.trim())
      .single();

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
    if (codeRecord.expires_at && new Date(codeRecord.expires_at) < new Date()) {
      return NextResponse.json({
        valid: false,
        error: 'This invite code has expired',
      });
    }

    // Check if maxed out
    if (codeRecord.current_uses >= codeRecord.max_uses) {
      return NextResponse.json({
        valid: false,
        error: 'This invite code has reached its maximum uses',
      });
    }

    // Code is valid!
    return NextResponse.json({
      valid: true,
      tier: codeRecord.tier,
      remaining_uses: codeRecord.max_uses - codeRecord.current_uses,
    });
  } catch (error) {
    console.error('Error validating code:', error);
    return NextResponse.json(
      { valid: false, error: 'Failed to validate code' },
      { status: 500 }
    );
  }
}
