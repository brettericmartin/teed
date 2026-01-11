/**
 * Social Platform Definitions
 *
 * Platforms for social profiles (not content).
 * Profile URLs are distinct from content URLs (posts, videos, etc.).
 */

import type { PlatformDefinition } from '../types';

/**
 * Reserved usernames that are not real profiles.
 * These are common reserved paths across platforms.
 */
export const RESERVED_USERNAMES = new Set([
  'about', 'help', 'support', 'settings', 'privacy', 'terms',
  'login', 'signup', 'register', 'explore', 'search', 'trending',
  'home', 'feed', 'notifications', 'messages', 'direct', 'create',
  'share', 'api', 'developer', 'developers', 'docs', 'blog',
  'jobs', 'careers', 'press', 'legal', 'contact', 'advertise',
  'ads', 'business', 'shop', 'store', 'download', 'mobile',
]);

/**
 * Instagram Profile
 */
export const instagramProfile: PlatformDefinition = {
  id: 'instagram-profile',
  name: 'Instagram',
  type: 'social',
  domains: ['instagram.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?instagram\.com\/([a-zA-Z0-9._]+)\/?$/i,
  ],
  excludePatterns: [
    /instagram\.com\/p\//,
    /instagram\.com\/reel\//,
    /instagram\.com\/reels\//,
    /instagram\.com\/stories\//,
    /instagram\.com\/tv\//,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'instagram',
  color: '#E4405F',
};

/**
 * Twitter/X Profile
 */
export const twitterProfile: PlatformDefinition = {
  id: 'twitter-profile',
  name: 'Twitter/X',
  type: 'social',
  domains: ['twitter.com', 'x.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?(?:twitter|x)\.com\/([a-zA-Z0-9_]+)\/?$/i,
  ],
  excludePatterns: [
    /\/status\//,
    /\/i\//,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'twitter',
  color: '#1DA1F2',
};

/**
 * YouTube Channel
 */
export const youtubeChannel: PlatformDefinition = {
  id: 'youtube-channel',
  name: 'YouTube',
  type: 'social',
  domains: ['youtube.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/@([a-zA-Z0-9_-]+)\/?$/i,
    /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/c\/([a-zA-Z0-9_-]+)\/?$/i,
    /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/channel\/([a-zA-Z0-9_-]+)\/?$/i,
    /^(?:https?:\/\/)?(?:www\.)?youtube\.com\/user\/([a-zA-Z0-9_-]+)\/?$/i,
  ],
  excludePatterns: [
    /\/watch/,
    /\/shorts\//,
    /\/playlist/,
    /\/live\//,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'youtube',
  color: '#FF0000',
};

/**
 * TikTok Profile
 */
export const tiktokProfile: PlatformDefinition = {
  id: 'tiktok-profile',
  name: 'TikTok',
  type: 'social',
  domains: ['tiktok.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?tiktok\.com\/@([a-zA-Z0-9_.]+)\/?$/i,
  ],
  excludePatterns: [
    /\/video\//,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'tiktok',
  color: '#000000',
};

/**
 * Twitch Channel
 */
export const twitchChannel: PlatformDefinition = {
  id: 'twitch-channel',
  name: 'Twitch',
  type: 'social',
  domains: ['twitch.tv'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]+)\/?$/i,
  ],
  excludePatterns: [
    /\/videos\//,
    /\/clip\//,
    /\/clips\//,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'twitch',
  color: '#9146FF',
};

/**
 * LinkedIn Profile/Company
 */
export const linkedinProfile: PlatformDefinition = {
  id: 'linkedin-profile',
  name: 'LinkedIn',
  type: 'social',
  domains: ['linkedin.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)\/?$/i,
    /^(?:https?:\/\/)?(?:www\.)?linkedin\.com\/company\/([a-zA-Z0-9_-]+)\/?$/i,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'linkedin',
  color: '#0A66C2',
};

/**
 * Facebook Profile/Page
 */
export const facebookProfile: PlatformDefinition = {
  id: 'facebook-profile',
  name: 'Facebook',
  type: 'social',
  domains: ['facebook.com', 'fb.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?facebook\.com\/([a-zA-Z0-9.]+)\/?$/i,
    /^(?:https?:\/\/)?(?:www\.)?fb\.com\/([a-zA-Z0-9.]+)\/?$/i,
  ],
  excludePatterns: [
    /\/posts\//,
    /\/photos\//,
    /\/videos\//,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'facebook',
  color: '#1877F2',
};

/**
 * Threads Profile
 */
export const threadsProfile: PlatformDefinition = {
  id: 'threads-profile',
  name: 'Threads',
  type: 'social',
  domains: ['threads.net'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?threads\.net\/@?([a-zA-Z0-9._]+)\/?$/i,
  ],
  excludePatterns: [
    /\/post\//,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'at-sign',
  color: '#000000',
};

/**
 * Bluesky Profile
 */
export const blueskyProfile: PlatformDefinition = {
  id: 'bluesky-profile',
  name: 'Bluesky',
  type: 'social',
  domains: ['bsky.app'],
  urlPatterns: [
    /^(?:https?:\/\/)?bsky\.app\/profile\/([a-zA-Z0-9.-]+)\/?$/i,
  ],
  excludePatterns: [
    /\/post\//,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'cloud',
  color: '#0085FF',
};

/**
 * Pinterest Profile
 */
export const pinterestProfile: PlatformDefinition = {
  id: 'pinterest-profile',
  name: 'Pinterest',
  type: 'social',
  domains: ['pinterest.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?pinterest\.com\/([a-zA-Z0-9_]+)\/?$/i,
  ],
  excludePatterns: [
    /\/pin\//,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'pinterest',
  color: '#E60023',
};

/**
 * Discord Server Invite
 */
export const discordServer: PlatformDefinition = {
  id: 'discord-server',
  name: 'Discord',
  type: 'social',
  domains: ['discord.gg', 'discord.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?discord\.gg\/([a-zA-Z0-9]+)\/?$/i,
    /^(?:https?:\/\/)?(?:www\.)?discord\.com\/invite\/([a-zA-Z0-9]+)\/?$/i,
  ],
  extractors: {
    username: (url, match) => match[1],  // invite code
  },
  icon: 'message-circle',
  color: '#5865F2',
};

/**
 * GitHub Profile/Org
 */
export const githubProfile: PlatformDefinition = {
  id: 'github-profile',
  name: 'GitHub',
  type: 'social',
  domains: ['github.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)\/?$/i,
  ],
  excludePatterns: [
    /github\.com\/[^\/]+\/[^\/]+/,  // Repos have two path segments
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'github',
  color: '#181717',
};

/**
 * Spotify Artist/User Profile
 */
export const spotifyProfile: PlatformDefinition = {
  id: 'spotify-profile',
  name: 'Spotify',
  type: 'social',
  domains: ['open.spotify.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?open\.spotify\.com\/artist\/([a-zA-Z0-9]+)\/?$/i,
    /^(?:https?:\/\/)?open\.spotify\.com\/user\/([a-zA-Z0-9]+)\/?$/i,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'spotify',
  color: '#1DB954',
};

/**
 * SoundCloud Profile
 */
export const soundcloudProfile: PlatformDefinition = {
  id: 'soundcloud-profile',
  name: 'SoundCloud',
  type: 'social',
  domains: ['soundcloud.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?soundcloud\.com\/([a-zA-Z0-9_-]+)\/?$/i,
  ],
  excludePatterns: [
    /soundcloud\.com\/[^\/]+\/[^\/]+/,  // Tracks have two path segments
    /soundcloud\.com\/you\//,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'music',
  color: '#FF5500',
};

/**
 * Patreon Creator Page
 */
export const patreonProfile: PlatformDefinition = {
  id: 'patreon-profile',
  name: 'Patreon',
  type: 'social',
  domains: ['patreon.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?patreon\.com\/([a-zA-Z0-9_]+)\/?$/i,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'heart',
  color: '#FF424D',
};

/**
 * Substack Newsletter
 */
export const substackProfile: PlatformDefinition = {
  id: 'substack-profile',
  name: 'Substack',
  type: 'social',
  domains: ['substack.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?([a-zA-Z0-9_-]+)\.substack\.com\/?$/i,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'mail',
  color: '#FF6719',
};

/**
 * Telegram Channel/User
 */
export const telegramProfile: PlatformDefinition = {
  id: 'telegram-profile',
  name: 'Telegram',
  type: 'social',
  domains: ['t.me', 'telegram.me'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?t\.me\/([a-zA-Z0-9_]+)\/?$/i,
    /^(?:https?:\/\/)?(?:www\.)?telegram\.me\/([a-zA-Z0-9_]+)\/?$/i,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'send',
  color: '#26A5E4',
};

/**
 * Snapchat Profile
 */
export const snapchatProfile: PlatformDefinition = {
  id: 'snapchat-profile',
  name: 'Snapchat',
  type: 'social',
  domains: ['snapchat.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?snapchat\.com\/add\/([a-zA-Z0-9._-]+)\/?$/i,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'camera',
  color: '#FFFC00',
};

/**
 * Behance Portfolio
 */
export const behanceProfile: PlatformDefinition = {
  id: 'behance-profile',
  name: 'Behance',
  type: 'social',
  domains: ['behance.net'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?behance\.net\/([a-zA-Z0-9_]+)\/?$/i,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'pen-tool',
  color: '#1769FF',
};

/**
 * Dribbble Portfolio
 */
export const dribbbleProfile: PlatformDefinition = {
  id: 'dribbble-profile',
  name: 'Dribbble',
  type: 'social',
  domains: ['dribbble.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?dribbble\.com\/([a-zA-Z0-9_]+)\/?$/i,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'dribbble',
  color: '#EA4C89',
};

/**
 * WhatsApp Contact
 */
export const whatsappContact: PlatformDefinition = {
  id: 'whatsapp-contact',
  name: 'WhatsApp',
  type: 'social',
  domains: ['wa.me', 'whatsapp.com', 'api.whatsapp.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?wa\.me\/(\d+)\/?$/i,
    /^(?:https?:\/\/)?(?:api\.)?whatsapp\.com\/send\?phone=(\d+)/i,
  ],
  extractors: {
    username: (url, match) => match[1],  // phone number
  },
  icon: 'message-circle',
  color: '#25D366',
};

/**
 * Reddit User Profile
 */
export const redditProfile: PlatformDefinition = {
  id: 'reddit-profile',
  name: 'Reddit',
  type: 'social',
  domains: ['reddit.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?reddit\.com\/user\/([a-zA-Z0-9_-]+)\/?$/i,
    /^(?:https?:\/\/)?(?:www\.)?reddit\.com\/u\/([a-zA-Z0-9_-]+)\/?$/i,
  ],
  excludePatterns: [
    /\/comments\//,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'message-circle',
  color: '#FF4500',
};

/**
 * Medium Publication/Author
 */
export const mediumProfile: PlatformDefinition = {
  id: 'medium-profile',
  name: 'Medium',
  type: 'social',
  domains: ['medium.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?medium\.com\/@([a-zA-Z0-9._]+)\/?$/i,
  ],
  excludePatterns: [
    /medium\.com\/@[^\/]+\/[^\/]+/,  // Articles have path after username
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'book-open',
  color: '#000000',
};

/**
 * Mastodon Profile (generic - specific instances would need custom handling)
 */
export const mastodonProfile: PlatformDefinition = {
  id: 'mastodon-profile',
  name: 'Mastodon',
  type: 'social',
  domains: ['mastodon.social', 'mastodon.online', 'mstdn.social'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?mastodon\.(?:social|online)\/\@([a-zA-Z0-9_]+)\/?$/i,
    /^(?:https?:\/\/)?(?:www\.)?mstdn\.social\/\@([a-zA-Z0-9_]+)\/?$/i,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'globe',
  color: '#6364FF',
};

/**
 * Ko-fi Creator Page
 */
export const kofiProfile: PlatformDefinition = {
  id: 'kofi-profile',
  name: 'Ko-fi',
  type: 'social',
  domains: ['ko-fi.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?ko-fi\.com\/([a-zA-Z0-9_]+)\/?$/i,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'coffee',
  color: '#FF5E5B',
};

/**
 * Buy Me a Coffee Creator Page
 */
export const buyMeACoffeeProfile: PlatformDefinition = {
  id: 'buymeacoffee-profile',
  name: 'Buy Me a Coffee',
  type: 'social',
  domains: ['buymeacoffee.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?buymeacoffee\.com\/([a-zA-Z0-9_]+)\/?$/i,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'coffee',
  color: '#FFDD00',
};

/**
 * Email (mailto links)
 */
export const emailLink: PlatformDefinition = {
  id: 'email',
  name: 'Email',
  type: 'social',
  domains: [],  // mailto: is a protocol, not a domain
  urlPatterns: [
    /^mailto:([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/i,
  ],
  extractors: {
    username: (url, match) => match[1],  // email address
  },
  icon: 'mail',
  color: '#666666',
};

/**
 * Linktree - Link aggregator
 */
export const linktreeProfile: PlatformDefinition = {
  id: 'linktree-profile',
  name: 'Linktree',
  type: 'social',
  domains: ['linktr.ee'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?linktr\.ee\/([a-zA-Z0-9._]+)\/?$/i,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'link',
  color: '#43E660',
};

/**
 * Gumroad - Digital product sales
 */
export const gumroadProfile: PlatformDefinition = {
  id: 'gumroad-profile',
  name: 'Gumroad',
  type: 'social',
  domains: ['gumroad.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?gumroad\.com\/([a-zA-Z0-9_]+)\/?$/i,
    /^(?:https?:\/\/)?([a-zA-Z0-9_]+)\.gumroad\.com\/?$/i,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'shopping-bag',
  color: '#FF90E8',
};

/**
 * Product Hunt - Product discovery
 */
export const productHuntProfile: PlatformDefinition = {
  id: 'producthunt-profile',
  name: 'Product Hunt',
  type: 'social',
  domains: ['producthunt.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?producthunt\.com\/@([a-zA-Z0-9_]+)\/?$/i,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'box',
  color: '#DA552F',
};

/**
 * Letterboxd - Film social network
 */
export const letterboxdProfile: PlatformDefinition = {
  id: 'letterboxd-profile',
  name: 'Letterboxd',
  type: 'social',
  domains: ['letterboxd.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?letterboxd\.com\/([a-zA-Z0-9_]+)\/?$/i,
  ],
  excludePatterns: [
    /letterboxd\.com\/film\//,
    /letterboxd\.com\/list\//,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'film',
  color: '#00D735',
};

/**
 * Goodreads - Book social network
 */
export const goodreadsProfile: PlatformDefinition = {
  id: 'goodreads-profile',
  name: 'Goodreads',
  type: 'social',
  domains: ['goodreads.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?goodreads\.com\/user\/show\/(\d+)/i,
    /^(?:https?:\/\/)?(?:www\.)?goodreads\.com\/([a-zA-Z0-9_-]+)\/?$/i,
  ],
  excludePatterns: [
    /goodreads\.com\/book\//,
    /goodreads\.com\/author\//,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'book',
  color: '#553B08',
};

/**
 * Cash App - Payment
 */
export const cashappProfile: PlatformDefinition = {
  id: 'cashapp-profile',
  name: 'Cash App',
  type: 'social',
  domains: ['cash.app'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?cash\.app\/\$([a-zA-Z0-9_]+)\/?$/i,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'dollar-sign',
  color: '#00D632',
};

/**
 * Venmo - Payment
 */
export const venmoProfile: PlatformDefinition = {
  id: 'venmo-profile',
  name: 'Venmo',
  type: 'social',
  domains: ['venmo.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?venmo\.com\/([a-zA-Z0-9_-]+)\/?$/i,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'credit-card',
  color: '#008CFF',
};

/**
 * PayPal.me - Payment links
 */
export const paypalProfile: PlatformDefinition = {
  id: 'paypal-profile',
  name: 'PayPal',
  type: 'social',
  domains: ['paypal.me', 'paypal.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?paypal\.me\/([a-zA-Z0-9_]+)\/?$/i,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'credit-card',
  color: '#00457C',
};

/**
 * Flickr Profile
 */
export const flickrProfile: PlatformDefinition = {
  id: 'flickr-profile',
  name: 'Flickr',
  type: 'social',
  domains: ['flickr.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?flickr\.com\/photos\/([a-zA-Z0-9@_-]+)\/?$/i,
    /^(?:https?:\/\/)?(?:www\.)?flickr\.com\/people\/([a-zA-Z0-9@_-]+)\/?$/i,
  ],
  excludePatterns: [
    /flickr\.com\/photos\/[^\/]+\/\d+/,  // Individual photos
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'camera',
  color: '#0063DC',
};

/**
 * 500px - Photography
 */
export const fiveHundredPxProfile: PlatformDefinition = {
  id: '500px-profile',
  name: '500px',
  type: 'social',
  domains: ['500px.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?500px\.com\/p\/([a-zA-Z0-9_]+)\/?$/i,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'camera',
  color: '#0099E5',
};

/**
 * DeviantArt - Art community
 */
export const deviantartProfile: PlatformDefinition = {
  id: 'deviantart-profile',
  name: 'DeviantArt',
  type: 'social',
  domains: ['deviantart.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?deviantart\.com\/([a-zA-Z0-9_-]+)\/?$/i,
    /^(?:https?:\/\/)?([a-zA-Z0-9_-]+)\.deviantart\.com\/?$/i,
  ],
  excludePatterns: [
    /\/art\//,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'pen-tool',
  color: '#05CC47',
};

/**
 * ArtStation - Professional art portfolio
 */
export const artstationProfile: PlatformDefinition = {
  id: 'artstation-profile',
  name: 'ArtStation',
  type: 'social',
  domains: ['artstation.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?artstation\.com\/([a-zA-Z0-9_]+)\/?$/i,
  ],
  excludePatterns: [
    /\/artwork\//,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'palette',
  color: '#13AFF0',
};

/**
 * Bandcamp - Artist Profile
 */
export const bandcampProfile: PlatformDefinition = {
  id: 'bandcamp-profile',
  name: 'Bandcamp',
  type: 'social',
  domains: ['bandcamp.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?([a-zA-Z0-9_-]+)\.bandcamp\.com\/?$/i,
  ],
  excludePatterns: [
    /\/track\//,
    /\/album\//,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'music',
  color: '#629AA9',
};

/**
 * Vimeo Profile
 */
export const vimeoProfile: PlatformDefinition = {
  id: 'vimeo-profile',
  name: 'Vimeo',
  type: 'social',
  domains: ['vimeo.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?vimeo\.com\/([a-zA-Z][a-zA-Z0-9_]+)\/?$/i,
  ],
  excludePatterns: [
    /vimeo\.com\/\d+/,  // Videos
    /vimeo\.com\/channels\//,
    /vimeo\.com\/groups\//,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'video',
  color: '#1AB7EA',
};

/**
 * Clubhouse - Audio social
 */
export const clubhouseProfile: PlatformDefinition = {
  id: 'clubhouse-profile',
  name: 'Clubhouse',
  type: 'social',
  domains: ['clubhouse.com', 'joinclubhouse.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?(?:join)?clubhouse\.com\/@([a-zA-Z0-9_]+)\/?$/i,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'mic',
  color: '#F2E6D9',
};

/**
 * Amazon Storefront/Wishlist
 */
export const amazonStorefront: PlatformDefinition = {
  id: 'amazon-storefront',
  name: 'Amazon',
  type: 'social',
  domains: ['amazon.com', 'amazon.co.uk', 'amazon.ca', 'amazon.de'],
  urlPatterns: [
    /amazon\.(?:com|co\.uk|ca|de)\/shop\/([a-zA-Z0-9_]+)/i,
    /amazon\.(?:com|co\.uk|ca|de)\/hz\/wishlist\/ls\/([a-zA-Z0-9]+)/i,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'shopping-cart',
  color: '#FF9900',
};

/**
 * Twitch.tv Profile (channel when not live)
 */
export const twitchProfile: PlatformDefinition = {
  id: 'twitch-profile',
  name: 'Twitch',
  type: 'social',
  domains: ['twitch.tv'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?twitch\.tv\/([a-zA-Z0-9_]+)\/?$/i,
  ],
  excludePatterns: [
    /\/videos\//,
    /\/clip\//,
    /\/clips\//,
    /clips\.twitch\.tv/,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'twitch',
  color: '#9146FF',
};

/**
 * OnlyFans - Creator platform
 */
export const onlyfansProfile: PlatformDefinition = {
  id: 'onlyfans-profile',
  name: 'OnlyFans',
  type: 'social',
  domains: ['onlyfans.com'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?onlyfans\.com\/([a-zA-Z0-9._]+)\/?$/i,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'lock',
  color: '#00AFF0',
};

/**
 * Fanhouse - Creator platform
 */
export const fanhouseProfile: PlatformDefinition = {
  id: 'fanhouse-profile',
  name: 'Fanhouse',
  type: 'social',
  domains: ['fanhouse.app'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?fanhouse\.app\/([a-zA-Z0-9_]+)\/?$/i,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'heart',
  color: '#FF2D55',
};

/**
 * Carrd - Personal sites
 */
export const carrdProfile: PlatformDefinition = {
  id: 'carrd-profile',
  name: 'Carrd',
  type: 'social',
  domains: ['carrd.co'],
  urlPatterns: [
    /^(?:https?:\/\/)?([a-zA-Z0-9_-]+)\.carrd\.co\/?$/i,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'layout',
  color: '#2A2A2A',
};

/**
 * Stan Store - Creator commerce
 */
export const stanstoreProfile: PlatformDefinition = {
  id: 'stanstore-profile',
  name: 'Stan Store',
  type: 'social',
  domains: ['stan.store'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?stan\.store\/([a-zA-Z0-9_]+)\/?$/i,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'shopping-bag',
  color: '#5B4CFF',
};

/**
 * Beacons - Link in bio
 */
export const beaconsProfile: PlatformDefinition = {
  id: 'beacons-profile',
  name: 'Beacons',
  type: 'social',
  domains: ['beacons.ai'],
  urlPatterns: [
    /^(?:https?:\/\/)?(?:www\.)?beacons\.ai\/([a-zA-Z0-9_]+)\/?$/i,
  ],
  extractors: {
    username: (url, match) => match[1],
  },
  icon: 'radio',
  color: '#FF5C35',
};

/**
 * All social platforms in one array
 */
export const SOCIAL_PLATFORMS: PlatformDefinition[] = [
  // Major social platforms
  instagramProfile,
  twitterProfile,
  youtubeChannel,
  tiktokProfile,
  twitchChannel,
  twitchProfile,
  linkedinProfile,
  facebookProfile,
  threadsProfile,
  blueskyProfile,
  pinterestProfile,
  snapchatProfile,

  // Community platforms
  discordServer,
  redditProfile,
  mastodonProfile,
  clubhouseProfile,

  // Developer/design
  githubProfile,
  behanceProfile,
  dribbbleProfile,
  deviantartProfile,
  artstationProfile,

  // Photography
  flickrProfile,
  fiveHundredPxProfile,
  vimeoProfile,

  // Music/audio
  spotifyProfile,
  soundcloudProfile,
  bandcampProfile,

  // Creator economy
  patreonProfile,
  kofiProfile,
  buyMeACoffeeProfile,
  gumroadProfile,
  onlyfansProfile,
  fanhouseProfile,
  stanstoreProfile,

  // Link aggregators
  linktreeProfile,
  beaconsProfile,
  carrdProfile,

  // Payments
  cashappProfile,
  venmoProfile,
  paypalProfile,

  // Content/media
  substackProfile,
  mediumProfile,
  letterboxdProfile,
  goodreadsProfile,
  productHuntProfile,

  // Messaging
  telegramProfile,
  whatsappContact,
  emailLink,

  // E-commerce
  amazonStorefront,
];

/**
 * Get social platform by ID
 */
export function getSocialPlatform(id: string): PlatformDefinition | undefined {
  return SOCIAL_PLATFORMS.find(p => p.id === id);
}

/**
 * Get social platform by domain
 */
export function getSocialPlatformByDomain(domain: string): PlatformDefinition | undefined {
  const normalizedDomain = domain.replace(/^www\./, '').toLowerCase();
  return SOCIAL_PLATFORMS.find(p =>
    p.domains.some(d => d === normalizedDomain || normalizedDomain.endsWith('.' + d))
  );
}

/**
 * Check if a username is reserved
 */
export function isReservedUsername(username: string): boolean {
  return RESERVED_USERNAMES.has(username.toLowerCase());
}
