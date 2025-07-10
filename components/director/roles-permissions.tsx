import React, { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export const RolesPermissions = () => {
  const [roles, setRoles] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/admin/roles")
      .then(res => res.json())
      .then(data => {
        setRoles(data.roles || [])
        setLoading(false)
      })
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Roles & Permissions</CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div>Loading roles...</div>
        ) : (
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                <th className="text-left">Role</th>
                <th className="text-left">Permissions</th>
              </tr>
            </thead>
            <tbody>
              {roles.map(role => (
                <tr key={role.id} className="border-b">
                  <td>{role.name}</td>
                  <td>
                    {role.permissions && role.permissions.length > 0 ? role.permissions.map((perm: string) => (
                      <Badge key={perm} className="mr-1">{perm}</Badge>
                    )) : <span>-</span>}
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
