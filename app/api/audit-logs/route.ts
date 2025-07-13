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

// Mock audit log data for when database is not configured
const mockAuditLogs = [
  {
    id: "1",
    user_id: "user-1",
    action: "CREATE",
    resource_type: "contract",
    resource_id: "contract-1",
    details: { name: "New Contract Created" },
    ip_address: "192.168.1.1",
    user_agent: "Mozilla/5.0...",
    created_at: new Date().toISOString(),
    user: {
      name: "John Doe",
      email: "john@example.com",
    },
  },
  {
    id: "2",
    user_id: "user-2",
    action: "UPDATE",
    resource_type: "promoter",
    resource_id: "promoter-1",
    details: { field: "status", old_value: "inactive", new_value: "active" },
    ip_address: "192.168.1.2",
    user_agent: "Mozilla/5.0...",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    user: {
      name: "Jane Smith",
      email: "jane@example.com",
    },
  },
  {
    id: "3",
    user_id: "user-1",
    action: "DELETE",
    resource_type: "party",
    resource_id: "party-1",
    details: { name: "Old Party Deleted" },
    ip_address: "192.168.1.1",
    user_agent: "Mozilla/5.0...",
    created_at: new Date(Date.now() - 7200000).toISOString(),
    user: {
      name: "John Doe",
      email: "john@example.com",
    },
  },
]

// GET - Fetch audit logs
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const action = searchParams.get("action")
    const resource_type = searchParams.get("resource_type")
    const user_id = searchParams.get("user_id")
    const start_date = searchParams.get("start_date")
    const end_date = searchParams.get("end_date")

    if (!isEnvConfigured()) {
      // Return mock data when database is not configured
      let filteredLogs = [...mockAuditLogs]

      // Apply filters to mock data
      if (action) {
        filteredLogs = filteredLogs.filter((log) => log.action === action)
      }
      if (resource_type) {
        filteredLogs = filteredLogs.filter((log) => log.resource_type === resource_type)
      }
      if (user_id) {
        filteredLogs = filteredLogs.filter((log) => log.user_id === user_id)
      }
      if (start_date) {
        filteredLogs = filteredLogs.filter((log) => new Date(log.created_at) >= new Date(start_date))
      }
      if (end_date) {
        filteredLogs = filteredLogs.filter((log) => new Date(log.created_at) <= new Date(end_date))
      }

      // Apply pagination
      const offset = (page - 1) * limit
      const paginatedLogs = filteredLogs.slice(offset, offset + limit)

      return NextResponse.json({
        logs: paginatedLogs,
        total: filteredLogs.length,
        page,
        limit,
        total_pages: Math.ceil(filteredLogs.length / limit),
      })
    }

    const supabase = createSupabaseClient()

    // Build query
    let query = supabase
      .from("audit_logs")
      .select(`
        *,
        user:profiles(name, email)
      `)
      .order("created_at", { ascending: false })

    // Apply filters
    if (action) {
      query = query.eq("action", action)
    }
    if (resource_type) {
      query = query.eq("resource_type", resource_type)
    }
    if (user_id) {
      query = query.eq("user_id", user_id)
    }
    if (start_date) {
      query = query.gte("created_at", start_date)
    }
    if (end_date) {
      query = query.lte("created_at", end_date)
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.range(offset, offset + limit - 1)

    const { data: logs, error, count } = await query

    if (error) {
      console.error("Error fetching audit logs:", error)
      return NextResponse.json({ error: "Failed to fetch audit logs" }, { status: 500 })
    }

    return NextResponse.json({
      logs: logs || [],
      total: count || 0,
      page,
      limit,
      total_pages: Math.ceil((count || 0) / limit),
    })
  } catch (error) {
    console.error("Error in GET /api/audit-logs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// POST - Create audit log entry
export async function POST(request: NextRequest) {
  try {
    if (!isEnvConfigured()) {
      return NextResponse.json(
        {
          error: "Database not configured",
          message: "This is a demo environment. Audit log creation is not available.",
        },
        { status: 503 },
      )
    }

    const body = await request.json()
    const { user_id, action, resource_type, resource_id, details, ip_address, user_agent } = body

    if (!user_id || !action || !resource_type) {
      return NextResponse.json({ error: "user_id, action, and resource_type are required" }, { status: 400 })
    }

    const supabase = createSupabaseClient()
    const { data: auditLog, error } = await supabase
      .from("audit_logs")
      .insert([
        {
          user_id,
          action,
          resource_type,
          resource_id,
          details: details || {},
          ip_address,
          user_agent,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating audit log:", error)
      return NextResponse.json({ error: "Failed to create audit log" }, { status: 500 })
    }

    return NextResponse.json({ audit_log: auditLog }, { status: 201 })
  } catch (error) {
    console.error("Error in POST /api/audit-logs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// DELETE - Delete audit logs (admin only)
export async function DELETE(request: NextRequest) {
  try {
    if (!isEnvConfigured()) {
      return NextResponse.json(
        {
          error: "Database not configured",
          message: "This is a demo environment. Audit log deletion is not available.",
        },
        { status: 503 },
      )
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")
    const older_than = searchParams.get("older_than") // ISO date string

    if (!id && !older_than) {
      return NextResponse.json({ error: "Either id or older_than parameter is required" }, { status: 400 })
    }

    const supabase = createSupabaseClient()

    let query = supabase.from("audit_logs").delete()

    if (id) {
      query = query.eq("id", id)
    } else if (older_than) {
      query = query.lt("created_at", older_than)
    }

    const { error, count } = await query

    if (error) {
      console.error("Error deleting audit logs:", error)
      return NextResponse.json({ error: "Failed to delete audit logs" }, { status: 500 })
    }

    return NextResponse.json({
      message: `Successfully deleted ${count || 0} audit log(s)`,
      deleted_count: count || 0,
    })
  } catch (error) {
    console.error("Error in DELETE /api/audit-logs:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
