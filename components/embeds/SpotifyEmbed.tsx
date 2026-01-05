'use client';

interface SpotifyEmbedProps {
  id: string;
  type: 'track' | 'album' | 'playlist' | 'episode' | 'show';
  /** Use compact mode (80px height for tracks) */
  compact?: boolean;
}

export default function SpotifyEmbed({
  id,
  type,
  compact = false,
}: SpotifyEmbedProps) {
  const embedUrl = `https://open.spotify.com/embed/${type}/${id}?utm_source=generator&theme=0`;

  // Different heights for different content types
  const getHeight = () => {
    if (compact && type === 'track') return '80px';
    if (type === 'track') return '152px';
    if (type === 'episode') return '232px';
    return '352px'; // playlist, album, show
  };

  return (
    <div
      className="w-full rounded-xl overflow-hidden"
      style={{ height: getHeight() }}
    >
      <iframe
        src={embedUrl}
        width="100%"
        height="100%"
        frameBorder="0"
        allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
        loading="lazy"
        title={`Spotify ${type}`}
        className="rounded-xl"
      />
    </div>
  );
}
