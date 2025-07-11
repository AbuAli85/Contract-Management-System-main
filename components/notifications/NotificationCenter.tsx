"use client"

import { useEffect, useState, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  BellRing,
  Trash2,
  Eye,
  EyeOff,
  Search,
  Download,
  Link as LinkIcon,
  MoreHorizontal,
  Filter,
  RefreshCw,
  Settings,
  Archive,
  Star,
  Clock,
  Users,
  TrendingUp,
  Calendar,
} from "lucide-react"
import {
  format,
  formatDistanceToNow,
  isAfter,
  isBefore,
  parseISO,
  subDays,
  startOfDay,
  endOfDay,
} from "date-fns"
import { supabase } from "@/lib/supabase"
import { LoadingSpinner } from "@/components/ui/skeletons"

interface NotificationItem {
  id: string
  type: "success" | "error" | "warning" | "info"
  message: string
  created_at: string
  user_email?: string
  related_contract_id?: string
  related_entity_id?: string
  related_entity_type?: string
  is_read: boolean
  is_starred?: boolean
  is_archived?: boolean
  priority?: "low" | "medium" | "high" | "urgent"
  category?: string
  metadata?: Record<string, any>
}

interface NotificationStats {
  total: number
  unread: number
  starred: number
  archived: number
  byType: Record<string, number>
  byPriority: Record<string, number>
  recentActivity: number
}

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
}

const getIconColor = (type: string) => {
  switch (type) {
    case "success":
      return "text-green-500"
    case "error":
      return "text-red-500"
    case "warning":
      return "text-orange-500"
    case "info":
      return "text-blue-500"
    default:
      return "text-gray-500"
  }
}

const getPriorityColor = (priority?: string) => {
  switch (priority) {
    case "urgent":
      return "bg-red-100 text-red-800"
    case "high":
      return "bg-orange-100 text-orange-800"
    case "medium":
      return "bg-yellow-100 text-yellow-800"
    case "low":
      return "bg-gray-100 text-gray-800"
    default:
      return "bg-gray-100 text-gray-800"
  }
}

export function NotificationCenter() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  // Filters
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  // Stats
  const [stats, setStats] = useState<NotificationStats>({
    total: 0,
    unread: 0,
    starred: 0,
    archived: 0,
    byType: {},
    byPriority: {},
    recentActivity: 0,
  })

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications()
      setupRealtimeSubscription()
    }
  }, [isAuthenticated])

  useEffect(() => {
    applyFilters()
  }, [
    notifications,
    searchTerm,
    typeFilter,
    statusFilter,
    priorityFilter,
    dateFilter,
    categoryFilter,
  ])

  const fetchNotifications = async () => {
    try {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from("notifications")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(1000)

      if (fetchError) {
        throw new Error(`Failed to fetch notifications: ${fetchError.message}`)
      }

      const enhancedNotifications = (data || []).map((notification) => ({
        ...notification,
        priority: notification.priority || "medium",
        category: notification.category || "general",
      }))

      setNotifications(enhancedNotifications)
      calculateStats(enhancedNotifications)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load notifications"
      setError(errorMessage)
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel("notifications_realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications" },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newNotification = payload.new as NotificationItem
            setNotifications((prev) => [newNotification, ...prev])
            toast({
              title: "New Notification",
              description: newNotification.message,
            })
          } else if (payload.eventType === "UPDATE") {
            setNotifications((prev) =>
              prev.map((n) => (n.id === payload.new.id ? (payload.new as NotificationItem) : n))
            )
          } else if (payload.eventType === "DELETE") {
            setNotifications((prev) => prev.filter((n) => n.id !== payload.old.id))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const calculateStats = (notificationData: NotificationItem[]) => {
    const now = new Date()
    const yesterday = subDays(now, 1)

    const stats: NotificationStats = {
      total: notificationData.length,
      unread: notificationData.filter((n) => !n.is_read).length,
      starred: notificationData.filter((n) => n.is_starred).length,
      archived: notificationData.filter((n) => n.is_archived).length,
      byType: {},
      byPriority: {},
      recentActivity: notificationData.filter((n) => isAfter(parseISO(n.created_at), yesterday))
        .length,
    }

    // Calculate type distribution
    notificationData.forEach((n) => {
      stats.byType[n.type] = (stats.byType[n.type] || 0) + 1
      stats.byPriority[n.priority || "medium"] = (stats.byPriority[n.priority || "medium"] || 0) + 1
    })

    setStats(stats)
  }

  const applyFilters = () => {
    let filtered = notifications

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (n) =>
          n.message.toLowerCase().includes(searchLower) ||
          n.user_email?.toLowerCase().includes(searchLower) ||
          n.category?.toLowerCase().includes(searchLower)
      )
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((n) => n.type === typeFilter)
    }

    // Status filter
    if (statusFilter === "unread") {
      filtered = filtered.filter((n) => !n.is_read)
    } else if (statusFilter === "read") {
      filtered = filtered.filter((n) => n.is_read)
    } else if (statusFilter === "starred") {
      filtered = filtered.filter((n) => n.is_starred)
    } else if (statusFilter === "archived") {
      filtered = filtered.filter((n) => n.is_archived)
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((n) => n.priority === priorityFilter)
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date()
      let dateThreshold: Date

      switch (dateFilter) {
        case "today":
          dateThreshold = startOfDay(now)
          break
        case "week":
          dateThreshold = subDays(now, 7)
          break
        case "month":
          dateThreshold = subDays(now, 30)
          break
        default:
          dateThreshold = new Date(0)
      }

      filtered = filtered.filter((n) => isAfter(parseISO(n.created_at), dateThreshold))
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((n) => n.category === categoryFilter)
    }

    setFilteredNotifications(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const toggleNotificationRead = async (notificationId: string) => {
    const notification = notifications.find((n) => n.id === notificationId)
    if (!notification) return

    setActionLoading(notificationId)
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: !notification.is_read })
        .eq("id", notificationId)

      if (error) throw new Error(`Failed to update notification: ${error.message}`)

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: !n.is_read } : n))
      )

      toast({
        title: "Success",
        description: `Marked as ${!notification.is_read ? "read" : "unread"}`,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update notification"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const toggleNotificationStar = async (notificationId: string) => {
    const notification = notifications.find((n) => n.id === notificationId)
    if (!notification) return

    setActionLoading(notificationId)
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_starred: !notification.is_starred })
        .eq("id", notificationId)

      if (error) throw new Error(`Failed to update notification: ${error.message}`)

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_starred: !n.is_starred } : n))
      )

      toast({
        title: "Success",
        description: `${!notification.is_starred ? "Starred" : "Unstarred"} notification`,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to update notification"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const bulkMarkAsRead = async () => {
    if (selectedNotifications.length === 0) return

    setActionLoading("bulk-read")
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true })
        .in("id", selectedNotifications)

      if (error) throw new Error(`Failed to mark notifications as read: ${error.message}`)

      setNotifications((prev) =>
        prev.map((n) => (selectedNotifications.includes(n.id) ? { ...n, is_read: true } : n))
      )

      setSelectedNotifications([])
      toast({
        title: "Success",
        description: `Marked ${selectedNotifications.length} notifications as read`,
      })
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to mark notifications as read"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const bulkArchive = async () => {
    if (selectedNotifications.length === 0) return

    setActionLoading("bulk-archive")
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_archived: true })
        .in("id", selectedNotifications)

      if (error) throw new Error(`Failed to archive notifications: ${error.message}`)

      setNotifications((prev) =>
        prev.map((n) => (selectedNotifications.includes(n.id) ? { ...n, is_archived: true } : n))
      )

      setSelectedNotifications([])
      toast({
        title: "Success",
        description: `Archived ${selectedNotifications.length} notifications`,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to archive notifications"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const bulkDelete = async () => {
    if (selectedNotifications.length === 0) return

    setActionLoading("bulk-delete")
    try {
      const { error } = await supabase
        .from("notifications")
        .delete()
        .in("id", selectedNotifications)

      if (error) throw new Error(`Failed to delete notifications: ${error.message}`)

      setNotifications((prev) => prev.filter((n) => !selectedNotifications.includes(n.id)))

      setSelectedNotifications([])
      toast({
        title: "Success",
        description: `Deleted ${selectedNotifications.length} notifications`,
      })
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to delete notifications"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setActionLoading(null)
    }
  }

  const exportNotifications = () => {
    const headers = [
      "ID",
      "Type",
      "Message",
      "User Email",
      "Priority",
      "Category",
      "Created At",
      "Is Read",
      "Is Starred",
      "Is Archived",
    ]

    const csvData = filteredNotifications.map((n) => [
      n.id,
      n.type,
      `"${n.message.replace(/"/g, '""')}"`,
      n.user_email || "",
      n.priority || "",
      n.category || "",
      n.created_at,
      n.is_read ? "Yes" : "No",
      n.is_starred ? "Yes" : "No",
      n.is_archived ? "Yes" : "No",
    ])

    const csvContent = [headers.join(","), ...csvData.map((row) => row.join(","))].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `notifications-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const clearFilters = () => {
    setSearchTerm("")
    setTypeFilter("all")
    setStatusFilter("all")
    setPriorityFilter("all")
    setDateFilter("all")
    setCategoryFilter("all")
  }

  // Pagination
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedNotifications = filteredNotifications.slice(startIndex, startIndex + itemsPerPage)

  // Get unique categories for filter
  const categories = Array.from(new Set(notifications.map((n) => n.category).filter(Boolean)))

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
  if (!isAuthenticated || !user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Notification Center</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <AlertTriangle className="mr-2 h-5 w-5" />
            <span>Authentication required to access notifications</span>
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
                <div className="mb-2 h-4 w-3/4 rounded bg-gray-200"></div>
                <div className="h-8 w-1/2 rounded bg-gray-200"></div>
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
          <h1 className="text-3xl font-bold tracking-tight">Notification Center</h1>
          <p className="text-muted-foreground">
            Manage and track all system notifications with advanced filtering and analytics.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={fetchNotifications} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportNotifications}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/15 p-4">
          <div className="flex items-center">
            <XCircle className="mr-2 h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
              ��
            </Button>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <BellRing className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold text-blue-600">{stats.unread}</p>
              </div>
              <Eye className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Starred</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.starred}</p>
              </div>
              <Star className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Archived</p>
                <p className="text-2xl font-bold text-gray-600">{stats.archived}</p>
              </div>
              <Archive className="h-8 w-8 text-gray-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recent</p>
                <p className="text-2xl font-bold text-green-600">{stats.recentActivity}</p>
              </div>
              <Clock className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Selected</p>
                <p className="text-2xl font-bold text-purple-600">{selectedNotifications.length}</p>
              </div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="mr-2 h-5 w-5" />
            Filters & Actions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Search and Filters */}
            <div className="grid gap-4 md:grid-cols-6">
              <div className="md:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
                  <Input
                    placeholder="Search notifications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="success">Success</SelectItem>
                  <SelectItem value="error">Error</SelectItem>
                  <SelectItem value="warning">Warning</SelectItem>
                  <SelectItem value="info">Info</SelectItem>
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                  <SelectItem value="starred">Starred</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priorities</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="All Time" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="today">Today</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            <div className="flex flex-col items-start justify-between gap-2 sm:flex-row sm:items-center">
              <div className="flex gap-2">
                <Button variant="outline" onClick={clearFilters} size="sm">
                  Clear Filters
                </Button>
                <span className="self-center text-sm text-muted-foreground">
                  {filteredNotifications.length} notifications
                </span>
              </div>

              {selectedNotifications.length > 0 && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={bulkMarkAsRead}
                    disabled={actionLoading === "bulk-read"}
                  >
                    <Eye className="mr-2 h-4 w-4" />
                    Mark Read ({selectedNotifications.length})
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={bulkArchive}
                    disabled={actionLoading === "bulk-archive"}
                  >
                    <Archive className="mr-2 h-4 w-4" />
                    Archive
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="destructive"
                        size="sm"
                        disabled={actionLoading === "bulk-delete"}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete Notifications</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete {selectedNotifications.length}{" "}
                          notifications? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={bulkDelete}>Delete</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notifications List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <BellRing className="mr-2 h-5 w-5" />
              Notifications ({filteredNotifications.length})
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                checked={
                  selectedNotifications.length === paginatedNotifications.length &&
                  paginatedNotifications.length > 0
                }
                onCheckedChange={(checked) => {
                  if (checked) {
                    setSelectedNotifications(paginatedNotifications.map((n) => n.id))
                  } else {
                    setSelectedNotifications([])
                  }
                }}
              />
              <span className="text-sm text-muted-foreground">Select All</span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {paginatedNotifications.length === 0 ? (
            <div className="py-12 text-center">
              <BellRing className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-sm font-semibold">No notifications found</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                {filteredNotifications.length === 0 && notifications.length === 0
                  ? "You're all caught up! New notifications will appear here."
                  : "Try adjusting your filters to see more results."}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {paginatedNotifications.map((notification) => {
                const IconComponent = iconMap[notification.type]
                const isSelected = selectedNotifications.includes(notification.id)

                return (
                  <div
                    key={notification.id}
                    className={`flex items-start gap-3 rounded-lg border p-4 transition-colors hover:bg-muted/50 ${
                      !notification.is_read ? "border-blue-200 bg-blue-50" : "bg-background"
                    } ${isSelected ? "ring-2 ring-primary" : ""}`}
                  >
                    <Checkbox
                      checked={isSelected}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedNotifications((prev) => [...prev, notification.id])
                        } else {
                          setSelectedNotifications((prev) =>
                            prev.filter((id) => id !== notification.id)
                          )
                        }
                      }}
                    />

                    <div className="flex-shrink-0">
                      <IconComponent className={`h-5 w-5 ${getIconColor(notification.type)}`} />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">
                            {notification.message}
                          </p>
                          <div className="mt-1 flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(parseISO(notification.created_at), {
                                addSuffix: true,
                              })}
                            </span>
                            {notification.user_email && (
                              <span className="text-xs text-muted-foreground">
                                • {notification.user_email}
                              </span>
                            )}
                            {notification.priority && (
                              <Badge
                                variant="secondary"
                                className={`text-xs ${getPriorityColor(notification.priority)}`}
                              >
                                {notification.priority}
                              </Badge>
                            )}
                            {notification.category && (
                              <Badge variant="outline" className="text-xs">
                                {notification.category}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1">
                          {notification.is_starred && (
                            <Star className="h-4 w-4 fill-current text-yellow-500" />
                          )}

                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>

                              <DropdownMenuItem
                                onClick={() => {
                                  setSelectedNotification(notification)
                                  setShowDetailsModal(true)
                                }}
                              >
                                <Eye className="mr-2 h-4 w-4" />
                                View Details
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => toggleNotificationRead(notification.id)}
                                disabled={actionLoading === notification.id}
                              >
                                {notification.is_read ? (
                                  <EyeOff className="mr-2 h-4 w-4" />
                                ) : (
                                  <Eye className="mr-2 h-4 w-4" />
                                )}
                                Mark as {notification.is_read ? "Unread" : "Read"}
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onClick={() => toggleNotificationStar(notification.id)}
                                disabled={actionLoading === notification.id}
                              >
                                <Star className="mr-2 h-4 w-4" />
                                {notification.is_starred ? "Unstar" : "Star"}
                              </DropdownMenuItem>

                              <DropdownMenuSeparator />

                              {notification.related_contract_id && (
                                <DropdownMenuItem asChild>
                                  <a href={`/contracts/${notification.related_contract_id}`}>
                                    <LinkIcon className="mr-2 h-4 w-4" />
                                    View Contract
                                  </a>
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to{" "}
                {Math.min(startIndex + itemsPerPage, filteredNotifications.length)} of{" "}
                {filteredNotifications.length} notifications
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
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
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Notification Details Modal */}
      {selectedNotification && (
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {React.createElement(iconMap[selectedNotification.type], {
                  className: `h-5 w-5 ${getIconColor(selectedNotification.type)}`,
                })}
                Notification Details
              </DialogTitle>
              <DialogDescription>Complete information about this notification</DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">Type</Label>
                  <p className="text-sm capitalize">{selectedNotification.type}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Priority</Label>
                  <Badge className={getPriorityColor(selectedNotification.priority)}>
                    {selectedNotification.priority || "medium"}
                  </Badge>
                </div>
                <div>
                  <Label className="text-sm font-medium">Category</Label>
                  <p className="text-sm">{selectedNotification.category || "General"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Status</Label>
                  <div className="flex items-center gap-2">
                    {selectedNotification.is_read ? (
                      <Badge variant="secondary">Read</Badge>
                    ) : (
                      <Badge variant="default">Unread</Badge>
                    )}
                    {selectedNotification.is_starred && <Badge variant="outline">Starred</Badge>}
                    {selectedNotification.is_archived && <Badge variant="outline">Archived</Badge>}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">Message</Label>
                <p className="mt-1 rounded-md bg-muted p-3 text-sm">
                  {selectedNotification.message}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-sm font-medium">User Email</Label>
                  <p className="text-sm">{selectedNotification.user_email || "N/A"}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium">Created At</Label>
                  <p className="text-sm">
                    {format(parseISO(selectedNotification.created_at), "PPpp")}
                  </p>
                </div>
              </div>

              {(selectedNotification.related_contract_id ||
                selectedNotification.related_entity_id) && (
                <div>
                  <Label className="text-sm font-medium">Related Links</Label>
                  <div className="mt-1 flex gap-2">
                    {selectedNotification.related_contract_id && (
                      <Button variant="outline" size="sm" asChild>
                        <a href={`/contracts/${selectedNotification.related_contract_id}`}>
                          <LinkIcon className="mr-2 h-4 w-4" />
                          View Contract
                        </a>
                      </Button>
                    )}
                    {selectedNotification.related_entity_id && (
                      <Button variant="outline" size="sm" asChild>
                        <a
                          href={`/${selectedNotification.related_entity_type || "entity"}/${selectedNotification.related_entity_id}`}
                        >
                          <LinkIcon className="mr-2 h-4 w-4" />
                          View {selectedNotification.related_entity_type || "Entity"}
                        </a>
                      </Button>
                    )}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
              <Button onClick={() => toggleNotificationRead(selectedNotification.id)}>
                Mark as {selectedNotification.is_read ? "Unread" : "Read"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
