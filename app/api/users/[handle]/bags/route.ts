import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

/**
 * GET /api/users/[handle]/bags
 * Fetch all public bags for a user by their handle
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;
    const supabase = await createServerSupabase();

    // First, find the user by handle
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, handle, display_name, avatar_url, bio, created_at')
      .eq('handle', handle)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // Fetch user's public bags
    const { data: bags, error: bagsError } = await supabase
      .from('bags')
      .select('id, code, title, description, background_image, is_public, created_at, updated_at')
      .eq('owner_id', profile.id)
      .eq('is_public', true)
      .order('updated_at', { ascending: false });

    if (bagsError) {
      console.error('Error fetching user bags:', bagsError);
      return NextResponse.json(
        { error: 'Failed to fetch bags' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      profile,
      bags: bags || [],
      totalBags: bags?.length || 0,
    });
  } catch (error) {
    console.error('Error in GET /api/users/[handle]/bags:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
