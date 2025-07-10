import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"
import type { Database } from "@/types/supabase"

import 'server-only' // Mark this module as server-only
import type {
  AdminAction,
  AuditLog,
  DashboardAnalytics,
  Notification,
  PendingReview,
  ServerActionResponse,
  User,
} from "./dashboard-types"

const createSupabaseClient = () => createServerComponentClient<Database>({ cookies })

// Server-only implementations
export async function getDashboardAnalyticsSrv(): Promise<ServerActionResponse<DashboardAnalytics>> {
  const supabase = createSupabaseClient()

  const { data, error } = await supabase.rpc("get_dashboard_analytics")

  if (error || !data) {
    console.error("Error fetching dashboard analytics:", error)
    return {
      success: false,
      message: `Failed to fetch dashboard analytics: ${error?.message || 'No data returned'}`,
    }
  }

  // Assuming the RPC returns a single object with the analytics
  const analyticsData = Array.isArray(data) ? data[0] : data

  return {
    success: true,
    message: "Dashboard analytics fetched successfully.",
    data: analyticsData as unknown as DashboardAnalytics,
  }
}

// Add other server-only implementations
export async function getPendingReviewsSrv(): Promise<ServerActionResponse<PendingReview[]>> {
  const supabase = createSupabaseClient()
  try {
    const { data, error } = await supabase
      .from("contracts")
      .select("id, contract_name, status, updated_at, created_at")
      .in("status", ["pending", "processing", "Pending Review"])
      .order("updated_at", { ascending: false })
      .limit(10)

    if (error) {
      console.error("Error fetching pending reviews:", error)
      return {
        success: false,
        message: `Failed to fetch pending reviews: ${error.message}`,
      }
    }

    const reviews: PendingReview[] = (data || []).map((contract) => ({
      id: contract.id,
      title: contract.contract_name || 'Untitled Contract',
      type: 'contract',
      description: `Contract pending since ${new Date(contract.created_at || Date.now()).toLocaleDateString()}`,
      priority: 'medium',
      created_at: contract.created_at || new Date().toISOString(),
      updated_at: contract.updated_at || null,
    }))

    return {
      success: true,
      message: "Pending reviews fetched successfully.",
      data: reviews,
    }
  } catch (error) {
    console.error("Error in getPendingReviews:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${(error as Error).message}`,
    }
  }
}

export async function getAdminActionsSrv(): Promise<ServerActionResponse<AdminAction[]>> {
  const supabase = createSupabaseClient()
  try {
    const { data, error } = await supabase
      .from("audit_logs")
      .select(`
        id, action, created_at, user_id, details, table_name, record_id,
        users ( id, email, role, created_at )
      `)
      .order("created_at", { ascending: false })
      .limit(10)

    if (error) {
      console.error("Error fetching admin actions:", error)
      return {
        success: false,
        message: `Failed to fetch admin actions: ${error.message}`,
      }
    }

    const adminActions: AdminAction[] = (data || []).map((log) => ({
      id: log.id,
      action: log.action || 'unknown',
      created_at: log.created_at,
      user_id: log.user_id || '',
      details: log.details ? JSON.stringify(log.details) : '',
      resource_type: log.table_name || 'unknown',
      resource_id: log.record_id || 'unknown',
      user: Array.isArray(log.users) ? log.users[0] : log.users,
    }))

    return {
      success: true,
      message: "Admin actions fetched successfully.",
      data: adminActions,
    }
  } catch (error) {
    console.error("Error in getAdminActions:", error)
    return {
      success: false,
      message: `An unexpected error occurred: ${(error as Error).message}`,
    }
  }
}

export async function getAuditLogsSrv(): Promise<ServerActionResponse<AuditLog[]>> {
  const supabase = createSupabaseClient()
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        id, action, created_at, user_id, details, table_name, record_id,
        users ( id, email, role, created_at )
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) {
      console.error("Error fetching audit logs:", error)
      return { success: false, message: `Failed to fetch audit logs: ${error.message}` }
    }

    const auditLogs: AuditLog[] = (data || []).map(log => ({
      id: log.id,
      action: log.action || 'unknown',
      created_at: log.created_at,
      user_id: log.user_id,
      details: log.details ? JSON.stringify(log.details) : '',
      entity_type: log.table_name || 'unknown',
      entity_id: log.record_id || 'unknown',
      user: Array.isArray(log.users) ? log.users[0] : log.users
    }))

    return { success: true, data: auditLogs, message: "Audit logs fetched successfully." }

  } catch (error) {
    console.error("Error in getAuditLogs:", error)
    return { success: false, message: `An unexpected error occurred: ${(error as Error).message}` }
  }
}

export async function getNotificationsSrv(): Promise<ServerActionResponse<Notification[]>> {
  const supabase = createSupabaseClient()
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) {
      console.error("Error fetching notifications:", error)
      return { success: false, message: `Failed to fetch notifications: ${error.message}` }
    }

    const notifications: Notification[] = (data || []).map(n => ({
      id: n.id,
      message: n.message || '',
      created_at: n.created_at,
      isRead: n.is_read || false,
      type: n.type as any || 'info',
      user_id: n.user_id || '',
      timestamp: n.created_at,
    }))

    return { success: true, data: notifications, message: "Notifications fetched successfully." }

  } catch (error) {
    console.error("Error fetching notifications:", error)
    return { success: false, message: `An unexpected error occurred: ${(error as Error).message}` }
  }
}

export async function getUsersSrv(): Promise<ServerActionResponse<User[]>> {
  const supabase = createSupabaseClient()
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, created_at')
      .limit(20)

    if (error) {
      console.error("Error fetching users:", error)
      return { success: false, message: `Failed to fetch users: ${error.message}` }
    }

    const users: User[] = (data || []).map(u => ({
      id: u.id,
      email: u.email || '',
      role: u.role || 'User',
      created_at: u.created_at,
    }))

    return { success: true, data: users, message: "Users fetched successfully." }

  } catch (error) {
    console.error("Error fetching users:", error)
    return { success: false, message: `An unexpected error occurred: ${(error as Error).message}` }
  }
}
