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

// POST: Assign a role to a user
export async function POST(request: NextRequest) {
  const { user_id, role_id } = await request.json()
  const { data, error } = await supabase.from('user_roles').insert([{ user_id, role_id }]).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ user_role: data })
}

// DELETE: Remove a role from a user
export async function DELETE(request: NextRequest) {
  const { user_id, role_id } = await request.json()
  const { error } = await supabase.from('user_roles').delete().eq('user_id', user_id).eq('role_id', role_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ success: true })
}

// GET: List all user_roles
export async function GET() {
  const { data, error } = await supabase.from('user_roles').select('user_id, role_id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ user_roles: data })
}
