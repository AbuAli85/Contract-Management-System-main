import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env'
import { setUserActiveStatus, resetUserPassword } from './actions'

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// GET: List all users with roles and status
export async function GET() {
  try {
    // Join profiles, user_roles, and roles tables
    const { data, error } = await supabase
      .from('profiles')
      .select(`id, email, is_active, user_roles: user_roles!inner(role_id, roles: roles!inner(name))`)
    if (error) {
      console.error('Supabase error:', error)
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }
    // Map roles to array of names
    const users = (data || []).map((u: any) => ({
      ...u,
      roles: u.user_roles?.map((ur: any) => ur.roles?.name).filter(Boolean) || [],
      is_active: u.is_active ?? true // fallback to true if not present
    }))
    return NextResponse.json({ users })
  } catch (err: any) {
    console.error('API error:', err)
    return NextResponse.json({ error: 'Internal Server Error', details: err?.message || err }, { status: 500 })
  }
}

// PATCH: Enable/disable user or reset password
export async function PATCH(req: NextRequest) {
  try {
    const { user_id, is_active, reset_password, new_password, admin_id } = await req.json()
    if (typeof is_active === 'boolean') {
      await setUserActiveStatus(user_id, is_active, admin_id)
      return NextResponse.json({ success: true, is_active })
    }
    if (reset_password && new_password) {
      await resetUserPassword(user_id, new_password, admin_id)
      return NextResponse.json({ success: true, reset_password: true })
    }
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
