import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import type { CreateBagCollectionInput } from '@/lib/types/bagCollection';

/**
 * GET /api/collections
 * Get all collections for the authenticated user or a specific profile
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();
    const { searchParams } = new URL(request.url);
    const profileHandle = searchParams.get('handle');
    const includeBags = searchParams.get('includeBags') === 'true';

    // If handle provided, get public collections for that profile
    if (profileHandle) {
      // Get profile ID
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('handle', profileHandle)
        .single();

      if (profileError || !profile) {
        return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
      }

      // Get visible collections
      let query = supabase
        .from('bag_collections')
        .select(`
          id,
          name,
          description,
          emoji,
          sort_index,
          is_featured,
          created_at
          ${includeBags ? `,
          items:bag_collection_items(
            sort_index,
            bag:bags(
              id,
              code,
              title,
              description,
              cover_photo_id,
              is_public
            )
          )` : ''}
        `)
        .eq('owner_id', profile.id)
        .eq('is_visible', true)
        .order('sort_index', { ascending: true });

      const { data: collections, error } = await query;

      if (error) {
        console.error('Error fetching collections:', error);
        return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
      }

      return NextResponse.json(collections || []);
    }

    // Otherwise, get authenticated user's collections
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let query = supabase
      .from('bag_collections')
      .select(`
        id,
        name,
        description,
        emoji,
        sort_index,
        is_featured,
        is_visible,
        created_at,
        updated_at
        ${includeBags ? `,
        items:bag_collection_items(
          sort_index,
          bag:bags(
            id,
            code,
            title,
            description,
            cover_photo_id,
            is_public
          )
        )` : ''}
      `)
      .eq('owner_id', user.id)
      .order('sort_index', { ascending: true });

    const { data: collections, error } = await query;

    if (error) {
      console.error('Error fetching collections:', error);
      return NextResponse.json({ error: 'Failed to fetch collections' }, { status: 500 });
    }

    return NextResponse.json(collections || []);
  } catch (error) {
    console.error('Error in GET /api/collections:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/collections
 * Create a new collection
 */
export async function POST(request: NextRequest) {
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

    const body: CreateBagCollectionInput = await request.json();
    const { name, description, emoji, is_featured = false, bag_ids } = body;

    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    // Get next sort index
    const { data: existingCollections } = await supabase
      .from('bag_collections')
      .select('sort_index')
      .eq('owner_id', user.id)
      .order('sort_index', { ascending: false })
      .limit(1);

    const nextSortIndex = ((existingCollections?.[0]?.sort_index || 0) + 1);

    // Create collection
    const { data: collection, error: createError } = await supabase
      .from('bag_collections')
      .insert({
        owner_id: user.id,
        name: name.trim(),
        description: description?.trim() || null,
        emoji: emoji || null,
        is_featured,
        sort_index: nextSortIndex,
      })
      .select()
      .single();

    if (createError) {
      if (createError.code === '23505') {
        return NextResponse.json(
          { error: 'A collection with this name already exists' },
          { status: 400 }
        );
      }
      console.error('Error creating collection:', createError);
      return NextResponse.json({ error: 'Failed to create collection' }, { status: 500 });
    }

    // Add bags to collection if provided
    if (bag_ids && bag_ids.length > 0) {
      // Verify bags belong to user
      const { data: userBags } = await supabase
        .from('bags')
        .select('id')
        .eq('owner_id', user.id)
        .in('id', bag_ids);

      const validBagIds = userBags?.map((b) => b.id) || [];

      if (validBagIds.length > 0) {
        const collectionItems = validBagIds.map((bagId, index) => ({
          collection_id: collection.id,
          bag_id: bagId,
          sort_index: index,
        }));

        await supabase.from('bag_collection_items').insert(collectionItems);
      }
    }

    return NextResponse.json(collection, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/collections:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
