import { NextRequest, NextResponse } from 'next/server'
import { createAuthClient, getCurrentUser, logAuthEvent, generateBackupCodes, hashBackupCode } from '@/lib/auth/utils'
import { requireAuth } from '@/lib/auth/middleware'
import { generateSecret, generateOTPAuthURL } from '@/lib/auth/totp'
import { generateQRCode } from '@/lib/auth/qrcode'

async function handler(req: NextRequest, user: any) {
  try {
    const supabase = await createAuthClient()
    
    // Check if MFA is already enabled
    const { data: existingMFA } = await supabase
      .from('mfa_settings')
      .select('totp_enabled')
      .eq('user_id', user.id)
      .single()
    
    if (existingMFA?.totp_enabled) {
      return NextResponse.json(
        { error: 'MFA is already enabled for this account' },
        { status: 400 }
      )
    }
    
    // Generate TOTP secret
    const secret = generateSecret()
    const appName = process.env.NEXT_PUBLIC_APP_NAME || 'Contract Management'
    const otpAuthUrl = generateOTPAuthURL(secret, user.email, appName)
    
    // Generate QR code
    const qrCodeUrl = await generateQRCode(otpAuthUrl)
    
    // Generate backup codes
    const backupCodes = generateBackupCodes(10)
    const hashedBackupCodes = backupCodes.map(code => hashBackupCode(code))
    
    // Store MFA settings (not enabled yet)
    await supabase
      .from('mfa_settings')
      .upsert({
        user_id: user.id,
        totp_secret: secret,
        totp_enabled: false,
        backup_codes: hashedBackupCodes
      })
    
    await logAuthEvent('mfa_setup_initiated', user.id, {}, true, undefined, req)
    
    return NextResponse.json({
      secret: secret,
      qrCode: qrCodeUrl,
      backupCodes
    })
  } catch (error) {
    console.error('MFA setup error:', error)
    return NextResponse.json(
      { error: 'Failed to setup MFA' },
      { status: 500 }
    )
  }
}

export const POST = requireAuth(handler)