/**
 * Embed URL Parser
 * Parses URLs from various platforms and extracts embed information
 */

export type EmbedPlatform = 'youtube' | 'spotify' | 'tiktok' | 'twitter' | 'instagram' | 'twitch' | 'unknown';

export interface ParsedEmbed {
  platform: EmbedPlatform;
  id: string;
  originalUrl: string;
  embedUrl?: string;
  type?: string; // For platform-specific types like 'track', 'playlist', 'album', 'video', 'clip'
}

// YouTube patterns
const YOUTUBE_PATTERNS = [
  /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
  /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
];

// Spotify patterns
const SPOTIFY_PATTERNS = [
  /open\.spotify\.com\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/,
];

// TikTok patterns
const TIKTOK_PATTERNS = [
  /tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
  /vm\.tiktok\.com\/([a-zA-Z0-9]+)/,
];

// Twitter/X patterns
const TWITTER_PATTERNS = [
  /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/,
];

// Instagram patterns
const INSTAGRAM_PATTERNS = [
  /instagram\.com\/(?:p|reel)\/([a-zA-Z0-9_-]+)/,
];

// Twitch patterns
const TWITCH_PATTERNS = [
  /twitch\.tv\/videos\/(\d+)/,
  /twitch\.tv\/([a-zA-Z0-9_]+)\/clip\/([a-zA-Z0-9_-]+)/,
  /clips\.twitch\.tv\/([a-zA-Z0-9_-]+)/,
  /twitch\.tv\/([a-zA-Z0-9_]+)$/, // Channel
];

export function parseEmbedUrl(url: string): ParsedEmbed {
  const normalizedUrl = url.trim();

  // YouTube
  for (const pattern of YOUTUBE_PATTERNS) {
    const match = normalizedUrl.match(pattern);
    if (match) {
      const videoId = match[1];
      return {
        platform: 'youtube',
        id: videoId,
        originalUrl: normalizedUrl,
        embedUrl: `https://www.youtube-nocookie.com/embed/${videoId}`,
        type: normalizedUrl.includes('/shorts/') ? 'short' : 'video',
      };
    }
  }

  // Spotify
  for (const pattern of SPOTIFY_PATTERNS) {
    const match = normalizedUrl.match(pattern);
    if (match) {
      const [, type, id] = match;
      return {
        platform: 'spotify',
        id,
        originalUrl: normalizedUrl,
        embedUrl: `https://open.spotify.com/embed/${type}/${id}`,
        type,
      };
    }
  }

  // TikTok
  for (const pattern of TIKTOK_PATTERNS) {
    const match = normalizedUrl.match(pattern);
    if (match) {
      const videoId = match[1];
      return {
        platform: 'tiktok',
        id: videoId,
        originalUrl: normalizedUrl,
        embedUrl: `https://www.tiktok.com/embed/v2/${videoId}`,
        type: 'video',
      };
    }
  }

  // Twitter/X
  for (const pattern of TWITTER_PATTERNS) {
    const match = normalizedUrl.match(pattern);
    if (match) {
      const tweetId = match[1];
      return {
        platform: 'twitter',
        id: tweetId,
        originalUrl: normalizedUrl,
        type: 'tweet',
      };
    }
  }

  // Instagram
  for (const pattern of INSTAGRAM_PATTERNS) {
    const match = normalizedUrl.match(pattern);
    if (match) {
      const postId = match[1];
      return {
        platform: 'instagram',
        id: postId,
        originalUrl: normalizedUrl,
        embedUrl: `https://www.instagram.com/p/${postId}/embed`,
        type: normalizedUrl.includes('/reel/') ? 'reel' : 'post',
      };
    }
  }

  // Twitch
  for (let i = 0; i < TWITCH_PATTERNS.length; i++) {
    const pattern = TWITCH_PATTERNS[i];
    const match = normalizedUrl.match(pattern);
    if (match) {
      if (i === 0) {
        // Video
        return {
          platform: 'twitch',
          id: match[1],
          originalUrl: normalizedUrl,
          type: 'video',
        };
      } else if (i === 1 || i === 2) {
        // Clip
        const clipId = i === 1 ? match[2] : match[1];
        return {
          platform: 'twitch',
          id: clipId,
          originalUrl: normalizedUrl,
          type: 'clip',
        };
      } else {
        // Channel
        return {
          platform: 'twitch',
          id: match[1],
          originalUrl: normalizedUrl,
          type: 'channel',
        };
      }
    }
  }

  return {
    platform: 'unknown',
    id: '',
    originalUrl: normalizedUrl,
  };
}

export function getPlatformName(platform: EmbedPlatform): string {
  const names: Record<EmbedPlatform, string> = {
    youtube: 'YouTube',
    spotify: 'Spotify',
    tiktok: 'TikTok',
    twitter: 'Twitter / X',
    instagram: 'Instagram',
    twitch: 'Twitch',
    unknown: 'Unknown',
  };
  return names[platform];
}

export function getPlatformIcon(platform: EmbedPlatform): string {
  const icons: Record<EmbedPlatform, string> = {
    youtube: 'youtube',
    spotify: 'spotify',
    tiktok: 'tiktok',
    twitter: 'twitter',
    instagram: 'instagram',
    twitch: 'twitch',
    unknown: 'link',
  };
  return icons[platform];
}
