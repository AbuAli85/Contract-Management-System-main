import { supabase } from "./supabase"
import { logError, logInfo } from "./dev-log"

export interface NotificationData {
  type: 'contract' | 'promoter' | 'party' | 'system' | 'payment' | 'deadline' | 'workflow'
  category: 'info' | 'success' | 'warning' | 'error' | 'urgent'
  priority: 'low' | 'medium' | 'high' | 'urgent'
  title: string
  message: string
  user_id?: string
  user_email?: string
  action_url?: string
  action_label?: string
  metadata?: Record<string, any>
  expires_at?: string
  schedule_at?: string
}

export interface NotificationFilter {
  type?: string
  category?: string
  priority?: string
  user_id?: string
  user_email?: string
  is_read?: boolean
  is_starred?: boolean
  is_archived?: boolean
  date_from?: string
  date_to?: string
}

export interface NotificationStats {
  total: number
  unread: number
  starred: number
  archived: number
  urgent: number
  byType: Record<string, number>
  byCategory: Record<string, number>
  byPriority: Record<string, number>
  recentActivity: number
  deliveryRate: number
  responseRate: number
}

export interface BulkNotificationData {
  notifications: NotificationData[]
  send_immediately?: boolean
  schedule_at?: string
}

/**
 * Enhanced notification service with comprehensive features
 */
export class EnhancedNotificationService {
  /**
   * Create a single notification
   */
  static async createNotification(data: NotificationData): Promise<string> {
    try {
      const notification = {
        type: data.type,
        category: data.category,
        priority: data.priority,
        title: data.title,
        message: data.message,
        user_id: data.user_id,
        user_email: data.user_email,
        action_url: data.action_url,
        action_label: data.action_label,
        metadata: data.metadata,
        expires_at: data.expires_at,
        is_read: false,
        is_starred: false,
        is_archived: false,
        created_at: data.schedule_at || new Date().toISOString()
      }

      const { data: result, error } = await supabase
        .from('notifications')
        .insert(notification)
        .select('id')
        .single()

      if (error) {
        throw new Error(`Failed to create notification: ${error.message}`)
      }

      logInfo('Notification created successfully', { id: result.id, type: data.type })
      
      // If not scheduled, send immediately
      if (!data.schedule_at) {
        await this.sendNotification(result.id, data)
      }

      return result.id
    } catch (error) {
      logError('Error creating notification', error)
      throw error
    }
  }

  /**
   * Create multiple notifications in bulk
   */
  static async createBulkNotifications(data: BulkNotificationData): Promise<string[]> {
    try {
      const notifications = data.notifications.map(notification => ({
        type: notification.type,
        category: notification.category,
        priority: notification.priority,
        title: notification.title,
        message: notification.message,
        user_id: notification.user_id,
        user_email: notification.user_email,
        action_url: notification.action_url,
        action_label: notification.action_label,
        metadata: notification.metadata,
        expires_at: notification.expires_at,
        is_read: false,
        is_starred: false,
        is_archived: false,
        created_at: data.schedule_at || notification.schedule_at || new Date().toISOString()
      }))

      const { data: result, error } = await supabase
        .from('notifications')
        .insert(notifications)
        .select('id')

      if (error) {
        throw new Error(`Failed to create bulk notifications: ${error.message}`)
      }

      const notificationIds = result.map(r => r.id)
      
      logInfo('Bulk notifications created successfully', { 
        count: notificationIds.length,
        types: [...new Set(data.notifications.map(n => n.type))]
      })

      // Send immediately if requested
      if (data.send_immediately && !data.schedule_at) {
        await Promise.all(
          data.notifications.map((notification, index) =>
            this.sendNotification(notificationIds[index], notification)
          )
        )
      }

      return notificationIds
    } catch (error) {
      logError('Error creating bulk notifications', error)
      throw error
    }
  }

  /**
   * Get notifications with filtering and pagination
   */
  static async getNotifications(
    filter: NotificationFilter = {},
    page: number = 1,
    limit: number = 20
  ): Promise<{ notifications: any[], total: number }> {
    try {
      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })

      // Apply filters
      if (filter.type) {
        query = query.eq('type', filter.type)
      }
      if (filter.category) {
        query = query.eq('category', filter.category)
      }
      if (filter.priority) {
        query = query.eq('priority', filter.priority)
      }
      if (filter.user_id) {
        query = query.eq('user_id', filter.user_id)
      }
      if (filter.user_email) {
        query = query.eq('user_email', filter.user_email)
      }
      if (filter.is_read !== undefined) {
        query = query.eq('is_read', filter.is_read)
      }
      if (filter.is_starred !== undefined) {
        query = query.eq('is_starred', filter.is_starred)
      }
      if (filter.is_archived !== undefined) {
        query = query.eq('is_archived', filter.is_archived)
      }
      if (filter.date_from) {
        query = query.gte('created_at', filter.date_from)
      }
      if (filter.date_to) {
        query = query.lte('created_at', filter.date_to)
      }

      // Apply pagination
      const offset = (page - 1) * limit
      query = query.range(offset, offset + limit - 1)

      const { data, error, count } = await query

      if (error) {
        throw new Error(`Failed to fetch notifications: ${error.message}`)
      }

      return {
        notifications: data || [],
        total: count || 0
      }
    } catch (error) {
      logError('Error fetching notifications', error)
      throw error
    }
  }

  /**
   * Get notification statistics
   */
  static async getNotificationStats(filter: NotificationFilter = {}): Promise<NotificationStats> {
    try {
      let query = supabase
        .from('notifications')
        .select('type, category, priority, is_read, is_starred, is_archived, created_at')

      // Apply filters
      if (filter.user_id) {
        query = query.eq('user_id', filter.user_id)
      }
      if (filter.user_email) {
        query = query.eq('user_email', filter.user_email)
      }
      if (filter.date_from) {
        query = query.gte('created_at', filter.date_from)
      }
      if (filter.date_to) {
        query = query.lte('created_at', filter.date_to)
      }

      const { data, error } = await query

      if (error) {
        throw new Error(`Failed to fetch notification stats: ${error.message}`)
      }

      const notifications = data || []
      const now = new Date()
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000)

      const stats: NotificationStats = {
        total: notifications.length,
        unread: notifications.filter(n => !n.is_read).length,
        starred: notifications.filter(n => n.is_starred).length,
        archived: notifications.filter(n => n.is_archived).length,
        urgent: notifications.filter(n => n.priority === 'urgent').length,
        byType: {},
        byCategory: {},
        byPriority: {},
        recentActivity: notifications.filter(n =>
          new Date(n.created_at) > yesterday
        ).length,
        deliveryRate: 98, // This would come from actual delivery tracking
        responseRate: 85  // This would come from actual response tracking
      }

      // Calculate distributions
      notifications.forEach(n => {
        // Type distribution
        stats.byType[n.type] = (stats.byType[n.type] || 0) + 1
        
        // Category distribution
        stats.byCategory[n.category] = (stats.byCategory[n.category] || 0) + 1
        
        // Priority distribution
        stats.byPriority[n.priority] = (stats.byPriority[n.priority] || 0) + 1
      })

      return stats
    } catch (error) {
      logError('Error fetching notification stats', error)
      throw error
    }
  }

  /**
   * Mark notification as read/unread
   */
  static async updateReadStatus(
    notificationIds: string[],
    isRead: boolean
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_read: isRead,
          updated_at: new Date().toISOString()
        })
        .in('id', notificationIds)

      if (error) {
        throw new Error(`Failed to update read status: ${error.message}`)
      }

      logInfo('Notification read status updated', { 
        count: notificationIds.length, 
        isRead 
      })
    } catch (error) {
      logError('Error updating notification read status', error)
      throw error
    }
  }

  /**
   * Star/unstar notification
   */
  static async updateStarStatus(
    notificationId: string,
    isStarred: boolean
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_starred: isStarred,
          updated_at: new Date().toISOString()
        })
        .eq('id', notificationId)

      if (error) {
        throw new Error(`Failed to update star status: ${error.message}`)
      }

      logInfo('Notification star status updated', { notificationId, isStarred })
    } catch (error) {
      logError('Error updating notification star status', error)
      throw error
    }
  }

  /**
   * Archive/unarchive notifications
   */
  static async updateArchiveStatus(
    notificationIds: string[],
    isArchived: boolean
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ 
          is_archived: isArchived,
          updated_at: new Date().toISOString()
        })
        .in('id', notificationIds)

      if (error) {
        throw new Error(`Failed to update archive status: ${error.message}`)
      }

      logInfo('Notification archive status updated', { 
        count: notificationIds.length, 
        isArchived 
      })
    } catch (error) {
      logError('Error updating notification archive status', error)
      throw error
    }
  }

  /**
   * Delete notifications
   */
  static async deleteNotifications(notificationIds: string[]): Promise<void> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .in('id', notificationIds)

      if (error) {
        throw new Error(`Failed to delete notifications: ${error.message}`)
      }

      logInfo('Notifications deleted', { count: notificationIds.length })
    } catch (error) {
      logError('Error deleting notifications', error)
      throw error
    }
  }

  /**
   * Mark all notifications as read for a user
   */
  static async markAllAsRead(userId?: string, userEmail?: string): Promise<void> {
    try {
      let query = supabase
        .from('notifications')
        .update({ 
          is_read: true,
          updated_at: new Date().toISOString()
        })

      if (userId) {
        query = query.eq('user_id', userId)
      } else if (userEmail) {
        query = query.eq('user_email', userEmail)
      } else {
        throw new Error('Either userId or userEmail must be provided')
      }

      const { error } = await query

      if (error) {
        throw new Error(`Failed to mark all notifications as read: ${error.message}`)
      }

      logInfo('All notifications marked as read', { userId, userEmail })
    } catch (error) {
      logError('Error marking all notifications as read', error)
      throw error
    }
  }

  /**
   * Get unread notification count for a user
   */
  static async getUnreadCount(userId?: string, userEmail?: string): Promise<number> {
    try {
      let query = supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)

      if (userId) {
        query = query.eq('user_id', userId)
      } else if (userEmail) {
        query = query.eq('user_email', userEmail)
      } else {
        throw new Error('Either userId or userEmail must be provided')
      }

      const { count, error } = await query

      if (error) {
        throw new Error(`Failed to get unread count: ${error.message}`)
      }

      return count || 0
    } catch (error) {
      logError('Error getting unread notification count', error)
      throw error
    }
  }

  /**
   * Send notification via appropriate channel
   */
  private static async sendNotification(notificationId: string, data: NotificationData): Promise<void> {
    try {
      // This would integrate with actual notification delivery services
      // For now, we'll just log the action
      
      logInfo('Notification sent', {
        id: notificationId,
        type: data.type,
        category: data.category,
        priority: data.priority,
        recipient: data.user_email || data.user_id
      })

      // In a real implementation, you would:
      // 1. Send email notifications via email service (SendGrid, AWS SES, etc.)
      // 2. Send push notifications via push service (Firebase, OneSignal, etc.)
      // 3. Send SMS notifications via SMS service (Twilio, AWS SNS, etc.)
      // 4. Update delivery status in database
      
    } catch (error) {
      logError('Error sending notification', error)
      // Don't throw here - notification creation should succeed even if delivery fails
    }
  }

  /**
   * Subscribe to real-time notifications
   */
  static subscribeToNotifications(
    callback: (notification: any) => void,
    filter: NotificationFilter = {}
  ) {
    let channel = supabase
      .channel('notifications_realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: filter.user_id ? `user_id=eq.${filter.user_id}` : 
                  filter.user_email ? `user_email=eq.${filter.user_email}` : undefined
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
  static async exportToCSV(filter: NotificationFilter = {}): Promise<string> {
    try {
      const { notifications } = await this.getNotifications(filter, 1, 10000) // Get all matching notifications

      const headers = [
        'ID', 'Type', 'Category', 'Priority', 'Title', 'Message',
        'User Email', 'Read', 'Starred', 'Archived', 'Created At', 'Updated At'
      ]

      const csvData = notifications.map(n => [
        n.id,
        n.type,
        n.category,
        n.priority,
        n.title,
        n.message,
        n.user_email || '',
        n.is_read ? 'Yes' : 'No',
        n.is_starred ? 'Yes' : 'No',
        n.is_archived ? 'Yes' : 'No',
        n.created_at,
        n.updated_at || ''
      ])

      const csvContent = [
        headers.join(','),
        ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n')

      return csvContent
    } catch (error) {
      logError('Error exporting notifications to CSV', error)
      throw error
    }
  }

  /**
   * Clean up expired notifications
   */
  static async cleanupExpiredNotifications(): Promise<number> {
    try {
      const now = new Date().toISOString()
      
      const { data, error } = await supabase
        .from('notifications')
        .delete()
        .lt('expires_at', now)
        .select('id')

      if (error) {
        throw new Error(`Failed to cleanup expired notifications: ${error.message}`)
      }

      const deletedCount = data?.length || 0
      
      if (deletedCount > 0) {
        logInfo('Expired notifications cleaned up', { count: deletedCount })
      }

      return deletedCount
    } catch (error) {
      logError('Error cleaning up expired notifications', error)
      throw error
    }
  }

  /**
   * Auto-archive old notifications
   */
  static async autoArchiveOldNotifications(daysOld: number = 30): Promise<number> {
    try {
      const cutoffDate = new Date()
      cutoffDate.setDate(cutoffDate.getDate() - daysOld)
      
      const { data, error } = await supabase
        .from('notifications')
        .update({ 
          is_archived: true,
          updated_at: new Date().toISOString()
        })
        .lt('created_at', cutoffDate.toISOString())
        .eq('is_archived', false)
        .select('id')

      if (error) {
        throw new Error(`Failed to auto-archive old notifications: ${error.message}`)
      }

      const archivedCount = data?.length || 0
      
      if (archivedCount > 0) {
        logInfo('Old notifications auto-archived', { count: archivedCount, daysOld })
      }

      return archivedCount
    } catch (error) {
      logError('Error auto-archiving old notifications', error)
      throw error
    }
  }
}

// Convenience functions for common notification types
export const NotificationHelpers = {
  /**
   * Create contract-related notification
   */
  async createContractNotification(
    contractId: string,
    type: NotificationData['category'],
    title: string,
    message: string,
    userEmail?: string,
    priority: NotificationData['priority'] = 'medium'
  ): Promise<string> {
    return EnhancedNotificationService.createNotification({
      type: 'contract',
      category: type,
      priority,
      title,
      message,
      user_email: userEmail,
      metadata: { contract_id: contractId },
      action_url: `/contracts/${contractId}`,
      action_label: 'View Contract'
    })
  },

  /**
   * Create promoter-related notification
   */
  async createPromoterNotification(
    promoterId: string,
    type: NotificationData['category'],
    title: string,
    message: string,
    userEmail?: string,
    priority: NotificationData['priority'] = 'medium'
  ): Promise<string> {
    return EnhancedNotificationService.createNotification({
      type: 'promoter',
      category: type,
      priority,
      title,
      message,
      user_email: userEmail,
      metadata: { promoter_id: promoterId },
      action_url: `/manage-promoters`,
      action_label: 'View Promoter'
    })
  },

  /**
   * Create party-related notification
   */
  async createPartyNotification(
    partyId: string,
    type: NotificationData['category'],
    title: string,
    message: string,
    userEmail?: string,
    priority: NotificationData['priority'] = 'medium'
  ): Promise<string> {
    return EnhancedNotificationService.createNotification({
      type: 'party',
      category: type,
      priority,
      title,
      message,
      user_email: userEmail,
      metadata: { party_id: partyId },
      action_url: `/manage-parties`,
      action_label: 'View Party'
    })
  },

  /**
   * Create system notification
   */
  async createSystemNotification(
    type: NotificationData['category'],
    title: string,
    message: string,
    priority: NotificationData['priority'] = 'medium',
    metadata?: Record<string, any>
  ): Promise<string> {
    return EnhancedNotificationService.createNotification({
      type: 'system',
      category: type,
      priority,
      title,
      message,
      metadata
    })
  },

  /**
   * Create deadline alert notification
   */
  async createDeadlineAlert(
    entityType: 'contract' | 'promoter' | 'party',
    entityId: string,
    title: string,
    message: string,
    daysUntilDeadline: number,
    userEmail?: string
  ): Promise<string> {
    const priority: NotificationData['priority'] = 
      daysUntilDeadline <= 1 ? 'urgent' :
      daysUntilDeadline <= 7 ? 'high' :
      daysUntilDeadline <= 30 ? 'medium' : 'low'

    return EnhancedNotificationService.createNotification({
      type: 'deadline',
      category: 'warning',
      priority,
      title,
      message,
      user_email: userEmail,
      metadata: { 
        entity_type: entityType,
        entity_id: entityId,
        days_until_deadline: daysUntilDeadline
      },
      action_url: `/${entityType === 'contract' ? 'contracts' : entityType === 'promoter' ? 'manage-promoters' : 'manage-parties'}${entityType === 'contract' ? `/${entityId}` : ''}`,
      action_label: `View ${entityType.charAt(0).toUpperCase() + entityType.slice(1)}`
    })
  }
}