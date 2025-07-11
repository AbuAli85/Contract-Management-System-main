"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useSupabase } from "@/components/supabase-provider"
import {
  Users,
  UserPlus,
  Search,
  MoreHorizontal,
  Mail,
  Shield,
  Lock,
  Unlock,
  Key,
  UserX,
  RefreshCw,
  Download,
  Filter,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Activity,
  Calendar,
  Hash,
  Loader2,
} from "lucide-react"
import { format } from "date-fns"

interface User {
  id: string
  email: string
  full_name: string
  role: "admin" | "user"
  is_active: boolean
  email_verified_at?: string
  last_sign_in_at?: string
  sign_in_count: number
  created_at: string
  mfa_enabled?: boolean
  locked_at?: string
}

export default function AdminUsersPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { supabase } = useSupabase()

  const [users, setUsers] = useState<User[]>([])
  const [filteredUsers, setFilteredUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [roleFilter, setRoleFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")

  // Dialog states
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [actionLoading, setActionLoading] = useState(false)

  // Invite form
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteRole, setInviteRole] = useState<"admin" | "user">("user")

  useEffect(() => {
    fetchUsers()
  }, [])

  useEffect(() => {
    filterUsers()
  }, [users, searchTerm, roleFilter, statusFilter])

  async function fetchUsers() {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select(
          `
          id,
          email,
          full_name,
          role,
          is_active,
          email_verified_at,
          last_sign_in_at,
          sign_in_count,
          created_at,
          locked_at
        `
        )
        .order("created_at", { ascending: false })

      if (error) throw error

      // Fetch MFA status for each user
      const usersWithMFA = await Promise.all(
        (data || []).map(async (user) => {
          const { data: mfaData } = await supabase
            .from("mfa_settings")
            .select("totp_enabled")
            .eq("user_id", user.id)
            .single()

          return {
            ...user,
            mfa_enabled: mfaData?.totp_enabled || false,
          }
        })
      )

      setUsers(usersWithMFA)
    } catch (error: any) {
      toast({
        title: "Error fetching users",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  function filterUsers() {
    let filtered = users

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (user) =>
          user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Role filter
    if (roleFilter !== "all") {
      filtered = filtered.filter((user) => user.role === roleFilter)
    }

    // Status filter
    if (statusFilter === "active") {
      filtered = filtered.filter((user) => user.is_active && !user.locked_at)
    } else if (statusFilter === "inactive") {
      filtered = filtered.filter((user) => !user.is_active)
    } else if (statusFilter === "locked") {
      filtered = filtered.filter((user) => user.locked_at)
    } else if (statusFilter === "verified") {
      filtered = filtered.filter((user) => user.email_verified_at)
    } else if (statusFilter === "unverified") {
      filtered = filtered.filter((user) => !user.email_verified_at)
    }

    setFilteredUsers(filtered)
  }

  async function inviteUser() {
    setActionLoading(true)

    try {
      const response = await fetch("/api/admin/users/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to send invitation")
      }

      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${inviteEmail}`,
      })

      setInviteDialogOpen(false)
      setInviteEmail("")
      setInviteRole("user")
    } catch (error: any) {
      toast({
        title: "Error sending invitation",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  async function toggleUserStatus(user: User) {
    setActionLoading(true)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({ is_active: !user.is_active })
        .eq("id", user.id)

      if (error) throw error

      toast({
        title: user.is_active ? "User deactivated" : "User activated",
        description: `${user.email} has been ${user.is_active ? "deactivated" : "activated"}`,
      })

      fetchUsers()
    } catch (error: any) {
      toast({
        title: "Error updating user status",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  async function unlockUser(user: User) {
    setActionLoading(true)

    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          locked_at: null,
          failed_attempts: 0,
        })
        .eq("id", user.id)

      if (error) throw error

      toast({
        title: "User unlocked",
        description: `${user.email} has been unlocked`,
      })

      fetchUsers()
    } catch (error: any) {
      toast({
        title: "Error unlocking user",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  async function resetUserPassword(user: User) {
    setActionLoading(true)

    try {
      const response = await fetch("/api/admin/users/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      })

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || "Failed to reset password")
      }

      toast({
        title: "Password reset email sent",
        description: `A password reset link has been sent to ${user.email}`,
      })
    } catch (error: any) {
      toast({
        title: "Error resetting password",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  async function changeUserRole(user: User, newRole: "admin" | "user") {
    setActionLoading(true)

    try {
      const { error } = await supabase.from("profiles").update({ role: newRole }).eq("id", user.id)

      if (error) throw error

      toast({
        title: "Role updated",
        description: `${user.email} is now ${newRole === "admin" ? "an administrator" : "a regular user"}`,
      })

      fetchUsers()
    } catch (error: any) {
      toast({
        title: "Error updating role",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setActionLoading(false)
    }
  }

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === "admin").length,
    active: users.filter((u) => u.is_active && !u.locked_at).length,
    locked: users.filter((u) => u.locked_at).length,
    mfaEnabled: users.filter((u) => u.mfa_enabled).length,
    verified: users.filter((u) => u.email_verified_at).length,
  }

  return (
    <div className="container space-y-8 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="mt-1 text-muted-foreground">Manage user accounts, roles, and permissions</p>
        </div>
        <Button onClick={() => setInviteDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Invite User
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid gap-4 md:grid-cols-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Administrators
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.admins}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Locked Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.locked}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">MFA Enabled</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.mfaEnabled}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Verified</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{stats.verified}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <Select value={roleFilter} onValueChange={setRoleFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="admin">Administrators</SelectItem>
                <SelectItem value="user">Regular Users</SelectItem>
              </SelectContent>
            </Select>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="locked">Locked</SelectItem>
                <SelectItem value="verified">Verified</SelectItem>
                <SelectItem value="unverified">Unverified</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={fetchUsers}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Security</TableHead>
                <TableHead>Activity</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center">
                    <RefreshCw className="mx-auto h-6 w-6 animate-spin" />
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                    No users found
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{user.full_name || "No name"}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </TableCell>

                    <TableCell>
                      <Badge variant={user.role === "admin" ? "default" : "secondary"}>
                        <Shield className="mr-1 h-3 w-3" />
                        {user.role}
                      </Badge>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col gap-1">
                        {user.locked_at ? (
                          <Badge variant="destructive" className="w-fit">
                            <Lock className="mr-1 h-3 w-3" />
                            Locked
                          </Badge>
                        ) : user.is_active ? (
                          <Badge
                            variant="outline"
                            className="w-fit border-green-600 text-green-600"
                          >
                            <CheckCircle className="mr-1 h-3 w-3" />
                            Active
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="w-fit">
                            <XCircle className="mr-1 h-3 w-3" />
                            Inactive
                          </Badge>
                        )}

                        {user.email_verified_at ? (
                          <Badge variant="outline" className="w-fit text-xs">
                            <Mail className="mr-1 h-3 w-3" />
                            Verified
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="w-fit border-yellow-600 text-xs text-yellow-600"
                          >
                            <AlertCircle className="mr-1 h-3 w-3" />
                            Unverified
                          </Badge>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      {user.mfa_enabled ? (
                        <Badge variant="outline" className="border-blue-600 text-blue-600">
                          <Key className="mr-1 h-3 w-3" />
                          MFA Enabled
                        </Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">No MFA</span>
                      )}
                    </TableCell>

                    <TableCell>
                      <div className="text-sm">
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Activity className="h-3 w-3" />
                          {user.sign_in_count} logins
                        </div>
                        {user.last_sign_in_at && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {format(new Date(user.last_sign_in_at), "MMM d, yyyy")}
                          </div>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>

                          <DropdownMenuItem onClick={() => router.push(`/admin/users/${user.id}`)}>
                            View Details
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          {user.locked_at ? (
                            <DropdownMenuItem onClick={() => unlockUser(user)}>
                              <Unlock className="mr-2 h-4 w-4" />
                              Unlock Account
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem onClick={() => toggleUserStatus(user)}>
                              {user.is_active ? (
                                <>
                                  <UserX className="mr-2 h-4 w-4" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <CheckCircle className="mr-2 h-4 w-4" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuItem onClick={() => resetUserPassword(user)}>
                            <Key className="mr-2 h-4 w-4" />
                            Reset Password
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() =>
                              changeUserRole(user, user.role === "admin" ? "user" : "admin")
                            }
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Make {user.role === "admin" ? "User" : "Admin"}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Invite User Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite New User</DialogTitle>
            <DialogDescription>
              Send an invitation email to add a new user to the system
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invite-email">Email Address</Label>
              <Input
                id="invite-email"
                type="email"
                placeholder="user@example.com"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="invite-role">Role</Label>
              <Select value={inviteRole} onValueChange={(value: any) => setInviteRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Regular User</SelectItem>
                  <SelectItem value="admin">Administrator</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setInviteDialogOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button onClick={inviteUser} disabled={!inviteEmail || actionLoading}>
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invitation
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
