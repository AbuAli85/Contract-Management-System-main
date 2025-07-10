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

// GET: List all users with roles and status
export async function GET() {
  // Join profiles, user_roles, and roles tables
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, is_active, user_roles(role_id, roles(name))')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  // Map roles to array of names
  const users = (data || []).map((u: any) => ({
    ...u,
    roles: u.user_roles?.map((ur: any) => ur.roles?.name).filter(Boolean) || [],
    is_active: u.is_active ?? true // fallback to true if not present
  }))
  return NextResponse.json({ users })
}
