import type { Database } from "@/types/supabase"

// API Request Types
export interface CreateContractRequest {
  first_party_id?: string
  second_party_id?: string
  promoter_id?: string
  first_party?: { id: string }
  second_party?: { id: string }
  promoter?: { id: string }
  job_title?: string
  work_location?: string
  contract_start_date?: string
  contract_end_date?: string
  email?: string
  contract_number?: string
}

export interface UpdateContractRequest {
  id: string
  first_party_id?: string // Updated: was client_id
  second_party_id?: string // Updated: was employer_id
  promoter_id?: string
  job_title?: string
  work_location?: string
  contract_start_date?: string
  contract_end_date?: string
  email?: string
  contract_number?: string
  pdf_url?: string
  contract_value?: number
  status?: string
}

// API Response Types
export interface ApiResponse<T = any> {
  message: string
  data?: T
  error?: string
  details?: string
  stack?: string
}

export interface CreateContractResponse {
  message: string
  contract: Database["public"]["Tables"]["contracts"]["Row"]
}

export interface ErrorResponse {
  message: string
  error: string
  details?: string
  stack?: string
}

// Database Types (re-exported for convenience)
export type ContractRow = Database["public"]["Tables"]["contracts"]["Row"]
export type ContractInsert = Database["public"]["Tables"]["contracts"]["Insert"]
export type ContractUpdate = Database["public"]["Tables"]["contracts"]["Update"]

export type PartyRow = Database["public"]["Tables"]["parties"]["Row"]
export type PromoterRow = Database["public"]["Tables"]["promoters"]["Row"]

// Validation Types
export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
}
