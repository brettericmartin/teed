/**
 * Social Profile URL Parser
 *
 * Detects social media PROFILE URLs (not content URLs like posts/videos).
 * This is distinct from embed detection which handles content URLs.
 *
 * Examples:
 * - Profile: instagram.com/username -> { platform: 'instagram', username: 'username' }
 * - Content: instagram.com/p/abc123 -> null (handled by parseEmbedUrl)
 */

export interface ParsedSocialProfile {
  platform: string;
  username: string;
  displayName: string;
  originalUrl: string;
}

interface SocialProfilePattern {
  platform: string;
  displayName: string;
  patterns: RegExp[];
  usernameExtractor: (match: RegExpMatchArray) => string;
}

/**
 * Social profile patterns for all supported platforms.
 * Each pattern carefully excludes content-specific URLs that should be embeds.
 */
const SOCIAL_PROFILE_PATTERNS: SocialProfilePattern[] = [
  // Instagram - profile only, not posts/reels
  {
    platform: 'instagram',
    displayName: 'Instagram',
    patterns: [
      // Match instagram.com/username but NOT instagram.com/p/, /reel/, /stories/, etc.
      /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)\/?$/i,
    ],
    usernameExtractor: (m) => m[1],
  },

  // Twitter/X - profile only, not tweets
  {
    platform: 'twitter',
    displayName: 'Twitter/X',
    patterns: [
      // Match twitter.com/username or x.com/username but NOT /status/
      /^(?:https?:\/\/)?(?:www\.)?(?:twitter|x)\.com\/([a-zA-Z0-9_]+)\/?$/i,
    ],
    usernameExtractor: (m) => m[1],
  },

  // YouTube - channel only, not videos
  {
    platform: 'youtube',
    displayName: 'YouTube',
    patterns: [
      // @username format
      /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/@([a-zA-Z0-9_-]+)\/?$/i,
      // /c/channel format
      /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/c\/([a-zA-Z0-9_-]+)\/?$/i,
      // /channel/ID format
      /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/channel\/([a-zA-Z0-9_-]+)\/?$/i,
      // /user/username format (legacy)
      /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/user\/([a-zA-Z0-9_-]+)\/?$/i,
    ],
    usernameExtractor: (m) => m[1],
  },

  // TikTok - profile only, not videos
  {
    platform: 'tiktok',
    displayName: 'TikTok',
    patterns: [
      // Match tiktok.com/@username but NOT tiktok.com/@username/video/
      /^(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([a-zA-Z0-9_.]+)\/?$/i,
    ],
    usernameExtractor: (m) => m[1],
  },

  // Twitch - channel only, not videos/clips
  {
    platform: 'twitch',
    displayName: 'Twitch',
    patterns: [
      // Match twitch.tv/username but NOT /videos/, /clip/, etc.
      /^(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]+)\/?$/i,
    ],
    usernameExtractor: (m) => m[1],
  },

  // LinkedIn
  {
    platform: 'linkedin',
    displayName: 'LinkedIn',
    patterns: [
      /^(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)\/?$/i,
      /^(?:https?:\/\/)?(?:www\.)?linkedin\.com\/company\/([a-zA-Z0-9_-]+)\/?$/i,
    ],
    usernameExtractor: (m) => m[1],
  },

  // Facebook
  {
    platform: 'facebook',
    displayName: 'Facebook',
    patterns: [
      /^(?:https?:\/\/)?(?:www\.)?facebook\.com\/([a-zA-Z0-9.]+)\/?$/i,
      /^(?:https?:\/\/)?(?:www\.)?fb\.com\/([a-zA-Z0-9.]+)\/?$/i,
    ],
    usernameExtractor: (m) => m[1],
  },

  // Threads
  {
    platform: 'threads',
    displayName: 'Threads',
    patterns: [
      /^(?:https?:\/\/)?(?:www\.)?threads\.net\/@?([a-zA-Z0-9._]+)\/?$/i,
    ],
    usernameExtractor: (m) => m[1],
  },

  // Pinterest
  {
    platform: 'pinterest',
    displayName: 'Pinterest',
    patterns: [
      /^(?:https?:\/\/)?(?:www\.)?pinterest\.com\/([a-zA-Z0-9_]+)\/?$/i,
    ],
    usernameExtractor: (m) => m[1],
  },

  // Discord (invite links are profiles in a sense)
  {
    platform: 'discord',
    displayName: 'Discord',
    patterns: [
      /^(?:https?:\/\/)?(?:www\.)?discord\.gg\/([a-zA-Z0-9]+)\/?$/i,
      /^(?:https?:\/\/)?(?:www\.)?discord\.com\/invite\/([a-zA-Z0-9]+)\/?$/i,
    ],
    usernameExtractor: (m) => m[1],
  },

  // GitHub
  {
    platform: 'github',
    displayName: 'GitHub',
    patterns: [
      // Match github.com/username but not github.com/username/repo
      /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)\/?$/i,
    ],
    usernameExtractor: (m) => m[1],
  },

  // Spotify (artist/user profiles, not tracks)
  {
    platform: 'spotify',
    displayName: 'Spotify',
    patterns: [
      /^(?:https?:\/\/)?open\.spotify\.com\/artist\/([a-zA-Z0-9]+)\/?$/i,
      /^(?:https?:\/\/)?open\.spotify\.com\/user\/([a-zA-Z0-9]+)\/?$/i,
    ],
    usernameExtractor: (m) => m[1],
  },

  // SoundCloud
  {
    platform: 'soundcloud',
    displayName: 'SoundCloud',
    patterns: [
      /^(?:https?:\/\/)?(?:www\.)?soundcloud\.com\/([a-zA-Z0-9_-]+)\/?$/i,
    ],
    usernameExtractor: (m) => m[1],
  },

  // Patreon
  {
    platform: 'patreon',
    displayName: 'Patreon',
    patterns: [
      /^(?:https?:\/\/)?(?:www\.)?patreon\.com\/([a-zA-Z0-9_]+)\/?$/i,
    ],
    usernameExtractor: (m) => m[1],
  },

  // Substack
  {
    platform: 'substack',
    displayName: 'Substack',
    patterns: [
      /^(?:https?:\/\/)?([a-zA-Z0-9_-]+)\.substack\.com\/?$/i,
    ],
    usernameExtractor: (m) => m[1],
  },

  // Telegram
  {
    platform: 'telegram',
    displayName: 'Telegram',
    patterns: [
      /^(?:https?:\/\/)?(?:www\.)?t\.me\/([a-zA-Z0-9_]+)\/?$/i,
      /^(?:https?:\/\/)?(?:www\.)?telegram\.me\/([a-zA-Z0-9_]+)\/?$/i,
    ],
    usernameExtractor: (m) => m[1],
  },

  // Snapchat
  {
    platform: 'snapchat',
    displayName: 'Snapchat',
    patterns: [
      /^(?:https?:\/\/)?(?:www\.)?snapchat\.com\/add\/([a-zA-Z0-9._-]+)\/?$/i,
    ],
    usernameExtractor: (m) => m[1],
  },

  // Behance
  {
    platform: 'behance',
    displayName: 'Behance',
    patterns: [
      /^(?:https?:\/\/)?(?:www\.)?behance\.net\/([a-zA-Z0-9_]+)\/?$/i,
    ],
    usernameExtractor: (m) => m[1],
  },

  // Dribbble
  {
    platform: 'dribbble',
    displayName: 'Dribbble',
    patterns: [
      /^(?:https?:\/\/)?(?:www\.)?dribbble\.com\/([a-zA-Z0-9_]+)\/?$/i,
    ],
    usernameExtractor: (m) => m[1],
  },

  // Email (mailto: links)
  {
    platform: 'email',
    displayName: 'Email',
    patterns: [
      /^mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/i,
    ],
    usernameExtractor: (m) => m[1],
  },

  // WhatsApp
  {
    platform: 'whatsapp',
    displayName: 'WhatsApp',
    patterns: [
      /^(?:https?:\/\/)?(?:www\.)?wa\.me\/(\d+)\/?$/i,
      /^(?:https?:\/\/)?(?:api\.)?whatsapp\.com\/send\?phone=(\d+)/i,
    ],
    usernameExtractor: (m) => m[1],
  },

  // Generic website (fallback for personal websites)
  // This should be last as it's the most permissive
  {
    platform: 'website',
    displayName: 'Website',
    patterns: [
      // Only match clean domain URLs without paths (except trailing slash)
      /^(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})\/?$/i,
    ],
    usernameExtractor: (m) => m[1],
  },
];

/**
 * Reserved paths that indicate content, not a profile.
 * If the URL contains any of these after the domain, it's not a profile URL.
 */
const RESERVED_PATHS = [
  // Instagram
  '/p/', '/reel/', '/reels/', '/stories/', '/tv/',
  // Twitter
  '/status/', '/i/',
  // YouTube
  '/watch', '/shorts/', '/playlist', '/live/',
  // TikTok
  '/video/',
  // Twitch
  '/videos/', '/clip/', '/clips/',
  // General
  '/post/', '/posts/', '/article/', '/blog/',
];

/**
 * Parse a URL to detect if it's a social media profile URL.
 *
 * @param url - The URL to parse
 * @returns ParsedSocialProfile if detected, null otherwise
 */
export function parseSocialProfileUrl(url: string): ParsedSocialProfile | null {
  if (!url) return null;

  // Normalize URL
  const normalizedUrl = url.trim();

  // Quick check: if URL contains reserved paths, it's content, not a profile
  const lowerUrl = normalizedUrl.toLowerCase();
  for (const path of RESERVED_PATHS) {
    if (lowerUrl.includes(path)) {
      return null;
    }
  }

  // Try each platform pattern
  for (const { platform, displayName, patterns, usernameExtractor } of SOCIAL_PROFILE_PATTERNS) {
    for (const pattern of patterns) {
      const match = normalizedUrl.match(pattern);
      if (match) {
        const username = usernameExtractor(match);

        // Skip common reserved usernames that aren't actual profiles
        if (isReservedUsername(username)) {
          continue;
        }

        return {
          platform,
          username,
          displayName,
          originalUrl: normalizedUrl,
        };
      }
    }
  }

  return null;
}

/**
 * Check if a username is reserved (not a real profile).
 */
function isReservedUsername(username: string): boolean {
  const reserved = [
    'about', 'help', 'support', 'settings', 'privacy', 'terms',
    'login', 'signup', 'register', 'explore', 'search', 'trending',
    'home', 'feed', 'notifications', 'messages', 'direct', 'create',
    'share', 'api', 'developer', 'developers', 'docs', 'blog',
    'jobs', 'careers', 'press', 'legal', 'contact', 'advertise',
  ];
  return reserved.includes(username.toLowerCase());
}

/**
 * Get all supported platforms with their metadata.
 */
export function getSupportedSocialPlatforms(): Array<{ platform: string; displayName: string }> {
  return SOCIAL_PROFILE_PATTERNS.map(({ platform, displayName }) => ({
    platform,
    displayName,
  }));
}
