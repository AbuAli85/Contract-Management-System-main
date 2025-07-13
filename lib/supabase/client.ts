import { createBrowserClient } from "@supabase/ssr"
import { env } from "../env"

export function createClient() {
  // Return a mock client if environment variables are missing (for build time)
  if (!env.NEXT_PUBLIC_SUPABASE_URL || !env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.warn("Supabase environment variables not configured")
    return null
  }

  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}
