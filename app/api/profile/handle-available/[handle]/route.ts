import { createServerSupabase } from '@/lib/serverSupabase';
import { NextRequest, NextResponse } from 'next/server';

/**
 * GET /api/profile/handle-available/[handle]
 * Check if a handle is available for use
 * Returns: { available: boolean, handle: string }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;

    if (!handle) {
      return NextResponse.json(
        { error: 'Handle parameter is required' },
        { status: 400 }
      );
    }

    const cleanHandle = handle.trim().toLowerCase();

    // Validate handle format
    if (cleanHandle.length < 3 || cleanHandle.length > 30) {
      return NextResponse.json({
        available: false,
        handle: cleanHandle,
        error: 'Handle must be between 3 and 30 characters'
      });
    }

    if (!/^[a-z0-9_]+$/.test(cleanHandle)) {
      return NextResponse.json({
        available: false,
        handle: cleanHandle,
        error: 'Handle can only contain lowercase letters, numbers, and underscores'
      });
    }

    const supabase = await createServerSupabase();

    // Check if handle exists in database
    const { data: existingProfile, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('handle', cleanHandle)
      .maybeSingle();

    if (error) {
      console.error('Error checking handle availability:', error);
      return NextResponse.json(
        { error: 'Failed to check handle availability' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      available: !existingProfile,
      handle: cleanHandle
    });
  } catch (error) {
    console.error('GET /api/profile/handle-available error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
