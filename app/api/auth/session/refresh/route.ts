import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import {
  withSecurity,
  validateSession,
  getClientIP,
  generateDeviceFingerprint,
} from "@/lib/auth/middleware/security"
import { logAuthEvent } from "@/lib/auth/utils"
import { nanoid } from "nanoid"

async function handler(req: NextRequest) {
  try {
    const supabase = createClient()

    // Validate current session
    const { valid, session, user } = await validateSession(req)

    if (!valid || !session || !user) {
      return NextResponse.json({ error: "Invalid or expired session" }, { status: 401 })
    }

    // Get refresh token from request
    const refreshToken =
      req.cookies.get("refresh-token")?.value || req.headers.get("X-Refresh-Token")

    if (!refreshToken) {
      return NextResponse.json({ error: "Refresh token not provided" }, { status: 400 })
    }

    // Validate refresh token in database
    const { data: sessionData, error: sessionError } = await supabase
      .from("user_sessions")
      .select("*")
      .eq("refresh_token", refreshToken)
      .eq("user_id", user.id)
      .single()

    if (sessionError || !sessionData) {
      await logAuthEvent(
        "session_refresh_failed",
        user.id,
        {
          reason: "invalid_refresh_token",
        },
        false,
        "Invalid refresh token",
        req
      )

      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 })
    }

    // Check if refresh token is expired
    if (new Date(sessionData.expires_at) < new Date()) {
      await logAuthEvent(
        "session_refresh_failed",
        user.id,
        {
          reason: "refresh_token_expired",
        },
        false,
        "Refresh token expired",
        req
      )

      // Delete expired session
      await supabase.from("user_sessions").delete().eq("id", sessionData.id)

      return NextResponse.json({ error: "Refresh token expired" }, { status: 401 })
    }

    // Refresh the session
    const {
      data: { session: newSession },
      error: refreshError,
    } = await supabase.auth.refreshSession()

    if (refreshError || !newSession) {
      await logAuthEvent(
        "session_refresh_failed",
        user.id,
        {
          reason: "refresh_failed",
          error: refreshError?.message,
        },
        false,
        "Failed to refresh session",
        req
      )

      return NextResponse.json({ error: "Failed to refresh session" }, { status: 500 })
    }

    // Generate new refresh token
    const newRefreshToken = nanoid(64)

    // Update session in database
    await supabase
      .from("user_sessions")
      .update({
        refresh_token: newRefreshToken,
        expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
        last_activity_at: new Date().toISOString(),
        ip_address: getClientIP(req),
        user_agent: req.headers.get("user-agent"),
      })
      .eq("id", sessionData.id)

    // Log successful refresh
    await logAuthEvent(
      "session_refreshed",
      user.id,
      {
        session_id: sessionData.id,
        device_fingerprint: generateDeviceFingerprint(req),
      },
      true,
      undefined,
      req
    )

    // Prepare response
    const response = NextResponse.json({
      access_token: newSession.access_token,
      token_type: "bearer",
      expires_in: newSession.expires_in,
      refresh_token: newRefreshToken,
      user: newSession.user,
    })

    // Set secure cookies
    response.cookies.set("access-token", newSession.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: newSession.expires_in,
    })

    response.cookies.set("refresh-token", newRefreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60, // 30 days
    })

    return response
  } catch (error) {
    console.error("Session refresh error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export const POST = (req: NextRequest) => withSecurity(req, handler)
