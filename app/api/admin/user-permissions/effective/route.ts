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

// GET: Get effective permissions for a user (direct + role-based)
export async function GET(request: NextRequest) {
  try {
    const adminCheck = await requireAdmin(request)
    if (adminCheck instanceof NextResponse) return adminCheck

    const { user, supabase } = adminCheck
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("user_id")

    if (!userId) {
      return NextResponse.json({ error: "Missing user_id parameter" }, { status: 400 })
    }

    // Get direct permissions
    const { data: directPermissions, error: directError } = await supabase
      .from("user_permissions")
      .select(`
        permission_id,
        permissions (
          id,
          name,
          description
        )
      `)
      .eq("user_id", userId)

    if (directError) {
      return NextResponse.json({ error: directError.message }, { status: 500 })
    }

    // Get role-based permissions
    const { data: rolePermissions, error: roleError } = await supabase
      .from("user_roles")
      .select(`
        role_id,
        roles (
          id,
          name,
          role_permissions (
            permission_id,
            permissions (
              id,
              name,
              description
            )
          )
        )
      `)
      .eq("user_id", userId)

    if (roleError) {
      return NextResponse.json({ error: roleError.message }, { status: 500 })
    }

    // Combine and deduplicate permissions
    const allPermissions = new Map()

    // Add direct permissions
    directPermissions?.forEach((up: any) => {
      if (up.permissions) {
        allPermissions.set(up.permissions.id, {
          id: up.permissions.id,
          name: up.permissions.name,
          description: up.permissions.description,
          source: "direct",
        })
      }
    })

    // Add role-based permissions
    rolePermissions?.forEach((ur: any) => {
      if (ur.roles?.role_permissions) {
        ur.roles.role_permissions.forEach((rp: any) => {
          if (rp.permissions && !allPermissions.has(rp.permissions.id)) {
            allPermissions.set(rp.permissions.id, {
              id: rp.permissions.id,
              name: rp.permissions.name,
              description: rp.permissions.description,
              source: `role:${ur.roles.name}`,
            })
          }
        })
      }
    })

    return NextResponse.json({
      user_id: userId,
      effective_permissions: Array.from(allPermissions.values()),
      direct_permissions: directPermissions?.map((up: any) => up.permissions).filter(Boolean) || [],
      role_permissions:
        rolePermissions?.map((ur: any) => ({
          role: ur.roles,
          permissions: ur.roles?.role_permissions?.map((rp: any) => rp.permissions).filter(Boolean) || [],
        })) || [],
    })
  } catch (error) {
    console.error("GET effective permissions error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
