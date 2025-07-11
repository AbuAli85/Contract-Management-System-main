"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { supabase } from "@/lib/supabase"
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
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Bell,
  Mail,
  MessageSquare,
  Phone,
  Send,
  Search,
  Filter,
  RefreshCw,
  MoreHorizontal,
  Star,
  Archive,
  Trash2,
  Eye,
  EyeOff,
  Download,
  Upload,
  Plus,
  Settings,
  Users,
  Calendar,
  Clock,
  AlertTriangle,
  CheckCircle2,
  Info,
  AlertCircle,
  Zap,
  Globe,
  Smartphone,
  Monitor,
  Volume2,
  VolumeX,
  Target,
  Activity,
  TrendingUp,
  BarChart3,
} from "lucide-react"
import { format, formatDistanceToNow, isToday, isYesterday, subDays } from "date-fns"
import { LoadingSpinner } from "@/components/ui/skeletons"

interface NotificationItem {
  id: string
  type: "contract" | "promoter" | "party" | "system" | "payment" | "deadline" | "workflow"
  category: "info" | "success" | "warning" | "error" | "urgent"
  priority: "low" | "medium" | "high" | "urgent"
  title: string
  message: string
  user_id?: string
  user_email?: string
  is_read: boolean
  is_starred: boolean
  is_archived: boolean
  action_url?: string
  action_label?: string
  metadata?: Record<string, any>
  created_at: string
  updated_at?: string
  expires_at?: string
}

interface CommunicationTemplate {
  id: string
  name: string
  type: "email" | "sms" | "push" | "in_app"
  subject?: string
  content: string
  variables: string[]
  is_active: boolean
  created_at: string
  updated_at?: string
}

interface CommunicationStats {
  total: number
  unread: number
  starred: number
  archived: number
  urgent: number
  byType: Record<string, number>
  byCategory: Record<string, number>
  byPriority: Record<string, number>
  recentActivity: number
  responseRate: number
  deliveryRate: number
}

interface NotificationSettings {
  email_enabled: boolean
  push_enabled: boolean
  sms_enabled: boolean
  in_app_enabled: boolean
  quiet_hours_enabled: boolean
  quiet_hours_start: string
  quiet_hours_end: string
  categories: {
    contract: boolean
    promoter: boolean
    party: boolean
    system: boolean
    payment: boolean
    deadline: boolean
    workflow: boolean
  }
  priorities: {
    low: boolean
    medium: boolean
    high: boolean
    urgent: boolean
  }
  digest_frequency: "immediate" | "hourly" | "daily" | "weekly" | "never"
  auto_archive_days: number
}

type FilterType = "all" | "unread" | "starred" | "archived" | "urgent"
type SortType = "newest" | "oldest" | "priority" | "type"

export function EnhancedCommunicationCenter() {
  const { user, isAuthenticated, loading: authLoading } = useAuth()
  const { toast } = useToast()

  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<NotificationItem[]>([])
  const [templates, setTemplates] = useState<CommunicationTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [refreshing, setRefreshing] = useState(false)

  // Selection and modals
  const [selectedNotifications, setSelectedNotifications] = useState<string[]>([])
  const [selectedNotification, setSelectedNotification] = useState<NotificationItem | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showComposeModal, setShowComposeModal] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [showTemplateModal, setShowTemplateModal] = useState(false)

  // Filters and search
  const [searchTerm, setSearchTerm] = useState("")
  const [typeFilter, setTypeFilter] = useState<string>("all")
  const [statusFilter, setStatusFilter] = useState<FilterType>("all")
  const [priorityFilter, setPriorityFilter] = useState<string>("all")
  const [categoryFilter, setCategoryFilter] = useState<string>("all")
  const [dateFilter, setDateFilter] = useState<string>("all")
  const [sortBy, setSortBy] = useState<SortType>("newest")

  // Pagination
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage] = useState(20)

  // Stats
  const [stats, setStats] = useState<CommunicationStats>({
    total: 0,
    unread: 0,
    starred: 0,
    archived: 0,
    urgent: 0,
    byType: {},
    byCategory: {},
    byPriority: {},
    recentActivity: 0,
    responseRate: 0,
    deliveryRate: 0,
  })

  // Settings
  const [settings, setSettings] = useState<NotificationSettings>({
    email_enabled: true,
    push_enabled: true,
    sms_enabled: false,
    in_app_enabled: true,
    quiet_hours_enabled: false,
    quiet_hours_start: "22:00",
    quiet_hours_end: "08:00",
    categories: {
      contract: true,
      promoter: true,
      party: true,
      system: true,
      payment: true,
      deadline: true,
      workflow: true,
    },
    priorities: {
      low: true,
      medium: true,
      high: true,
      urgent: true,
    },
    digest_frequency: "immediate",
    auto_archive_days: 30,
  })

  // Compose form
  const [composeForm, setComposeForm] = useState({
    type: "email" as "email" | "sms" | "push" | "in_app",
    recipients: "",
    subject: "",
    message: "",
    priority: "medium" as "low" | "medium" | "high" | "urgent",
    category: "info" as "info" | "success" | "warning" | "error" | "urgent",
    schedule_at: "",
    template_id: "",
  })

  useEffect(() => {
    if (isAuthenticated) {
      fetchNotifications()
      fetchTemplates()
      fetchSettings()
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
    categoryFilter,
    dateFilter,
    sortBy,
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
        type: notification.type || "system",
        category: notification.category || "info",
        priority: notification.priority || "medium",
        is_read: notification.is_read || false,
        is_starred: notification.is_starred || false,
        is_archived: notification.is_archived || false,
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

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from("communication_templates")
        .select("*")
        .eq("is_active", true)
        .order("name")

      if (error) {
        console.warn("Error fetching templates:", error)
        return
      }

      setTemplates(data || [])
    } catch (error) {
      console.warn("Error fetching communication templates:", error)
    }
  }

  const fetchSettings = async () => {
    try {
      if (!user) return

      const { data, error } = await supabase
        .from("user_notification_settings")
        .select("*")
        .eq("user_id", user.id)
        .single()

      if (error && error.code !== "PGRST116") {
        console.warn("Error fetching notification settings:", error)
        return
      }

      if (data) {
        setSettings((prev) => ({ ...prev, ...data.settings }))
      }
    } catch (error) {
      console.warn("Error fetching notification settings:", error)
    }
  }

  const calculateStats = (notificationData: NotificationItem[]) => {
    const now = new Date()
    const yesterday = subDays(now, 1)

    const stats: CommunicationStats = {
      total: notificationData.length,
      unread: notificationData.filter((n) => !n.is_read).length,
      starred: notificationData.filter((n) => n.is_starred).length,
      archived: notificationData.filter((n) => n.is_archived).length,
      urgent: notificationData.filter((n) => n.priority === "urgent").length,
      byType: {},
      byCategory: {},
      byPriority: {},
      recentActivity: notificationData.filter((n) => new Date(n.created_at) > yesterday).length,
      responseRate: 85, // This would come from actual response tracking
      deliveryRate: 98, // This would come from actual delivery tracking
    }

    // Calculate distributions
    notificationData.forEach((n) => {
      stats.byType[n.type] = (stats.byType[n.type] || 0) + 1
      stats.byCategory[n.category] = (stats.byCategory[n.category] || 0) + 1
      stats.byPriority[n.priority] = (stats.byPriority[n.priority] || 0) + 1
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
          n.title.toLowerCase().includes(searchLower) ||
          n.message.toLowerCase().includes(searchLower) ||
          n.user_email?.toLowerCase().includes(searchLower)
      )
    }

    // Status filter
    if (statusFilter !== "all") {
      switch (statusFilter) {
        case "unread":
          filtered = filtered.filter((n) => !n.is_read)
          break
        case "starred":
          filtered = filtered.filter((n) => n.is_starred)
          break
        case "archived":
          filtered = filtered.filter((n) => n.is_archived)
          break
        case "urgent":
          filtered = filtered.filter((n) => n.priority === "urgent")
          break
      }
    }

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((n) => n.type === typeFilter)
    }

    // Priority filter
    if (priorityFilter !== "all") {
      filtered = filtered.filter((n) => n.priority === priorityFilter)
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter((n) => n.category === categoryFilter)
    }

    // Date filter
    if (dateFilter !== "all") {
      const now = new Date()
      switch (dateFilter) {
        case "today":
          filtered = filtered.filter((n) => isToday(new Date(n.created_at)))
          break
        case "yesterday":
          filtered = filtered.filter((n) => isYesterday(new Date(n.created_at)))
          break
        case "week":
          filtered = filtered.filter((n) => new Date(n.created_at) > subDays(now, 7))
          break
        case "month":
          filtered = filtered.filter((n) => new Date(n.created_at) > subDays(now, 30))
          break
      }
    }

    // Sort
    switch (sortBy) {
      case "newest":
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        break
      case "oldest":
        filtered.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
        break
      case "priority":
        const priorityOrder = { urgent: 4, high: 3, medium: 2, low: 1 }
        filtered.sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority])
        break
      case "type":
        filtered.sort((a, b) => a.type.localeCompare(b.type))
        break
    }

    setFilteredNotifications(filtered)
    setCurrentPage(1) // Reset to first page when filters change
  }

  const setupRealtimeSubscription = () => {
    if (!user) return

    const channel = supabase
      .channel("notifications_realtime")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            const newNotification = payload.new as NotificationItem
            setNotifications((prev) => [newNotification, ...prev])

            // Show toast for new notification
            toast({
              title: newNotification.title,
              description: newNotification.message,
            })
          } else if (payload.eventType === "UPDATE") {
            const updatedNotification = payload.new as NotificationItem
            setNotifications((prev) =>
              prev.map((n) => (n.id === updatedNotification.id ? updatedNotification : n))
            )
          } else if (payload.eventType === "DELETE") {
            const deletedId = payload.old.id
            setNotifications((prev) => prev.filter((n) => n.id !== deletedId))
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    try {
      await fetchNotifications()
      toast({
        title: "Success",
        description: "Notifications refreshed successfully",
      })
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to refresh notifications",
        variant: "destructive",
      })
    } finally {
      setRefreshing(false)
    }
  }

  const markAsRead = async (notificationIds: string[]) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_read: true, updated_at: new Date().toISOString() })
        .in("id", notificationIds)

      if (error) throw new Error(`Failed to mark as read: ${error.message}`)

      setNotifications((prev) =>
        prev.map((n) => (notificationIds.includes(n.id) ? { ...n, is_read: true } : n))
      )

      toast({
        title: "Success",
        description: `Marked ${notificationIds.length} notifications as read`,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to mark as read"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const markAsStarred = async (notificationId: string, starred: boolean) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_starred: starred, updated_at: new Date().toISOString() })
        .eq("id", notificationId)

      if (error) throw new Error(`Failed to update star status: ${error.message}`)

      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_starred: starred } : n))
      )
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to update star status"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const archiveNotifications = async (notificationIds: string[]) => {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ is_archived: true, updated_at: new Date().toISOString() })
        .in("id", notificationIds)

      if (error) throw new Error(`Failed to archive: ${error.message}`)

      setNotifications((prev) =>
        prev.map((n) => (notificationIds.includes(n.id) ? { ...n, is_archived: true } : n))
      )

      toast({
        title: "Success",
        description: `Archived ${notificationIds.length} notifications`,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to archive"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const deleteNotifications = async (notificationIds: string[]) => {
    try {
      const { error } = await supabase.from("notifications").delete().in("id", notificationIds)

      if (error) throw new Error(`Failed to delete: ${error.message}`)

      setNotifications((prev) => prev.filter((n) => !notificationIds.includes(n.id)))

      toast({
        title: "Success",
        description: `Deleted ${notificationIds.length} notifications`,
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to delete"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const sendNotification = async () => {
    try {
      const { error } = await supabase.from("notifications").insert({
        type: composeForm.type === "in_app" ? "system" : composeForm.type,
        category: composeForm.category,
        priority: composeForm.priority,
        title: composeForm.subject,
        message: composeForm.message,
        user_email: composeForm.recipients,
        created_at: new Date().toISOString(),
      })

      if (error) throw new Error(`Failed to send notification: ${error.message}`)

      setShowComposeModal(false)
      setComposeForm({
        type: "email",
        recipients: "",
        subject: "",
        message: "",
        priority: "medium",
        category: "info",
        schedule_at: "",
        template_id: "",
      })

      toast({
        title: "Success",
        description: "Notification sent successfully",
      })

      await fetchNotifications()
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Failed to send notification"
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    }
  }

  const exportNotifications = () => {
    const headers = [
      "ID",
      "Type",
      "Category",
      "Priority",
      "Title",
      "Message",
      "User Email",
      "Read",
      "Starred",
      "Archived",
      "Created At",
    ]

    const csvData = filteredNotifications.map((n) => [
      n.id,
      n.type,
      n.category,
      n.priority,
      n.title,
      n.message,
      n.user_email || "",
      n.is_read ? "Yes" : "No",
      n.is_starred ? "Yes" : "No",
      n.is_archived ? "Yes" : "No",
      format(new Date(n.created_at), "yyyy-MM-dd HH:mm:ss"),
    ])

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n")

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
    setCategoryFilter("all")
    setDateFilter("all")
    setSortBy("newest")
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "contract":
        return <FileText className="h-4 w-4" />
      case "promoter":
        return <Users className="h-4 w-4" />
      case "party":
        return <Building2 className="h-4 w-4" />
      case "payment":
        return <DollarSign className="h-4 w-4" />
      case "deadline":
        return <Clock className="h-4 w-4" />
      case "workflow":
        return <Zap className="h-4 w-4" />
      case "system":
        return <Settings className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getCategoryBadge = (category: string, priority: string) => {
    const baseClasses = "flex items-center gap-1"

    if (priority === "urgent") {
      return (
        <Badge className={`${baseClasses} bg-red-100 text-red-800`}>
          <AlertTriangle className="h-3 w-3" />
          Urgent
        </Badge>
      )
    }

    switch (category) {
      case "success":
        return (
          <Badge className={`${baseClasses} bg-green-100 text-green-800`}>
            <CheckCircle2 className="h-3 w-3" />
            Success
          </Badge>
        )
      case "warning":
        return (
          <Badge className={`${baseClasses} bg-yellow-100 text-yellow-800`}>
            <AlertTriangle className="h-3 w-3" />
            Warning
          </Badge>
        )
      case "error":
        return (
          <Badge className={`${baseClasses} bg-red-100 text-red-800`}>
            <AlertCircle className="h-3 w-3" />
            Error
          </Badge>
        )
      case "info":
      default:
        return (
          <Badge className={`${baseClasses} bg-blue-100 text-blue-800`}>
            <Info className="h-3 w-3" />
            Info
          </Badge>
        )
    }
  }

  const getDateLabel = (date: string) => {
    const notificationDate = new Date(date)

    if (isToday(notificationDate)) {
      return format(notificationDate, "HH:mm")
    } else if (isYesterday(notificationDate)) {
      return "Yesterday"
    } else {
      return format(notificationDate, "MMM dd")
    }
  }

  // Pagination
  const totalPages = Math.ceil(filteredNotifications.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const paginatedNotifications = filteredNotifications.slice(startIndex, startIndex + itemsPerPage)

  // Show loading state while authentication is being checked
  if (authLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-8">
          <LoadingSpinner size="lg" />
          <span className="ml-2">Loading communication center...</span>
        </div>
      </div>
    )
  }

  // Show authentication required message
  if (!isAuthenticated || !user) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Communication Center</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8 text-muted-foreground">
            <AlertTriangle className="mr-2 h-5 w-5" />
            <span>Authentication required to access communication center</span>
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
          <h1 className="text-3xl font-bold tracking-tight">Communication Center</h1>
          <p className="text-muted-foreground">
            Manage notifications, messages, and communication preferences across the system.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportNotifications}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={() => setShowSettingsModal(true)}>
            <Settings className="mr-2 h-4 w-4" />
            Settings
          </Button>
          <Button onClick={() => setShowComposeModal(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Compose
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="rounded-lg border border-destructive/20 bg-destructive/15 p-4">
          <div className="flex items-center">
            <AlertTriangle className="mr-2 h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
            <Button variant="ghost" size="sm" onClick={() => setError(null)} className="ml-auto">
              ×
            </Button>
          </div>
        </div>
      )}

      {/* Statistics Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{stats.total}</p>
              </div>
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Unread</p>
                <p className="text-2xl font-bold text-blue-600">{stats.unread}</p>
              </div>
              <Mail className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Urgent</p>
                <p className="text-2xl font-bold text-red-600">{stats.urgent}</p>
              </div>
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
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
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Recent</p>
                <p className="text-2xl font-bold text-green-600">{stats.recentActivity}</p>
              </div>
              <Activity className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Delivery</p>
                <p className="text-2xl font-bold text-purple-600">{stats.deliveryRate}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="notifications" className="space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-1 shadow-sm">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="templates">Templates</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="notifications" className="space-y-6">
          {/* Filters and Search */}
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

                  <Select
                    value={statusFilter}
                    onValueChange={(value: FilterType) => setStatusFilter(value)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="unread">Unread</SelectItem>
                      <SelectItem value="starred">Starred</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All Types" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="contract">Contract</SelectItem>
                      <SelectItem value="promoter">Promoter</SelectItem>
                      <SelectItem value="party">Party</SelectItem>
                      <SelectItem value="payment">Payment</SelectItem>
                      <SelectItem value="deadline">Deadline</SelectItem>
                      <SelectItem value="workflow">Workflow</SelectItem>
                      <SelectItem value="system">System</SelectItem>
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

                  <Select value={sortBy} onValueChange={(value: SortType) => setSortBy(value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sort by" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest First</SelectItem>
                      <SelectItem value="oldest">Oldest First</SelectItem>
                      <SelectItem value="priority">Priority</SelectItem>
                      <SelectItem value="type">Type</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Actions */}
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
                      <span className="self-center text-sm text-muted-foreground">
                        {selectedNotifications.length} selected
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsRead(selectedNotifications)}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Mark Read
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => archiveNotifications(selectedNotifications)}
                      >
                        <Archive className="mr-2 h-4 w-4" />
                        Archive
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteNotifications(selectedNotifications)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </Button>
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
                  <Bell className="mr-2 h-5 w-5" />
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
                  <Bell className="mx-auto h-12 w-12 text-muted-foreground" />
                  <h3 className="mt-2 text-sm font-semibold">No notifications found</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {filteredNotifications.length === 0 && notifications.length === 0
                      ? "No notifications have been received yet."
                      : "Try adjusting your filters to see more results."}
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {paginatedNotifications.map((notification) => {
                    const isSelected = selectedNotifications.includes(notification.id)

                    return (
                      <div
                        key={notification.id}
                        className={`cursor-pointer rounded-lg border p-4 transition-colors ${
                          isSelected
                            ? "border-blue-200 bg-blue-50"
                            : notification.is_read
                              ? "bg-gray-50 hover:bg-gray-100"
                              : "border-l-4 border-l-blue-500 bg-white hover:bg-gray-50"
                        }`}
                        onClick={() => {
                          setSelectedNotification(notification)
                          setShowDetailsModal(true)
                        }}
                      >
                        <div className="flex items-start space-x-3">
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
                            onClick={(e) => e.stopPropagation()}
                          />

                          <div className="flex-shrink-0 rounded-full bg-gray-100 p-2">
                            {getTypeIcon(notification.type)}
                          </div>

                          <div className="min-w-0 flex-1">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <h4
                                  className={`truncate font-medium ${!notification.is_read ? "text-gray-900" : "text-gray-700"}`}
                                >
                                  {notification.title}
                                </h4>
                                {getCategoryBadge(notification.category, notification.priority)}
                                {!notification.is_read && (
                                  <div className="h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                                )}
                              </div>
                              <div className="flex items-center space-x-2">
                                <span className="text-xs text-muted-foreground">
                                  {getDateLabel(notification.created_at)}
                                </span>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      onClick={(e) => e.stopPropagation()}
                                    >
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        markAsRead([notification.id])
                                      }}
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      Mark as Read
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        markAsStarred(notification.id, !notification.is_starred)
                                      }}
                                    >
                                      <Star className="mr-2 h-4 w-4" />
                                      {notification.is_starred ? "Unstar" : "Star"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        archiveNotifications([notification.id])
                                      }}
                                    >
                                      <Archive className="mr-2 h-4 w-4" />
                                      Archive
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem
                                      onClick={(e) => {
                                        e.stopPropagation()
                                        deleteNotifications([notification.id])
                                      }}
                                      className="text-destructive"
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </div>

                            <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                              {notification.message}
                            </p>

                            {notification.user_email && (
                              <p className="mt-1 text-xs text-muted-foreground">
                                To: {notification.user_email}
                              </p>
                            )}
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
        </TabsContent>

        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Communication Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="py-12 text-center">
                <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-2 text-sm font-semibold">Templates Coming Soon</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Create and manage communication templates for consistent messaging.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Communication Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Delivery Rate</span>
                    <span className="font-medium">{stats.deliveryRate}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-green-500"
                      style={{ width: `${stats.deliveryRate}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Response Rate</span>
                    <span className="font-medium">{stats.responseRate}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-blue-500"
                      style={{ width: `${stats.responseRate}%` }}
                    ></div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm">Read Rate</span>
                    <span className="font-medium">
                      {stats.total > 0
                        ? Math.round(((stats.total - stats.unread) / stats.total) * 100)
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-200">
                    <div
                      className="h-2 rounded-full bg-purple-500"
                      style={{
                        width: `${stats.total > 0 ? ((stats.total - stats.unread) / stats.total) * 100 : 0}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Distribution by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {Object.entries(stats.byType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(type)}
                        <span className="text-sm capitalize">{type}</span>
                      </div>
                      <span className="font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="settings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div>
                  <h3 className="mb-4 text-lg font-medium">Delivery Channels</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        <div>
                          <Label>Email Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Receive notifications via email
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.email_enabled}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({ ...prev, email_enabled: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Monitor className="h-4 w-4" />
                        <div>
                          <Label>Push Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Browser push notifications
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.push_enabled}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({ ...prev, push_enabled: checked }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Smartphone className="h-4 w-4" />
                        <div>
                          <Label>SMS Notifications</Label>
                          <p className="text-sm text-muted-foreground">
                            Text message notifications
                          </p>
                        </div>
                      </div>
                      <Switch
                        checked={settings.sms_enabled}
                        onCheckedChange={(checked) =>
                          setSettings((prev) => ({ ...prev, sms_enabled: checked }))
                        }
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="mb-4 text-lg font-medium">Notification Categories</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {Object.entries(settings.categories).map(([category, enabled]) => (
                      <div key={category} className="flex items-center justify-between">
                        <Label className="capitalize">{category.replace("_", " ")}</Label>
                        <Switch
                          checked={enabled}
                          onCheckedChange={(checked) =>
                            setSettings((prev) => ({
                              ...prev,
                              categories: { ...prev.categories, [category]: checked },
                            }))
                          }
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Compose Modal */}
      <Dialog open={showComposeModal} onOpenChange={setShowComposeModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Compose Notification</DialogTitle>
            <DialogDescription>Send a new notification to users</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="type">Type</Label>
                <Select
                  value={composeForm.type}
                  onValueChange={(value: any) =>
                    setComposeForm((prev) => ({ ...prev, type: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="email">Email</SelectItem>
                    <SelectItem value="push">Push</SelectItem>
                    <SelectItem value="sms">SMS</SelectItem>
                    <SelectItem value="in_app">In-App</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select
                  value={composeForm.priority}
                  onValueChange={(value: any) =>
                    setComposeForm((prev) => ({ ...prev, priority: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Low</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="recipients">Recipients</Label>
              <Input
                id="recipients"
                value={composeForm.recipients}
                onChange={(e) =>
                  setComposeForm((prev) => ({ ...prev, recipients: e.target.value }))
                }
                placeholder="Enter email addresses separated by commas"
              />
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                value={composeForm.subject}
                onChange={(e) => setComposeForm((prev) => ({ ...prev, subject: e.target.value }))}
                placeholder="Enter notification subject"
              />
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={composeForm.message}
                onChange={(e) => setComposeForm((prev) => ({ ...prev, message: e.target.value }))}
                placeholder="Enter notification message"
                rows={4}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowComposeModal(false)}>
              Cancel
            </Button>
            <Button onClick={sendNotification}>
              <Send className="mr-2 h-4 w-4" />
              Send Notification
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Notification Details Modal */}
      {selectedNotification && (
        <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {getTypeIcon(selectedNotification.type)}
                {selectedNotification.title}
              </DialogTitle>
              <DialogDescription>
                {format(new Date(selectedNotification.created_at), "PPpp")}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                {getCategoryBadge(selectedNotification.category, selectedNotification.priority)}
                <Badge variant="outline" className="capitalize">
                  {selectedNotification.type}
                </Badge>
                {selectedNotification.is_starred && (
                  <Badge variant="outline" className="text-yellow-600">
                    <Star className="mr-1 h-3 w-3" />
                    Starred
                  </Badge>
                )}
              </div>

              <div>
                <Label>Message</Label>
                <div className="mt-1 rounded-lg bg-gray-50 p-3">
                  <p className="text-sm">{selectedNotification.message}</p>
                </div>
              </div>

              {selectedNotification.user_email && (
                <div>
                  <Label>Recipient</Label>
                  <p className="text-sm text-muted-foreground">{selectedNotification.user_email}</p>
                </div>
              )}

              {selectedNotification.action_url && (
                <div>
                  <Label>Action</Label>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={selectedNotification.action_url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {selectedNotification.action_label || "View Details"}
                    </a>
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowDetailsModal(false)}>
                Close
              </Button>
              <Button
                onClick={() => {
                  markAsRead([selectedNotification.id])
                  setShowDetailsModal(false)
                }}
              >
                <Eye className="mr-2 h-4 w-4" />
                Mark as Read
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
