import { NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET() {
  try {
    const supabase = await createClient()

    // Check if client exists
    if (!supabase) {
      return NextResponse.json(
        {
          error: "Supabase client is null",
          auth: false,
        },
        { status: 500 }
      )
    }

    // Check if auth exists
    if (!supabase.auth) {
      return NextResponse.json(
        {
          error: "Supabase auth is undefined",
          auth: false,
        },
        { status: 500 }
      )
    }

    // Try to get user
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser()

    return NextResponse.json({
      success: true,
      hasAuth: !!supabase.auth,
      hasUser: !!user,
      userEmail: user?.email || null,
      error: error?.message || null,
      env: {
        hasUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
        hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      },
    })
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : undefined,
      },
      { status: 500 }
    )
  }
}
