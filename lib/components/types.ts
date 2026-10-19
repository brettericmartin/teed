/**
 * Golf-simulator components knowledge base: the data shape.
 *
 * Mirrors the research output JSON described in the vault plan
 * (02-Projects/Teed/components/00-components-plan.md, 2026-10-19) field for
 * field. One file per category lives in content/components/<category>.json;
 * lib/components/index.ts loads and validates them. Nothing here is invented:
 * a field the research could not source stays empty, so most strings are
 * optional and arrays may be empty.
 */

export const COMPONENT_CATEGORY_SLUGS = [
  'hitting-mats',
  'turf',
  'projectors',
  'computers',
  'launch-monitors',
  'enclosures',
] as const;

export type ComponentCategorySlug = (typeof COMPONENT_CATEGORY_SLUGS)[number];

/** `core` = 10 or more independent sources (shown first); `qualified` = 5 to 9. */
export type ComponentTier = 'core' | 'qualified';

export type ComponentSourceType = 'forum' | 'reddit' | 'review' | 'video' | 'retailer' | 'brand';

export type ComponentSubscriptionPeriod = 'monthly' | 'yearly' | 'lifetime';

/** A price with the date it was read and where (plan: "prices carry the date read and the source URL"). */
export interface ComponentPrice {
  amount: number;
  /** ISO 4217, "USD" for everything in phase 1. */
  currency: string;
  /** YYYY-MM-DD. */
  read_on: string;
  source_url: string;
}

/** A recurring fee a product needs for the use people buy it for (GSPro access, course play). */
export interface ComponentSubscription {
  name: string;
  amount: number;
  period: ComponentSubscriptionPeriod;
  /** What the plan unlocks, e.g. "GSPro, E6". */
  required_for?: string;
}

export type ComponentSpecValue = string | number | boolean;

export interface ComponentProduct {
  brand: string;
  name: string;
  /** One of the file's `subtypes`; becomes the bag section when the category sections by subtype. */
  subtype: string;
  tier: ComponentTier;
  /** Independent sources that discuss it (the brand's own site does not count). */
  mention_count: number;
  mention_sources: string[];
  /** Null when no dated price could be sourced. */
  price: ComponentPrice | null;
  /** The maker's own product page, verified 200 on the read date. */
  direct_url: string;
  /** Amazon or the maker's main retailer when there is no direct page, or as a second exit. */
  fallback_url?: string;
  /** The one best independent review or forum thread. */
  read_url?: string;
  /** Category-specific, sourced. Keys in snake_case; `_ft` / `_in` suffixes render with units. */
  specs: Record<string, ComponentSpecValue>;
  subscriptions?: ComponentSubscription[];
  room_fit?: string;
  who_its_for?: string;
  pros: string[];
  cons: string[];
  known_issues: string[];
  /** One or two sentences in a builder's voice, sourced. */
  why_people_choose_it: string;
  /** The maker's product image when the page exposes one; empty or absent otherwise. */
  image_url?: string;
  /**
   * Only on products from a brand the person who runs Teed also owns (StowGolf).
   * When present it must equal DISCLOSURE from lib/disclosure.ts; the seed puts it
   * at the start of the item's notes.
   */
  disclosure?: string;
}

export type ComponentSoftwarePricingModel = 'subscription' | 'one_time' | 'free';

/**
 * Simulator software (GSPro, E6 Connect, TGC 2019, Awesome Golf ...). Only the
 * computers file carries this array. The shape is the product shape plus the
 * pricing model, so the seed can treat both lists the same way; `subtype`
 * defaults to "software" when omitted.
 */
export interface ComponentSoftware extends Omit<ComponentProduct, 'subtype'> {
  subtype?: string;
  pricing_model: ComponentSoftwarePricingModel;
  /** For subscriptions: how `price.amount` recurs. */
  price_period?: ComponentSubscriptionPeriod;
  /** Platform the software runs on, e.g. "Windows", "iOS, Android". */
  platform?: string;
  /** Minimum PC spec the maker publishes, sourced. */
  minimum_pc?: string;
}

export interface ComponentSource {
  url: string;
  type: ComponentSourceType;
  title: string;
  /** YYYY-MM-DD, or "" when the page shows no date. */
  date: string;
  /** One line on what it says. */
  what_it_says: string;
}

export interface ComponentBlogOutline {
  title: string;
  sections: string[];
}

export interface ComponentCategoryFile {
  category: ComponentCategorySlug;
  /** YYYY-MM-DD the research was read. */
  read_date: string;
  /** Sub-shapes in display order; every product's `subtype` must be one of these. */
  subtypes: string[];
  products: ComponentProduct[];
  /** Computers only. */
  software?: ComponentSoftware[];
  /** 20 to 25 minimum per the plan; the loader warns below 20 but does not fail. */
  sources: ComponentSource[];
  blog_outline: ComponentBlogOutline;
}

/** How a category's products split into bag sections. */
export type ComponentSectionsBy = 'subtype' | 'tier';

export interface ComponentPriceTier {
  /** Section name, e.g. "Under $500". */
  label: string;
  /** Inclusive upper bound in USD; the last tier is open-ended (no `max`). */
  max?: number;
}

export interface ComponentCategoryMeta {
  slug: ComponentCategorySlug;
  /** Short label for cards and chips, e.g. "Launch monitors". */
  label: string;
  /** Bag title, e.g. "Launch monitors for a home sim, as people actually buy them". */
  title: string;
  /** One paragraph for the bag description (the seed appends the read date). */
  description: string;
  /** Reference bag code on the house account: `sim-<category>`. */
  bagCode: string;
  /** Blog post slug under content/blog/ (may not exist yet). */
  blogSlug: string;
  sectionsBy: ComponentSectionsBy;
  /** Used only when `sectionsBy === 'tier'`; sections are these bands in order, by `price.amount`. */
  priceTiers?: ComponentPriceTier[];
  /** Subcategory value written into lib/productLibrary/data/golf.json. */
  librarySubcategory: string;
}
