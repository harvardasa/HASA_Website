import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { isAdminEmail } from '@/lib/admin-auth'

// ─── Subdomain detection ─────────────────────────────────────────────────────

type Subdomain = 'admin' | 'alumni' | null

function detectSubdomain(host: string): Subdomain {
  const lower = host.toLowerCase().split(':')[0]
  if (lower.startsWith('admin.')) return 'admin'
  if (lower.startsWith('alumni.')) return 'alumni'
  return null
}

function isProductionHost(host: string): boolean {
  return host.toLowerCase().endsWith('harvardafricans.com')
}

const PROD_APEX = 'https://harvardafricans.com'
const PROD_ADMIN = 'https://admin.harvardafricans.com'
const PROD_ALUMNI = 'https://alumni.harvardafricans.com'

const ALUMNI_PATH_PREFIXES = [
  '/directory',
  '/profile',
  '/login',
  '/verify',
  '/onboarding',
  '/pending',
  '/api/auth',
]

const ADMIN_PATH_PREFIXES = ['/admin', '/api/admin']

const ADMIN_PUBLIC_PATHS = [
  '/admin/login',
  '/admin/forgot-password',
  '/admin/reset-password',
  '/api/admin/check-email',
]

const DIRECTORY_PROTECTED_PREFIXES = [
  '/directory',
  '/profile',
  '/pending',
  '/onboarding',
]
const DIRECTORY_AUTH_PAGES = ['/login', '/verify']

// Routes that need Supabase auth checks. Other routes (marketing site, etc)
// skip Supabase entirely — saves work and prevents env-var crashes.
function needsSupabase(pathname: string): boolean {
  return (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/api/admin') ||
    pathname.startsWith('/directory') ||
    pathname.startsWith('/profile') ||
    pathname.startsWith('/pending') ||
    pathname.startsWith('/onboarding') ||
    pathname === '/login' || pathname.startsWith('/login/') ||
    pathname === '/verify' || pathname.startsWith('/verify/')
  )
}

export async function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''
  const subdomain = detectSubdomain(host)
  const { pathname } = request.nextUrl
  const isProd = isProductionHost(host)

  // ─── Cross-subdomain redirects (production only) ───────────────────────────

  if (isProd) {
    if (subdomain === 'admin') {
      if (pathname === '/') {
        return NextResponse.redirect(new URL('/admin', request.url))
      }
      const allowed = ADMIN_PATH_PREFIXES.some((p) => pathname.startsWith(p))
      if (!allowed) {
        return NextResponse.redirect(`${PROD_APEX}${pathname}`)
      }
    } else if (subdomain === 'alumni') {
      if (pathname === '/') {
        return NextResponse.redirect(new URL('/directory', request.url))
      }
      const allowed = ALUMNI_PATH_PREFIXES.some((p) => pathname.startsWith(p))
      if (!allowed) {
        return NextResponse.redirect(`${PROD_APEX}${pathname}`)
      }
    } else {
      if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
        return NextResponse.redirect(`${PROD_ADMIN}${pathname}`)
      }
      if (ALUMNI_PATH_PREFIXES.some((p) => p !== '/api/auth' && pathname.startsWith(p))) {
        return NextResponse.redirect(`${PROD_ALUMNI}${pathname}`)
      }
    }
  }

  // ─── For public-marketing routes, skip Supabase entirely ──────────────────

  if (!needsSupabase(pathname)) {
    return NextResponse.next()
  }

  // ─── Env vars sanity check ────────────────────────────────────────────────
  // Without these, Supabase calls crash. Better to fail with a clear message
  // than the cryptic MIDDLEWARE_INVOCATION_FAILED.

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!supabaseUrl || !supabaseAnonKey) {
    return new NextResponse(
      'Server misconfigured: Supabase env vars missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in Vercel project settings → Environment Variables.',
      { status: 500, headers: { 'content-type': 'text/plain' } }
    )
  }

  // ─── Build Supabase server client ─────────────────────────────────────────

  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll()
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        )
        response = NextResponse.next({ request })
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        )
      },
    },
  })

  let user = null
  try {
    const result = await supabase.auth.getUser()
    user = result.data.user
  } catch (err) {
    // If Supabase is unreachable, fail open for public auth pages so the user
    // can still see the login form. For protected pages, redirect to login.
    console.error('[middleware] supabase.auth.getUser failed:', err)
  }

  // ─── Admin CMS auth ───────────────────────────────────────────────────────

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const isPublic = ADMIN_PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
    if (isPublic) return response

    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
    if (!isAdminEmail(user.email)) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      url.searchParams.set('error', 'not_authorized')
      return NextResponse.redirect(url)
    }
    return response
  }

  // ─── Directory routes ─────────────────────────────────────────────────────

  const isDirectoryProtected = DIRECTORY_PROTECTED_PREFIXES.some((p) =>
    pathname.startsWith(p)
  )
  const isDirectoryAuthPage = DIRECTORY_AUTH_PAGES.some((p) =>
    pathname.startsWith(p)
  )

  if (isDirectoryProtected && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  if (isDirectoryAuthPage && user) {
    const url = request.nextUrl.clone()
    url.pathname = '/directory'
    return NextResponse.redirect(url)
  }

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
