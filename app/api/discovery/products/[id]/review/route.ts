/**
 * Product Review API
 *
 * Approve or reject a discovered product.
 * POST /api/discovery/products/[id]/review
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAdminUser } from '@/lib/adminAuth';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify admin access
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { action, notes } = body;

    // Validate action
    const validActions = ['approve', 'reject', 'archive', 'reset'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action: ${action}`, validActions },
        { status: 400 }
      );
    }

    // Map action to status
    const statusMap: Record<string, string> = {
      approve: 'approved',
      reject: 'rejected',
      archive: 'archived',
      reset: 'pending',
    };

    const newStatus = statusMap[action];

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Update product status
    const { data: product, error } = await supabase
      .from('discovered_products')
      .update({
        review_status: newStatus,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminUser.id,
        review_notes: notes || null,
      })
      .eq('id', id)
      .select('id, product_name, brand, review_status')
      .single();

    if (error) {
      console.error('[Product Review API] Error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      product: {
        id: product.id,
        name: product.product_name,
        brand: product.brand,
        reviewStatus: product.review_status,
      },
      message: `Product ${action}d successfully`,
    });
  } catch (error) {
    console.error('[Product Review API] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * Bulk review multiple products
 * PUT /api/discovery/products/[id]/review (where id = "bulk")
 */
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Only allow bulk operations on "bulk" endpoint
    if (id !== 'bulk') {
      return NextResponse.json(
        { error: 'Use POST for single product review' },
        { status: 400 }
      );
    }

    // Verify admin access
    const adminUser = await getAdminUser();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request body
    const body = await request.json();
    const { productIds, action, notes } = body;

    if (!Array.isArray(productIds) || productIds.length === 0) {
      return NextResponse.json(
        { error: 'productIds must be a non-empty array' },
        { status: 400 }
      );
    }

    // Validate action
    const validActions = ['approve', 'reject', 'archive', 'reset'];
    if (!validActions.includes(action)) {
      return NextResponse.json(
        { error: `Invalid action: ${action}`, validActions },
        { status: 400 }
      );
    }

    const statusMap: Record<string, string> = {
      approve: 'approved',
      reject: 'rejected',
      archive: 'archived',
      reset: 'pending',
    };

    const newStatus = statusMap[action];

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Bulk update
    const { data: products, error } = await supabase
      .from('discovered_products')
      .update({
        review_status: newStatus,
        reviewed_at: new Date().toISOString(),
        reviewed_by: adminUser.id,
        review_notes: notes || null,
      })
      .in('id', productIds)
      .select('id');

    if (error) {
      console.error('[Product Review API] Bulk error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      updated: products?.length || 0,
      message: `${products?.length || 0} products ${action}d successfully`,
    });
  } catch (error) {
    console.error('[Product Review API] Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
