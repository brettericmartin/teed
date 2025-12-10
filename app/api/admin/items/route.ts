import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAdminApi } from '@/lib/withAdmin';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/items
 * Get item analytics: brand rankings, popular items, duplicates
 */
export async function GET(request: NextRequest) {
  const result = await withAdminApi('moderator');
  if ('error' in result) return result.error;

  const { searchParams } = new URL(request.url);
  const view = searchParams.get('view') || 'overview'; // overview, brands, items, duplicates
  const search = searchParams.get('search');
  const brand = searchParams.get('brand');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '20');
  const offset = (page - 1) * limit;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  // Overview stats
  if (view === 'overview') {
    // Get total items
    const { count: totalItems } = await supabase
      .from('bag_items')
      .select('*', { count: 'exact', head: true });

    // Get total bags with items
    const { data: bagsWithItems } = await supabase
      .from('bag_items')
      .select('bag_id');
    const uniqueBags = new Set(bagsWithItems?.map((b) => b.bag_id) || []);

    // Get items with brands
    const { count: itemsWithBrand } = await supabase
      .from('bag_items')
      .select('*', { count: 'exact', head: true })
      .not('brand', 'is', null);

    // Get brand distribution
    const { data: allItems } = await supabase
      .from('bag_items')
      .select('brand, custom_name');

    const brandCounts: Record<string, number> = {};
    const nameCounts: Record<string, number> = {};

    allItems?.forEach((item) => {
      if (item.brand) {
        brandCounts[item.brand] = (brandCounts[item.brand] || 0) + 1;
      }
      if (item.custom_name) {
        const normalizedName = item.custom_name.toLowerCase().trim();
        nameCounts[normalizedName] = (nameCounts[normalizedName] || 0) + 1;
      }
    });

    const topBrands = Object.entries(brandCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    // Find potential duplicates (items with same name in different bags)
    const duplicates = Object.entries(nameCounts)
      .filter(([, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));

    return NextResponse.json({
      totalItems: totalItems || 0,
      totalBagsWithItems: uniqueBags.size,
      itemsWithBrand: itemsWithBrand || 0,
      uniqueBrands: Object.keys(brandCounts).length,
      topBrands,
      potentialDuplicates: duplicates,
    });
  }

  // Brand rankings
  if (view === 'brands') {
    const { data: allItems } = await supabase
      .from('bag_items')
      .select('brand')
      .not('brand', 'is', null);

    const brandCounts: Record<string, number> = {};
    allItems?.forEach((item) => {
      if (item.brand) {
        brandCounts[item.brand] = (brandCounts[item.brand] || 0) + 1;
      }
    });

    let brands = Object.entries(brandCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);

    // Filter by search
    if (search) {
      brands = brands.filter((b) =>
        b.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = brands.length;
    const paginatedBrands = brands.slice(offset, offset + limit);

    return NextResponse.json({
      brands: paginatedBrands,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  }

  // All items list
  if (view === 'items') {
    let query = supabase
      .from('bag_items')
      .select(
        `
        id,
        custom_name,
        brand,
        photo_url,
        notes,
        created_at,
        bag_id,
        bags!inner (
          id,
          code,
          title,
          owner_id,
          profiles!bags_owner_id_fkey (
            handle,
            display_name
          )
        )
      `,
        { count: 'exact' }
      )
      .order('created_at', { ascending: false });

    // Filter by brand
    if (brand) {
      query = query.eq('brand', brand);
    }

    // Search by name
    if (search) {
      query = query.ilike('custom_name', `%${search}%`);
    }

    query = query.range(offset, offset + limit - 1);

    const { data: items, error, count } = await query;

    if (error) {
      console.error('Error fetching items:', error);
      return NextResponse.json({ error: 'Failed to fetch items' }, { status: 500 });
    }

    // Transform data
    const transformedItems = items?.map((item) => {
      const bag = Array.isArray(item.bags) ? item.bags[0] : item.bags;
      const profile = bag?.profiles
        ? Array.isArray(bag.profiles)
          ? bag.profiles[0]
          : bag.profiles
        : null;

      return {
        id: item.id,
        name: item.custom_name,
        brand: item.brand,
        photo_url: item.photo_url,
        notes: item.notes,
        created_at: item.created_at,
        bag: bag
          ? {
              id: bag.id,
              code: bag.code,
              title: bag.title,
              owner: profile
                ? {
                    handle: profile.handle,
                    display_name: profile.display_name,
                  }
                : null,
            }
          : null,
      };
    });

    return NextResponse.json({
      items: transformedItems || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  }

  // Duplicate detection
  if (view === 'duplicates') {
    const { data: allItems } = await supabase
      .from('bag_items')
      .select(
        `
        id,
        custom_name,
        brand,
        photo_url,
        bag_id,
        bags!inner (
          id,
          code,
          title,
          owner_id,
          profiles!bags_owner_id_fkey (
            handle
          )
        )
      `
      );

    // Group by normalized name
    const nameGroups: Record<
      string,
      Array<{
        id: string;
        name: string;
        brand: string | null;
        photo_url: string | null;
        bag_code: string;
        bag_title: string;
        owner_handle: string;
      }>
    > = {};

    allItems?.forEach((item) => {
      if (!item.custom_name) return;
      const normalizedName = item.custom_name.toLowerCase().trim();

      if (!nameGroups[normalizedName]) {
        nameGroups[normalizedName] = [];
      }

      const bag = Array.isArray(item.bags) ? item.bags[0] : item.bags;
      const profile = bag?.profiles
        ? Array.isArray(bag.profiles)
          ? bag.profiles[0]
          : bag.profiles
        : null;

      nameGroups[normalizedName].push({
        id: item.id,
        name: item.custom_name,
        brand: item.brand,
        photo_url: item.photo_url,
        bag_code: bag?.code || '',
        bag_title: bag?.title || '',
        owner_handle: profile?.handle || 'unknown',
      });
    });

    // Filter to only groups with duplicates
    let duplicateGroups = Object.entries(nameGroups)
      .filter(([, items]) => items.length > 1)
      .map(([name, items]) => ({
        name: items[0].name, // Use original case from first item
        count: items.length,
        items,
      }))
      .sort((a, b) => b.count - a.count);

    // Search filter
    if (search) {
      duplicateGroups = duplicateGroups.filter((g) =>
        g.name.toLowerCase().includes(search.toLowerCase())
      );
    }

    const total = duplicateGroups.length;
    const paginatedGroups = duplicateGroups.slice(offset, offset + limit);

    return NextResponse.json({
      duplicates: paginatedGroups,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    });
  }

  return NextResponse.json({ error: 'Invalid view parameter' }, { status: 400 });
}
