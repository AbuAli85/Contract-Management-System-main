import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

// Mock audit logs for when Supabase is not configured
const mockAuditLogs = [
  {
    id: "1",
    user_id: "1",
    action: "CREATE",
    table_name: "contracts",
    record_id: "1",
    old_values: null,
    new_values: { title: "New Contract", status: "draft" },
    created_at: new Date().toISOString(),
  },
  {
    id: "2",
    user_id: "1",
    action: "UPDATE",
    table_name: "promoters",
    record_id: "1",
    old_values: { status: "inactive" },
    new_values: { status: "active" },
    created_at: new Date(Date.now() - 3600000).toISOString(),
  },
  {
    id: "3",
    user_id: "2",
    action: "DELETE",
    table_name: "parties",
    record_id: "5",
    old_values: { name: "Old Party", type: "individual" },
    new_values: null,
    created_at: new Date(Date.now() - 7200000).toISOString(),
  },
]

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !supabaseKey) {
    return null
  }

  return createClient(supabaseUrl, supabaseKey)
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()

    if (!supabase) {
      console.log("Supabase not configured, returning mock audit logs")
      return NextResponse.json({ logs: mockAuditLogs })
    }

    const { searchParams } = new URL(request.url)
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "50")
    const table_name = searchParams.get("table_name")
    const action = searchParams.get("action")
    const user_id = searchParams.get("user_id")

    let query = supabase.from("audit_logs").select("*").order("created_at", { ascending: false })

    // Apply filters
    if (table_name) {
      query = query.eq("table_name", table_name)
    }
    if (action) {
      query = query.eq("action", action)
    }
    if (user_id) {
      query = query.eq("user_id", user_id)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data: logs, error, count } = await query

    if (error) {
      console.error("Error fetching audit logs:", error)
      return NextResponse.json({ logs: mockAuditLogs, total: mockAuditLogs.length })
    }

    return NextResponse.json({
      logs: logs || [],
      total: count || 0,
      page,
      limit,
    })
  } catch (error) {
    console.error("Audit logs API error:", error)
    return NextResponse.json({ logs: mockAuditLogs, total: mockAuditLogs.length })
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()

    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const body = await request.json()
    const { user_id, action, table_name, record_id, old_values, new_values } = body

    if (!user_id || !action || !table_name || !record_id) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const { data: log, error } = await supabase
      .from("audit_logs")
      .insert([
        {
          user_id,
          action,
          table_name,
          record_id,
          old_values,
          new_values,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error("Error creating audit log:", error)
      return NextResponse.json({ error: "Failed to create audit log" }, { status: 500 })
    }

    return NextResponse.json({ log })
  } catch (error) {
    console.error("Audit logs POST error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
