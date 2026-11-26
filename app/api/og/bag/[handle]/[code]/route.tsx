import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';
import { getSupabasePublic } from '@/lib/supabasePublic';

export const runtime = 'edge';

// Satori (the share-image renderer) only draws PNG, JPEG and GIF. Many
// item photos are WebP or AVIF, which made the whole image fail. Fetch each
// photo once, keep only formats Satori can draw, and fall back to the
// placeholder for anything else.
const RENDERABLE = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif'];
const MAX_IMAGE_BYTES = 3 * 1024 * 1024;

async function toRenderableImage(url: string | null | undefined): Promise<string | null> {
  if (!url || !/^https:\/\//i.test(url)) return null;
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
    if (!res.ok) return null;
    const type = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
    if (!RENDERABLE.includes(type)) return null;
    const buf = await res.arrayBuffer();
    if (buf.byteLength === 0 || buf.byteLength > MAX_IMAGE_BYTES) return null;
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
    }
    return `data:${type};base64,${btoa(binary)}`;
  } catch {
    return null;
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ handle: string; code: string }> }
) {
  try {
    const { handle, code } = await params;

    // Fetch profile
    const { data: profile } = await getSupabasePublic()
      .from('profiles')
      .select('id, display_name, avatar_url')
      .eq('handle', handle)
      .single();

    if (!profile) {
      return generateFallbackImage('Creator not found');
    }

    // Fetch bag with items
    const { data: bag } = await getSupabasePublic()
      .from('bags')
      .select(`
        id,
        title,
        description,
        cover_photo_id,
        updated_at,
        items:bag_items!bag_items_bag_id_fkey(
          id,
          custom_name,
          brand,
          photo_url,
          custom_photo_id
        )
      `)
      .eq('owner_id', profile.id)
      .eq('code', code)
      .eq('is_public', true)
      .single();

    if (!bag) {
      return generateFallbackImage('Collection not found');
    }

    // Get item photos (up to 3)
    const items = bag.items || [];
    const photoIds = items
      .map((item: any) => item.custom_photo_id)
      .filter((id: string | null): id is string => id !== null)
      .slice(0, 3);

    let photoUrls: Record<string, string> = {};
    if (photoIds.length > 0) {
      const { data: mediaAssets } = await getSupabasePublic()
        .from('media_assets')
        .select('id, url')
        .in('id', photoIds);

      if (mediaAssets) {
        photoUrls = mediaAssets.reduce((acc: Record<string, string>, asset: { id: string; url: string }) => {
          acc[asset.id] = asset.url;
          return acc;
        }, {});
      }
    }

    // Get up to 3 item preview URLs
    const previewItems = await Promise.all(
      items.slice(0, 3).map(async (item: any) => ({
        name: item.custom_name || item.brand || 'Item',
        photoUrl: await toRenderableImage(
          item.custom_photo_id ? photoUrls[item.custom_photo_id] : item.photo_url
        ),
      }))
    );
    const avatarUrl = await toRenderableImage(profile.avatar_url);

    const displayName = profile.display_name || handle;
    const itemCount = items.length;
    const updatedDate = bag.updated_at
      ? new Date(bag.updated_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : '';

    return new ImageResponse(
      (
        <div
          style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#F9F5EE',
            padding: '48px 60px',
          }}
        >
          {/* Top section with creator info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            {/* Avatar */}
            {avatarUrl ? (
              <img
                src={avatarUrl}
                width={56}
                height={56}
                style={{
                  borderRadius: '50%',
                  objectFit: 'cover',
                }}
              />
            ) : (
              <div
                style={{
                  width: 56,
                  height: 56,
                  borderRadius: '50%',
                  backgroundColor: '#7A9770',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '24px',
                  fontWeight: 600,
                }}
              >
                {displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontSize: '20px', color: '#666666' }}>{displayName}</span>
              <span style={{ fontSize: '14px', color: '#999999' }}>@{handle}</span>
            </div>
          </div>

          {/* Main title */}
          <h1
            style={{
              fontSize: '64px',
              fontWeight: 700,
              color: '#1A1A1A',
              margin: '0 0 16px 0',
              lineHeight: 1.1,
              maxWidth: '900px',
            }}
          >
            {bag.title}
          </h1>

          {/* Meta info */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              marginBottom: '40px',
            }}
          >
            <span
              style={{
                fontSize: '18px',
                color: '#666666',
                backgroundColor: 'rgba(122, 151, 112, 0.15)',
                padding: '6px 14px',
                borderRadius: '9999px',
              }}
            >
              {itemCount} {itemCount === 1 ? 'item' : 'items'}
            </span>
            {updatedDate && (
              <span style={{ fontSize: '16px', color: '#999999' }}>
                Updated {updatedDate}
              </span>
            )}
          </div>

          {/* Item previews */}
          <div
            style={{
              display: 'flex',
              gap: '20px',
              flex: 1,
            }}
          >
            {previewItems.length > 0 ? (
              previewItems.map((item: any, i: number) => (
                <div
                  key={i}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    width: '200px',
                  }}
                >
                  <div
                    style={{
                      width: '200px',
                      height: '200px',
                      borderRadius: '16px',
                      backgroundColor: '#FFFFFF',
                      border: '1px solid #E5E7EB',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {item.photoUrl ? (
                      <img
                        src={item.photoUrl}
                        width={200}
                        height={200}
                        style={{
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          fontSize: '48px',
                          color: '#D1D5DB',
                        }}
                      >
                        📦
                      </div>
                    )}
                  </div>
                  <span
                    style={{
                      fontSize: '14px',
                      color: '#666666',
                      marginTop: '8px',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                    }}
                  >
                    {item.name}
                  </span>
                </div>
              ))
            ) : (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '200px',
                  height: '200px',
                  borderRadius: '16px',
                  backgroundColor: '#F3F4F6',
                  color: '#9CA3AF',
                  fontSize: '16px',
                }}
              >
                No items yet
              </div>
            )}
            {items.length > 3 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '120px',
                  height: '200px',
                  borderRadius: '16px',
                  backgroundColor: 'rgba(122, 151, 112, 0.1)',
                  color: '#7A9770',
                  fontSize: '24px',
                  fontWeight: 600,
                }}
              >
                +{items.length - 3}
              </div>
            )}
          </div>

          {/* Bottom branding */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 'auto',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
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
            <span style={{ fontSize: '14px', color: '#AAAAAA' }}>
              See the full collection
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
    console.error('Error generating bag OG image:', error);
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
