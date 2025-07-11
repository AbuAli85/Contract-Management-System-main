import { NextRequest, NextResponse } from 'next/server'
import { createAuthClient, logAuthEvent, checkRateLimit } from '@/lib/auth/utils'
import { resetPasswordRequestSchema } from '@/lib/auth/types'
import { withSecureAPI } from '@/lib/auth/middleware'

async function handler(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json()
    const validation = resetPasswordRequestSchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { email } = validation.data
    
    // Rate limiting
    const { allowed } = await checkRateLimit(email, 'password_reset', 3, 60) // 3 attempts per hour
    
    if (!allowed) {
      await logAuthEvent('password_reset_request', undefined, { email }, false, 'Rate limit exceeded', req)
      return NextResponse.json(
        { error: 'Too many reset attempts. Please try again later.' },
        { status: 429 }
      )
    }

    const supabase = await createAuthClient()
    
    // Check if user exists
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .eq('email', email)
      .single()
    
    if (profile) {
      // Send reset email
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/auth/reset-password`
      })
      
      if (error) {
        await logAuthEvent('password_reset_request', profile.id, { email }, false, error.message, req)
        throw error
      }
      
      await logAuthEvent('password_reset_request', profile.id, { email }, true, undefined, req)
    }
    
    // Always return success to prevent email enumeration
    return NextResponse.json({
      message: 'If an account exists with this email, you will receive a password reset link.'
    })
  } catch (error) {
    console.error('Password reset request error:', error)
    return NextResponse.json(
      { error: 'Failed to process password reset request' },
      { status: 500 }
    )
  }
}

export const POST = withSecureAPI(handler, {
  rateLimit: { maxAttempts: 5, windowMinutes: 60 }
})