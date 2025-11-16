import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Browser-side Supabase client with cookie-based storage
 * This ensures auth state is shared between client and server via cookies
 */
export const supabase = createBrowserClient(
  supabaseUrl,
  supabaseAnonKey
)
