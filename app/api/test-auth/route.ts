import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabaseServer"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient()

    // Get the current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError) {
      return NextResponse.json(
        {
          error: "Session error",
          details: sessionError.message,
        },
        { status: 401 }
      )
    }

    if (!session?.user) {
      return NextResponse.json(
        {
          error: "No active session",
          authenticated: false,
        },
        { status: 401 }
      )
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single()

    return NextResponse.json({
      authenticated: true,
      user: {
        id: session.user.id,
        email: session.user.email,
        role: profile?.role || "user",
      },
      profile: profile || null,
      profileError: profileError?.message || null,
    })
  } catch (error) {
    console.error("Test auth error:", error)
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    )
  }
}
