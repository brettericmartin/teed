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
    // Get total events
    const { count: totalEvents } = await supabase
      .from('identification_telemetry')
      .select('*', { count: 'exact', head: true });

    // Get events by action
    const { data: actionData } = await supabase
      .from('identification_telemetry')
      .select('user_action');

    const actionCounts: Record<string, number> = {};
    (actionData || []).forEach((row) => {
      const action = row.user_action || 'unknown';
      actionCounts[action] = (actionCounts[action] || 0) + 1;
    });
    const byAction = Object.entries(actionCounts).map(([action, count]) => ({
      action,
      count,
    }));

    // Get events by stage
    const { data: stageData } = await supabase
      .from('identification_telemetry')
      .select('stage_reached');

    const stageCounts: Record<string, number> = {};
    (stageData || []).forEach((row) => {
      const stage = row.stage_reached || 'unknown';
      stageCounts[stage] = (stageCounts[stage] || 0) + 1;
    });
    const byStage = Object.entries(stageCounts).map(([stage, count]) => ({
      stage,
      count,
    }));

    // Get average confidence
    const { data: confidenceData } = await supabase
      .from('identification_telemetry')
      .select('confidence_returned');

    const confidences = (confidenceData || [])
      .map((r) => r.confidence_returned)
      .filter((c): c is number => typeof c === 'number');
    const avgConfidence = confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0;

    // Get average time to decision
    const { data: timeData } = await supabase
      .from('identification_telemetry')
      .select('time_to_decision_ms');

    const times = (timeData || [])
      .map((r) => r.time_to_decision_ms)
      .filter((t): t is number => typeof t === 'number');
    const avgTimeToDecision = times.length > 0
      ? times.reduce((a, b) => a + b, 0) / times.length
      : 0;

    return NextResponse.json({
      totalEvents: totalEvents || 0,
      byAction,
      byStage,
      avgConfidence,
      avgTimeToDecision,
    });
  } catch (error) {
    console.error('Error fetching telemetry:', error);
    return NextResponse.json({ error: 'Failed to fetch telemetry' }, { status: 500 });
  }
}
