import { Metadata } from 'next';
import HomeClient from '@/components/home/HomeClient';

export const metadata: Metadata = {
  title: 'Teed - Curate and Share Your Gear Collections',
  description: 'Create beautiful, shareable collections of your gear, products, and recommendations. Perfect for golfers, photographers, creators, travelers, and anyone who wants to showcase what they use.',
  keywords: [
    'gear collection',
    'product list',
    'link in bio',
    'gear organizer',
    'equipment list',
    'golf bag tracker',
    'camera gear inventory',
    'travel packing list',
    'creator gear kit',
    'desk setup sharing',
    'collection sharing',
    'gear list app',
  ],
  authors: [{ name: 'Teed' }],
  creator: 'Teed',
  publisher: 'Teed',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://teed.so',
    siteName: 'Teed',
    title: 'Teed - Curate and Share Your Gear Collections',
    description: 'Create beautiful, shareable collections of your gear, products, and recommendations. AI-powered product identification, affiliate link support, and stunning sharing pages.',
    images: [
      {
        url: 'https://teed.so/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Teed - Curate and Share Your Gear',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Teed - Curate and Share Your Gear Collections',
    description: 'Create beautiful, shareable collections of your gear, products, and recommendations.',
    images: ['https://teed.so/og-image.png'],
  },
  alternates: {
    canonical: 'https://teed.so',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

// JSON-LD structured data for the homepage
const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://teed.so/#organization',
      name: 'Teed',
      url: 'https://teed.so',
      logo: {
        '@type': 'ImageObject',
        url: 'https://teed.so/logo.png',
        width: 512,
        height: 512,
      },
      description: 'Platform for creating and sharing curated gear collections',
      sameAs: [],
    },
    {
      '@type': 'WebApplication',
      '@id': 'https://teed.so/#application',
      name: 'Teed',
      url: 'https://teed.so',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      description: 'Create beautiful, shareable collections of your gear, products, and recommendations. AI-powered product identification from photos, affiliate link support, and stunning sharing pages.',
      featureList: [
        'AI-powered product identification from photos',
        'Beautiful shareable collection pages',
        'QR code generation for physical sharing',
        'Affiliate link support for monetization',
        'Custom profile URLs',
        'Drag-and-drop organization',
      ],
      offers: {
        '@type': 'Offer',
        price: '0',
        priceCurrency: 'USD',
      },
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: '4.8',
        ratingCount: '50',
        bestRating: '5',
        worstRating: '1',
      },
    },
    {
      '@type': 'WebSite',
      '@id': 'https://teed.so/#website',
      url: 'https://teed.so',
      name: 'Teed',
      description: 'Curate and share your gear collections',
      publisher: {
        '@id': 'https://teed.so/#organization',
      },
    },
  ],
};

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeClient />
    </>
  );
}
