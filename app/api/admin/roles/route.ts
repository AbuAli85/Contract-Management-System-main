import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl) {
  throw new Error('Supabase URL is required. Please set NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL.')
}
if (!supabaseServiceRoleKey) {
  throw new Error('Supabase Service Role Key is required. Please set SUPABASE_SERVICE_ROLE_KEY.')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey)

// GET: List all roles
export async function GET() {
  const { data, error } = await supabase.from('roles').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ roles: data })
}

// POST: Create a new role
export async function POST(request: NextRequest) {
  const { name, description } = await request.json()
  const { data, error } = await supabase.from('roles').insert([{ name, description }]).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ role: data })
}
