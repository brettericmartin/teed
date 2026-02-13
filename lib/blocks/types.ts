// Block system type definitions

export type BlockType =
  | 'header'
  | 'bio'
  | 'social_links'
  | 'embed'
  | 'destinations'
  | 'featured_bags'
  | 'custom_text'
  | 'spacer'
  | 'divider'
  | 'quote'
  | 'affiliate_disclosure'
  | 'story';

// Embed platforms supported by Link Intelligence library
export type EmbedPlatform =
  | 'youtube'
  | 'spotify'
  | 'tiktok'
  | 'twitter'
  | 'instagram'
  | 'twitch'
  | 'vimeo'
  | 'soundcloud'
  | 'apple-music'
  | 'loom'
  | 'bluesky'
  | 'reddit'
  | 'threads'
  | string; // Allow other platforms from Link Intelligence

// Block width options - DEPRECATED, kept for backward compatibility
// @deprecated Use grid coordinates (gridX, gridY, gridW, gridH) instead
export type BlockWidth = 'full' | 'half';

// Grid configuration for react-grid-layout
export const GRID_BREAKPOINTS = {
  lg: 1200,
  md: 996,
  sm: 768,
  xs: 480,
  xxs: 0,
} as const;

export const GRID_COLS = {
  lg: 12,
  md: 12,
  sm: 6,
  xs: 4,
  xxs: 2,
} as const;

export type GridBreakpoint = keyof typeof GRID_BREAKPOINTS;

// Default grid sizes per block type
export const DEFAULT_BLOCK_GRID: Record<BlockType, { w: number; h: number; minH?: number; maxH?: number }> = {
  header: { w: 12, h: 3, minH: 2, maxH: 5 },
  bio: { w: 12, h: 2, minH: 1, maxH: 4 },
  social_links: { w: 6, h: 2, minH: 1, maxH: 3 },
  embed: { w: 12, h: 4, minH: 3, maxH: 8 },
  destinations: { w: 12, h: 3, minH: 2, maxH: 6 },
  featured_bags: { w: 12, h: 4, minH: 2, maxH: 16 },
  custom_text: { w: 6, h: 1, minH: 1, maxH: 4 },
  spacer: { w: 12, h: 1, minH: 1, maxH: 3 },
  divider: { w: 12, h: 1, minH: 1, maxH: 1 },
  quote: { w: 12, h: 2, minH: 1, maxH: 4 },
  affiliate_disclosure: { w: 12, h: 1, minH: 1, maxH: 2 },
  story: { w: 12, h: 4, minH: 2, maxH: 10 },
};

// Base block interface
export interface ProfileBlock {
  id: string;
  profile_id: string;
  block_type: BlockType;
  sort_order: number;
  is_visible: boolean;

  // Grid layout coordinates (12-column system)
  gridX: number;      // Column position (0-11)
  gridY: number;      // Row position
  gridW: number;      // Width in columns (1-12)
  gridH: number;      // Height in rows

  // @deprecated - kept for backward compatibility
  width?: BlockWidth;

  config: BlockConfig;
  created_at: string;
  updated_at: string;
}

// Type-specific configurations
export type BlockConfig =
  | HeaderBlockConfig
  | BioBlockConfig
  | SocialLinksBlockConfig
  | EmbedBlockConfig
  | DestinationsBlockConfig
  | FeaturedBagsBlockConfig
  | CustomTextBlockConfig
  | SpacerBlockConfig
  | DividerBlockConfig
  | QuoteBlockConfig
  | AffiliateDisclosureBlockConfig
  | StoryBlockConfig;

export interface HeaderBlockConfig {
  show_avatar?: boolean;
  show_banner?: boolean;
  show_display_name?: boolean;
  show_handle?: boolean;
  alignment?: 'left' | 'center' | 'right';
  size?: 'minimal' | 'standard' | 'hero';
  useSerifFont?: boolean; // Premium serif typography for display name
}

export interface BioBlockConfig {
  title?: string; // Custom section title (default: "About")
  showTitle?: boolean; // Show/hide section title (default: true)
  show_full?: boolean; // Show full bio or truncated
  size?: 'compact' | 'standard' | 'expanded';
  alignment?: 'left' | 'center' | 'right';
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  fontSize?: 'sm' | 'base' | 'lg' | 'xl'; // Custom font size
  showAccentBorder?: boolean; // Subtle gradient accent border
}

export interface SocialLinksBlockConfig {
  title?: string; // Custom section title (default: "Connect")
  showTitle?: boolean; // Show/hide section title (default: true)
  style?: 'icons' | 'pills' | 'list'; // icons=circles, pills=rounded labels, list=icon+link rows
  platforms?: string[]; // Which platforms to show (or all if empty)
  showLabel?: boolean; // Show section title label above links
  useCard?: boolean; // Wrap in decorative card container
  buttonSize?: 'sm' | 'md' | 'lg' | 'xl'; // Size of social buttons
}

export interface EmbedBlockConfig {
  title?: string; // Custom section title (default: platform name)
  showTitle?: boolean; // Show/hide section title (default: true)
  platform: EmbedPlatform;
  url: string;
  description?: string; // "Why I recommend this"
}

export interface DestinationLink {
  id: string;
  platform: string;
  title: string;
  description: string;
  url: string;
  icon?: string;
}

export interface DestinationsBlockConfig {
  title?: string; // Custom section title (default: "Destinations")
  showTitle?: boolean; // Show/hide section title (default: true)
  destinations: DestinationLink[];
  style?: 'list' | 'cards';
}

export interface FeaturedBagsBlockConfig {
  title?: string; // Custom section title (default: "Collections")
  showTitle?: boolean; // Show/hide section title (default: true)
  bag_ids?: string[];
  style?: 'grid' | 'carousel' | 'list';
  max_display?: number;
  size?: 'thumbnail' | 'standard' | 'showcase';
}

export interface CustomTextBlockConfig {
  variant: 'heading' | 'paragraph';
  text: string;
  alignment?: 'left' | 'center' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fontWeight?: 'normal' | 'medium' | 'semibold' | 'bold';
  useSerifFont?: boolean; // Premium serif typography for headings
}

export interface SpacerBlockConfig {
  size: 'sm' | 'md' | 'lg' | 'xl';
}

export interface DividerBlockConfig {
  style?: 'solid' | 'dashed' | 'dotted';
  width?: 'full' | 'half' | 'third';
}

/**
 * Quote/Testimonial Block
 * DOCTRINE: Authoritative social proof without engagement metrics.
 */
export interface QuoteBlockConfig {
  quote: string;
  attribution?: string; // Who said it (e.g., "Mark, Pro Golfer")
  source?: string; // Where it came from (e.g., "Instagram")
  sourceUrl?: string; // Link to original
  style?: 'minimal' | 'callout' | 'card';
  alignment?: 'left' | 'center' | 'right';
  showQuotationMarks?: boolean;
}

/**
 * Affiliate Disclosure Block
 * DOCTRINE: Professional legal infrastructure; transparent, not apologetic.
 */
export interface AffiliateDisclosureBlockConfig {
  disclosureType: 'amazon' | 'general' | 'custom';
  customText?: string;
  style?: 'minimal' | 'notice' | 'card';
}

/**
 * Story Block - "The Story" timeline feature
 * DOCTRINE: Narrative framing, positions changes as curator's journey.
 * Uses month/year timestamps only (no "days ago" freshness pressure).
 * Neutral colors for removals (no red/urgent).
 */
export interface StoryBlockConfig {
  title?: string; // Custom section title (default: "The Story")
  showTitle?: boolean; // Show/hide section title (default: true)
  maxItems?: number; // Max timeline entries to show (default: 5)
  showFiltersBar?: boolean; // Show filter chips (default: true)
  groupByTimePeriod?: boolean; // Group entries by time period (default: true)
  defaultFilters?: string[]; // Which filters are active by default (all if empty)
  showProfileChanges?: boolean; // Include profile/dashboard changes (default: true)
  showBagChanges?: boolean; // Include bag-related changes (default: true)
}

// Theme types
export type BackgroundType = 'solid' | 'gradient' | 'image';
export type CardStyle = 'elevated' | 'flat' | 'outlined';
export type BorderRadius = 'none' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
export type GradientDirection =
  | 'to-bottom'
  | 'to-top'
  | 'to-right'
  | 'to-left'
  | 'to-br'
  | 'to-bl'
  | 'to-tr'
  | 'to-tl';

export interface ProfileTheme {
  id: string;
  profile_id: string;
  primary_color: string;
  accent_color: string;
  background_color: string;
  text_color: string;
  background_type: BackgroundType;
  background_gradient_start?: string | null;
  background_gradient_end?: string | null;
  background_gradient_direction?: GradientDirection;
  background_image_url?: string | null;
  card_style: CardStyle;
  border_radius: BorderRadius;
  created_at: string;
}

// Default theme values
export const DEFAULT_THEME: Omit<ProfileTheme, 'id' | 'profile_id' | 'created_at'> = {
  primary_color: '#7A9770',
  accent_color: '#CFE3E8',
  background_color: '#F9F5EE',
  text_color: '#1F3A2E',
  background_type: 'solid',
  background_gradient_start: null,
  background_gradient_end: null,
  background_gradient_direction: 'to-bottom',
  background_image_url: null,
  card_style: 'elevated',
  border_radius: 'xl',
};
