import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import type { CreateRelatedBagInput, RelationshipType } from '@/lib/types/bagCollection';

type RouteParams = {
  params: Promise<{ code: string }>;
};

/**
 * GET /api/bags/[code]/related
 * Get related bags for a bag
 */
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;
    const supabase = await createServerSupabase();

    // Get authenticated user (optional)
    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Get bag
    const { data: bag, error: bagError } = await supabase
      .from('bags')
      .select('id, owner_id, is_public')
      .eq('code', code)
      .single();

    if (bagError || !bag) {
      return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
    }

    // Check authorization
    const isOwner = user?.id === bag.owner_id;
    if (!bag.is_public && !isOwner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Get related bags
    const { data: relatedBags, error: relatedError } = await supabase
      .from('related_bags')
      .select(`
        id,
        relationship_type,
        description,
        sort_index,
        created_at,
        related_bag:bags!related_bags_related_bag_id_fkey(
          id,
          code,
          title,
          description,
          cover_photo_id,
          is_public,
          owner:profiles!bags_owner_id_fkey(
            handle,
            display_name
          )
        )
      `)
      .eq('bag_id', bag.id)
      .order('sort_index', { ascending: true });

    if (relatedError) {
      console.error('Error fetching related bags:', relatedError);
      return NextResponse.json({ error: 'Failed to fetch related bags' }, { status: 500 });
    }

    // Filter out private bags for non-owners
    // Note: Supabase returns nested relations, handle both single object and array
    const visibleRelatedBags = relatedBags?.filter((rb) => {
      const relatedBag = Array.isArray(rb.related_bag) ? rb.related_bag[0] : rb.related_bag;
      return relatedBag?.is_public || (isOwner && relatedBag);
    }) || [];

    return NextResponse.json(visibleRelatedBags);
  } catch (error) {
    console.error('Error in GET /api/bags/[code]/related:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/bags/[code]/related
 * Add a related bag
 */
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;
    const supabase = await createServerSupabase();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get bag and verify ownership
    const { data: bag, error: bagError } = await supabase
      .from('bags')
      .select('id, owner_id')
      .eq('code', code)
      .single();

    if (bagError || !bag) {
      return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
    }

    if (bag.owner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const body = await request.json();
    const { related_bag_code, relationship_type = 'related', description } = body;

    if (!related_bag_code) {
      return NextResponse.json({ error: 'related_bag_code is required' }, { status: 400 });
    }

    // Get the related bag
    const { data: relatedBag, error: relatedBagError } = await supabase
      .from('bags')
      .select('id, is_public, owner_id')
      .eq('code', related_bag_code)
      .single();

    if (relatedBagError || !relatedBag) {
      return NextResponse.json({ error: 'Related bag not found' }, { status: 404 });
    }

    // Can only link to public bags or own bags
    if (!relatedBag.is_public && relatedBag.owner_id !== user.id) {
      return NextResponse.json({ error: 'Cannot link to private bag' }, { status: 400 });
    }

    // Cannot link to self
    if (relatedBag.id === bag.id) {
      return NextResponse.json({ error: 'Cannot link bag to itself' }, { status: 400 });
    }

    // Get next sort index
    const { data: existingRelated } = await supabase
      .from('related_bags')
      .select('sort_index')
      .eq('bag_id', bag.id)
      .order('sort_index', { ascending: false })
      .limit(1);

    const nextSortIndex = (existingRelated?.[0]?.sort_index || 0) + 1;

    // Create relationship
    const { data: created, error: createError } = await supabase
      .from('related_bags')
      .insert({
        bag_id: bag.id,
        related_bag_id: relatedBag.id,
        relationship_type,
        description: description?.trim() || null,
        sort_index: nextSortIndex,
      })
      .select(`
        id,
        relationship_type,
        description,
        sort_index,
        created_at,
        related_bag:bags!related_bags_related_bag_id_fkey(
          id,
          code,
          title,
          description,
          is_public,
          owner:profiles!bags_owner_id_fkey(
            handle,
            display_name
          )
        )
      `)
      .single();

    if (createError) {
      if (createError.code === '23505') {
        return NextResponse.json(
          { error: 'This bag is already linked' },
          { status: 400 }
        );
      }
      console.error('Error creating related bag:', createError);
      return NextResponse.json({ error: 'Failed to create relationship' }, { status: 500 });
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/bags/[code]/related:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/bags/[code]/related
 * Remove a related bag link
 */
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { code } = await params;
    const supabase = await createServerSupabase();

    // Check authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get bag and verify ownership
    const { data: bag, error: bagError } = await supabase
      .from('bags')
      .select('id, owner_id')
      .eq('code', code)
      .single();

    if (bagError || !bag) {
      return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
    }

    if (bag.owner_id !== user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const relationshipId = searchParams.get('id');

    if (!relationshipId) {
      return NextResponse.json({ error: 'Relationship ID is required' }, { status: 400 });
    }

    // Delete relationship
    const { error: deleteError } = await supabase
      .from('related_bags')
      .delete()
      .eq('id', relationshipId)
      .eq('bag_id', bag.id);

    if (deleteError) {
      console.error('Error deleting related bag:', deleteError);
      return NextResponse.json({ error: 'Failed to delete relationship' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in DELETE /api/bags/[code]/related:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
