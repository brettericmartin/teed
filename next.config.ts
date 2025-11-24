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
};

export default nextConfig;
