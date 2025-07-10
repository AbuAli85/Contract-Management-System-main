import { NextResponse, type NextRequest } from "next/server"
import { getSupabaseAdmin } from '@/lib/supabase/admin'

const locales = ["en", "ar"]
const defaultLocale = "en"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static assets completely
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname.includes('.') // Any file with extension
  ) {
    return NextResponse.next()
  }

  // Protect all /dashboard, /contracts, /admin, and /manage-* routes
  if (/^\/(dashboard|contracts|admin|manage-)/.test(pathname)) {
    // Get session from cookies (server-side)
    const supabase = getSupabaseAdmin()
    const access_token = request.cookies.get('sb-access-token')?.value
    if (!access_token) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    const { data: { user }, error } = await supabase.auth.getUser(access_token)
    if (error || !user) {
      return NextResponse.redirect(new URL('/login', request.url))
    }
    // Optionally, enforce email verification
    if (!user.email_confirmed_at) {
      return NextResponse.redirect(new URL('/verify-email', request.url))
    }
    // Optionally, enforce RBAC (example: only admins for /admin)
    if (/^\/admin/.test(pathname) && !user.app_metadata?.role?.includes('admin')) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  // Check if the pathname already has a locale prefix
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`,
  )

  if (pathnameHasLocale) {
    return NextResponse.next()
  }

  // If no locale, redirect to the default locale
  // Prepend the default locale to the pathname
  request.nextUrl.pathname = `/${defaultLocale}${pathname}`
  return NextResponse.redirect(request.nextUrl)
}

export const config = {
  matcher: [
    // Skip all static assets and api routes
    "/((?!api|_next|assets|.*\\..*).*)",
  ],
}
