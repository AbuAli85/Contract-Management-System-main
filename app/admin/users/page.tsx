"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [newRole, setNewRole] = useState("")
  const router = useRouter()

  useEffect(() => {
    // Fetch users and their roles from your API (replace with real endpoint)
    fetch("/api/admin/users")
      .then(res => res.json())
      .then(data => {
        setUsers(data.users || [])
        setLoading(false)
      })
  }, [])

  const updateRole = async (id: string) => {
    // Call your API to update user role
    await fetch(`/api/admin/user-roles`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ user_id: id, role: newRole })
    })
    setUsers(users.map(u => u.id === id ? { ...u, roles: [newRole] } : u))
    setEditing(null)
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>
  return (
    <div className="max-w-2xl mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full border text-sm">
            <thead>
              <tr>
                <th className="p-2 border">Email</th>
                <th className="p-2 border">Roles</th>
                <th className="p-2 border">Status</th>
                <th className="p-2 border">Change</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td className="p-2 border">{u.email}</td>
                  <td className="p-2 border">
                    {u.roles && u.roles.length > 0 ? u.roles.map((role: string) => (
                      <Badge key={role} className="mr-1">{role}</Badge>
                    )) : <span>-</span>}
                  </td>
                  <td className="p-2 border">
                    {u.is_active ? (
                      <Badge variant="default">Active</Badge>
                    ) : (
                      <Badge variant="destructive">Inactive</Badge>
                    )}
                  </td>
                  <td className="p-2 border">
                    {editing === u.id ? (
                      <div className="flex gap-2">
                        <Input value={newRole} onChange={e => setNewRole(e.target.value)} className="w-24" />
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
        </CardContent>
      </Card>
    </div>
  )
}
