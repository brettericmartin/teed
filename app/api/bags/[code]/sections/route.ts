import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

/**
 * GET /api/bags/[code]/sections
 * Get all sections for a bag
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const supabase = await createServerSupabase();

    // Get the bag
    const { data: bag, error: bagError } = await supabase
      .from('bags')
      .select('id, owner_id, is_public')
      .eq('code', code)
      .single();

    if (bagError || !bag) {
      return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
    }

    // Check access (public bag or owner)
    const { data: { user } } = await supabase.auth.getUser();
    if (!bag.is_public && (!user || bag.owner_id !== user.id)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get sections
    const { data: sections, error: sectionsError } = await supabase
      .from('bag_sections')
      .select('*')
      .eq('bag_id', bag.id)
      .order('sort_index');

    if (sectionsError) {
      console.error('Error fetching sections:', sectionsError);
      return NextResponse.json({ error: 'Failed to fetch sections' }, { status: 500 });
    }

    return NextResponse.json(sections || []);
  } catch (error) {
    console.error('Unexpected error in GET /api/bags/[code]/sections:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/bags/[code]/sections
 * Create a new section for a bag
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const supabase = await createServerSupabase();

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get the bag and verify ownership
    const { data: bag, error: bagError } = await supabase
      .from('bags')
      .select('id, owner_id')
      .eq('code', code)
      .single();

    if (bagError || !bag) {
      return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
    }

    if (bag.owner_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Parse request body
    const body = await request.json();
    const { name, description, collapsed_by_default } = body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json({ error: 'Section name is required' }, { status: 400 });
    }

    // Get max sort_index for this bag
    const { data: maxSection } = await supabase
      .from('bag_sections')
      .select('sort_index')
      .eq('bag_id', bag.id)
      .order('sort_index', { ascending: false })
      .limit(1)
      .single();

    const nextSortIndex = (maxSection?.sort_index ?? -1) + 1;

    // Create section
    const { data: section, error: createError } = await supabase
      .from('bag_sections')
      .insert({
        bag_id: bag.id,
        name: name.trim(),
        description: description?.trim() || null,
        sort_index: nextSortIndex,
        collapsed_by_default: collapsed_by_default || false,
      })
      .select()
      .single();

    if (createError) {
      if (createError.code === '23505') {
        return NextResponse.json({ error: 'A section with this name already exists' }, { status: 400 });
      }
      console.error('Error creating section:', createError);
      return NextResponse.json({ error: 'Failed to create section' }, { status: 500 });
    }

    return NextResponse.json(section, { status: 201 });
  } catch (error) {
    console.error('Unexpected error in POST /api/bags/[code]/sections:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
