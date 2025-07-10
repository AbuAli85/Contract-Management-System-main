// lib/contract-utils.ts
import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, differenceInDays, differenceInMonths, parseISO } from "date-fns"
import type { ContractGeneratorFormData } from "@/lib/schema-generator"
import type { Database } from "@/types/supabase"

// Utility function for combining classes
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Contract-specific types
export type ContractRow = Database["public"]["Tables"]["contracts"]["Row"]
export type ContractInsert = Database["public"]["Tables"]["contracts"]["Insert"]

// Contract status types
export type ContractStatus = 
  | "draft" 
  | "pending_approval" 
  | "approved" 
  | "active" 
  | "expired" 
  | "terminated" 
  | "cancelled"

// Contract duration analysis
export interface ContractDurationAnalysis {
  duration: number // days
  durationText: string
  category: "short-term" | "medium-term" | "long-term"
  isValid: boolean
  warnings: string[]
  recommendations: string[]
}

// Contract compensation analysis
export interface ContractCompensationAnalysis {
  basicSalary: number
  allowances: number
  totalMonthly: number
  totalAnnual: number
  currency: string
  isCompetitive: boolean
  marketComparison?: "below" | "average" | "above"
}

// Contract validation result
export interface ContractValidationResult {
  isValid: boolean
  errors: string[]
  warnings: string[]
  completeness: number // percentage
  missingFields: string[]
}

/**
 * Analyze contract duration and provide insights
 */
export function analyzeContractDuration(
  startDate: Date,
  endDate: Date
): ContractDurationAnalysis {
  const duration = differenceInDays(endDate, startDate)
  const months = differenceInMonths(endDate, startDate)
  
  const analysis: ContractDurationAnalysis = {
    duration,
    durationText: formatDuration(duration),
    category: duration <= 90 ? "short-term" : duration <= 365 ? "medium-term" : "long-term",
    isValid: duration >= 1 && duration <= (5 * 365), // 1 day to 5 years
    warnings: [],
    recommendations: []
  }

  // Add warnings based on duration
  if (duration < 7) {
    analysis.warnings.push("Very short contract duration (less than a week)")
  } else if (duration > (2 * 365)) {
    analysis.warnings.push("Long-term contract (over 2 years)")
  }

  // Add recommendations
  if (duration <= 90) {
    analysis.recommendations.push("Consider probation period of 1-2 months for short-term contracts")
  } else if (duration >= 365) {
    analysis.recommendations.push("Consider annual performance reviews for long-term contracts")
  }

  if (months >= 12) {
    analysis.recommendations.push("Consider including salary review clauses for contracts over 1 year")
  }

  return analysis
}

/**
 * Format duration in human-readable text
 */
export function formatDuration(days: number): string {
  if (days === 1) return "1 day"
  if (days < 7) return `${days} days`
  if (days < 30) {
    const weeks = Math.floor(days / 7)
    const remainingDays = days % 7
    return weeks === 1 
      ? remainingDays > 0 ? `1 week, ${remainingDays} days` : "1 week"
      : remainingDays > 0 ? `${weeks} weeks, ${remainingDays} days` : `${weeks} weeks`
  }
  if (days < 365) {
    const months = Math.floor(days / 30)
    const remainingDays = days % 30
    return months === 1
      ? remainingDays > 0 ? `1 month, ${remainingDays} days` : "1 month"
      : remainingDays > 0 ? `${months} months, ${remainingDays} days` : `${months} months`
  }
  
  const years = Math.floor(days / 365)
  const remainingDays = days % 365
  const months = Math.floor(remainingDays / 30)
  
  if (years === 1) {
    return months > 0 ? `1 year, ${months} months` : "1 year"
  }
  return months > 0 ? `${years} years, ${months} months` : `${years} years`
}

/**
 * Analyze contract compensation
 */
export function analyzeContractCompensation(
  basicSalary: number = 0,
  allowances: number = 0,
  currency: string = "OMR"
): ContractCompensationAnalysis {
  const totalMonthly = basicSalary + allowances
  const totalAnnual = totalMonthly * 12

  // Market comparison logic (simplified)
  let marketComparison: "below" | "average" | "above" | undefined
  if (currency === "OMR" && totalMonthly > 0) {
    if (totalMonthly < 1300) marketComparison = "below"     // ~325 OMR minimum wage
    else if (totalMonthly < 3900) marketComparison = "average" // Mid-level Oman salaries
    else marketComparison = "above"
  }

  return {
    basicSalary,
    allowances,
    totalMonthly,
    totalAnnual,
    currency,
    isCompetitive: marketComparison === "average" || marketComparison === "above",
    marketComparison
  }
}

/**
 * Validate contract form data
 */
export function validateContractData(data: Partial<ContractGeneratorFormData>): ContractValidationResult {
  const errors: string[] = []
  const warnings: string[] = []
  const missingFields: string[] = []

  // Required fields check
  const requiredFields = [
    'first_party_id',
    'second_party_id', 
    'promoter_id',
    'contract_start_date',
    'contract_end_date',
    'email',
    'job_title',
    'department',
    'contract_type',
    'currency',
    'work_location'
  ] as const

  requiredFields.forEach(field => {
    if (!data[field] || data[field] === '') {
      missingFields.push(field)
    }
  })

  // Business logic validation
  if (data.first_party_id === data.second_party_id) {
    errors.push("Client and Employer organizations must be different")
  }

  if (data.contract_start_date && data.contract_end_date) {
    if (data.contract_end_date < data.contract_start_date) {
      errors.push("End date must be after start date")
    }
  }

  // Compensation warnings
  if (data.basic_salary && data.basic_salary > 100000) {
    warnings.push("High salary amount - please verify")
  }

  if (data.allowances && data.allowances > 50000) {
    warnings.push("High allowances amount - please verify")
  }

  // Calculate completeness
  const totalRequiredFields = requiredFields.length
  const completedFields = totalRequiredFields - missingFields.length
  const completeness = Math.round((completedFields / totalRequiredFields) * 100)

  return {
    isValid: errors.length === 0 && missingFields.length === 0,
    errors,
    warnings,
    completeness,
    missingFields
  }
}

/**
 * Format contract number
 */
export function generateContractNumber(prefix: string = "CT"): string {
  const year = new Date().getFullYear()
  const timestamp = Date.now().toString().slice(-6)
  return `${prefix}-${year}-${timestamp}`
}

/**
 * Get contract status badge variant
 */
export function getStatusBadgeVariant(status: ContractStatus): "default" | "secondary" | "destructive" | "outline" {
  switch (status) {
    case "active":
    case "approved":
      return "default"
    case "pending_approval":
    case "draft":
      return "secondary"
    case "expired":
    case "terminated":
    case "cancelled":
      return "destructive"
    default:
      return "outline"
  }
}

/**
 * Format contract dates for display
 */
export function formatContractDates(startDate: string | Date, endDate: string | Date): string {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate
  
  return `${format(start, 'dd MMM yyyy')} - ${format(end, 'dd MMM yyyy')}`
}

/**
 * Calculate contract progress (for active contracts)
 */
export function calculateContractProgress(
  startDate: string | Date,
  endDate: string | Date,
  currentDate: Date = new Date()
): number {
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate
  
  if (currentDate < start) return 0
  if (currentDate > end) return 100
  
  const totalDuration = differenceInDays(end, start)
  const elapsed = differenceInDays(currentDate, start)
  
  return Math.round((elapsed / totalDuration) * 100)
}

/**
 * Get contract age in human readable format
 */
export function getContractAge(createdAt: string | Date): string {
  const created = typeof createdAt === 'string' ? parseISO(createdAt) : createdAt
  const now = new Date()
  
  const days = differenceInDays(now, created)
  
  if (days === 0) return "Today"
  if (days === 1) return "1 day ago"
  if (days < 7) return `${days} days ago`
  if (days < 30) {
    const weeks = Math.floor(days / 7)
    return weeks === 1 ? "1 week ago" : `${weeks} weeks ago`
  }
  if (days < 365) {
    const months = Math.floor(days / 30)
    return months === 1 ? "1 month ago" : `${months} months ago`
  }
  
  const years = Math.floor(days / 365)
  return years === 1 ? "1 year ago" : `${years} years ago`
}

/**
 * Export contract data to CSV format
 */
export function exportContractsToCSV(contracts: ContractRow[]): string {
  const headers = [
    'ID',
    'Contract Number',
    'Client ID',
    'Employer ID', 
    'Promoter ID',
    'Job Title',
    'Start Date',
    'End Date',
    'Status',
    'Work Location',
    'Email',
    'Created At'
  ]

  const rows = contracts.map(contract => [
    contract.id,
    contract.contract_number || '',
    contract.first_party_id || '',
    contract.second_party_id || '',
    contract.promoter_id || '',
    contract.job_title || '',
    contract.contract_start_date || '',
    contract.contract_end_date || '',
    contract.status || '',
    contract.work_location || '',
    contract.email || '',
    contract.created_at || ''
  ])

  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n')

  return csvContent
}

/**
 * Download CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
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
 * Salary band recommendations based on job title and location
 */
export function getSalaryRecommendations(
  jobTitle: string,
  workLocation: string,
  currency: string = "OMR"
): { min: number; max: number; average: number } | null {
  // Simplified salary recommendations for Oman market (in production, this would come from a database)
  const salaryBands: Record<string, { min: number; max: number; average: number }> = {
    "senior-software-engineer": { min: 3900, max: 6500, average: 5200 },  // Converted to OMR
    "software-engineer": { min: 2600, max: 4680, average: 3640 },         // Converted to OMR
    "junior-software-engineer": { min: 6000, max: 12000, average: 9000 },
    "project-manager": { min: 12000, max: 22000, average: 17000 },
    "product-manager": { min: 14000, max: 24000, average: 19000 },
    "ui-ux-designer": { min: 8000, max: 16000, average: 12000 },
    "marketing-specialist": { min: 7000, max: 14000, average: 10500 },
    "business-analyst": { min: 9000, max: 16000, average: 12500 }
  }

  return salaryBands[jobTitle] || null
}

/**
 * Get contract type recommendations based on duration
 */
export function getContractTypeRecommendations(duration: number): string[] {
  if (duration <= 90) {
    return ["temporary", "project-based", "contract"]
  } else if (duration <= 365) {
    return ["fixed-term", "contract", "temporary"]
  } else {
    return ["permanent", "full-time", "fixed-term"]
  }
}
