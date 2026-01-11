/**
 * Embed Platform Definitions
 *
 * Platforms that support embedding content (videos, audio, posts).
 * Each platform can have oEmbed endpoint, URL patterns, and embed URL templates.
 */

import type { PlatformDefinition } from '../types';

/**
 * YouTube - Video platform
 * Supports: videos, shorts, embeds, live streams
 */
export const youtube: PlatformDefinition = {
  id: 'youtube',
  name: 'YouTube',
  type: 'embed',
  domains: ['youtube.com', 'youtu.be', 'youtube-nocookie.com'],
  urlPatterns: [
    /youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/,
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/live\/([a-zA-Z0-9_-]{11})/,
  ],
  excludePatterns: [
    /youtube\.com\/@/,           // Channel handles
    /youtube\.com\/channel\//,    // Channel pages
    /youtube\.com\/c\//,          // Custom channel URLs
    /youtube\.com\/user\//,       // User pages
    /youtube\.com\/playlist/,     // Playlists (could be embed, but complex)
  ],
  oembedEndpoint: 'https://www.youtube.com/oembed',
  embedUrlTemplate: 'https://www.youtube-nocookie.com/embed/{id}',
  extractors: {
    id: (url, match) => match[1],
  },
  icon: 'youtube',
  color: '#FF0000',
};

/**
 * Spotify - Audio platform
 * Supports: tracks, albums, playlists, episodes, shows
 */
export const spotify: PlatformDefinition = {
  id: 'spotify',
  name: 'Spotify',
  type: 'embed',
  domains: ['open.spotify.com', 'spotify.com'],
  urlPatterns: [
    /open\.spotify\.com\/(track|album|playlist|episode|show)\/([a-zA-Z0-9]+)/,
  ],
  excludePatterns: [
    /open\.spotify\.com\/artist\//,  // Artist profiles
    /open\.spotify\.com\/user\//,    // User profiles
  ],
  oembedEndpoint: 'https://open.spotify.com/oembed',
  embedUrlTemplate: 'https://open.spotify.com/embed/{type}/{id}',
  extractors: {
    id: (url, match) => match[2],
  },
  icon: 'spotify',
  color: '#1DB954',
};

/**
 * TikTok - Short video platform
 * Supports: videos, vm.tiktok.com shortlinks
 */
export const tiktok: PlatformDefinition = {
  id: 'tiktok',
  name: 'TikTok',
  type: 'embed',
  domains: ['tiktok.com', 'vm.tiktok.com'],
  urlPatterns: [
    /tiktok\.com\/@[\w.-]+\/video\/(\d+)/,
    /vm\.tiktok\.com\/([a-zA-Z0-9]+)/,
  ],
  excludePatterns: [
    /tiktok\.com\/@[\w.-]+\/?$/,  // Profile pages (no /video/)
  ],
  oembedEndpoint: 'https://www.tiktok.com/oembed',
  embedUrlTemplate: 'https://www.tiktok.com/embed/v2/{id}',
  extractors: {
    id: (url, match) => match[1],
  },
  icon: 'tiktok',
  color: '#000000',
};

/**
 * Twitter/X - Microblogging platform
 * Supports: tweets, quoted tweets
 */
export const twitter: PlatformDefinition = {
  id: 'twitter',
  name: 'Twitter/X',
  type: 'embed',
  domains: ['twitter.com', 'x.com'],
  urlPatterns: [
    /(?:twitter\.com|x\.com)\/\w+\/status\/(\d+)/,
  ],
  excludePatterns: [
    /(?:twitter\.com|x\.com)\/\w+\/?$/,  // Profile pages
    /(?:twitter\.com|x\.com)\/i\//,       // Internal pages
  ],
  oembedEndpoint: 'https://publish.twitter.com/oembed',
  // Twitter doesn't support iframe embeds, uses widget.js
  extractors: {
    id: (url, match) => match[1],
  },
  icon: 'twitter',
  color: '#1DA1F2',
};

/**
 * Instagram - Photo/video platform
 * Supports: posts, reels, IGTV
 */
export const instagram: PlatformDefinition = {
  id: 'instagram',
  name: 'Instagram',
  type: 'embed',
  domains: ['instagram.com', 'instagr.am'],
  urlPatterns: [
    /instagram\.com\/(?:p|reel|tv)\/([a-zA-Z0-9_-]+)/,
  ],
  excludePatterns: [
    /instagram\.com\/[\w.]+\/?$/,   // Profile pages
    /instagram\.com\/stories\//,     // Stories
  ],
  // Note: Instagram oEmbed requires app authentication
  embedUrlTemplate: 'https://www.instagram.com/p/{id}/embed',
  extractors: {
    id: (url, match) => match[1],
  },
  icon: 'instagram',
  color: '#E4405F',
};

/**
 * Twitch - Live streaming platform
 * Supports: videos, clips, live channels
 */
export const twitch: PlatformDefinition = {
  id: 'twitch',
  name: 'Twitch',
  type: 'embed',
  domains: ['twitch.tv', 'clips.twitch.tv'],
  urlPatterns: [
    /twitch\.tv\/videos\/(\d+)/,
    /twitch\.tv\/[\w]+\/clip\/([a-zA-Z0-9_-]+)/,
    /clips\.twitch\.tv\/([a-zA-Z0-9_-]+)/,
  ],
  excludePatterns: [
    /^https?:\/\/(www\.)?twitch\.tv\/[a-zA-Z][a-zA-Z0-9_]*\/?$/,  // Channel pages only (starts with letter, not clips.twitch.tv)
  ],
  // Twitch doesn't have public oEmbed
  embedUrlTemplate: 'https://player.twitch.tv/?video={id}&parent={host}',
  extractors: {
    id: (url, match) => match[1],
  },
  icon: 'twitch',
  color: '#9146FF',
};

/**
 * Vimeo - Video platform (professional)
 * Supports: videos, showcase, channels
 */
export const vimeo: PlatformDefinition = {
  id: 'vimeo',
  name: 'Vimeo',
  type: 'embed',
  domains: ['vimeo.com', 'player.vimeo.com'],
  urlPatterns: [
    /vimeo\.com\/(\d+)/,
    /player\.vimeo\.com\/video\/(\d+)/,
    /vimeo\.com\/channels\/[\w]+\/(\d+)/,
    /vimeo\.com\/groups\/[\w]+\/videos\/(\d+)/,
  ],
  excludePatterns: [
    /vimeo\.com\/[a-zA-Z][a-zA-Z0-9_]*\/?$/,  // User profiles (must start with letter, not number)
    /vimeo\.com\/channels\/?$/,
  ],
  oembedEndpoint: 'https://vimeo.com/api/oembed.json',
  embedUrlTemplate: 'https://player.vimeo.com/video/{id}',
  extractors: {
    id: (url, match) => match[1],
  },
  icon: 'vimeo',
  color: '#1AB7EA',
};

/**
 * SoundCloud - Audio platform
 * Supports: tracks, playlists, albums
 */
export const soundcloud: PlatformDefinition = {
  id: 'soundcloud',
  name: 'SoundCloud',
  type: 'embed',
  domains: ['soundcloud.com', 'on.soundcloud.com'],
  urlPatterns: [
    /soundcloud\.com\/[\w-]+\/[\w-]+/,  // Artist/track format
    /soundcloud\.com\/[\w-]+\/sets\/[\w-]+/,  // Playlists
    /on\.soundcloud\.com\/([a-zA-Z0-9]+)/,  // Short links
  ],
  excludePatterns: [
    /soundcloud\.com\/[\w-]+\/?$/,  // User profiles
    /soundcloud\.com\/you\//,        // Your library
  ],
  oembedEndpoint: 'https://soundcloud.com/oembed',
  // SoundCloud oEmbed returns full widget HTML
  extractors: {
    // SoundCloud uses full URL as ID
  },
  icon: 'soundcloud',
  color: '#FF5500',
};

/**
 * Apple Music - Audio platform
 * Supports: albums, songs, playlists
 */
export const appleMusic: PlatformDefinition = {
  id: 'apple-music',
  name: 'Apple Music',
  type: 'embed',
  domains: ['music.apple.com'],
  urlPatterns: [
    /music\.apple\.com\/[\w-]+\/(album|song|playlist)\/[\w-]+\/(\d+)/,
    /music\.apple\.com\/[\w-]+\/(album|song|playlist)\/[\w-]+/,
  ],
  excludePatterns: [
    /music\.apple\.com\/[\w-]+\/artist\//,  // Artist pages
  ],
  // Apple Music uses oEmbed-like API
  embedUrlTemplate: 'https://embed.music.apple.com/{region}/{type}/{id}',
  extractors: {
    id: (url, match) => match[2] || match[1],
  },
  icon: 'music',
  color: '#FA243C',
};

/**
 * Loom - Screen recording platform
 * Supports: videos, shared recordings
 */
export const loom: PlatformDefinition = {
  id: 'loom',
  name: 'Loom',
  type: 'embed',
  domains: ['loom.com', 'www.loom.com'],
  urlPatterns: [
    /loom\.com\/share\/([a-zA-Z0-9]+)/,
    /loom\.com\/embed\/([a-zA-Z0-9]+)/,
  ],
  oembedEndpoint: 'https://www.loom.com/v1/oembed',
  embedUrlTemplate: 'https://www.loom.com/embed/{id}',
  extractors: {
    id: (url, match) => match[1],
  },
  icon: 'video',
  color: '#625DF5',
};

/**
 * Bluesky - Decentralized social platform
 * Supports: posts
 */
export const bluesky: PlatformDefinition = {
  id: 'bluesky',
  name: 'Bluesky',
  type: 'embed',
  domains: ['bsky.app'],
  urlPatterns: [
    /bsky\.app\/profile\/[\w.-]+\/post\/([a-zA-Z0-9]+)/,
  ],
  excludePatterns: [
    /bsky\.app\/profile\/[\w.-]+\/?$/,  // Profile pages
  ],
  // Bluesky doesn't have public oEmbed yet
  extractors: {
    id: (url, match) => match[1],
  },
  icon: 'cloud',
  color: '#0085FF',
};

/**
 * Reddit - Forum/community platform
 * Supports: posts, comments
 */
export const reddit: PlatformDefinition = {
  id: 'reddit',
  name: 'Reddit',
  type: 'embed',
  domains: ['reddit.com', 'old.reddit.com', 'www.reddit.com'],
  urlPatterns: [
    /reddit\.com\/r\/[\w]+\/comments\/([a-zA-Z0-9]+)/,
  ],
  excludePatterns: [
    /reddit\.com\/r\/[\w]+\/?$/,     // Subreddit pages
    /reddit\.com\/user\//,            // User profiles
  ],
  oembedEndpoint: 'https://www.reddit.com/oembed',
  extractors: {
    id: (url, match) => match[1],
  },
  icon: 'message-circle',
  color: '#FF4500',
};

/**
 * Threads - Meta's text platform
 * Supports: posts
 */
export const threads: PlatformDefinition = {
  id: 'threads',
  name: 'Threads',
  type: 'embed',
  domains: ['threads.net'],
  urlPatterns: [
    /threads\.net\/@?[\w.]+\/post\/([a-zA-Z0-9_-]+)/,
  ],
  excludePatterns: [
    /threads\.net\/@?[\w.]+\/?$/,  // Profile pages
  ],
  // Threads doesn't have public oEmbed yet
  extractors: {
    id: (url, match) => match[1],
  },
  icon: 'at-sign',
  color: '#000000',
};

/**
 * Bandcamp - Independent music platform
 * Supports: tracks, albums
 */
export const bandcamp: PlatformDefinition = {
  id: 'bandcamp',
  name: 'Bandcamp',
  type: 'embed',
  domains: ['bandcamp.com'],
  urlPatterns: [
    /([a-zA-Z0-9_-]+)\.bandcamp\.com\/(track|album)\/([a-zA-Z0-9_-]+)/,
  ],
  excludePatterns: [
    /^https?:\/\/[a-zA-Z0-9_-]+\.bandcamp\.com\/?$/,  // Artist pages
  ],
  // Bandcamp has no public oEmbed but allows iframe embeds
  embedUrlTemplate: 'https://bandcamp.com/EmbeddedPlayer/{type}={id}',
  extractors: {
    id: (url, match) => match[3],
  },
  icon: 'music',
  color: '#629AA9',
};

/**
 * Dailymotion - Video platform
 * Supports: videos
 */
export const dailymotion: PlatformDefinition = {
  id: 'dailymotion',
  name: 'Dailymotion',
  type: 'embed',
  domains: ['dailymotion.com', 'dai.ly'],
  urlPatterns: [
    /dailymotion\.com\/video\/([a-zA-Z0-9]+)/,
    /dai\.ly\/([a-zA-Z0-9]+)/,
  ],
  excludePatterns: [
    /dailymotion\.com\/[a-zA-Z0-9_-]+\/?$/,  // User profiles
  ],
  oembedEndpoint: 'https://www.dailymotion.com/services/oembed',
  embedUrlTemplate: 'https://www.dailymotion.com/embed/video/{id}',
  extractors: {
    id: (url, match) => match[1],
  },
  icon: 'video',
  color: '#0066DC',
};

/**
 * Wistia - Business video platform
 * Supports: videos
 */
export const wistia: PlatformDefinition = {
  id: 'wistia',
  name: 'Wistia',
  type: 'embed',
  domains: ['wistia.com', 'wistia.net', 'wi.st'],
  urlPatterns: [
    /wistia\.com\/medias\/([a-zA-Z0-9]+)/,
    /([a-zA-Z0-9_-]+)\.wistia\.com\/medias\/([a-zA-Z0-9]+)/,
    /wi\.st\/([a-zA-Z0-9]+)/,
  ],
  oembedEndpoint: 'https://fast.wistia.com/oembed',
  embedUrlTemplate: 'https://fast.wistia.net/embed/iframe/{id}',
  extractors: {
    id: (url, match) => match[2] || match[1],
  },
  icon: 'video',
  color: '#54BBFF',
};

/**
 * Mixcloud - DJ mixes and radio shows
 * Supports: tracks, playlists
 */
export const mixcloud: PlatformDefinition = {
  id: 'mixcloud',
  name: 'Mixcloud',
  type: 'embed',
  domains: ['mixcloud.com'],
  urlPatterns: [
    /mixcloud\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/,
  ],
  excludePatterns: [
    /^https?:\/\/(?:www\.)?mixcloud\.com\/[a-zA-Z0-9_-]+\/?$/,  // User profiles
  ],
  oembedEndpoint: 'https://www.mixcloud.com/oembed/',
  extractors: {
    id: (url, match) => `${match[1]}/${match[2]}`,
  },
  icon: 'music',
  color: '#5000FF',
};

/**
 * Deezer - Music streaming platform
 * Supports: tracks, albums, playlists
 */
export const deezer: PlatformDefinition = {
  id: 'deezer',
  name: 'Deezer',
  type: 'embed',
  domains: ['deezer.com'],
  urlPatterns: [
    /deezer\.com\/(?:[a-z]{2}\/)?(track|album|playlist)\/(\d+)/,
  ],
  excludePatterns: [
    /deezer\.com\/(?:[a-z]{2}\/)?artist\//,  // Artist pages
  ],
  oembedEndpoint: 'https://api.deezer.com/oembed',
  embedUrlTemplate: 'https://widget.deezer.com/widget/dark/{type}/{id}',
  extractors: {
    id: (url, match) => match[2],
  },
  icon: 'music',
  color: '#FEAA2D',
};

/**
 * Kickstarter - Crowdfunding platform
 * Supports: project pages
 */
export const kickstarter: PlatformDefinition = {
  id: 'kickstarter',
  name: 'Kickstarter',
  type: 'embed',
  domains: ['kickstarter.com'],
  urlPatterns: [
    /kickstarter\.com\/projects\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/,
  ],
  oembedEndpoint: 'https://www.kickstarter.com/services/oembed',
  extractors: {
    id: (url, match) => `${match[1]}/${match[2]}`,
  },
  icon: 'rocket',
  color: '#05CE78',
};

/**
 * Indiegogo - Crowdfunding platform
 * Supports: campaign pages
 */
export const indiegogo: PlatformDefinition = {
  id: 'indiegogo',
  name: 'Indiegogo',
  type: 'embed',
  domains: ['indiegogo.com'],
  urlPatterns: [
    /indiegogo\.com\/projects\/([a-zA-Z0-9_-]+)/,
  ],
  oembedEndpoint: 'https://www.indiegogo.com/services/oembed',
  extractors: {
    id: (url, match) => match[1],
  },
  icon: 'rocket',
  color: '#EB1478',
};

/**
 * Streamable - Short video hosting
 * Supports: videos
 */
export const streamable: PlatformDefinition = {
  id: 'streamable',
  name: 'Streamable',
  type: 'embed',
  domains: ['streamable.com'],
  urlPatterns: [
    /streamable\.com\/([a-zA-Z0-9]+)/,
  ],
  oembedEndpoint: 'https://api.streamable.com/oembed.json',
  embedUrlTemplate: 'https://streamable.com/e/{id}',
  extractors: {
    id: (url, match) => match[1],
  },
  icon: 'video',
  color: '#0F90FA',
};

/**
 * Tumblr - Blogging platform posts
 * Supports: posts
 */
export const tumblr: PlatformDefinition = {
  id: 'tumblr',
  name: 'Tumblr',
  type: 'embed',
  domains: ['tumblr.com'],
  urlPatterns: [
    /([a-zA-Z0-9_-]+)\.tumblr\.com\/post\/(\d+)/,
    /tumblr\.com\/([a-zA-Z0-9_-]+)\/(\d+)/,
  ],
  excludePatterns: [
    /^https?:\/\/[a-zA-Z0-9_-]+\.tumblr\.com\/?$/,  // Blog home pages
  ],
  oembedEndpoint: 'https://www.tumblr.com/oembed/1.0',
  extractors: {
    id: (url, match) => match[2],
  },
  icon: 'edit',
  color: '#36465D',
};

/**
 * Pinterest - Pin embeds
 * Supports: pins, boards
 */
export const pinterest: PlatformDefinition = {
  id: 'pinterest',
  name: 'Pinterest',
  type: 'embed',
  domains: ['pinterest.com', 'pin.it'],
  urlPatterns: [
    /pinterest\.com\/pin\/(\d+)/,
    /pin\.it\/([a-zA-Z0-9]+)/,
  ],
  excludePatterns: [
    /pinterest\.com\/[a-zA-Z0-9_]+\/?$/,  // User profiles
    /pinterest\.com\/(?!pin\/)[a-zA-Z0-9_]+\/[a-zA-Z0-9_-]+\/?$/,  // Boards (but not /pin/ URLs)
  ],
  oembedEndpoint: 'https://www.pinterest.com/oembed.json',
  extractors: {
    id: (url, match) => match[1],
  },
  icon: 'pinterest',
  color: '#E60023',
};

/**
 * Giphy - GIF platform
 * Supports: GIFs
 */
export const giphy: PlatformDefinition = {
  id: 'giphy',
  name: 'Giphy',
  type: 'embed',
  domains: ['giphy.com', 'media.giphy.com'],
  urlPatterns: [
    /giphy\.com\/gifs\/(?:[a-zA-Z0-9_-]+-)*([a-zA-Z0-9]+)/,
    /giphy\.com\/embed\/([a-zA-Z0-9]+)/,
    /media\.giphy\.com\/media\/([a-zA-Z0-9]+)/,
  ],
  oembedEndpoint: 'https://giphy.com/services/oembed',
  embedUrlTemplate: 'https://giphy.com/embed/{id}',
  extractors: {
    id: (url, match) => match[1],
  },
  icon: 'image',
  color: '#FF6666',
};

/**
 * Flickr - Photo sharing
 * Supports: photos, albums
 */
export const flickr: PlatformDefinition = {
  id: 'flickr',
  name: 'Flickr',
  type: 'embed',
  domains: ['flickr.com', 'flic.kr'],
  urlPatterns: [
    /flickr\.com\/photos\/([a-zA-Z0-9@_-]+)\/(\d+)/,
    /flic\.kr\/p\/([a-zA-Z0-9]+)/,
  ],
  excludePatterns: [
    /flickr\.com\/photos\/[a-zA-Z0-9@_-]+\/?$/,  // User photostreams
  ],
  oembedEndpoint: 'https://www.flickr.com/services/oembed/',
  extractors: {
    id: (url, match) => match[2] || match[1],
  },
  icon: 'camera',
  color: '#0063DC',
};

/**
 * SlideShare - Presentation sharing
 * Supports: presentations, documents
 */
export const slideshare: PlatformDefinition = {
  id: 'slideshare',
  name: 'SlideShare',
  type: 'embed',
  domains: ['slideshare.net'],
  urlPatterns: [
    /slideshare\.net\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/,
  ],
  excludePatterns: [
    /^https?:\/\/(?:www\.)?slideshare\.net\/[a-zA-Z0-9_-]+\/?$/,  // User profiles
  ],
  oembedEndpoint: 'https://www.slideshare.net/api/oembed/2',
  extractors: {
    id: (url, match) => `${match[1]}/${match[2]}`,
  },
  icon: 'presentation',
  color: '#0077B5',
};

/**
 * CodePen - Frontend code playground
 * Supports: pens
 */
export const codepen: PlatformDefinition = {
  id: 'codepen',
  name: 'CodePen',
  type: 'embed',
  domains: ['codepen.io'],
  urlPatterns: [
    /codepen\.io\/([a-zA-Z0-9_-]+)\/pen\/([a-zA-Z0-9]+)/,
    /codepen\.io\/([a-zA-Z0-9_-]+)\/full\/([a-zA-Z0-9]+)/,
  ],
  excludePatterns: [
    /^https?:\/\/codepen\.io\/[a-zA-Z0-9_-]+\/?$/,  // User profiles
  ],
  oembedEndpoint: 'https://codepen.io/api/oembed',
  embedUrlTemplate: 'https://codepen.io/{user}/embed/{id}',
  extractors: {
    id: (url, match) => match[2],
  },
  icon: 'code',
  color: '#000000',
};

/**
 * CodeSandbox - Full IDE in browser
 * Supports: sandboxes
 */
export const codesandbox: PlatformDefinition = {
  id: 'codesandbox',
  name: 'CodeSandbox',
  type: 'embed',
  domains: ['codesandbox.io'],
  urlPatterns: [
    /codesandbox\.io\/s\/([a-zA-Z0-9_-]+)/,
    /codesandbox\.io\/embed\/([a-zA-Z0-9_-]+)/,
  ],
  oembedEndpoint: 'https://codesandbox.io/oembed',
  embedUrlTemplate: 'https://codesandbox.io/embed/{id}',
  extractors: {
    id: (url, match) => match[1],
  },
  icon: 'code',
  color: '#151515',
};

/**
 * Figma - Design tool embeds
 * Supports: files, prototypes
 */
export const figma: PlatformDefinition = {
  id: 'figma',
  name: 'Figma',
  type: 'embed',
  domains: ['figma.com'],
  urlPatterns: [
    /figma\.com\/file\/([a-zA-Z0-9]+)/,
    /figma\.com\/proto\/([a-zA-Z0-9]+)/,
    /figma\.com\/design\/([a-zA-Z0-9]+)/,
  ],
  oembedEndpoint: 'https://www.figma.com/api/oembed',
  embedUrlTemplate: 'https://www.figma.com/embed?embed_host=share&url={url}',
  extractors: {
    id: (url, match) => match[1],
  },
  icon: 'figma',
  color: '#F24E1E',
};

/**
 * Notion - Workspace pages (public)
 * Supports: public pages
 */
export const notion: PlatformDefinition = {
  id: 'notion',
  name: 'Notion',
  type: 'embed',
  domains: ['notion.so', 'notion.site'],
  urlPatterns: [
    /notion\.so\/([a-zA-Z0-9-]+)-([a-f0-9]{32})/,
    /notion\.site\/([a-zA-Z0-9-]+)-([a-f0-9]{32})/,
    /([a-zA-Z0-9-]+)\.notion\.site\/([a-zA-Z0-9-]+)-([a-f0-9]{32})/,
  ],
  extractors: {
    id: (url, match) => match[2] || match[3],
  },
  icon: 'file-text',
  color: '#000000',
};

/**
 * Calendly - Scheduling embeds
 * Supports: scheduling pages
 */
export const calendly: PlatformDefinition = {
  id: 'calendly',
  name: 'Calendly',
  type: 'embed',
  domains: ['calendly.com'],
  urlPatterns: [
    /calendly\.com\/([a-zA-Z0-9_-]+)\/([a-zA-Z0-9_-]+)/,
    /calendly\.com\/([a-zA-Z0-9_-]+)\/?$/,
  ],
  extractors: {
    id: (url, match) => match[2] ? `${match[1]}/${match[2]}` : match[1],
  },
  icon: 'calendar',
  color: '#006BFF',
};

/**
 * Typeform - Form embeds
 * Supports: forms, surveys
 */
export const typeform: PlatformDefinition = {
  id: 'typeform',
  name: 'Typeform',
  type: 'embed',
  domains: ['typeform.com'],
  urlPatterns: [
    /([a-zA-Z0-9_-]+)\.typeform\.com\/to\/([a-zA-Z0-9]+)/,
  ],
  oembedEndpoint: 'https://api.typeform.com/oembed',
  embedUrlTemplate: 'https://{user}.typeform.com/to/{id}',
  extractors: {
    id: (url, match) => match[2],
  },
  icon: 'file-text',
  color: '#262627',
};

/**
 * Rumble - Video platform
 * Supports: videos
 */
export const rumble: PlatformDefinition = {
  id: 'rumble',
  name: 'Rumble',
  type: 'embed',
  domains: ['rumble.com'],
  urlPatterns: [
    /rumble\.com\/([a-zA-Z0-9]+)-/,
    /rumble\.com\/embed\/([a-zA-Z0-9]+)/,
  ],
  excludePatterns: [
    /rumble\.com\/c\//,  // Channel pages
    /rumble\.com\/user\//,  // User pages
  ],
  oembedEndpoint: 'https://rumble.com/api/Media/oembed.json',
  embedUrlTemplate: 'https://rumble.com/embed/{id}',
  extractors: {
    id: (url, match) => match[1],
  },
  icon: 'video',
  color: '#85C742',
};

/**
 * Anchor.fm - Podcast platform (now Spotify for Podcasters)
 * Supports: episodes
 */
export const anchor: PlatformDefinition = {
  id: 'anchor',
  name: 'Anchor',
  type: 'embed',
  domains: ['anchor.fm'],
  urlPatterns: [
    /anchor\.fm\/([a-zA-Z0-9_-]+)\/episodes\/([a-zA-Z0-9_-]+)/,
  ],
  excludePatterns: [
    /^https?:\/\/anchor\.fm\/[a-zA-Z0-9_-]+\/?$/,  // Show pages
  ],
  embedUrlTemplate: 'https://anchor.fm/{show}/embed/episodes/{episode}',
  extractors: {
    id: (url, match) => match[2],
  },
  icon: 'mic',
  color: '#5000B9',
};

/**
 * Transistor.fm - Podcast hosting
 * Supports: episodes
 */
export const transistor: PlatformDefinition = {
  id: 'transistor',
  name: 'Transistor',
  type: 'embed',
  domains: ['share.transistor.fm'],
  urlPatterns: [
    /share\.transistor\.fm\/s\/([a-zA-Z0-9-]+)/,
    /share\.transistor\.fm\/e\/([a-zA-Z0-9-]+)/,
  ],
  oembedEndpoint: 'https://share.transistor.fm/oembed',
  extractors: {
    id: (url, match) => match[1],
  },
  icon: 'mic',
  color: '#8B5CF6',
};

/**
 * Simplecast - Podcast hosting
 * Supports: episodes
 */
export const simplecast: PlatformDefinition = {
  id: 'simplecast',
  name: 'Simplecast',
  type: 'embed',
  domains: ['simplecast.com', 'player.simplecast.com'],
  urlPatterns: [
    /simplecast\.com\/episodes\/([a-zA-Z0-9-]+)/,
    /player\.simplecast\.com\/([a-zA-Z0-9-]+)/,
  ],
  oembedEndpoint: 'https://simplecast.com/oembed',
  embedUrlTemplate: 'https://player.simplecast.com/{id}',
  extractors: {
    id: (url, match) => match[1],
  },
  icon: 'mic',
  color: '#F5A623',
};

/**
 * Google Maps - Location embeds
 * Supports: places, directions
 */
export const googleMaps: PlatformDefinition = {
  id: 'google-maps',
  name: 'Google Maps',
  type: 'embed',
  domains: ['google.com', 'maps.google.com', 'goo.gl'],
  urlPatterns: [
    /google\.com\/maps\/place\/([^\/]+)/,
    /google\.com\/maps\/embed\?pb=([^&]+)/,
    /maps\.google\.com\/\?q=([^&]+)/,
    /goo\.gl\/maps\/([a-zA-Z0-9]+)/,
  ],
  extractors: {
    id: (url, match) => match[1],
  },
  icon: 'map-pin',
  color: '#4285F4',
};

/**
 * All embed platforms in one array
 */
export const EMBED_PLATFORMS: PlatformDefinition[] = [
  // Video platforms
  youtube,
  vimeo,
  dailymotion,
  wistia,
  loom,
  rumble,
  streamable,

  // Social/content platforms
  twitter,
  instagram,
  tiktok,
  twitch,
  bluesky,
  reddit,
  threads,
  tumblr,
  pinterest,

  // Music/audio platforms
  spotify,
  soundcloud,
  appleMusic,
  bandcamp,
  mixcloud,
  deezer,

  // Podcast platforms
  anchor,
  transistor,
  simplecast,

  // Developer/design tools
  codepen,
  codesandbox,
  figma,
  notion,
  slideshare,

  // Productivity/forms
  calendly,
  typeform,

  // Crowdfunding
  kickstarter,
  indiegogo,

  // Media
  giphy,
  flickr,
  googleMaps,
];

/**
 * Get embed platform by ID
 */
export function getEmbedPlatform(id: string): PlatformDefinition | undefined {
  return EMBED_PLATFORMS.find(p => p.id === id);
}

/**
 * Get embed platform by domain
 */
export function getEmbedPlatformByDomain(domain: string): PlatformDefinition | undefined {
  const normalizedDomain = domain.replace(/^www\./, '').toLowerCase();
  return EMBED_PLATFORMS.find(p =>
    p.domains.some(d => d === normalizedDomain || normalizedDomain.endsWith('.' + d))
  );
}
