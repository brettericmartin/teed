import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

type RouteContext = {
  params: Promise<{
    code: string;
  }>;
};

// Helper to get bag ID from code
async function getBagIdFromCode(supabase: any, code: string): Promise<string | null> {
  const { data: bag } = await supabase
    .from('bags')
    .select('id')
    .eq('code', code)
    .single();
  return bag?.id || null;
}

// POST /api/bags/[code]/save - Save a bag
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabase();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await context.params;

    // Get bag ID from code
    const bagId = await getBagIdFromCode(supabase, code);
    if (!bagId) {
      return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
    }

    // Check if already saved
    const { data: existingSave } = await supabase
      .from('saved_bags')
      .select('id')
      .eq('user_id', user.id)
      .eq('bag_id', bagId)
      .single();

    if (existingSave) {
      return NextResponse.json({ error: 'Bag already saved' }, { status: 400 });
    }

    // Create save relationship
    const { data: save, error: saveError } = await supabase
      .from('saved_bags')
      .insert({
        user_id: user.id,
        bag_id: bagId,
      })
      .select()
      .single();

    if (saveError) {
      console.error('Save error:', saveError);
      return NextResponse.json({ error: 'Failed to save bag' }, { status: 500 });
    }

    return NextResponse.json({ success: true, save }, { status: 201 });
  } catch (error) {
    console.error('Save API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/bags/[code]/save - Unsave a bag
export async function DELETE(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabase();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { code } = await context.params;

    // Get bag ID from code
    const bagId = await getBagIdFromCode(supabase, code);
    if (!bagId) {
      return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
    }

    // Delete save relationship
    const { error: unsaveError } = await supabase
      .from('saved_bags')
      .delete()
      .eq('user_id', user.id)
      .eq('bag_id', bagId);

    if (unsaveError) {
      console.error('Unsave error:', unsaveError);
      return NextResponse.json({ error: 'Failed to unsave bag' }, { status: 500 });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Unsave API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/bags/[code]/save - Check if current user has saved this bag
export async function GET(request: NextRequest, context: RouteContext) {
  try {
    const supabase = await createServerSupabase();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ isSaved: false }, { status: 200 });
    }

    const { code } = await context.params;

    // Get bag ID from code
    const bagId = await getBagIdFromCode(supabase, code);
    if (!bagId) {
      return NextResponse.json({ isSaved: false }, { status: 200 });
    }

    // Check if saved
    const { data: save } = await supabase
      .from('saved_bags')
      .select('id')
      .eq('user_id', user.id)
      .eq('bag_id', bagId)
      .single();

    return NextResponse.json({ isSaved: !!save }, { status: 200 });
  } catch (error) {
    console.error('Check save API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
