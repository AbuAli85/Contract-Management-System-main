import { NextRequest, NextResponse } from "next/server"
import { createAuthClient, logAuthEvent } from "@/lib/auth/utils"
import { resetPasswordSchema } from "@/lib/auth/types"
import { withSecureAPI } from "@/lib/auth/middleware"

async function handler(req: NextRequest) {
  try {
    // Parse and validate request body
    const body = await req.json()
    const validation = resetPasswordSchema.safeParse(body)

    if (!validation.success) {
      return NextResponse.json(
        { error: "Invalid input", details: validation.error.flatten() },
        { status: 400 }
      )
    }

    const { token, password } = validation.data
    const supabase = await createAuthClient()

    // Verify token and update password
    const { data, error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      await logAuthEvent("password_reset_complete", undefined, {}, false, error.message, req)

      if (error.message.includes("expired")) {
        return NextResponse.json(
          { error: "Reset link has expired. Please request a new one." },
          { status: 400 }
        )
      }

      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 })
    }

    if (data.user) {
      // Clear any account locks
      await supabase
        .from("profiles")
        .update({
          failed_attempts: 0,
          locked_at: null,
        })
        .eq("id", data.user.id)

      await logAuthEvent("password_reset_complete", data.user.id, {}, true, undefined, req)
    }

    return NextResponse.json({
      message: "Password reset successfully. You can now sign in with your new password.",
    })
  } catch (error) {
    console.error("Password reset confirm error:", error)
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 })
  }
}

export const POST = withSecureAPI(handler)
