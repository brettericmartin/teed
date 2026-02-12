export interface RoundupCategory {
  slug: string;
  name: string;
  description: string;
  supabaseCategory: string; // matches bags.category in DB
  keywords: string[];
  intro: string;
}

export const roundupCategories: RoundupCategory[] = [
  {
    slug: 'golf-bags',
    name: 'Golf Bags',
    description: 'The best curated golf bags on Teed — real setups from real golfers.',
    supabaseCategory: 'golf',
    keywords: ['golf bag', 'golf gear', 'golf clubs', "what's in my golf bag"],
    intro:
      "See how golfers organize and share their setups. These are real bags from Teed users — not sponsored lists, just honest gear choices.",
  },
  {
    slug: 'photography-gear',
    name: 'Photography Gear',
    description: 'Curated photography gear collections — cameras, lenses, and kits from photographers.',
    supabaseCategory: 'photography',
    keywords: ['photography gear', 'camera bag', 'photography kit', "what's in my camera bag"],
    intro:
      'Photographers sharing their kits — from street shooters to studio pros. Browse real setups and find inspiration for your next purchase.',
  },
  {
    slug: 'tech-setups',
    name: 'Tech Setups',
    description: 'Tech and EDC setups — everyday carry, desk setups, and gadget collections.',
    supabaseCategory: 'tech',
    keywords: ['tech setup', 'EDC', 'desk setup', 'gadgets', 'everyday carry'],
    intro:
      'Tech enthusiasts sharing their setups — from EDC to desk rigs. See what people actually use every day.',
  },
  {
    slug: 'travel-gear',
    name: 'Travel Gear',
    description: 'Travel packing lists and gear collections from travelers around the world.',
    supabaseCategory: 'travel',
    keywords: ['travel gear', 'packing list', 'travel essentials', "what's in my suitcase"],
    intro:
      "Real packing lists from real travelers. See how people pack for different trips and destinations.",
  },
  {
    slug: 'outdoor-gear',
    name: 'Outdoor Gear',
    description: 'Outdoor and adventure gear collections — hiking, camping, climbing, and more.',
    supabaseCategory: 'outdoors',
    keywords: ['outdoor gear', 'hiking gear', 'camping gear', 'adventure kit'],
    intro:
      'Outdoor enthusiasts sharing their adventure kits. From weekend hikes to multi-day expeditions.',
  },
  {
    slug: 'fitness-gear',
    name: 'Fitness Gear',
    description: 'Fitness and workout gear collections — gym bags, home setups, and training essentials.',
    supabaseCategory: 'fitness',
    keywords: ['fitness gear', 'gym bag', 'workout gear', 'home gym'],
    intro:
      "See how people set up their training — from gym bags to home workout stations.",
  },
  {
    slug: 'music-gear',
    name: 'Music Gear',
    description: 'Music gear collections — instruments, pedals, studio setups, and live rigs.',
    supabaseCategory: 'music',
    keywords: ['music gear', 'guitar pedals', 'studio setup', 'pedalboard'],
    intro:
      'Musicians sharing their rigs — from bedroom producers to touring artists.',
  },
  {
    slug: 'creator-kits',
    name: 'Creator Kits',
    description: 'Creator and content creation kits — streaming setups, video gear, and production tools.',
    supabaseCategory: 'creator',
    keywords: ['creator kit', 'streaming setup', 'video gear', 'content creation'],
    intro:
      'Content creators sharing their production setups. See the tools behind the content you love.',
  },
  {
    slug: 'gaming-setups',
    name: 'Gaming Setups',
    description: 'Gaming setups and collections — PC builds, console setups, and peripherals.',
    supabaseCategory: 'gaming',
    keywords: ['gaming setup', 'PC build', 'gaming peripherals', 'battlestation'],
    intro:
      "Gamers sharing their battlestations. From competitive setups to cozy gaming corners.",
  },
  {
    slug: 'cooking-gear',
    name: 'Cooking Gear',
    description: 'Kitchen and cooking gear collections — tools, appliances, and chef essentials.',
    supabaseCategory: 'cooking',
    keywords: ['cooking gear', 'kitchen tools', 'chef essentials', 'kitchen setup'],
    intro:
      'Home cooks and chefs sharing their kitchen essentials. The tools that make great food possible.',
  },
];

export function getRoundupCategory(slug: string): RoundupCategory | null {
  return roundupCategories.find((c) => c.slug === slug) || null;
}

export function getAllRoundupSlugs(): string[] {
  return roundupCategories.map((c) => c.slug);
}
