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

// POST: Assign a role to a user
export async function POST(request: NextRequest) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck instanceof NextResponse || ('error' in adminCheck)) return adminCheck
  const { supabase } = adminCheck
  const { user_id, role_id } = await request.json()
  const { data, error } = await supabase.from('user_roles').insert([{ user_id, role_id }]).select().single()
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  // Create notification
  await supabase.from('notifications').insert([
    {
      type: 'role_assigned',
      message: `Role assigned (role_id: ${role_id}) to user_id: ${user_id}`,
      user_id,
      created_at: new Date().toISOString(),
      is_read: false,
    }
  ])
  return NextResponse.json({ user_role: data })
}

// DELETE: Remove a role from a user
export async function DELETE(request: NextRequest) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck instanceof NextResponse || ('error' in adminCheck)) return adminCheck
  const { supabase } = adminCheck
  const { user_id, role_id } = await request.json()
  const { error } = await supabase.from('user_roles').delete().eq('user_id', user_id).eq('role_id', role_id)
  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  // Create notification
  await supabase.from('notifications').insert([
    {
      type: 'role_removed',
      message: `Role removed (role_id: ${role_id}) from user_id: ${user_id}`,
      user_id,
      created_at: new Date().toISOString(),
      is_read: false,
    }
  ])
  return NextResponse.json({ success: true })
}

// GET: List all user_roles
export async function GET(request: NextRequest) {
  const adminCheck = await requireAdmin(request)
  if (adminCheck instanceof NextResponse || ('error' in adminCheck)) return adminCheck
  const { supabase } = adminCheck
  const { data, error } = await supabase.from('user_roles').select('user_id, role_id')
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ user_roles: data })
}
