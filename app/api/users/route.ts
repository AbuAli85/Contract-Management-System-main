import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Helper function to check if environment is configured
function isEnvConfigured(): boolean {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return !!(
    supabaseUrl &&
    supabaseAnonKey &&
    supabaseUrl !== "https://placeholder.supabase.co" &&
    supabaseAnonKey !== "placeholder-key"
  )
}

// Helper function to create Supabase client safely
function createSupabaseClient() {
  if (!isEnvConfigured()) {
    throw new Error("Supabase environment not configured")
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

// GET - Fetch all users
export async function GET(request: NextRequest) {
  try {
    if (!isEnvConfigured()) {
      return NextResponse.json(
        {
          error: "Database not configured",
          users: [
            {
              id: "1",
              email: "admin@example.com",
              name: "Admin User",
              role: "admin",
              status: "active",
              created_at: new Date().toISOString(),
            },
            {
              id: "2",
              email: "user@example.com",
              name: "Regular User",
              role: "user",
              status: "active",
              created_at: new Date().toISOString(),
            },
          ],
        },
        { status: 200 },
      )
    }

    const supabase = createSupabaseClient()
    const { data: users, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching users:", error)
      return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 })
    }

    return NextResponse.json({ users: users || [] })
  } catch (error) {
    console.error("Error in GET /api/users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    if (!isEnvConfigured()) {
      return NextResponse.json(
        {
          error: "Database not configured",
          message: "This is a demo environment. User creation is not available.",
        },
        { status: 503 },
      )
    }

    const body = await request.json()
    const { email, name, role = "user", status = "active" } = body

    if (!email || !name) {
      return NextResponse.json({ error: "Email and name are required" }, { status: 400 })
    }

    const supabase = createSupabaseClient()

    // Create user in auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email,
      password: "temporary-password-123",
      email_confirm: true,
    })

    if (authError) {
      console.error("Error creating auth user:", authError)
      return NextResponse.json({ error: "Failed to create user authentication" }, { status: 500 })
    }

    // Create user profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .insert([
        {
          id: authUser.user.id,
          email,
          name,
          role,
          status,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (profileError) {
      console.error("Error creating user profile:", profileError)
      return NextResponse.json({ error: "Failed to create user profile" }, { status: 500 })
    }

    return NextResponse.json({ user: profile }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// PUT - Update user
export async function PUT(request: NextRequest) {
  try {
    if (!isEnvConfigured()) {
      return NextResponse.json(
        {
          error: "Database not configured",
          message: "This is a demo environment. User updates are not available.",
        },
        { status: 503 },
      )
    }

    const body = await request.json()
    const { id, name, role, status } = body

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = createSupabaseClient()
    const { data: user, error } = await supabase
      .from("profiles")
      .update({
        name,
        role,
        status,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating user:", error)
      return NextResponse.json({ error: "Failed to update user" }, { status: 500 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error in PUT /api/users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete user
export async function DELETE(request: NextRequest) {
  try {
    if (!isEnvConfigured()) {
      return NextResponse.json(
        {
          error: "Database not configured",
          message: "This is a demo environment. User deletion is not available.",
        },
        { status: 503 },
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const supabase = createSupabaseClient()

    // Delete user profile
    const { error: profileError } = await supabase.from("profiles").delete().eq("id", id)

    if (profileError) {
      console.error("Error deleting user profile:", profileError)
      return NextResponse.json({ error: "Failed to delete user profile" }, { status: 500 })
    }

    // Delete user from auth
    const { error: authError } = await supabase.auth.admin.deleteUser(id)

    if (authError) {
      console.error("Error deleting auth user:", authError)
      // Continue even if auth deletion fails
    }

    return NextResponse.json({ message: "User deleted successfully" })
  } catch (error) {
    console.error("Error in DELETE /api/users:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
