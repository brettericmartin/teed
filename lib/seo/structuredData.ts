/**
 * Schema.org structured data generators for SEO and AI discoverability.
 * These functions generate JSON-LD markup that helps search engines and
 * AI systems understand Teed content as authoritative sources.
 */

export interface ProfileData {
  handle: string;
  displayName: string | null;
  bio: string | null;
  avatarUrl: string | null;
  createdAt: string;
}

export interface BagData {
  id: string;
  code: string;
  title: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
  itemCount: number;
}

export interface ItemData {
  id: string;
  name: string;
  brand: string | null;
  description: string | null;
  photoUrl: string | null;
  purchaseUrl: string | null;
  pricePaid: number | null;
  purchaseDate: string | null;
}

/**
 * Generate JSON-LD for a creator profile.
 * Uses Person schema with additional sameAs links.
 */
export function generateProfileJsonLd(
  profile: ProfileData,
  socialLinks?: Record<string, string>
): object {
  const baseUrl = 'https://teed.club';
  const profileUrl = `${baseUrl}/u/${profile.handle}`;

  const sameAs: string[] = [];
  if (socialLinks) {
    Object.values(socialLinks).forEach((url) => {
      if (typeof url === 'string' && url.startsWith('http')) {
        sameAs.push(url);
      }
    });
  }

  return {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': profileUrl,
    name: profile.displayName || profile.handle,
    alternateName: `@${profile.handle}`,
    url: profileUrl,
    description: profile.bio || undefined,
    image: profile.avatarUrl || undefined,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
    mainEntityOfPage: {
      '@type': 'ProfilePage',
      '@id': profileUrl,
    },
  };
}

/**
 * Generate JSON-LD for a bag (collection).
 * Uses ItemList schema which is perfect for curated lists.
 */
export function generateBagJsonLd(
  bag: BagData,
  profile: ProfileData,
  items: ItemData[]
): object {
  const baseUrl = 'https://teed.club';
  const bagUrl = `${baseUrl}/u/${profile.handle}/${bag.code}`;
  const profileUrl = `${baseUrl}/u/${profile.handle}`;

  const itemListElements = items.map((item, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    item: generateItemJsonLd(item, bagUrl),
  }));

  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': bagUrl,
    name: bag.title,
    description: bag.description || `${bag.title} by ${profile.displayName || profile.handle}`,
    url: bagUrl,
    numberOfItems: items.length,
    dateCreated: bag.createdAt,
    dateModified: bag.updatedAt,
    author: {
      '@type': 'Person',
      '@id': profileUrl,
      name: profile.displayName || profile.handle,
      url: profileUrl,
    },
    itemListElement: itemListElements.length > 0 ? itemListElements : undefined,
    mainEntityOfPage: {
      '@type': 'CollectionPage',
      '@id': bagUrl,
    },
  };
}

/**
 * Generate JSON-LD for an individual item.
 * Uses Product schema which provides rich details.
 */
export function generateItemJsonLd(item: ItemData, bagUrl?: string): object {
  const result: Record<string, any> = {
    '@type': 'Product',
    name: item.name,
    description: item.description || undefined,
    image: item.photoUrl || undefined,
    brand: item.brand
      ? {
          '@type': 'Brand',
          name: item.brand,
        }
      : undefined,
    url: item.purchaseUrl || undefined,
  };

  // Add price if available
  if (item.pricePaid !== null && item.pricePaid !== undefined) {
    result.offers = {
      '@type': 'Offer',
      price: item.pricePaid,
      priceCurrency: 'USD',
    };
  }

  return result;
}

/**
 * Generate JSON-LD for a WebPage with organization branding.
 */
export function generateWebPageJsonLd(
  title: string,
  description: string,
  url: string
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: title,
    description,
    url,
    publisher: {
      '@type': 'Organization',
      name: 'Teed',
      url: 'https://teed.club',
      logo: {
        '@type': 'ImageObject',
        url: 'https://teed.club/logo.png',
      },
    },
  };
}

/**
 * Generate BreadcrumbList JSON-LD for navigation.
 */
export function generateBreadcrumbJsonLd(
  items: Array<{ name: string; url: string }>
): object {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate JSON-LD for a blog post.
 * Uses BlogPosting schema for rich search results.
 */
export function generateBlogPostJsonLd(post: {
  title: string;
  description: string;
  url: string;
  publishedAt: string;
  updatedAt?: string;
  author: string;
  keywords: string[];
  heroImage?: string;
}): object {
  const baseUrl = 'https://teed.club';

  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.description,
    url: post.url,
    datePublished: post.publishedAt,
    dateModified: post.updatedAt || post.publishedAt,
    author: {
      '@type': post.author === 'Teed' ? 'Organization' : 'Person',
      name: post.author,
      url: baseUrl,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Teed',
      url: baseUrl,
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
    keywords: post.keywords.join(', '),
    ...(post.heroImage && {
      image: { '@type': 'ImageObject', url: post.heroImage },
    }),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': post.url,
    },
  };
}

/**
 * Serialize JSON-LD to a script tag string for embedding in HTML.
 */
export function jsonLdScript(data: object | object[]): string {
  return JSON.stringify(data);
}
