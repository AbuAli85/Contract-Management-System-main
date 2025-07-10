"use client"
import React, { useEffect, useState } from "react"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"

interface Role { id: string; name: string; description?: string }
interface Permission { id: string; name: string; description?: string }
interface User { id: string; email: string }
interface UserRole {
  user_id: string;
  role_id: string;
}
interface UserPermission {
  user_id: string;
  permission_id: string;
}

export default function RolesPermissionsAdminPage() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)
  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [userRoles, setUserRoles] = useState<UserRole[]>([])
  const [userPermissions, setUserPermissions] = useState<UserPermission[]>([])
  const [rolePermissions, setRolePermissions] = useState<{ role_id: string; permission_id: string }[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [selectedRole, setSelectedRole] = useState<Role | null>(null)
  const [loading, setLoading] = useState(true)
  const [assigning, setAssigning] = useState(false)

  useEffect(() => {
    if (!user) {
      setIsAdmin(false)
      return
    }
    // Fetch user role from users table
    async function checkAdmin() {
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single()
      setIsAdmin(!error && data?.role === "admin")
    }
    checkAdmin()
  }, [user])

  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      const [rolesRes, permsRes, usersRes, userRolesRes, userPermsRes, rolePermsRes] = await Promise.all([
        fetch("/api/admin/roles").then(r => r.json()),
        fetch("/api/admin/permissions").then(r => r.json()),
        fetch("/api/users").then(r => r.json()),
        fetch("/api/admin/user-roles").then(r => r.json()).catch(() => ({ user_roles: [] })),
        fetch("/api/admin/user-permissions").then(r => r.json()).catch(() => ({ user_permissions: [] })),
        fetch("/api/admin/role-permissions").then(r => r.json()).catch(() => ({ role_permissions: [] })),
      ])
      setRoles(rolesRes.roles || [])
      setPermissions(permsRes.permissions || [])
      setUsers(usersRes.users || [])
      setUserRoles(userRolesRes.user_roles || [])
      setUserPermissions(userPermsRes.user_permissions || [])
      setRolePermissions(rolePermsRes.role_permissions || [])
      setLoading(false)
    }
    fetchData()
  }, [])

  // Assign/remove role to user
  async function toggleUserRole(user: User, role: Role) {
    setAssigning(true)
    const hasRole = userRoles.some(ur => ur.user_id === user.id && ur.role_id === role.id)
    if (hasRole) {
      await fetch("/api/admin/user-roles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, role_id: role.id })
      })
    } else {
      await fetch("/api/admin/user-roles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, role_id: role.id })
      })
    }
    setAssigning(false)
    // Refresh
    setUserRoles(await fetch("/api/admin/user-roles").then(r => r.json()).then(res => res.user_roles || []))
  }

  // Assign/remove permission to user
  async function toggleUserPermission(user: User, perm: Permission) {
    setAssigning(true)
    const hasPerm = userPermissions.some(up => up.user_id === user.id && up.permission_id === perm.id)
    if (hasPerm) {
      await fetch("/api/admin/user-permissions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, permission_id: perm.id })
      })
    } else {
      await fetch("/api/admin/user-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user_id: user.id, permission_id: perm.id })
      })
    }
    setAssigning(false)
    // Refresh
    setUserPermissions(await fetch("/api/admin/user-permissions").then(r => r.json()).then(res => res.user_permissions || []))
  }

  // Assign/remove permission to role
  async function toggleRolePermission(role: Role, perm: Permission) {
    setAssigning(true)
    const hasPerm = rolePermissions.some(rp => rp.role_id === role.id && rp.permission_id === perm.id)
    if (hasPerm) {
      await fetch("/api/admin/role-permissions", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role_id: role.id, permission_id: perm.id })
      })
    } else {
      await fetch("/api/admin/role-permissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role_id: role.id, permission_id: perm.id })
      })
    }
    setAssigning(false)
    setRolePermissions(await fetch("/api/admin/role-permissions").then(r => r.json()).then(res => res.role_permissions || []))
  }

  if (authLoading || isAdmin === null) return <div className="p-8 text-center">Loading...</div>
  if (!isAdmin) return <div className="p-8 text-center text-red-600 font-bold">Access Denied</div>

  if (loading) return <div className="p-8 text-center">Loading...</div>

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Roles & Permissions Admin</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h2 className="font-semibold mb-2 flex items-center justify-between">Roles
            <button className="text-xs text-blue-600 underline" onClick={() => setSelectedRole(null)}>Manage</button>
          </h2>
          <ul className="bg-white rounded shadow p-4">
            {roles.map(role => (
              <li key={role.id} className="py-1 border-b last:border-b-0 flex items-center justify-between">
                <span>{role.name}</span>
                <button className="text-xs text-blue-600 underline" onClick={() => setSelectedRole(role)}>Permissions</button>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-semibold mb-2">Permissions</h2>
          <ul className="bg-white rounded shadow p-4">
            {permissions.map(perm => (
              <li key={perm.id} className="py-1 border-b last:border-b-0">{perm.name}</li>
            ))}
          </ul>
        </div>
        <div>
          <h2 className="font-semibold mb-2">Users</h2>
          <ul className="bg-white rounded shadow p-4">
            {users.map(user => (
              <li key={user.id} className="py-1 border-b last:border-b-0">
                <button className="text-blue-600 underline" onClick={() => setSelectedUser(user)}>{user.email}</button>
              </li>
            ))}
          </ul>
        </div>
      </div>
      {/* User role/permission assignment modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-8 w-full max-w-lg relative">
            <button className="absolute top-2 right-2 text-gray-500" onClick={() => setSelectedUser(null)}>&times;</button>
            <h2 className="text-xl font-bold mb-4">Manage {selectedUser.email}</h2>
            <div className="mb-4">
              <h3 className="font-semibold mb-2">Roles</h3>
              <div className="flex flex-wrap gap-2">
                {roles.map(role => {
                  const checked = userRoles.some(ur => ur.user_id === selectedUser.id && ur.role_id === role.id)
                  return (
                    <label key={role.id} className="flex items-center gap-1">
                      <input type="checkbox" checked={checked} disabled={assigning} onChange={() => toggleUserRole(selectedUser, role)} />
                      {role.name}
                    </label>
                  )
                })}
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-2">Direct Permissions</h3>
              <div className="flex flex-wrap gap-2">
                {permissions.map(perm => {
                  const checked = userPermissions.some(up => up.user_id === selectedUser.id && up.permission_id === perm.id)
                  return (
                    <label key={perm.id} className="flex items-center gap-1">
                      <input type="checkbox" checked={checked} disabled={assigning} onChange={() => toggleUserPermission(selectedUser, perm)} />
                      {perm.name}
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Role permission assignment modal */}
      {selectedRole && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded shadow-lg p-8 w-full max-w-lg relative">
            <button className="absolute top-2 right-2 text-gray-500" onClick={() => setSelectedRole(null)}>&times;</button>
            <h2 className="text-xl font-bold mb-4">Manage Role: {selectedRole.name}</h2>
            <div>
              <h3 className="font-semibold mb-2">Permissions</h3>
              <div className="flex flex-wrap gap-2">
                {permissions.map(perm => {
                  const checked = rolePermissions.some(rp => rp.role_id === selectedRole.id && rp.permission_id === perm.id)
                  return (
                    <label key={perm.id} className="flex items-center gap-1">
                      <input type="checkbox" checked={checked} disabled={assigning} onChange={() => toggleRolePermission(selectedRole, perm)} />
                      {perm.name}
                    </label>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
