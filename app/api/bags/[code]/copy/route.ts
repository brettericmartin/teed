import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import { checkBetaAccess } from '@/lib/betaGating';

/**
 * POST /api/bags/[code]/copy
 * Copy a bag (and all its items/links) to the current user's account
 *
 * Returns:
 * {
 *   id: uuid
 *   code: string
 *   title: string
 *   ownerHandle: string
 *   message: string
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;
    const supabase = await createServerSupabase();

    // Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check beta access
    const { approved } = await checkBetaAccess(supabase, user.id);
    if (!approved) {
      return NextResponse.json(
        { error: 'Beta access required to copy bags. Please apply or wait for approval.' },
        { status: 403 }
      );
    }

    // Get user's profile to get their handle
    const { data: profile } = await supabase
      .from('profiles')
      .select('handle')
      .eq('id', user.id)
      .single();

    if (!profile?.handle) {
      return NextResponse.json(
        { error: 'Profile not found' },
        { status: 404 }
      );
    }

    // Get the source bag by code (need to find owner first since code is per-user)
    // We'll search all public bags with this code
    const { data: sourceBag, error: bagError } = await supabase
      .from('bags')
      .select('*')
      .eq('code', code)
      .eq('is_public', true)
      .single();

    if (bagError || !sourceBag) {
      return NextResponse.json({ error: 'Bag not found' }, { status: 404 });
    }

    // Don't allow copying your own bag
    if (sourceBag.owner_id === user.id) {
      return NextResponse.json(
        { error: 'Cannot copy your own bag' },
        { status: 400 }
      );
    }

    // Get all items from the source bag
    const { data: sourceItems, error: itemsError } = await supabase
      .from('bag_items')
      .select('*')
      .eq('bag_id', sourceBag.id)
      .order('sort_index', { ascending: true });

    if (itemsError) {
      console.error('Error fetching source items:', itemsError);
      return NextResponse.json(
        { error: 'Failed to fetch bag items' },
        { status: 500 }
      );
    }

    // Get all links for the source items
    const sourceItemIds = sourceItems?.map((item) => item.id) || [];
    let sourceLinks: any[] = [];

    if (sourceItemIds.length > 0) {
      const { data: linksData } = await supabase
        .from('links')
        .select('*')
        .in('bag_item_id', sourceItemIds);

      sourceLinks = linksData || [];
    }

    // Generate a unique code for the new bag
    const baseTitle = `Copy of ${sourceBag.title}`;
    let baseCode = baseTitle
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .substring(0, 50);

    if (!baseCode) {
      baseCode = 'copied-bag';
    }

    let newCode = baseCode;
    let suffix = 2;

    while (true) {
      const { data: existingBag } = await supabase
        .from('bags')
        .select('id')
        .eq('owner_id', user.id)
        .eq('code', newCode)
        .maybeSingle();

      if (!existingBag) break;

      newCode = `${baseCode}-${suffix}`;
      suffix++;

      if (suffix > 100) {
        return NextResponse.json(
          { error: 'Failed to generate unique code' },
          { status: 500 }
        );
      }
    }

    // Create the new bag
    const { data: newBag, error: createError } = await supabase
      .from('bags')
      .insert({
        owner_id: user.id,
        title: baseTitle,
        description: sourceBag.description,
        is_public: false, // Start as private, user can make public later
        code: newCode,
        tags: sourceBag.tags || [],
        category: sourceBag.category,
        // Don't copy cover_photo_id or hero_item_id as those reference the original
      })
      .select()
      .single();

    if (createError || !newBag) {
      console.error('Error creating new bag:', createError);
      return NextResponse.json(
        { error: 'Failed to create bag copy' },
        { status: 500 }
      );
    }

    // Copy all items to the new bag
    const itemIdMap = new Map<string, string>(); // old item id -> new item id

    for (const sourceItem of sourceItems || []) {
      const { data: newItem, error: itemError } = await supabase
        .from('bag_items')
        .insert({
          bag_id: newBag.id,
          custom_name: sourceItem.custom_name,
          custom_description: sourceItem.custom_description,
          brand: sourceItem.brand,
          notes: sourceItem.notes,
          quantity: sourceItem.quantity,
          sort_index: sourceItem.sort_index,
          photo_url: sourceItem.photo_url, // Copy the photo URL directly
          // Don't copy custom_photo_id as that references the original user's media
          promo_codes: sourceItem.promo_codes,
          is_featured: sourceItem.is_featured,
        })
        .select()
        .single();

      if (itemError) {
        console.error('Error copying item:', itemError);
        continue; // Continue copying other items
      }

      if (newItem) {
        itemIdMap.set(sourceItem.id, newItem.id);
      }
    }

    // Copy all links to the new items
    for (const sourceLink of sourceLinks) {
      const newItemId = itemIdMap.get(sourceLink.bag_item_id);
      if (!newItemId) continue;

      const { error: linkError } = await supabase.from('links').insert({
        bag_item_id: newItemId,
        url: sourceLink.url,
        kind: sourceLink.kind,
        label: sourceLink.label,
        metadata: sourceLink.metadata,
        is_auto_generated: false, // Mark as not auto-generated since it's a copy
      });

      if (linkError) {
        console.error('Error copying link:', linkError);
        // Continue copying other links
      }
    }

    return NextResponse.json(
      {
        id: newBag.id,
        code: newBag.code,
        title: newBag.title,
        ownerHandle: profile.handle,
        itemCount: itemIdMap.size,
        message: `Successfully copied bag with ${itemIdMap.size} items`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/bags/[code]/copy:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
