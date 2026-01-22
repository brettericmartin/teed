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
    const { id, ids, status, notes } = body;

    // Support both single id and bulk ids array
    const targetIds = ids || (id ? [id] : []);

    if (targetIds.length === 0 || !status) {
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

    // Use .in() for bulk updates
    const { data, error } = await supabase
      .from('unrecognized_domains')
      .update(updateData)
      .in('id', targetIds)
      .select();

    if (error) {
      console.error('Error updating domain(s):', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Return appropriate response for single vs bulk
    if (ids) {
      return NextResponse.json({ domains: data, count: data?.length || 0 });
    }
    return NextResponse.json({ domain: data?.[0] });
  } catch (error) {
    console.error('Update domain error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
