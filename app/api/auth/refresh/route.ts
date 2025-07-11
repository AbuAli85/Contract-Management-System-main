import { NextRequest, NextResponse } from "next/server"
import { createAuthClient, logAuthEvent, cleanExpiredSessions } from "@/lib/auth/utils"
import { withSecureAPI } from "@/lib/auth/middleware"

async function handler(req: NextRequest) {
  try {
    const refreshToken = req.cookies.get("refresh_token")?.value

    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token provided" }, { status: 401 })
    }

    const supabase = await createAuthClient()

    // Verify refresh token
    const { data: session } = await supabase
      .from("user_sessions")
      .select("user_id, expires_at")
      .eq("refresh_token", refreshToken)
      .single()

    if (!session) {
      return NextResponse.json({ error: "Invalid refresh token" }, { status: 401 })
    }

    // Check if expired
    if (new Date(session.expires_at) < new Date()) {
      await supabase.from("user_sessions").delete().eq("refresh_token", refreshToken)

      return NextResponse.json({ error: "Refresh token expired" }, { status: 401 })
    }

    // Get new access token
    const { data: authData, error } = await supabase.auth.refreshSession()

    if (error || !authData.session) {
      await logAuthEvent("session_refresh", session.user_id, {}, false, error?.message, req)
      return NextResponse.json({ error: "Failed to refresh session" }, { status: 401 })
    }

    // Update last activity
    await supabase
      .from("user_sessions")
      .update({ last_activity_at: new Date().toISOString() })
      .eq("refresh_token", refreshToken)

    // Clean expired sessions for this user
    await cleanExpiredSessions(session.user_id)

    await logAuthEvent("session_refresh", session.user_id, {}, true, undefined, req)

    return NextResponse.json({
      session: authData.session,
      user: authData.user,
    })
  } catch (error) {
    console.error("Token refresh error:", error)
    return NextResponse.json({ error: "Failed to refresh token" }, { status: 500 })
  }
}

export const POST = withSecureAPI(handler)
