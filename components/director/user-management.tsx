"use client"

import React, { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/hooks/use-auth"
import { AlertTriangle } from "lucide-react"

export const UserManagement = () => {
  const { user: currentUser, isAuthenticated, loading: authLoading } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [newRole, setNewRole] = useState("")
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch("/api/admin/users")
      .then(res => res.json())
      .then(data => {
        setUsers(data.users || [])
        setLoading(false)
      })
  }, [])

  const updateRole = async (id: string) => {
    await fetch(`/api/admin/user-roles`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: id, role: newRole })
    })
    setUsers(users.map(u => u.id === id ? { ...u, roles: [newRole] } : u))
    setEditing(null)
  }

  const setActive = async (id: string, isActive: boolean) => {
    setActionLoading(id + '-active')
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: id, is_active: isActive, admin_id: 'ADMIN_ID' }) // TODO: Replace with real admin id
    })
    setUsers(users.map(u => u.id === id ? { ...u, is_active: isActive } : u))
    setActionLoading(null)
  }

  const resetPassword = async (id: string) => {
    setActionLoading(id + '-reset')
    const newPassword = prompt('Enter new password for user:')
    if (!newPassword) return setActionLoading(null)
    await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: id, reset_password: true, new_password: newPassword, admin_id: 'ADMIN_ID' }) // TODO: Replace with real admin id
    })
    setActionLoading(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Loading users...</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">Email</th>
                <th className="text-left">Roles</th>
                <th className="text-left">Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b">
                  <td>{u.email}</td>
                  <td>
                    {u.roles && u.roles.length > 0 ? u.roles.map((role: string) => (
                      <Badge key={role} className="mr-1">{role}</Badge>
                    )) : <span>-</span>}
                  </td>
                  <td>
                    {u.is_active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                  </td>
                  <td>
                    {editing === u.id ? (
                      <div className="flex gap-2">
                        <input value={newRole} onChange={e => setNewRole(e.target.value)} className="w-24 border px-2 py-1 rounded" />
                        <Button onClick={() => updateRole(u.id)} size="sm">Save</Button>
                        <Button onClick={() => setEditing(null)} size="sm" variant="outline">Cancel</Button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <Button onClick={() => { setEditing(u.id); setNewRole(u.roles?.[0] || "") }} size="sm">Edit</Button>
                        <Button onClick={() => setActive(u.id, !u.is_active)} size="sm" variant={u.is_active ? "destructive" : "default"} disabled={actionLoading === u.id + '-active'}>
                          {u.is_active ? 'Disable' : 'Enable'}
                        </Button>
                        <Button onClick={() => resetPassword(u.id)} size="sm" variant="outline" disabled={actionLoading === u.id + '-reset'}>
                          Reset Password
                        </Button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}
