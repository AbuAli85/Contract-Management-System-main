import { supabase } from "./supabase"
import type { Promoter } from "./types"
import { isAfter, isBefore, parseISO, subDays } from "date-fns"

export interface PromoterWithStats extends Promoter {
  active_contracts_count?: number
  total_contracts_count?: number
  document_status?: 'valid' | 'expiring' | 'expired'
  overall_status?: 'active' | 'warning' | 'critical' | 'inactive'
}

export interface PromoterFilter {
  search?: string
  status?: 'all' | 'active' | 'inactive' | 'expiring' | 'expired'
  document_status?: 'all' | 'valid' | 'expiring' | 'expired'
  contract_status?: 'all' | 'with-contracts' | 'without-contracts'
  date_from?: string
  date_to?: string
}

export interface PromoterStats {
  total: number
  active: number
  inactive: number
  documentsExpiring: number
  documentsExpired: number
  withActiveContracts: number
  recentlyAdded: number
  byDocumentStatus: Record<string, number>
  byOverallStatus: Record<string, number>
}

/**
 * Fetch promoters with enhanced statistics and status
 */
export async function fetchPromotersWithStats(): Promise<PromoterWithStats[]> {
  try {
    // Fetch promoters
    const { data: promotersData, error: promotersError } = await supabase
      .from('promoters')
      .select('*')
      .order('name_en')

    if (promotersError) {
      throw new Error(`Failed to fetch promoters: ${promotersError.message}`)
    }

    if (!promotersData || promotersData.length === 0) {
      return []
    }

    // Fetch contract counts for each promoter
    const promoterIds = promotersData.map(p => p.id).filter(Boolean)
    
    const { data: contractsData, error: contractsError } = await supabase
      .from('contracts')
      .select('promoter_id, contract_end_date, status, created_at')
      .in('promoter_id', promoterIds)

    if (contractsError) {
      console.warn('Error fetching contract data:', contractsError)
    }

    // Enhance promoters with stats and status
    const enhancedPromoters = promotersData
      .filter(promoter => promoter.id)
      .map(promoter => {
        const promoterContracts = contractsData?.filter(c => c.promoter_id === promoter.id) || []
        const activeContracts = promoterContracts.filter(c => 
          c.contract_end_date && 
          isAfter(parseISO(c.contract_end_date), new Date()) &&
          c.status === 'active'
        )

        const documentStatus = determineDocumentStatus(promoter)
        const overallStatus = determineOverallStatus(promoter, activeContracts.length, documentStatus)

        return {
          ...promoter,
          active_contracts_count: activeContracts.length,
          total_contracts_count: promoterContracts.length,
          document_status: documentStatus,
          overall_status: overallStatus
        }
      })

    return enhancedPromoters
  } catch (error) {
    console.error('Error fetching promoters with stats:', error)
    throw error
  }
}

/**
 * Get promoter statistics
 */
export async function getPromoterStats(): Promise<PromoterStats> {
  try {
    const promoters = await fetchPromotersWithStats()
    const now = new Date()
    const sevenDaysAgo = subDays(now, 7)
    
    const stats: PromoterStats = {
      total: promoters.length,
      active: promoters.filter(p => p.overall_status === 'active').length,
      inactive: promoters.filter(p => p.overall_status === 'inactive').length,
      documentsExpiring: promoters.filter(p => p.document_status === 'expiring').length,
      documentsExpired: promoters.filter(p => p.document_status === 'expired').length,
      withActiveContracts: promoters.filter(p => (p.active_contracts_count || 0) > 0).length,
      recentlyAdded: promoters.filter(p => 
        p.created_at && isAfter(parseISO(p.created_at), sevenDaysAgo)
      ).length,
      byDocumentStatus: {},
      byOverallStatus: {}
    }

    // Calculate distributions
    promoters.forEach(p => {
      // Document status distribution
      const docStatus = p.document_status || 'unknown'
      stats.byDocumentStatus[docStatus] = (stats.byDocumentStatus[docStatus] || 0) + 1
      
      // Overall status distribution
      const overallStatus = p.overall_status || 'unknown'
      stats.byOverallStatus[overallStatus] = (stats.byOverallStatus[overallStatus] || 0) + 1
    })

    return stats
  } catch (error) {
    console.error('Error getting promoter stats:', error)
    throw error
  }
}

/**
 * Search and filter promoters
 */
export async function searchPromoters(filter: PromoterFilter = {}): Promise<PromoterWithStats[]> {
  try {
    let promoters = await fetchPromotersWithStats()

    // Apply search filter
    if (filter.search) {
      const searchLower = filter.search.toLowerCase()
      promoters = promoters.filter(p =>
        p.name_en?.toLowerCase().includes(searchLower) ||
        p.name_ar?.toLowerCase().includes(searchLower) ||
        p.id_card_number?.toLowerCase().includes(searchLower) ||
        p.email?.toLowerCase().includes(searchLower) ||
        p.phone?.toLowerCase().includes(searchLower)
      )
    }

    // Apply status filter
    if (filter.status && filter.status !== 'all') {
      if (filter.status === 'active') {
        promoters = promoters.filter(p => p.overall_status === 'active')
      } else if (filter.status === 'inactive') {
        promoters = promoters.filter(p => p.overall_status === 'inactive')
      } else if (filter.status === 'expiring') {
        promoters = promoters.filter(p => p.document_status === 'expiring')
      } else if (filter.status === 'expired') {
        promoters = promoters.filter(p => p.document_status === 'expired')
      }
    }

    // Apply document status filter
    if (filter.document_status && filter.document_status !== 'all') {
      promoters = promoters.filter(p => p.document_status === filter.document_status)
    }

    // Apply contract status filter
    if (filter.contract_status && filter.contract_status !== 'all') {
      if (filter.contract_status === 'with-contracts') {
        promoters = promoters.filter(p => (p.active_contracts_count || 0) > 0)
      } else if (filter.contract_status === 'without-contracts') {
        promoters = promoters.filter(p => (p.active_contracts_count || 0) === 0)
      }
    }

    // Apply date filters
    if (filter.date_from) {
      promoters = promoters.filter(p => 
        p.created_at && isAfter(parseISO(p.created_at), parseISO(filter.date_from!))
      )
    }

    if (filter.date_to) {
      promoters = promoters.filter(p => 
        p.created_at && isBefore(parseISO(p.created_at), parseISO(filter.date_to!))
      )
    }

    return promoters
  } catch (error) {
    console.error('Error searching promoters:', error)
    throw error
  }
}

/**
 * Get promoters with expiring documents
 */
export async function getPromotersWithExpiringDocuments(daysAhead: number = 30): Promise<PromoterWithStats[]> {
  try {
    const promoters = await fetchPromotersWithStats()
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + daysAhead)
    
    return promoters.filter(promoter => {
      const idCardExpiry = promoter.id_card_expiry_date ? parseISO(promoter.id_card_expiry_date) : null
      const passportExpiry = promoter.passport_expiry_date ? parseISO(promoter.passport_expiry_date) : null
      
      return (
        (idCardExpiry && isBefore(idCardExpiry, futureDate) && isAfter(idCardExpiry, new Date())) ||
        (passportExpiry && isBefore(passportExpiry, futureDate) && isAfter(passportExpiry, new Date()))
      )
    })
  } catch (error) {
    console.error('Error getting promoters with expiring documents:', error)
    throw error
  }
}

/**
 * Get promoters with expired documents
 */
export async function getPromotersWithExpiredDocuments(): Promise<PromoterWithStats[]> {
  try {
    const promoters = await fetchPromotersWithStats()
    const now = new Date()
    
    return promoters.filter(promoter => {
      const idCardExpiry = promoter.id_card_expiry_date ? parseISO(promoter.id_card_expiry_date) : null
      const passportExpiry = promoter.passport_expiry_date ? parseISO(promoter.passport_expiry_date) : null
      
      return (
        (idCardExpiry && isBefore(idCardExpiry, now)) ||
        (passportExpiry && isBefore(passportExpiry, now))
      )
    })
  } catch (error) {
    console.error('Error getting promoters with expired documents:', error)
    throw error
  }
}

/**
 * Update promoter status
 */
export async function updatePromoterStatus(
  promoterId: string, 
  status: "Active" | "Inactive" | "Suspended"
): Promise<void> {
  try {
    const { error } = await supabase
      .from('promoters')
      .update({ status })
      .eq('id', promoterId)

    if (error) {
      throw new Error(`Failed to update promoter status: ${error.message}`)
    }
  } catch (error) {
    console.error('Error updating promoter status:', error)
    throw error
  }
}

/**
 * Bulk update promoter statuses
 */
export async function bulkUpdatePromoterStatus(
  promoterIds: string[], 
  status: "Active" | "Inactive" | "Suspended"
): Promise<void> {
  try {
    const { error } = await supabase
      .from('promoters')
      .update({ status })
      .in('id', promoterIds)

    if (error) {
      throw new Error(`Failed to bulk update promoter status: ${error.message}`)
    }
  } catch (error) {
    console.error('Error bulk updating promoter status:', error)
    throw error
  }
}

/**
 * Delete promoters
 */
export async function deletePromoters(promoterIds: string[]): Promise<void> {
  try {
    const { error } = await supabase
      .from('promoters')
      .delete()
      .in('id', promoterIds)

    if (error) {
      throw new Error(`Failed to delete promoters: ${error.message}`)
    }
  } catch (error) {
    console.error('Error deleting promoters:', error)
    throw error
  }
}

/**
 * Get promoter activity summary
 */
export async function getPromoterActivitySummary(promoterId: string) {
  try {
    // Get contracts count for the promoter
    const { count: contractsCount, error: contractsError } = await supabase
      .from('contracts')
      .select('*', { count: 'exact', head: true })
      .eq('promoter_id', promoterId)

    if (contractsError) {
      console.warn('Error fetching contracts count:', contractsError)
    }

    // Get recent contracts
    const { data: recentContracts, error: recentError } = await supabase
      .from('contracts')
      .select('id, created_at, status, first_party_name_en, second_party_name_en, contract_start_date, contract_end_date')
      .eq('promoter_id', promoterId)
      .order('created_at', { ascending: false })
      .limit(5)

    if (recentError) {
      console.warn('Error fetching recent contracts:', recentError)
    }

    // Get contracts by status
    const { data: contractsByStatus, error: statusError } = await supabase
      .from('contracts')
      .select('status')
      .eq('promoter_id', promoterId)

    if (statusError) {
      console.warn('Error fetching contracts by status:', statusError)
    }

    const statusCounts = (contractsByStatus || []).reduce((acc, contract) => {
      acc[contract.status || 'unknown'] = (acc[contract.status || 'unknown'] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    return {
      contracts_count: contractsCount || 0,
      recent_contracts: recentContracts || [],
      status_breakdown: statusCounts,
    }
  } catch (error) {
    console.error('Error getting promoter activity summary:', error)
    return {
      contracts_count: 0,
      recent_contracts: [],
      status_breakdown: {},
    }
  }
}

/**
 * Export promoters to CSV
 */
export async function exportPromotersToCSV(filter: PromoterFilter = {}): Promise<string> {
  try {
    const promoters = await searchPromoters(filter)
    
    const headers = [
      'ID', 'Name (EN)', 'Name (AR)', 'ID Card Number', 'Email', 'Phone',
      'ID Card Expiry', 'Passport Expiry', 'Active Contracts', 'Total Contracts',
      'Document Status', 'Overall Status', 'Created At'
    ]
    
    const csvData = promoters.map(p => [
      p.id,
      p.name_en || '',
      p.name_ar || '',
      p.id_card_number || '',
      p.email || '',
      p.phone || '',
      p.id_card_expiry_date || '',
      p.passport_expiry_date || '',
      p.active_contracts_count || 0,
      p.total_contracts_count || 0,
      p.document_status || '',
      p.overall_status || '',
      p.created_at || ''
    ])

    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n')

    return csvContent
  } catch (error) {
    console.error('Error exporting promoters to CSV:', error)
    throw error
  }
}

/**
 * Get document expiry alerts for promoters
 */
export async function getPromoterDocumentAlerts(daysAhead: number = 30) {
  try {
    const futureDate = new Date()
    futureDate.setDate(futureDate.getDate() + daysAhead)
    
    const { data: promoters, error } = await supabase
      .from('promoters')
      .select('id, name_en, name_ar, id_card_number, id_card_expiry_date, passport_expiry_date, email')
      .or(`id_card_expiry_date.lte.${futureDate.toISOString()},passport_expiry_date.lte.${futureDate.toISOString()}`)
      .order('id_card_expiry_date', { ascending: true })

    if (error) {
      console.warn('Error fetching promoter document alerts:', error)
      return {
        id_card_expiring: [],
        passport_expiring: [],
      }
    }

    const now = new Date()
    const idCardExpiring = (promoters || []).filter(p => 
      p.id_card_expiry_date && 
      isBefore(parseISO(p.id_card_expiry_date), futureDate) &&
      isAfter(parseISO(p.id_card_expiry_date), now)
    )

    const passportExpiring = (promoters || []).filter(p => 
      p.passport_expiry_date && 
      isBefore(parseISO(p.passport_expiry_date), futureDate) &&
      isAfter(parseISO(p.passport_expiry_date), now)
    )

    return {
      id_card_expiring: idCardExpiring,
      passport_expiring: passportExpiring,
    }
  } catch (error) {
    console.error('Error getting promoter document alerts:', error)
    return {
      id_card_expiring: [],
      passport_expiring: [],
    }
  }
}

/**
 * Validate unique ID card number
 */
export async function validateUniqueIdCard(idCardNumber: string, excludeId?: string): Promise<boolean> {
  try {
    let query = supabase
      .from('promoters')
      .select('id')
      .eq('id_card_number', idCardNumber)

    if (excludeId) {
      query = query.neq('id', excludeId)
    }

    const { data, error } = await query

    if (error) {
      console.warn('Error validating ID card number:', error)
      return true // Allow on error to avoid blocking
    }

    return (data || []).length === 0
  } catch (error) {
    console.warn('Error validating ID card number:', error)
    return true
  }
}

/**
 * Helper function to determine document status
 */
function determineDocumentStatus(promoter: Promoter): 'valid' | 'expiring' | 'expired' {
  const now = new Date()
  const idCardExpiry = promoter.id_card_expiry_date ? parseISO(promoter.id_card_expiry_date) : null
  const passportExpiry = promoter.passport_expiry_date ? parseISO(promoter.passport_expiry_date) : null

  // Check if any document is expired
  if ((idCardExpiry && isBefore(idCardExpiry, now)) || (passportExpiry && isBefore(passportExpiry, now))) {
    return 'expired'
  }

  // Check if any document is expiring within 30 days
  const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
  if (
    (idCardExpiry && isBefore(idCardExpiry, thirtyDaysFromNow)) ||
    (passportExpiry && isBefore(passportExpiry, thirtyDaysFromNow))
  ) {
    return 'expiring'
  }

  return 'valid'
}

/**
 * Helper function to determine overall status
 */
function determineOverallStatus(
  promoter: Promoter, 
  activeContracts: number, 
  documentStatus: 'valid' | 'expiring' | 'expired'
): 'active' | 'warning' | 'critical' | 'inactive' {
  if (documentStatus === 'expired') return 'critical'
  if (documentStatus === 'expiring') return 'warning'
  if (activeContracts > 0) return 'active'
  
  return 'inactive'
}