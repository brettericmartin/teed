import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { IdentificationEvent } from '@/lib/analytics/identificationTelemetry';

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
 * POST /api/analytics/identification
 *
 * Store identification telemetry events.
 * Called from client-side telemetry module.
 */
export async function POST(request: NextRequest) {
  try {
    const event: IdentificationEvent = await request.json();

    // Validate required fields
    if (!event.sessionId || !event.stageReached || event.confidenceReturned === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      // Log but don't fail - telemetry is non-critical
      console.log('[Telemetry API] Supabase not configured, skipping');
      return NextResponse.json({ success: true, skipped: true });
    }

    const { error } = await supabase
      .from('identification_telemetry')
      .insert({
        session_id: event.sessionId,
        input_type: event.inputType || 'text',
        input_value: event.inputValue || '',
        stage_reached: event.stageReached,
        confidence_returned: event.confidenceReturned,
        suggestions_count: event.suggestionsCount || 0,
        user_action: event.userAction || 'abandoned',
        corrected_fields: event.correctedFields || [],
        time_to_decision_ms: event.timeToDecisionMs || 0,
        metadata: event.metadata || {},
      });

    if (error) {
      // Table might not exist yet - log but don't fail
      if (error.code === '42P01') {
        console.log('[Telemetry API] Table not created yet, skipping');
        return NextResponse.json({ success: true, skipped: true });
      }
      console.error('[Telemetry API] Insert error:', error);
      return NextResponse.json(
        { error: 'Failed to store event' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[Telemetry API] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/analytics/identification
 *
 * Get aggregated telemetry stats.
 * Uses service role key - internal use only.
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json(
        { error: 'Supabase not configured' },
        { status: 500 }
      );
    }

    // Get query params
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get('days') || '30', 10);

    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

    const { data, error } = await supabase
      .from('identification_telemetry')
      .select('*')
      .gte('created_at', since);

    if (error) {
      console.error('[Telemetry API] Query error:', error);
      return NextResponse.json(
        { error: 'Failed to fetch stats' },
        { status: 500 }
      );
    }

    if (!data || data.length === 0) {
      return NextResponse.json({
        totalIdentifications: 0,
        acceptanceRate: 0,
        correctionRate: 0,
        abandonmentRate: 0,
        averageConfidence: 0,
        stageDistribution: {},
        averageTimeToDecision: 0,
      });
    }

    // Calculate stats
    const total = data.length;
    const accepted = data.filter(e => e.user_action === 'accepted').length;
    const corrected = data.filter(e => e.user_action === 'corrected').length;
    const abandoned = data.filter(e => e.user_action === 'abandoned').length;

    const stageDistribution: Record<string, number> = {};
    let totalConfidence = 0;
    let totalTime = 0;

    for (const event of data) {
      stageDistribution[event.stage_reached] = (stageDistribution[event.stage_reached] || 0) + 1;
      totalConfidence += event.confidence_returned || 0;
      totalTime += event.time_to_decision_ms || 0;
    }

    return NextResponse.json({
      totalIdentifications: total,
      acceptanceRate: accepted / total,
      correctionRate: corrected / total,
      abandonmentRate: abandoned / total,
      averageConfidence: totalConfidence / total,
      stageDistribution,
      averageTimeToDecision: totalTime / total,
    });
  } catch (err) {
    console.error('[Telemetry API] Error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
