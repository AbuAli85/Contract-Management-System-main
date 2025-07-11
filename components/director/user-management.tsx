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
    if (isAuthenticated) {
      fetchUsers()
    }
  }, [isAuthenticated])

  const fetchUsers = async () => {
    try {
      setError(null)
      const response = await fetch("/api/admin/users")
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to fetch users')
      }
      
      setUsers(data.users || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users')
    } finally {
      setLoading(false)
    }
  }

  const updateRole = async (id: string) => {
    if (!currentUser?.id) {
      setError('Authentication required')
      return
    }

    try {
      setError(null)
      const response = await fetch(`/api/admin/user-roles`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: id, 
          role: newRole,
          admin_id: currentUser.id
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update role')
      }

      setUsers(users.map(u => u.id === id ? { ...u, roles: [newRole] } : u))
      setEditing(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update role')
    }
  }

  const setActive = async (id: string, isActive: boolean) => {
    if (!currentUser?.id) {
      setError('Authentication required')
      return
    }

    setActionLoading(id + '-active')
    try {
      setError(null)
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: id, 
          is_active: isActive, 
          admin_id: currentUser.id
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to update user status')
      }

      setUsers(users.map(u => u.id === id ? { ...u, is_active: isActive } : u))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update user status')
    } finally {
      setActionLoading(null)
    }
  }

  const resetPassword = async (id: string) => {
    if (!currentUser?.id) {
      setError('Authentication required')
      return
    }

    setActionLoading(id + '-reset')
    try {
      const newPassword = prompt('Enter new password for user:')
      if (!newPassword) return setActionLoading(null)

      setError(null)
      const response = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          user_id: id, 
          reset_password: true, 
          new_password: newPassword, 
          admin_id: currentUser.id
        })
      })

      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password')
      }

      // Show success message
      alert('Password reset successfully')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reset password')
    } finally {
      setActionLoading(null)
    }
  }

  // Show loading state while authentication is being checked
  if (authLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-2">Checking authentication...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show authentication required message
  if (!isAuthenticated || !currentUser) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <AlertTriangle className="h-5 w-5 mr-2" />
            <span>Authentication required to access user management</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>User Management</CardTitle>
        {error && (
          <div className="flex items-center gap-2 text-sm text-destructive bg-destructive/10 p-3 rounded-md">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setError(null)}
              className="ml-auto h-auto p-1"
            >
              ×
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            <span className="ml-2">Loading users...</span>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <span>No users found</span>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium">Email</th>
                  <th className="text-left py-2 font-medium">Roles</th>
                  <th className="text-left py-2 font-medium">Status</th>
                  <th className="text-left py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.id} className="border-b hover:bg-muted/50">
                    <td className="py-3">{u.email}</td>
                    <td className="py-3">
                      {u.roles && u.roles.length > 0 ? u.roles.map((role: string) => (
                        <Badge key={role} variant="secondary" className="mr-1">{role}</Badge>
                      )) : <span className="text-muted-foreground">No roles</span>}
                    </td>
                    <td className="py-3">
                      {u.is_active ? (
                        <Badge variant="default">Active</Badge>
                      ) : (
                        <Badge variant="destructive">Inactive</Badge>
                      )}
                    </td>
                    <td className="py-3">
                      {editing === u.id ? (
                        <div className="flex gap-2 items-center">
                          <input 
                            value={newRole} 
                            onChange={e => setNewRole(e.target.value)} 
                            className="w-24 border border-input px-2 py-1 rounded-md text-sm"
                            placeholder="Role"
                          />
                          <Button onClick={() => updateRole(u.id)} size="sm">Save</Button>
                          <Button onClick={() => setEditing(null)} size="sm" variant="outline">Cancel</Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Button 
                            onClick={() => { setEditing(u.id); setNewRole(u.roles?.[0] || "") }} 
                            size="sm"
                            variant="outline"
                          >
                            Edit Role
                          </Button>
                          <Button 
                            onClick={() => setActive(u.id, !u.is_active)} 
                            size="sm" 
                            variant={u.is_active ? "destructive" : "default"} 
                            disabled={actionLoading === u.id + '-active'}
                          >
                            {actionLoading === u.id + '-active' ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1"></div>
                            ) : null}
                            {u.is_active ? 'Disable' : 'Enable'}
                          </Button>
                          <Button 
                            onClick={() => resetPassword(u.id)} 
                            size="sm" 
                            variant="outline" 
                            disabled={actionLoading === u.id + '-reset'}
                          >
                            {actionLoading === u.id + '-reset' ? (
                              <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-current mr-1"></div>
                            ) : null}
                            Reset Password
                          </Button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
