import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser, hasRole, checkRateLimit, logAuthEvent } from "./utils"

export interface AuthMiddlewareOptions {
  requireAuth?: boolean
  requireRoles?: string[]
  rateLimit?: {
    maxAttempts: number
    windowMinutes: number
  }
  requireMFA?: boolean
}

export function withAuth(
  handler: (req: NextRequest, user?: any) => Promise<NextResponse>,
  options: AuthMiddlewareOptions = {}
) {
  return async (req: NextRequest) => {
    try {
      // Rate limiting
      if (options.rateLimit) {
        const identifier =
          req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "unknown"
        const action = `${req.method}:${req.nextUrl.pathname}`

        const { allowed, remainingAttempts, resetAt } = await checkRateLimit(
          identifier,
          action,
          options.rateLimit.maxAttempts,
          options.rateLimit.windowMinutes
        )

        if (!allowed) {
          return NextResponse.json(
            {
              error: "Too many requests",
              resetAt: resetAt?.toISOString(),
            },
            {
              status: 429,
              headers: {
                "X-RateLimit-Limit": options.rateLimit.maxAttempts.toString(),
                "X-RateLimit-Remaining": "0",
                "X-RateLimit-Reset": resetAt?.toISOString() || "",
              },
            }
          )
        }

        // Add rate limit headers
        const response = await handler(req)
        response.headers.set("X-RateLimit-Limit", options.rateLimit.maxAttempts.toString())
        response.headers.set("X-RateLimit-Remaining", remainingAttempts.toString())

        return response
      }

      // Authentication check
      if (options.requireAuth) {
        const user = await getCurrentUser()

        if (!user) {
          await logAuthEvent(
            "unauthorized_access",
            undefined,
            {
              path: req.nextUrl.pathname,
              method: req.method,
            },
            false,
            "No authenticated user",
            req
          )

          return NextResponse.json({ error: "Authentication required" }, { status: 401 })
        }

        // Role check
        if (options.requireRoles && options.requireRoles.length > 0) {
          const hasRequiredRole = options.requireRoles.some((role) => user.role === role)

          if (!hasRequiredRole) {
            await logAuthEvent(
              "forbidden_access",
              user.id,
              {
                path: req.nextUrl.pathname,
                method: req.method,
                requiredRoles: options.requireRoles,
                userRole: user.role,
              },
              false,
              "Insufficient permissions",
              req
            )

            return NextResponse.json({ error: "Insufficient permissions" }, { status: 403 })
          }
        }

        // MFA check
        if (options.requireMFA && !user.mfaEnabled) {
          return NextResponse.json({ error: "MFA required for this action" }, { status: 403 })
        }

        return handler(req, user)
      }

      return handler(req)
    } catch (error) {
      console.error("Auth middleware error:", error)
      return NextResponse.json({ error: "Internal server error" }, { status: 500 })
    }
  }
}

// Specific middleware presets
export const requireAuth = (handler: any) => withAuth(handler, { requireAuth: true })
export const requireAdmin = (handler: any) =>
  withAuth(handler, { requireAuth: true, requireRoles: ["admin"] })
export const requireMFA = (handler: any) =>
  withAuth(handler, { requireAuth: true, requireMFA: true })

// CORS middleware
export function withCORS(handler: any) {
  return async (req: NextRequest) => {
    const origin = req.headers.get("origin")
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(",") || ["http://localhost:3000"]

    const response = await handler(req)

    if (origin && allowedOrigins.includes(origin)) {
      response.headers.set("Access-Control-Allow-Origin", origin)
      response.headers.set("Access-Control-Allow-Credentials", "true")
      response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
      response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization")
    }

    return response
  }
}

// Combined middleware
export function withSecureAPI(handler: any, options: AuthMiddlewareOptions = {}) {
  return withCORS(withAuth(handler, options))
}
