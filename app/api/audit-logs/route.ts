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
    details: { name: "New Contract Created" },
    ip_address: "192.168.1.1",
    user_agent: "Mozilla/5.0...",
    created_at: new Date().toISOString(),
    user: {
      email: "admin@example.com",
      name: "Admin User",
    },
  },
  {
    id: "2",
    user_id: "2",
    action: "UPDATE",
    resource_type: "promoter",
    resource_id: "2",
    details: { field: "status", old_value: "inactive", new_value: "active" },
    ip_address: "192.168.1.2",
    user_agent: "Mozilla/5.0...",
    created_at: new Date(Date.now() - 3600000).toISOString(),
    user: {
      email: "user@example.com",
      name: "Regular User",
    },
  },
  {
    id: "3",
    user_id: "1",
    action: "DELETE",
    resource_type: "party",
    resource_id: "3",
    details: { name: "Old Party Deleted" },
    ip_address: "192.168.1.1",
    user_agent: "Mozilla/5.0...",
    created_at: new Date(Date.now() - 7200000).toISOString(),
    user: {
      email: "admin@example.com",
      name: "Admin User",
    },
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
    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "10")
    const action = searchParams.get("action")
    const resource_type = searchParams.get("resource_type")
    const user_id = searchParams.get("user_id")
    const start_date = searchParams.get("start_date")
    const end_date = searchParams.get("end_date")

    const supabase = getSupabaseClient()

    if (!supabase) {
      // Return filtered mock data
      let filteredLogs = [...mockAuditLogs]

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

      // Pagination
      const offset = (page - 1) * limit
      const paginatedLogs = filteredLogs.slice(offset, offset + limit)

      return NextResponse.json({
        success: true,
        data: paginatedLogs,
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
    let query = supabase
      .from("audit_logs")
      .select(`
        *,
        user:profiles(email, name)
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

    const { data, error, count } = await query

    if (error) {
      console.error("Supabase error:", error)
      // Return mock data on error
      let filteredLogs = [...mockAuditLogs]

      if (action) {
        filteredLogs = filteredLogs.filter((log) => log.action === action)
      }

      const offset = (page - 1) * limit
      const paginatedLogs = filteredLogs.slice(offset, offset + limit)

      return NextResponse.json({
        success: true,
        data: paginatedLogs,
        pagination: {
          page,
          limit,
          total: filteredLogs.length,
          totalPages: Math.ceil(filteredLogs.length / limit),
        },
        message: "Using mock data - Database error",
      })
    }

    return NextResponse.json({
      success: true,
      data: data || [],
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
      success: true,
      data: mockAuditLogs.slice(0, 10),
      pagination: {
        page: 1,
        limit: 10,
        total: mockAuditLogs.length,
        totalPages: Math.ceil(mockAuditLogs.length / 10),
      },
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
      const newLog = {
        id: Date.now().toString(),
        ...body,
        created_at: new Date().toISOString(),
      }

      return NextResponse.json({
        success: true,
        data: newLog,
        message: "Mock audit log created - Supabase not configured",
      })
    }

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
      console.error("Supabase error:", error)
      const newLog = {
        id: Date.now().toString(),
        ...body,
        created_at: new Date().toISOString(),
      }

      return NextResponse.json({
        success: true,
        data: newLog,
        message: "Mock audit log created - Database error",
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
        error: "Failed to create audit log",
      },
      { status: 500 },
    )
  }
}
