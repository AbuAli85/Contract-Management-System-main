import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "@/lib/env"

// Helper function to create Supabase client with error handling
function createSupabaseClient() {
  if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error("Missing Supabase configuration")
  }
  return createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
}

// POST: Assign a permission to a user
export async function POST(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()
    const { user_id, permission_id } = await request.json()

    const { data, error } = await supabase
      .from("user_permissions")
      .insert([{ user_id, permission_id }])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Create notification
    await supabase.from("notifications").insert([
      {
        type: "permission_assigned",
        message: `Permission assigned (permission_id: ${permission_id}) to user_id: ${user_id}`,
        user_id,
        created_at: new Date().toISOString(),
        is_read: false,
      },
    ])

    return NextResponse.json({ user_permission: data })
  } catch (error) {
    console.error("POST user-permissions error:", error)
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }
}

// DELETE: Remove a permission from a user
export async function DELETE(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()
    const { user_id, permission_id } = await request.json()

    const { error } = await supabase
      .from("user_permissions")
      .delete()
      .eq("user_id", user_id)
      .eq("permission_id", permission_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    // Create notification
    await supabase.from("notifications").insert([
      {
        type: "permission_removed",
        message: `Permission removed (permission_id: ${permission_id}) from user_id: ${user_id}`,
        user_id,
        created_at: new Date().toISOString(),
        is_read: false,
      },
    ])

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE user-permissions error:", error)
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }
}

// GET: List all user_permissions
export async function GET() {
  try {
    const supabase = createSupabaseClient()
    const { data, error } = await supabase.from("user_permissions").select("user_id, permission_id")

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ user_permissions: data })
  } catch (error) {
    console.error("GET user-permissions error:", error)
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }
}
