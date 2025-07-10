import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env'
import { createServerComponentClient } from '@/lib/supabaseServer'

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Helper to check admin using users table
async function requireAdmin(request: NextRequest) {
  const supabase = (await createServerComponentClient()) as any
  const {
    data: { session },
  } = await supabase.auth.getSession()
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  // Check if user has admin role in users table
  const { data: user, error } = await supabase
    .from('users')
    .select('role')
    .eq('id', session.user.id)
    .single()
  if (error || user?.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden: Admins only' }, { status: 403 })
  }
  return { user: session.user, supabase }
}

// GET: List all roles
export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck instanceof NextResponse || ('error' in adminCheck)) return adminCheck
  const { supabase } = adminCheck
  const { data, error } = await supabase.from('roles').select('*')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ roles: data })
}

// POST: Create a new role
export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck instanceof NextResponse || ('error' in adminCheck)) return adminCheck
  const { supabase } = adminCheck
  const { name, description } = await request.json()
  const { data, error } = await supabase.from('roles').insert([{ name, description }]).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ role: data })
}
