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
    // Get total corrections
    const { count: totalCorrections } = await supabase
      .from('identification_corrections')
      .select('*', { count: 'exact', head: true });

    // Get corrections by field
    const { data: fieldData } = await supabase
      .from('identification_corrections')
      .select('corrected_fields');

    const fieldCounts: Record<string, number> = {};
    (fieldData || []).forEach((row) => {
      const fields = row.corrected_fields || [];
      fields.forEach((field: string) => {
        fieldCounts[field] = (fieldCounts[field] || 0) + 1;
      });
    });
    const byField = Object.entries(fieldCounts).map(([field, count]) => ({
      field,
      count,
    }));

    // Get recent corrections
    const { data: recentCorrections } = await supabase
      .from('identification_corrections')
      .select('input_value, original_brand, corrected_brand, original_name, corrected_name, created_at')
      .order('created_at', { ascending: false })
      .limit(10);

    return NextResponse.json({
      totalCorrections: totalCorrections || 0,
      byField,
      recentCorrections: recentCorrections || [],
    });
  } catch (error) {
    console.error('Error fetching corrections:', error);
    return NextResponse.json({ error: 'Failed to fetch corrections' }, { status: 500 });
  }
}
