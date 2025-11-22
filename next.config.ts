import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Explicitly pass env vars to the server runtime
  env: {
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  },
};

export default nextConfig;
