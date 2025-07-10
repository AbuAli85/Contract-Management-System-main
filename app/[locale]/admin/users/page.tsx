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

const roleOptions = ["user", "admin", "manager", "hr", "other"];
const statusOptions = ["active", "inactive"];
const featureOptions = [
  { key: "manage_parties", label: "Manage Parties" },
  { key: "manage_promoters", label: "Manage Promoters" },
  { key: "view_contracts", label: "View Contracts" },
  { key: "edit_contracts", label: "Edit Contracts" },
  { key: "access_admin", label: "Access Admin" },
  { key: "premium_features", label: "Premium Features" },
];

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

const statusBadge = (status: string) => {
  const base = "inline-block px-2 py-1 rounded text-xs font-semibold";
  switch (status) {
    case "active":
      return <span className={clsx(base, "bg-green-100 text-green-800 border border-green-300")}>Active</span>;
    case "inactive":
      return <span className={clsx(base, "bg-gray-100 text-gray-800 border border-gray-300")}>Inactive</span>;
    default:
      return <span className={clsx(base, "bg-yellow-100 text-yellow-800 border border-yellow-300")}>{status || "-"}</span>;
  }
}

const emptyUser = {
  email: '',
  full_name: '',
  role: 'user',
  status: 'active',
  avatar_url: '',
  org_id: '',
  last_login: '',
  permissions: [],
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
      const { data: { session } } = await supabase.auth.getSession()
      if (!session?.user) {
        router.replace("/login")
        return
      }
      // Get user profile
      const { data, error } = await supabase.from('profiles').select('*').eq('id', session.user.id).single()
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
    const { data, error } = await supabase.from('profiles').select('id, email, full_name, role, status, avatar_url, org_id, last_login, created_at, permissions')
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
    const perms = editFields.permissions || [];
    setEditFields({
      ...editFields,
      permissions: perms.includes(perm)
        ? perms.filter((p: string) => p !== perm)
        : [...perms, perm],
    });
  }
  const handleAddPermission = (perm: string) => {
    const perms = addFields.permissions || [];
    setAddFields({
      ...addFields,
      permissions: perms.includes(perm)
        ? perms.filter((p: string) => p !== perm)
        : [...perms, perm],
    });
  }

  const saveEdit = async (id: string) => {
    setActionLoading(true)
    await supabase.from('profiles').update(editFields).eq('id', id)
    setEditing(null)
    setActionLoading(false)
    setSuccess('User updated!')
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
      setError('Email and Full Name are required.')
      setActionLoading(false)
      return
    }
    await supabase.from('profiles').insert([addFields])
    setAdding(false)
    setAddFields(emptyUser)
    setActionLoading(false)
    setSuccess('User added!')
    fetchUsers()
  }

  const deleteUser = async (id: string) => {
    setActionLoading(true)
    await supabase.from('profiles').delete().eq('id', id)
    setShowDelete(null)
    setActionLoading(false)
    setSuccess('User deleted!')
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
      prev.includes(perm) ? prev.filter(p => p !== perm) : [...prev, perm]
    )
  }

  const savePermissions = async () => {
    setPermLoading(true)
    const id = permUserRef.current.id
    const { error } = await supabase.from('profiles').update({ permissions: permFields }).eq('id', id)
    setPermLoading(false)
    if (error) {
      setPermError(error.message)
    } else {
      setPermSuccess('Permissions updated!')
      setShowPermissions(null)
      fetchUsers()
    }
  }

  if (loading) return <div className="p-8 text-center">Loading...</div>
  if (error) return <div className="p-8 text-center text-red-500">{error}</div>
  if (authLoading) return <div className="p-8 text-center">Checking permissions...</div>
  if (!authUser || (authUser.role !== 'admin' && !(authUser.permissions || []).includes('access_admin'))) {
    return <div className="p-8 text-center text-red-500 font-semibold">Access denied. You do not have permission to view this page.</div>
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <Card>
        <CardHeader>
          <CardTitle>User Role Management</CardTitle>
        </CardHeader>
        <CardContent>
          {success && <div className="mb-2 text-green-600">{success}</div>}
          {error && <div className="mb-2 text-red-500">{error}</div>}
          <div className="mb-4 flex justify-end">
            <Button onClick={() => setAdding(true)} size="sm">+ Add User</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border text-sm bg-white rounded-lg shadow">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="p-3 border-b text-left font-semibold">Avatar</th>
                  <th className="p-3 border-b text-left font-semibold">Email</th>
                  <th className="p-3 border-b text-left font-semibold">Full Name</th>
                  <th className="p-3 border-b text-left font-semibold">Role</th>
                  <th className="p-3 border-b text-left font-semibold">Status</th>
                  <th className="p-3 border-b text-left font-semibold">Org</th>
                  <th className="p-3 border-b text-left font-semibold">Last Login</th>
                  <th className="p-3 border-b text-left font-semibold">Created</th>
                  <th className="p-3 border-b text-left font-semibold">Permissions</th>
                  <th className="p-3 border-b text-left font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.length === 0 && (
                  <tr>
                    <td colSpan={11} className="text-center text-gray-400 py-8">No users found.</td>
                  </tr>
                )}
                {users.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50 transition">
                    <td className="p-3 border-b">
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt="avatar" className="w-8 h-8 rounded-full object-cover" />
                      ) : (
                        <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-200">
                          <Icons.user className="w-5 h-5 text-gray-500" />
                        </span>
                      )}
                    </td>
                    <td className="p-3 border-b">
                      {editing === u.id ? (
                        <Input value={editFields.email} onChange={e => handleEditChange('email', e.target.value)} />
                      ) : (
                        u.email || <span className="text-gray-400 italic">(none)</span>
                      )}
                    </td>
                    <td className="p-3 border-b">
                      {editing === u.id ? (
                        <Input value={editFields.full_name} onChange={e => handleEditChange('full_name', e.target.value)} />
                      ) : (
                        u.full_name || <span className="text-gray-400 italic">(none)</span>
                      )}
                    </td>
                    <td className="p-3 border-b">
                      {editing === u.id ? (
                        <select className="border rounded px-2 py-1" value={editFields.role} onChange={e => handleEditChange('role', e.target.value)} title="Role">
                          {roleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        roleBadge(u.role)
                      )}
                    </td>
                    <td className="p-3 border-b">
                      {editing === u.id ? (
                        <select className="border rounded px-2 py-1" value={editFields.status} onChange={e => handleEditChange('status', e.target.value)}>
                          {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        statusBadge(u.status)
                      )}
                    </td>
                    <td className="p-3 border-b">
                      {editing === u.id ? (
                        <Input value={editFields.org_id} onChange={e => handleEditChange('org_id', e.target.value)} />
                      ) : (
                        u.org_id || <span className="text-gray-400 italic">-</span>
                      )}
                    </td>
                    <td className="p-3 border-b">
                      {editing === u.id ? (
                        <Input value={editFields.last_login} onChange={e => handleEditChange('last_login', e.target.value)} />
                      ) : (
                        u.last_login ? new Date(u.last_login).toLocaleString() : <span className="text-gray-400 italic">-</span>
                      )}
                    </td>
                    <td className="p-3 border-b">{u.created_at ? new Date(u.created_at).toLocaleString() : "-"}</td>
                    <td className="p-3 border-b">
                      <div className="flex flex-wrap gap-1 text-xs text-gray-600">
                        {u.permissions && u.permissions.length > 0
                          ? u.permissions.map((p: string) => <span key={p} className="bg-gray-100 border px-2 py-0.5 rounded mr-1" title={featureOptions.find(f => f.key === p)?.label}>{featureOptions.find(f => f.key === p)?.label || p}</span>)
                          : <span className="italic text-gray-400">No permissions</span>}
                      </div>
                    </td>
                    <td className="p-3 border-b flex gap-2">
                      <Button onClick={() => handleEdit(u)} size="sm">Edit</Button>
                      <Button onClick={() => setShowDelete(u.id)} size="sm" variant="destructive">Delete</Button>
                      <Button onClick={() => openPermissions(u)} size="sm" variant="outline" disabled={!u.email}>Edit Permissions</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Modal open={adding} onClose={() => setAdding(false)}>
            <div className="text-lg font-semibold mb-4">Add User</div>
            <div className="flex flex-col gap-2">
              <Input placeholder="Email" value={addFields.email} onChange={e => handleAddChange('email', e.target.value)} />
              <Input placeholder="Full Name" value={addFields.full_name} onChange={e => handleAddChange('full_name', e.target.value)} />
              <select className="border rounded px-2 py-1" value={addFields.role} onChange={e => handleAddChange('role', e.target.value)} title="Role">
                {roleOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <select className="border rounded px-2 py-1" value={addFields.status} onChange={e => handleAddChange('status', e.target.value)} title="Status">
                {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
              <Input placeholder="Avatar URL" value={addFields.avatar_url} onChange={e => handleAddChange('avatar_url', e.target.value)} />
              <Input placeholder="Org ID" value={addFields.org_id} onChange={e => handleAddChange('org_id', e.target.value)} />
              <Input placeholder="Last Login" value={addFields.last_login} onChange={e => handleAddChange('last_login', e.target.value)} />
              <div className="mt-2">
                <div className="font-medium mb-1">Permissions</div>
                <div className="flex flex-wrap gap-2">
                  {featureOptions.map(f => (
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
              </div>
            </div>
            <div className="flex gap-2 justify-end mt-4">
              <Button onClick={addUser} size="sm" disabled={actionLoading}>{actionLoading ? 'Adding...' : 'Add'}</Button>
              <Button onClick={() => setAdding(false)} size="sm" variant="outline" disabled={actionLoading}>Cancel</Button>
            </div>
          </Modal>
          <Modal open={!!showDelete} onClose={() => setShowDelete(null)}>
            <div className="text-lg font-semibold mb-4">Delete User</div>
            <div className="mb-4">Are you sure you want to delete this user? This action cannot be undone.</div>
            <div className="flex gap-2 justify-end">
              <Button onClick={() => deleteUser(showDelete!)} size="sm" variant="destructive" disabled={actionLoading}>{actionLoading ? 'Deleting...' : 'Delete'}</Button>
              <Button onClick={() => setShowDelete(null)} size="sm" variant="outline" disabled={actionLoading}>Cancel</Button>
            </div>
          </Modal>
          <Modal open={!!showPermissions} onClose={() => setShowPermissions(null)}>
            <div className="text-lg font-semibold mb-4">Edit Permissions</div>
            {permError && <div className="mb-2 text-red-500">{permError}</div>}
            {permSuccess && <div className="mb-2 text-green-600">{permSuccess}</div>}
            <div className="flex flex-wrap gap-2 mb-4">
              {featureOptions.map(f => (
                <label key={f.key} className="flex items-center gap-1" title={f.label}>
                  <input
                    type="checkbox"
                    checked={permFields.includes(f.key)}
                    onChange={() => handlePermChange(f.key)}
                    disabled={permLoading}
                  />
                  {f.label}
                </label>
              ))}
            </div>
            <div className="flex gap-2 justify-end">
              <Button onClick={savePermissions} size="sm" disabled={permLoading}>{permLoading ? 'Saving...' : 'Save'}</Button>
              <Button onClick={() => setShowPermissions(null)} size="sm" variant="outline" disabled={permLoading}>Cancel</Button>
            </div>
          </Modal>
        </CardContent>
      </Card>
    </div>
  )
}
