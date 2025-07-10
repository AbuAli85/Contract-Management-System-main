"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Bell, 
  BellOff, 
  CheckCircle, 
  AlertCircle, 
  Info, 
  Settings, 
  Filter,
  Search,
  MoreHorizontal,
  Trash2,
  Eye,
  EyeOff,
  Clock,
  FileText,
  Users,
  DollarSign,
  Zap
} from "lucide-react"
// import { useTranslations } from "next-intl"

interface NotificationItem {
  id: string
  type: "contract_created" | "contract_completed" | "contract_failed" | "approval_required" | "payment_due" | "deadline_approaching" | "system_update" | "workflow_completed"
  title: string
  message: string
  priority: "low" | "medium" | "high" | "urgent"
  read: boolean
  created_at: string
  action_url?: string
  metadata?: Record<string, any>
  user_id: string
}

interface NotificationSettings {
  email_notifications: boolean
  push_notifications: boolean
  slack_notifications: boolean
  notification_types: {
    contract_updates: boolean
    payment_reminders: boolean
    deadline_alerts: boolean
    workflow_updates: boolean
    system_updates: boolean
  }
  quiet_hours: {
    enabled: boolean
    start_time: string
    end_time: string
  }
}

interface NotificationCenterProps {
  notifications: NotificationItem[]
  settings: NotificationSettings
  onMarkAsRead: (notificationId: string) => void
  onMarkAllAsRead: () => void
  onDeleteNotification: (notificationId: string) => void
  onUpdateSettings: (settings: Partial<NotificationSettings>) => void
}

export function NotificationCenter({ 
  notifications, 
  settings, 
  onMarkAsRead, 
  onMarkAllAsRead, 
  onDeleteNotification,
  onUpdateSettings 
}: NotificationCenterProps) {
  // const t = useTranslations("NotificationCenter")
  const [activeTab, setActiveTab] = useState("all")
  const [searchTerm, setSearchTerm] = useState("")
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "contract_created":
      case "contract_completed":
      case "contract_failed":
        return <FileText className="h-4 w-4" />
      case "approval_required":
      case "workflow_completed":
        return <Users className="h-4 w-4" />
      case "payment_due":
        return <DollarSign className="h-4 w-4" />
      case "deadline_approaching":
        return <Clock className="h-4 w-4" />
      case "system_update":
        return <Zap className="h-4 w-4" />
      default:
        return <Bell className="h-4 w-4" />
    }
  }

  const getNotificationColor = (type: string, priority: string) => {
    if (priority === "urgent") return "text-red-600"
    if (priority === "high") return "text-orange-600"
    
    switch (type) {
      case "contract_completed":
        return "text-green-600"
      case "contract_failed":
        return "text-red-600"
      case "approval_required":
        return "text-blue-600"
      case "payment_due":
        return "text-yellow-600"
      default:
        return "text-gray-600"
    }
  }

  const getPriorityBadge = (priority: string) => {
    const colors = {
      urgent: "bg-red-500 text-white",
      high: "bg-orange-500 text-white",
      medium: "bg-yellow-500 text-white",
      low: "bg-green-500 text-white"
    }
    return colors[priority as keyof typeof colors] || "bg-gray-500 text-white"
  }

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = notification.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         notification.message.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesTab = activeTab === "all" || 
                      (activeTab === "unread" && !notification.read) ||
                      (activeTab === "urgent" && notification.priority === "urgent") ||
                      (activeTab === notification.type)
    
    return matchesSearch && matchesTab
  })

  const unreadCount = notifications.filter(n => !n.read).length
  const urgentCount = notifications.filter(n => n.priority === "urgent").length

  const NotificationCard = ({ notification }: { notification: NotificationItem }) => (
    <Card className={`hover:shadow-sm transition-shadow ${!notification.read ? 'bg-blue-50 border-blue-200' : ''}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className={`p-2 rounded-full ${getNotificationColor(notification.type, notification.priority)} bg-opacity-10`}>
            {getNotificationIcon(notification.type)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className={`font-medium ${!notification.read ? 'text-gray-900' : 'text-gray-700'}`}>
                    {notification.title}
                  </h4>
                  <Badge variant="outline" className={getPriorityBadge(notification.priority)}>
                    {notification.priority}
                  </Badge>
                  {!notification.read && (
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                  )}
                </div>
                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                <div className="flex items-center space-x-4 mt-2">
                  <span className="text-xs text-gray-500">
                    {new Date(notification.created_at).toLocaleString()}
                  </span>
                  {notification.action_url && (
                    <Button variant="link" size="sm" className="p-0 h-auto text-xs">
                      View Details
                    </Button>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-1 ml-4">
                {!notification.read && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onMarkAsRead(notification.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDeleteNotification(notification.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )

  const NotificationSettings = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium mb-4">Notification Channels</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="email-notifications" className="text-sm font-medium">
                Email Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              id="email-notifications"
              checked={settings.email_notifications}
              onCheckedChange={(checked) => 
                onUpdateSettings({ email_notifications: checked })
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="push-notifications" className="text-sm font-medium">
                Push Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Receive push notifications in your browser
              </p>
            </div>
            <Switch
              id="push-notifications"
              checked={settings.push_notifications}
              onCheckedChange={(checked) => 
                onUpdateSettings({ push_notifications: checked })
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="slack-notifications" className="text-sm font-medium">
                Slack Notifications
              </Label>
              <p className="text-xs text-muted-foreground">
                Send notifications to your Slack workspace
              </p>
            </div>
            <Switch
              id="slack-notifications"
              checked={settings.slack_notifications}
              onCheckedChange={(checked) => 
                onUpdateSettings({ slack_notifications: checked })
              }
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Notification Types</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="contract-updates" className="text-sm font-medium">
                Contract Updates
              </Label>
              <p className="text-xs text-muted-foreground">
                Notifications about contract status changes
              </p>
            </div>
            <Switch
              id="contract-updates"
              checked={settings.notification_types.contract_updates}
              onCheckedChange={(checked) => 
                onUpdateSettings({ 
                  notification_types: { 
                    ...settings.notification_types, 
                    contract_updates: checked 
                  } 
                })
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="payment-reminders" className="text-sm font-medium">
                Payment Reminders
              </Label>
              <p className="text-xs text-muted-foreground">
                Reminders for upcoming payments
              </p>
            </div>
            <Switch
              id="payment-reminders"
              checked={settings.notification_types.payment_reminders}
              onCheckedChange={(checked) => 
                onUpdateSettings({ 
                  notification_types: { 
                    ...settings.notification_types, 
                    payment_reminders: checked 
                  } 
                })
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="deadline-alerts" className="text-sm font-medium">
                Deadline Alerts
              </Label>
              <p className="text-xs text-muted-foreground">
                Alerts for approaching deadlines
              </p>
            </div>
            <Switch
              id="deadline-alerts"
              checked={settings.notification_types.deadline_alerts}
              onCheckedChange={(checked) => 
                onUpdateSettings({ 
                  notification_types: { 
                    ...settings.notification_types, 
                    deadline_alerts: checked 
                  } 
                })
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="workflow-updates" className="text-sm font-medium">
                Workflow Updates
              </Label>
              <p className="text-xs text-muted-foreground">
                Updates on workflow approvals and changes
              </p>
            </div>
            <Switch
              id="workflow-updates"
              checked={settings.notification_types.workflow_updates}
              onCheckedChange={(checked) => 
                onUpdateSettings({ 
                  notification_types: { 
                    ...settings.notification_types, 
                    workflow_updates: checked 
                  } 
                })
              }
            />
          </div>
          
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="system-updates" className="text-sm font-medium">
                System Updates
              </Label>
              <p className="text-xs text-muted-foreground">
                System maintenance and feature updates
              </p>
            </div>
            <Switch
              id="system-updates"
              checked={settings.notification_types.system_updates}
              onCheckedChange={(checked) => 
                onUpdateSettings({ 
                  notification_types: { 
                    ...settings.notification_types, 
                    system_updates: checked 
                  } 
                })
              }
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-medium mb-4">Quiet Hours</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label htmlFor="quiet-hours" className="text-sm font-medium">
                Enable Quiet Hours
              </Label>
              <p className="text-xs text-muted-foreground">
                Disable notifications during specified hours
              </p>
            </div>
            <Switch
              id="quiet-hours"
              checked={settings.quiet_hours.enabled}
              onCheckedChange={(checked) => 
                onUpdateSettings({ 
                  quiet_hours: { 
                    ...settings.quiet_hours, 
                    enabled: checked 
                  } 
                })
              }
            />
          </div>
          
          {settings.quiet_hours.enabled && (
            <div className="flex items-center space-x-4">
              <div className="flex-1">
                <Label htmlFor="start-time" className="text-sm font-medium">
                  Start Time
                </Label>
                <input
                  type="time"
                  id="start-time"
                  value={settings.quiet_hours.start_time}
                  onChange={(e) => 
                    onUpdateSettings({ 
                      quiet_hours: { 
                        ...settings.quiet_hours, 
                        start_time: e.target.value 
                      } 
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
              <div className="flex-1">
                <Label htmlFor="end-time" className="text-sm font-medium">
                  End Time
                </Label>
                <input
                  type="time"
                  id="end-time"
                  value={settings.quiet_hours.end_time}
                  onChange={(e) => 
                    onUpdateSettings({ 
                      quiet_hours: { 
                        ...settings.quiet_hours, 
                        end_time: e.target.value 
                      } 
                    })
                  }
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div>
            <h2 className="text-2xl font-bold">Notifications</h2>
            <p className="text-muted-foreground">
              {notifications.length} notifications
            </p>
          </div>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="px-2 py-1">
              {unreadCount} unread
            </Badge>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Mark All as Read
          </Button>
          <Dialog open={isSettingsOpen} onOpenChange={setIsSettingsOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Settings className="h-4 w-4 mr-1" />
                Settings
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Notification Settings</DialogTitle>
              </DialogHeader>
              <NotificationSettings />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Unread Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{unreadCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Urgent Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{urgentCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Today's Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter(n => 
                new Date(n.created_at).toDateString() === new Date().toDateString()
              ).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="flex-1 max-w-sm">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search notifications..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Notifications */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unread">
            Unread {unreadCount > 0 && `(${unreadCount})`}
          </TabsTrigger>
          <TabsTrigger value="urgent">
            Urgent {urgentCount > 0 && `(${urgentCount})`}
          </TabsTrigger>
          <TabsTrigger value="contract_created">Contracts</TabsTrigger>
        </TabsList>
        
        <TabsContent value={activeTab} className="space-y-4">
          <div className="space-y-3">
            {filteredNotifications.map(notification => (
              <NotificationCard key={notification.id} notification={notification} />
            ))}
          </div>
          
          {filteredNotifications.length === 0 && (
            <div className="text-center py-12">
              <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium">No notifications</h3>
              <p className="text-muted-foreground">You're all caught up!</p>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
