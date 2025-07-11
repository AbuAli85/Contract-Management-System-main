import { NextRequest, NextResponse } from "next/server"
import { createServerComponentClient } from "@/lib/supabaseServer"

// Helper to check admin authentication
async function requireAdmin(request: NextRequest) {
  try {
    const supabase = await createServerComponentClient()

    // Get the current session
    const {
      data: { session },
      error: sessionError,
    } = await supabase.auth.getSession()

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Check if user has admin role in profiles table
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", session.user.id)
      .single()

    if (profileError || profile?.role !== "admin") {
      return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 })
    }

    return { user: session.user, supabase }
  } catch (error) {
    console.error("Admin authentication error:", error)
    return NextResponse.json({ error: "Authentication failed" }, { status: 500 })
  }
}

// GET: List all roles
export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck instanceof NextResponse) return adminCheck

  try {
    const { supabase } = adminCheck

    // For now, return predefined roles since we might not have a roles table
    const predefinedRoles = [
      {
        id: "admin",
        name: "Administrator",
        description: "Full system access with all permissions",
        permissions: ["read", "write", "delete", "admin"],
        created_at: new Date().toISOString(),
      },
      {
        id: "manager",
        name: "Manager",
        description: "Management access with most permissions",
        permissions: ["read", "write", "manage"],
        created_at: new Date().toISOString(),
      },
      {
        id: "user",
        name: "User",
        description: "Standard user access with basic permissions",
        permissions: ["read", "write"],
        created_at: new Date().toISOString(),
      },
    ]

    // Try to get roles from database, fallback to predefined roles
    const { data: dbRoles, error } = await supabase.from("roles").select("*")

    if (error) {
      // If roles table doesn't exist, return predefined roles
      console.warn("Roles table not found, using predefined roles:", error.message)
      return NextResponse.json({ roles: predefinedRoles })
    }

    // If we have roles in database, return those, otherwise return predefined
    const roles = dbRoles && dbRoles.length > 0 ? dbRoles : predefinedRoles

    return NextResponse.json({ roles })
  } catch (error) {
    console.error("Error fetching roles:", error)
    return NextResponse.json({ error: "Failed to fetch roles" }, { status: 500 })
  }
}

// POST: Create a new role
export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck instanceof NextResponse) return adminCheck

  try {
    const { supabase } = adminCheck
    const body = await request.json()
    const { name, description, permissions = [] } = body

    if (!name) {
      return NextResponse.json({ error: "Role name is required" }, { status: 400 })
    }

    // Try to insert into roles table
    const { data, error } = await supabase
      .from("roles")
      .insert([
        {
          name,
          description: description || "",
          permissions,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating role:", error)
      return NextResponse.json(
        { error: "Failed to create role: " + error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ role: data }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/admin/roles:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT: Update a role
export async function PUT(request: NextRequest) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck instanceof NextResponse) return adminCheck

  try {
    const { supabase } = adminCheck
    const body = await request.json()
    const { id, name, description, permissions } = body

    if (!id) {
      return NextResponse.json({ error: "Role ID is required" }, { status: 400 })
    }

    const updateData: any = { updated_at: new Date().toISOString() }
    if (name) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (permissions) updateData.permissions = permissions

    const { data, error } = await supabase
      .from("roles")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating role:", error)
      return NextResponse.json(
        { error: "Failed to update role: " + error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ role: data })
  } catch (error) {
    console.error("Error in PUT /api/admin/roles:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE: Delete a role
export async function DELETE(request: NextRequest) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck instanceof NextResponse) return adminCheck

  try {
    const { supabase } = adminCheck
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Role ID is required" }, { status: 400 })
    }

    // Prevent deletion of core roles
    if (["admin", "manager", "user"].includes(id)) {
      return NextResponse.json({ error: "Cannot delete core system roles" }, { status: 400 })
    }

    const { error } = await supabase.from("roles").delete().eq("id", id)

    if (error) {
      console.error("Error deleting role:", error)
      return NextResponse.json(
        { error: "Failed to delete role: " + error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/admin/roles:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
