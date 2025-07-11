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

// GET: List all permissions
export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck instanceof NextResponse) return adminCheck

  try {
    const { supabase } = adminCheck

    // Predefined permissions for the system
    const predefinedPermissions = [
      {
        id: "read",
        name: "Read",
        description: "View and read data",
        category: "basic",
        created_at: new Date().toISOString(),
      },
      {
        id: "write",
        name: "Write",
        description: "Create and edit data",
        category: "basic",
        created_at: new Date().toISOString(),
      },
      {
        id: "delete",
        name: "Delete",
        description: "Delete data",
        category: "basic",
        created_at: new Date().toISOString(),
      },
      {
        id: "admin",
        name: "Admin",
        description: "Full administrative access",
        category: "admin",
        created_at: new Date().toISOString(),
      },
      {
        id: "manage",
        name: "Manage",
        description: "Manage users and settings",
        category: "management",
        created_at: new Date().toISOString(),
      },
      {
        id: "contracts_read",
        name: "Contracts Read",
        description: "View contracts",
        category: "contracts",
        created_at: new Date().toISOString(),
      },
      {
        id: "contracts_write",
        name: "Contracts Write",
        description: "Create and edit contracts",
        category: "contracts",
        created_at: new Date().toISOString(),
      },
      {
        id: "contracts_delete",
        name: "Contracts Delete",
        description: "Delete contracts",
        category: "contracts",
        created_at: new Date().toISOString(),
      },
      {
        id: "promoters_read",
        name: "Promoters Read",
        description: "View promoters",
        category: "promoters",
        created_at: new Date().toISOString(),
      },
      {
        id: "promoters_write",
        name: "Promoters Write",
        description: "Create and edit promoters",
        category: "promoters",
        created_at: new Date().toISOString(),
      },
      {
        id: "promoters_delete",
        name: "Promoters Delete",
        description: "Delete promoters",
        category: "promoters",
        created_at: new Date().toISOString(),
      },
      {
        id: "parties_read",
        name: "Parties Read",
        description: "View parties",
        category: "parties",
        created_at: new Date().toISOString(),
      },
      {
        id: "parties_write",
        name: "Parties Write",
        description: "Create and edit parties",
        category: "parties",
        created_at: new Date().toISOString(),
      },
      {
        id: "parties_delete",
        name: "Parties Delete",
        description: "Delete parties",
        category: "parties",
        created_at: new Date().toISOString(),
      },
      {
        id: "analytics_read",
        name: "Analytics Read",
        description: "View analytics and reports",
        category: "analytics",
        created_at: new Date().toISOString(),
      },
      {
        id: "settings_read",
        name: "Settings Read",
        description: "View system settings",
        category: "settings",
        created_at: new Date().toISOString(),
      },
      {
        id: "settings_write",
        name: "Settings Write",
        description: "Modify system settings",
        category: "settings",
        created_at: new Date().toISOString(),
      },
    ]

    // Try to get permissions from database, fallback to predefined permissions
    const { data: dbPermissions, error } = await supabase.from("permissions").select("*")

    if (error) {
      // If permissions table doesn't exist, return predefined permissions
      console.warn("Permissions table not found, using predefined permissions:", error.message)
      return NextResponse.json({ permissions: predefinedPermissions })
    }

    // If we have permissions in database, return those, otherwise return predefined
    const permissions =
      dbPermissions && dbPermissions.length > 0 ? dbPermissions : predefinedPermissions

    return NextResponse.json({ permissions })
  } catch (error) {
    console.error("Error fetching permissions:", error)
    return NextResponse.json({ error: "Failed to fetch permissions" }, { status: 500 })
  }
}

// POST: Create a new permission
export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck instanceof NextResponse) return adminCheck

  try {
    const { supabase } = adminCheck
    const body = await request.json()
    const { name, description, category = "custom" } = body

    if (!name) {
      return NextResponse.json({ error: "Permission name is required" }, { status: 400 })
    }

    // Try to insert into permissions table
    const { data, error } = await supabase
      .from("permissions")
      .insert([
        {
          name,
          description: description || "",
          category,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating permission:", error)
      return NextResponse.json(
        { error: "Failed to create permission: " + error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ permission: data }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/admin/permissions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT: Update a permission
export async function PUT(request: NextRequest) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck instanceof NextResponse) return adminCheck

  try {
    const { supabase } = adminCheck
    const body = await request.json()
    const { id, name, description, category } = body

    if (!id) {
      return NextResponse.json({ error: "Permission ID is required" }, { status: 400 })
    }

    const updateData: any = { updated_at: new Date().toISOString() }
    if (name) updateData.name = name
    if (description !== undefined) updateData.description = description
    if (category) updateData.category = category

    const { data, error } = await supabase
      .from("permissions")
      .update(updateData)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating permission:", error)
      return NextResponse.json(
        { error: "Failed to update permission: " + error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ permission: data })
  } catch (error) {
    console.error("Error in PUT /api/admin/permissions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE: Delete a permission
export async function DELETE(request: NextRequest) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck instanceof NextResponse) return adminCheck

  try {
    const { supabase } = adminCheck
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Permission ID is required" }, { status: 400 })
    }

    // Prevent deletion of core permissions
    const corePermissions = ["read", "write", "delete", "admin", "manage"]
    if (corePermissions.includes(id)) {
      return NextResponse.json({ error: "Cannot delete core system permissions" }, { status: 400 })
    }

    const { error } = await supabase.from("permissions").delete().eq("id", id)

    if (error) {
      console.error("Error deleting permission:", error)
      return NextResponse.json(
        { error: "Failed to delete permission: " + error.message },
        { status: 400 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error in DELETE /api/admin/permissions:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
