import { ImageResponse } from 'next/og';

// Site-wide share image. Several pages point their Open Graph and Twitter
// image at /og-image.png, which did not exist, so shared links showed no picture.
export const runtime = 'edge';
export const revalidate = 86400;

export async function GET() {
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
          backgroundImage: 'linear-gradient(135deg, #F9F5EE 0%, #E8F5E9 55%, #E0F2F1 100%)',
          padding: '60px 80px',
        }}
      >
        <div style={{ fontSize: 96, fontWeight: 700, color: '#1F3A2B', letterSpacing: -2 }}>
          Teed.club
        </div>
        <div
          style={{
            fontSize: 38,
            color: '#3F5A4A',
            marginTop: 24,
            textAlign: 'center',
            maxWidth: 900,
            lineHeight: 1.3,
          }}
        >
          Real gear from real people, with every item and why it made the cut.
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}
