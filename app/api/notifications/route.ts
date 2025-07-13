import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl) {
    throw new Error("Supabase URL is required. Please set NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL.")
  }
  if (!supabaseAnonKey) {
    throw new Error("Supabase Anon Key is required. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY.")
  }

  return createClient(supabaseUrl, supabaseAnonKey)
}

// GET: List notifications for the current user (or all for admin)
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()

    // Optionally, add authentication and admin check here
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get("user_id")
    let query = supabase.from("notifications").select("*").order("created_at", { ascending: false })
    if (user_id) {
      query = query.eq("user_id", user_id)
    }
    const { data, error } = await query
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ notifications: data })
  } catch (error) {
    console.error("Notifications GET error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}

// PATCH: Mark notification as read
export async function PATCH(request: NextRequest) {
  try {
    const supabase = getSupabaseClient()

    const { id } = await request.json()
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id)
    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Notifications PATCH error:", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 },
    )
  }
}
