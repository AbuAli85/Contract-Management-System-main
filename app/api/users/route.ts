import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } from "@/lib/env"

// Helper function to check if environment is configured
function isEnvConfigured(): boolean {
  return !!(NEXT_PUBLIC_SUPABASE_URL && NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

// Helper function to create Supabase client
function createSupabaseClient() {
  if (!isEnvConfigured()) {
    throw new Error("Supabase environment variables not configured")
  }
  return createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

// GET: List all users (from profiles table)
export async function GET() {
  try {
    if (!isEnvConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const supabase = createSupabaseClient()
    const { data, error } = await supabase.from("profiles").select("id, email")

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ users: data })
  } catch (error) {
    console.error("Unexpected error in GET /api/users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST: Create a new user
export async function POST(request: NextRequest) {
  try {
    if (!isEnvConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const body = await request.json()
    const { email, password, role = "user" } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const supabase = createSupabaseClient()

    // Create user in auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      console.error("Error creating user:", authError)
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // Create profile
    if (authData.user) {
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        email: authData.user.email,
        role,
      })

      if (profileError) {
        console.error("Error creating profile:", profileError)
        return NextResponse.json({ error: profileError.message }, { status: 500 })
      }
    }

    return NextResponse.json({ message: "User created successfully", user: authData.user }, { status: 201 })
  } catch (error) {
    console.error("Unexpected error in POST /api/users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT: Update user
export async function PUT(request: NextRequest) {
  try {
    if (!isEnvConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const body = await request.json()
    const { id, email, role } = body

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = createSupabaseClient()

    const updateData: any = {}
    if (email) updateData.email = email
    if (role) updateData.role = role

    const { data, error } = await supabase.from("profiles").update(updateData).eq("id", id).select()

    if (error) {
      console.error("Error updating user:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ message: "User updated successfully", user: data[0] })
  } catch (error) {
    console.error("Unexpected error in PUT /api/users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE: Delete user
export async function DELETE(request: NextRequest) {
  try {
    if (!isEnvConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = createSupabaseClient()

    // Delete from profiles table
    const { error: profileError } = await supabase.from("profiles").delete().eq("id", id)

    if (profileError) {
      console.error("Error deleting user profile:", profileError)
      return NextResponse.json({ error: profileError.message }, { status: 500 })
    }

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Unexpected error in DELETE /api/users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
