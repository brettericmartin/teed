import { NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import { getAdminUser } from '@/lib/adminAuth';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || 'pending';
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');
    const sortBy = searchParams.get('sortBy') || 'occurrence_count';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const supabase = await createServerSupabase();

    // Build query
    let query = supabase
      .from('unrecognized_domains')
      .select('*', { count: 'exact' });

    // Filter by status
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // Sort
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Pagination
    query = query.range(offset, offset + limit - 1);

    const { data: domains, error, count } = await query;

    if (error) {
      console.error('Error fetching unrecognized domains:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Get summary stats
    const { data: stats } = await supabase
      .from('unrecognized_domains')
      .select('status')
      .then(result => {
        const statCounts = {
          pending: 0,
          added: 0,
          ignored: 0,
          blocked: 0,
          total: result.data?.length || 0,
        };

        result.data?.forEach(d => {
          statCounts[d.status as keyof typeof statCounts]++;
        });

        return { data: statCounts };
      });

    return NextResponse.json({
      domains: domains || [],
      total: count || 0,
      stats,
    });
  } catch (error) {
    console.error('Unrecognized domains API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const admin = await getAdminUser();
    if (!admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, status, notes } = body;

    if (!id || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createServerSupabase();

    const updateData: Record<string, unknown> = {
      status,
      reviewed_by: admin.id,
      reviewed_at: new Date().toISOString(),
    };

    if (notes !== undefined) {
      updateData.notes = notes;
    }

    if (status === 'added') {
      updateData.added_to_database_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('unrecognized_domains')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating domain:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ domain: data });
  } catch (error) {
    console.error('Update domain error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
