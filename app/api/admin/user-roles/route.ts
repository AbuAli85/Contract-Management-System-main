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
          userRoles: [],
        },
        { status: 200 },
      )
    }

    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    // Create Supabase client
    const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    let query = supabase.from("user_roles").select(`
        *,
        roles (
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
      console.error("Error fetching user roles:", error)
      return NextResponse.json(
        {
          error: error.message,
          userRoles: [],
        },
        { status: 500 },
      )
    }

    return NextResponse.json({ userRoles: data || [] })
  } catch (err: any) {
    console.error("User roles API error:", err)
    return NextResponse.json(
      {
        error: err.message || "Internal server error",
        userRoles: [],
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
    const { user_id, role_id } = body

    if (!user_id || !role_id) {
      return NextResponse.json({ error: "User ID and Role ID are required" }, { status: 400 })
    }

    // Create Supabase client
    const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Check if the user role already exists
    const { data: existing } = await supabase
      .from("user_roles")
      .select("id")
      .eq("user_id", user_id)
      .eq("role_id", role_id)
      .single()

    if (existing) {
      return NextResponse.json({ error: "User already has this role" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("user_roles")
      .insert({
        user_id,
        role_id,
        created_at: new Date().toISOString(),
      })
      .select(`
        *,
        roles (
          id,
          name,
          description
        )
      `)
      .single()

    if (error) {
      console.error("Error creating user role:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, userRole: data })
  } catch (err: any) {
    console.error("User roles POST error:", err)
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
    const roleId = searchParams.get("roleId")

    // Create Supabase client
    const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    let query = supabase.from("user_roles").delete()

    if (id) {
      query = query.eq("id", id)
    } else if (userId && roleId) {
      query = query.eq("user_id", userId).eq("role_id", roleId)
    } else {
      return NextResponse.json({ error: "Either ID or both User ID and Role ID are required" }, { status: 400 })
    }

    const { error } = await query

    if (error) {
      console.error("Error deleting user role:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("User roles DELETE error:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
