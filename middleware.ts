import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// List of supported locales
const locales = ["en", "ar"]
const defaultLocale = "en"

// List of public paths that don't require locale prefix
const publicPaths = ["/api", "/_next", "/favicon.ico"]

export function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // Check if the path is a public path
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))
  if (isPublicPath) {
    return NextResponse.next()
  }

  // Check if the pathname already has a locale
  const pathnameHasLocale = locales.some(
    (locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`
  )

  if (!pathnameHasLocale) {
    // Redirect to the same path with the default locale
    const url = new URL(`/${defaultLocale}${pathname}`, request.url)
    return NextResponse.redirect(url)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Skip all internal paths (_next)
    "/((?!_next|api|favicon.ico).*)",
  ],
}
