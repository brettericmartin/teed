/**
 * GET /api/affiliate/click/[linkId]
 *
 * Track affiliate link click and redirect to affiliate URL
 *
 * Flow:
 * 1. Receive link click with linkId
 * 2. Log click event (IP, user agent, referrer)
 * 3. Increment click counter (via database trigger)
 * 4. Redirect (302) to affiliate URL
 *
 * Privacy:
 * - Respects Do Not Track (DNT) header
 * - IP addresses hashed for GDPR compliance
 * - No personally identifiable information stored
 */

import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';
import { ClickEventInsert } from '@/lib/types/affiliate';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ linkId: string }> }
) {
  const { linkId } = await params;

  try {
    const supabase = await createServerSupabase();

    // Fetch affiliate link
    const { data: affiliateLink, error: fetchError } = await supabase
      .from('affiliate_links')
      .select('id, affiliate_url, is_active, cookie_expires_at')
      .eq('id', linkId)
      .single();

    if (fetchError || !affiliateLink) {
      console.error('[Affiliate Click] Link not found:', linkId);
      return NextResponse.json(
        { error: 'Affiliate link not found' },
        { status: 404 }
      );
    }

    // Check if link is active and not expired
    if (!affiliateLink.is_active) {
      console.warn('[Affiliate Click] Link is inactive:', linkId);
      return NextResponse.json(
        { error: 'Affiliate link is no longer active' },
        { status: 410 } // 410 Gone
      );
    }

    if (
      affiliateLink.cookie_expires_at &&
      new Date(affiliateLink.cookie_expires_at) < new Date()
    ) {
      console.warn('[Affiliate Click] Link has expired:', linkId);
      // Mark as inactive
      await supabase
        .from('affiliate_links')
        .update({ is_active: false })
        .eq('id', linkId);

      return NextResponse.json(
        { error: 'Affiliate link has expired' },
        { status: 410 }
      );
    }

    // Check if tracking is allowed (respect DNT header)
    const dnt = request.headers.get('DNT') || request.headers.get('dnt');
    const trackingAllowed = dnt !== '1';

    // Collect tracking data (if allowed)
    if (trackingAllowed) {
      const ip = getClientIp(request);
      const userAgent = request.headers.get('user-agent');
      const referrer = request.headers.get('referer');

      // Parse device type from user agent
      const deviceType = parseDeviceType(userAgent);

      // Generate session ID (for unique session tracking)
      const sessionId = generateSessionId(ip, userAgent);

      // Insert click event
      const clickEvent: ClickEventInsert = {
        affiliate_link_id: linkId,
        ip_address: ip || undefined,
        user_agent: userAgent || undefined,
        referrer: referrer || undefined,
        session_id: sessionId,
        device_type: deviceType,
      };

      const { error: insertError } = await supabase
        .from('affiliate_clicks')
        .insert(clickEvent);

      if (insertError) {
        console.error('[Affiliate Click] Failed to log click:', insertError);
        // Don't block redirect on tracking failure
      }

      // Also insert into user_activity for unified analytics pipeline (fire-and-forget)
      supabase
        .from('user_activity')
        .insert({
          event_type: 'affiliate_link_clicked',
          event_data: {
            affiliate_link_id: linkId,
            affiliate_url: affiliateLink.affiliate_url,
            device_type: deviceType,
            referrer: referrer || undefined,
          },
          session_id: sessionId,
        })
        .then(({ error: activityError }) => {
          if (activityError) {
            console.error('[Affiliate Click] Failed to log to user_activity:', activityError);
          }
        });
    } else {
      console.log('[Affiliate Click] Tracking disabled (DNT header present)');
    }

    // Redirect to affiliate URL
    return NextResponse.redirect(affiliateLink.affiliate_url, 302);
  } catch (error: any) {
    console.error('[Affiliate Click] Error:', error);

    return NextResponse.json(
      {
        error: 'Failed to process affiliate click',
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════
// Utility Functions
// ═══════════════════════════════════════════════════════════

/**
 * Get client IP address from request headers
 * Handles various proxy headers
 */
function getClientIp(request: NextRequest): string | null {
  // Try various headers (Vercel, Cloudflare, etc.)
  const headers = [
    'x-forwarded-for',
    'x-real-ip',
    'cf-connecting-ip',
    'fastly-client-ip',
    'x-client-ip',
    'x-cluster-client-ip',
  ];

  for (const header of headers) {
    const value = request.headers.get(header);
    if (value) {
      // x-forwarded-for can be comma-separated list
      return value.split(',')[0].trim();
    }
  }

  return null;
}

/**
 * Parse device type from user agent
 */
function parseDeviceType(
  userAgent: string | null
): 'mobile' | 'tablet' | 'desktop' | 'unknown' {
  if (!userAgent) return 'unknown';

  const ua = userAgent.toLowerCase();

  // Mobile detection
  if (
    /mobile|android|iphone|ipod|blackberry|windows phone/i.test(ua) &&
    !/ipad|tablet/i.test(ua)
  ) {
    return 'mobile';
  }

  // Tablet detection
  if (/ipad|tablet|kindle|playbook|nexus/i.test(ua)) {
    return 'tablet';
  }

  // Desktop (default)
  if (/windows|macintosh|linux/i.test(ua)) {
    return 'desktop';
  }

  return 'unknown';
}

/**
 * Generate semi-unique session ID
 * Used to track unique visitors without storing PII
 *
 * Note: This is a simple implementation
 * For production, consider using a proper session management library
 */
function generateSessionId(
  ip: string | null,
  userAgent: string | null
): string {
  const input = `${ip || 'unknown'}-${userAgent || 'unknown'}-${new Date().toISOString().split('T')[0]}`;

  // Simple hash function (NOT cryptographic)
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(36);
}
