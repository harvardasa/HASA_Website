import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { isAdminEmail } from '@/lib/admin-auth'

// ─── Subdomain detection ─────────────────────────────────────────────────────
// Production: admin.harvardafricans.com, alumni.harvardafricans.com, harvardafricans.com
// Dev:        localhost:3000 (treated as apex)
// Preview:    *.vercel.app   (treated as apex)

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

// Admin paths that don't require Supabase auth (used before sign-in)
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
      // Apex: bounce admin / directory paths to their subdomains
      if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
        return NextResponse.redirect(`${PROD_ADMIN}${pathname}`)
      }
      if (ALUMNI_PATH_PREFIXES.some((p) => p !== '/api/auth' && pathname.startsWith(p))) {
        return NextResponse.redirect(`${PROD_ALUMNI}${pathname}`)
      }
    }
  }

  // ─── Build Supabase server client (used for both admin + directory auth) ──

  let response = NextResponse.next({ request: { headers: request.headers } })

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
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // ─── Admin CMS auth (Supabase password + allowlist) ───────────────────────
  // /admin/login, /admin/forgot-password, /admin/reset-password, /api/admin/check-email
  // are public. All other /admin/* and /api/admin/* require allowlisted user.

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    const isPublic = ADMIN_PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'))
    if (isPublic) return response

    if (!user) {
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      return NextResponse.redirect(url)
    }
    if (!isAdminEmail(user.email)) {
      // Signed-in but not allowlisted — bounce to login with error
      const url = request.nextUrl.clone()
      url.pathname = '/admin/login'
      url.searchParams.set('error', 'not_authorized')
      return NextResponse.redirect(url)
    }
    return response
  }

  // ─── Directory routes (Supabase magic-link auth) ──────────────────────────

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
