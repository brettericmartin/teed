import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { withAdminApi } from '@/lib/withAdmin';
import type {
  ContentIdeasStats,
  ContentIdeaStatus,
  ContentVertical,
} from '@/lib/types/contentIdeas';

// Use service role for database operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

/**
 * GET /api/admin/content-ideas/stats
 * Get statistics about content ideas
 */
export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    const authResult = await withAdminApi('moderator');
    if ('error' in authResult) {
      return authResult.error;
    }

    // Get all content ideas for counting
    const { data: allIdeas, error: fetchError } = await supabaseAdmin
      .from('content_ideas')
      .select('status, vertical, has_creator_affiliate, created_at');

    if (fetchError) {
      console.error('Error fetching content ideas:', fetchError);
      return NextResponse.json({ error: 'Failed to fetch stats' }, { status: 500 });
    }

    // Calculate stats
    const byStatus: Record<ContentIdeaStatus, number> = {
      discovered: 0,
      new: 0,
      screening: 0,
      selected: 0,
      skipped: 0,
      generating: 0,
      generated: 0,
      in_review: 0,
      approved: 0,
      archived: 0,
      rejected: 0,
    };

    const byVertical: Record<string, number> = {};
    let withCreatorAffiliate = 0;
    let thisWeek = 0;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    for (const idea of allIdeas || []) {
      // Count by status
      const status = idea.status as ContentIdeaStatus;
      if (status in byStatus) {
        byStatus[status]++;
      }

      // Count by vertical
      const vertical = idea.vertical || 'unknown';
      byVertical[vertical] = (byVertical[vertical] || 0) + 1;

      // Count with creator affiliate
      if (idea.has_creator_affiliate) {
        withCreatorAffiliate++;
      }

      // Count this week
      if (new Date(idea.created_at) >= oneWeekAgo) {
        thisWeek++;
      }
    }

    const stats: ContentIdeasStats = {
      total: allIdeas?.length || 0,
      byStatus,
      byVertical: byVertical as Record<ContentVertical, number>,
      withCreatorAffiliate,
      thisWeek,
      pendingReview: byStatus.new + byStatus.in_review,
    };

    return NextResponse.json(stats);
  } catch (error) {
    console.error('Get stats error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
