import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Skip static assets, API routes, and auth-related routes
  if (
    pathname.startsWith('/api') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/forgot-password') ||
    pathname.startsWith('/reset-password') ||
    pathname.startsWith('/verify-email') ||
    pathname.includes('.') // Any file with extension
  ) {
    return NextResponse.next()
  }

  // Create a response object
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Create Supabase client with cookie handling
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options) {
          // Update the request cookies
          request.cookies.set({
            name,
            value,
            ...options,
          })
          // Update the response cookies
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options) {
          // Remove from request cookies
          request.cookies.set({
            name,
            value: '',
            ...options,
          })
          // Remove from response cookies
          response = NextResponse.next({
            request: {
              headers: request.headers,
            },
          })
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  // Define protected routes (routes that require authentication)
  const protectedRoutes = [
    '/dashboard',
    '/contracts',
    '/generate-contract',
    '/manage-parties',
    '/manage-promoters',
    '/profile',
    '/admin',
    '/promoters',
    '/promoter-analysis'
  ]

  // Check if current path is a protected route
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route) || pathname === route
  )

  if (isProtectedRoute) {
    try {
      const { data: { session }, error } = await supabase.auth.getSession()
      
      if (error || !session?.user) {
        console.log('No valid session, redirecting to login')
        return NextResponse.redirect(new URL('/login', request.url))
      }

      // For admin routes, check admin role
      if (pathname.startsWith('/admin')) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', session.user.id)
          .single()

        if (profile?.role !== 'admin') {
          return NextResponse.redirect(new URL('/dashboard', request.url))
        }
      }

      console.log('Valid session found, allowing access to:', pathname)
    } catch (error) {
      console.error('Middleware auth error:', error)
      return NextResponse.redirect(new URL('/login', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    // Skip all static assets and api routes
    "/((?!api|_next|assets|.*\\..*).*)",
  ],
}