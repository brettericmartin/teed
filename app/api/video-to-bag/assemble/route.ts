import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { assembleBag } from '@/lib/videoPipeline/draftBagAssembler';
import type { AssembleBagInput } from '@/lib/videoPipeline/types';
import { createServerSupabase } from '@/lib/serverSupabase';

/**
 * POST /api/video-to-bag/assemble
 * Creates a real bag from a reviewed draft.
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await requireAdmin();

    // Get the admin's user ID for bag ownership
    const supabase = await createServerSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { draftBag, selectedProductIds, editedProducts, bagTitle, bagDescription } = body;

    if (!draftBag || !selectedProductIds || !Array.isArray(selectedProductIds)) {
      return NextResponse.json(
        { error: 'draftBag and selectedProductIds are required' },
        { status: 400 },
      );
    }

    if (selectedProductIds.length === 0) {
      return NextResponse.json(
        { error: 'At least one product must be selected' },
        { status: 400 },
      );
    }

    const input: AssembleBagInput = {
      draftBag,
      selectedProductIds,
      editedProducts: editedProducts || {},
      bagTitle: bagTitle || draftBag.title,
      bagDescription,
      ownerId: user.id,
    };

    console.log(`[video-to-bag/assemble] Creating bag "${input.bagTitle}" with ${selectedProductIds.length} items for admin ${admin.handle}`);

    const result = await assembleBag(input);

    console.log(`[video-to-bag/assemble] Created bag ${result.bagCode} with ${result.itemCount} items, ${result.linkCount} links`);

    return NextResponse.json(result, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Server error';
    if (message.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    console.error('[video-to-bag/assemble] Error:', error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
