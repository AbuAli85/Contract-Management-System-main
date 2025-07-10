"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { useRouter } from "next/navigation"

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [newRole, setNewRole] = useState("")
  const router = useRouter()

  useEffect(() => {
    supabase.from('profiles').select('id, email, role').then(({ data }) => {
      setUsers(data || [])
      setLoading(false)
    })
  }, [])

  const updateRole = async (id: string) => {
    await supabase.from('profiles').update({ role: newRole }).eq('id', id)
    setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u))
    setEditing(null)
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>
  return (
    <div className="max-w-2xl mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>User Role Management</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full border text-sm">
            <thead>
              <tr>
                <th className="p-2 border">Email</th>
                <th className="p-2 border">Role</th>
                <th className="p-2 border">Change</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id}>
                  <td className="p-2 border">{u.email}</td>
                  <td className="p-2 border">{u.role}</td>
                  <td className="p-2 border">
                    {editing === u.id ? (
                      <div className="flex gap-2">
                        <Input value={newRole} onChange={e => setNewRole(e.target.value)} className="w-24" />
                        <Button onClick={() => updateRole(u.id)} size="sm">Save</Button>
                        <Button onClick={() => setEditing(null)} size="sm" variant="outline">Cancel</Button>
                      </div>
                    ) : (
                      <Button onClick={() => { setEditing(u.id); setNewRole(u.role) }} size="sm">Edit</Button>
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
