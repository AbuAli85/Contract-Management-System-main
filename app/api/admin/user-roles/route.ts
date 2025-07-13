import { type NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabaseServer"

// Helper to check admin using users table
async function requireAdmin(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient()
    if (!supabase) {
      return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
    }

    const {
      data: { session },
    } = await supabase.auth.getSession()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin role in users table
    const { data: user, error } = await supabase.from("users").select("role").eq("id", session.user.id).single()

    if (error || user?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 })
    }

    return { user: session.user, supabase }
  } catch (error) {
    console.error("Admin check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST: Assign a role to a user
export async function POST(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin(request)
    if (adminCheck instanceof NextResponse) return adminCheck

    const { user, supabase } = adminCheck
    const { user_id, role_id } = await request.json()

    if (!user_id || !role_id) {
      return NextResponse.json({ error: "Missing user_id or role_id" }, { status: 400 })
    }

    const { data, error } = await supabase.from("user_roles").insert([{ user_id, role_id }]).select().single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Create notification
    try {
      await supabase.from("notifications").insert([
        {
          type: "role_assigned",
          message: `Role assigned (role_id: ${role_id}) to user_id: ${user_id}`,
          user_id,
          created_at: new Date().toISOString(),
          is_read: false,
        },
      ])
    } catch (notificationError) {
      console.warn("Failed to create notification:", notificationError)
    }

    return NextResponse.json({ user_role: data })
  } catch (error) {
    console.error("POST user-roles error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE: Remove a role from a user
export async function DELETE(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin(request)
    if (adminCheck instanceof NextResponse) return adminCheck

    const { user, supabase } = adminCheck
    const { user_id, role_id } = await request.json()

    if (!user_id || !role_id) {
      return NextResponse.json({ error: "Missing user_id or role_id" }, { status: 400 })
    }

    const { error } = await supabase.from("user_roles").delete().eq("user_id", user_id).eq("role_id", role_id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    // Create notification
    try {
      await supabase.from("notifications").insert([
        {
          type: "role_removed",
          message: `Role removed (role_id: ${role_id}) from user_id: ${user_id}`,
          user_id,
          created_at: new Date().toISOString(),
          is_read: false,
        },
      ])
    } catch (notificationError) {
      console.warn("Failed to create notification:", notificationError)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE user-roles error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// GET: List all user_roles
export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin(request)
    if (adminCheck instanceof NextResponse) return adminCheck

    const { user, supabase } = adminCheck
    const { data, error } = await supabase.from("user_roles").select("user_id, role_id")

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ user_roles: data })
  } catch (error) {
    console.error("GET user-roles error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
