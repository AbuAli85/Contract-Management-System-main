import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env'

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// GET: List all permissions
export async function GET() {
  const { data, error } = await supabase.from('permissions').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ permissions: data })
}

// POST: Create a new permission
export async function POST(req: NextRequest) {
  const { name, description } = await req.json()
  const { data, error } = await supabase.from('permissions').insert([{ name, description }]).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ permission: data })
}
