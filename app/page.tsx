import { Metadata } from 'next';
import HomeClient from '@/components/home/HomeClient';

export const metadata: Metadata = {
  title: 'Teed.club - Your Gear Deserves a Better Home',
  description: 'Create beautiful, shareable collections of everything you use. One link for your golf bag, camera kit, travel setup, or desk gear. Join as a founding member.',
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
  authors: [{ name: 'Teed.club' }],
  creator: 'Teed.club',
  publisher: 'Teed.club',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://teed.so',
    siteName: 'Teed.club',
    title: 'Teed.club - Your Gear Deserves a Better Home',
    description: 'Create beautiful, shareable collections of everything you use. One link for your golf bag, camera kit, travel setup, or desk gear.',
    images: [
      {
        url: 'https://teed.so/og-image.png',
        width: 1200,
        height: 630,
        alt: 'Teed.club - Curate and Share Your Gear',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Teed.club - Your Gear Deserves a Better Home',
    description: 'Create beautiful, shareable collections of everything you use. One link for your golf bag, camera kit, travel setup, or desk gear.',
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
      name: 'Teed.club',
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
      name: 'Teed.club',
      url: 'https://teed.so',
      applicationCategory: 'LifestyleApplication',
      operatingSystem: 'Web',
      description: 'Create beautiful, shareable collections of your gear, products, and recommendations. Smart product organization, custom profile URLs, and stunning sharing pages.',
      featureList: [
        'Beautiful shareable collection pages',
        'Smart product organization',
        'Custom profile URLs and public sharing',
        'QR code generation for physical sharing',
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
      name: 'Teed.club',
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
