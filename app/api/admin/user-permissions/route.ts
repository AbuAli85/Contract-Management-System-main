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
          userPermissions: [],
        },
        { status: 200 },
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    // Create Supabase client
    const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    let query = supabase.from("user_permissions").select(`
        *,
        permissions (
          id,
          name,
          description
        )
      `)

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching user permissions:", error)
      return NextResponse.json(
        {
          error: error.message,
          userPermissions: [],
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ userPermissions: data || [] })
  } catch (err: any) {
    console.error("User permissions API error:", err)
    return NextResponse.json(
      {
        error: err.message || "Internal server error",
        userPermissions: [],
      },
      { status: 500 },
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check if environment is configured
    if (!isEnvConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
    }

    const body = await request.json()
    const { user_id, permission_id } = body

    if (!user_id || !permission_id) {
      return NextResponse.json({ error: "User ID and Permission ID are required" }, { status: 400 })
    }

    // Create Supabase client
    const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Check if the user permission already exists
    const { data: existing } = await supabase
      .from("user_permissions")
      .select("id")
      .eq("user_id", user_id)
      .eq("permission_id", permission_id)
      .single()

    if (existing) {
      return NextResponse.json({ error: "User already has this permission" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("user_permissions")
      .insert({
        user_id,
        permission_id,
        created_at: new Date().toISOString(),
      })
      .select(`
        *,
        permissions (
          id,
          name,
          description
        )
      `)
      .single()

    if (error) {
      console.error("Error creating user permission:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, userPermission: data })
  } catch (err: any) {
    console.error("User permissions POST error:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Check if environment is configured
    if (!isEnvConfigured()) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const userId = searchParams.get("userId")
    const permissionId = searchParams.get("permissionId")

    // Create Supabase client
    const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    let query = supabase.from("user_permissions").delete()

    if (id) {
      query = query.eq("id", id)
    } else if (userId && permissionId) {
      query = query.eq("user_id", userId).eq("permission_id", permissionId)
    } else {
      return NextResponse.json({ error: "Either ID or both User ID and Permission ID are required" }, { status: 400 })
    }

    const { error } = await query

    if (error) {
      console.error("Error deleting user permission:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("User permissions DELETE error:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
