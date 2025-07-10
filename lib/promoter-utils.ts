import { differenceInDays, parseISO } from "date-fns"
import type { Promoter } from "./types"

export interface EnhancedPromoter extends Promoter {
  id_card_status: "valid" | "expiring" | "expired" | "missing"
  passport_status: "valid" | "expiring" | "expired" | "missing"
  overall_status: "active" | "warning" | "critical" | "inactive"
  days_until_id_expiry?: number
  days_until_passport_expiry?: number
}

export interface PromoterStats {
  total: number
  active: number
  expiring_documents: number
  expired_documents: number
  total_contracts: number
  with_contracts: number
  without_contracts: number
  critical_status: number
  warning_status: number
}

/**
 * Get document status type based on expiry date
 */
export const getDocumentStatusType = (
  daysUntilExpiry: number | null, 
  dateString: string | null
): "valid" | "expiring" | "expired" | "missing" => {
  if (!dateString) return "missing"
  if (daysUntilExpiry === null) return "missing"
  if (daysUntilExpiry < 0) return "expired"
  if (daysUntilExpiry <= 30) return "expiring"
  return "valid"
}

/**
 * Get overall status based on contract count and document status
 */
export const getOverallStatus = (promoter: Promoter): "active" | "warning" | "critical" | "inactive" => {
  if (!promoter.status || promoter.status === "inactive") return "inactive"
  
  const idExpiry = promoter.id_card_expiry_date 
    ? differenceInDays(parseISO(promoter.id_card_expiry_date), new Date()) 
    : null
  const passportExpiry = promoter.passport_expiry_date 
    ? differenceInDays(parseISO(promoter.passport_expiry_date), new Date()) 
    : null
  
  if ((idExpiry !== null && idExpiry < 0) || (passportExpiry !== null && passportExpiry < 0)) {
    return "critical"
  }
  
  if ((idExpiry !== null && idExpiry <= 30) || (passportExpiry !== null && passportExpiry <= 30)) {
    return "warning"
  }
  
  return "active"
}

/**
 * Enhance promoter data with calculated fields
 */
export const enhancePromoter = (promoter: Promoter): EnhancedPromoter => {
  const idExpiryDays = promoter.id_card_expiry_date 
    ? differenceInDays(parseISO(promoter.id_card_expiry_date), new Date())
    : null

  const passportExpiryDays = promoter.passport_expiry_date
    ? differenceInDays(parseISO(promoter.passport_expiry_date), new Date())
    : null

  return {
    ...promoter,
    id_card_status: getDocumentStatusType(idExpiryDays, promoter.id_card_expiry_date || null),
    passport_status: getDocumentStatusType(passportExpiryDays, promoter.passport_expiry_date || null),
    overall_status: getOverallStatus(promoter),
    days_until_id_expiry: idExpiryDays || undefined,
    days_until_passport_expiry: passportExpiryDays || undefined,
  }
}

/**
 * Calculate statistics from enhanced promoter data
 */
export const calculatePromoterStats = (promoters: EnhancedPromoter[]): PromoterStats => {
  const total = promoters.length
  const active = promoters.filter(p => p.overall_status === "active").length
  const expiring = promoters.filter(p => p.overall_status === "warning").length
  const expired = promoters.filter(p => p.overall_status === "critical").length
  const totalContracts = promoters.reduce((sum, p) => sum + (p.active_contracts_count || 0), 0)
  const withContracts = promoters.filter(p => (p.active_contracts_count || 0) > 0).length
  const withoutContracts = total - withContracts

  return {
    total,
    active,
    expiring_documents: expiring,
    expired_documents: expired,
    total_contracts: totalContracts,
    with_contracts: withContracts,
    without_contracts: withoutContracts,
    critical_status: expired,
    warning_status: expiring,
  }
}

/**
 * Export promoters to CSV format
 */
export const exportPromotersToCSV = (promoters: EnhancedPromoter[]): string => {
  const headers = [
    'Name (EN)',
    'Name (AR)', 
    'ID Card Number',
    'ID Card Status',
    'ID Card Expiry',
    'Passport Status', 
    'Passport Expiry',
    'Active Contracts',
    'Overall Status',
    'Created Date',
    'Notes'
  ]

  const rows = promoters.map(promoter => [
    promoter.name_en,
    promoter.name_ar,
    promoter.id_card_number,
    promoter.id_card_status,
    promoter.id_card_expiry_date || 'N/A',
    promoter.passport_status,
    promoter.passport_expiry_date || 'N/A', 
    (promoter.active_contracts_count || 0).toString(),
    promoter.overall_status,
    promoter.created_at || 'N/A',
    promoter.notes || ''
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return csvContent
}

/**
 * Filter promoters based on search criteria
 */
export const filterPromoters = (
  promoters: Promoter[],
  searchTerm: string,
  filterStatus: string,
  documentFilter: string
): Promoter[] => {
  return promoters.filter(promoter => {
    // Search filter
    const searchMatch = !searchTerm || 
      promoter.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promoter.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
      promoter.id_card_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (promoter.notes && promoter.notes.toLowerCase().includes(searchTerm.toLowerCase()))

    // Status filter
    const statusMatch = filterStatus === "all" ||
      (filterStatus === "active" && (promoter.active_contracts_count || 0) > 0) ||
      (filterStatus === "inactive" && (promoter.active_contracts_count || 0) === 0)

    return searchMatch && statusMatch
  })
}

/**
 * Sort promoters by specified criteria
 */
export const sortPromoters = (
  promoters: EnhancedPromoter[],
  sortBy: "name" | "id_expiry" | "passport_expiry" | "contracts",
  sortOrder: "asc" | "desc"
): EnhancedPromoter[] => {
  return [...promoters].sort((a, b) => {
    let aValue: any, bValue: any
    
    switch (sortBy) {
      case "name":
        aValue = a.name_en.toLowerCase()
        bValue = b.name_en.toLowerCase()
        break
      case "id_expiry":
        aValue = a.days_until_id_expiry ?? Infinity
        bValue = b.days_until_id_expiry ?? Infinity
        break
      case "passport_expiry":
        aValue = a.days_until_passport_expiry ?? Infinity
        bValue = b.days_until_passport_expiry ?? Infinity
        break
      case "contracts":
        aValue = a.active_contracts_count || 0
        bValue = b.active_contracts_count || 0
        break
      default:
        aValue = a.name_en.toLowerCase()
        bValue = b.name_en.toLowerCase()
    }

    if (sortOrder === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    }
  })
}
