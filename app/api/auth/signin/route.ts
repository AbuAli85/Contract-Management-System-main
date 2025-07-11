import { NextRequest, NextResponse } from 'next/server'
import { createAuthClient, logAuthEvent, checkRateLimit, createSession } from '@/lib/auth/utils'
import { signInSchema } from '@/lib/auth/types'
import { withSecureAPI } from '@/lib/auth/middleware'

async function handler(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json()
    const validation = signInSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { email, password, rememberMe } = validation.data
    
    // Rate limiting by email
    const { allowed, remainingAttempts } = await checkRateLimit(email, 'signin', 5, 15)
    
    if (!allowed) {
      await logAuthEvent('sign_in', undefined, { email }, false, 'Rate limit exceeded', req)
      return NextResponse.json(
        { error: 'Too many login attempts. Please try again later.' },
        { status: 429 }
      )
    }

    // Attempt sign in
    const supabase = await createAuthClient()
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })

    if (error) {
      await logAuthEvent('sign_in', undefined, { email }, false, error.message, req)
      
      // Update failed attempts
      const { data: profile } = await supabase
        .from('profiles')
        .select('failed_attempts')
        .eq('email', email)
        .single()
      
      if (profile) {
        const failedAttempts = (profile.failed_attempts || 0) + 1
        
        // Lock account after 5 failed attempts
        if (failedAttempts >= 5) {
          await supabase
            .from('profiles')
            .update({ 
              failed_attempts: failedAttempts,
              locked_at: new Date().toISOString()
            })
            .eq('email', email)
          
          await logAuthEvent('account_locked', undefined, { email }, true, undefined, req)
          
          return NextResponse.json(
            { error: 'Account locked due to multiple failed attempts. Please reset your password.' },
            { status: 423 }
          )
        } else {
          await supabase
            .from('profiles')
            .update({ failed_attempts: failedAttempts })
            .eq('email', email)
        }
      }
      
      return NextResponse.json(
        { 
          error: 'Invalid email or password',
          remainingAttempts: Math.max(0, 5 - (profile?.failed_attempts || 0) - 1)
        },
        { status: 401 }
      )
    }

    if (!data.user) {
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      )
    }

    // Check if account is locked
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_active, locked_at, role')
      .eq('id', data.user.id)
      .single()
    
    if (profile?.locked_at) {
      await logAuthEvent('sign_in', data.user.id, { email }, false, 'Account locked', req)
      return NextResponse.json(
        { error: 'Account is locked. Please reset your password.' },
        { status: 423 }
      )
    }
    
    if (!profile?.is_active) {
      await logAuthEvent('sign_in', data.user.id, { email }, false, 'Account inactive', req)
      return NextResponse.json(
        { error: 'Account is inactive. Please contact support.' },
        { status: 403 }
      )
    }

    // Reset failed attempts and update last sign in
    await supabase
      .from('profiles')
      .update({ 
        failed_attempts: 0,
        last_sign_in_at: new Date().toISOString(),
        sign_in_count: supabase.rpc('increment', { x: 1, row_id: data.user.id })
      })
      .eq('id', data.user.id)

    // Create session
    const refreshToken = await createSession(data.user.id, req)

    // Check if MFA is enabled
    const { data: mfaSettings } = await supabase
      .from('mfa_settings')
      .select('totp_enabled')
      .eq('user_id', data.user.id)
      .single()

    // Log successful sign in
    await logAuthEvent('sign_in', data.user.id, { email }, true, undefined, req)

    const response = NextResponse.json({
      message: 'Sign in successful',
      user: {
        id: data.user.id,
        email: data.user.email,
        role: profile.role,
        mfaRequired: mfaSettings?.totp_enabled || false
      },
      session: data.session
    })

    // Set secure cookie
    if (rememberMe) {
      response.cookies.set('refresh_token', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 // 30 days
      })
    }

    return response
  } catch (error) {
    console.error('Signin error:', error)
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    )
  }
}

export const POST = withSecureAPI(handler, {
  rateLimit: { maxAttempts: 20, windowMinutes: 15 }
})