"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { BellRing, CheckCircle, XCircle, AlertTriangle, Info, Loader2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Button } from "@/components/ui/button"
import { supabase } from "@/lib/supabase"
import { devLog } from "@/lib/dev-log"
import type { NotificationItem, NotificationRow } from "@/lib/dashboard-types"
import { useToast } from "@/hooks/use-toast"
import { formatDistanceToNow } from "date-fns"

const iconMap = {
  success: CheckCircle,
  error: XCircle,
  warning: AlertTriangle,
  info: Info,
  default: BellRing,
}

const getIconColor = (type: NotificationItem["type"]) => {
  if (type === "success") return "text-green-500"
  if (type === "error") return "text-red-500"
  if (type === "warning") return "text-orange-500"
  return "text-blue-500" // For info and default
}

export default function NotificationSystem() {
  const [notifications, setNotifications] = useState<NotificationItem[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  const fetchNotifications = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select(
          "id, type, message, created_at, user_email, related_contract_id, related_entity_id, related_entity_type, is_read",
        )
        .order("created_at", { ascending: false })
        .limit(20)

      if (error) throw error
      if (Array.isArray(data) && data.every(n => n && typeof n === 'object' && 'id' in n && 'type' in n && 'message' in n && 'created_at' in n && 'is_read' in n)) {
        setNotifications(
          data.map((n: NotificationRow) => ({
            id: n.id,
            type: n.type as NotificationItem["type"],
            message: n.message,
            created_at: n.created_at,
            timestamp: n.created_at, // For compatibility
            user_email: n.user_email ?? undefined,
            related_contract_id: n.related_contract_id ?? undefined,
            related_entity_id: n.related_entity_id ?? undefined,
            related_entity_type: n.related_entity_type ?? undefined,
            isRead: n.is_read,
            is_read: n.is_read, // For compatibility
            context: n.related_contract_id
              ? `Contract ID: ${n.related_contract_id}`
              : n.related_entity_id
                ? `${n.related_entity_type || "Entity"} ID: ${n.related_entity_id}`
                : n.user_email
                  ? `User: ${n.user_email}`
                  : undefined,
          }))
        )
      } else {
        setNotifications([])
      }
    } catch (error: any) {
      console.error("Error fetching notifications:", error)
      toast({
        title: "Error Fetching Notifications",
        description: error.message,
        variant: "destructive",
      })
      setNotifications([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchNotifications()
    const channel = supabase
      .channel("public:notifications:feed") // Unique channel name
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications" },
        (payload) => {
          const newNotif = payload.new as NotificationRow
          devLog("New notification received:", newNotif)
          toast({ title: "New Notification", description: newNotif.message })
          setNotifications((prev) =>
            [
              {
                id: newNotif.id,
                type: newNotif.type as NotificationItem["type"],
                message: newNotif.message,
                created_at: newNotif.created_at,
                timestamp: newNotif.created_at,
                user_email: newNotif.user_email ?? undefined,
                related_contract_id: newNotif.related_contract_id ?? undefined,
                related_entity_id: newNotif.related_entity_id ?? undefined,
                related_entity_type: newNotif.related_entity_type ?? undefined,
                isRead: newNotif.is_read,
                is_read: newNotif.is_read,
                context: newNotif.related_contract_id
                  ? `Contract ID: ${newNotif.related_contract_id}`
                  : newNotif.related_entity_id
                    ? `${newNotif.related_entity_type || "Entity"} ID: ${newNotif.related_entity_id}`
                    : newNotif.user_email
                      ? `User: ${newNotif.user_email}`
                      : undefined,
              },
              ...prev,
            ].slice(0, 20),
          )
        },
      )
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notifications / الإشعارات</CardTitle>
        <CardDescription>
          Recent system alerts and updates. / أحدث تنبيهات وتحديثات النظام.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[300px]">
          {loading && (
            <div className="flex h-full items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          )}
          {!loading && notifications.length === 0 && (
            <p className="py-8 text-center text-muted-foreground">
              No new notifications. / لا توجد إشعارات جديدة.
            </p>
          )}
          {!loading && notifications.length > 0 && (
            <div className="space-y-3">
              {notifications.map((notif) => {
                const IconComponent = iconMap[notif.type] || iconMap.default
                return (
                  <div
                    key={notif.id}
                    className={`flex items-start gap-3 rounded-md border p-2.5 hover:bg-muted/50 ${!notif.isRead ? "border-primary/20 bg-primary/5 dark:bg-primary/10" : ""}`}
                  >
                    <IconComponent
                      className={`mt-0.5 h-5 w-5 shrink-0 ${getIconColor(notif.type)}`}
                    />
                    <div>
                      <p className="text-sm">{notif.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {notif.timestamp && (
                          formatDistanceToNow(new Date(notif.timestamp), { addSuffix: true })
                        )}
                        {notif.context && ` (${notif.context})`}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </ScrollArea>
        <Button variant="outline" className="mt-4 w-full" disabled>
          View All Notifications (Not Implemented)
        </Button>
      </CardContent>
    </Card>
  )
}
