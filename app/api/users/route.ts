import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Mock data for when Supabase is not available
const mockUsers = [
  {
    id: "1",
    email: "admin@example.com",
    full_name: "Admin User",
    role: "admin",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    email: "user@example.com",
    full_name: "Regular User",
    role: "user",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

function createSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return null
  }

  try {
    return createClient(supabaseUrl, supabaseKey)
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    return null
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseClient()

    if (!supabase) {
      return NextResponse.json({
        users: mockUsers,
        message: "Using mock data - Supabase not configured",
      })
    }

    const { data: users, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({
        users: mockUsers,
        message: "Using mock data - Database error",
      })
    }

    return NextResponse.json({ users: users || [] })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({
      users: mockUsers,
      message: "Using mock data - API error",
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = createSupabaseClient()

    if (!supabase) {
      const newUser = {
        id: Date.now().toString(),
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      return NextResponse.json({
        user: newUser,
        message: "Mock user created - Supabase not configured",
      })
    }

    const { data: user, error } = await supabase.from("profiles").insert([body]).select().single()

    if (error) {
      console.error("Supabase error:", error)
      const newUser = {
        id: Date.now().toString(),
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
      return NextResponse.json({
        user: newUser,
        message: "Mock user created - Database error",
      })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Failed to create user" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    const supabase = createSupabaseClient()

    if (!supabase) {
      return NextResponse.json({
        user: { id, ...updateData, updated_at: new Date().toISOString() },
        message: "Mock user updated - Supabase not configured",
      })
    }

    const { data: user, error } = await supabase
      .from("profiles")
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({
        user: { id, ...updateData, updated_at: new Date().toISOString() },
        message: "Mock user updated - Database error",
      })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = createSupabaseClient()

    if (!supabase) {
      return NextResponse.json({
        message: "Mock user deleted - Supabase not configured",
      })
    }

    const { error } = await supabase.from("profiles").delete().eq("id", id)

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({
        message: "Mock user deleted - Database error",
      })
    }

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 })
  }
}
