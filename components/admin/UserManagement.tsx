
"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useEnhancedAuth, UserAvatar, UserRoleBadge } from "@/components/auth/EnhancedAuth"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import {
  Users,
  Plus,
  Search,
  Filter,
  RefreshCw,
  MoreHorizontal,
  Edit,
  Eye,
  Trash2,
  Download,
  Upload,
  UserPlus,
  Shield,
  Activity,
  Clock,
  Mail,
  Phone,
  MapPin,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Settings,
  Key,
  Ban
} from "lucide-react"
import { format, formatDistanceToNow, isAfter, subDays } from "date-fns"
import { supabase } from "@/lib/supabase"
import { LoadingSpinner } from "@/components/ui/skeletons"

interface UserProfile {
  id: string
  email: string
  full_name?: string
  avatar_url?: string
  role?: 'admin' | 'manager' | 'user'
  department?: string
  phone?: string
  timezone?: string
  language?: string
  email_notifications?: boolean
  push_notifications?: boolean
  two_factor_enabled?: boolean
  last_login?: string
  created_at?: string
  updated_at?: string
  status?: 'active' | 'inactive' | 'suspended'
}

interface UserStats {
  total: number
  active: number
  inactive: number
  suspended: number
  admins: number
  managers: number
  users: number
  recentlyActive: number
  newThisMonth: number
}

type UserFilter = 'all' | 'active' | 'inactive' | 'suspended' | 'admin' | 'manager' | 'user'

export function UserManagement() {
  const { profile: currentUserProfile, isAuthenticated, loading: authLoading } = useEnhancedAuth()
  const { toast } = useToast()
  
  const [users, setUsers] = useState<UserProfile[]>([])
  const [filteredUsers, setFilteredUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedUsers, setSelectedUsers] = useState<string[]>([])
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [showUserModal, setShowUserModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<UserFilter>('all')
  const [roleFilter, setRoleFilter] = useState<string>('all')
  const [departmentFilter, setDepartmentFilter] = useState<string>('all')
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)
  
  // Stats
  const [stats, setStats] = useState<UserStats>({
    total: 0,
    active: 0,
    inactive: 0,
    suspended: 0,
    admins: 0,
    managers: 0,
    users: 0,
    recentlyActive: 0,
    newThisMonth: 0
  })

  // Check if current user is admin
  const isAdmin = currentUserProfile?.role === 'admin'

  useEffect(() => {
    if (isAuthenticated && isAdmin) {
      fetchUsers()
    }
  }, [isAuthenticated, isAdmin])

  useEffect(() => {
    applyFilters()
  }, [users, searchTerm, statusFilter, roleFilter, departmentFilter])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) {
        throw new Error(`Failed to fetch users: ${fetchError.message}`)
      }

      const enhancedUsers = (data || []).map(user => ({
        ...user,
        status: user.status || 'active'
      }))

      setUsers(enhancedUsers)
      calculateStats(enhancedUsers)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load users'
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (userData: UserProfile[]) => {
    const now = new Date()
    const thirtyDaysAgo = subDays(now, 30)
    const sevenDaysAgo = subDays(now, 7)
    
    const stats: UserStats = {
      total: userData.length,
      active: userData.filter(u => u.status === 'active').length,
      inactive: userData.filter(u => u.status === 'inactive').length,
      suspended: userData.filter(u => u.status === 'suspended').length,
      admins: userData.filter(u => u.role === 'admin').length,
      managers: userData.filter(u => u.role === 'manager').length,
      users: userData.filter(u => u.role === 'user').length,
      recentlyActive: userData.filter(u => 
        u.last_login && isAfter(new Date(u.last_login), sevenDaysAgo)
      ).length,
      newThisMonth: userData.filter(u => 
        u.created_at && isAfter(new Date(u.created_at), thirtyDaysAgo)
      ).length
    }

    setStats(stats)
  }

  const applyFilters = () => {
    let filtered = users

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(u =>
        u.full_name?.toLowerCase().includes(searchLower) ||
        u.email?.toLowerCase().includes(searchLower) ||
        u.department?.toLowerCase().includes(searchLower) ||
        u.phone?.toLowerCase().includes(searchLower)
      )
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (['active', 'inactive', 'suspended'].includes(statusFilter)) {
        filtered = filtered.filter(u => u.status === statusFilter)
      } else if (['admin', 'manager', 'user'].includes(statusFilter)) {
        filtered = filtered.filter(u => u.role === statusFilter)
      }
    }

    // Role filter
    if (roleFilter !== 'all') {
      filtered = filtered.filter(u => u.role === roleFilter)
    }

    // Department filter
    if (departmentFilter !== 'all') {
      filtered = filtered.filter(u => u.department === departmentFilter)
    }

    setFilteredUsers(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const updateUserStatus = async (userId: string, status: 'active' | 'inactive' | 'suspended') => {
    setActionLoading(userId)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw new Error(`Failed to update user status: ${error.message}`)

      setUsers(prev =>
        prev.map(u => u.id === userId ? { ...u, status } : u)
      )

      toast({
        title: "Success",
        description: `User status updated to ${status}`,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user status'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const updateUserRole = async (userId: string, role: 'admin' | 'manager' | 'user') => {
    setActionLoading(userId)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          role,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId)

      if (error) throw new Error(`Failed to update user role: ${error.message}`)

      setUsers(prev =>
        prev.map(u => u.id === userId ? { ...u, role } : u)
      )

      toast({
        title: "Success",
        description: `User role updated to ${role}`,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update user role'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const deleteUser = async (userId: string) => {
    setActionLoading(userId)
    try {
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (error) throw new Error(`Failed to delete user: ${error.message}`)

      setUsers(prev => prev.filter(u => u.id !== userId))

      toast({
        title: "Success",
        description: "User deleted successfully",
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete user'
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      })
    } finally {
      setActionLoading(null)
    }
  }

  const exportUsers = () => {
    const headers = [
      'ID', 'Email', 'Full Name', 'Role', 'Department', 'Status',
      'Last Login', 'Created At', 'Phone', 'Timezone'
    ]
    
    const csvData = filteredUsers.map(u => [
      u.id,
      u.email,
      u.full_name || '',
      u.role || '',
      u.department || '',
      u.status || '',
      u.last_login || '',
      u.created_at || '',
      u.phone || '',
      u.timezone || ''
    ])

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `users-${format(new Date(), 'yyyy-MM-dd')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearFilters = () => {
    setSearchTerm('')
    setStatusFilter('all')
    setRoleFilter('all')
    setDepartmentFilter('all')
  }

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle2 className="w-3 h-3 mr-1" />Active</Badge>
      case 'inactive':
        return <Badge className="bg-gray-100 text-gray-800"><Clock className="w-3 h-3 mr-1" />Inactive</Badge>
      case 'suspended':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Suspended</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  // Pagination
  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + itemsPerPage)

  // Get unique departments for filter
  const departments = Array.from(new Set(users.map(u => u.department).filter(Boolean)))

  // Show loading state while authentication is being checked
  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
          <span className="ml-2">Checking authentication...</span>
        </div>
      </div>
    )
  }

  // Show authentication required message
  if (!isAuthenticated || !currentUserProfile) {
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

  // Show access denied for non-admin users
  if (!isAdmin) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>User Management</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <Shield className="h-5 w-5 mr-2" />
            <span>Administrator access required</span>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">
            Manage user accounts, roles, and permissions across the system.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportUsers}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button onClick={() => setShowCreateModal(true)}>
            <UserPlus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-destructive/15 border border-destructive/20 rounded-lg p-4">
          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-destructive mr-2" />
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
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Users</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-600">{stats.active}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recently Active</p>
                <p className="text-2xl font-bold text-blue-600">{stats.recentlyActive}</p>
              </div>
              <Activity className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">New This Month</p>
                <p className="text-2xl font-bold text-purple-600">{stats.newThisMonth}</p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters & Search
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="grid gap-4 md:grid-cols-5">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              
              <Select value={statusFilter} onValueChange={(value: UserFilter) => setStatusFilter(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Roles" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="user">User</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Departments" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map(dept => (
                    <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center justify-between">
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={clearFilters}
                  size="sm"
                >
                  Clear Filters
                </Button>
                <span className="text-sm text-muted-foreground self-center">
                  {filteredUsers.length} users
                </span>
              </div>
              
              {selectedUsers.length > 0 && (
                <div className="flex gap-2">
                  <span className="text-sm text-muted-foreground self-center">
                    {selectedUsers.length} selected
                  </span>
                  <Button variant="outline" size="sm">
                    <Ban className="mr-2 h-4 w-4" />
                    Suspend
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="destructive" size="sm">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Users</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {selectedUsers.length} users? 
                          This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Users Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Users ({filteredUsers.length})
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={selectedUsers.length === paginatedUsers.length && paginatedUsers.length > 0}
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedUsers(paginatedUsers.map(u => u.id))
                  } else {
                    setSelectedUsers([])
                  }
                }}
              />
              <span className="text-sm text-muted-foreground">Select All</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paginatedUsers.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No users found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {filteredUsers.length === 0 && users.length === 0
                  ? "No users have been created yet."
                  : "Try adjusting your filters to see more results."
                }
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <span className="sr-only">Select</span>
                    </TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  {paginatedUsers.map((user) => {
                    const isSelected = selectedUsers.includes(user.id)
                    
                    return (
                      <TableRow key={user.id} className={isSelected ? 'bg-muted/50' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={isSelected}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedUsers(prev => [...prev, user.id])
                              } else {
                                setSelectedUsers(prev => prev.filter(id => id !== user.id))
                              }
                            }}
                          />
                        </TableCell>
                        
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <UserAvatar user={user} size="sm" />
                            <div>
                              <div className="font-medium">{user.full_name || 'No name'}</div>
                              <div className="text-sm text-muted-foreground">{user.email}</div>
                              {user.phone && (
                                <div className="text-xs text-muted-foreground flex items-center">
                                  <Phone className="mr-1 h-3 w-3" />
                                  {user.phone}
                                </div>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        
                        <TableCell>
                          <UserRoleBadge role={user.role} />
                        </TableCell>
                        
                        <TableCell>
                          {user.department ? (
                            <Badge variant="outline">{user.department}</Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          {getStatusBadge(user.status)}
                        </TableCell>
                        
                        <TableCell>
                          {user.last_login ? (
                            <div className="text-sm">
                              <div>{formatDistanceToNow(new Date(user.last_login), { addSuffix: true })}</div>
                              <div className="text-xs text-muted-foreground">
                                {format(new Date(user.last_login), 'MMM dd, yyyy')}
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">Never</span>
                          )}
                        </TableCell>
                        
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm" disabled={actionLoading === user.id}>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              
                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedUser(user)
                                  setShowUserModal(true)
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem>
                                <Edit className="mr-2 h-4 w-4" />
                                Edit User
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              <DropdownMenuItem
                                onClick={() => updateUserRole(user.id, user.role === 'admin' ? 'user' : 'admin')}
                                disabled={actionLoading === user.id}
                              >
                                <Shield className="mr-2 h-4 w-4" />
                                {user.role === 'admin' ? 'Remove Admin' : 'Make Admin'}
                              </DropdownMenuItem>
                              
                              <DropdownMenuItem
                                onClick={() => updateUserStatus(user.id, user.status === 'active' ? 'suspended' : 'active')}
                                disabled={actionLoading === user.id}
                              >
                                <Ban className="mr-2 h-4 w-4" />
                                {user.status === 'active' ? 'Suspend' : 'Activate'}
                              </DropdownMenuItem>
                              
                              <DropdownMenuSeparator />
                              
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                    <Trash2 className="mr-2 h-4 w-4 text-destructive" />
                                    <span className="text-destructive">Delete</span>
                                  </DropdownMenuItem>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Delete User</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete {user.full_name || user.email}? 
                                      This action cannot be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                    <AlertDialogAction 
                                      onClick={() => deleteUser(user.id)}
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                      disabled={actionLoading === user.id}
                                    >
                                      {actionLoading === user.id ? 'Deleting...' : 'Delete'}
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-6">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredUsers.length)} of {filteredUsers.length} users
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <span className="text-sm">
                  Page {currentPage} of {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* User Details Modal */}
      {selectedUser && (
        <Dialog open={showUserModal} onOpenChange={setShowUserModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                User Details: {selectedUser.full_name || selectedUser.email}
              </DialogTitle>
              <DialogDescription>
                Complete user information and activity
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <UserAvatar user={selectedUser} size="lg" />
                <div>
                  <h3 className="text-lg font-semibold">{selectedUser.full_name || 'No name set'}</h3>
                  <p className="text-muted-foreground">{selectedUser.email}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <UserRoleBadge role={selectedUser.role} />
                    {getStatusBadge(selectedUser.status)}
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Department</Label>
                  <p className="text-sm">{selectedUser.department || 'Not set'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Phone</Label>
                  <p className="text-sm">{selectedUser.phone || 'Not set'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Timezone</Label>
                  <p className="text-sm">{selectedUser.timezone || 'Not set'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Language</Label>
                  <p className="text-sm">{selectedUser.language || 'Not set'}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Last Login</Label>
                  <p className="text-sm">
                    {selectedUser.last_login 
                      ? format(new Date(selectedUser.last_login), 'PPpp')
                      : 'Never'
                    }
                  </p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created</Label>
                  <p className="text-sm">
                    {selectedUser.created_at 
                      ? format(new Date(selectedUser.created_at), 'PPP')
                      : 'Unknown'
                    }
                  </p>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowUserModal(false)}>
                Close
              </Button>
              <Button>
                <Edit className="mr-2 h-4 w-4" />
                Edit User
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}