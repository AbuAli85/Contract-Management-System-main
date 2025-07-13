import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, isEnvConfigured } from "@/lib/env"

export async function GET() {
  try {
    // Check if environment is configured
    if (!isEnvConfigured()) {
      return NextResponse.json(
        {
          error: "Supabase not configured",
          logs: [],
        },
        { status: 200 },
      )
    }

    // Create Supabase client
    const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)

    if (error) {
      console.error("Error fetching audit logs:", error)
      return NextResponse.json(
        {
          error: error.message,
          logs: [],
        },
        { status: 500 },
      )
    }

    // Map to UI shape
    const logs = (data || []).map((log: any) => ({
      id: log.id,
      user: log.user_id || "System",
      action: log.action,
      ipAddress: log.ip_address || "",
      timestamp: log.created_at,
      details: log.details ? (typeof log.details === "string" ? log.details : JSON.stringify(log.details)) : "",
    }))

    return NextResponse.json({ logs })
  } catch (err: any) {
    console.error("Audit logs API error:", err)
    return NextResponse.json(
      {
        error: err.message || "Internal server error",
        logs: [],
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
    const { action, user_id, resource_type, resource_id, details } = body

    // Create Supabase client
    const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const { data, error } = await supabase
      .from("audit_logs")
      .insert({
        action,
        user_id,
        resource_type,
        resource_id,
        details,
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating audit log:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (err: any) {
    console.error("Audit logs POST error:", err)
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 })
  }
}
