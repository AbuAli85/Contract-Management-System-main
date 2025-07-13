import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Handle missing environment variables gracefully
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.warn("Missing Supabase environment variables")
}

// GET: Get all effective permissions for a user (direct + via roles)
export async function GET(request: NextRequest) {
  try {
    // Return early if environment variables are missing
    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({ error: "Service configuration incomplete" }, { status: 503 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    // Direct permissions
    const { data: directPermissions, error: directError } = await supabase
      .from("user_permissions")
      .select("permission_id, permissions(name, description)")
      .eq("user_id", userId)

    // Role-based permissions
    const { data: rolePermissions, error: roleError } = await supabase
      .from("user_roles")
      .select(`
        role_id,
        roles!inner(
          name,
          role_permissions!inner(
            permission_id,
            permissions(name, description)
          )
        )
      `)
      .eq("user_id", userId)

    if (directError || roleError) {
      return NextResponse.json({ error: directError?.message || roleError?.message }, { status: 500 })
    }

    // Combine and deduplicate permissions
    const allPermissions = new Map()

    // Add direct permissions
    directPermissions?.forEach((perm: any) => {
      if (perm.permissions) {
        allPermissions.set(perm.permission_id, {
          id: perm.permission_id,
          name: perm.permissions.name,
          description: perm.permissions.description,
          source: "direct",
        })
      }
    })

    // Add role-based permissions
    rolePermissions?.forEach((userRole: any) => {
      userRole.roles?.role_permissions?.forEach((rolePerm: any) => {
        if (rolePerm.permissions && !allPermissions.has(rolePerm.permission_id)) {
          allPermissions.set(rolePerm.permission_id, {
            id: rolePerm.permission_id,
            name: rolePerm.permissions.name,
            description: rolePerm.permissions.description,
            source: "role",
            roleName: userRole.roles.name,
          })
        }
      })
    })

    return NextResponse.json({
      permissions: Array.from(allPermissions.values()),
    })
  } catch (error) {
    console.error("Error in effective permissions API:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
