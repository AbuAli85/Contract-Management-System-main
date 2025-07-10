import { createBrowserClient } from "@supabase/ssr"
import type { Database } from "@/types/supabase"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Supabase URL or Anon Key is missing. Ensure NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY are set.')
  }

  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
  )
}