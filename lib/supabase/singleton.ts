import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"
import { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, isEnvConfigured } from "@/lib/env"

let supabaseBrowserInstance: ReturnType<typeof createBrowserClient<Database>> | null = null

export function getSupabaseBrowserClient() {
  if (supabaseBrowserInstance) {
    return supabaseBrowserInstance
  }

  if (!isEnvConfigured()) {
    throw new Error("Supabase environment variables are not configured")
  }

  supabaseBrowserInstance = createBrowserClient<Database>(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)

  return supabaseBrowserInstance
}

// Safe version that returns null if not configured
export function getSupabaseBrowserClientSafe() {
  try {
    return getSupabaseBrowserClient()
  } catch (error) {
    console.warn("Supabase browser client not available:", error)
    return null
  }
}
