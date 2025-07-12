// Re-export types from database.types.ts
export type {
  Contract,
  Party,
  Promoter,
  Profile,
  User,
  AuditLog,
  Notification,
  MfaSettings,
  UserSession,
  AuthLog,
  SecurityEvent,
  ContractHistory,
  Permission,
  Role,
  ContractInsert,
  PartyInsert,
  PromoterInsert,
  ProfileInsert,
  ContractUpdate,
  PartyUpdate,
  PromoterUpdate,
  ProfileUpdate,
  Database,
  Json,
} from "@/types/database.types"

// Extended types with relations
import type { Contract, Party, Promoter } from "@/types/database.types"

export interface ContractWithRelations extends Contract {
  first_party?: Party
  second_party?: Party
  promoter?: Promoter | null
}

// Enhanced ContractDetail interface for detail views
export interface ContractDetail extends Contract {
  // Relations from the database query
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

  // Additional UI fields (not in database but might be computed)
  // These should be handled carefully to avoid TypeScript errors
}

export interface SimpleContract extends Contract {
  // This can be used for simpler contract views
  // For now, it will just be an alias for Contract
}

export interface PromoterProfile extends Promoter {}

export interface ContractRecord {
  id: string
  created_at?: string | null
  first_party_name_en?: string | null
  second_party_name_en?: string | null
  promoter_name_en?: string | null
  status?: string | null
  google_doc_url?: string | null
  error_details?: string | null
  contract_start_date?: string | null
  contract_end_date?: string | null
}

export interface BilingualPdfData {
  first_party_name_en?: string | null
  first_party_name_ar?: string | null
  first_party_crn?: string | null
  second_party_name_en?: string | null
  second_party_name_ar?: string | null
  second_party_crn?: string | null
  promoter_name_en?: string | null
  promoter_name_ar?: string | null
  id_card_number?: string | null
  promoter_id_card_url?: string | null
  promoter_passport_url?: string | null
  contract_start_date: string | null
  contract_end_date: string | null
  job_title?: string | null
  work_location?: string | null
  email: string | null
  contract_number?: string | null
  pdf_url?: string | null
}

export interface ActivityLog {
  id: string
  action: string
  description: string
  created_at: string
  user_id?: string
  metadata?: any
}

export interface PartyNote {
  id: string
  party_id: string
  user_id: string
  note: string
  created_at: string
}

export interface PartyTag {
  id: string
  party_id: string
  tag: string
  created_at: string
}

export interface PartyActivity {
  id: string
  party_id: string
  user_id?: string
  activity_type: string
  details: string
  created_at: string
}

export interface PartyFile {
  id: string
  party_id: string
  user_id: string
  file_name: string
  file_url: string
  created_at: string
}

export type ContractStatus =
  | "draft"
  | "pending"
  | "active"
  | "completed"
  | "cancelled"
  | "expired"
  | "failed"
  | "generating"
