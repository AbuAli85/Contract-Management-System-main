import { type NextRequest, NextResponse } from "next/server"
import { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "@/lib/env"
import { createClient } from "@supabase/supabase-js"

// Helper function to create Supabase client with error handling
function createSupabaseClient() {
  if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase configuration")
  }
  return createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = createSupabaseClient()

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
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }
}
