import { NextRequest, NextResponse } from "next/server"
import { createAuthClient, logAuthEvent, getCurrentUser } from "@/lib/auth/utils"
import { withSecureAPI } from "@/lib/auth/middleware"

async function handler(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    const supabase = await createAuthClient()

    // Sign out from Supabase
    const { error } = await supabase.auth.signOut()

    if (error) {
      console.error("Signout error:", error)
    }

    // Clear session from database
    if (user) {
      const refreshToken = req.cookies.get("refresh_token")?.value

      if (refreshToken) {
        await supabase.from("user_sessions").delete().eq("refresh_token", refreshToken)
      }

      // Log signout event
      await logAuthEvent("sign_out", user.id, {}, true, undefined, req)
    }

    const response = NextResponse.json({
      message: "Signed out successfully",
    })

    // Clear cookies
    response.cookies.delete("refresh_token")
    response.cookies.delete("auth-token")

    return response
  } catch (error) {
    console.error("Signout error:", error)
    return NextResponse.json({ error: "Failed to sign out" }, { status: 500 })
  }
}

export const POST = withSecureAPI(handler)
