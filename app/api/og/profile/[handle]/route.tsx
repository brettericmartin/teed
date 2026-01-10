import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;

    // Fetch profile with public bags count
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, handle, display_name, avatar_url, bio, created_at')
      .eq('handle', handle)
      .single();

    if (!profile) {
      return generateFallbackImage('Creator not found');
    }

    // Get public bag count
    const { count: bagCount } = await supabase
      .from('bags')
      .select('id', { count: 'exact', head: true })
      .eq('owner_id', profile.id)
      .eq('is_public', true);

    // Get total item count across public bags
    const { data: bags } = await supabase
      .from('bags')
      .select('id')
      .eq('owner_id', profile.id)
      .eq('is_public', true);

    let itemCount = 0;
    if (bags && bags.length > 0) {
      const bagIds = bags.map(b => b.id);
      const { count } = await supabase
        .from('bag_items')
        .select('id', { count: 'exact', head: true })
        .in('bag_id', bagIds);
      itemCount = count || 0;
    }

    const displayName = profile.display_name || handle;
    const memberSince = new Date(profile.created_at).toLocaleDateString('en-US', {
      month: 'short',
      year: 'numeric',
    });

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
            backgroundImage: 'linear-gradient(135deg, #F9F5EE 0%, #E8F5E9 50%, #F5F5F0 100%)',
            padding: '60px',
          }}
        >
          {/* Avatar */}
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              width={140}
              height={140}
              style={{
                borderRadius: '50%',
                objectFit: 'cover',
                border: '4px solid white',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              }}
            />
          ) : (
            <div
              style={{
                width: 140,
                height: 140,
                borderRadius: '50%',
                backgroundColor: '#7A9770',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '56px',
                fontWeight: 600,
                border: '4px solid white',
                boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
              }}
            >
              {displayName.charAt(0).toUpperCase()}
            </div>
          )}

          {/* Name */}
          <h1
            style={{
              fontSize: '52px',
              fontWeight: 700,
              color: '#1A1A1A',
              margin: '24px 0 8px 0',
            }}
          >
            {displayName}
          </h1>

          {/* Handle */}
          <span
            style={{
              fontSize: '24px',
              color: '#7A9770',
              marginBottom: '16px',
            }}
          >
            @{handle}
          </span>

          {/* Bio */}
          {profile.bio && (
            <p
              style={{
                fontSize: '20px',
                color: '#666666',
                textAlign: 'center',
                maxWidth: '700px',
                margin: '0 0 32px 0',
                lineHeight: 1.4,
              }}
            >
              {profile.bio.length > 120 ? profile.bio.substring(0, 117) + '...' : profile.bio}
            </p>
          )}

          {/* Stats */}
          <div
            style={{
              display: 'flex',
              gap: '40px',
              marginTop: profile.bio ? '0' : '24px',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.8)',
                padding: '16px 32px',
                borderRadius: '16px',
              }}
            >
              <span style={{ fontSize: '36px', fontWeight: 700, color: '#1A1A1A' }}>
                {bagCount || 0}
              </span>
              <span style={{ fontSize: '16px', color: '#666666' }}>
                {bagCount === 1 ? 'Collection' : 'Collections'}
              </span>
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                backgroundColor: 'rgba(255,255,255,0.8)',
                padding: '16px 32px',
                borderRadius: '16px',
              }}
            >
              <span style={{ fontSize: '36px', fontWeight: 700, color: '#1A1A1A' }}>
                {itemCount}
              </span>
              <span style={{ fontSize: '16px', color: '#666666' }}>
                {itemCount === 1 ? 'Item' : 'Items'}
              </span>
            </div>
          </div>

          {/* Bottom branding */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              position: 'absolute',
              bottom: '40px',
            }}
          >
            <span
              style={{
                fontSize: '24px',
                fontWeight: 700,
                color: '#7A9770',
              }}
            >
              teed
            </span>
            <span style={{ fontSize: '16px', color: '#999999' }}>
              teed.club
            </span>
          </div>
        </div>
      ),
      {
        width: 1200,
        height: 630,
      }
    );
  } catch (error) {
    console.error('Error generating profile OG image:', error);
    return generateFallbackImage('Something went wrong');
  }
}

function generateFallbackImage(message: string) {
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
        <span
          style={{
            fontSize: '48px',
            fontWeight: 700,
            color: '#7A9770',
            marginBottom: '16px',
          }}
        >
          teed
        </span>
        <span style={{ fontSize: '24px', color: '#666666' }}>
          {message}
        </span>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
