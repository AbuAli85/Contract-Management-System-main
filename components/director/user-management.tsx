"use client"

import React, { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export const UserManagement = () => {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [newRole, setNewRole] = useState("")

  useEffect(() => {
    fetch("/api/users")
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
                      <Button onClick={() => { setEditing(u.id); setNewRole(u.roles?.[0] || "") }} size="sm">Edit</Button>
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
