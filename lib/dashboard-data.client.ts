import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import type { Database } from '@/types/supabase'
import type { 
  DashboardAnalytics, 
  PendingReview, 
  AdminAction, 
  AuditLog, 
  Notification, 
  User 
} from '@/lib/dashboard-types'

const getSupabaseClient = () => createClientComponentClient<Database>()

export async function getDashboardAnalytics(): Promise<DashboardAnalytics> {
  try {
    const supabase = getSupabaseClient()
    const { data: contracts, error } = await supabase
      .from('contracts')
      .select('status, created_at')

    if (error) throw error
    if (!contracts) return {
      total_contracts: 0,
      pending_contracts: 0,
      completed_contracts: 0,
      failed_contracts: 0,
      contracts_this_month: 0,
      contracts_last_month: 0,
      average_processing_time: 0,
      success_rate: 0,
      active_contracts: 0,
      generated_contracts: 0,
      draft_contracts: 0,
      expired_contracts: 0,
      total_parties: 0,
      total_promoters: 0,
      revenue_this_month: 0,
      revenue_last_month: 0,
      growth_percentage: 0
    }

    const now = new Date()
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
    const total_contracts = contracts.length
    const pending_contracts = contracts.filter(c => c.status === 'pending').length
    const completed_contracts = contracts.filter(c => c.status === 'completed').length
    const failed_contracts = contracts.filter(c => c.status === 'failed').length
    const contracts_this_month = contracts.filter(c => c.created_at && new Date(c.created_at) >= lastMonth).length
    const contracts_last_month = contracts.filter(c => {
      if (!c.created_at) return false
      const contractDate = new Date(c.created_at)
      const twoMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, now.getDate())
      return contractDate >= twoMonthsAgo && contractDate < lastMonth
    }).length

    const average_processing_time = 2.5 // Mock value
    const success_rate = total_contracts > 0 ? (completed_contracts / total_contracts) * 100 : 0

    return {
      total_contracts,
      pending_contracts,
      completed_contracts,
      failed_contracts,
      contracts_this_month,
      contracts_last_month,
      average_processing_time,
      success_rate,
      active_contracts: 0, // Placeholder
      generated_contracts: 0, // Placeholder
      draft_contracts: 0, // Placeholder
      expired_contracts: 0, // Placeholder
      total_parties: 0, // Placeholder
      total_promoters: 0, // Placeholder
      revenue_this_month: 0, // Placeholder
      revenue_last_month: 0, // Placeholder
      growth_percentage: 0 // Placeholder
    }
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error)
    return {
      total_contracts: 0,
      pending_contracts: 0,
      completed_contracts: 0,
      failed_contracts: 0,
      contracts_this_month: 0,
      contracts_last_month: 0,
      average_processing_time: 0,
      success_rate: 0,
      active_contracts: 0,
      generated_contracts: 0,
      draft_contracts: 0,
      expired_contracts: 0,
      total_parties: 0,
      total_promoters: 0,
      revenue_this_month: 0,
      revenue_last_month: 0,
      growth_percentage: 0
    }
  }
}

export async function getPendingReviews(): Promise<PendingReview[]> {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('contracts')
      .select('id, contract_name, status, updated_at, created_at')
      .eq('status', 'pending')
      .order('updated_at', { ascending: false })
      .limit(10)

    if (error) throw error
    if (!data) return []

    return data.map(contract => ({
      id: contract.id,
      title: contract.contract_name || 'Untitled Contract',
      type: 'contract',
      description: `Contract pending since ${new Date(contract.created_at || Date.now()).toLocaleDateString()}`,
      priority: 'medium',
      created_at: contract.created_at || new Date().toISOString(),
      updated_at: contract.updated_at || null
    }))
  } catch (error) {
    console.error("Error fetching pending reviews:", error)
    return []
  }
}

export async function getAdminActions(): Promise<AdminAction[]> {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        id, action, created_at, user_id, details, table_name, record_id,
        users ( id, email, role, created_at )
      `)
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error
    if (!data) return []

    return data.map(log => ({
      id: log.id,
      action: log.action || 'unknown',
      created_at: log.created_at,
      user_id: log.user_id || '',
      details: log.details ? JSON.stringify(log.details) : '',
      resource_type: log.table_name || 'unknown',
      resource_id: log.record_id || 'unknown',
      user: Array.isArray(log.users) ? log.users[0] : log.users
    }))
  } catch (error) {
    console.error("Error fetching admin actions:", error)
    return []
  }
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('audit_logs')
      .select(`
        id, action, created_at, user_id, details, table_name, record_id,
        users ( id, email, role, created_at )
      `)
      .order('created_at', { ascending: false })
      .limit(50)

    if (error) throw error
    if (!data) return []

    return data.map(log => ({
      id: log.id,
      action: log.action || 'unknown',
      created_at: log.created_at,
      user_id: log.user_id,
      details: log.details ? JSON.stringify(log.details) : '',
      entity_type: log.table_name || 'unknown',
      entity_id: log.record_id || 'unknown',
      user: Array.isArray(log.users) ? log.users[0] : log.users
    }))
  } catch (error) {
    console.error("Error fetching audit logs:", error)
    return []
  }
}

export async function getNotifications(): Promise<Notification[]> {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20)

    if (error) throw error
    if (!data) return []

    return data.map(notification => ({
      id: notification.id,
      message: notification.message || '',
      created_at: notification.created_at,
      isRead: notification.is_read || false,
      type: notification.type as any || 'info',
      user_id: notification.user_id || '',
      timestamp: notification.created_at,
    }))
  } catch (error) {
    console.error("Error fetching notifications:", error)
    return []
  }
}

export async function getUsers(): Promise<User[]> {
  try {
    const supabase = getSupabaseClient()
    const { data, error } = await supabase
      .from('users')
      .select('id, email, role, created_at')
      .limit(20)

    if (error) throw error
    if (!data) return []

    return data.map(user => ({
      id: user.id,
      email: user.email || '',
      role: user.role || 'User',
      created_at: user.created_at,
      full_name: undefined, // Not available in users table
      last_sign_in_at: undefined, // Not available in users table
    }))
  } catch (error) {
    console.error("Error fetching users:", error)
    return []
  }
}
