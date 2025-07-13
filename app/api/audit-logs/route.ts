import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Mock audit logs data
const mockAuditLogs = [
  {
    id: "1",
    user_id: "1",
    action: "CREATE",
    resource_type: "contract",
    resource_id: "1",
    details: { title: "New Contract Created" },
    ip_address: "192.168.1.1",
    user_agent: "Mozilla/5.0...",
    created_at: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
  },
  {
    id: "2",
    user_id: "2",
    action: "UPDATE",
    resource_type: "promoter",
    resource_id: "2",
    details: { field: "status", old_value: "pending", new_value: "active" },
    ip_address: "192.168.1.2",
    user_agent: "Mozilla/5.0...",
    created_at: new Date(Date.now() - 43200000).toISOString(), // 12 hours ago
  },
  {
    id: "3",
    user_id: "1",
    action: "DELETE",
    resource_type: "party",
    resource_id: "3",
    details: { reason: "Duplicate entry" },
    ip_address: "192.168.1.1",
    user_agent: "Mozilla/5.0...",
    created_at: new Date(Date.now() - 21600000).toISOString(), // 6 hours ago
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
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const action = searchParams.get("action")
    const resourceType = searchParams.get("resource_type")
    const userId = searchParams.get("user_id")

    const supabase = createSupabaseClient()

    if (!supabase) {
      // Filter mock data based on query parameters
      let filteredLogs = [...mockAuditLogs]

      if (action) {
        filteredLogs = filteredLogs.filter((log) => log.action === action)
      }
      if (resourceType) {
        filteredLogs = filteredLogs.filter((log) => log.resource_type === resourceType)
      }
      if (userId) {
        filteredLogs = filteredLogs.filter((log) => log.user_id === userId)
      }

      // Paginate mock data
      const startIndex = (page - 1) * limit
      const endIndex = startIndex + limit
      const paginatedLogs = filteredLogs.slice(startIndex, endIndex)

      return NextResponse.json({
        logs: paginatedLogs,
        pagination: {
          page,
          limit,
          total: filteredLogs.length,
          totalPages: Math.ceil(filteredLogs.length / limit),
        },
        message: "Using mock data - Supabase not configured",
      })
    }

    // Build query
    let query = supabase.from("audit_logs").select("*", { count: "exact" }).order("created_at", { ascending: false })

    // Apply filters
    if (action) {
      query = query.eq("action", action)
    }
    if (resourceType) {
      query = query.eq("resource_type", resourceType)
    }
    if (userId) {
      query = query.eq("user_id", userId)
    }

    // Apply pagination
    const startIndex = (page - 1) * limit
    query = query.range(startIndex, startIndex + limit - 1)

    const { data: logs, error, count } = await query

    if (error) {
      console.error("Supabase error:", error)
      return NextResponse.json({
        logs: mockAuditLogs.slice(0, limit),
        pagination: {
          page,
          limit,
          total: mockAuditLogs.length,
          totalPages: Math.ceil(mockAuditLogs.length / limit),
        },
        message: "Using mock data - Database error",
      })
    }

    return NextResponse.json({
      logs: logs || [],
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
    })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({
      logs: mockAuditLogs,
      message: "Using mock data - API error",
    })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { user_id, action, resource_type, resource_id, details, ip_address, user_agent } = body

    // Validate required fields
    if (!user_id || !action || !resource_type) {
      return NextResponse.json({ error: "Missing required fields: user_id, action, resource_type" }, { status: 400 })
    }

    const supabase = createSupabaseClient()

    if (!supabase) {
      const newLog = {
        id: Date.now().toString(),
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        ip_address,
        user_agent,
        created_at: new Date().toISOString(),
      }
      return NextResponse.json({
        log: newLog,
        message: "Mock audit log created - Supabase not configured",
      })
    }

    const { data: log, error } = await supabase
      .from("audit_logs")
      .insert([
        {
          user_id,
          action,
          resource_type,
          resource_id,
          details,
          ip_address,
          user_agent,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Supabase error:", error)
      const newLog = {
        id: Date.now().toString(),
        user_id,
        action,
        resource_type,
        resource_id,
        details,
        ip_address,
        user_agent,
        created_at: new Date().toISOString(),
      }
      return NextResponse.json({
        log: newLog,
        message: "Mock audit log created - Database error",
      })
    }

    return NextResponse.json({ log })
  } catch (error) {
    console.error("API error:", error)
    return NextResponse.json({ error: "Failed to create audit log" }, { status: 500 })
  }
}
