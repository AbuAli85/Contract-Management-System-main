import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, isEnvConfigured } from "@/lib/env"

export async function GET(request: NextRequest) {
  try {
    // Check if environment is configured
    if (!isEnvConfigured()) {
      return NextResponse.json(
        {
          error: "Supabase not configured",
          permissions: [],
        },
        { status: 200 },
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Create Supabase client
    const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Get direct user permissions
    const { data: directPermissions, error: directError } = await supabase
      .from("user_permissions")
      .select(`
        permissions (
          id,
          name,
          description
        )
      `)
      .eq("user_id", userId)

    if (directError) {
      console.error("Error fetching direct permissions:", directError)
      return NextResponse.json({ error: directError.message }, { status: 500 })
    }

    // Get role-based permissions
    const { data: rolePermissions, error: roleError } = await supabase
      .from("user_roles")
      .select(`
        roles (
          role_permissions (
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
      console.error("Error fetching role permissions:", roleError)
      return NextResponse.json({ error: roleError.message }, { status: 500 })
    }

    // Combine and deduplicate permissions
    const allPermissions = new Map()

    // Add direct permissions
    directPermissions?.forEach((item: any) => {
      if (item.permissions) {
        allPermissions.set(item.permissions.id, {
          ...item.permissions,
          source: "direct",
        })
      }
    })

    // Add role-based permissions
    rolePermissions?.forEach((userRole: any) => {
      userRole.roles?.role_permissions?.forEach((rolePermission: any) => {
        if (rolePermission.permissions) {
          const existing = allPermissions.get(rolePermission.permissions.id)
          allPermissions.set(rolePermission.permissions.id, {
            ...rolePermission.permissions,
            source: existing ? "both" : "role",
          })
        }
      })
    })

    const permissions = Array.from(allPermissions.values())

    return NextResponse.json({ permissions })
  } catch (err: any) {
    console.error("Effective permissions API error:", err)
    return NextResponse.json(
      {
        error: err.message || "Internal server error",
        permissions: [],
      },
      { status: 500 },
    )
  }
}
