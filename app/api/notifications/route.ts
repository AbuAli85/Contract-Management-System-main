import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error("Supabase URL is required. Please set NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL.")
}
if (!supabaseAnonKey) {
  throw new Error(
    "Supabase Anon Key is required. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY."
  )
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

// GET: List notifications for the current user (or all for admin)
export async function GET(request: NextRequest) {
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
}

// PATCH: Mark notification as read
export async function PATCH(request: NextRequest) {
  const { id } = await request.json()
  const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}
