import { supabase } from "./supabase"
import { format, subDays, startOfMonth, endOfMonth, isAfter, isBefore, parseISO } from "date-fns"

export interface AnalyticsTimeRange {
  start: Date
  end: Date
  label: string
}

export interface ContractAnalytics {
  total: number
  active: number
  pending: number
  expired: number
  expiringSoon: number
  recentlyCreated: number
  monthlyGrowth: number
  averageValue: number
  totalValue: number
  statusDistribution: Record<string, number>
  monthlyTrends: Array<{
    month: string
    contracts: number
    value: number
  }>
  processingMetrics: {
    averageTime: number
    successRate: number
    completionRate: number
  }
}

export interface PromoterAnalytics {
  total: number
  active: number
  inactive: number
  documentsExpiring: number
  documentsExpired: number
  withActiveContracts: number
  recentlyAdded: number
  statusDistribution: Record<string, number>
  documentStatusTrends: Array<{
    month: string
    expiring: number
    expired: number
    renewed: number
  }>
  performanceMetrics: {
    averageContractsPerPromoter: number
    topPerformers: Array<{
      id: string
      name: string
      contractCount: number
    }>
  }
}

export interface PartyAnalytics {
  total: number
  active: number
  inactive: number
  withContracts: number
  documentsExpiring: number
  documentsExpired: number
  byType: Record<string, number>
  statusDistribution: Record<string, number>
  contractDistribution: Array<{
    partyId: string
    partyName: string
    contractCount: number
    totalValue: number
  }>
  complianceMetrics: {
    documentComplianceRate: number
    renewalRate: number
    averageContractDuration: number
  }
}

export interface SystemAnalytics {
  userActivity: {
    totalUsers: number
    activeUsers: number
    dailyActiveUsers: number
    userGrowth: number
  }
  performance: {
    averageResponseTime: number
    systemUptime: number
    errorRate: number
    throughput: number
  }
  usage: {
    totalActions: number
    mostUsedFeatures: Array<{
      feature: string
      usage: number
    }>
    peakUsageHours: Array<{
      hour: number
      usage: number
    }>
  }
}

export interface AlertAnalytics {
  total: number
  byPriority: Record<string, number>
  byType: Record<string, number>
  resolved: number
  pending: number
  averageResolutionTime: number
  trends: Array<{
    date: string
    alerts: number
    resolved: number
  }>
}

/**
 * Get comprehensive contract analytics
 */
export async function getContractAnalytics(timeRange?: AnalyticsTimeRange): Promise<ContractAnalytics> {
  try {
    const { data: contracts, error } = await supabase
      .from('contracts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch contracts for analytics: ${error.message}`)
    }

    const contractsData = contracts || []
    const now = new Date()
    const thirtyDaysAgo = subDays(now, 30)
    const thisMonthStart = startOfMonth(now)
    const lastMonthStart = startOfMonth(subDays(now, 30))
    const lastMonthEnd = endOfMonth(subDays(now, 30))

    // Filter by time range if provided
    const filteredContracts = timeRange 
      ? contractsData.filter(c => {
          const createdAt = parseISO(c.created_at)
          return isAfter(createdAt, timeRange.start) && isBefore(createdAt, timeRange.end)
        })
      : contractsData

    // Basic metrics
    const total = filteredContracts.length
    const active = filteredContracts.filter(c => c.status === 'active').length
    const pending = filteredContracts.filter(c => c.status === 'pending').length
    const expired = filteredContracts.filter(c => c.status === 'expired').length
    
    const expiringSoon = filteredContracts.filter(c => {
      if (!c.contract_end_date) return false
      const endDate = parseISO(c.contract_end_date)
      const daysUntilExpiry = Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      return daysUntilExpiry <= 30 && daysUntilExpiry > 0
    }).length

    const recentlyCreated = filteredContracts.filter(c => 
      isAfter(parseISO(c.created_at), thirtyDaysAgo)
    ).length

    // Monthly growth calculation
    const thisMonthContracts = contractsData.filter(c => 
      isAfter(parseISO(c.created_at), thisMonthStart)
    ).length
    const lastMonthContracts = contractsData.filter(c => 
      isAfter(parseISO(c.created_at), lastMonthStart) && 
      isBefore(parseISO(c.created_at), lastMonthEnd)
    ).length

    const monthlyGrowth = lastMonthContracts > 0 
      ? Math.round(((thisMonthContracts - lastMonthContracts) / lastMonthContracts) * 100)
      : 0

    // Value calculations
    const contractsWithValue = filteredContracts.filter(c => c.contract_value && c.contract_value > 0)
    const totalValue = contractsWithValue.reduce((sum, c) => sum + (c.contract_value || 0), 0)
    const averageValue = contractsWithValue.length > 0 ? totalValue / contractsWithValue.length : 0

    // Status distribution
    const statusDistribution = filteredContracts.reduce((acc, contract) => {
      const status = contract.status || 'unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Monthly trends (last 12 months)
    const monthlyTrends = []
    for (let i = 11; i >= 0; i--) {
      const monthStart = startOfMonth(subDays(now, i * 30))
      const monthEnd = endOfMonth(subDays(now, i * 30))
      
      const monthContracts = contractsData.filter(c => {
        const createdAt = parseISO(c.created_at)
        return isAfter(createdAt, monthStart) && isBefore(createdAt, monthEnd)
      })

      const monthValue = monthContracts
        .filter(c => c.contract_value && c.contract_value > 0)
        .reduce((sum, c) => sum + (c.contract_value || 0), 0)

      monthlyTrends.push({
        month: format(monthStart, 'MMM yyyy'),
        contracts: monthContracts.length,
        value: monthValue
      })
    }

    // Processing metrics
    const completedContracts = filteredContracts.filter(c => c.status === 'active' || c.status === 'completed')
    const successRate = total > 0 ? Math.round((completedContracts.length / total) * 100) : 0
    const completionRate = total > 0 ? Math.round((active / total) * 100) : 0

    return {
      total,
      active,
      pending,
      expired,
      expiringSoon,
      recentlyCreated,
      monthlyGrowth,
      averageValue,
      totalValue,
      statusDistribution,
      monthlyTrends,
      processingMetrics: {
        averageTime: 3.2, // This would come from actual processing time tracking
        successRate,
        completionRate
      }
    }
  } catch (error) {
    console.error('Error getting contract analytics:', error)
    throw error
  }
}

/**
 * Get comprehensive promoter analytics
 */
export async function getPromoterAnalytics(timeRange?: AnalyticsTimeRange): Promise<PromoterAnalytics> {
  try {
    const { data: promoters, error: promotersError } = await supabase
      .from('promoters')
      .select('*')
      .order('created_at', { ascending: false })

    if (promotersError) {
      throw new Error(`Failed to fetch promoters for analytics: ${promotersError.message}`)
    }

    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('promoter_id, status, contract_value, created_at')

    if (contractsError) {
      console.warn('Error fetching contracts for promoter analytics:', contractsError)
    }

    const promotersData = promoters || []
    const contractsData = contracts || []
    const now = new Date()
    const thirtyDaysAgo = subDays(now, 30)

    // Filter by time range if provided
    const filteredPromoters = timeRange 
      ? promotersData.filter(p => {
          const createdAt = parseISO(p.created_at)
          return isAfter(createdAt, timeRange.start) && isBefore(createdAt, timeRange.end)
        })
      : promotersData

    // Basic metrics
    const total = filteredPromoters.length
    
    // Calculate document statuses
    let documentsExpiring = 0
    let documentsExpired = 0
    let active = 0
    let inactive = 0

    filteredPromoters.forEach(promoter => {
      const idCardExpiry = promoter.id_card_expiry_date ? parseISO(promoter.id_card_expiry_date) : null
      const passportExpiry = promoter.passport_expiry_date ? parseISO(promoter.passport_expiry_date) : null
      
      // Check if documents are expired
      if ((idCardExpiry && idCardExpiry < now) || (passportExpiry && passportExpiry < now)) {
        documentsExpired++
      } else {
        // Check if documents are expiring within 30 days
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        if ((idCardExpiry && idCardExpiry < thirtyDaysFromNow) || (passportExpiry && passportExpiry < thirtyDaysFromNow)) {
          documentsExpiring++
        }
      }

      // Determine if promoter is active (has active contracts)
      const promoterContracts = contractsData.filter(c => c.promoter_id === promoter.id)
      const activeContracts = promoterContracts.filter(c => c.status === 'active')
      
      if (activeContracts.length > 0) {
        active++
      } else {
        inactive++
      }
    })

    const withActiveContracts = filteredPromoters.filter(promoter => {
      const promoterContracts = contractsData.filter(c => c.promoter_id === promoter.id)
      return promoterContracts.some(c => c.status === 'active')
    }).length

    const recentlyAdded = filteredPromoters.filter(p => 
      isAfter(parseISO(p.created_at), thirtyDaysAgo)
    ).length

    // Status distribution
    const statusDistribution = filteredPromoters.reduce((acc, promoter) => {
      const status = promoter.status || 'unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Document status trends (last 12 months)
    const documentStatusTrends = []
    for (let i = 11; i >= 0; i--) {
      const monthStart = startOfMonth(subDays(now, i * 30))
      const monthEnd = endOfMonth(subDays(now, i * 30))
      
      // This would require tracking document renewal history
      documentStatusTrends.push({
        month: format(monthStart, 'MMM yyyy'),
        expiring: 0, // Would be calculated from historical data
        expired: 0,
        renewed: 0
      })
    }

    // Performance metrics
    const promoterContractCounts = filteredPromoters.map(promoter => {
      const promoterContracts = contractsData.filter(c => c.promoter_id === promoter.id)
      return {
        id: promoter.id,
        name: promoter.name_en || promoter.name_ar || 'Unknown',
        contractCount: promoterContracts.length
      }
    })

    const averageContractsPerPromoter = total > 0 
      ? promoterContractCounts.reduce((sum, p) => sum + p.contractCount, 0) / total 
      : 0

    const topPerformers = promoterContractCounts
      .sort((a, b) => b.contractCount - a.contractCount)
      .slice(0, 5)

    return {
      total,
      active,
      inactive,
      documentsExpiring,
      documentsExpired,
      withActiveContracts,
      recentlyAdded,
      statusDistribution,
      documentStatusTrends,
      performanceMetrics: {
        averageContractsPerPromoter,
        topPerformers
      }
    }
  } catch (error) {
    console.error('Error getting promoter analytics:', error)
    throw error
  }
}

/**
 * Get comprehensive party analytics
 */
export async function getPartyAnalytics(timeRange?: AnalyticsTimeRange): Promise<PartyAnalytics> {
  try {
    const { data: parties, error: partiesError } = await supabase
      .from('parties')
      .select('*')
      .order('created_at', { ascending: false })

    if (partiesError) {
      throw new Error(`Failed to fetch parties for analytics: ${partiesError.message}`)
    }

    const { data: contracts, error: contractsError } = await supabase
      .from('contracts')
      .select('first_party_id, second_party_id, status, contract_value, contract_start_date, contract_end_date')

    if (contractsError) {
      console.warn('Error fetching contracts for party analytics:', contractsError)
    }

    const partiesData = parties || []
    const contractsData = contracts || []
    const now = new Date()

    // Filter by time range if provided
    const filteredParties = timeRange 
      ? partiesData.filter(p => {
          const createdAt = parseISO(p.created_at)
          return isAfter(createdAt, timeRange.start) && isBefore(createdAt, timeRange.end)
        })
      : partiesData

    // Basic metrics
    const total = filteredParties.length
    
    let active = 0
    let inactive = 0
    let documentsExpiring = 0
    let documentsExpired = 0

    filteredParties.forEach(party => {
      // Check document status
      const crExpiry = party.cr_expiry_date ? parseISO(party.cr_expiry_date) : null
      const licenseExpiry = party.license_expiry_date ? parseISO(party.license_expiry_date) : null
      
      if ((crExpiry && crExpiry < now) || (licenseExpiry && licenseExpiry < now)) {
        documentsExpired++
      } else {
        const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        if ((crExpiry && crExpiry < thirtyDaysFromNow) || (licenseExpiry && licenseExpiry < thirtyDaysFromNow)) {
          documentsExpiring++
        }
      }

      // Check if party has active contracts
      const partyContracts = contractsData.filter(c => 
        c.first_party_id === party.id || c.second_party_id === party.id
      )
      const activeContracts = partyContracts.filter(c => c.status === 'active')
      
      if (activeContracts.length > 0 && party.status === 'Active') {
        active++
      } else {
        inactive++
      }
    })

    const withContracts = filteredParties.filter(party => {
      return contractsData.some(c => 
        c.first_party_id === party.id || c.second_party_id === party.id
      )
    }).length

    // Type distribution
    const byType = filteredParties.reduce((acc, party) => {
      const type = party.type || 'Unknown'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Status distribution
    const statusDistribution = filteredParties.reduce((acc, party) => {
      const status = party.status || 'unknown'
      acc[status] = (acc[status] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Contract distribution
    const contractDistribution = filteredParties.map(party => {
      const partyContracts = contractsData.filter(c => 
        c.first_party_id === party.id || c.second_party_id === party.id
      )
      
      const totalValue = partyContracts
        .filter(c => c.contract_value && c.contract_value > 0)
        .reduce((sum, c) => sum + (c.contract_value || 0), 0)

      return {
        partyId: party.id,
        partyName: party.name_en || party.name_ar || 'Unknown',
        contractCount: partyContracts.length,
        totalValue
      }
    }).filter(p => p.contractCount > 0)
    .sort((a, b) => b.contractCount - a.contractCount)

    // Compliance metrics
    const totalDocuments = filteredParties.length * 2 // Assuming CR and license for each
    const validDocuments = total - documentsExpiring - documentsExpired
    const documentComplianceRate = totalDocuments > 0 ? Math.round((validDocuments / totalDocuments) * 100) : 0

    const renewalRate = 85 // This would come from historical renewal data
    
    // Calculate average contract duration
    const contractsWithDuration = contractsData.filter(c => c.contract_start_date && c.contract_end_date)
    const averageContractDuration = contractsWithDuration.length > 0
      ? contractsWithDuration.reduce((sum, c) => {
          const start = parseISO(c.contract_start_date)
          const end = parseISO(c.contract_end_date)
          const duration = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
          return sum + duration
        }, 0) / contractsWithDuration.length
      : 0

    return {
      total,
      active,
      inactive,
      withContracts,
      documentsExpiring,
      documentsExpired,
      byType,
      statusDistribution,
      contractDistribution,
      complianceMetrics: {
        documentComplianceRate,
        renewalRate,
        averageContractDuration
      }
    }
  } catch (error) {
    console.error('Error getting party analytics:', error)
    throw error
  }
}

/**
 * Get system analytics
 */
export async function getSystemAnalytics(): Promise<SystemAnalytics> {
  try {
    // This would typically come from system monitoring and user activity tracking
    // For now, we'll return mock data that would be replaced with actual metrics
    
    return {
      userActivity: {
        totalUsers: 25,
        activeUsers: 18,
        dailyActiveUsers: 12,
        userGrowth: 15
      },
      performance: {
        averageResponseTime: 245, // milliseconds
        systemUptime: 99.8, // percentage
        errorRate: 0.2, // percentage
        throughput: 150 // requests per minute
      },
      usage: {
        totalActions: 1250,
        mostUsedFeatures: [
          { feature: 'Contract Creation', usage: 45 },
          { feature: 'Promoter Management', usage: 32 },
          { feature: 'Document Upload', usage: 28 },
          { feature: 'Analytics Dashboard', usage: 22 },
          { feature: 'Notifications', usage: 18 }
        ],
        peakUsageHours: [
          { hour: 9, usage: 85 },
          { hour: 10, usage: 92 },
          { hour: 11, usage: 88 },
          { hour: 14, usage: 78 },
          { hour: 15, usage: 82 }
        ]
      }
    }
  } catch (error) {
    console.error('Error getting system analytics:', error)
    throw error
  }
}

/**
 * Get alert analytics
 */
export async function getAlertAnalytics(): Promise<AlertAnalytics> {
  try {
    const { data: notifications, error } = await supabase
      .from('notifications')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.warn('Error fetching notifications for alert analytics:', error)
    }

    const notificationsData = notifications || []
    const now = new Date()
    const sevenDaysAgo = subDays(now, 7)

    // Basic metrics
    const total = notificationsData.length
    const resolved = notificationsData.filter(n => n.is_read).length
    const pending = total - resolved

    // Priority distribution
    const byPriority = notificationsData.reduce((acc, notification) => {
      const priority = notification.priority || 'medium'
      acc[priority] = (acc[priority] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Type distribution
    const byType = notificationsData.reduce((acc, notification) => {
      const type = notification.type || 'system'
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Trends (last 7 days)
    const trends = []
    for (let i = 6; i >= 0; i--) {
      const date = subDays(now, i)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 23, 59, 59)

      const dayNotifications = notificationsData.filter(n => {
        const createdAt = parseISO(n.created_at)
        return isAfter(createdAt, dayStart) && isBefore(createdAt, dayEnd)
      })

      const dayResolved = dayNotifications.filter(n => n.is_read).length

      trends.push({
        date: format(date, 'MMM dd'),
        alerts: dayNotifications.length,
        resolved: dayResolved
      })
    }

    // Average resolution time (mock data - would come from actual tracking)
    const averageResolutionTime = 4.5 // hours

    return {
      total,
      byPriority,
      byType,
      resolved,
      pending,
      averageResolutionTime,
      trends
    }
  } catch (error) {
    console.error('Error getting alert analytics:', error)
    throw error
  }
}

/**
 * Export analytics data to CSV
 */
export async function exportAnalyticsToCSV(
  type: 'contracts' | 'promoters' | 'parties' | 'system' | 'alerts',
  timeRange?: AnalyticsTimeRange
): Promise<string> {
  try {
    let csvContent = ''
    
    switch (type) {
      case 'contracts':
        const contractAnalytics = await getContractAnalytics(timeRange)
        csvContent = [
          'Metric,Value',
          `Total Contracts,${contractAnalytics.total}`,
          `Active Contracts,${contractAnalytics.active}`,
          `Pending Contracts,${contractAnalytics.pending}`,
          `Expired Contracts,${contractAnalytics.expired}`,
          `Expiring Soon,${contractAnalytics.expiringSoon}`,
          `Monthly Growth,${contractAnalytics.monthlyGrowth}%`,
          `Average Value,${contractAnalytics.averageValue}`,
          `Total Value,${contractAnalytics.totalValue}`,
          `Success Rate,${contractAnalytics.processingMetrics.successRate}%`
        ].join('\n')
        break
        
      case 'promoters':
        const promoterAnalytics = await getPromoterAnalytics(timeRange)
        csvContent = [
          'Metric,Value',
          `Total Promoters,${promoterAnalytics.total}`,
          `Active Promoters,${promoterAnalytics.active}`,
          `Inactive Promoters,${promoterAnalytics.inactive}`,
          `Documents Expiring,${promoterAnalytics.documentsExpiring}`,
          `Documents Expired,${promoterAnalytics.documentsExpired}`,
          `With Active Contracts,${promoterAnalytics.withActiveContracts}`,
          `Recently Added,${promoterAnalytics.recentlyAdded}`,
          `Average Contracts per Promoter,${promoterAnalytics.performanceMetrics.averageContractsPerPromoter}`
        ].join('\n')
        break
        
      case 'parties':
        const partyAnalytics = await getPartyAnalytics(timeRange)
        csvContent = [
          'Metric,Value',
          `Total Parties,${partyAnalytics.total}`,
          `Active Parties,${partyAnalytics.active}`,
          `Inactive Parties,${partyAnalytics.inactive}`,
          `With Contracts,${partyAnalytics.withContracts}`,
          `Documents Expiring,${partyAnalytics.documentsExpiring}`,
          `Documents Expired,${partyAnalytics.documentsExpired}`,
          `Document Compliance Rate,${partyAnalytics.complianceMetrics.documentComplianceRate}%`,
          `Average Contract Duration,${partyAnalytics.complianceMetrics.averageContractDuration} days`
        ].join('\n')
        break
        
      default:
        throw new Error(`Unsupported analytics type: ${type}`)
    }
    
    return csvContent
  } catch (error) {
    console.error('Error exporting analytics to CSV:', error)
    throw error
  }
}

/**
 * Get time range presets
 */
export function getTimeRangePresets(): Record<string, AnalyticsTimeRange> {
  const now = new Date()
  
  return {
    '7d': {
      start: subDays(now, 7),
      end: now,
      label: 'Last 7 days'
    },
    '30d': {
      start: subDays(now, 30),
      end: now,
      label: 'Last 30 days'
    },
    '90d': {
      start: subDays(now, 90),
      end: now,
      label: 'Last 90 days'
    },
    '1y': {
      start: subDays(now, 365),
      end: now,
      label: 'Last year'
    },
    'thisMonth': {
      start: startOfMonth(now),
      end: now,
      label: 'This month'
    },
    'lastMonth': {
      start: startOfMonth(subDays(now, 30)),
      end: endOfMonth(subDays(now, 30)),
      label: 'Last month'
    }
  }
}