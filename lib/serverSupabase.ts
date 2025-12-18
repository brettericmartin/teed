import { createServerClient } from '@supabase/ssr'
import { createClient } from '@supabase/supabase-js'
import { cookies, headers } from 'next/headers'

export async function createServerSupabase() {
  // Check for Authorization header (for API calls with Bearer token, e.g., from ChatGPT)
  const headersList = await headers()
  const authHeader = headersList.get('authorization')

  if (authHeader?.startsWith('Bearer ')) {
    const accessToken = authHeader.substring(7)

    // Create a client and set the session with the access token
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        }
      }
    )

    // Get the user from the token to verify it's valid
    const { data: { user }, error } = await supabase.auth.getUser(accessToken)

    if (error || !user) {
      console.error('Bearer token validation failed:', error?.message)
      // Return the client anyway - the calling code will handle the auth error
      return supabase
    }

    // Create a new client with the token set in headers for database operations
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            Authorization: `Bearer ${accessToken}`
          }
        }
      }
    )
  }

  // Otherwise use cookie-based auth (for browser sessions)
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}
