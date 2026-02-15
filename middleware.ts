import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { checkRateLimit } from '@/lib/rateLimit'

function rateLimitResponse(message: string, retryAfterMs: number) {
  return NextResponse.json(
    { error: message },
    {
      status: 429,
      headers: {
        'Retry-After': String(Math.ceil(retryAfterMs / 1000)),
      },
    }
  )
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // --- Create Supabase client (shared for rate limit admin check + session refresh) ---
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options as CookieOptions)
          )
        },
      },
    }
  )

  // --- Rate limiting for API routes ---
  if (pathname.startsWith('/api/')) {
    const ip =
      request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
      request.headers.get('x-real-ip') ||
      'unknown'

    // Lazy admin check — only queries DB when a limit is actually hit
    let isAdmin: boolean | null = null
    async function checkAdmin(): Promise<boolean> {
      if (isAdmin !== null) return isAdmin
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { isAdmin = false; return false }
        const { data: profile } = await supabase
          .from('profiles')
          .select('admin_role')
          .eq('id', user.id)
          .single()
        isAdmin = !!profile?.admin_role
      } catch {
        isAdmin = false
      }
      return isAdmin
    }

    // Global: 200 requests/min per IP across all API routes
    const globalCheck = checkRateLimit(`global:${ip}`, 200, 60_000)
    if (globalCheck.limited && !(await checkAdmin())) {
      return rateLimitResponse('Too many requests. Please try again later.', globalCheck.retryAfterMs)
    }

    // Auth endpoints: 10 requests/min per IP (brute force prevention)
    const isAuthRoute =
      pathname.startsWith('/api/auth/') ||
      pathname === '/api/apply' ||
      pathname.startsWith('/api/beta/validate-code')
    if (isAuthRoute) {
      const authCheck = checkRateLimit(`auth:${ip}`, 10, 60_000)
      if (authCheck.limited && !(await checkAdmin())) {
        return rateLimitResponse('Too many attempts. Please wait and try again.', authCheck.retryAfterMs)
      }
    }

    // AI/expensive endpoints: 30 requests/min per IP (cost prevention)
    const isExpensive =
      pathname.startsWith('/api/ai/') ||
      pathname.includes('/analyze') ||
      pathname.includes('/fill-links') ||
      pathname.includes('/fill-info') ||
      pathname.includes('/preview-enrichment') ||
      pathname.startsWith('/api/bulk-text/') ||
      pathname.startsWith('/api/discovery/run') ||
      pathname.startsWith('/api/video-to-bag/')
    if (isExpensive) {
      const aiCheck = checkRateLimit(`ai:${ip}`, 30, 60_000)
      if (aiCheck.limited && !(await checkAdmin())) {
        return rateLimitResponse('Rate limit reached. Please wait a moment.', aiCheck.retryAfterMs)
      }
    }
  }

  // --- Supabase session refresh ---
  await supabase.auth.getUser()

  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static assets (images)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
