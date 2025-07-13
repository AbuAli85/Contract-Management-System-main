import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "@/lib/env"
import { createServerComponentClient } from "@/lib/supabaseServer"

// Helper to check admin using users table
async function requireAdmin(request: NextRequest) {
  // Check if we have required environment variables
  if (!NEXT_PUBLIC_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: "Server configuration error" }, { status: 500 })
  }

  try {
    const supabase = await createServerComponentClient()
    if (!supabase) {
      return NextResponse.json({ error: "Database unavailable" }, { status: 503 })
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

    // Create service role client for admin operations
    const adminSupabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    return { user: session.user, supabase: adminSupabase }
  } catch (error) {
    console.error("Admin check error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST: Assign a permission to a role
export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck instanceof NextResponse) return adminCheck

  try {
    const { supabase } = adminCheck
    const { role_id, permission_id } = await request.json()

    const { data, error } = await supabase
      .from("role_permissions")
      .insert([{ role_id, permission_id }])
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ role_permission: data })
  } catch (error) {
    console.error("POST role-permissions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE: Remove a permission from a role
export async function DELETE(request: NextRequest) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck instanceof NextResponse) return adminCheck

  try {
    const { supabase } = adminCheck
    const { role_id, permission_id } = await request.json()

    const { error } = await supabase
      .from("role_permissions")
      .delete()
      .eq("role_id", role_id)
      .eq("permission_id", permission_id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("DELETE role-permissions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
