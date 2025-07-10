import type { CreateContractRequest, UpdateContractRequest, ValidationResult, ValidationError } from "@/lib/types/api"

export function validateCreateContractRequest(body: any): ValidationResult {
  const errors: ValidationError[] = []
  
  // Check for required IDs (either direct or nested)
  const hasFirstPartyId = body.first_party_id || body.first_party?.id
  const hasSecondPartyId = body.second_party_id || body.second_party?.id
  const hasPromoterId = body.promoter_id || body.promoter?.id
  
  if (!hasFirstPartyId) {
    errors.push({ field: "first_party_id", message: "Party A ID is required" })
  }
  
  if (!hasSecondPartyId) {
    errors.push({ field: "second_party_id", message: "Party B ID is required" })
  }
  
  if (!hasPromoterId) {
    errors.push({ field: "promoter_id", message: "Promoter ID is required" })
  }
  
  // Validate email format if provided
  if (body.email && !isValidEmail(body.email)) {
    errors.push({ field: "email", message: "Invalid email format" })
  }
  
  // Validate date formats if provided
  if (body.contract_start_date && !isValidDate(body.contract_start_date)) {
    errors.push({ field: "contract_start_date", message: "Invalid start date format" })
  }
  
  if (body.contract_end_date && !isValidDate(body.contract_end_date)) {
    errors.push({ field: "contract_end_date", message: "Invalid end date format" })
  }
  
  // Validate that end date is after start date if both are provided
  if (body.contract_start_date && body.contract_end_date) {
    const startDate = new Date(body.contract_start_date)
    const endDate = new Date(body.contract_end_date)
    
    if (endDate <= startDate) {
      errors.push({ 
        field: "contract_end_date", 
        message: "End date must be after start date" 
      })
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateUpdateContractRequest(body: any): ValidationResult {
  const errors: ValidationError[] = []
  
  // Check for required ID
  if (!body.id) {
    errors.push({ field: "id", message: "Contract ID is required" })
  }
  
  // Validate email format if provided
  if (body.email && !isValidEmail(body.email)) {
    errors.push({ field: "email", message: "Invalid email format" })
  }
  
  // Validate date formats if provided
  if (body.contract_start_date && !isValidDate(body.contract_start_date)) {
    errors.push({ field: "contract_start_date", message: "Invalid start date format" })
  }
  
  if (body.contract_end_date && !isValidDate(body.contract_end_date)) {
    errors.push({ field: "contract_end_date", message: "Invalid end date format" })
  }
  
  // Validate that end date is after start date if both are provided
  if (body.contract_start_date && body.contract_end_date) {
    const startDate = new Date(body.contract_start_date)
    const endDate = new Date(body.contract_end_date)
    
    if (endDate <= startDate) {
      errors.push({ 
        field: "contract_end_date", 
        message: "End date must be after start date" 
      })
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

// Utility functions
function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

function isValidDate(dateString: string): boolean {
  const date = new Date(dateString)
  return !isNaN(date.getTime())
}

// Helper function to extract IDs from request body
export function extractIds(body: any): {
  clientId: string | undefined
  employerId: string | undefined
  promoterId: string | undefined
} {
  return {
    clientId: body.first_party?.id || body.first_party_id,
    employerId: body.second_party?.id || body.second_party_id,
    promoterId: body.promoter?.id || body.promoter_id,
  }
} 