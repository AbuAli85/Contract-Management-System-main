import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'
import { AuthUser, AuthEventType } from './types'
import type { Database } from '@/types/supabase'
import crypto from 'crypto'

// Cookie configuration
export const AUTH_COOKIE_OPTIONS = {
  name: 'auth-token',
  lifetime: 60 * 60 * 8, // 8 hours
  domain: process.env.COOKIE_DOMAIN,
  sameSite: 'lax' as const,
  secure: process.env.NODE_ENV === 'production',
  httpOnly: true,
  path: '/'
}

// Create authenticated Supabase client
export async function createAuthClient() {
  const cookieStore = await cookies()
  
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options) {
          cookieStore.set({ name, value: '', ...options })
        },
      },
    }
  )
}

// Get current user with role
export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createAuthClient()
  
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_active, email_verified_at')
    .eq('id', user.id)
    .single()

  if (!profile || !profile.is_active) return null

  const { data: mfaSettings } = await supabase
    .from('mfa_settings')
    .select('totp_enabled')
    .eq('user_id', user.id)
    .single()

  return {
    id: user.id,
    email: user.email!,
    role: profile.role || 'user',
    isActive: profile.is_active,
    emailVerifiedAt: profile.email_verified_at ? new Date(profile.email_verified_at) : undefined,
    mfaEnabled: mfaSettings?.totp_enabled || false
  }
}

// Check if user has role
export async function hasRole(role: string): Promise<boolean> {
  const user = await getCurrentUser()
  return user?.role === role
}

// Log auth event
export async function logAuthEvent(
  eventType: AuthEventType,
  userId?: string,
  metadata?: Record<string, any>,
  success: boolean = true,
  errorMessage?: string,
  request?: NextRequest
) {
  const supabase = await createAuthClient()
  
  const ipAddress = request?.headers.get('x-forwarded-for') || 
                   request?.headers.get('x-real-ip') || 
                   'unknown'
  const userAgent = request?.headers.get('user-agent') || 'unknown'

  await supabase.rpc('log_auth_event', {
    p_user_id: userId,
    p_event_type: eventType,
    p_ip_address: ipAddress,
    p_user_agent: userAgent,
    p_metadata: metadata || {},
    p_success: success,
    p_error_message: errorMessage
  })
}

// Rate limiting
export async function checkRateLimit(
  identifier: string,
  action: string,
  maxAttempts: number = 5,
  windowMinutes: number = 15
): Promise<{ allowed: boolean; remainingAttempts: number; resetAt?: Date }> {
  const supabase = await createAuthClient()
  const now = new Date()
  const windowStart = new Date(now.getTime() - windowMinutes * 60 * 1000)

  // Get current rate limit record
  const { data: rateLimit } = await supabase
    .from('rate_limits')
    .select('*')
    .eq('identifier', identifier)
    .eq('action', action)
    .single()

  // If blocked, check if block has expired
  if (rateLimit?.blocked_until) {
    const blockedUntil = new Date(rateLimit.blocked_until)
    if (blockedUntil > now) {
      return {
        allowed: false,
        remainingAttempts: 0,
        resetAt: blockedUntil
      }
    }
  }

  // If no record or window expired, create/reset
  if (!rateLimit || new Date(rateLimit.window_start) < windowStart) {
    await supabase
      .from('rate_limits')
      .upsert({
        identifier,
        action,
        attempts: 1,
        window_start: now.toISOString(),
        blocked_until: null
      })
    
    return {
      allowed: true,
      remainingAttempts: maxAttempts - 1
    }
  }

  // Check attempts
  const attempts = rateLimit.attempts + 1
  
  if (attempts > maxAttempts) {
    // Block for extended period
    const blockedUntil = new Date(now.getTime() + 30 * 60 * 1000) // 30 minutes
    
    await supabase
      .from('rate_limits')
      .update({
        attempts,
        blocked_until: blockedUntil.toISOString()
      })
      .eq('identifier', identifier)
      .eq('action', action)
    
    return {
      allowed: false,
      remainingAttempts: 0,
      resetAt: blockedUntil
    }
  }

  // Update attempts
  await supabase
    .from('rate_limits')
    .update({ attempts })
    .eq('identifier', identifier)
    .eq('action', action)

  return {
    allowed: true,
    remainingAttempts: maxAttempts - attempts
  }
}

// Generate secure random token
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

// Generate backup codes
export function generateBackupCodes(count: number = 10): string[] {
  const codes: string[] = []
  for (let i = 0; i < count; i++) {
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    codes.push(`${code.slice(0, 4)}-${code.slice(4)}`)
  }
  return codes
}

// Hash backup code for storage
export function hashBackupCode(code: string): string {
  return crypto.createHash('sha256').update(code).digest('hex')
}

// Verify backup code
export function verifyBackupCode(code: string, hashedCodes: string[]): boolean {
  const hashedInput = hashBackupCode(code)
  return hashedCodes.includes(hashedInput)
}

// Session management
export async function createSession(
  userId: string,
  request?: NextRequest
): Promise<string> {
  const supabase = await createAuthClient()
  const refreshToken = generateSecureToken(64)
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  const ipAddress = request?.headers.get('x-forwarded-for') || 
                   request?.headers.get('x-real-ip') || 
                   'unknown'
  const userAgent = request?.headers.get('user-agent') || 'unknown'

  await supabase
    .from('user_sessions')
    .insert({
      user_id: userId,
      refresh_token: refreshToken,
      expires_at: expiresAt.toISOString(),
      ip_address: ipAddress,
      user_agent: userAgent
    })

  return refreshToken
}

// Clean expired sessions
export async function cleanExpiredSessions(userId?: string) {
  const supabase = await createAuthClient()
  const query = supabase
    .from('user_sessions')
    .delete()
    .lt('expires_at', new Date().toISOString())

  if (userId) {
    query.eq('user_id', userId)
  }

  await query
}

// Validate CSRF token
export function validateCSRFToken(token: string, sessionToken: string): boolean {
  const expected = crypto
    .createHmac('sha256', process.env.CSRF_SECRET || 'csrf-secret')
    .update(sessionToken)
    .digest('hex')
  
  return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected))
}

// Generate CSRF token
export function generateCSRFToken(sessionToken: string): string {
  return crypto
    .createHmac('sha256', process.env.CSRF_SECRET || 'csrf-secret')
    .update(sessionToken)
    .digest('hex')
}