import { Promoter } from './types'

/**
 * Utility functions for working with promoter data
 */

export interface PromoterCSVRow {
  id: string
  name_en: string
  name_ar: string
  id_card_number: string
  id_card_url: string | null
  passport_url: string | null
  employer_id: string | null
  outsourced_to_id: string | null
  job_title: string | null
  work_location: string | null
  status: string | null
  contract_valid_until: string | null
  id_card_expiry_date: string | null
  passport_expiry_date: string | null
  notify_days_before_id_expiry: number | null
  notify_days_before_passport_expiry: number | null
  notes: string | null
  created_at: string | null
  updated_at: string | null
}

/**
 * Parse CSV string into promoter data
 */
export function parsePromoterCSV(csvText: string): PromoterCSVRow[] {
  const lines = csvText.trim().split('\n')
  if (lines.length <= 1) {
    return []
  }

  const headers = lines[0].split(',').map(h => h.trim())
  const dataRows = lines.slice(1)

  return dataRows.map(line => {
    const values = line.split(',')
    const entry: any = {}
    
    headers.forEach((header, index) => {
      let value = values[index] ? values[index].trim() : ''
      
      // Handle quoted values
      if (value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1)
      }
      
      // Convert numeric fields
      if (['notify_days_before_id_expiry', 'notify_days_before_passport_expiry'].includes(header)) {
        entry[header] = value ? parseInt(value, 10) : null
      } else {
        entry[header] = value || null
      }
    })
    
    return entry as PromoterCSVRow
  })
}

/**
 * Convert promoter data to CSV string
 */
export function exportPromoterCSV(promoters: Promoter[]): string {
  const headers = [
    'id', 'name_en', 'name_ar', 'id_card_number', 'id_card_url', 'passport_url',
    'employer_id', 'outsourced_to_id', 'job_title', 'work_location', 'status',
    'contract_valid_until', 'id_card_expiry_date', 'passport_expiry_date',
    'notify_days_before_id_expiry', 'notify_days_before_passport_expiry',
    'notes', 'created_at', 'updated_at'
  ]

  const rows = promoters.map(promoter => [
    promoter.id,
    promoter.name_en,
    promoter.name_ar,
    promoter.id_card_number,
    promoter.id_card_url || '',
    promoter.passport_url || '',
    promoter.employer_id || '',
    promoter.outsourced_to_id || '',
    promoter.job_title || '',
    promoter.work_location || '',
    promoter.status || '',
    promoter.contract_valid_until || '',
    promoter.id_card_expiry_date || '',
    promoter.passport_expiry_date || '',
    promoter.notify_days_before_id_expiry || '',
    promoter.notify_days_before_passport_expiry || '',
    promoter.notes || '',
    promoter.created_at || '',
    '' // updated_at not in Promoter interface
  ].map(value => `"${value}"`).join(','))

  return [headers.join(','), ...rows].join('\n')
}

/**
 * Analyze promoter data for insights
 */
export function analyzePromoterData(promoters: PromoterCSVRow[]) {
  const analysis = {
    total: promoters.length,
    byStatus: {} as Record<string, number>,
    byDocumentStatus: {
      hasIdCard: 0,
      hasPassport: 0,
      hasBothDocuments: 0,
      missingDocuments: 0
    },
    notificationSettings: {
      idExpiry: {} as Record<number, number>,
      passportExpiry: {} as Record<number, number>
    },
    recentUpdates: [] as PromoterCSVRow[]
  }

  promoters.forEach(promoter => {
    // Status analysis
    const status = promoter.status || 'unknown'
    analysis.byStatus[status] = (analysis.byStatus[status] || 0) + 1

    // Document analysis
    const hasIdCard = !!promoter.id_card_url
    const hasPassport = !!promoter.passport_url
    
    if (hasIdCard) analysis.byDocumentStatus.hasIdCard++
    if (hasPassport) analysis.byDocumentStatus.hasPassport++
    if (hasIdCard && hasPassport) analysis.byDocumentStatus.hasBothDocuments++
    if (!hasIdCard && !hasPassport) analysis.byDocumentStatus.missingDocuments++

    // Notification settings analysis
    if (promoter.notify_days_before_id_expiry) {
      analysis.notificationSettings.idExpiry[promoter.notify_days_before_id_expiry] = 
        (analysis.notificationSettings.idExpiry[promoter.notify_days_before_id_expiry] || 0) + 1
    }
    
    if (promoter.notify_days_before_passport_expiry) {
      analysis.notificationSettings.passportExpiry[promoter.notify_days_before_passport_expiry] = 
        (analysis.notificationSettings.passportExpiry[promoter.notify_days_before_passport_expiry] || 0) + 1
    }
    
    // Recent updates (last 30 days)
    if (promoter.updated_at) {
      const updateDate = new Date(promoter.updated_at)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      
      if (updateDate > thirtyDaysAgo) {
        analysis.recentUpdates.push(promoter)
      }
    }
  })

  return analysis
}

/**
 * Download CSV file
 */
export function downloadPromoterCSV(promoters: Promoter[], filename = 'promoters.csv') {
  const csvContent = exportPromoterCSV(promoters)
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
}

/**
 * Validate promoter data
 */
export function validatePromoterData(promoter: PromoterCSVRow): { isValid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!promoter.name_en?.trim()) {
    errors.push('English name is required')
  }

  if (!promoter.name_ar?.trim()) {
    errors.push('Arabic name is required')
  }

  if (!promoter.id_card_number?.trim()) {
    errors.push('ID card number is required')
  }

  if (promoter.status && !['active', 'inactive', 'suspended'].includes(promoter.status)) {
    errors.push('Status must be one of: active, inactive, suspended')
  }

  // Validate dates
  const dateFields = ['contract_valid_until', 'id_card_expiry_date', 'passport_expiry_date']
  dateFields.forEach(field => {
    const value = promoter[field as keyof PromoterCSVRow]
    if (value && typeof value === 'string' && isNaN(Date.parse(value))) {
      errors.push(`${field} must be a valid date`)
    }
  })

  // Validate notification days
  const notificationFields = [
    'notify_days_before_id_expiry',
    'notify_days_before_passport_expiry'
  ]
  notificationFields.forEach(field => {
    const value = promoter[field as keyof PromoterCSVRow]
    if (value !== null && (typeof value !== 'number' || value < 0)) {
      errors.push(`${field} must be a positive number`)
    }
  })

  return {
    isValid: errors.length === 0,
    errors
  }
}
