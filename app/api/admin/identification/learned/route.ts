import { NextResponse } from 'next/server';
import { getAdminUser } from '@/lib/adminAuth';
import { createClient } from '@supabase/supabase-js';

export async function GET() {
  const admin = await getAdminUser();
  if (!admin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
  }

  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Get total learned products
    const { count: totalProducts } = await supabase
      .from('learned_products')
      .select('*', { count: 'exact', head: true });

    // Get products by category
    const { data: categoryData } = await supabase
      .from('learned_products')
      .select('category');

    const categoryCounts: Record<string, number> = {};
    (categoryData || []).forEach((row) => {
      const category = row.category || 'other';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });
    const byCategory = Object.entries(categoryCounts)
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15);

    // Get top brands
    const { data: brandData } = await supabase
      .from('learned_products')
      .select('brand');

    const brandCounts: Record<string, number> = {};
    (brandData || []).forEach((row) => {
      const brand = row.brand || 'Unknown';
      brandCounts[brand] = (brandCounts[brand] || 0) + 1;
    });
    const topBrands = Object.entries(brandCounts)
      .map(([brand, count]) => ({ brand, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get recently learned products
    const { data: recentlyLearned } = await supabase
      .from('learned_products')
      .select('brand, name, category, occurrence_count, last_seen_at')
      .order('last_seen_at', { ascending: false })
      .limit(12);

    return NextResponse.json({
      totalProducts: totalProducts || 0,
      byCategory,
      topBrands,
      recentlyLearned: recentlyLearned || [],
    });
  } catch (error) {
    console.error('Error fetching learned products:', error);
    return NextResponse.json({ error: 'Failed to fetch learned products' }, { status: 500 });
  }
}
