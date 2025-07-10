import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from '@/lib/env'

const supabase = createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// GET: Get all effective permissions for a user (direct + via roles)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const user_id = searchParams.get('user_id')
  if (!user_id) {
    return NextResponse.json({ error: 'user_id is required' }, { status: 400 })
  }

  // Direct permissions
  const { data: direct, error: directError } = await supabase
    .from('user_permissions')
    .select('permissions(name)')
    .eq('user_id', user_id)

  // Role-based permissions
  const { data: roles, error: rolesError } = await supabase
    .from('user_roles')
    .select('roles(role_permissions(permissions(name)))')
    .eq('user_id', user_id)

  if (directError || rolesError) {
    return NextResponse.json({ error: directError?.message || rolesError?.message }, { status: 500 })
  }

  // Flatten direct permissions (permissions is always an array)
  const directPerms = (direct || []).flatMap(d => (d.permissions || []).map((p: any) => p.name))

  // Flatten role-based permissions
  const rolePerms = (roles || []).flatMap(r =>
    (r.roles || []).flatMap((role: any) =>
      (role.role_permissions || []).flatMap((rp: any) =>
        (rp.permissions || []).map((p: any) => p.name)
      )
    )
  )

  const allPerms = Array.from(new Set([...directPerms, ...rolePerms]))

  return NextResponse.json({ permissions: allPerms })
}
