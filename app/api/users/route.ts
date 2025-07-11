import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } from "@/lib/env"

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)

// GET: List all users (from profiles table)
export async function GET() {
  const { data, error } = await supabase.from("profiles").select("id, email")
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ users: data })
}
