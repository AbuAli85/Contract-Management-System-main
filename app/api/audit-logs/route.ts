import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from "@/lib/env"

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

export async function GET() {
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100)
    if (error) throw new Error(error.message)
    // Map to UI shape
    const logs = (data || []).map((log: any) => ({
      id: log.id,
      user: log.user_id || "System",
      action: log.action,
      ipAddress: log.ip_address || "",
      timestamp: log.created_at,
      details: log.details
        ? typeof log.details === "string"
          ? log.details
          : JSON.stringify(log.details)
        : "",
    }))
    return NextResponse.json({ logs })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
