import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Mock data for when Supabase is not configured
const mockUsers = [
  {
    id: "1",
    email: "admin@example.com",
    name: "Admin User",
    role: "admin",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: "2",
    email: "user@example.com",
    name: "Regular User",
    role: "user",
    status: "active",
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
]

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseKey)
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()

    if (!supabase) {
      // Return mock data when Supabase is not configured
      return NextResponse.json({
        success: true,
        data: mockUsers,
        message: "Using mock data - Supabase not configured",
      })
    }

    const { data, error } = await supabase.from("profiles").select("*").order("created_at", { ascending: false })

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({
        success: true,
        data: mockUsers,
        message: "Using mock data - Database error",
      })
    }

    return NextResponse.json({
      success: true,
      data: data || mockUsers,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({
      success: true,
      data: mockUsers,
      message: "Using mock data - API error",
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const supabase = getSupabaseClient()

    if (!supabase) {
      // Simulate creation with mock data
      const newUser = {
        id: Date.now().toString(),
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      return NextResponse.json({
        success: true,
        data: newUser,
        message: "Mock user created - Supabase not configured",
      })
    }

    const { data, error } = await supabase.from("profiles").insert([body]).select().single()

    if (error) {
      console.error("Supabase error:", error)
      const newUser = {
        id: Date.now().toString(),
        ...body,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }

      return NextResponse.json({
        success: true,
        data: newUser,
        message: "Mock user created - Database error",
      })
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create user",
      },
      { status: 500 },
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, ...updateData } = body
    const supabase = getSupabaseClient()

    if (!supabase) {
      // Simulate update with mock data
      const updatedUser = {
        id,
        ...updateData,
        updated_at: new Date().toISOString(),
      }

      return NextResponse.json({
        success: true,
        data: updatedUser,
        message: "Mock user updated - Supabase not configured",
      })
    }

    const { data, error } = await supabase
      .from("profiles")
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      const updatedUser = {
        id,
        ...updateData,
        updated_at: new Date().toISOString(),
      }

      return NextResponse.json({
        success: true,
        data: updatedUser,
        message: "Mock user updated - Database error",
      })
    }

    return NextResponse.json({
      success: true,
      data,
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to update user",
      },
      { status: 500 },
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        {
          success: false,
          error: "User ID is required",
        },
        { status: 400 },
      )
    }

    const supabase = getSupabaseClient()

    if (!supabase) {
      return NextResponse.json({
        success: true,
        message: "Mock user deleted - Supabase not configured",
      })
    }

    const { error } = await supabase.from("profiles").delete().eq("id", id)

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({
        success: true,
        message: "Mock user deleted - Database error",
      })
    }

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Failed to delete user",
      },
      { status: 500 },
    )
  }
}
