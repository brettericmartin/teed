// ═══════════════════════════════════════════════════════════════════
// Rising Posts Discovery System — Types & Config
// ═══════════════════════════════════════════════════════════════════

export type RisingPlatform = 'reddit' | 'youtube' | 'tiktok';

export type RisingCategory =
  | 'tech'
  | 'beauty'
  | 'edc'
  | 'golf'
  | 'travel'
  | 'fashion'
  | 'fitness'
  | 'gaming'
  | 'photography'
  | 'espresso';

export const CATEGORY_LABELS: Record<RisingCategory, string> = {
  tech: 'Tech / Desk',
  beauty: 'Beauty',
  edc: 'EDC / Bags',
  golf: 'Golf',
  travel: 'Travel',
  fashion: 'Fashion',
  fitness: 'Fitness',
  gaming: 'Gaming',
  photography: 'Photography',
  espresso: 'Espresso / Coffee',
};

export const CATEGORY_COLORS: Record<RisingCategory, string> = {
  tech: 'var(--sky-9)',
  beauty: 'var(--copper-9)',
  edc: 'var(--amber-9)',
  golf: 'var(--teed-green-9)',
  travel: 'var(--evergreen-9)',
  fashion: 'var(--sand-9)',
  fitness: 'var(--copper-9)',
  gaming: 'var(--sky-9)',
  photography: 'var(--grey-9)',
  espresso: 'var(--amber-9)',
};

// ─── Subreddit Config ────────────────────────────────────────────

interface SubredditEntry {
  sub: string;
  label: string;
}

export const SUBREDDIT_CONFIG: Record<RisingCategory, SubredditEntry[]> = {
  tech: [
    { sub: 'battlestations', label: 'r/battlestations' },
    { sub: 'desksetup', label: 'r/desksetup' },
    { sub: 'MechanicalKeyboards', label: 'r/MechanicalKeyboards' },
    { sub: 'audiophile', label: 'r/audiophile' },
    { sub: 'macsetups', label: 'r/macsetups' },
    { sub: 'workspaces', label: 'r/workspaces' },
  ],
  beauty: [
    { sub: 'Sephora', label: 'r/Sephora' },
    { sub: 'MakeupAddiction', label: 'r/MakeupAddiction' },
    { sub: 'SkincareAddiction', label: 'r/SkincareAddiction' },
    { sub: '30PlusSkinCare', label: 'r/30PlusSkinCare' },
    { sub: 'curlyhair', label: 'r/curlyhair' },
  ],
  edc: [
    { sub: 'EDC', label: 'r/EDC' },
    { sub: 'handbags', label: 'r/handbags' },
    { sub: 'BuyItForLife', label: 'r/BuyItForLife' },
    { sub: 'whatsinthebag', label: 'r/whatsinthebag' },
  ],
  golf: [
    { sub: 'golf', label: 'r/golf' },
    { sub: 'golfequipment', label: 'r/golfequipment' },
  ],
  travel: [
    { sub: 'onebag', label: 'r/onebag' },
    { sub: 'HerOneBag', label: 'r/HerOneBag' },
    { sub: 'travel', label: 'r/travel' },
  ],
  fashion: [
    { sub: 'malefashionadvice', label: 'r/malefashionadvice' },
    { sub: 'femalefashionadvice', label: 'r/femalefashionadvice' },
    { sub: 'frugalmalefashion', label: 'r/frugalmalefashion' },
  ],
  fitness: [
    { sub: 'homegym', label: 'r/homegym' },
    { sub: 'GarminWatches', label: 'r/GarminWatches' },
  ],
  gaming: [
    { sub: 'gamingsetups', label: 'r/gamingsetups' },
    { sub: 'pcmasterrace', label: 'r/pcmasterrace' },
  ],
  photography: [
    { sub: 'photography', label: 'r/photography' },
    { sub: 'videography', label: 'r/videography' },
  ],
  espresso: [
    { sub: 'espresso', label: 'r/espresso' },
    { sub: 'Coffee', label: 'r/Coffee' },
  ],
};

// ─── YouTube Search Queries ──────────────────────────────────────

export const YOUTUBE_QUERIES: Record<RisingCategory, string[]> = {
  tech: ['desk setup tour 2025', 'best desk accessories', 'home office setup'],
  beauty: ['makeup routine haul', 'skincare routine products', 'beauty favorites'],
  edc: ['everyday carry 2025', 'what\'s in my bag EDC', 'EDC pocket dump'],
  golf: ['what\'s in the bag golf 2025', 'golf equipment review', 'new golf clubs'],
  travel: ['travel packing essentials', 'one bag travel gear', 'carry on packing'],
  fashion: ['wardrobe essentials men', 'outfit of the day haul', 'fashion favorites'],
  fitness: ['home gym setup tour', 'best fitness gadgets', 'gym bag essentials'],
  gaming: ['gaming setup tour 2025', 'best gaming peripherals', 'PC build showcase'],
  photography: ['camera gear what\'s in my bag', 'photography kit 2025', 'filmmaker gear'],
  espresso: ['espresso setup tour', 'home barista gear', 'coffee equipment review'],
};

// ─── TikTok Hashtags ─────────────────────────────────────────────

export const TIKTOK_HASHTAGS: Record<RisingCategory, string[]> = {
  tech: ['desksetup', 'techsetup', 'battlestation', 'mechanicalkeyboard', 'deskgoals'],
  beauty: ['grwm', 'makeuphaul', 'sephorahaul', 'skincareproducts', 'beautyfavorites'],
  edc: ['edc', 'everydaycarry', 'pocketdump', 'whatsinthebag', 'edcgear'],
  golf: ['golfgear', 'witb', 'golfequipment', 'golfclub'],
  travel: ['packwithme', 'travelessentials', 'onebag', 'travelgear'],
  fashion: ['ootd', 'outfitinspo', 'fashionhaul', 'wardrobeessentials'],
  fitness: ['homegym', 'gymsetup', 'fitnessgear', 'garminwatch'],
  gaming: ['gamingsetup', 'pcsetup', 'gamingroom', 'pcgaming'],
  photography: ['cameragear', 'photographykit', 'filmmakergear', 'camerasetup'],
  espresso: ['espressosetup', 'homebarista', 'coffeegear', 'espressotok'],
};

// ─── Scoring Keywords & Flairs ───────────────────────────────────

export const CURATION_KEYWORDS = [
  'setup', 'carry', 'haul', 'bag', 'collection', 'rotation', 'dump',
  'packing', 'bought', 'recommendation', 'routine', 'kit', 'gear',
  'essentials', 'favorite', 'favourites', 'review', 'witb', "what's in",
  'whats in', 'products', 'list', 'peripherals', 'gadgets', 'edc',
  'flatlay', 'flat lay', 'daily', 'travel', 'loadout', 'inventory',
  'my .* setup', 'starter', 'upgrade', 'new to', 'first time',
  'rate my', 'roast my', 'show me yours',
];

export const GOOD_FLAIRS = [
  'rotation', 'bag', 'pocket dump', 'packing list', 'haul', 'fotd',
  'so i bought', 'gear', 'work edc', 'battlestations',
  'seeking recommendations', 'question', 'advice',
];

// ─── Interfaces ──────────────────────────────────────────────────

export interface RisingPost {
  id: string;
  platform: RisingPlatform;
  category: RisingCategory;
  title: string;
  url: string;
  source: string; // subreddit name or channel name
  thumbnailUrl?: string;
  flair?: string;
  score: number; // reddit score or youtube views
  comments: number;
  ageHours: number;
  isImage: boolean;
  keywordHits: number;
  teedScore: number;
  createdUtc: number;
}

export interface RisingPostsResponse {
  posts: RisingPost[];
  fetchedAt: string;
  errors: string[];
  quotaUsed: number;
}

export type RedditSort = 'rising' | 'new' | 'hot';

export const ALL_CATEGORIES: RisingCategory[] = [
  'tech', 'beauty', 'edc', 'golf', 'travel',
  'fashion', 'fitness', 'gaming', 'photography', 'espresso',
];
