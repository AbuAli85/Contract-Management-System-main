// lib/supabaseClient.ts
import { createClient } from "@supabase/supabase-js"
import type { Database } from "@/types/supabase"

/** 
 * Single shared Supabase client instance.
 * Never recreate this on every render.
 */
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error("Supabase URL is required. Please set NEXT_PUBLIC_SUPABASE_URL or SUPABASE_URL.")
}
if (!supabaseAnonKey) {
  throw new Error("Supabase Anon Key is required. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY or SUPABASE_ANON_KEY.")
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)
