import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createServerSupabase } from '@/lib/serverSupabase';

export const runtime = 'edge';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ code: string }> }
) {
  try {
    const { code } = await params;

    // Fetch referrer info and capacity
    const supabase = await createServerSupabase();

    // Look up the application by custom code or ID
    const { data: application } = await supabase
      .from('beta_applications')
      .select('id, name, full_name, custom_referral_code')
      .or(`custom_referral_code.eq.${code},id.eq.${code}`)
      .single();

    // Get capacity info
    const { data: capacity } = await supabase.rpc('get_beta_capacity');

    const referrerName = application
      ? (application.name || application.full_name || 'Someone').split(' ')[0]
      : 'Someone';

    const spotsRemaining = capacity?.remaining ?? 7;
    const totalSpots = capacity?.max_capacity ?? 50;
    const percentFilled = Math.round(((totalSpots - spotsRemaining) / totalSpots) * 100);

    // Determine urgency level
    const isUrgent = spotsRemaining <= 10;
    const isCritical = spotsRemaining <= 5;

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F9F5EE',
            backgroundImage: 'linear-gradient(135deg, #F9F5EE 0%, #E8F5E9 50%, #E0F2F1 100%)',
            padding: '40px 60px',
          }}
        >
          {/* Top badge */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: isCritical ? '#FEF3C7' : '#E8F5E9',
              borderRadius: '9999px',
              padding: '8px 20px',
              marginBottom: '24px',
            }}
          >
            <span style={{ fontSize: '20px' }}>{isCritical ? '🔥' : isUrgent ? '⚡' : '✨'}</span>
            <span
              style={{
                fontSize: '18px',
                fontWeight: 600,
                color: isCritical ? '#92400E' : '#166534',
              }}
            >
              {isCritical
                ? `Only ${spotsRemaining} spots left!`
                : isUrgent
                  ? `${spotsRemaining} founding spots remain`
                  : 'Founding Member Access'}
            </span>
          </div>

          {/* Main text */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              textAlign: 'center',
            }}
          >
            <h1
              style={{
                fontSize: '56px',
                fontWeight: 700,
                color: '#1A1A1A',
                margin: '0 0 16px 0',
                lineHeight: 1.1,
              }}
            >
              {referrerName} invited you to join Teed
            </h1>

            <p
              style={{
                fontSize: '24px',
                color: '#666666',
                margin: '0 0 32px 0',
                maxWidth: '600px',
              }}
            >
              The beautiful way to curate and share your favorite products
            </p>
          </div>

          {/* Capacity bar */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '400px',
              marginBottom: '32px',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                width: '100%',
                marginBottom: '8px',
              }}
            >
              <span style={{ fontSize: '14px', color: '#666666' }}>Founding Cohort</span>
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#166534' }}>
                {totalSpots - spotsRemaining}/{totalSpots} filled
              </span>
            </div>
            <div
              style={{
                width: '100%',
                height: '12px',
                backgroundColor: '#E5E7EB',
                borderRadius: '9999px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${percentFilled}%`,
                  height: '100%',
                  backgroundColor: isCritical ? '#F59E0B' : '#7A9770',
                  borderRadius: '9999px',
                }}
              />
            </div>
          </div>

          {/* Benefits row */}
          <div
            style={{
              display: 'flex',
              gap: '32px',
              marginBottom: '24px',
            }}
          >
            {[
              { emoji: '🌟', text: 'Lifetime Free' },
              { emoji: '🚀', text: 'Early Access' },
              { emoji: '👑', text: 'Founding Badge' },
            ].map((benefit, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  backgroundColor: 'rgba(255,255,255,0.7)',
                  padding: '8px 16px',
                  borderRadius: '8px',
                }}
              >
                <span style={{ fontSize: '18px' }}>{benefit.emoji}</span>
                <span style={{ fontSize: '16px', color: '#374151' }}>{benefit.text}</span>
              </div>
            ))}
          </div>

          {/* Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              marginTop: '16px',
            }}
          >
            <span
              style={{
                fontSize: '28px',
                fontWeight: 700,
                color: '#7A9770',
              }}
            >
              Teed
            </span>
            <span style={{ fontSize: '16px', color: '#999999' }}>teed.club</span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating OG image:', error);

    // Fallback image
    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#F9F5EE',
          }}
        >
          <h1
            style={{
              fontSize: '56px',
              fontWeight: 700,
              color: '#1A1A1A',
            }}
          >
            Join Teed
          </h1>
          <p
            style={{
              fontSize: '24px',
              color: '#666666',
            }}
          >
            Curate and share your favorite products
          </p>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  }
}
