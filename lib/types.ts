export interface Party {
  id: string
  name_en: string
  name_ar: string
  crn: string
  type?: "Employer" | "Client" | "Generic" | null
  role?: string | null
  cr_expiry_date?: string | null
  contact_person?: string | null
  contact_email?: string | null
  contact_phone?: string | null
  address_en?: string | null
  address_ar?: string | null
  tax_number?: string | null
  license_number?: string | null
  license_expiry_date?: string | null
  status?: string | null
  notes?: string | null
  created_at?: string | null
  owner_id?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
}

export interface Promoter {
  id: string
  name_en: string
  name_ar: string
  id_card_number: string
  id_card_url?: string | null
  passport_url?: string | null
  status?: string | null
  id_card_expiry_date?: string | null
  passport_expiry_date?: string | null
  notify_days_before_id_expiry?: number | null
  notify_days_before_passport_expiry?: number | null
  notes?: string | null
  created_at?: string | null
  active_contracts_count?: number
  employer_id?: string | null
  outsourced_to_id?: string | null
  job_title?: string | null
  work_location?: string | null
  contract_valid_until?: string | null
  email?: string | null
  phone?: string | null
  national_id?: string | null
  crn?: string | null
  address?: string | null
  contact_person?: string | null
  website?: string | null
  city?: string | null
  country?: string | null
  profile_picture_url?: string | null
  company?: string | null
  name?: string
  state?: string
  zip_code?: string
  bio?: string
}

export interface Contract {
  id: string
  created_at: string
  updated_at?: string | null
  contract_number?: string | null
  is_current?: boolean | null
  pdf_url?: string | null
  google_doc_url?: string | null
  error_details?: string | null
  user_id?: string | null
  first_party_id: string
  second_party_id: string
  promoter_id: string
  contract_valid_from?: string | null
  contract_valid_until?: string | null
  contract_start_date?: string | null
  contract_end_date?: string | null
  contract_value?: number | null
  job_title?: string | null
  status?: string | null
  work_location?: string | null
  email?: string | null
  contract_name?: string | null
  party_a?: string | null
  party_b?: string | null
  contract_type?: string | null
  terms?: string | null
  department?: string | null
  currency?: string | null
  end_date?: string | null
  duration?: string | null
  parties?: Party[] | null
  party?: Party | null
  promoter?: Promoter | null
  promoters?: Promoter[] | null
  first_party?: Party | null
  second_party?: Party | null
  employer?: Party | null
  client?: Party | null
  title?: string | null;
  start_date?: string | null;
  total_value?: number | null;
  promoter_name_ar?: string | null;
  promoter_name_en?: string | null;
  first_party_name_en?: string | null;
  first_party_name_ar?: string | null;
  second_party_name_en?: string | null;
  second_party_name_ar?: string | null;
  id_card_number?: string | null;
  salary?: number | null;
  employer_id?: string | null;
  client_id?: string | null;
}

export interface ContractDetail extends Contract {
  // This can be used to enforce non-optional properties for detail views
  // For now, it will just be an alias for Contract
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
  id: string;
  action: string;
  description: string;
  created_at: string;
  user_id?: string;
  metadata?: any;
}

export interface PartyNote {
  id: string;
  party_id: string;
  user_id: string;
  note: string;
  created_at: string;
}

export interface PartyTag {
  id: string;
  party_id: string;
  tag: string;
  created_at: string;
}

export interface PartyActivity {
  id: string;
  party_id: string;
  user_id?: string;
  activity_type: string;
  details: string;
  created_at: string;
}

export interface PartyFile {
  id: string;
  party_id: string;
  user_id: string;
  file_name: string;
  file_url: string;
  created_at: string;
}

export type ContractStatus = "draft" | "pending" | "active" | "completed" | "cancelled" | "expired" | "failed" | "generating";
