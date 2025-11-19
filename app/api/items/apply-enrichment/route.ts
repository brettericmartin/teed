import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

/**
 * POST /api/items/apply-enrichment
 * Applies approved enrichment suggestions
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createServerSupabase();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { bagId, approvedSuggestions } = body;

    if (!bagId || !approvedSuggestions || !Array.isArray(approvedSuggestions)) {
      return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
    }

    // Verify bag ownership
    const { data: bag, error: bagError } = await supabase
      .from('bags')
      .select('id, owner_id')
      .eq('id', bagId)
      .single();

    if (bagError || !bag || bag.owner_id !== user.id) {
      return NextResponse.json({ error: 'Bag not found or unauthorized' }, { status: 404 });
    }

    let detailsEnriched = 0;
    let linksAdded = 0;

    // Apply each approved suggestion
    for (const suggestion of approvedSuggestions) {
      const { itemId, brand, description, notes, link } = suggestion;

      // Update item details
      if (brand || description || notes) {
        const updateData: any = {};
        if (brand) updateData.brand = brand;
        if (description) updateData.custom_description = description;
        if (notes) updateData.notes = notes;

        const { error: updateError } = await supabase
          .from('bag_items')
          .update(updateData)
          .eq('id', itemId);

        if (!updateError) {
          detailsEnriched++;
        }
      }

      // Add link
      if (link) {
        // Try to convert to affiliate link
        let finalUrl = link.url;
        let affiliateProvider = 'none';

        try {
          const affiliateResponse = await fetch(
            `${request.nextUrl.origin}/api/affiliate/resolve`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                rawUrl: link.url,
                userId: user.id,
                itemId: itemId,
              }),
            }
          );

          if (affiliateResponse.ok) {
            const affiliateData = await affiliateResponse.json();
            finalUrl = affiliateData.affiliateUrl || link.url;
            affiliateProvider = affiliateData.provider || 'none';
          }
        } catch (error) {
          console.error('Failed to resolve affiliate URL:', error);
        }

        const { error: linkError } = await supabase.from('links').insert({
          bag_item_id: itemId,
          url: finalUrl,
          kind: 'product',
          label: link.label,
          is_auto_generated: true,
          metadata: {
            ai_source: link.source,
            ai_reasoning: link.reason,
            auto_generated_at: new Date().toISOString(),
            affiliate_provider: affiliateProvider,
          },
        });

        if (!linkError) {
          linksAdded++;
        }
      }
    }

    // Update bag timestamp
    await supabase
      .from('bags')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', bagId);

    return NextResponse.json({
      success: true,
      detailsEnriched,
      linksAdded,
    });
  } catch (error) {
    console.error('Error applying enrichments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
