import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import { withSecurity, getClientIP, sanitizeInput } from "@/lib/auth/middleware/security"
import { logAuthEvent } from "@/lib/auth/utils"

const verifyEmailSchema = z.object({
  token: z.string().min(20),
  email: z.string().email().optional(),
})

async function handler(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const token = searchParams.get("token")
    const email = searchParams.get("email")

    // Validate input
    const validation = verifyEmailSchema.safeParse({ token, email })
    if (!validation.success) {
      return NextResponse.json({ error: "Invalid verification link" }, { status: 400 })
    }

    const supabase = createClient()

    // Check if token exists and is valid
    const { data: verificationToken, error: tokenError } = await supabase
      .from("email_verification_tokens")
      .select("*")
      .eq("token", token)
      .single()

    if (tokenError || !verificationToken) {
      await logAuthEvent(
        "email_verification_failed",
        null,
        {
          reason: "invalid_token",
          token: token.substring(0, 10) + "...",
        },
        false,
        "Invalid verification token",
        req
      )

      return NextResponse.json({ error: "Invalid or expired verification token" }, { status: 400 })
    }

    // Check if token is expired
    if (new Date(verificationToken.expires_at) < new Date()) {
      await logAuthEvent(
        "email_verification_failed",
        verificationToken.user_id,
        {
          reason: "token_expired",
        },
        false,
        "Verification token expired",
        req
      )

      return NextResponse.json({ error: "Verification token has expired" }, { status: 400 })
    }

    // Check if already verified
    if (verificationToken.verified_at) {
      return NextResponse.json({ error: "Email already verified" }, { status: 400 })
    }

    // Verify the email
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        email_verified_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", verificationToken.user_id)

    if (updateError) {
      throw updateError
    }

    // Mark token as used
    await supabase
      .from("email_verification_tokens")
      .update({ verified_at: new Date().toISOString() })
      .eq("id", verificationToken.id)

    // Log successful verification
    await logAuthEvent(
      "email_verified",
      verificationToken.user_id,
      {
        email: verificationToken.email,
      },
      true,
      undefined,
      req
    )

    // Create security event
    await supabase.from("security_events").insert({
      user_id: verificationToken.user_id,
      event_type: "email_verified",
      severity: "info",
      description: "Email address verified successfully",
      metadata: { email: verificationToken.email },
      ip_address: getClientIP(req),
      user_agent: req.headers.get("user-agent"),
    })

    // Redirect to success page
    return NextResponse.redirect(new URL("/auth/verify-email/success", req.url))
  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.json({ error: "Failed to verify email" }, { status: 500 })
  }
}

export const GET = (req: NextRequest) => withSecurity(req, handler)
