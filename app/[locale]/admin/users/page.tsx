"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import clsx from "clsx"

const roleBadge = (role: string) => {
  const base = "inline-block px-2 py-1 rounded text-xs font-semibold";
  switch (role) {
    case "admin":
      return <span className={clsx(base, "bg-blue-100 text-blue-800 border border-blue-300")}>Admin</span>;
    case "premium":
      return <span className={clsx(base, "bg-yellow-100 text-yellow-800 border border-yellow-300")}>Premium</span>;
    default:
      return <span className={clsx(base, "bg-gray-100 text-gray-800 border border-gray-300")}>{role || "User"}</span>;
  }
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [newRole, setNewRole] = useState("")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.from('users').select('id, email, role').then(({ data, error }) => {
      if (error) setError(error.message)
      setUsers(data || [])
      setLoading(false)
    })
  }, [])

  const updateRole = async (id: string) => {
    await supabase.from('users').update({ role: newRole }).eq('id', id)
    setUsers(users.map(u => u.id === id ? { ...u, role: newRole } : u))
    setEditing(null)
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>

  return (
    <div className="max-w-3xl mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>User Role Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm bg-white rounded-lg shadow">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-3 border-b text-left font-semibold">User</th>
                  <th className="p-3 border-b text-left font-semibold">Email</th>
                  <th className="p-3 border-b text-left font-semibold">Role</th>
                  <th className="p-3 border-b text-left font-semibold">Change</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition">
                    <td className="p-3 border-b">
                      <div className="flex items-center gap-2">
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-200">
                          <Icons.user className="w-5 h-5 text-gray-500" />
                        </span>
                        <span className="font-medium">{u.email?.split("@")[0] || "-"}</span>
                      </div>
                    </td>
                    <td className="p-3 border-b">{u.email}</td>
                    <td className="p-3 border-b">{roleBadge(u.role)}</td>
                    <td className="p-3 border-b">
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
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
