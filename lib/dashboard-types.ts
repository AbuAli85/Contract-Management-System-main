import type React from "react"

export interface ContractStats {
  totalContracts: number
  activeContracts: number
  expiredContracts: number
  expiringSoonContracts: number
  totalPromoters: number
  totalCompanies: number
}
export interface SummaryWidgetData {
  title: string
  titleAr: string
  value: string | number
  icon: React.ElementType
  trend?: "up" | "down" | "neutral" | string
  comparison?: string
  color?: string
  description?: string
  period?: string
}

export interface ContractReportItem {
  id: string // from contracts.id (via contracts_view)
  contract_id: string // from contracts_view (originally contracts.contract_id)
  promoter_name: string // from contracts_view
  employer_name: string // from contracts_view
  client_name: string // from contracts_view
  start_date: string // from contracts_view (originally contracts.contract_start_date)
  end_date: string // from contracts_view (originally contracts.contract_end_date)
  status: "Active" | "Expired" | "Soon-to-Expire" | "Pending Approval" | "Draft" // from contracts_view (originally contracts.status)
}

export interface ReviewItem {
  id: string
  title: string
  promoter: string
  parties: string
  period: string
  contractLink: string
  submitter?: string
  avatar?: string
}

export interface NotificationItem {
  id: string
  type: "success" | "error" | "warning" | "info" | "default"
  message: string
  created_at: string // Changed from timestamp to match DB
  timestamp?: string // Add timestamp for compatibility  
  context?: string
  is_read?: boolean // Changed from isRead to match DB
  isRead?: boolean // Add isRead for compatibility
  user_email?: string
  related_contract_id?: string
  related_entity_id?: string
  related_entity_type?: string
}

// Row shape from the `notifications` table used in realtime payloads
export interface NotificationRow {
  id: string
  type: NotificationItem["type"]
  message: string
  created_at: string
  user_email?: string | null
  related_contract_id?: string | null
  related_entity_id?: string | null
  related_entity_type?: string | null
  is_read: boolean
}

export interface AuditLogItem {
  id: string
  user: string // Mapped from user_email or "System"
  action: string
  ipAddress: string // Mapped from ip_address
  timestamp: string // ISO Date string from timestamp
  details?: string | object // Mapped from details
}

// Row shape from the `audit_logs` table used in realtime payloads
export interface AuditLogRow {
  id: string
  user_email?: string | null
  action: string
  ip_address?: string | null
  timestamp: string
  details?: string | object | null
}

export interface ContractsByStatusData {
  name: string
  nameAr: string
  count: number
  fill: string
}

export interface ContractsPerMonthData {
  month: string
  contracts: number
}

export interface ContractVolumeData {
  month: string
  volume: number
}

export interface MonthlyContractRevenueDataPoint {
  month: string
  monthAr: string
  contracts: number
  revenue: number
}

// Additional types for the dashboard
export interface DashboardAnalytics {
  total_contracts: number
  active_contracts: number
  pending_contracts: number
  completed_contracts: number
  failed_contracts: number
  contracts_this_month: number
  contracts_last_month: number
  average_processing_time: number
  success_rate: number
  generated_contracts: number
  draft_contracts: number
  expired_contracts: number
  total_parties: number
  total_promoters: number
  revenue_this_month: number
  revenue_last_month: number
  growth_percentage: number
}

export interface PendingReview {
  id: string
  type: "contract" | "promoter" | "party"
  title: string
  description: string
  priority: "high" | "medium" | "low"
  created_at: string
  updated_at: string | null
}

export interface AdminAction {
  id: string
  action: string
  created_at: string
  user_id: string
  details: string
  resource_type: string
  resource_id: string
  user?: User | null
}

export interface AuditLog {
  id: string
  action: string
  entity_type: string
  entity_id: string
  details?: string | null
  user_id?: string | null
  created_at: string
  user?: User | null
}

export interface User {
  id: string
  email: string
  role: string
  created_at: string
  full_name?: string
  last_sign_in_at?: string
}

export interface Notification {
  id: string
  type: "success" | "error" | "warning" | "info" | "default"
  message: string
  timestamp: string
  user_email?: string | undefined
  related_contract_id?: string | undefined
  isRead: boolean
  context?: string | undefined
  user_id: string
}

export interface ServerActionResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
}
