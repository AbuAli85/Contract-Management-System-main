import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Helper function to check if environment is configured
function isEnvConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

// Helper function to create Supabase client with error handling
function createSupabaseClient() {
  if (!isEnvConfigured()) {
    throw new Error("Supabase environment variables not configured")
  }

  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)
}

export async function GET(request: NextRequest) {
  try {
    if (!isEnvConfigured()) {
      return NextResponse.json(
        {
          logs: [],
          total: 0,
          message: "Database not configured - showing mock data",
        },
        { status: 200 },
      )
    }

    const supabase = createSupabaseClient()
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const action = searchParams.get("action")
    const userId = searchParams.get("user_id")

    let query = supabase.from("audit_logs").select("*", { count: "exact" })

    if (action) {
      query = query.eq("action", action)
    }

    if (userId) {
      query = query.eq("user_id", userId)
    }

    const { data, error, count } = await query
      .range((page - 1) * limit, page * limit - 1)
      .order("created_at", { ascending: false })

    if (error) {
      console.error("Error fetching audit logs:", error)
      return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 })
    }

    return NextResponse.json({
      logs: data || [],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error("Error in GET /api/audit-logs:", error)

    // Return mock data when there's an error
    const mockLogs = [
      {
        id: "1",
        user_id: "user-1",
        action: "CREATE_CONTRACT",
        resource_type: "contract",
        resource_id: "contract-1",
        details: { name: "Sample Contract" },
        ip_address: "127.0.0.1",
        user_agent: "Mozilla/5.0",
        created_at: new Date().toISOString(),
      },
    ]

    return NextResponse.json({
      logs: mockLogs,
      total: mockLogs.length,
      page: 1,
      limit: 50,
      totalPages: 1,
      message: "Showing mock data due to configuration issues",
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isEnvConfigured()) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const supabase = createSupabaseClient()
    const body = await request.json()

    const { data, error } = await supabase
      .from("audit_logs")
      .insert([
        {
          ...body,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating audit log:", error)
      return NextResponse.json({ error: "Failed to create audit log" }, { status: 500 })
    }

    return NextResponse.json({ log: data }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/audit-logs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
