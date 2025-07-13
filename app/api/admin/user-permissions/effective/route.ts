import { type NextRequest, NextResponse } from "next/server"
import { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "@/lib/env"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  // Check if we have required environment variables
  if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get user's effective permissions (direct + role-based)
    const { data, error } = await supabase.rpc("get_user_effective_permissions", {
      user_id: userId,
    })

    if (error) {
      console.error("Error fetching effective permissions:", error)
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ permissions: data || [] })
  } catch (error) {
    console.error("GET effective permissions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
