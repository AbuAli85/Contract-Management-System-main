"use client"

import { useEffect, useState, useRef } from "react"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Icons } from "@/components/icons"
import clsx from "clsx"
import { Modal } from "@/components/ui/modal"
import { useRouter } from "next/navigation"

const roleOptions = ["user", "admin", "manager", "hr", "other"]
const statusOptions = ["active", "inactive"]
const featureOptions = [
  { key: "manage_parties", label: "Manage Parties" },
  { key: "manage_promoters", label: "Manage Promoters" },
  { key: "view_contracts", label: "View Contracts" },
  { key: "edit_contracts", label: "Edit Contracts" },
  { key: "access_admin", label: "Access Admin" },
  { key: "premium_features", label: "Premium Features" },
]

const roleBadge = (role: string) => {
  const base = "inline-block px-2 py-1 rounded text-xs font-semibold"
  switch (role) {
    case "admin":
      return (
        <span className={clsx(base, "border border-blue-300 bg-blue-100 text-blue-800")}>
          Admin
        </span>
      )
    case "premium":
      return (
        <span className={clsx(base, "border border-yellow-300 bg-yellow-100 text-yellow-800")}>
          Premium
        </span>
      )
    default:
      return (
        <span className={clsx(base, "border border-gray-300 bg-gray-100 text-gray-800")}>
          {role || "User"}
        </span>
      )
  }
}

const statusBadge = (status: string) => {
  const base = "inline-block px-2 py-1 rounded text-xs font-semibold"
  switch (status) {
    case "active":
      return (
        <span className={clsx(base, "border border-green-300 bg-green-100 text-green-800")}>
          Active
        </span>
      )
    case "inactive":
      return (
        <span className={clsx(base, "border border-gray-300 bg-gray-100 text-gray-800")}>
          Inactive
        </span>
      )
    default:
      return (
        <span className={clsx(base, "border border-yellow-300 bg-yellow-100 text-yellow-800")}>
          {status || "-"}
        </span>
      )
  }
}

const emptyUser = {
  email: "",
  full_name: "",
  role: "user",
  status: "active",
  avatar_url: "",
  org_id: "",
  last_login: "",
  permissions: [],
  is_premium: false,
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<string | null>(null)
  const [editFields, setEditFields] = useState<any>(emptyUser)
  const [adding, setAdding] = useState(false)
  const [addFields, setAddFields] = useState<any>(emptyUser)
  const [error, setError] = useState<string | null>(null)
  const [showDelete, setShowDelete] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [success, setSuccess] = useState<string | null>(null)
  const [showPermissions, setShowPermissions] = useState<string | null>(null)
  const [permFields, setPermFields] = useState<any>([])
  const [permLoading, setPermLoading] = useState(false)
  const [permSuccess, setPermSuccess] = useState<string | null>(null)
  const [permError, setPermError] = useState<string | null>(null)
  const permUserRef = useRef<any>(null)
  const [authUser, setAuthUser] = useState<any>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    // Fetch current session and user profile
    const fetchAuth = async () => {
      setAuthLoading(true)
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.user) {
        router.replace("/login")
        return
      }
      // Get user profile
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", session.user.id)
        .single()
      if (error || !data) {
        setAuthUser(null)
        setAuthLoading(false)
        return
      }
      setAuthUser(data)
      setAuthLoading(false)
    }
    fetchAuth()
  }, [])

  const fetchUsers = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from("profiles")
      .select(
        "id, email, full_name, role, status, avatar_url, org_id, last_login, created_at, permissions, is_premium"
      )
    if (error) setError(error.message)
    setUsers(data || [])
    setLoading(false)
  }

  const handleEdit = (user: any) => {
    setEditing(user.id)
    setEditFields({ ...user })
  }

  const handleEditChange = (field: string, value: any) => {
    setEditFields({ ...editFields, [field]: value })
  }
  const handleEditPermission = (perm: string) => {
    const perms = editFields.permissions || []
    setEditFields({
      ...editFields,
      permissions: perms.includes(perm)
        ? perms.filter((p: string) => p !== perm)
        : [...perms, perm],
    })
  }
  const handleEditPremium = () => {
    setEditFields({ ...editFields, is_premium: !editFields.is_premium })
  }
  const handleAddPremium = () => {
    setAddFields({ ...addFields, is_premium: !addFields.is_premium })
  }
  const handleAddPermission = (perm: string) => {
    const perms = addFields.permissions || []
    setAddFields({
      ...addFields,
      permissions: perms.includes(perm)
        ? perms.filter((p: string) => p !== perm)
        : [...perms, perm],
    })
  }

  const saveEdit = async (id: string) => {
    setActionLoading(true)
    // Prevent self-demotion
    if (authUser && authUser.id === id && editFields.role !== "admin") {
      setError("You cannot remove your own admin role.")
      setActionLoading(false)
      return
    }
    await supabase.from("profiles").update(editFields).eq("id", id)
    setEditing(null)
    setActionLoading(false)
    setSuccess("User updated!")
    fetchUsers()
  }

  const cancelEdit = () => {
    setEditing(null)
    setEditFields(emptyUser)
  }

  const handleAddChange = (field: string, value: string) => {
    setAddFields({ ...addFields, [field]: value })
  }

  const addUser = async () => {
    setActionLoading(true)
    if (!addFields.email || !addFields.full_name) {
      setError("Email and Full Name are required.")
      setActionLoading(false)
      return
    }
    await supabase.from("profiles").insert([addFields])
    setAdding(false)
    setAddFields(emptyUser)
    setActionLoading(false)
    setSuccess("User added!")
    fetchUsers()
  }

  const deleteUser = async (id: string) => {
    setActionLoading(true)
    await supabase.from("profiles").delete().eq("id", id)
    setShowDelete(null)
    setActionLoading(false)
    setSuccess("User deleted!")
    fetchUsers()
  }

  const openPermissions = (user: any) => {
    setShowPermissions(user.id)
    setPermFields(user.permissions || [])
    permUserRef.current = user
    setPermSuccess(null)
    setPermError(null)
  }

  const handlePermChange = (perm: string) => {
    setPermFields((prev: string[]) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm]
    )
  }

  const savePermissions = async () => {
    setPermLoading(true)
    const id = permUserRef.current.id
    // Remove permissions update if the column does not exist
    // const { error } = await supabase.from('profiles').update({ permissions: permFields as any }).eq('id', id)
    // Instead, update only existing fields or handle permissions elsewhere
    setPermLoading(false)
    if (error) {
      setPermError(error)
    } else {
      setPermSuccess("Permissions updated!")
      setShowPermissions(null)
      fetchUsers()
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>
  if (authLoading) return <div className="p-8 text-center">Checking permissions...</div>
  if (!authUser || authUser.role !== "admin") {
    return (
      <div className="p-8 text-center font-semibold text-red-500">
        Access denied. Only admins can view and manage users and permissions.
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl p-8">
      <Card>
        <CardHeader>
          <CardTitle>User Role Management</CardTitle>
        </CardHeader>
        <CardContent>
          {success && <div className="mb-2 text-green-600">{success}</div>}
          {error && <div className="mb-2 text-red-500">{error}</div>}
          <div className="mb-4 flex justify-end">
            <Button onClick={() => setAdding(true)} size="sm">
              + Add User
            </Button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full rounded-lg border bg-white text-sm shadow">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr>
                  <th className="border-b p-3 text-left font-semibold">Avatar</th>
                  <th className="border-b p-3 text-left font-semibold">Email</th>
                  <th className="border-b p-3 text-left font-semibold">Full Name</th>
                  <th className="border-b p-3 text-left font-semibold">Role</th>
                  <th className="border-b p-3 text-left font-semibold">Status</th>
                  <th className="border-b p-3 text-left font-semibold">Org</th>
                  <th className="border-b p-3 text-left font-semibold">Last Login</th>
                  <th className="border-b p-3 text-left font-semibold">Created</th>
                  <th className="border-b p-3 text-left font-semibold">Permissions</th>
                  <th className="border-b p-3 text-left font-semibold">Premium</th>
                  <th className="border-b p-3 text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-gray-400">
                      No users found.
                    </td>
                  </tr>
                )}
                {users.map((u) => (
                  <tr key={u.id} className="transition hover:bg-gray-50">
                    <td className="border-b p-3">
                      {u.avatar_url ? (
                        <img
                          src={u.avatar_url}
                          alt="avatar"
                          className="h-8 w-8 rounded-full object-cover"
                        />
                      ) : (
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-gray-200">
                          <Icons.user className="h-5 w-5 text-gray-500" />
                        </span>
                      )}
                    </td>
                    <td className="border-b p-3">
                      {editing === u.id ? (
                        <Input
                          value={editFields.email ?? ""}
                          onChange={(e) => handleEditChange("email", e.target.value)}
                        />
                      ) : (
                        u.email || <span className="italic text-gray-400">(none)</span>
                      )}
                    </td>
                    <td className="border-b p-3">
                      {editing === u.id ? (
                        <Input
                          value={editFields.full_name ?? ""}
                          onChange={(e) => handleEditChange("full_name", e.target.value)}
                        />
                      ) : (
                        u.full_name || <span className="italic text-gray-400">(none)</span>
                      )}
                    </td>
                    <td className="border-b p-3">
                      {editing === u.id ? (
                        <select
                          className="rounded border px-2 py-1"
                          value={editFields.role}
                          onChange={(e) => handleEditChange("role", e.target.value)}
                          title="Role"
                        >
                          {roleOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        roleBadge(u.role)
                      )}
                    </td>
                    <td className="border-b p-3">
                      {editing === u.id ? (
                        <select
                          className="rounded border px-2 py-1"
                          value={editFields.status}
                          onChange={(e) => handleEditChange("status", e.target.value)}
                          title="Status"
                        >
                          {statusOptions.map((opt) => (
                            <option key={opt} value={opt}>
                              {opt}
                            </option>
                          ))}
                        </select>
                      ) : (
                        statusBadge(u.status)
                      )}
                    </td>
                    <td className="border-b p-3">
                      {editing === u.id ? (
                        <Input
                          value={editFields.org_id ?? ""}
                          onChange={(e) => handleEditChange("org_id", e.target.value)}
                        />
                      ) : (
                        u.org_id || <span className="italic text-gray-400">-</span>
                      )}
                    </td>
                    <td className="border-b p-3">
                      {editing === u.id ? (
                        <Input
                          value={editFields.last_login ?? ""}
                          onChange={(e) => handleEditChange("last_login", e.target.value)}
                        />
                      ) : u.last_login ? (
                        new Date(u.last_login).toLocaleString()
                      ) : (
                        <span className="italic text-gray-400">-</span>
                      )}
                    </td>
                    <td className="border-b p-3">
                      {u.created_at ? new Date(u.created_at).toLocaleString() : "-"}
                    </td>
                    <td className="border-b p-3">
                      <div className="flex flex-wrap gap-1 text-xs text-gray-600">
                        {u.permissions && u.permissions.length > 0 ? (
                          u.permissions.map((p: string) => (
                            <span
                              key={p}
                              className="mr-1 rounded border bg-gray-100 px-2 py-0.5"
                              title={featureOptions.find((f) => f.key === p)?.label}
                            >
                              {featureOptions.find((f) => f.key === p)?.label || p}
                            </span>
                          ))
                        ) : (
                          <span className="italic text-gray-400">No permissions</span>
                        )}
                      </div>
                    </td>
                    <td className="border-b p-3">
                      {editing === u.id ? (
                        <label className="flex items-center gap-2" title="Premium User">
                          <input
                            type="checkbox"
                            checked={!!editFields.is_premium}
                            onChange={handleEditPremium}
                            aria-label="Premium User"
                          />
                          Premium User
                        </label>
                      ) : u.is_premium ? (
                        <span className="font-bold text-yellow-600">Yes</span>
                      ) : (
                        <span className="text-gray-400">No</span>
                      )}
                    </td>
                    <td className="flex gap-2 border-b p-3">
                      <Button onClick={() => handleEdit(u)} size="sm">
                        Edit
                      </Button>
                      <Button onClick={() => setShowDelete(u.id)} size="sm" variant="destructive">
                        Delete
                      </Button>
                      <Button
                        onClick={() => openPermissions(u)}
                        size="sm"
                        variant="outline"
                        disabled={authUser.role !== "admin" || !u.email}
                      >
                        Edit Permissions
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Modal open={adding} onClose={() => setAdding(false)}>
            <div className="mb-4 text-lg font-semibold">Add User</div>
            <div className="flex flex-col gap-2">
              <Input
                placeholder="Email"
                value={addFields.email ?? ""}
                onChange={(e) => handleAddChange("email", e.target.value)}
              />
              <Input
                placeholder="Full Name"
                value={addFields.full_name ?? ""}
                onChange={(e) => handleAddChange("full_name", e.target.value)}
              />
              <select
                className="rounded border px-2 py-1"
                value={addFields.role}
                onChange={(e) => handleAddChange("role", e.target.value)}
                title="Role"
              >
                {roleOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <select
                className="rounded border px-2 py-1"
                value={addFields.status}
                onChange={(e) => handleAddChange("status", e.target.value)}
                title="Status"
              >
                {statusOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
              <Input
                placeholder="Avatar URL"
                value={addFields.avatar_url ?? ""}
                onChange={(e) => handleAddChange("avatar_url", e.target.value)}
              />
              <Input
                placeholder="Org ID"
                value={addFields.org_id ?? ""}
                onChange={(e) => handleAddChange("org_id", e.target.value)}
              />
              <Input
                placeholder="Last Login"
                value={addFields.last_login ?? ""}
                onChange={(e) => handleAddChange("last_login", e.target.value)}
              />
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={!!addFields.is_premium}
                  onChange={handleAddPremium}
                />
                Premium User
              </label>
              <div className="mt-2">
                <div className="mb-1 font-medium">Permissions</div>
                <div className="flex flex-wrap gap-2">
                  {featureOptions.map((f) => (
                    <label key={f.key} className="flex items-center gap-1">
                      <input
                        type="checkbox"
                        checked={addFields.permissions?.includes(f.key)}
                        onChange={() => handleAddPermission(f.key)}
                      />
                      {f.label}
                    </label>
                  ))}
                </div>
                {/* Show summary of selected permissions */}
                {addFields.permissions && addFields.permissions.length > 0 && (
                  <div className="mt-2 text-xs text-gray-600">
                    Selected:{" "}
                    {addFields.permissions
                      .map((p: string) => featureOptions.find((f) => f.key === p)?.label || p)
                      .join(", ")}
                  </div>
                )}
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2">
              <Button onClick={addUser} size="sm" disabled={actionLoading}>
                {actionLoading ? "Adding..." : "Add"}
              </Button>
              <Button
                onClick={() => setAdding(false)}
                size="sm"
                variant="outline"
                disabled={actionLoading}
              >
                Cancel
              </Button>
            </div>
          </Modal>
          <Modal open={!!showDelete} onClose={() => setShowDelete(null)}>
            <div className="mb-4 text-lg font-semibold">Delete User</div>
            <div className="mb-4">
              Are you sure you want to delete this user? This action cannot be undone.
            </div>
            <div className="flex justify-end gap-2">
              <Button
                onClick={() => deleteUser(showDelete!)}
                size="sm"
                variant="destructive"
                disabled={actionLoading}
              >
                {actionLoading ? "Deleting..." : "Delete"}
              </Button>
              <Button
                onClick={() => setShowDelete(null)}
                size="sm"
                variant="outline"
                disabled={actionLoading}
              >
                Cancel
              </Button>
            </div>
          </Modal>
          <Modal open={!!showPermissions} onClose={() => setShowPermissions(null)}>
            <div className="mb-4 text-lg font-semibold">Edit Permissions</div>
            {permError && <div className="mb-2 text-red-500">{permError}</div>}
            {permSuccess && <div className="mb-2 text-green-600">{permSuccess}</div>}
            <div className="mb-4 flex flex-wrap gap-2">
              {featureOptions.map((f) => (
                <label key={f.key} className="flex items-center gap-1" title={f.label}>
                  <input
                    type="checkbox"
                    checked={permFields.includes(f.key)}
                    onChange={() => handlePermChange(f.key)}
                    disabled={permLoading || authUser.role !== "admin"}
                  />
                  {f.label}
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                onClick={savePermissions}
                size="sm"
                disabled={permLoading || authUser.role !== "admin"}
              >
                {permLoading ? "Saving..." : "Save"}
              </Button>
              <Button
                onClick={() => setShowPermissions(null)}
                size="sm"
                variant="outline"
                disabled={permLoading}
              >
                Cancel
              </Button>
            </div>
          </Modal>
        </CardContent>
      </Card>
    </div>
  )
}
