"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
import { useToast } from "@/hooks/use-toast"
import { useSupabase } from "@/components/supabase-provider"
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Download,
  Filter,
  Info,
  RefreshCw,
  Search,
  Shield,
  TrendingUp,
  User,
  XCircle,
  Calendar,
  BarChart3,
  Lock,
  Unlock,
  Mail,
  Smartphone,
  Key,
  UserX,
  UserCheck,
  FileWarning,
  Globe,
} from "lucide-react"
import { format, subDays, startOfDay, endOfDay } from "date-fns"
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts"

interface AuditLog {
  id: string
  user_id: string
  event_type: string
  ip_address: string
  user_agent: string
  metadata: any
  success: boolean
  error_message?: string
  created_at: string
  user?: {
    email: string
    full_name: string
  }
}

interface SecurityEvent {
  id: string
  user_id: string
  event_type: string
  severity: "info" | "warning" | "critical"
  description: string
  metadata: any
  ip_address: string
  resolved_at?: string
  created_at: string
  user?: {
    email: string
    full_name: string
  }
}

interface AuditStats {
  totalEvents: number
  successfulLogins: number
  failedLogins: number
  passwordResets: number
  mfaEvents: number
  suspiciousActivities: number
  uniqueUsers: number
  topEvents: { event: string; count: number }[]
}

const EVENT_ICONS: Record<string, React.ElementType> = {
  sign_up: UserCheck,
  sign_in: Unlock,
  sign_out: Lock,
  password_reset: Key,
  password_changed: Key,
  email_verified: Mail,
  mfa_enabled: Smartphone,
  mfa_disabled: Smartphone,
  mfa_verify: Shield,
  account_locked: UserX,
  account_unlocked: UserCheck,
  suspicious_activity: AlertTriangle,
  api_key_created: Key,
  api_key_revoked: Key,
  profile_updated: User,
  session_expired: Clock,
  rate_limit_exceeded: FileWarning,
  oauth_connected: Globe,
  oauth_disconnected: Globe,
}

const SEVERITY_COLORS = {
  info: "bg-blue-100 text-blue-800",
  warning: "bg-yellow-100 text-yellow-800",
  critical: "bg-red-100 text-red-800",
}

export default function AuditDashboardPage() {
  const router = useRouter()
  const { toast } = useToast()
  const { supabase } = useSupabase()

  const [loading, setLoading] = useState(true)
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([])
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [stats, setStats] = useState<AuditStats>({
    totalEvents: 0,
    successfulLogins: 0,
    failedLogins: 0,
    passwordResets: 0,
    mfaEvents: 0,
    suspiciousActivities: 0,
    uniqueUsers: 0,
    topEvents: [],
  })

  // Filters
  const [dateRange, setDateRange] = useState("7days")
  const [eventTypeFilter, setEventTypeFilter] = useState("all")
  const [userFilter, setUserFilter] = useState("")
  const [severityFilter, setSeverityFilter] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")

  // Chart data
  const [activityData, setActivityData] = useState<any[]>([])
  const [eventDistribution, setEventDistribution] = useState<any[]>([])

  useEffect(() => {
    fetchAuditData()
    const interval = setInterval(fetchAuditData, 30000) // Refresh every 30 seconds
    return () => clearInterval(interval)
  }, [dateRange, eventTypeFilter, userFilter, severityFilter])

  const fetchAuditData = async () => {
    try {
      setLoading(true)

      // Calculate date range
      const endDate = new Date()
      let startDate = new Date()

      switch (dateRange) {
        case "24hours":
          startDate = subDays(endDate, 1)
          break
        case "7days":
          startDate = subDays(endDate, 7)
          break
        case "30days":
          startDate = subDays(endDate, 30)
          break
        case "90days":
          startDate = subDays(endDate, 90)
          break
      }

      // Build query
      let logsQuery = supabase
        .from("auth_logs")
        .select(
          `
          *,
          user:profiles(email, full_name)
        `
        )
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: false })
        .limit(1000)

      if (eventTypeFilter !== "all") {
        logsQuery = logsQuery.eq("event_type", eventTypeFilter)
      }

      if (userFilter) {
        logsQuery = logsQuery.eq("user_id", userFilter)
      }

      const { data: logs, error: logsError } = await logsQuery

      if (logsError) throw logsError

      // Fetch security events
      let eventsQuery = supabase
        .from("security_events")
        .select(
          `
          *,
          user:profiles(email, full_name)
        `
        )
        .gte("created_at", startDate.toISOString())
        .lte("created_at", endDate.toISOString())
        .order("created_at", { ascending: false })
        .limit(100)

      if (severityFilter !== "all") {
        eventsQuery = eventsQuery.eq("severity", severityFilter)
      }

      const { data: events, error: eventsError } = await eventsQuery

      if (eventsError) throw eventsError

      setAuditLogs(logs || [])
      setSecurityEvents(events || [])

      // Calculate stats
      calculateStats(logs || [])
      prepareChartData(logs || [])
    } catch (error: any) {
      toast({
        title: "Error fetching audit data",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (logs: AuditLog[]) => {
    const eventCounts: Record<string, number> = {}
    const uniqueUserIds = new Set<string>()

    let successfulLogins = 0
    let failedLogins = 0
    let passwordResets = 0
    let mfaEvents = 0
    let suspiciousActivities = 0

    logs.forEach((log) => {
      // Count events
      eventCounts[log.event_type] = (eventCounts[log.event_type] || 0) + 1

      // Track unique users
      if (log.user_id) uniqueUserIds.add(log.user_id)

      // Count specific events
      if (log.event_type === "sign_in" && log.success) successfulLogins++
      if (log.event_type === "sign_in" && !log.success) failedLogins++
      if (log.event_type.includes("password_reset")) passwordResets++
      if (log.event_type.includes("mfa")) mfaEvents++
      if (log.event_type.includes("suspicious") || log.event_type.includes("locked")) {
        suspiciousActivities++
      }
    })

    // Get top events
    const topEvents = Object.entries(eventCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5)
      .map(([event, count]) => ({ event, count }))

    setStats({
      totalEvents: logs.length,
      successfulLogins,
      failedLogins,
      passwordResets,
      mfaEvents,
      suspiciousActivities,
      uniqueUsers: uniqueUserIds.size,
      topEvents,
    })
  }

  const prepareChartData = (logs: AuditLog[]) => {
    // Activity over time
    const activityByDay: Record<string, number> = {}
    const eventTypes: Record<string, number> = {}

    logs.forEach((log) => {
      const day = format(new Date(log.created_at), "MMM dd")
      activityByDay[day] = (activityByDay[day] || 0) + 1

      const eventType = log.event_type.replace(/_/g, " ")
      eventTypes[eventType] = (eventTypes[eventType] || 0) + 1
    })

    // Convert to chart format
    const activityData = Object.entries(activityByDay)
      .map(([date, count]) => ({ date, count }))
      .reverse()

    const eventDistribution = Object.entries(eventTypes)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 8)
      .map(([name, value]) => ({ name, value }))

    setActivityData(activityData)
    setEventDistribution(eventDistribution)
  }

  const exportAuditLogs = () => {
    const headers = [
      "Timestamp",
      "Event Type",
      "User",
      "IP Address",
      "User Agent",
      "Success",
      "Error Message",
      "Metadata",
    ]

    const csvData = auditLogs.map((log) => [
      format(new Date(log.created_at), "yyyy-MM-dd HH:mm:ss"),
      log.event_type,
      log.user?.email || log.user_id || "N/A",
      log.ip_address || "N/A",
      log.user_agent || "N/A",
      log.success ? "Yes" : "No",
      log.error_message || "",
      JSON.stringify(log.metadata || {}),
    ])

    const csvContent = [
      headers.join(","),
      ...csvData.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n")

    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `audit-logs-${format(new Date(), "yyyy-MM-dd")}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const getEventIcon = (eventType: string) => {
    const Icon = EVENT_ICONS[eventType] || Activity
    return <Icon className="h-4 w-4" />
  }

  const filteredLogs = auditLogs.filter((log) => {
    if (!searchTerm) return true

    const searchLower = searchTerm.toLowerCase()
    return (
      log.event_type.toLowerCase().includes(searchLower) ||
      log.user?.email?.toLowerCase().includes(searchLower) ||
      log.ip_address?.toLowerCase().includes(searchLower) ||
      JSON.stringify(log.metadata).toLowerCase().includes(searchLower)
    )
  })

  const CHART_COLORS = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#ec4899",
    "#14b8a6",
    "#f97316",
  ]

  return (
    <div className="container space-y-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Audit & Security Dashboard</h1>
          <p className="mt-1 text-muted-foreground">
            Monitor authentication events and security incidents
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchAuditData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh
          </Button>
          <Button variant="outline" onClick={exportAuditLogs}>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Events
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents}</div>
            <p className="mt-1 text-xs text-muted-foreground">In selected period</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Success Rate
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {stats.totalEvents > 0
                ? Math.round(
                    (stats.successfulLogins / (stats.successfulLogins + stats.failedLogins)) * 100
                  )
                : 0}
              %
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Login attempts</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Security Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.suspiciousActivities}</div>
            <p className="mt-1 text-xs text-muted-foreground">Suspicious activities</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.uniqueUsers}</div>
            <p className="mt-1 text-xs text-muted-foreground">Unique users</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Activity Over Time</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="#3b82f6"
                  strokeWidth={2}
                  dot={{ fill: "#3b82f6" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Event Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={eventDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {eventDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="24hours">Last 24 Hours</SelectItem>
                <SelectItem value="7days">Last 7 Days</SelectItem>
                <SelectItem value="30days">Last 30 Days</SelectItem>
                <SelectItem value="90days">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>

            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                <SelectItem value="sign_in">Sign In</SelectItem>
                <SelectItem value="sign_up">Sign Up</SelectItem>
                <SelectItem value="sign_out">Sign Out</SelectItem>
                <SelectItem value="password_reset">Password Reset</SelectItem>
                <SelectItem value="mfa_verify">MFA Verify</SelectItem>
                <SelectItem value="account_locked">Account Locked</SelectItem>
              </SelectContent>
            </Select>

            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Severities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Severities</SelectItem>
                <SelectItem value="info">Info</SelectItem>
                <SelectItem value="warning">Warning</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 transform text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Button
              variant="outline"
              onClick={() => {
                setDateRange("7days")
                setEventTypeFilter("all")
                setSeverityFilter("all")
                setSearchTerm("")
                setUserFilter("")
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="logs" className="space-y-4">
        <TabsList>
          <TabsTrigger value="logs">Audit Logs</TabsTrigger>
          <TabsTrigger value="security">Security Events</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
        </TabsList>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>IP Address</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Details</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center">
                        <RefreshCw className="mx-auto h-6 w-6 animate-spin" />
                      </TableCell>
                    </TableRow>
                  ) : filteredLogs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        No audit logs found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredLogs.slice(0, 50).map((log) => (
                      <TableRow key={log.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getEventIcon(log.event_type)}
                            <span className="font-medium">{log.event_type.replace(/_/g, " ")}</span>
                          </div>
                        </TableCell>
                        <TableCell>{log.user?.email || log.user_id || "Anonymous"}</TableCell>
                        <TableCell>
                          <code className="text-xs">{log.ip_address || "N/A"}</code>
                        </TableCell>
                        <TableCell>
                          {log.success ? (
                            <Badge variant="outline" className="border-green-600 text-green-600">
                              <CheckCircle className="mr-1 h-3 w-3" />
                              Success
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-red-600 text-red-600">
                              <XCircle className="mr-1 h-3 w-3" />
                              Failed
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {log.error_message && (
                            <span className="text-sm text-red-600">{log.error_message}</span>
                          )}
                          {log.metadata && Object.keys(log.metadata).length > 0 && (
                            <Badge variant="secondary" className="text-xs">
                              {Object.keys(log.metadata).length} details
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(log.created_at), "MMM d, HH:mm")}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Timestamp</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {securityEvents.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                        No security events found
                      </TableCell>
                    </TableRow>
                  ) : (
                    securityEvents.map((event) => (
                      <TableRow key={event.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getEventIcon(event.event_type)}
                            <span className="font-medium">
                              {event.event_type.replace(/_/g, " ")}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={SEVERITY_COLORS[event.severity]}>
                            {event.severity}
                          </Badge>
                        </TableCell>
                        <TableCell>{event.user?.email || event.user_id || "System"}</TableCell>
                        <TableCell className="max-w-xs truncate">{event.description}</TableCell>
                        <TableCell>
                          {event.resolved_at ? (
                            <Badge variant="outline" className="border-green-600 text-green-600">
                              Resolved
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-yellow-600 text-yellow-600">
                              Open
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(event.created_at), "MMM d, HH:mm")}
                          </span>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Top Events</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.topEvents.map((event, index) => (
                    <div key={event.event} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{index + 1}.</span>
                        {getEventIcon(event.event)}
                        <span className="text-sm">{event.event.replace(/_/g, " ")}</span>
                      </div>
                      <Badge variant="secondary">{event.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Security Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Failed Login Attempts</span>
                  <span className="font-medium">{stats.failedLogins}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Password Resets</span>
                  <span className="font-medium">{stats.passwordResets}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">MFA Events</span>
                  <span className="font-medium">{stats.mfaEvents}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Account Lockouts</span>
                  <span className="font-medium text-red-600">
                    {auditLogs.filter((l) => l.event_type === "account_locked").length}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>

          {stats.suspiciousActivities > 0 && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <strong>{stats.suspiciousActivities} suspicious activities detected</strong> in the
                selected period. Review the security events tab for more details.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
