import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

/**
 * PUT /api/bags/[code]/sections/[sectionId]
 * Update a section
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ code: string; sectionId: string }> }
) {
  try {
    const { code, sectionId } = await params;
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

    // Verify section belongs to this bag
    const { data: section, error: sectionError } = await supabase
      .from('bag_sections')
      .select('id')
      .eq('id', sectionId)
      .eq('bag_id', bag.id)
      .single();

    if (sectionError || !section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    // Parse request body
    const body = await request.json();
    const updates: any = {};

    if (body.name !== undefined) {
      if (typeof body.name !== 'string' || body.name.trim().length === 0) {
        return NextResponse.json({ error: 'Section name cannot be empty' }, { status: 400 });
      }
      updates.name = body.name.trim();
    }

    if (body.description !== undefined) {
      updates.description = body.description?.trim() || null;
    }

    if (body.sort_index !== undefined) {
      updates.sort_index = Number(body.sort_index);
    }

    if (body.collapsed_by_default !== undefined) {
      updates.collapsed_by_default = Boolean(body.collapsed_by_default);
    }

    updates.updated_at = new Date().toISOString();

    // Update section
    const { data: updatedSection, error: updateError } = await supabase
      .from('bag_sections')
      .update(updates)
      .eq('id', sectionId)
      .select()
      .single();

    if (updateError) {
      if (updateError.code === '23505') {
        return NextResponse.json({ error: 'A section with this name already exists' }, { status: 400 });
      }
      console.error('Error updating section:', updateError);
      return NextResponse.json({ error: 'Failed to update section' }, { status: 500 });
    }

    return NextResponse.json(updatedSection);
  } catch (error) {
    console.error('Unexpected error in PUT /api/bags/[code]/sections/[sectionId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/bags/[code]/sections/[sectionId]
 * Delete a section (items become unsectioned)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ code: string; sectionId: string }> }
) {
  try {
    const { code, sectionId } = await params;
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

    // Verify section belongs to this bag
    const { data: section, error: sectionError } = await supabase
      .from('bag_sections')
      .select('id')
      .eq('id', sectionId)
      .eq('bag_id', bag.id)
      .single();

    if (sectionError || !section) {
      return NextResponse.json({ error: 'Section not found' }, { status: 404 });
    }

    // Delete section (items' section_id will be set to NULL via ON DELETE SET NULL)
    const { error: deleteError } = await supabase
      .from('bag_sections')
      .delete()
      .eq('id', sectionId);

    if (deleteError) {
      console.error('Error deleting section:', deleteError);
      return NextResponse.json({ error: 'Failed to delete section' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Unexpected error in DELETE /api/bags/[code]/sections/[sectionId]:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
