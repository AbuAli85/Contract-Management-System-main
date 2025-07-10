import { NextResponse, type NextRequest } from "next/server"

const locales = ["en", "ar"]
const defaultLocale = "en"

export function middleware(request: NextRequest) {
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
