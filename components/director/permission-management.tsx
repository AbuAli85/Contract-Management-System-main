'use client'

import React, { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

export const PermissionManagement = () => {
  const [users, setUsers] = useState<any[]>([])
  const [permissions, setPermissions] = useState<any[]>([])
  const [userPermissions, setUserPermissions] = useState<{ [userId: string]: string[] }>({})
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/users").then(res => res.json()),
      fetch("/api/admin/permissions").then(res => res.json()),
      fetch("/api/admin/user-permissions").then(res => res.json())
    ]).then(([userRes, permRes, userPermRes]) => {
      setUsers(userRes.users || [])
      setPermissions(permRes.permissions || [])
      const permsByUser: { [userId: string]: string[] } = {}
      ;(userPermRes.user_permissions || []).forEach((up: any) => {
        if (!permsByUser[up.user_id]) permsByUser[up.user_id] = []
        permsByUser[up.user_id].push(up.permission_id)
      })
      setUserPermissions(permsByUser)
      setLoading(false)
    })
  }, [])

  const togglePermission = async (userId: string, permissionId: string, hasPerm: boolean) => {
    setActionLoading(userId + permissionId)
    await fetch("/api/admin/user-permissions", {
      method: hasPerm ? "DELETE" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: userId, permission_id: permissionId })
    })
    setUserPermissions(prev => {
      const perms = new Set(prev[userId] || [])
      if (hasPerm) perms.delete(permissionId)
      else perms.add(permissionId)
      return { ...prev, [userId]: Array.from(perms) }
    })
    setActionLoading(null)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission Management</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Loading...</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th>User</th>
                {permissions.map((p: any) => (
                  <th key={p.id}>{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.id} className="border-b">
                  <td>{u.email}</td>
                  {permissions.map((p: any) => {
                    const hasPerm = (userPermissions[u.id] || []).includes(p.id)
                    return (
                      <td key={p.id}>
                        <Button
                          size="sm"
                          variant={hasPerm ? "default" : "outline"}
                          disabled={actionLoading === u.id + p.id}
                          onClick={() => togglePermission(u.id, p.id, hasPerm)}
                        >
                          {hasPerm ? "Revoke" : "Grant"}
                        </Button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </CardContent>
    </Card>
  )
}
