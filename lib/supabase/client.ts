import { createBrowserClient } from "@supabase/ssr"
import { Database } from "@/types/supabase"

let supabaseClient: ReturnType<typeof createBrowserClient<Database>> | null = null

export function createClient() {
  // Return existing client if available
  if (supabaseClient) {
    return supabaseClient
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  // Return null if environment variables are missing
  if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Supabase environment variables not configured")
    return null
  }

  try {
    supabaseClient = createBrowserClient<Database>(supabaseUrl, supabaseAnonKey)
    return supabaseClient
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    return null
  }
}

// Export the singleton getter
export function getSupabaseClient() {
  if (!supabaseClient) {
    return createClient()
  }
  return supabaseClient
}