import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import type { IdentificationCorrection } from '@/lib/analytics/correctionTracking';

// Create Supabase admin client
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }

  return createClient(supabaseUrl, supabaseServiceKey);
}

/**
 * Hash input for consistent lookups
 */
function hashInput(inputType: 'url' | 'text', inputValue: string): string {
  const normalized = inputType === 'url' ? normalizeUrl(inputValue) : inputValue.toLowerCase().trim();
  return crypto.createHash('sha256').update(`${inputType}:${normalized}`).digest('hex');
}

function normalizeUrl(url: string): string {
  try {
    const parsed = new URL(url);
    // Remove tracking params
    const trackingParams = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'ref', 'fbclid', 'gclid'];
    trackingParams.forEach(param => parsed.searchParams.delete(param));
    parsed.hostname = parsed.hostname.toLowerCase();
    return parsed.toString();
  } catch {
    return url.toLowerCase();
  }
}

/**
 * POST /api/analytics/corrections
 *
 * Store a user correction for learning.
 */
export async function POST(request: NextRequest) {
  try {
    const correction: IdentificationCorrection = await request.json();

    // Validate required fields
    if (!correction.inputType || !correction.inputValue) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      console.log('[Corrections API] Supabase not configured, skipping');
      return NextResponse.json({ success: true, skipped: true });
    }

    const inputHash = hashInput(correction.inputType, correction.inputValue);

    const { error } = await supabase
      .from('identification_corrections')
      .insert({
        input_type: correction.inputType,
        input_value: correction.inputValue.slice(0, 500), // Truncate for storage
        input_hash: inputHash,
        original_brand: correction.originalBrand,
        original_name: correction.originalName,
        original_category: correction.originalCategory,
        original_confidence: correction.originalConfidence,
        corrected_brand: correction.correctedBrand,
        corrected_name: correction.correctedName,
        corrected_category: correction.correctedCategory,
        corrected_fields: correction.correctedFields || [],
      });

    if (error) {
      if (error.code === '42P01') {
        console.log('[Corrections API] Table not created yet, skipping');
        return NextResponse.json({ success: true, skipped: true });
      }
      console.error('[Corrections API] Insert error:', error);
      return NextResponse.json(
        { error: 'Failed to store correction' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Corrections API] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/corrections
 *
 * Look up previous corrections for an input.
 * Returns the most recent correction if found.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const inputType = searchParams.get('type') as 'url' | 'text' | null;
    const inputValue = searchParams.get('value');

    if (!inputType || !inputValue) {
      return NextResponse.json(
        { error: 'Missing type or value parameter' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ correction: null });
    }

    const inputHash = hashInput(inputType, inputValue);

    // Get most recent correction for this input
    const { data, error } = await supabase
      .from('identification_corrections')
      .select('corrected_brand, corrected_name, corrected_category')
      .eq('input_hash', inputHash)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error || !data) {
      return NextResponse.json({ correction: null });
    }

    return NextResponse.json({
      correction: {
        brand: data.corrected_brand,
        name: data.corrected_name,
        category: data.corrected_category,
      },
    });
  } catch (err) {
    console.error('[Corrections API] Error:', err);
    return NextResponse.json({ correction: null });
  }
}
