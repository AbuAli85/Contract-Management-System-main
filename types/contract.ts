export interface ContractDetail {
  id: string
  status?: string
  created_at?: string
  updated_at?: string
  contract_start_date?: string
  contract_end_date?: string
  job_title?: string
  work_location?: string
  email?: string
  contract_number?: string
  id_card_number?: string
  first_party_id?: string
  second_party_id?: string
  promoter_id?: string
  first_party_name_en?: string
  first_party_name_ar?: string
  second_party_name_en?: string
  second_party_name_ar?: string
  google_doc_url?: string
  pdf_url?: string
  error_details?: string
  salary?: number
  currency?: string
  contract_type?: string
  department?: string
  // New structure from query with relationships
  first_party?: {
    id: string
    name_en: string
    name_ar: string
    crn: string
    type?: "Employer" | "Client" | "Generic" | null
  } | null
  second_party?: {
    id: string
    name_en: string
    name_ar: string
    crn: string
    type?: "Employer" | "Client" | "Generic" | null
  } | null
  promoters?: {
    id: string
    name_en: string
    name_ar: string
    id_card_number: string
    id_card_url?: string | null
    passport_url?: string | null
    status?: string | null
  } | null
  // Legacy fields for backward compatibility
  employer?: Party
  client?: Party
}

export interface Party {
  id?: string
  name_en: string
  name_ar?: string
  crn?: string
  address?: string
  phone?: string
  email?: string
}

export interface Promoter {
  id: string
  name_en: string
  name_ar?: string
  id_card_number?: string
  email?: string
  phone?: string
}

export interface ActivityLog {
  id: string
  action: string
  description: string
  created_at: string
  user_id?: string
  metadata?: any
}
