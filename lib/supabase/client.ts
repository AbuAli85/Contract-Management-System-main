import { createBrowserClient } from "@supabase/ssr"
import { NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY } from "../env"

export function createClient() {
  // Return null if environment variables are missing
  if (!NEXT_PUBLIC_SUPABASE_URL || !NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn("Supabase environment variables not configured")
    return null
  }

  try {
    return createBrowserClient(NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY)
  } catch (error) {
    console.error("Failed to create Supabase client:", error)
    return null
  }
}
