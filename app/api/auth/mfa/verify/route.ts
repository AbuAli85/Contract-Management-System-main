import { NextRequest, NextResponse } from 'next/server'
import { createAuthClient, getCurrentUser, logAuthEvent } from '@/lib/auth/utils'
import { mfaVerifySchema } from '@/lib/auth/types'
import { requireAuth } from '@/lib/auth/middleware'
import { verifyTOTP } from '@/lib/auth/totp'

async function handler(req: NextRequest, user: any) {
  try {
    // Parse and validate request body
    const body = await req.json()
    const validation = mfaVerifySchema.safeParse(body)
    
    if (!validation.success) {
      return NextResponse.json(
        { error: 'Invalid input', details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { code } = validation.data
    const supabase = await createAuthClient()
    
    // Get MFA settings
    const { data: mfaSettings, error } = await supabase
      .from('mfa_settings')
      .select('totp_secret, totp_enabled')
      .eq('user_id', user.id)
      .single()
    
    if (error || !mfaSettings?.totp_secret) {
      return NextResponse.json(
        { error: 'MFA not configured' },
        { status: 400 }
      )
    }
    
    // Verify TOTP code
    const verified = verifyTOTP(code, mfaSettings.totp_secret)
    
    if (!verified) {
      await logAuthEvent('mfa_verify', user.id, {}, false, 'Invalid code', req)
      return NextResponse.json(
        { error: 'Invalid verification code' },
        { status: 400 }
      )
    }
    
    // Enable MFA if this is the first verification
    if (!mfaSettings.totp_enabled) {
      await supabase
        .from('mfa_settings')
        .update({ totp_enabled: true })
        .eq('user_id', user.id)
      
      await logAuthEvent('mfa_enable', user.id, {}, true, undefined, req)
    } else {
      await logAuthEvent('mfa_verify', user.id, {}, true, undefined, req)
    }
    
    return NextResponse.json({
      message: 'MFA verification successful',
      mfaEnabled: true
    })
  } catch (error) {
    console.error('MFA verify error:', error)
    return NextResponse.json(
      { error: 'Failed to verify MFA code' },
      { status: 500 }
    )
  }
}

export const POST = requireAuth(handler)