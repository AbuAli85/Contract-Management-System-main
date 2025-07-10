import { differenceInDays, parseISO } from "date-fns"
import type { Party } from "./types"

export interface EnhancedParty extends Party {
  cr_status: "valid" | "expiring" | "expired" | "missing"
  license_status: "valid" | "expiring" | "expired" | "missing"
  overall_status: "active" | "warning" | "critical" | "inactive"
  days_until_cr_expiry?: number
  days_until_license_expiry?: number
  contract_count?: number
}

export interface PartyStats {
  total: number
  active: number
  inactive: number
  suspended: number
  expiring_documents: number
  expired_documents: number
  employers: number
  clients: number
  generic: number
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
 * Get overall status based on party status and document status
 */
export const getOverallStatus = (party: Party): "active" | "warning" | "critical" | "inactive" => {
  if (!party.status || party.status === "Inactive" || party.status === "Suspended") return "inactive"
  
  const crExpiry = party.cr_expiry_date 
    ? differenceInDays(parseISO(party.cr_expiry_date), new Date()) 
    : null
  const licenseExpiry = party.license_expiry_date 
    ? differenceInDays(parseISO(party.license_expiry_date), new Date()) 
    : null
  
  if ((crExpiry !== null && crExpiry < 0) || (licenseExpiry !== null && licenseExpiry < 0)) {
    return "critical"
  }
  
  if ((crExpiry !== null && crExpiry <= 30) || (licenseExpiry !== null && licenseExpiry <= 30)) {
    return "warning"
  }
  
  return "active"
}

/**
 * Enhance party data with calculated fields
 */
export const enhanceParty = (party: Party): EnhancedParty => {
  const crExpiryDays = party.cr_expiry_date 
    ? differenceInDays(parseISO(party.cr_expiry_date), new Date())
    : null

  const licenseExpiryDays = party.license_expiry_date
    ? differenceInDays(parseISO(party.license_expiry_date), new Date())
    : null

  return {
    ...party,
    cr_status: getDocumentStatusType(crExpiryDays, party.cr_expiry_date || null),
    license_status: getDocumentStatusType(licenseExpiryDays, party.license_expiry_date || null),
    overall_status: getOverallStatus(party),
    days_until_cr_expiry: crExpiryDays || undefined,
    days_until_license_expiry: licenseExpiryDays || undefined,
  }
}

/**
 * Calculate statistics from enhanced party data
 */
export const calculatePartyStats = (parties: EnhancedParty[]): PartyStats => {
  const total = parties.length
  const active = parties.filter(p => p.status === "Active").length
  const inactive = parties.filter(p => p.status === "Inactive").length
  const suspended = parties.filter(p => p.status === "Suspended").length
  const expiring = parties.filter(p => p.overall_status === "warning").length
  const expired = parties.filter(p => p.overall_status === "critical").length
  const employers = parties.filter(p => p.type === "Employer").length
  const clients = parties.filter(p => p.type === "Client").length
  const generic = parties.filter(p => p.type === "Generic").length
  const totalContracts = parties.reduce((sum, p) => sum + (p.contract_count || 0), 0)
  const withContracts = parties.filter(p => (p.contract_count || 0) > 0).length
  const withoutContracts = total - withContracts

  return {
    total,
    active,
    inactive,
    suspended,
    expiring_documents: expiring,
    expired_documents: expired,
    employers,
    clients,
    generic,
    total_contracts: totalContracts,
    with_contracts: withContracts,
    without_contracts: withoutContracts,
    critical_status: expired,
    warning_status: expiring,
  }
}

/**
 * Export parties to CSV format
 */
export const exportPartiesToCSV = (parties: EnhancedParty[]): string => {
  const headers = [
    'Name (EN)',
    'Name (AR)', 
    'CRN',
    'Type',
    'Role',
    'Status',
    'CR Status',
    'CR Expiry',
    'License Status',
    'License Expiry',
    'Contact Person',
    'Contact Email',
    'Contact Phone',
    'Address (EN)',
    'Address (AR)',
    'Tax Number',
    'License Number',
    'Active Contracts',
    'Overall Status',
    'Created Date',
    'Notes'
  ]

  const rows = parties.map(party => [
    party.name_en,
    party.name_ar,
    party.crn,
    party.type || 'N/A',
    party.role || 'N/A',
    party.status || 'N/A',
    party.cr_status,
    party.cr_expiry_date || 'N/A',
    party.license_status,
    party.license_expiry_date || 'N/A',
    party.contact_person || 'N/A',
    party.contact_email || 'N/A',
    party.contact_phone || 'N/A',
    party.address_en || 'N/A',
    party.address_ar || 'N/A',
    party.tax_number || 'N/A',
    party.license_number || 'N/A',
    (party.contract_count || 0).toString(),
    party.overall_status,
    party.created_at || 'N/A',
    party.notes || ''
  ])

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
  ].join('\n')

  return csvContent
}

/**
 * Filter parties based on search criteria
 */
export const filterParties = (
  parties: Party[],
  searchTerm: string,
  statusFilter: string,
  typeFilter: string
): Party[] => {
  return parties.filter(party => {
    // Search filter
    const searchMatch = !searchTerm || 
      party.name_en.toLowerCase().includes(searchTerm.toLowerCase()) ||
      party.name_ar.toLowerCase().includes(searchTerm.toLowerCase()) ||
      party.crn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (party.role && party.role.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (party.contact_person && party.contact_person.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (party.contact_email && party.contact_email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (party.notes && party.notes.toLowerCase().includes(searchTerm.toLowerCase()))

    // Status filter
    const statusMatch = statusFilter === "all" || party.status === statusFilter

    // Type filter
    const typeMatch = typeFilter === "all" || party.type === typeFilter

    return searchMatch && statusMatch && typeMatch
  })
}

/**
 * Sort parties by specified criteria
 */
export const sortParties = (
  parties: EnhancedParty[],
  sortBy: "name" | "cr_expiry" | "license_expiry" | "contracts",
  sortOrder: "asc" | "desc"
): EnhancedParty[] => {
  return [...parties].sort((a, b) => {
    let aValue: any, bValue: any
    
    switch (sortBy) {
      case "name":
        aValue = a.name_en.toLowerCase()
        bValue = b.name_en.toLowerCase()
        break
      case "cr_expiry":
        aValue = a.days_until_cr_expiry ?? Infinity
        bValue = b.days_until_cr_expiry ?? Infinity
        break
      case "license_expiry":
        aValue = a.days_until_license_expiry ?? Infinity
        bValue = b.days_until_license_expiry ?? Infinity
        break
      case "contracts":
        aValue = a.contract_count || 0
        bValue = b.contract_count || 0
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

/**
 * Get parties by type for analytics
 */
export const getPartiesByType = (parties: EnhancedParty[]) => {
  return {
    employers: parties.filter(p => p.type === "Employer"),
    clients: parties.filter(p => p.type === "Client"), 
    generic: parties.filter(p => p.type === "Generic"),
  }
}

/**
 * Get parties with expiring documents
 */
export const getPartiesWithExpiringDocuments = (
  parties: EnhancedParty[],
  daysAhead: number = 30
) => {
  return parties.filter(party => 
    (party.days_until_cr_expiry !== undefined && party.days_until_cr_expiry <= daysAhead) ||
    (party.days_until_license_expiry !== undefined && party.days_until_license_expiry <= daysAhead)
  )
}

/**
 * Validate party data
 */
export const validatePartyData = (party: Partial<Party>): string[] => {
  const errors: string[] = []
  
  if (!party.name_en?.trim()) {
    errors.push("English name is required")
  }
  
  if (!party.name_ar?.trim()) {
    errors.push("Arabic name is required")
  }
  
  if (!party.crn?.trim()) {
    errors.push("CRN is required")
  }
  
  if (party.contact_email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(party.contact_email)) {
    errors.push("Invalid email format")
  }
  
  return errors
}
