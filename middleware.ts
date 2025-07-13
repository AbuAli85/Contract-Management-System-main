import { createServerClient } from "@supabase/ssr"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import createMiddleware from "next-intl/middleware"

// List of supported locales
const locales = ["en", "ar"]
const defaultLocale = "en"

// List of public paths that don't require locale prefix
const publicPaths = ["/api", "/_next", "/favicon.ico"]

export async function middleware(request: NextRequest) {
  const response = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          response.cookies.set({ name, value: "", ...options })
        },
      },
    },
  )

  // Get current session
  const {
    data: { session },
  } = await supabase.auth.getSession()

  // Define protected routes
  const protectedRoutes = [
    "/contracts",
    "/parties",
    "/promoters",
    "/reports",
    "/generate-contract",
    "/manage-parties",
    "/dashboard",
    "/profile",
    "/settings",
  ]

  // Define admin routes
  const adminRoutes = ["/admin", "/users", "/roles", "/permissions", "/audit"]

  const pathname = request.nextUrl.pathname
  const locale = pathname.split("/")[1] // Get locale from URL
  const routeWithoutLocale = pathname.replace(`/${locale}`, "")

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) => routeWithoutLocale.startsWith(route))

  const isAdminRoute = adminRoutes.some((route) => routeWithoutLocale.startsWith(route))

  // Redirect to login if accessing protected route without session
  if (isProtectedRoute && !session) {
    const loginUrl = new URL(`/${locale}/auth/signin`, request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check admin access
  if (isAdminRoute && session) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", session.user.id).single()

    if (profile?.role !== "admin") {
      return NextResponse.redirect(new URL(`/${locale}/unauthorized`, request.url))
    }
  }

  // Redirect to login if accessing admin route without session
  if (isAdminRoute && !session) {
    const loginUrl = new URL(`/${locale}/auth/signin`, request.url)
    loginUrl.searchParams.set("redirect", pathname)
    return NextResponse.redirect(loginUrl)
  }

  // Check if the path is a public path
  const isPublicPath = publicPaths.some((path) => pathname.startsWith(path))
  if (isPublicPath) {
    return NextResponse.next()
  }

  // Check if the pathname already has a locale
  const pathnameHasLocale = locales.some((locale) => pathname.startsWith(`/${locale}/`) || pathname === `/${locale}`)

  if (!pathnameHasLocale) {
    // Redirect to the same path with the default locale
    const url = new URL(`/${defaultLocale}${pathname}`, request.url)
    return NextResponse.redirect(url)
  }

  return response
}

export default createMiddleware({
  // A list of all locales that are supported
  locales: ["en", "ar"],

  // Used when no locale matches
  defaultLocale: "en",
})

export const config = {
  // Match only internationalized pathnames
  matcher: ["/", "/(ar|en)/:path*"],
}
