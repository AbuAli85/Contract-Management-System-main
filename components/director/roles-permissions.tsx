"use client"

import React, { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { AlertTriangle, Shield, Users, Plus, Edit, Trash2, RefreshCw, Bug } from "lucide-react"
import { LoadingSpinner } from "@/components/ui/skeletons"
import { AuthTest } from "@/components/debug/AuthTest"

interface Role {
  id: string
  name: string
  description?: string
  permissions?: string[]
  created_at?: string
}

interface Permission {
  id: string
  name: string
  description?: string
  category?: string
}

export const RolesPermissions = () => {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [roles, setRoles] = useState<Role[]>([])
  const [permissions, setPermissions] = useState<Permission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  const fetchRoles = async () => {
    try {
      setError(null)
      const response = await fetch("/api/admin/roles", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include", // Include cookies for authentication
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error("Authentication required. Please log in.")
        } else if (response.status === 403) {
          throw new Error("Admin access required to view roles.")
        } else {
          throw new Error(`Failed to fetch roles: ${response.statusText}`)
        }
      }

      const data = await response.json()
      setRoles(data.roles || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch roles"
      setError(errorMessage)
      console.error("Error fetching roles:", err)
    }
  }

  const fetchPermissions = async () => {
    try {
      const response = await fetch("/api/admin/permissions", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
      })

      if (!response.ok) {
        console.warn("Failed to fetch permissions:", response.statusText)
        return // Don't throw error for permissions, it's optional
      }

      const data = await response.json()
      setPermissions(data.permissions || [])
    } catch (err) {
      console.warn("Error fetching permissions:", err)
      // Don't set error state for permissions failure
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await Promise.all([fetchRoles(), fetchPermissions()])
      toast({
        title: "Success",
        description: "Roles and permissions refreshed successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh data",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  useEffect(() => {
    const loadData = async () => {
      if (isAuthenticated) {
        setLoading(true)
        try {
          await Promise.all([fetchRoles(), fetchPermissions()])
        } finally {
          setLoading(false)
        }
      } else if (isAuthenticated === false) {
        setError("Authentication required")
        setLoading(false)
      }
    }

    if (!authLoading) {
      loadData()
    }
  }, [isAuthenticated, authLoading])

  // Show loading state while authentication is being checked
  if (authLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Roles & Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="lg" />
            <span className="ml-2">Loading...</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Show authentication required message
  if (!isAuthenticated || !user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Roles & Permissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <AlertTriangle className="mr-2 h-5 w-5" />
            <span>Authentication required to view roles and permissions</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Roles & Permissions
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Refresh
            </Button>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Role
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 space-y-4">
            <div className="rounded-lg border border-destructive/20 bg-destructive/15 p-4">
              <div className="flex items-center">
                <AlertTriangle className="mr-2 h-4 w-4 text-destructive" />
                <p className="text-sm text-destructive">{error}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setError(null)}
                  className="ml-auto"
                >
                  ×
                </Button>
              </div>
            </div>

            {/* Debug section for authentication issues */}
            {error.includes("Authentication") && (
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
                <div className="mb-3 flex items-center gap-2">
                  <Bug className="h-4 w-4 text-blue-600" />
                  <h4 className="font-medium text-blue-900">Debug Information</h4>
                </div>
                <AuthTest />
              </div>
            )}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingSpinner size="md" />
            <span className="ml-2">Loading roles...</span>
          </div>
        ) : roles.length === 0 ? (
          <div className="py-8 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-2 text-sm font-semibold">No roles found</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Get started by creating your first role.
            </p>
            <Button className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create Role
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Roles Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="py-2 text-left font-medium">Role</th>
                    <th className="py-2 text-left font-medium">Description</th>
                    <th className="py-2 text-left font-medium">Permissions</th>
                    <th className="py-2 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {roles.map((role) => (
                    <tr key={role.id} className="border-b hover:bg-gray-50">
                      <td className="py-3">
                        <div className="font-medium">{role.name}</div>
                        <div className="text-xs text-muted-foreground">ID: {role.id}</div>
                      </td>
                      <td className="py-3">
                        <div className="text-sm text-muted-foreground">
                          {role.description || "No description"}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex flex-wrap gap-1">
                          {role.permissions && role.permissions.length > 0 ? (
                            role.permissions.map((perm: string) => (
                              <Badge key={perm} variant="outline" className="text-xs">
                                {perm}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">No permissions</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Permissions Summary */}
            {permissions.length > 0 && (
              <div className="mt-6 border-t pt-6">
                <h4 className="mb-3 text-sm font-medium">Available Permissions</h4>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                  {permissions.reduce((acc: Record<string, Permission[]>, permission) => {
                    const category = permission.category || "general"
                    if (!acc[category]) acc[category] = []
                    acc[category].push(permission)
                    return acc
                  }, {}) &&
                    Object.entries(
                      permissions.reduce((acc: Record<string, Permission[]>, permission) => {
                        const category = permission.category || "general"
                        if (!acc[category]) acc[category] = []
                        acc[category].push(permission)
                        return acc
                      }, {})
                    ).map(([category, categoryPermissions]) => (
                      <div key={category} className="space-y-2">
                        <h5 className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                          {category}
                        </h5>
                        <div className="space-y-1">
                          {categoryPermissions.map((permission) => (
                            <div key={permission.id} className="text-xs">
                              <Badge variant="outline" className="text-xs">
                                {permission.name}
                              </Badge>
                              {permission.description && (
                                <div className="mt-1 text-muted-foreground">
                                  {permission.description}
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
