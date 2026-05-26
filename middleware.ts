import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { ADMIN_COOKIE_NAME } from '@/lib/admin/constants'

const HASA_ADMIN_PUBLIC_PATHS = ['/admin/login']
const DIRECTORY_PROTECTED_PREFIXES = ['/directory', '/profile', '/pending', '/onboarding']
const DIRECTORY_AUTH_PAGES = ['/login', '/verify']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // ─── HASA CMS admin (cookie-based auth, unchanged behavior) ────────────────
  if (pathname.startsWith('/admin') && !pathname.startsWith('/directory/admin')) {
    if (HASA_ADMIN_PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
      return NextResponse.next()
    }
    const hasSession =
      request.cookies.get(ADMIN_COOKIE_NAME)?.value === 'authorized'
    if (!hasSession) {
      const loginUrl = new URL('/admin/login', request.url)
      loginUrl.searchParams.set('next', pathname)
      return NextResponse.redirect(loginUrl)
    }
    return NextResponse.next()
  }

  // ─── Directory routes (Supabase magic-link auth) ───────────────────────────
  const isDirectoryProtected = DIRECTORY_PROTECTED_PREFIXES.some((p) =>
    pathname.startsWith(p)
  )
  const isDirectoryAuthPage = DIRECTORY_AUTH_PAGES.some((p) =>
    pathname.startsWith(p)
  )

  if (!isDirectoryProtected && !isDirectoryAuthPage) {
    return NextResponse.next()
  }

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
