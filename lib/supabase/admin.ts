import { createClient, type SupabaseClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"
import { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, isEnvConfigured } from "@/lib/env"

let supabaseAdminInstance: SupabaseClient<Database> | null = null

export function getSupabaseAdmin(): SupabaseClient<Database> {
  // Return existing instance if available
  if (supabaseAdminInstance) {
    return supabaseAdminInstance
  }

  // Check if environment is configured
  if (!isEnvConfigured()) {
    throw new Error("Supabase environment variables are not configured")
  }

  // Create new instance
  supabaseAdminInstance = createClient<Database>(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  return supabaseAdminInstance
}

// Safe version that returns null if not configured
export function getSupabaseAdminSafe(): SupabaseClient<Database> | null {
  try {
    return getSupabaseAdmin()
  } catch (error) {
    console.warn("Supabase admin client not available:", error)
    return null
  }
}
