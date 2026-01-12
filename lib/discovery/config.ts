/**
 * Discovery Curation Team - Category Configuration
 *
 * Search queries, feeds, and settings for each category.
 */

import type { CategoryConfig, DiscoveryCategory, DiscoveryRunConfig } from './types';

// ============================================================================
// Default Run Configuration
// ============================================================================

export const DEFAULT_RUN_CONFIG: DiscoveryRunConfig = {
  maxSources: 10,
  maxProductsPerSource: 15,
  skipExisting: true,
  dryRun: false,
  youtubeEnabled: true,
  tiktokEnabled: true,
  rssEnabled: true,
  minConfidence: 60,
  // Deduplication defaults - prevent over-repetition
  skipSourcesFromLastNDays: 14, // Don't reuse sources from last 2 weeks
  maxProductRepeatPercent: 30, // Allow up to 30% repeat products for trending
  skipSourcesFromLastNRuns: 2, // Skip sources used in last 2 runs
};

// ============================================================================
// Category Configurations
// ============================================================================

export const CATEGORY_CONFIGS: Record<DiscoveryCategory, CategoryConfig> = {
  golf: {
    name: 'golf',
    displayName: 'Golf',
    // Queries for TRENDING content (popular, viral, what people are using)
    youtubeQueries: [
      // What's in the bag style
      "what's in my golf bag 2025",
      "what's in the bag pga tour 2025",
      'witb golf 2025',
      'golf bag tour pro',
      'pro golfer witb',
      // Reviews and comparisons
      'best golf driver 2025 review',
      'golf iron comparison 2025',
      'best putter 2025',
      'golf ball comparison test',
      'best golf wedges 2025',
      // Popular creators
      'rick shiels golf review',
      'mark crossfield golf',
      'golf sidekick review',
      'peter finch golf',
      'me and my golf gear',
    ],
    // Queries for NEW RELEASES (recent product launches)
    newReleaseQueries: [
      'new golf clubs 2025',
      'titleist 2025 release',
      'taylormade 2025 launch',
      'callaway 2025 new',
      'ping 2025 announcement',
      'cobra 2025 golf',
      'new driver release golf',
      'just released golf equipment',
      'golf equipment news',
    ],
    // Known reliable YouTube channels for golf gear
    youtubeChannels: [
      'UCfx0cxGmGPBiAKHGs-lqLmQ', // Rick Shiels
      'UCT2XVgCaJDHN9P5aJF9fFgg', // TXG Tour Experience Golf
      'UC-5WgW5f6bnVNOdSWcBt56g', // Mark Crossfield
      'UC4pVN_FE33Y-7iXLB6Y2G5Q', // 2nd Swing Golf
      'UCJk-0h1hLxpB6E-w2Xn_s9g', // MyGolfSpy
    ],
    tiktokHashtags: ['#golfbag', '#golfgear', '#whatsinthebag', '#golftok', '#golfclub', '#witb', '#newgolfclubs', '#golfequipment'],
    releaseFeeds: [
      {
        name: 'MyGolfSpy',
        url: 'https://mygolfspy.com/feed/',
        type: 'rss',
      },
      {
        name: 'GolfWRX',
        url: 'https://www.golfwrx.com/feed/',
        type: 'rss',
      },
      {
        name: 'Golf Digest',
        url: 'https://www.golfdigest.com/feed/rss',
        type: 'rss',
      },
      {
        name: 'Golf.com',
        url: 'https://golf.com/feed/',
        type: 'rss',
      },
    ],
    productTypes: ['drivers', 'fairway woods', 'hybrids', 'irons', 'wedges', 'putters', 'golf balls', 'golf bags', 'rangefinders', 'golf shoes', 'golf gloves', 'golf GPS'],
    brandKeywords: [
      'Titleist', 'TaylorMade', 'Callaway', 'Ping', 'Cobra', 'Mizuno', 'Srixon', 'Cleveland',
      'Scotty Cameron', 'Odyssey', 'Vokey', 'Pro V1', 'Stealth', 'Paradym', 'G430', 'SIM',
      'TP5', 'Chrome Soft', 'Z-Star', 'FootJoy', 'Bushnell', 'Garmin', 'Bridgestone',
      'PXG', 'Tour Edge', 'Wilson', 'Honma', 'Bettinardi', 'Evnroll',
    ],
    bagTitleTemplate: "What's Trending in Golf",
    minVideoViews: 2000, // Lowered to catch more content
  },

  tech: {
    name: 'tech',
    displayName: 'Tech & Gadgets',
    youtubeQueries: [
      'desk setup tour 2025',
      "what's in my tech bag 2025",
      'best gadgets 2025',
      'tech edc',
      'ultimate desk setup',
      'home office tour',
      'best tech accessories',
      'productivity setup',
    ],
    tiktokHashtags: ['#techsetup', '#desksetup', '#techtok', '#gadgets', '#techgear', '#homeoffice'],
    releaseFeeds: [
      {
        name: 'The Verge',
        url: 'https://www.theverge.com/rss/index.xml',
        type: 'rss',
      },
      {
        name: 'Engadget',
        url: 'https://www.engadget.com/rss.xml',
        type: 'rss',
      },
      {
        name: 'TechRadar',
        url: 'https://www.techradar.com/rss',
        type: 'rss',
      },
    ],
    productTypes: ['laptops', 'monitors', 'keyboards', 'mice', 'headphones', 'webcams', 'microphones', 'speakers', 'docks', 'cables', 'chargers'],
    brandKeywords: [
      'Apple', 'Samsung', 'Sony', 'Logitech', 'Razer', 'Keychron', 'Dell', 'LG', 'ASUS', 'Lenovo',
      'Bose', 'Sennheiser', 'Audio-Technica', 'Elgato', 'Anker', 'CalDigit', 'Shure', 'Blue',
      'MacBook', 'iPad', 'iPhone', 'AirPods', 'MX Master', 'Studio Display',
    ],
    bagTitleTemplate: "What's Trending in Tech",
    minVideoViews: 10000,
  },

  photography: {
    name: 'photography',
    displayName: 'Photography & Video',
    youtubeQueries: [
      "what's in my camera bag 2025",
      'photography gear tour',
      'best camera gear 2025',
      'camera bag essentials',
      'filmmaker gear',
      'video production setup',
      'best lenses 2025',
      'camera review',
    ],
    tiktokHashtags: ['#cameragear', '#photographygear', '#camerabag', '#filmmaking', '#cinematography', '#photogear'],
    releaseFeeds: [
      {
        name: 'PetaPixel',
        url: 'https://petapixel.com/feed/',
        type: 'rss',
      },
      {
        name: 'Fstoppers',
        url: 'https://fstoppers.com/rss.xml',
        type: 'rss',
      },
      {
        name: 'Cinema5D',
        url: 'https://www.cinema5d.com/feed/',
        type: 'rss',
      },
    ],
    productTypes: ['cameras', 'lenses', 'tripods', 'gimbals', 'camera bags', 'lighting', 'filters', 'memory cards', 'monitors', 'microphones'],
    brandKeywords: [
      'Sony', 'Canon', 'Nikon', 'Fujifilm', 'Panasonic', 'Blackmagic', 'RED', 'ARRI',
      'Sigma', 'Tamron', 'Zeiss', 'DJI', 'Manfrotto', 'Peak Design', 'SmallRig', 'Atomos',
      'A7', 'R5', 'Z8', 'X-T5', 'GH6', 'FX30', 'Ronin', 'Aputure',
    ],
    bagTitleTemplate: "What's Trending in Photography",
    minVideoViews: 5000,
  },

  edc: {
    name: 'edc',
    displayName: 'Everyday Carry',
    youtubeQueries: [
      'everyday carry 2025',
      'edc pocket dump',
      "what's in my pockets",
      'best edc gear 2025',
      'edc essentials',
      'minimalist edc',
      'urban edc',
      'edc loadout',
    ],
    tiktokHashtags: ['#edc', '#everydaycarry', '#pocketdump', '#edcgear', '#knifecommunity', '#edclife'],
    releaseFeeds: [
      {
        name: 'Everyday Carry',
        url: 'https://everydaycarry.com/feed',
        type: 'rss',
      },
      {
        name: 'Carryology',
        url: 'https://www.carryology.com/feed/',
        type: 'rss',
      },
      {
        name: 'Gear Patrol',
        url: 'https://www.gearpatrol.com/feed/',
        type: 'rss',
      },
    ],
    productTypes: ['knives', 'flashlights', 'wallets', 'multitools', 'pens', 'watches', 'bags', 'key organizers', 'lighters', 'notebooks'],
    brandKeywords: [
      'Benchmade', 'Spyderco', 'Chris Reeve', 'Microtech', 'Leatherman', 'Victorinox',
      'Olight', 'Fenix', 'Surefire', 'Fisher Space Pen', 'Tactile Turn', 'Big Idea Design',
      'Ridge', 'Bellroy', 'Secrid', 'Casio', 'G-Shock', 'Seiko', 'Citizen',
    ],
    bagTitleTemplate: "What's Trending in EDC",
    minVideoViews: 3000,
  },

  fitness: {
    name: 'fitness',
    displayName: 'Fitness & Gym',
    youtubeQueries: [
      'home gym tour 2025',
      'gym bag essentials',
      'best fitness gear 2025',
      'workout equipment review',
      'garage gym setup',
      'fitness equipment haul',
      'best gym accessories',
      'home workout setup',
    ],
    tiktokHashtags: ['#gymgear', '#fitnessgear', '#homegym', '#garagegym', '#gymtok', '#workoutgear'],
    releaseFeeds: [
      {
        name: 'Garage Gym Reviews',
        url: 'https://www.garagegymreviews.com/feed/',
        type: 'rss',
      },
      {
        name: 'BarBend',
        url: 'https://barbend.com/feed/',
        type: 'rss',
      },
    ],
    productTypes: ['barbells', 'dumbbells', 'kettlebells', 'racks', 'benches', 'cardio machines', 'resistance bands', 'gym bags', 'shoes', 'supplements'],
    brandKeywords: [
      'Rogue', 'REP Fitness', 'Titan', 'Eleiko', 'Kabuki', 'Bells of Steel',
      'Nike', 'Adidas', 'Under Armour', 'Reebok', 'Nobull', 'Metcon',
      'Peloton', 'Concept2', 'Assault', 'Bowflex', 'NordicTrack', 'Optimum Nutrition',
    ],
    bagTitleTemplate: "What's Trending in Fitness",
    minVideoViews: 5000,
  },
};

// ============================================================================
// Helper Functions
// ============================================================================

export function getCategoryConfig(category: DiscoveryCategory): CategoryConfig {
  return CATEGORY_CONFIGS[category];
}

export function getAllCategories(): DiscoveryCategory[] {
  return Object.keys(CATEGORY_CONFIGS) as DiscoveryCategory[];
}

export function isValidCategory(category: string): category is DiscoveryCategory {
  return category in CATEGORY_CONFIGS;
}

export function getYouTubeSearchQueries(category: DiscoveryCategory): string[] {
  return CATEGORY_CONFIGS[category].youtubeQueries;
}

export function getTikTokHashtags(category: DiscoveryCategory): string[] {
  return CATEGORY_CONFIGS[category].tiktokHashtags;
}

export function getReleaseFeeds(category: DiscoveryCategory) {
  return CATEGORY_CONFIGS[category].releaseFeeds;
}

export function getBrandKeywords(category: DiscoveryCategory): string[] {
  return CATEGORY_CONFIGS[category].brandKeywords;
}

/**
 * Generate a bag title for the category
 */
export function generateBagTitle(category: DiscoveryCategory, theme?: string): string {
  const config = CATEGORY_CONFIGS[category];
  const date = new Date();
  const weekStart = new Date(date.setDate(date.getDate() - date.getDay()));
  const monthName = weekStart.toLocaleString('default', { month: 'long' });
  const day = weekStart.getDate();
  const year = weekStart.getFullYear();

  if (theme) {
    return theme;
  }

  return `${config.bagTitleTemplate} - Week of ${monthName} ${day}, ${year}`;
}

/**
 * Generate bag description
 */
export function generateBagDescription(category: DiscoveryCategory, sourceCount: number): string {
  const config = CATEGORY_CONFIGS[category];
  return `The hottest ${config.displayName.toLowerCase()} picks curated from ${sourceCount} trending videos and articles. Discover what creators are using and recommending right now.`;
}
