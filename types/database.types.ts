export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      contracts: {
        Row: {
          id: string
          created_at: string
          updated_at?: string | null
          contract_number?: string | null
          is_current?: boolean | null
          pdf_url?: string | null
          user_id?: string | null
          first_party_id: string
          second_party_id: string
          promoter_id: string | null
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
          metadata?: Json | null
        }
        Insert: {
          id?: string
          created_at?: string
          updated_at?: string | null
          contract_number?: string | null
          is_current?: boolean | null
          pdf_url?: string | null
          user_id?: string | null
          first_party_id: string
          second_party_id: string
          promoter_id?: string | null
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
          metadata?: Json | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string | null
          contract_number?: string | null
          is_current?: boolean | null
          pdf_url?: string | null
          user_id?: string | null
          first_party_id?: string
          second_party_id?: string
          promoter_id?: string | null
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
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "contracts_first_party_id_fkey"
            columns: ["first_party_id"]
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_promoter_id_fkey"
            columns: ["promoter_id"]
            referencedRelation: "promoters"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_second_party_id_fkey"
            columns: ["second_party_id"]
            referencedRelation: "parties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_user_id_fkey"
            columns: ["user_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      parties: {
        Row: {
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
        }
        Insert: {
          id?: string
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
        }
        Update: {
          id?: string
          name_en?: string
          name_ar?: string
          crn?: string
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
        }
        Relationships: []
      }
      promoters: {
        Row: {
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
          employer_id?: string | null
          outsourced_to_id?: string | null
          job_title?: string | null
          work_location?: string | null
          contract_valid_until?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          passport_number?: string | null
          updated_at?: string | null
        }
        Insert: {
          id?: string
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
          employer_id?: string | null
          outsourced_to_id?: string | null
          job_title?: string | null
          work_location?: string | null
          contract_valid_until?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          passport_number?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          name_en?: string
          name_ar?: string
          id_card_number?: string
          id_card_url?: string | null
          passport_url?: string | null
          status?: string | null
          id_card_expiry_date?: string | null
          passport_expiry_date?: string | null
          notify_days_before_id_expiry?: number | null
          notify_days_before_passport_expiry?: number | null
          notes?: string | null
          created_at?: string | null
          employer_id?: string | null
          outsourced_to_id?: string | null
          job_title?: string | null
          work_location?: string | null
          contract_valid_until?: string | null
          email?: string | null
          phone?: string | null
          address?: string | null
          passport_number?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      audit_logs: {
        Row: {
          id: string
          action: string
          entity_type: string
          entity_id: string
          details?: Json | null
          user_id?: string | null
          created_at: string
          table_name?: string | null
          record_id?: string | null
          event_type?: string | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json | null
          success?: boolean | null
        }
        Insert: {
          id?: string
          action: string
          entity_type: string
          entity_id: string
          details?: Json | null
          user_id?: string | null
          created_at?: string
          table_name?: string | null
          record_id?: string | null
          event_type?: string | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json | null
          success?: boolean | null
        }
        Update: {
          id?: string
          action?: string
          entity_type?: string
          entity_id?: string
          details?: Json | null
          user_id?: string | null
          created_at?: string
          table_name?: string | null
          record_id?: string | null
          event_type?: string | null
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json | null
          success?: boolean | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          id: string
          type: string
          message: string
          created_at: string
          is_read: boolean
          user_email?: string | null
          related_contract_id?: string | null
          user_id?: string | null
          read?: boolean | null
        }
        Insert: {
          id?: string
          type: string
          message: string
          created_at?: string
          is_read?: boolean
          user_email?: string | null
          related_contract_id?: string | null
          user_id?: string | null
          read?: boolean | null
        }
        Update: {
          id?: string
          type?: string
          message?: string
          created_at?: string
          is_read?: boolean
          user_email?: string | null
          related_contract_id?: string | null
          user_id?: string | null
          read?: boolean | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          full_name?: string | null
          role?: string | null
          created_at?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean | null
          failed_attempts?: number | null
          locked_at?: string | null
          last_sign_in_at?: string | null
          sign_in_count?: number | null
          email_verified?: boolean | null
        }
        Insert: {
          id: string
          full_name?: string | null
          role?: string | null
          created_at?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean | null
          failed_attempts?: number | null
          locked_at?: string | null
          last_sign_in_at?: string | null
          sign_in_count?: number | null
          email_verified?: boolean | null
        }
        Update: {
          id?: string
          full_name?: string | null
          role?: string | null
          created_at?: string | null
          phone?: string | null
          avatar_url?: string | null
          is_active?: boolean | null
          failed_attempts?: number | null
          locked_at?: string | null
          last_sign_in_at?: string | null
          sign_in_count?: number | null
          email_verified?: boolean | null
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          email: string
          role: string
          created_at: string
          profile_data?: Json | null
        }
        Insert: {
          id?: string
          email: string
          role: string
          created_at?: string
          profile_data?: Json | null
        }
        Update: {
          id?: string
          email?: string
          role?: string
          created_at?: string
          profile_data?: Json | null
        }
        Relationships: []
      }
      app_users: {
        Row: {
          id: string
          email: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          email: string
          role: string
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: string
          created_at?: string
        }
        Relationships: []
      }
      party_files: {
        Row: {
          id: string
          party_id: string
          file_name: string
          file_url: string
          user_id: string
          created_at: string
        }
        Insert: {
          id?: string
          party_id: string
          file_name: string
          file_url: string
          user_id: string
          created_at?: string
        }
        Update: {
          id?: string
          party_id?: string
          file_name?: string
          file_url?: string
          user_id?: string
          created_at?: string
        }
        Relationships: []
      }
      party_notes: {
        Row: {
          id: string
          party_id: string
          user_id: string
          note: string
          created_at: string
        }
        Insert: {
          id?: string
          party_id: string
          user_id: string
          note: string
          created_at?: string
        }
        Update: {
          id?: string
          party_id?: string
          user_id?: string
          note?: string
          created_at?: string
        }
        Relationships: []
      }
      party_tags: {
        Row: {
          id: string
          party_id: string
          tag: string
          created_at: string
        }
        Insert: {
          id?: string
          party_id: string
          tag: string
          created_at?: string
        }
        Update: {
          id?: string
          party_id?: string
          tag?: string
          created_at?: string
        }
        Relationships: []
      }
      party_activities: {
        Row: {
          id: string
          party_id: string
          activity_type: string
          details: string
          created_at: string
          user_id?: string | null
        }
        Insert: {
          id?: string
          party_id: string
          activity_type: string
          details: string
          created_at?: string
          user_id?: string | null
        }
        Update: {
          id?: string
          party_id?: string
          activity_type?: string
          details?: string
          created_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      mfa_settings: {
        Row: {
          id: string
          user_id: string
          totp_secret?: string | null
          totp_enabled: boolean
          backup_codes?: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          totp_secret?: string | null
          totp_enabled?: boolean
          backup_codes?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          totp_secret?: string | null
          totp_enabled?: boolean
          backup_codes?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          id: string
          user_id: string
          refresh_token: string
          expires_at: string
          last_activity_at?: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          refresh_token: string
          expires_at: string
          last_activity_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          refresh_token?: string
          expires_at?: string
          last_activity_at?: string | null
          created_at?: string
        }
        Relationships: []
      }
      auth_logs: {
        Row: {
          id: string
          user_id?: string | null
          event_type: string
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json | null
          success: boolean
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          event_type: string
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json | null
          success?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          event_type?: string
          ip_address?: string | null
          user_agent?: string | null
          metadata?: Json | null
          success?: boolean
          created_at?: string
        }
        Relationships: []
      }
      security_events: {
        Row: {
          id: string
          event_type: string
          severity: string
          description: string
          metadata?: Json | null
          ip_address?: string | null
          user_id?: string | null
          created_at: string
        }
        Insert: {
          id?: string
          event_type: string
          severity: string
          description: string
          metadata?: Json | null
          ip_address?: string | null
          user_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          event_type?: string
          severity?: string
          description?: string
          metadata?: Json | null
          ip_address?: string | null
          user_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      contract_history: {
        Row: {
          id: string
          contract_id: string
          action: string
          changes?: Json | null
          performed_by?: string | null
          performed_at: string
        }
        Insert: {
          id?: string
          contract_id: string
          action: string
          changes?: Json | null
          performed_by?: string | null
          performed_at?: string
        }
        Update: {
          id?: string
          contract_id?: string
          action?: string
          changes?: Json | null
          performed_by?: string | null
          performed_at?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          id: string
          name: string
          description?: string | null
          resource: string
          action: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          resource: string
          action: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          resource?: string
          action?: string
          created_at?: string
        }
        Relationships: []
      }
      roles: {
        Row: {
          id: string
          name: string
          description?: string | null
          permissions?: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          permissions?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          permissions?: Json | null
          created_at?: string
        }
        Relationships: []
      }
      email_verification_tokens: {
        Row: {
          id: string
          user_id: string
          token: string
          expires_at: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          token: string
          expires_at: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          token?: string
          expires_at?: string
          created_at?: string
        }
        Relationships: []
      }
      webhook_logs: {
        Row: {
          id: string
          webhook_type: string
          payload?: Json | null
          response?: Json | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          webhook_type: string
          payload?: Json | null
          response?: Json | null
          status: string
          created_at?: string
        }
        Update: {
          id?: string
          webhook_type?: string
          payload?: Json | null
          response?: Json | null
          status?: string
          created_at?: string
        }
        Relationships: []
      }
    }
    Views: {}
    Functions: {
      get_dashboard_analytics: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      files_per_month: {
        Args: Record<PropertyKey, never>
        Returns: Json
      }
      increment: {
        Args: { x: number; row_id: string }
        Returns: number
      }
    }
    Enums: {}
    CompositeTypes: {}
  }
}

// Helper types
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"]
export type TablesInsert<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"]
export type TablesUpdate<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"]
export type Enums<T extends keyof Database["public"]["Enums"]> = Database["public"]["Enums"][T]

// Convenience types
export type Contract = Tables<"contracts">
export type Party = Tables<"parties">
export type Promoter = Tables<"promoters">
export type Profile = Tables<"profiles">
export type User = Tables<"users">
export type AuditLog = Tables<"audit_logs">
export type Notification = Tables<"notifications">
export type MfaSettings = Tables<"mfa_settings">
export type UserSession = Tables<"user_sessions">
export type AuthLog = Tables<"auth_logs">
export type SecurityEvent = Tables<"security_events">
export type ContractHistory = Tables<"contract_history">
export type Permission = Tables<"permissions">
export type Role = Tables<"roles">

// Insert types
export type ContractInsert = TablesInsert<"contracts">
export type PartyInsert = TablesInsert<"parties">
export type PromoterInsert = TablesInsert<"promoters">
export type ProfileInsert = TablesInsert<"profiles">

// Update types
export type ContractUpdate = TablesUpdate<"contracts">
export type PartyUpdate = TablesUpdate<"parties">
export type PromoterUpdate = TablesUpdate<"promoters">
export type ProfileUpdate = TablesUpdate<"profiles">
