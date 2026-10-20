import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Server-side code accesses process.env directly at runtime
  // No need for env block - that's for build-time substitution only

  // Ensure images from Supabase storage are allowed
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'jvljmfdroozexzodqupg.supabase.co',
      },
    ],
  },

  // The sitemap advertised /legal/privacy and /legal/terms before the pages
  // existed (2026-10-20); keep those URLs resolving.
  async redirects() {
    return [
      { source: '/legal/privacy', destination: '/privacy', permanent: true },
      { source: '/legal/terms', destination: '/terms', permanent: true },
    ];
  },

  // Security headers
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'geolocation=(), microphone=(), camera=()' },
        ],
      },
    ];
  },
};

export default nextConfig;
