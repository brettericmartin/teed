/**
 * Idea Categories and Templates
 *
 * Pre-defined idea templates to inspire creative bag applications
 * beyond traditional gear collections.
 */

import type { IdeaCategory, IdeaTemplate } from './types';

export const IDEA_CATEGORY_INFO: Record<IdeaCategory, {
  label: string;
  description: string;
  icon: string;
  color: string;
}> = {
  gear: {
    label: 'Gear & Equipment',
    description: 'Traditional gear collections and loadouts',
    icon: 'backpack',
    color: 'teed-green',
  },
  lifestyle: {
    label: 'Lifestyle & Spaces',
    description: 'Room setups, desk configurations, home organization',
    icon: 'home',
    color: 'sky',
  },
  learning: {
    label: 'Learning & Growth',
    description: 'Course materials, book lists, skill-building resources',
    icon: 'book-open',
    color: 'purple',
  },
  recipes: {
    label: 'Food & Recipes',
    description: 'Ingredient lists, meal prep kits, pantry essentials',
    icon: 'utensils',
    color: 'amber',
  },
  travel: {
    label: 'Travel & Adventure',
    description: 'Packing lists, destination guides, trip essentials',
    icon: 'plane',
    color: 'sky',
  },
  gifts: {
    label: 'Gifts & Wishlists',
    description: 'Gift guides, wishlists, curated recommendations',
    icon: 'gift',
    color: 'red',
  },
  creative: {
    label: 'Creative & Craft',
    description: 'Art supplies, craft materials, creative project kits',
    icon: 'palette',
    color: 'purple',
  },
  wellness: {
    label: 'Wellness & Self-Care',
    description: 'Self-care routines, fitness gear, mental health tools',
    icon: 'heart',
    color: 'teed-green',
  },
  entertainment: {
    label: 'Entertainment',
    description: 'Movie nights, game collections, party supplies',
    icon: 'film',
    color: 'amber',
  },
  seasonal: {
    label: 'Seasonal & Holiday',
    description: 'Holiday-specific items, seasonal activities',
    icon: 'calendar',
    color: 'red',
  },
};

export const IDEA_TEMPLATES: IdeaTemplate[] = [
  // Lifestyle
  {
    id: 'cozy-reading-nook',
    category: 'lifestyle',
    name: 'Cozy Reading Nook',
    description: 'Everything needed to create the perfect reading corner',
    promptHint: 'Focus on comfort, lighting, and ambiance items',
    exampleItems: ['Reading lamp', 'Throw blanket', 'Side table', 'Book stand', 'Candles'],
    tags: ['home', 'relaxation', 'books'],
  },
  {
    id: 'productive-desk-setup',
    category: 'lifestyle',
    name: 'Productive Home Office',
    description: 'Desk setup optimized for focus and productivity',
    promptHint: 'Ergonomics, cable management, productivity tools',
    exampleItems: ['Monitor stand', 'Desk lamp', 'Cable organizer', 'Desk mat', 'Plants'],
    tags: ['work', 'productivity', 'home-office'],
  },
  {
    id: 'morning-routine-station',
    category: 'lifestyle',
    name: 'Morning Routine Station',
    description: 'Everything for a streamlined morning routine',
    promptHint: 'Grooming, organization, time-saving tools',
    exampleItems: ['Organizer tray', 'Quality razor', 'Skincare set', 'Coffee maker'],
    tags: ['routine', 'organization', 'self-care'],
  },

  // Learning
  {
    id: 'language-learning-kit',
    category: 'learning',
    name: 'Language Learning Kit',
    description: 'Resources and tools for mastering a new language',
    promptHint: 'Apps, books, flashcards, immersion tools',
    exampleItems: ['Grammar book', 'Flashcard app', 'Language journal', 'Podcast list'],
    tags: ['education', 'languages', 'self-improvement'],
  },
  {
    id: 'coding-bootcamp-essentials',
    category: 'learning',
    name: 'Coding Bootcamp Essentials',
    description: 'Everything needed to learn programming effectively',
    promptHint: 'Hardware, software, learning resources, ergonomics',
    exampleItems: ['Mechanical keyboard', 'Second monitor', 'Course subscriptions', 'Notebook'],
    tags: ['programming', 'education', 'tech'],
  },
  {
    id: 'book-club-starter',
    category: 'learning',
    name: 'Book Club Starter Pack',
    description: 'Curated reading list with discussion materials',
    promptHint: 'Diverse genres, discussion questions, tracking tools',
    exampleItems: ['5 curated books', 'Reading journal', 'Bookmarks', 'Discussion cards'],
    tags: ['books', 'social', 'reading'],
  },

  // Recipes
  {
    id: 'meal-prep-sunday',
    category: 'recipes',
    name: 'Meal Prep Sunday Kit',
    description: 'Containers and tools for weekly meal preparation',
    promptHint: 'Storage, portioning, time-saving cooking tools',
    exampleItems: ['Glass containers', 'Portion scoops', 'Label maker', 'Instant pot'],
    tags: ['cooking', 'meal-prep', 'organization'],
  },
  {
    id: 'home-barista',
    category: 'recipes',
    name: 'Home Barista Setup',
    description: 'Everything to make cafe-quality coffee at home',
    promptHint: 'Brewing equipment, beans, accessories',
    exampleItems: ['Espresso machine', 'Grinder', 'Scale', 'Milk frother', 'Bean subscription'],
    tags: ['coffee', 'beverages', 'home'],
  },
  {
    id: 'dinner-party-host',
    category: 'recipes',
    name: 'Dinner Party Host Kit',
    description: 'Essentials for hosting memorable dinner parties',
    promptHint: 'Serving ware, ambiance, crowd-pleasing recipes',
    exampleItems: ['Serving platters', 'Wine glasses', 'Candle holders', 'Recipe cards'],
    tags: ['entertaining', 'cooking', 'social'],
  },

  // Travel
  {
    id: 'carry-on-only',
    category: 'travel',
    name: 'Carry-On Only Champion',
    description: 'Master the art of traveling with just a carry-on',
    promptHint: 'Packing cubes, versatile clothing, compact toiletries',
    exampleItems: ['Packing cubes', 'Travel bottles', 'Compression bags', 'Universal adapter'],
    tags: ['minimalist', 'flying', 'packing'],
  },
  {
    id: 'digital-nomad-kit',
    category: 'travel',
    name: 'Digital Nomad Kit',
    description: 'Work from anywhere with this remote work travel setup',
    promptHint: 'Tech, connectivity, portable office essentials',
    exampleItems: ['Laptop stand', 'Portable charger', 'Noise-canceling headphones', 'VPN'],
    tags: ['remote-work', 'tech', 'travel'],
  },
  {
    id: 'road-trip-essentials',
    category: 'travel',
    name: 'Road Trip Essentials',
    description: 'Everything for the perfect cross-country drive',
    promptHint: 'Car organization, snacks, entertainment, safety',
    exampleItems: ['Car organizer', 'Cooler', 'Phone mount', 'First aid kit', 'Playlist'],
    tags: ['driving', 'adventure', 'outdoors'],
  },

  // Gifts
  {
    id: 'new-parent-survival',
    category: 'gifts',
    name: 'New Parent Survival Kit',
    description: 'Thoughtful gifts for exhausted new parents',
    promptHint: 'Practical, time-saving, self-care focused',
    exampleItems: ['Meal delivery credit', 'Noise machine', 'Coffee subscription', 'Comfortable robe'],
    tags: ['parenting', 'thoughtful', 'practical'],
  },
  {
    id: 'housewarming-hero',
    category: 'gifts',
    name: 'Housewarming Hero Bundle',
    description: 'The perfect gifts for someone moving into a new home',
    promptHint: 'Useful, decorative, memorable items',
    exampleItems: ['Quality candle', 'Cutting board', 'Plant', 'Tool kit', 'Cozy throw'],
    tags: ['home', 'gifts', 'practical'],
  },
  {
    id: 'graduation-gift-guide',
    category: 'gifts',
    name: 'Graduation Gift Guide',
    description: 'Meaningful gifts for new graduates entering the real world',
    promptHint: 'Professional, practical, memorable',
    exampleItems: ['Quality pen', 'Portfolio', 'Professional bag', 'Book on adulting'],
    tags: ['graduation', 'professional', 'milestone'],
  },

  // Creative
  {
    id: 'watercolor-starter',
    category: 'creative',
    name: 'Watercolor Starter Kit',
    description: 'Begin your watercolor journey with quality supplies',
    promptHint: 'Paints, brushes, paper, learning resources',
    exampleItems: ['Watercolor set', 'Brush collection', 'Cold press paper', 'Tutorial book'],
    tags: ['art', 'painting', 'hobby'],
  },
  {
    id: 'podcast-studio',
    category: 'creative',
    name: 'Podcast Recording Studio',
    description: 'Everything to start and produce a quality podcast',
    promptHint: 'Audio equipment, software, acoustic treatment',
    exampleItems: ['USB microphone', 'Pop filter', 'Headphones', 'Acoustic panels', 'DAW software'],
    tags: ['audio', 'content-creation', 'tech'],
  },
  {
    id: 'journaling-practice',
    category: 'creative',
    name: 'Journaling Practice Kit',
    description: 'Tools and prompts for a meaningful journaling habit',
    promptHint: 'Quality notebooks, pens, prompts, organization',
    exampleItems: ['Leather journal', 'Fountain pen', 'Prompt cards', 'Washi tape'],
    tags: ['writing', 'mindfulness', 'self-reflection'],
  },

  // Wellness
  {
    id: 'meditation-corner',
    category: 'wellness',
    name: 'Meditation Corner Setup',
    description: 'Create a dedicated space for mindfulness practice',
    promptHint: 'Comfort, ambiance, guided resources',
    exampleItems: ['Meditation cushion', 'Timer', 'Incense', 'Sound machine', 'App subscription'],
    tags: ['mindfulness', 'mental-health', 'relaxation'],
  },
  {
    id: 'recovery-day-kit',
    category: 'wellness',
    name: 'Recovery Day Kit',
    description: 'Everything for proper rest and muscle recovery',
    promptHint: 'Foam rolling, stretching, relaxation tools',
    exampleItems: ['Foam roller', 'Massage gun', 'Epsom salts', 'Compression socks'],
    tags: ['fitness', 'recovery', 'self-care'],
  },
  {
    id: 'sleep-optimization',
    category: 'wellness',
    name: 'Sleep Optimization Bundle',
    description: 'Improve your sleep quality with these essentials',
    promptHint: 'Environment, routine, tracking tools',
    exampleItems: ['Blackout curtains', 'White noise machine', 'Sleep tracker', 'Weighted blanket'],
    tags: ['sleep', 'health', 'wellness'],
  },

  // Entertainment
  {
    id: 'movie-night-supreme',
    category: 'entertainment',
    name: 'Movie Night Supreme',
    description: 'Host the ultimate movie night experience',
    promptHint: 'Snacks, comfort, audio-visual enhancement',
    exampleItems: ['Popcorn maker', 'Cozy blankets', 'Projector', 'Surround sound', 'Candy variety'],
    tags: ['movies', 'home', 'social'],
  },
  {
    id: 'board-game-collection',
    category: 'entertainment',
    name: 'Board Game Night Collection',
    description: 'Curated games for every group size and mood',
    promptHint: 'Variety of player counts, complexity levels, genres',
    exampleItems: ['Party game', 'Strategy game', 'Quick filler', 'Cooperative game'],
    tags: ['games', 'social', 'family'],
  },
  {
    id: 'backyard-hangout',
    category: 'entertainment',
    name: 'Backyard Hangout Setup',
    description: 'Transform your outdoor space into a gathering spot',
    promptHint: 'Seating, lighting, activities, refreshments',
    exampleItems: ['String lights', 'Bluetooth speaker', 'Lawn games', 'Fire pit', 'Cooler'],
    tags: ['outdoors', 'entertaining', 'summer'],
  },

  // Seasonal
  {
    id: 'cozy-fall-vibes',
    category: 'seasonal',
    name: 'Cozy Fall Vibes Kit',
    description: 'Embrace autumn with these seasonal essentials',
    promptHint: 'Warmth, comfort, seasonal activities',
    exampleItems: ['Flannel shirt', 'Pumpkin candle', 'Hot cider mix', 'Cozy socks'],
    tags: ['fall', 'seasonal', 'cozy'],
  },
  {
    id: 'summer-picnic',
    category: 'seasonal',
    name: 'Perfect Summer Picnic',
    description: 'Everything for memorable outdoor dining',
    promptHint: 'Portability, food storage, comfort, ambiance',
    exampleItems: ['Picnic basket', 'Blanket', 'Portable speakers', 'Wine carrier', 'Utensil set'],
    tags: ['summer', 'outdoors', 'food'],
  },
  {
    id: 'holiday-hosting',
    category: 'seasonal',
    name: 'Holiday Hosting Essentials',
    description: 'Be the best holiday host with this complete kit',
    promptHint: 'Decorations, cooking, guest comfort, traditions',
    exampleItems: ['Serving dishes', 'Guest towels', 'Decorations', 'Game for all ages'],
    tags: ['holidays', 'entertaining', 'family'],
  },
];

/**
 * Get templates by category
 */
export function getTemplatesByCategory(category: IdeaCategory): IdeaTemplate[] {
  return IDEA_TEMPLATES.filter((t) => t.category === category);
}

/**
 * Get all unique tags across templates
 */
export function getAllTemplateTags(): string[] {
  const tags = new Set<string>();
  for (const template of IDEA_TEMPLATES) {
    for (const tag of template.tags) {
      tags.add(tag);
    }
  }
  return Array.from(tags).sort();
}

/**
 * Search templates by keyword
 */
export function searchTemplates(query: string): IdeaTemplate[] {
  const lowerQuery = query.toLowerCase();
  return IDEA_TEMPLATES.filter(
    (t) =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some((tag) => tag.includes(lowerQuery))
  );
}
