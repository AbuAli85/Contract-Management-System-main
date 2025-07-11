import { supabase } from "./supabase"

export interface NotificationData {
  type: "success" | "error" | "warning" | "info"
  message: string
  user_email?: string
  user_id?: string
  related_contract_id?: string
  related_entity_id?: string
  related_entity_type?: string
  priority?: "low" | "medium" | "high" | "urgent"
  category?: string
  metadata?: Record<string, any>
  is_read?: boolean
  is_starred?: boolean
  is_archived?: boolean
}

export interface NotificationFilter {
  type?: string
  status?: string
  priority?: string
  category?: string
  user_email?: string
  date_from?: string
  date_to?: string
  search?: string
  is_read?: boolean
  is_starred?: boolean
  is_archived?: boolean
}

export interface NotificationStats {
  total: number
  unread: number
  starred: number
  archived: number
  byType: Record<string, number>
  byPriority: Record<string, number>
  byCategory: Record<string, number>
  recentActivity: number
}

/**
 * Create a new notification
 */
export async function createNotification(data: NotificationData): Promise<string> {
  try {
    const notification = {
      type: data.type,
      message: data.message,
      user_email: data.user_email,
      user_id: data.user_id,
      related_contract_id: data.related_contract_id,
      related_entity_id: data.related_entity_id,
      related_entity_type: data.related_entity_type,
      priority: data.priority || "medium",
      category: data.category || "general",
      metadata: data.metadata,
      is_read: data.is_read || false,
      is_starred: data.is_starred || false,
      is_archived: data.is_archived || false,
      created_at: new Date().toISOString(),
    }

    const { data: result, error } = await supabase
      .from("notifications")
      .insert(notification)
      .select("id")
      .single()

    if (error) {
      throw new Error(`Failed to create notification: ${error.message}`)
    }

    return result.id
  } catch (error) {
    console.error("Error creating notification:", error)
    throw error
  }
}

/**
 * Get notifications with filtering and pagination
 */
export async function getNotifications(
  filter: NotificationFilter = {},
  page: number = 1,
  limit: number = 20
): Promise<{ notifications: any[]; total: number }> {
  try {
    let query = supabase.from("notifications").select("*", { count: "exact" })

    // Apply filters
    if (filter.type && filter.type !== "all") {
      query = query.eq("type", filter.type)
    }

    if (filter.priority && filter.priority !== "all") {
      query = query.eq("priority", filter.priority)
    }

    if (filter.category && filter.category !== "all") {
      query = query.eq("category", filter.category)
    }

    if (filter.user_email) {
      query = query.eq("user_email", filter.user_email)
    }

    if (filter.is_read !== undefined) {
      query = query.eq("is_read", filter.is_read)
    }

    if (filter.is_starred !== undefined) {
      query = query.eq("is_starred", filter.is_starred)
    }

    if (filter.is_archived !== undefined) {
      query = query.eq("is_archived", filter.is_archived)
    }

    if (filter.date_from) {
      query = query.gte("created_at", filter.date_from)
    }

    if (filter.date_to) {
      query = query.lte("created_at", filter.date_to)
    }

    if (filter.search) {
      query = query.or(
        `message.ilike.%${filter.search}%,user_email.ilike.%${filter.search}%,category.ilike.%${filter.search}%`
      )
    }

    // Apply pagination
    const offset = (page - 1) * limit
    query = query.order("created_at", { ascending: false }).range(offset, offset + limit - 1)

    const { data, error, count } = await query

    if (error) {
      throw new Error(`Failed to fetch notifications: ${error.message}`)
    }

    return {
      notifications: data || [],
      total: count || 0,
    }
  } catch (error) {
    console.error("Error fetching notifications:", error)
    throw error
  }
}

/**
 * Get notification statistics
 */
export async function getNotificationStats(): Promise<NotificationStats> {
  try {
    const { data, error } = await supabase
      .from("notifications")
      .select("type, priority, category, is_read, is_starred, is_archived, created_at")

    if (error) {
      throw new Error(`Failed to fetch notification stats: ${error.message}`)
    }

    const notifications = data || []
    const now = new Date()
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

    const stats: NotificationStats = {
      total: notifications.length,
      unread: notifications.filter((n) => !n.is_read).length,
      starred: notifications.filter((n) => n.is_starred).length,
      archived: notifications.filter((n) => n.is_archived).length,
      byType: {},
      byPriority: {},
      byCategory: {},
      recentActivity: notifications.filter((n) => new Date(n.created_at) > yesterday).length,
    }

    // Calculate distributions
    notifications.forEach((n) => {
      // Type distribution
      stats.byType[n.type] = (stats.byType[n.type] || 0) + 1

      // Priority distribution
      const priority = n.priority || "medium"
      stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1

      // Category distribution
      const category = n.category || "general"
      stats.byCategory[category] = (stats.byCategory[category] || 0) + 1
    })

    return stats
  } catch (error) {
    console.error("Error fetching notification stats:", error)
    throw error
  }
}

/**
 * Mark notification as read/unread
 */
export async function updateNotificationReadStatus(
  notificationId: string,
  isRead: boolean
): Promise<void> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: isRead })
      .eq("id", notificationId)

    if (error) {
      throw new Error(`Failed to update notification read status: ${error.message}`)
    }
  } catch (error) {
    console.error("Error updating notification read status:", error)
    throw error
  }
}

/**
 * Star/unstar notification
 */
export async function updateNotificationStarStatus(
  notificationId: string,
  isStarred: boolean
): Promise<void> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_starred: isStarred })
      .eq("id", notificationId)

    if (error) {
      throw new Error(`Failed to update notification star status: ${error.message}`)
    }
  } catch (error) {
    console.error("Error updating notification star status:", error)
    throw error
  }
}

/**
 * Archive/unarchive notification
 */
export async function updateNotificationArchiveStatus(
  notificationId: string,
  isArchived: boolean
): Promise<void> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_archived: isArchived })
      .eq("id", notificationId)

    if (error) {
      throw new Error(`Failed to update notification archive status: ${error.message}`)
    }
  } catch (error) {
    console.error("Error updating notification archive status:", error)
    throw error
  }
}

/**
 * Bulk update notifications
 */
export async function bulkUpdateNotifications(
  notificationIds: string[],
  updates: Partial<NotificationData>
): Promise<void> {
  try {
    const { error } = await supabase.from("notifications").update(updates).in("id", notificationIds)

    if (error) {
      throw new Error(`Failed to bulk update notifications: ${error.message}`)
    }
  } catch (error) {
    console.error("Error bulk updating notifications:", error)
    throw error
  }
}

/**
 * Delete notifications
 */
export async function deleteNotifications(notificationIds: string[]): Promise<void> {
  try {
    const { error } = await supabase.from("notifications").delete().in("id", notificationIds)

    if (error) {
      throw new Error(`Failed to delete notifications: ${error.message}`)
    }
  } catch (error) {
    console.error("Error deleting notifications:", error)
    throw error
  }
}

/**
 * Mark all notifications as read for a user
 */
export async function markAllAsReadForUser(userEmail: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("notifications")
      .update({ is_read: true })
      .eq("user_email", userEmail)
      .eq("is_read", false)

    if (error) {
      throw new Error(`Failed to mark all notifications as read: ${error.message}`)
    }
  } catch (error) {
    console.error("Error marking all notifications as read:", error)
    throw error
  }
}

/**
 * Get unread notification count for a user
 */
export async function getUnreadCount(userEmail: string): Promise<number> {
  try {
    const { count, error } = await supabase
      .from("notifications")
      .select("*", { count: "exact", head: true })
      .eq("user_email", userEmail)
      .eq("is_read", false)
      .eq("is_archived", false)

    if (error) {
      throw new Error(`Failed to get unread count: ${error.message}`)
    }

    return count || 0
  } catch (error) {
    console.error("Error getting unread count:", error)
    return 0
  }
}

/**
 * Create contract-related notification
 */
export async function createContractNotification(
  contractId: string,
  type: NotificationData["type"],
  message: string,
  userEmail?: string,
  priority: NotificationData["priority"] = "medium"
): Promise<string> {
  return createNotification({
    type,
    message,
    user_email: userEmail,
    related_contract_id: contractId,
    related_entity_type: "contract",
    priority,
    category: "contract",
  })
}

/**
 * Create party-related notification
 */
export async function createPartyNotification(
  partyId: string,
  type: NotificationData["type"],
  message: string,
  userEmail?: string,
  priority: NotificationData["priority"] = "medium"
): Promise<string> {
  return createNotification({
    type,
    message,
    user_email: userEmail,
    related_entity_id: partyId,
    related_entity_type: "party",
    priority,
    category: "party",
  })
}

/**
 * Create promoter-related notification
 */
export async function createPromoterNotification(
  promoterId: string,
  type: NotificationData["type"],
  message: string,
  userEmail?: string,
  priority: NotificationData["priority"] = "medium"
): Promise<string> {
  return createNotification({
    type,
    message,
    user_email: userEmail,
    related_entity_id: promoterId,
    related_entity_type: "promoter",
    priority,
    category: "promoter",
  })
}

/**
 * Create system notification
 */
export async function createSystemNotification(
  type: NotificationData["type"],
  message: string,
  priority: NotificationData["priority"] = "medium",
  metadata?: Record<string, any>
): Promise<string> {
  return createNotification({
    type,
    message,
    priority,
    category: "system",
    metadata,
  })
}

/**
 * Subscribe to real-time notifications
 */
export function subscribeToNotifications(
  callback: (notification: any) => void,
  userEmail?: string
) {
  let channel = supabase
    .channel("notifications_realtime")
    .on(
      "postgres_changes",
      {
        event: "*",
        schema: "public",
        table: "notifications",
        filter: userEmail ? `user_email=eq.${userEmail}` : undefined,
      },
      callback
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}

/**
 * Export notifications to CSV
 */
export async function exportNotificationsToCSV(filter: NotificationFilter = {}): Promise<string> {
  try {
    const { notifications } = await getNotifications(filter, 1, 10000) // Get all matching notifications

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
      "Related Contract ID",
      "Related Entity ID",
      "Related Entity Type",
    ]

    const csvData = notifications.map((n) => [
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
      n.related_contract_id || "",
      n.related_entity_id || "",
      n.related_entity_type || "",
    ])

    const csvContent = [headers.join(","), ...csvData.map((row) => row.join(","))].join("\n")

    return csvContent
  } catch (error) {
    console.error("Error exporting notifications to CSV:", error)
    throw error
  }
}
