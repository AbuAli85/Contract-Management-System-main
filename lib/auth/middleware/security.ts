import { NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { nanoid } from "nanoid"
import { z } from "zod"

// Security headers configuration
const securityHeaders = {
  "X-DNS-Prefetch-Control": "on",
  "Strict-Transport-Security": "max-age=63072000; includeSubDomains; preload",
  "X-Frame-Options": "SAMEORIGIN",
  "X-Content-Type-Options": "nosniff",
  "X-XSS-Protection": "1; mode=block",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  "Content-Security-Policy": `
    default-src 'self';
    script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net;
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https: blob:;
    font-src 'self' data:;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  `
    .replace(/\s+/g, " ")
    .trim(),
}

// CORS configuration
const corsHeaders = {
  "Access-Control-Allow-Origin": process.env.NEXT_PUBLIC_APP_URL || "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-CSRF-Token",
  "Access-Control-Max-Age": "86400",
}

// Rate limit configuration
interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  message?: string
}

const rateLimitConfigs: Record<string, RateLimitConfig> = {
  "/api/auth/signin": { windowMs: 15 * 60 * 1000, maxRequests: 5 },
  "/api/auth/signup": { windowMs: 60 * 60 * 1000, maxRequests: 3 },
  "/api/auth/reset-password": { windowMs: 60 * 60 * 1000, maxRequests: 3 },
  "/api/auth/mfa/verify": { windowMs: 5 * 60 * 1000, maxRequests: 5 },
  "/api": { windowMs: 60 * 1000, maxRequests: 100 }, // General API limit
}

// CSRF token management
export function generateCSRFToken(): string {
  return nanoid(32)
}

export function validateCSRFToken(request: NextRequest, token: string): boolean {
  const headerToken = request.headers.get("X-CSRF-Token")
  const cookieToken = request.cookies.get("csrf-token")?.value

  return headerToken === token && cookieToken === token
}

// IP address extraction
export function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for")
  const real = request.headers.get("x-real-ip")
  const ip = forwarded?.split(",")[0] || real || "unknown"

  return ip.trim()
}

// User agent parsing
export function parseUserAgent(userAgent: string | null) {
  if (!userAgent) return { browser: "unknown", os: "unknown", device: "unknown" }

  // Simple parsing - in production, use a library like 'ua-parser-js'
  const browser = userAgent.match(/(Chrome|Firefox|Safari|Edge|Opera)/i)?.[0] || "unknown"
  const os = userAgent.match(/(Windows|Mac|Linux|Android|iOS)/i)?.[0] || "unknown"
  const device = userAgent.match(/(Mobile|Tablet)/i) ? "mobile" : "desktop"

  return { browser, os, device }
}

// Device fingerprinting
export function generateDeviceFingerprint(request: NextRequest): string {
  const userAgent = request.headers.get("user-agent") || ""
  const acceptLanguage = request.headers.get("accept-language") || ""
  const acceptEncoding = request.headers.get("accept-encoding") || ""

  // Simple fingerprint - in production, use client-side fingerprinting
  const fingerprint = `${userAgent}|${acceptLanguage}|${acceptEncoding}`
  return Buffer.from(fingerprint).toString("base64").substring(0, 32)
}

// Rate limiting implementation
export async function checkRateLimit(
  request: NextRequest,
  identifier: string,
  action: string
): Promise<{ allowed: boolean; retryAfter?: number }> {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set() {},
        remove() {},
      },
    }
  )

  const config = rateLimitConfigs[action] || rateLimitConfigs["/api"]
  const now = new Date()
  const windowStart = new Date(now.getTime() - config.windowMs)

  // Check existing rate limit
  const { data: rateLimit } = await supabase
    .from("rate_limits_v2")
    .select("*")
    .eq("identifier", identifier)
    .eq("action", action)
    .gte("window_start", windowStart.toISOString())
    .single()

  if (rateLimit) {
    if (rateLimit.blocked_until && new Date(rateLimit.blocked_until) > now) {
      return {
        allowed: false,
        retryAfter: Math.ceil((new Date(rateLimit.blocked_until).getTime() - now.getTime()) / 1000),
      }
    }

    if (rateLimit.attempts >= config.maxRequests) {
      // Block for additional time
      const blockedUntil = new Date(now.getTime() + 60 * 60 * 1000) // 1 hour

      await supabase
        .from("rate_limits_v2")
        .update({ blocked_until: blockedUntil.toISOString() })
        .eq("id", rateLimit.id)

      return {
        allowed: false,
        retryAfter: 3600,
      }
    }

    // Increment attempts
    await supabase
      .from("rate_limits_v2")
      .update({
        attempts: rateLimit.attempts + 1,
        updated_at: now.toISOString(),
      })
      .eq("id", rateLimit.id)
  } else {
    // Create new rate limit entry
    await supabase.from("rate_limits_v2").insert({
      identifier,
      action,
      attempts: 1,
      window_start: now.toISOString(),
      window_end: new Date(now.getTime() + config.windowMs).toISOString(),
    })
  }

  return { allowed: true }
}

// Security middleware
export async function withSecurity(
  request: NextRequest,
  handler: (request: NextRequest) => Promise<NextResponse>
): Promise<NextResponse> {
  // Apply security headers
  const response = await handler(request)

  Object.entries(securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value)
  })

  // Apply CORS headers for API routes
  if (request.nextUrl.pathname.startsWith("/api")) {
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value)
    })
  }

  // Set CSRF token if not present
  if (!request.cookies.get("csrf-token")) {
    const csrfToken = generateCSRFToken()
    response.cookies.set("csrf-token", csrfToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 86400, // 24 hours
    })
  }

  return response
}

// Auth session validation
export async function validateSession(request: NextRequest) {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set() {},
        remove() {},
      },
    }
  )

  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error || !session) {
    return { valid: false, session: null, user: null }
  }

  // Check if session needs refresh
  const expiresAt = new Date(session.expires_at! * 1000)
  const now = new Date()
  const timeUntilExpiry = expiresAt.getTime() - now.getTime()

  // Refresh if less than 5 minutes until expiry
  if (timeUntilExpiry < 5 * 60 * 1000) {
    const {
      data: { session: refreshedSession },
      error: refreshError,
    } = await supabase.auth.refreshSession()

    if (!refreshError && refreshedSession) {
      return { valid: true, session: refreshedSession, user: refreshedSession.user }
    }
  }

  return { valid: true, session, user: session.user }
}

// Input validation schemas
export const authSchemas = {
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8).max(100),
  username: z
    .string()
    .min(3)
    .max(30)
    .regex(/^[a-zA-Z0-9_-]+$/),
  phone: z.string().regex(/^\+?[1-9]\d{1,14}$/),
  otp: z.string().length(6).regex(/^\d+$/),
  token: z.string().min(20).max(100),
}

// Sanitize user input
export function sanitizeInput(input: any): any {
  if (typeof input === "string") {
    // Remove potential XSS vectors
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
      .replace(/javascript:/gi, "")
      .replace(/on\w+\s*=/gi, "")
      .trim()
  }

  if (Array.isArray(input)) {
    return input.map(sanitizeInput)
  }

  if (typeof input === "object" && input !== null) {
    const sanitized: any = {}
    for (const [key, value] of Object.entries(input)) {
      sanitized[key] = sanitizeInput(value)
    }
    return sanitized
  }

  return input
}
